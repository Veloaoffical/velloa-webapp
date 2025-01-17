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

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
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

    // Fetch tenants from the people table
    const { data: tenants, error: tenantsError } = await supabase
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
      .eq('role', 'tenant')
      .returns<Tenant[]>();

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return NextResponse.json({ error: 'Failed to fetch tenants', details: tenantsError.message }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedTenants = tenants.map(tenant => ({
      id: tenant.id,
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      role: tenant.role,
      unit: tenant.units ? {
        unit_number: tenant.units.unit_name,
        property_name: tenant.units.properties.name
      } : undefined
    }));

    return NextResponse.json(transformedTenants);
  } catch (error) {
    console.error('Error in tenants route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 