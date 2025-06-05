import { Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createClient } from '@/utils/supabase/server';
import { LeaseDetailsClient } from './components/lease-details-client';

// Local type definitions
interface Property {
  id: string;
  name: string;
}

interface Unit {
  unit_id: string;
  unit_name: string;
}

interface TenantInfo {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface AllTenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  unit?: {
    unit_number: string;
    property_name: string;
  };
}

interface Person {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  unit_id: string | null;
  units?: {
    unit_name: string;
    properties: {
      name: string;
    };
  } | null;
  company: string | null;
}

interface Transaction {
  id: string;
  transaction_type: string;
  property: string;
  start_date: string;
  memo: {
    type: string;
    content: string;
    root?: {
      type: string;
      format: string;
      indent: number;
      version: number;
      children: Array<{
        type: string;
        format: string;
        indent: number;
        version: number;
        children: never[];
        direction: string | null;
        textStyle: string;
        textFormat: number;
      }>;
      direction: string | null;
    };
  } | null;
  data: {
    total_amount: number;
    payment_method?: string;
    lines?: Array<{
      category: string;
      unit: string;
      description: string;
      debit_amount: number;
      credit_amount: number;
    }>;
  };
  created_at: string;
  created_by: string;
  reference?: string;
  payee?: string;
}

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  account_balance: number;
  start_balance: number;
  accounting_start_date: string;
  owner_id?: string;
  property_balance?: Array<{
    property_id: string;
    property_name: string;
    balance: number;
    start_balance: number;
    accounting_start_date: string;
  }>;
  active_account: boolean;
  sub_accounts?: Array<{
    id: string;
    account_name: string;
    account_subtype: string;
    account_balance: number;
  }>;
}

interface LeaseDetails {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: string | null;
  lease_type: string | null;
  deposit_amount: string | null;
  tenant_portal_status: string | null;
  rollover_to_month_to_month: boolean | null;
  payment_frequency: string | null;
  first_rent_due_day: number | null;
  insurance: {
    start_date: string;
    expiration_date: string;
    policy_number: string;
    provider: string;
    coverage_amount: number;
  } | null;
  property: Property | null;
  unit: Unit | null;
  tenant: TenantInfo | null;
  allTenants: AllTenant[];
  // Transaction-related data
  transactions: Transaction[];
  accounts: Account[];
  properties: Property[];
  people: Person[];
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

async function fetchAllTenants(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string): Promise<AllTenant[]> {
  // Fetch tenants from the people table
  const { data: tenants, error: tenantsError } = await supabase
    .from('people')
    .select(`
      id,
      first_name,
      last_name,
      role,
      email,
      phone,
      property_id,
      unit_id,
      units (
        unit_name,
        properties (
          name
        )
      )
    `)
    .eq('company_id', companyId)
    .eq('role', 'tenant');

  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
    throw new Error(`Failed to fetch tenants: ${tenantsError.message}`);
  }

  // Transform the data to match the frontend interface
  return (tenants || []).map((tenant) => ({
    id: tenant.id,
    first_name: tenant.first_name,
    last_name: tenant.last_name,
    email: tenant.email || '',
    phone: tenant.phone || '',
    role: tenant.role,
    unit: tenant.units && Array.isArray(tenant.units) && tenant.units.length > 0 ? {
      unit_number: tenant.units[0].unit_name,
      property_name: tenant.units[0].properties && Array.isArray(tenant.units[0].properties) && tenant.units[0].properties.length > 0 
        ? tenant.units[0].properties[0].name 
        : ''
    } : undefined
  }));
}

