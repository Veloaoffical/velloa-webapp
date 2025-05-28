import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const params = await props.params;
    const { id } = params;

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // First fetch the lease
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('*, property_id, unit_id, tenant_id')
      .eq('id', id)
      .eq('company_id', companyMember.company_id)
      .single();

    if (leaseError) {
      console.error('Lease error:', leaseError);
      return NextResponse.json({ error: 'Failed to fetch lease' }, { status: 500 });
    }

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Extract tenant ID from the tenant_id object
    let tenantId = null;
    if (lease.tenant_id) {
      if (Array.isArray(lease.tenant_id)) {
        tenantId = lease.tenant_id[0]?.id;
      } else if (typeof lease.tenant_id === 'string') {
        tenantId = lease.tenant_id;
      } else if (typeof lease.tenant_id === 'object') {
        tenantId = lease.tenant_id.id;
      }
    }

    // Then fetch related data in parallel
    const [propertyResult, unitResult, tenantResult] = await Promise.all([
      // Fetch property
      lease.property_id ? supabase
        .from('properties')
        .select('id, name, address_line_1, address_line_2, city, state, zip')
        .eq('id', lease.property_id)
        .single() : { data: null, error: null },

      // Fetch unit
      lease.unit_id ? supabase
        .from('units')
        .select('unit_id, unit_name')
        .eq('unit_id', lease.unit_id)
        .single() : { data: null, error: null },

      // Fetch tenant
      tenantId ? supabase
        .from('people')
        .select('id, first_name, last_name, email, phone, role')
        .eq('id', tenantId)
        .single() : { data: null, error: null }
    ]);

    // Check for errors in the parallel requests
    if (propertyResult.error) {
      console.error('Property error:', propertyResult.error);
      return NextResponse.json({ error: 'Failed to fetch property details' }, { status: 500 });
    }
    if (unitResult.error) {
      console.error('Unit error:', unitResult.error);
      return NextResponse.json({ error: 'Failed to fetch unit details' }, { status: 500 });
    }
    if (tenantResult.error) {
      console.error('Tenant error:', tenantResult.error);
      return NextResponse.json({ error: 'Failed to fetch tenant details' }, { status: 500 });
    }

    // Combine all the data
    const leaseDetails = {
      id: lease.id,
      created_at: lease.created_at,
      start_date: lease.start_date,
      end_date: lease.end_date,
      rent_amount: lease.rent_amount,
      lease_term: lease.lease_term,
      deposit_amount: lease.deposit_amount,
      property: propertyResult.data,
      unit: unitResult.data,
      tenant: tenantResult.data
    };

    return NextResponse.json(leaseDetails);
  } catch (error) {
    console.error('Error in lease details route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 