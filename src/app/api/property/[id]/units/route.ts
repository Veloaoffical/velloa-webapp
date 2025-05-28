import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server'


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get units for the specified property
    const { data: units, error } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', id)
      .order('unit_name')

    if (error) {
      console.error('Error fetching units:', error)
      return NextResponse.json(
        { error: 'Failed to fetch units' },
        { status: 500 }
      )
    }

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error in units route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
