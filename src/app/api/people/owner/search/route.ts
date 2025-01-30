import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface Owner {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  unit_id: string | null;
  units?: {
    unit_name: string;
    properties: {
      name: string;
    };
  } | null;
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

    // Fetch owners from the people table
    const { data: owners, error: ownersError } = await supabase
      .from('people')
      .select(`
        id,
        first_name,
        last_name,
        role,
        unit_id,
        units (
          unit_name,
          properties (
            name
          )
        )
      `)
      .eq('company_id', companyMember.company_id)
      .eq('role', 'owner')
      .returns<Owner[]>();

    if (ownersError) {
      console.error('Error fetching owners:', ownersError);
      return NextResponse.json({ error: 'Failed to fetch owners', details: ownersError.message }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedOwners = owners.map(owner => ({
      id: owner.id,
      first_name: owner.first_name,
      last_name: owner.last_name,
      role: owner.role,
      unit: owner.units ? {
        unit_number: owner.units.unit_name,
        property_name: owner.units.properties.name
      } : undefined
    }));

    return NextResponse.json(transformedOwners);
  } catch (error) {
    console.error('Error in owners route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 