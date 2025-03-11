import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Property {
  name: string;
}

interface Unit {
  unit_name: string;
  properties: Property;
}

interface ServiceAddress {
  type: string;
  property_ids: string[];
}

interface Vendor {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  company: string;
  role: string;
  unit_id: string | null;
  units: Unit | null;
  service_address: ServiceAddress | null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { propertyIds } = await request.json();

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json({ error: 'Property IDs are required' }, { status: 400 });
    }

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 });
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company', details: companyError?.message }, { status: 403 });
    }

    // Fetch vendors from the people table
    const { data: vendors, error: vendorsError } = await supabase
      .from('people')
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        role,
        company,
        unit_id,
        service_address,
        units (
          unit_name,
          properties (
            name
          )
        )
      `)
      .eq('company_id', companyMember.company_id)
      .eq('role', 'vendor')
      .returns<Vendor[]>();

    if (vendorsError) {
      console.error('Error fetching vendors:', vendorsError);
      return NextResponse.json({ error: 'Failed to fetch vendors', details: vendorsError.message }, { status: 500 });
    }

    // Filter vendors based on property IDs
    const filteredVendors = vendors.filter(vendor => {
      // If vendor has service_address and type is 'all', include them
      if (vendor.service_address?.type === 'all') {
        return true;
      }
      
      // If vendor has specific properties in their service_address, check for overlap
      if (vendor.service_address?.type === 'specific' && vendor.service_address?.property_ids) {
        return vendor.service_address.property_ids.some(id => propertyIds.includes(id));
      }
      
      return false;
    });

    // Transform the data to match the frontend interface
    const transformedVendors = filteredVendors.map(vendor => ({
      id: vendor.id,
      first_name: vendor.first_name,
      middle_name: vendor.middle_name,
      last_name: vendor.last_name,
      company: vendor.company,
      role: vendor.role,
      service_address: vendor.service_address,
      unit: vendor.units ? {
        unit_number: vendor.units.unit_name,
        property_name: vendor.units.properties.name
      } : undefined
    }));

    return NextResponse.json(transformedVendors);
  } catch (error) {
    console.error('Error in vendors by properties route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 