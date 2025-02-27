import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the authenticated user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError) {
      console.error('Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // Get properties for the company
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, name, address_line_1, address_line_2, city, state, zip, country')
      .eq('company_id', companyMember.company_id)
      .order('name');

    if (propertiesError) {
      console.error('Properties error:', propertiesError);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    // Format the address for display
    const formattedProperties = properties.map(p => ({
      id: p.id,
      name: p.name,
      address: [
        p.address_line_1,
        p.address_line_2,
        [p.city, p.state, p.zip].filter(Boolean).join(', ')
      ].filter(Boolean).join(', ')
    }));

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 