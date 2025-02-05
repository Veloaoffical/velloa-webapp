import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface BillExpenseItem {
  description: string;
  category: string;
  bill_date: string | null;
  quantity: string | number;
  unit_price: string | number;
  total: string | number;
}

interface BillExpense {
  id: string;
  data: BillExpenseItem[] | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const partsLabourId = searchParams.get('id');
  console.log('GET request received for ID:', partsLabourId);

  if (!partsLabourId) {
    console.log('No ID provided in request');
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }

  const supabase = await createClient();
  
  const { data: billExpenses, error } = await supabase
    .from('bill_expenses')
    .select('id, data')
    .eq('id', partsLabourId)
    .single<BillExpense>();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Raw bill expenses data:', billExpenses);

  if (billExpenses?.data) {
    const mappedItems = billExpenses.data.map((item) => ({
      id: crypto.randomUUID(),
      description: item.description,
      category: item.category,
      billDate: item.bill_date ? new Date(item.bill_date) : undefined,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: typeof item.total === 'string' ? parseFloat(item.total) : item.total
    }));

    console.log('Mapped items:', mappedItems);
    return NextResponse.json({ items: mappedItems });
  }

  console.log('No items found, returning empty array');
  return NextResponse.json({ items: [] });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, action, item, itemId } = body;
  console.log('PUT request received:', { id, action, item, itemId });

  if (!id) {
    console.log('No ID provided in request body');
    return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
  }

  const supabase = await createClient();
  
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('bill_expenses')
      .select('data')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current data:', fetchError);
      throw fetchError;
    }

    console.log('Current data:', currentData);

    let updatedData;
    if (action === 'add') {
      if (!item) {
        return NextResponse.json({ error: 'No item provided for add action' }, { status: 400 });
      }
      updatedData = [...(currentData?.data || []), {
        description: item.description,
        category: item.category,
        bill_date: item.billDate ? item.billDate.toISOString() : null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total
      }];
    } else if (action === 'remove') {
      if (typeof itemId !== 'number' && typeof itemId !== 'string') {
        return NextResponse.json({ error: 'Invalid itemId for remove action' }, { status: 400 });
      }
      const currentItems = currentData?.data || [];
      if (itemId >= currentItems.length) {
        return NextResponse.json({ error: 'Item index out of bounds' }, { status: 400 });
      }
      updatedData = [...currentItems];
      updatedData.splice(Number(itemId), 1);
    } else {
      console.log('Invalid action provided:', action);
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log('Updated data to save:', updatedData);

    const { error: updateError } = await supabase
      .from('bill_expenses')
      .update({ data: updatedData })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating data:', updateError);
      throw updateError;
    }

    // Return the updated items in the same format as GET
    const mappedItems = updatedData.map((item: BillExpenseItem) => ({
      id: crypto.randomUUID(),
      description: item.description,
      category: item.category,
      billDate: item.bill_date ? new Date(item.bill_date) : undefined,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: typeof item.total === 'string' ? parseFloat(item.total) : item.total
    }));

    return NextResponse.json({ items: mappedItems });
  } catch (error: unknown) {
    console.error('Error in PUT request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 