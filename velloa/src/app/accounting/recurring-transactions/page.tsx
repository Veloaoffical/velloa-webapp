import { Suspense } from "react"
import Link from "next/link"
import { Button as ButtonUI } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/utils/supabase/server"
import { RecurringTransactionsClient } from "./recurring-transaction"
import { Account, Property, Lease, Person, Charge } from "./types"

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

async function fetchAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get company_id from the user's session
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (companyError || !companyMember) {
    throw new Error('Failed to get company data');
  }

  const company_id = companyMember.company_id;
  
  // Fetch chart of accounts
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('company_id', company_id);

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`);
  }

  return data as Account[];
}

async function fetchProperties(): Promise<Property[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get company_id from the user's session
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (companyError || !companyMember) {
    throw new Error('Failed to get company data');
  }

  const company_id = companyMember.company_id;

  // Fetch properties
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, address_line_1, address_line_2, city, state, zip, country')
    .eq('company_id', company_id)
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`);
  }

  // Format the address for display
  return data.map(p => ({
    id: p.id,
    name: p.name,
    address: [
      p.address_line_1,
      p.address_line_2,
      [p.city, p.state, p.zip].filter(Boolean).join(', ')
    ].filter(Boolean).join(', '),
    city: p.city,
    state: p.state,
    zip: p.zip
  })) as Property[];
}

async function fetchLeases(): Promise<Lease[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get company_id from the user's session
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (companyError || !companyMember) {
    throw new Error('Failed to get company data');
  }

  const company_id = companyMember.company_id;

  // Fetch leases
  const { data, error } = await supabase
    .from('lease_contracts')
    .select(`
      id, 
      property_id,
      unit_id,
      tenant_id,
      property:properties (id, name, address_line_1),
      unit:units (unit_id, unit_name),
      start_date,
      end_date,
      rent_amount,
      lease_term,
      deposit_amount
    `)
    .eq('company_id', company_id);

  if (error) {
    throw new Error(`Failed to fetch leases: ${error.message}`);
  }

  return data.map(lease => {
    // Handle property and unit data safely
    const propertyData = lease.property ? 
      (Array.isArray(lease.property) ? { name: '', address_line_1: '' } : lease.property) 
      : { name: '', address_line_1: '' };
    
    const unitData = lease.unit ? 
      (Array.isArray(lease.unit) ? { unit_name: '' } : lease.unit) 
      : { unit_name: '' };
    
    // Parse tenant information from JSON string if it exists
    let tenant = null;
    let tenantName = 'Unknown Tenant';
    
    if (lease.tenant_id) {
      try {
        // The tenant_id field might be a JSON string or already a parsed object
        const tenantData = typeof lease.tenant_id === 'string' 
          ? JSON.parse(lease.tenant_id) 
          : lease.tenant_id;
        
        // Handle both array and object formats
        const tenantInfo = Array.isArray(tenantData) ? tenantData[0] : tenantData;
        
        tenant = tenantInfo;
        
        if (tenantInfo.first_name && tenantInfo.last_name) {
          tenantName = `${tenantInfo.first_name} ${tenantInfo.last_name}`.trim();
        } else if (tenantInfo.name) {
          tenantName = tenantInfo.name;
        }
      } catch (e) {
        console.error('Error parsing tenant data:', e);
      }
    }
    
    return {
      ...lease,
      tenant_name: tenantName,
      property_name: propertyData.name || 'Unknown Property',
      unit_name: unitData.unit_name || 'Unknown Unit',
      tenant: tenant,
      property: {
        name: propertyData.name || '',
        address: propertyData.address_line_1 || ''
      },
      unit: {
        unit_number: unitData.unit_name || ''
      }
    };
  }) as Lease[];
}

