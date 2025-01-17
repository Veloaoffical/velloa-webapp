import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateCustomId } from '@/lib/utils/generate-id';

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface TenantRequestWithProfile {
  id: string
  subject: string
  description: string
  priority: string
  status: string
  task_type: string
  request_type: string
  request_specific: string
  start_date: string | null
  due_date: string | null
  assignees: string | null
  tenant_id: string | null
  notify_assignee: boolean
  notify_tenant: boolean
  permit_enter: boolean
  role: string
  created_by: string
  created_at: string
  profiles: Profile
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .eq('role', 'tenant_request')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the creator's name and dates
    const processedRequests = (requests as unknown as TenantRequestWithProfile[])?.map(request => ({
      ...request,
      created_by: request.profiles ? 
        `${request.profiles.first_name || ''} ${request.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(request.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })) || [];

    return NextResponse.json(processedRequests);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received tenant request data:', JSON.stringify(data, null, 2));

    // Generate a custom ID for the request
    const nano_id = generateCustomId();

    // Create the tenant request
    const { data: requestData, error: requestError } = await supabase
      .from('maintenance_requests')
      .insert([{
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
        task_type: data.task_type,
        request_specific: data.request_specific,
        start_date: data.start_date,
        due_date: data.due_date,
        assignees: data.assignees,
        notify_assignee: data.notify_assignee,
        notify_tenant: data.notify_tenant,
        permit_enter: data.permit_enter,
        request_type: data.request_type,
        tenant_id: data.tenant_id,
        role: 'tenant_request',
        created_by: user.id,
        nano_id: nano_id
      }])
      .select(`
        *,
        profiles!created_by (
          first_name,
          last_name
        )
      `)
      .single();

    if (requestError) {
      console.error('Error creating tenant request:', {
        error: requestError,
        message: requestError.message,
        details: requestError.details,
        hint: requestError.hint,
        code: requestError.code,
        data: data
      });
      return NextResponse.json({ 
        error: 'Failed to create tenant request',
        details: requestError.message,
        code: requestError.code,
        hint: requestError.hint,
        data: data
      }, { status: 500 });
    }

    // Format the creator's name and dates for the response
    const processedRequest = requestData ? {
      ...requestData,
      created_by: requestData.profiles ? 
        `${requestData.profiles.first_name || ''} ${requestData.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(requestData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } : null;

    // Create a notification subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('notification_subjects')
      .insert([{
        id: crypto.randomUUID(),
        table_name: 'maintenance_requests',
        row_id: requestData.id
      }])
      .select()
      .single();

    if (subjectError) {
      console.error('Error creating notification subject:', subjectError);
      // Continue anyway as the request was created successfully
    } else {
      // Create notifications array to handle multiple notifications
      const notifications = [];

      // Add assignee notification if there's an assignee and notify_assignee is true
      if (data.assignees && data.notify_assignee) {
        notifications.push({
          id: crypto.randomUUID(),
          recipient_id: data.assignees,
          subject_id: subjectData.id,
          type: 'tenant_request',
          message: 'A new tenant request has been assigned to you',
          read: false
        });
      }

      // Add tenant notification if there's a tenant and notify_tenant is true
      if (data.tenant_id && data.notify_tenant) {
        notifications.push({
          id: crypto.randomUUID(),
          people_id: data.tenant_id,
          subject_id: subjectData.id,
          type: 'tenant_request',
          message: 'Your maintenance request has been created',
          read: false
        });
      }

      // Insert all notifications if there are any
      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notification')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
          // Continue anyway as the request was created successfully
        }
      }
    }

    return NextResponse.json(processedRequest, { status: 201 });
  } catch (error) {
    console.error('Error in tenant request creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 