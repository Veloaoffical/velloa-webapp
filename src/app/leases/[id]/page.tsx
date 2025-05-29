import { Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { LeaseDetailsClient } from './lease-details-client';
import { Property, Unit, TenantInfo as Tenant } from '../types';

interface LeaseDetails {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: string | null;
  lease_type: string | null;
  deposit_amount: string | null;
  property: Property | null;
  unit: Unit | null;
  tenant: Tenant | null;
}

function ErrorAlert({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
    </Alert>
  );
}

async function fetchLeaseDetails(id: string): Promise<LeaseDetails> {
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

    // First fetch the lease
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('*, property_id, unit_id, tenant_id')
      .eq('id', id)
      .eq('company_id', companyMember.company_id)
      .single();

    if (leaseError) {
      console.error('Lease error:', leaseError);
      throw new Error('Failed to fetch lease');
    }

    if (!lease) {
      throw new Error('Lease not found');
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
      throw new Error('Failed to fetch property details');
    }
    if (unitResult.error) {
      console.error('Unit error:', unitResult.error);
      throw new Error('Failed to fetch unit details');
    }
    if (tenantResult.error) {
      console.error('Tenant error:', tenantResult.error);
      throw new Error('Failed to fetch tenant details');
    }

    // Combine all the data
    const leaseDetails = {
      id: lease.id,
      created_at: lease.created_at,
      start_date: lease.start_date,
      end_date: lease.end_date,
      rent_amount: lease.rent_amount,
      lease_type: lease.lease_type,
      deposit_amount: lease.deposit_amount,
      property: propertyResult.data,
      unit: unitResult.data,
      tenant: tenantResult.data
    };

    return leaseDetails;
  } catch (error) {
    console.error('Error in fetchLeaseDetails:', error);
    throw error;
  }
}

export default async function LeaseDetailsPage({ params }: { params: { id: string } }) {
  try {
    const leaseDetails = await fetchLeaseDetails(params.id);
    
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>}>
        <LeaseDetailsClient leaseDetails={leaseDetails} />
      </Suspense>
    );
  } catch (error) {
    if ((error as Error).message === 'Lease not found') {
      return notFound();
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-full max-w-md">
          <ErrorAlert error={error instanceof Error ? error : new Error('An unknown error occurred')} />
        </div>
      </div>
    );
  }
}

export const dynamic = 'force-dynamic'; 