async function fetchPeople(): Promise<Person[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get company_id from the user's session
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (companyError || !companyMember) {
    throw new Error('Failed to get company data');
  }

  const company_id = companyMember.company_id;

  // Fetch people
  const { data, error } = await supabase
    .from('people')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      role,
      unit_id,
      company
    `)
    .eq('company_id', company_id);

  if (error) {
    throw new Error(`Failed to fetch people: ${error.message}`);
  }

  return data as Person[];
}

async function fetchInitialCharges(): Promise<Charge[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get company_id from the user's session
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (companyError || !companyMember) {
    throw new Error('Failed to get company data');
  }

  const company_id = companyMember.company_id;

  // Fetch charges with bill or expense type, excluding paid charges
  const { data, error } = await supabase
    .from('charges')
    .select(`
      id,
      company_id,
      lease_id,
      property_id,
      unit_id,
      people_id,
      charge_amount,
      amount_remaining,
      due_date,
      bill_date,
      memo,
      reference,
      status,
      created_at,
      created_by,
      share_with_tenants,
      charge_type
    `)
    .eq('company_id', company_id)
    .in('charge_type', ['bill', 'expense'])
    .neq('status', 'paid')
    .order('due_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch charges: ${error.message}`);
  }

  // Define types for our data structures
  interface Category {
    id: string;
    account_name: string;
    account_type: string;
    account_subtype: string;
  }

  interface ChargeLine {
    line_id: string;
    category: string;
    category_id?: string;
    description?: string;
    amount: number;
    property_id?: string;
    unit_id?: string;
    category_info?: Category;
  }

  interface ChargeAmount {
    lines?: ChargeLine[];
    total_amount: number;
    accounts_payable_id?: string;
  }

  interface ChargeData {
    id: string;
    company_id: string;
    lease_id: string;
    property_id: string;
    unit_id: string;
    people_id: string;
    charge_amount: ChargeAmount;
    amount_remaining: ChargeAmount;
    due_date: string;
    memo: {
      type?: string;
      content?: string;
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
    reference: string;
    status: string;
    created_at: string;
    created_by: string;
    share_with_tenants: boolean;
    charge_type: string;
  }

  // Get unique category IDs from all charge lines
  const categoryIds = [...new Set(
    (data as ChargeData[]).flatMap(charge => 
      charge.charge_amount && charge.charge_amount.lines 
        ? charge.charge_amount.lines.map(line => line.category || line.category_id).filter(Boolean)
        : []
    )
  )] as string[];
  
  // Fetch category information if we have any category IDs
  if (categoryIds.length > 0) {
    const { data: categories, error: categoriesError } = await supabase
      .from('chart_of_accounts')
      .select('id, account_name, account_type, account_subtype')
      .in('id', categoryIds);
    
    if (!categoriesError && categories) {
      // Create a map for quick lookup
      const categoryMap: Record<string, Category> = (categories as Category[]).reduce((acc: Record<string, Category>, cat: Category) => {
        acc[cat.id] = cat;
        return acc;
      }, {});
      
      // Attach category information to each charge line
      (data as ChargeData[]).forEach(charge => {
        // Process charge_amount lines
        if (charge.charge_amount && charge.charge_amount.lines) {
          charge.charge_amount.lines.forEach((line: ChargeLine) => {
            const categoryId = line.category || line.category_id;
            if (categoryId && categoryMap[categoryId]) {
              line.category_info = categoryMap[categoryId];
            }
          });
        }
        
        // Process amount_remaining lines
        if (charge.amount_remaining && charge.amount_remaining.lines) {
          charge.amount_remaining.lines.forEach((line: ChargeLine) => {
            const categoryId = line.category || line.category_id;
            if (categoryId && categoryMap[categoryId]) {
              line.category_info = categoryMap[categoryId];
            }
          });
        }
      });
    }
  }

  return data as Charge[];
}

export default async function BillsExpensesPage() {
  try {
    // Fetch initial data in parallel
    const [accounts, properties, leases, people, initialCharges] = await Promise.all([
      fetchAccounts(),
      fetchProperties(),
      fetchLeases(),
      fetchPeople(),
      fetchInitialCharges()
    ]);

    return (
      <main className="p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link href="/accounting/">
            <ButtonUI variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </ButtonUI>
          </Link>
          <h1 className="text-xl font-semibold">Recurring Transactions</h1>
        </header>

        <Suspense fallback={
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        }>
          <RecurringTransactionsClient 
            initialAccounts={accounts} 
            initialProperties={properties} 
            initialLeases={leases} 
            initialPeople={people}
            initialCharges={initialCharges}
          />
        </Suspense>
      </main>
    )
  } catch (error) {
    console.error('Error in BillsExpensesPage:', error);
    return (
      <main className="p-6 space-y-6">
        <header className="flex items-center gap-4">
          <Link href="/accounting/">
            <ButtonUI variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </ButtonUI>
          </Link>
          <h1 className="text-xl font-semibold">Open Bills</h1>
        </header>
        
        <ErrorAlert error={error instanceof Error ? error : new Error('An unexpected error occurred')} />
      </main>
    )
  }
}

    