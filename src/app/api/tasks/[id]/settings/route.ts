import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface MaintenanceRequest {
  id: string;
  description: string;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  unit_id: string | null;
  created_by: string | null;
  property_id: string | null;
  subject: string | null;
  priority: string | null;
  assignees: string | null;
  tenant_id: string | null;
  request_type: string | null;
  task_type: string | null;
  request_specific: string | null;
  due_date: string | null;
  notify_assignee: boolean | null;
  notify_tenant: boolean | null;
  permit_enter: boolean | null;
  permit_owner: boolean | null;
  Recurring_frequency: string | null;
  start_date: string | null;
  parts_labour: string | null;
  role: string | null;
  nano_id: string | null;
  repeat_infinite: boolean | null;
  notify_vendor: boolean | null;
  vendor_id: string | null;
  owner_id: string | null;
}

type Params = { id: string }

export async function PATCH(
  request: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { params } = context;
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: Partial<MaintenanceRequest> = {
      ...body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', (await params).id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { params } = context;
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching task data for ID:', (await params).id);

    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        id,
        description,
        status,
        subject,
        priority,
        task_type,
        Recurring_frequency,
        start_date,
        due_date,
        repeat_infinite,
        property_id,
        unit_id,
        assignees,
        tenant_id,
        request_type,
        request_specific,
        notify_assignee,
        notify_tenant,
        permit_enter,
        permit_owner,
        role,
        vendor_id,
        notify_vendor,
        parts_labour,
        created_at,
        updated_at,
        created_by,
        nano_id,
        owner_id
      `)
      .eq('id', (await params).id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    console.log('Task data retrieved:', {
      id: data.id,
      role: data.role,
      owner_id: data.owner_id,
      property_id: data.property_id,
      unit_id: data.unit_id
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 