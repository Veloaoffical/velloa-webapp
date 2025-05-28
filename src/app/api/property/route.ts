import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError }, { status: 401 });
    }
    
    // Get the authenticated user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError) {
      console.error('Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company', details: companyError }, { status: 403 });
    }

    // Get properties for the company, joining property_settings for address fields
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        property_settings (
          property_address
        )
      `)
      .eq('company_id', companyMember.company_id)
      .order('name');

    if (propertiesError) {
      console.error('Properties error:', propertiesError);
      return NextResponse.json({ error: 'Failed to fetch properties', details: propertiesError }, { status: 500 });
    }

    // Format the address for display using property_settings.property_address
    const formattedProperties = properties.map(p => {
      const settings = Array.isArray(p.property_settings)
        ? p.property_settings[0] || {}
        : p.property_settings || {};
      const addr = settings.property_address || {};
      return {
        id: p.id,
        name: p.name,
        address: [
          [addr.street_number, addr.street].filter(Boolean).join(' '),
          [addr.city, addr.province, addr.postal_code].filter(Boolean).join(', '),
          addr.country
        ].filter(Boolean).join(', ')
      };
    });

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 