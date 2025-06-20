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

// Types for charges data structure
interface ChargeAmount {
  lines: Array<{
    amount: number;
    line_id: string;
    category_id: string;
    description: string;
  }>;
  total_amount: number;
  accounts_receivable_id?: string;
}

interface Charge {
  id: string;
  charge_type: string;
  charge_amount: ChargeAmount;
  status: string;
  due_date: string;
  lease_id: string | null;
  people_id: string | null;
  created_at: string;
  start_date?: string;
  bill_date?: string;
  frequency?: string;
  memo?: Record<string, unknown> | null;
  reference?: string;
}

// Work Order interface (matching the one from people page)
interface WorkOrder {
  id: string;
  subject: string;
  description: string;
  task_status?: Record<string, { date: string | null; value: boolean | null }>;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  request_type: string | null;
  task_type: string | null;
  tenant: string | null;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
  assignee?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
  role: string;
  vendor_id: string | null;
  vendor?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  } | null;
  active_status: string;
}

interface Note {
  id: string;
  note_title: string;
  note: string | Record<string, unknown>;
  created_at: string;
  created_by: {
    first_name: string;
    middle_name: string;
    last_name: string;
  };
}

interface LeaseFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
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
  // Charges data
  charges: Charge[];
  // Deposits data
  deposits: Transaction[];
  // Work orders data
  workOrders: WorkOrder[];
  // Notes data
  notes: Note[];
  // Files data
  files: LeaseFile[];
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

// Function to fetch work orders for a lease (similar to getPersonWorkOrders)

async function getLeaseWorkOrders(supabase: Awaited<ReturnType<typeof createClient>>, leaseId: string, tenantIds: string[], propertyId?: string, unitId?: string): Promise<WorkOrder[]> {
  try {
    // Build the query to find work orders related to this lease
    // We'll look for work orders that match:
    // 1. The tenant IDs from the lease
    // 2. The property ID from the lease
    // 3. The unit ID from the lease
    let query = supabase
      .from('maintenance_requests')
      .select(`
        id,
        subject,
        description,
        task_status,
        priority,
        due_date,
        created_at,
        assignees,
        created_by,
        nano_id,
        property_id,
        unit_id,
        request_type,
        task_type,
        tenant_id,
        role,
        vendor_id,
        active_status,
        property:properties!property_id (
          name
        ),
        unit:units!unit_id (
          unit_name
        ),
        assignee:company_members!maintenance_requests_assignees_fkey (
          id,
          profile:profiles (
            first_name,
            last_name
          )
        ),
        vendor:people!maintenance_requests_vendor_id_fkey (
          id,
          first_name,
          last_name,
          company
        ),
        tenant:people!maintenance_requests_tenant_id_fkey (
          id,
          first_name,
          last_name
        )
      `);

    // Build OR conditions for lease-related work orders
    const orConditions = [];
    
    // Add tenant conditions
    if (tenantIds && tenantIds.length > 0) {
      tenantIds.forEach(tenantId => {
        orConditions.push(`tenant_id.eq.${tenantId}`);
      });
    }
    
    // Add property condition
    if (propertyId) {
      orConditions.push(`property_id.eq.${propertyId}`);
    }
    
    // Add unit condition
    if (unitId) {
      orConditions.push(`unit_id.eq.${unitId}`);
    }

    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','));
    } else {
      // If no conditions, return empty array
      return [];
    }

    const { data: workOrders, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lease work orders:', error);
      return [];
    }

    return (workOrders || []).map(workOrder => {
      // Process property data
      const propertyData = Array.isArray(workOrder.property) ? 
        (workOrder.property.length > 0 ? workOrder.property[0] : null) : 
        workOrder.property;

      // Process unit data  
      const unitData = Array.isArray(workOrder.unit) ? 
        (workOrder.unit.length > 0 ? workOrder.unit[0] : null) : 
        workOrder.unit;

      // Process assignee data
      let assigneeData = null;
      if (workOrder.assignee && Array.isArray(workOrder.assignee) && workOrder.assignee.length > 0) {
        const assignee = workOrder.assignee[0];
        if (assignee && assignee.profile) {
          const profile = Array.isArray(assignee.profile) ? 
            (assignee.profile.length > 0 ? assignee.profile[0] : { first_name: '', last_name: '' }) : 
            assignee.profile;
          assigneeData = {
            id: assignee.id,
            profile: profile,
          };
        }
      }

      // Process vendor data
      const vendorData = Array.isArray(workOrder.vendor) && workOrder.vendor.length > 0 ? 
        workOrder.vendor[0] : 
        (workOrder.vendor && !Array.isArray(workOrder.vendor) ? workOrder.vendor : null);

      return {
        id: workOrder.id,
        subject: workOrder.subject || '',
        description: workOrder.description || '',
        task_status: workOrder.task_status,
        priority: workOrder.priority || 'medium',
        due_date: workOrder.due_date,
        created_at: workOrder.created_at,
        assignees: workOrder.assignees,
        created_by: workOrder.created_by,
        nano_id: workOrder.nano_id,
        property_id: workOrder.property_id,
        unit_id: workOrder.unit_id,
        request_type: workOrder.request_type,
        task_type: workOrder.task_type,
        tenant: workOrder.tenant_id,
        property: propertyData,
        unit: unitData,
        assignee: assigneeData,
        role: workOrder.role || 'work_order',
        vendor_id: workOrder.vendor_id,
        vendor: vendorData,
        active_status: workOrder.active_status || 'active',
      };
    });
  } catch (error) {
    console.error('Error fetching lease work orders:', error);
    return [];
  }
}

