import { Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import { LeasesClient } from './leases-client';
import { Lease } from './types';

function ErrorAlert({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
    </Alert>
  )
}

async function fetchLeases(): Promise<Lease[]> {
  const supabase = await createClient();

  try {
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company error:', companyError);
      throw new Error('Failed to get company');
    }

    // Fetch leases with related data
    const { data: leases, error: leasesError } = await supabase
      .from('lease_contracts')
      .select(`
        id,
        created_at,
        start_date,
        end_date,
        rent_amount,
        lease_type,
        deposit_amount,
        property_id,
        unit_id,
        tenant_id
      `)
      .eq('company_id', companyMember.company_id)
      .order('created_at', { ascending: false });

    if (leasesError) {
      console.error('Error fetching leases:', {
        error: leasesError,
        message: leasesError.message,
        details: leasesError.details,
        hint: leasesError.hint,
        code: leasesError.code
      });
      throw new Error(`Failed to fetch leases: ${leasesError.message}`);
    }

    // Fetch properties and units data separately
    const propertyIds = leases?.map(lease => lease.property_id).filter(Boolean) || [];
    const unitIds = leases?.map(lease => lease.unit_id).filter(Boolean) || [];

    // Extract tenant IDs from the tenant_id objects
    const tenantIds = leases
      ?.map(lease => {
        if (lease.tenant_id) {
          // tenant_id is already an object (JSONB from database)
          return lease.tenant_id[0]?.id;
        }
        return null;
      })
      .filter(Boolean) || [];

    // Fetch properties, units, and tenants in parallel
    const [propertiesResponse, unitsResponse, tenantsResponse] = await Promise.all([
      // Fetch properties
      propertyIds.length > 0 ? supabase
        .from('properties')
        .select('id, name, address_line_1, address_line_2, city, state, zip')
        .in('id', propertyIds) : Promise.resolve({ data: [] }),

      // Fetch units
      unitIds.length > 0 ? supabase
        .from('units')
        .select('unit_id, unit_name')
        .in('unit_id', unitIds) : Promise.resolve({ data: [] }),

      // Fetch tenants directly from people table
      tenantIds.length > 0 ? supabase
        .from('people')
        .select('id, first_name, last_name, role')
        .in('id', tenantIds)
        .eq('role', 'tenant') : Promise.resolve({ data: [] })
    ]);

    // Create lookup maps for properties, units, and tenants
    const propertiesMap = new Map(propertiesResponse.data?.map(p => [p.id, p]));
    const unitsMap = new Map(unitsResponse.data?.map(u => [u.unit_id, u]));
    const tenantsMap = new Map((tenantsResponse.data || []).map(t => [t.id, {
      id: t.id,
      first_name: t.first_name,
      last_name: t.last_name,
      role: t.role
    }]));

    // Combine the data
    const combinedLeases = leases?.map(lease => {
      let tenant = null;
      if (lease.tenant_id) {
        // tenant_id is already an object (JSONB from database)
        const tenantId = lease.tenant_id[0]?.id;
        if (tenantId) {
          tenant = tenantsMap.get(tenantId) || {
            id: tenantId,
            first_name: lease.tenant_id[0]?.name?.split(' ')[0] || '',
            last_name: lease.tenant_id[0]?.name?.split(' ').slice(1).join(' ') || '',
            role: 'tenant'
          };
        }
      }

      return {
        ...lease,
        property: lease.property_id ? propertiesMap.get(lease.property_id) || null : null,
        unit: lease.unit_id ? unitsMap.get(lease.unit_id) || null : null,
        tenant
      };
    }) || [];

    return combinedLeases;
  } catch (error) {
    console.error('Unexpected error in fetchLeases:', error);
    throw error;
  }
}

export default async function LeasesPage() {
  try {
    const leases = await fetchLeases();
    
    return (
      <Suspense fallback={<div className="p-6">Loading leases...</div>}>
        <LeasesClient leases={leases} />
      </Suspense>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error instanceof Error ? error : new Error('An unknown error occurred')} />
      </div>
    );
  }
}
