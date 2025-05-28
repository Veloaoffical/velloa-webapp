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

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  role: string;
  property_id: string;
  unit_id: string | null;
  units: Unit | null;
}

export async function GET() {
  try {
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

    // Fetch all people from the people table
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select(`
        id,
        first_name,
        last_name,
        role,
        company,
        property_id,
        unit_id,
        units (
          unit_name,
          properties (
            name
          )
        )
      `)
      .eq('company_id', companyMember.company_id)
      .in('role', ['tenant', 'vendor', 'owner'])
      .returns<Person[]>();

    if (peopleError) {
      console.error('Error fetching people:', peopleError);
      return NextResponse.json({ error: 'Failed to fetch people', details: peopleError.message }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedPeople = people.map(person => ({
      id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
      company: person.company,
      role: person.role,
      property_id: person.property_id,
      unit: person.units ? {
        unit_number: person.units.unit_name,
        property_name: person.units.properties.name
      } : undefined
    }));

    return NextResponse.json(transformedPeople);
  } catch (error) {
    console.error('Error in people route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 