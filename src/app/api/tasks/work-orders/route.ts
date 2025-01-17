import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateCustomId } from '@/lib/utils/generate-id';

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface WorkOrderWithProfile {
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
  vendor_id: string | null
  notify_assignee: boolean
  notify_vendor: boolean
  permit_enter: boolean
  role: string
  created_by: string
  created_at: string
  profiles: Profile
}

export async function GET() {
  try {
    const supabase = await createClient();

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
      .eq('role', 'work_order')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const processedRequests = (requests as unknown as WorkOrderWithProfile[])?.map(request => ({
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received work order data:', JSON.stringify(data, null, 2));

    const nano_id = generateCustomId();

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
        notify_vendor: data.notify_vendor,
        permit_enter: data.permit_enter,
        request_type: data.request_type,
        vendor_id: data.vendor_id,
        role: 'work_order',
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
      console.error('Error creating work order:', {
        error: requestError,
        message: requestError.message,
        details: requestError.details,
        hint: requestError.hint,
        code: requestError.code,
        data: data
      });
      return NextResponse.json({ 
        error: 'Failed to create work order',
        details: requestError.message,
        code: requestError.code,
        hint: requestError.hint,
        data: data
      }, { status: 500 });
    }

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
    } else {
      const notifications = [];

      if (data.assignees && data.notify_assignee) {
        notifications.push({
          id: crypto.randomUUID(),
          recipient_id: data.assignees,
          subject_id: subjectData.id,
          type: 'work_order',
          message: 'A new work order has been assigned to you',
          read: false
        });
      }

      if (data.vendor_id && data.notify_vendor) {
        notifications.push({
          id: crypto.randomUUID(),
          people_id: data.vendor_id,
          subject_id: subjectData.id,
          type: 'work_order',
          message: 'A new work order has been assigned to you',
          read: false
        });
      }

      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notification')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating notifications:', notificationError);
        }
      }
    }

    return NextResponse.json(processedRequest, { status: 201 });
  } catch (error) {
    console.error('Error in work order creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 