async function get_lease_transactions(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string, leaseId: string) {
  const { data, error } = await supabase
    .from('transaction')
    .select('*')
    .eq('company', companyId)
    .eq('data->>lease_id', leaseId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching lease transactions:', error);
    throw new Error(`Failed to fetch lease transactions: ${error.message}`);
  }

  return data || [];
}

async function fetchChargesData(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string, leaseId?: string): Promise<Charge[]> {
  try {
    let query = supabase
      .from('charges')
      .select('*')
      .eq('company_id', companyId);

    // If leaseId is provided, filter by lease_id
    if (leaseId && leaseId !== 'all') {
      query = query.eq('lease_id', leaseId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching charges:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching charges data:', error);
    return [];
  }
}

async function fetchTransactionData(supabase: Awaited<ReturnType<typeof createClient>>, companyId: string, leaseId?: string): Promise<{
  transactions: Transaction[];
  accounts: Account[];
  properties: Property[];
  people: Person[];
  charges: Charge[];
  deposits: Transaction[];
}> {
  try {
    // Fetch all the data needed for transactions in parallel using Supabase client
    const [accountsResult, propertiesResult, peopleResult, transactionsResult, chargesResult, depositsResult] = await Promise.all([
      // Fetch accounts from the chart_of_accounts table
      supabase
        .from('chart_of_accounts')
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

      // Fetch transactions based on leaseId
      leaseId && leaseId !== 'all' ? 
        get_lease_transactions(supabase, companyId, leaseId) :
        supabase
          .from('transaction')
          .select('*')
          .eq('company', companyId)
          .gte('start_date', '1970-01-01')
          .lte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: false })
          .then(result => result.data || []),

      // Fetch charges
      fetchChargesData(supabase, companyId, leaseId),

      // Fetch deposits linked to this lease
      leaseId && leaseId !== 'all' ? 
        supabase
          .from('transaction')
          .select('*')
          .eq('company', companyId)
          .eq('transaction_type', 'deposit')
          .eq('data->>lease_id', leaseId)
          .order('start_date', { ascending: false })
          .then(result => result.data || []) :
        supabase
          .from('transaction')
          .select('*')
          .eq('company', companyId)
          .eq('transaction_type', 'deposit')
          .order('start_date', { ascending: false })
          .then(result => result.data || []),
    ]);

    return {
      transactions: transactionsResult as Transaction[],
      accounts: accountsResult.data || [],
      properties: propertiesResult.data || [],
      people: peopleResult.data || [],
      charges: chargesResult,
      deposits: depositsResult as Transaction[],
    };
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    return {
      transactions: [],
      accounts: [],
      properties: [],
      people: [],
      charges: [],
      deposits: [],
    };
  }
}

