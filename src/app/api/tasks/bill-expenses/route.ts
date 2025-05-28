import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bill expense ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bill expense ID is required' }, { status: 400 });
    }

    // Fetch the bill expense
    const { data: billExpensesData, error: billExpensesError } = await supabase
      .from('bill_expenses')
      .select('data')
      .eq('id', id)
      .single();

    if (billExpensesError) {
      console.error('Error fetching bill expenses:', billExpensesError);
      return NextResponse.json({ 
        error: 'Failed to fetch bill expenses',
        details: billExpensesError.message
      }, { status: 500 });
    }

    const items = billExpensesData?.data || [];
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action, item } = await request.json();

    // Fetch current items
    const { data: currentData, error: fetchError } = await supabase
      .from('bill_expenses')
      .select('data')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching current data:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch current data',
        details: fetchError.message
      }, { status: 500 });
    }

    const currentItems = currentData?.data || [];
    let updatedItems;

    if (action === 'add' && item) {
      const mappedItem = {
        description: item.description,
        category: item.category,
        bill_date: item.billDate ? new Date(item.billDate).toISOString().split('T')[0] : null,
        quantity: item.quantity.toString(),
        unit_price: item.unitPrice.toString(),
        total: (parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString())).toString()
      };
      updatedItems = [...currentItems, mappedItem];
    } else {
      return NextResponse.json({ error: 'Invalid action or missing data' }, { status: 400 });
    }

    // Update the bill expenses
    const { error: updateError } = await supabase
      .from('bill_expenses')
      .update({ data: updatedItems })
      .eq('id', id)
      .single();

    if (updateError) {
      console.error('Error updating bill expenses:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update bill expenses',
        details: updateError.message
      }, { status: 500 });
    }

    // Map the data back to the client format
    const clientItems = updatedItems.map((item, index) => ({
      id: index.toString(),
      description: item.description,
      category: item.category,
      billDate: item.bill_date ? new Date(item.bill_date) : undefined,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unit_price) || 0,
      total: parseFloat(item.total) || 0
    }));

    return NextResponse.json({ items: clientItems });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
