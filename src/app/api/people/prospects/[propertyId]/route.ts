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

interface Prospect {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  expected_move_in_date: string | null;
  status: string | null;
  assignee_id: string | null;
  property_id: string;
  unit_id: string | null;
  prospect_property: {
    property_id: string;
    unit_id: string;
  } | null;
  units: Unit | null;
}

export async function GET(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const propertyId = params.propertyId;
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

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

    // Fetch prospects from the people table
    const { data: prospects, error: prospectsError } = await supabase
      .from('people')
      .select(`
        id,
        first_name,
        last_name,
        role,
        email,
        phone,
        expected_move_in_date,
        status,
        assignee_id,
        property_id,
        unit_id,
        prospect_property,
        units (
          unit_name,
          properties (
            name
          )
        )
      `)
      .eq('company_id', companyMember.company_id)
      .eq('role', 'prospect')
      .returns<Prospect[]>();

    if (prospectsError) {
      console.error('Error fetching prospects:', prospectsError);
      return NextResponse.json({ error: 'Failed to fetch prospects', details: prospectsError.message }, { status: 500 });
    }

    // Filter prospects for the specific property
    const propertyProspects = prospects.filter(prospect => {
      // Check both direct property_id and prospect_property.property_id
      return prospect.property_id === propertyId || 
             prospect.prospect_property?.property_id === propertyId;
    });

    // Transform the data to match the frontend interface
    const transformedProspects = propertyProspects.map(prospect => ({
      id: prospect.id,
      first_name: prospect.first_name,
      last_name: prospect.last_name,
      email: prospect.email,
      phone: prospect.phone,
      role: prospect.role,
      property_id: prospect.property_id,
      unit_id: prospect.unit_id,
      prospect_property: prospect.prospect_property,
      expected_move_in_date: prospect.expected_move_in_date,
      status: prospect.status,
      assignee_id: prospect.assignee_id,
      unit: prospect.units ? {
        unit_number: prospect.units.unit_name,
        property_name: prospect.units.properties.name
      } : null
    }));

    return NextResponse.json(transformedProspects);
  } catch (error) {
    console.error('Error in property prospects route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 