async function fetchLeaseFiles(supabase: Awaited<ReturnType<typeof createClient>>, leaseId: string): Promise<LeaseFile[]> {
  try {
    // First get the lease to find the tenant (people_id)
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('tenant_id')
      .eq('id', leaseId)
      .single();

    if (leaseError || !lease?.tenant_id) {
      console.error('Error fetching lease or no tenant found:', leaseError);
      return [];
    }

    const tenantId = Array.isArray(lease.tenant_id) ? lease.tenant_id[0] : lease.tenant_id;
    if (!tenantId) {
      return [];
    }

    // Get files for the tenant (people_id from lease)
    const { data: files, error } = await supabase
      .from('people_files')
      .select('id, file_name, file_url, file_type, file_path, file_size, created_at')
      .eq('people_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return [];
    }

    // Map the database fields to match what the frontend expects
    return files.map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileUrl: file.file_url,
      fileType: file.file_type || '',
      fileSize: file.file_size || 0,
      createdAt: file.created_at
    }));
  } catch (error) {
    console.error('Error in fetchLeaseFiles:', error);
    return [];
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

    const [lease, allTenants, transactionData] = await Promise.all([
      supabase
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
        .single(),
      fetchAllTenants(supabase, companyMember.company_id),
      fetchTransactionData(supabase, companyMember.company_id, leaseId)
    ]);

    if (lease.error) {
      console.error('Error fetching lease:', lease.error);
      throw new Error(`Failed to fetch lease: ${lease.error.message}`);
    }

    // Fetch lease notes through the tenant relationship
    let leaseNotes: Note[] = [];
    const tenantId = Array.isArray(lease.data.tenant_id) ? lease.data.tenant_id[0] : lease.data.tenant_id;
    
    if (tenantId) {
      const { data: notesData, error: notesError } = await supabase
        .from('people_notes')
        .select(`
          id,
          note_title,
          data,
          created_at,
          profiles!created_by(
            first_name,
            middle_name,
            last_name
          )
        `)
        .eq('people_id', tenantId)
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Error fetching notes:', notesError);
      } else {
        leaseNotes = (notesData || []).map(note => {
          const profiles = note.profiles as { first_name: string; middle_name: string; last_name: string }[] | null;
          const profile = Array.isArray(profiles) ? profiles[0] : profiles;
          return {
            id: note.id,
            note_title: note.note_title,
            note: note.data,
            created_at: note.created_at,
            created_by: {
              first_name: profile?.first_name || '',
              middle_name: profile?.middle_name || '',
              last_name: profile?.last_name || '',
            },
          };
        });
      }
    }

    // Fetch related data in parallel
    const [propertyResponse, unitResponse, tenantResponse] = await Promise.all([
      // Fetch property
      lease.data.property_id ? supabase
        .from('properties')
        .select('id, name')
        .eq('id', lease.data.property_id)
        .single() : Promise.resolve({ data: null }),

      // Fetch unit
      lease.data.unit_id ? supabase
        .from('units')
        .select('unit_id, unit_name')
        .eq('unit_id', lease.data.unit_id)
        .single() : Promise.resolve({ data: null }),

      // Fetch tenant
      lease.data.tenant_id && Array.isArray(lease.data.tenant_id) && lease.data.tenant_id.length > 0 ? supabase
        .from('people')
        .select('id, first_name, last_name, role')
        .eq('id', lease.data.tenant_id[0])
        .eq('role', 'tenant')
        .single() : Promise.resolve({ data: null })
    ]);

    // Combine the data
    const combinedLease = {
      ...lease.data,
      property: propertyResponse.data,
      unit: unitResponse.data,
      tenant: tenantResponse.data
    };

    // Fetch work orders and files for this lease
    const tenantIds = Array.isArray(lease.data.tenant_id) ? lease.data.tenant_id : [];
    const [workOrders, leaseFiles] = await Promise.all([
      getLeaseWorkOrders(
        supabase, 
        leaseId, 
        tenantIds, 
        lease.data.property_id, 
        lease.data.unit_id
      ),
      fetchLeaseFiles(supabase, leaseId)
    ]);

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
       charges: transactionData.charges,
       deposits: transactionData.deposits,
       workOrders: workOrders,
       notes: leaseNotes,
       files: leaseFiles,
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