async function fetchTransactionData(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string, leaseId?: string): Promise<{
  transactions: Transaction[];
  accounts: Account[];
  properties: Property[];
  people: Person[];
}> {
  try {
    // Fetch all the data needed for transactions in parallel using Supabase client
    const [accountsResult, propertiesResult, peopleResult, transactionsResult] = await Promise.all([
      // Fetch accounts from the accounting_accounts table
      supabase
        .from('accounting_accounts')
        .select('*')
        .eq('company_id', companyId),
      
      // Fetch properties
      supabase
        .from('properties')
        .select('id, name')
        .eq('company_id', companyId),
      
      // Fetch people
      supabase
        .from('people')
        .select('*')
        .eq('company_id', companyId),

      // Fetch transactions from the accounting_transactions table
      supabase
        .from('accounting_transactions')
        .select('*')
        .eq('company_id', companyId)
        .gte('start_date', '1970-01-01')
        .lte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: false }),
    ]);

    // Filter transactions by lease if leaseId is provided
    let transactions = transactionsResult.data || [];
    if (leaseId && leaseId !== 'all') {
      transactions = transactions.filter(t => t.reference === leaseId);
    }

    return {
      transactions: transactions,
      accounts: accountsResult.data || [],
      properties: propertiesResult.data || [],
      people: peopleResult.data || [],
    };
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    return {
      transactions: [],
      accounts: [],
      properties: [],
      people: [],
    };
  }
}

async function fetchLeaseData(leaseId: string) {
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

    // Fetch lease details
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select(`
        id,
        created_at,
        start_date,
        end_date,
        rent_amount,
        lease_type,
        deposits,
        lease_status,
        property_id,
        unit_id,
        tenant_id
      `)
      .eq('id', leaseId)
      .eq('company_id', companyMember.company_id)
      .single();

    if (leaseError) {
      console.error('Error fetching lease:', leaseError);
      throw new Error(`Failed to fetch lease: ${leaseError.message}`);
    }

    // Fetch related data in parallel
    const [propertyResponse, unitResponse, tenantResponse] = await Promise.all([
      // Fetch property
      lease.property_id ? supabase
        .from('properties')
        .select('id, name')
        .eq('id', lease.property_id)
        .single() : Promise.resolve({ data: null }),

      // Fetch unit
      lease.unit_id ? supabase
        .from('units')
        .select('unit_id, unit_name')
        .eq('unit_id', lease.unit_id)
        .single() : Promise.resolve({ data: null }),

      // Fetch tenant
      lease.tenant_id && Array.isArray(lease.tenant_id) && lease.tenant_id.length > 0 ? supabase
        .from('people')
        .select('id, first_name, last_name, role')
        .eq('id', lease.tenant_id[0])
        .eq('role', 'tenant')
        .single() : Promise.resolve({ data: null })
    ]);

    // Combine the data
    const combinedLease = {
      ...lease,
      property: propertyResponse.data,
      unit: unitResponse.data,
      tenant: tenantResponse.data
    };

         // Fetch transaction data for this lease
     const transactionData = await fetchTransactionData(supabase, companyMember.company_id, leaseId);

     // Fetch all tenants
     const allTenants = await fetchAllTenants(supabase, companyMember.company_id);

     // Create the lease details object
     const leaseDetails: LeaseDetails = {
       id: combinedLease.id,
       created_at: combinedLease.created_at,
       start_date: combinedLease.start_date,
       end_date: combinedLease.end_date,
       rent_amount: combinedLease.rent_amount,
       lease_type: combinedLease.lease_type,
       deposit_amount: null, // This field might need to be added to the query
       tenant_portal_status: null, // This field might need to be added to the query
       rollover_to_month_to_month: null, // This field might need to be added to the query
       payment_frequency: null, // This field might need to be added to the query
       first_rent_due_day: null, // This field might need to be added to the query
       insurance: null, // This field might need to be added to the query
       property: combinedLease.property,
       unit: combinedLease.unit,
       tenant: combinedLease.tenant,
       allTenants: allTenants,
       transactions: transactionData.transactions,
       accounts: transactionData.accounts,
       properties: transactionData.properties,
       people: transactionData.people,
     };

     return leaseDetails;
  } catch (error) {
    console.error('Unexpected error in fetchLeaseData:', error);
    throw error;
  }
}

export default async function LeasePage({ params }: { params: { id: string } }) {
  try {
    const leaseDetails = await fetchLeaseData(params.id);
    
    return (
      <Suspense fallback={<div className="p-6">Loading lease details...</div>}>
        <LeaseDetailsClient leaseDetails={leaseDetails} />
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

export const dynamic = 'force-dynamic'; 