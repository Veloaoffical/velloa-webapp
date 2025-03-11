import { Suspense } from "react"
import Link from "next/link"
import { Button as ButtonUI } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/utils/supabase/server"
import { PrintChecksClient } from "./print-checks-client"

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

interface TransactionData {
  lines: {
    unit: string
    category: string
    description: string
    debit_amount: number
    credit_amount: number
  }[]
  total_amount: number
  payment_method: string
  memo?: string
  check_number?: string
}

interface PayeeDetails {
  id: string
  full_name: string
  company_name?: string
}

interface RawTransaction {
  id: string
  created_at: string
  transaction_type: string | null
  property: string | null
  nano: string | null
  payee: string | null
  start_date: string | null
  due_date: string | null
  repeat_infinite: boolean | null
  data: TransactionData
  frequency: string | null
  created_by: string | null
  company: string | null
  memo: Record<string, unknown> | null
  frequency_type: string | null
  reference: string | null
}

interface Transaction extends RawTransaction {
  payeeDetails?: PayeeDetails
}

interface ChartOfAccount {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_description?: string
  account_balance: number
  active_account: boolean
  sub_account?: boolean
  parent_account?: string
}

async function fetchChartOfAccounts(): Promise<ChartOfAccount[]> {
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

  return data as ChartOfAccount[];
}

async function fetchInitialTransactions(): Promise<Transaction[]> {
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
  
  // Get first and last day of the previous month for default filter
  const currentDate = new Date();
  const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  
  // Format dates for query
  const startDate = firstDayLastMonth.toISOString().split('T')[0];
  const endDate = lastDayLastMonth.toISOString().split('T')[0];

  // Fetch transactions with check_inapp payment method
  const { data, error } = await supabase
    .from('transaction')
    .select('*')
    .eq('company', company_id)
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .eq('data->>payment_method', 'check_inapp');

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  // Parse the transactions
  const parsedTransactions = data.map((item: RawTransaction) => ({
    ...item,
    data: {
      ...item.data,
      payment_method: item.data?.payment_method || 'unknown'
    }
  }));

  // Fetch payee details for the transactions
  return await fetchPayeeDetails(parsedTransactions);
}

async function fetchPayeeDetails(transactions: Transaction[]): Promise<Transaction[]> {
  const supabase = await createClient();
  
  // Get unique payee IDs
  const payeeIds = [...new Set(transactions.filter(t => t.payee).map(t => t.payee))];
  
  if (payeeIds.length === 0) return transactions;

  // Create a map to store payee details
  const payeeMap = new Map<string, PayeeDetails>();

  // Fetch people data for all roles
  const { data: people, error } = await supabase
    .from('people')
    .select('id, first_name, last_name, company')
    .in('id', payeeIds);

  if (error) {
    console.error('Error fetching payee details:', error);
    return transactions;
  }

  // Create a map of payee details
  people.forEach(person => {
    payeeMap.set(person.id, {
      id: person.id,
      full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      company_name: person.company
    });
  });

  // Add payee details to transactions
  return transactions.map(transaction => ({
    ...transaction,
    payeeDetails: transaction.payee ? payeeMap.get(transaction.payee) : undefined
  }));
}

export default async function PrintChecksPage() {
  try {
    // Fetch initial data
    const [accounts, transactions] = await Promise.all([
      fetchChartOfAccounts(),
      fetchInitialTransactions()
    ]);

    return (
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <PrintChecksClient 
          initialAccounts={accounts} 
          initialTransactions={transactions} 
        />
      </Suspense>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/accounting">
            <ButtonUI variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </ButtonUI>
          </Link>
          <h1 className="text-xl font-semibold">Print Checks</h1>
        </div>
        <ErrorAlert error={error as Error} />
      </div>
    );
  }
} 