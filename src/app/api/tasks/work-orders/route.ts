import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { generateCustomId } from '@/lib/utils/generate-id';

interface Profile {
  first_name: string | null
  last_name: string | null
}

interface PartsLaborItem {
  bill_date: string;
  category: string;
  quantity: string;
  unit_price: string;
  description: string;
  vendor: string;
  frequency: string | null;
  due_date: string;
  memo: string;
  nano_id: string;
  property: string;
  units: string;
  start_date: string | null;
  property_id: string;
  unit_id: string;
  repeat_infinite: boolean | null;
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
  property_id: string | null
  unit_id: string | null
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
    let parts_labour_id: string | null = null;

    // First create bill expenses if they exist
    if (data.billExpenses && data.billExpenses.length > 0) {
      console.log('Bill Expenses before mapping:', JSON.stringify(data.billExpenses, null, 2));
      console.log('Vendor ID:', data.vendors);
      console.log('Property ID:', data.propertyId);
      console.log('Unit ID:', data.unitId);
      
      const mappedData = data.billExpenses.map((item: PartsLaborItem) => {
        console.log('Raw item:', JSON.stringify(item, null, 2));
        
        // Convert quantity and unit_price to numbers, defaulting to 0 if invalid
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        
        console.log('Conversion details:', {
          quantity: {
            original: item.quantity,
            type: typeof item.quantity,
            converted: quantity
          },
          unitPrice: {
            original: item.unit_price,
            type: typeof item.unit_price,
            converted: unitPrice
          }
        });

        const total = quantity * unitPrice;
        console.log('Calculation:', {
          quantity,
          unitPrice,
          total,
          calculation: `${quantity} * ${unitPrice} = ${total}`
        });
        
        const result = {
          bill_date: item.bill_date,
          category: item.category,
          quantity: quantity.toString(),
          unit_price: unitPrice.toString(),
          description: item.description,
          total: total
        };

        console.log('Final mapped item:', JSON.stringify(result, null, 2));
        return result;
      });

      console.log('Final mapped data array:', JSON.stringify(mappedData, null, 2));

      const billExpensePayload = {
        id: crypto.randomUUID(),
        vendor: data.vendors,
        frequency: data.frequency || null,
        due_date: data.due_date || null,
        memo: data.description || '',
        nano_id: generateCustomId().slice(0, 9).toUpperCase(),
        property: data.billExpenses[0].property || null,
        units: data.billExpenses[0].units || null,
        start_date: data.start_date || null,
        repeat_infinite: data.repeat_infinite || false,
        data: mappedData
      };

      console.log('Bill expense payload:', JSON.stringify(billExpensePayload, null, 2));

      // Create a single bill expense for all items
      const { data: billExpensesData, error: billExpensesError } = await supabase
        .from('bill_expenses')
        .insert(billExpensePayload)
        .select()
        .single();

      if (billExpensesError) {
        console.error('Error creating bill expenses:', billExpensesError);
        console.error('Failed payload:', JSON.stringify(billExpensePayload, null, 2));
        return NextResponse.json({ 
          error: 'Failed to create bill expenses',
          details: billExpensesError.message,
          code: billExpensesError.code,
          hint: billExpensesError.hint,
          payload: billExpensePayload
        }, { status: 500 });
      }

      parts_labour_id = billExpensesData.id;
    }

    // Then create the work order with the parts_labour reference
    const { data: workOrderData, error: workOrderError } = await supabase
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
        vendor_id: data.vendors,
        role: 'work_order',
        created_by: user.id,
        nano_id: nano_id,
        parts_labour: parts_labour_id,
        property_id: data.property_id,
        unit_id: data.unit_id
      }])
      .select()
      .single();

    if (workOrderError) {
      console.error('Error creating work order:', {
        error: workOrderError,
        message: workOrderError.message,
        details: workOrderError.details,
        hint: workOrderError.hint,
        code: workOrderError.code,
        data: data
      });
      return NextResponse.json({ 
        error: 'Failed to create work order',
        details: workOrderError.message,
        code: workOrderError.code,
        hint: workOrderError.hint,
        data: data
      }, { status: 500 });
    }

    const processedRequest = workOrderData ? {
      ...workOrderData,
      created_by: workOrderData.profiles ? 
        `${workOrderData.profiles.first_name || ''} ${workOrderData.profiles.last_name || ''}`.trim() :
        'Unknown User',
      created_at: new Date(workOrderData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } : null;

    // Create notification subject
    const { data: subjectData, error: subjectError } = await supabase
      .from('notification_subjects')
      .insert([{
        id: crypto.randomUUID(),
        table_name: 'maintenance_requests',
        row_id: workOrderData.id
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

      if (data.vendors && data.notify_vendor) {
        notifications.push({
          id: crypto.randomUUID(),
          people_id: data.vendors,
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