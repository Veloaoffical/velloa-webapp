import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import AccountingPageClient from "./accounting-page-client"
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileSpreadsheet, ArrowRightLeft, Calculator, Clock, Printer, FileText, Receipt, 
  CircleDollarSign, BanknoteIcon, CreditCard 
} from "lucide-react";

// Define interface for financial data
export interface FinancialData {
  totalExpenses: number;
  totalRevenue: number;
  netIncome: number;
  outstanding: number;
  transactions: {
    date: string;
    amount: number;
    type: 'expense' | 'revenue';
  }[];
}

// Define transaction interface to avoid using 'any'
interface Transaction {
  id: string;
  transaction_type: string;
  start_date: string;
  due_date?: string;
  data?: {
    total_amount?: number | string;
    [key: string]: unknown;
  };
}

// Loading component for SSR - now only for charts and stats
function AccountingLoading() {
  return (
    <>
      {/* Header (title, subtitle, button) is rendered instantly by AccountingPageClient */}
      {/* So, no skeleton needed here for that part. Add a spacer to mimic header height if layout shifts. */}
      <div className="h-[56px] mb-6"></div> {/* Spacer for the header area rendered by client */}

      {/* Charts and Stats Section Skeleton */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-12 gap-4">
            {/* Revenue/Cost Chart Skeleton */}
            <div className="col-span-4 bg-card text-card-foreground p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-5 w-36 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-44 bg-muted animate-pulse rounded opacity-70"></div>
                </div>
                <div className="h-8 w-24 bg-primary/10 rounded-md animate-pulse"></div>
              </div>
              <div className="h-[200px] bg-muted animate-pulse rounded-md"></div>
            </div>

            {/* Monthly Trends Chart Skeleton */}
            <div className="col-span-4 bg-card text-card-foreground p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-4 w-40 bg-muted animate-pulse rounded opacity-70"></div>
                </div>
                <div className="h-8 w-24 bg-primary/10 rounded-md animate-pulse"></div>
              </div>
              <div className="h-[200px] bg-muted animate-pulse rounded-md"></div>
            </div>

            {/* Quick Stats 2x2 Grid Skeleton */}
            <div className="col-span-4 grid grid-cols-2 gap-4">
              {/* Total Revenue */}
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 w-4 rounded-full bg-green-600 opacity-60"></div>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="mt-1">
                  <div className="h-8 w-28 bg-muted animate-pulse rounded mb-1"></div>
                  <div className="h-3 w-20 bg-muted animate-pulse rounded opacity-70"></div>
                </div>
              </div>
              
              {/* Total Expenses */}
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 w-4 rounded-full bg-red-600 opacity-60"></div>
                  <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="mt-1">
                  <div className="h-8 w-28 bg-muted animate-pulse rounded mb-1"></div>
                  <div className="h-3 w-20 bg-muted animate-pulse rounded opacity-70"></div>
                </div>
              </div>

              {/* Net Income */}
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 w-4 rounded-full bg-blue-600 opacity-60"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="mt-1">
                  <div className="h-8 w-28 bg-muted animate-pulse rounded mb-1"></div>
                  <div className="h-3 w-20 bg-muted animate-pulse rounded opacity-70"></div>
                </div>
              </div>

              {/* Outstanding */}
              <div className="bg-card text-card-foreground p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 w-4 rounded-full bg-yellow-600 opacity-60"></div>
                  <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="mt-1">
                  <div className="h-8 w-28 bg-muted animate-pulse rounded mb-1"></div>
                  <div className="h-3 w-20 bg-muted animate-pulse rounded opacity-70"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Error display component for server-side errors
function AccountingErrorDisplay({ errorMessage }: { errorMessage: string }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">Manage your financial records and transactions.</p>
        </div>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
        <h3 className="text-red-800 dark:text-red-400 font-medium">Error loading financial data</h3>
        <p className="text-red-700 dark:text-red-300 mt-1">
          {errorMessage || "An unexpected error occurred. Please try again later."}
        </p>
      </div>
    </div>
  )
}

export default async function AccountingPage() {
  console.log(`[${new Date().toISOString()}] AccountingPage server component rendering started.`); // Added for debugging
  try {
    const financialData = await fetchFinancialData(); // Fetch data directly in the page component
    
    return (
      <div className="p-6 space-y-6">
        <Suspense fallback={<AccountingLoading />}>
          {/* Pass fetched data to the client component */}
          <AccountingPageClient initialFinancialData={financialData} />
        </Suspense>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Chart of Accounts */}
          <Link href="/accounting/chart-of-accounts">
            <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium leading-none mb-1">Chart of Accounts</h3>
                    <p className="text-sm text-muted-foreground">View and manage account charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 2. Banking */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Banking</h3>
                  <p className="text-sm text-muted-foreground">Manage bank accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Reconciliation */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Reconciliation</h3>
                  <p className="text-sm text-muted-foreground">Reconcile your accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Budgeting */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Budgeting</h3>
                  <p className="text-sm text-muted-foreground">Manage your budgets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Print Checks */}
          <Link href="/accounting/print-checks">
            <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Printer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium leading-none mb-1">Print Checks</h3>
                    <p className="text-sm text-muted-foreground">Print and manage checks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 6. Bills & Expenses */}
          <Link href="/accounting/bills-expenses">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Bills & Expenses</h3>
                  <p className="text-sm text-muted-foreground">Manage bills and expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
          {/* 7. Open Bills */}
          <Link href="/accounting/open-bills">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Open Bills</h3>
                  <p className="text-sm text-muted-foreground">View and manage open bills</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
          {/* 8. Recurring Transactions */}
          <Link href="/accounting/recurring-transactions">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <CircleDollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Recurring Transactions</h3>
                  <p className="text-sm text-muted-foreground">Manage recurring payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
          {/* 9. Incoming Payments */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Incoming Payments</h3>
                  <p className="text-sm text-muted-foreground">Manage incoming payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10. Outgoing Payments */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <BanknoteIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Outgoing Payments</h3>
                  <p className="text-sm text-muted-foreground">Manage outgoing payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 11. Unpaid Rent */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Unpaid Rent</h3>
                  <p className="text-sm text-muted-foreground">View and manage unpaid rent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 12. Charge & Payments */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Charge & Payments</h3>
                  <p className="text-sm text-muted-foreground">Manage charge payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in AccountingPage fetching data:", error);
    return (
      <div className="p-6 space-y-6">
        <AccountingErrorDisplay 
          errorMessage={(error as Error).message || "An unexpected error occurred while loading accounting data."} 
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Chart of Accounts */}
          <Link href="/accounting/chart-of-accounts">
            <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium leading-none mb-1">Chart of Accounts</h3>
                    <p className="text-sm text-muted-foreground">View and manage account charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 2. Banking */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Banking</h3>
                  <p className="text-sm text-muted-foreground">Manage bank accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Reconciliation */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Reconciliation</h3>
                  <p className="text-sm text-muted-foreground">Reconcile your accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Budgeting */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Budgeting</h3>
                  <p className="text-sm text-muted-foreground">Manage your budgets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Print Checks */}
          <Link href="/accounting/print-checks">
            <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Printer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium leading-none mb-1">Print Checks</h3>
                    <p className="text-sm text-muted-foreground">Print and manage checks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 6. Bills & Expenses */}
          <Link href="/accounting/bills-expenses">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Bills & Expenses</h3>
                  <p className="text-sm text-muted-foreground">Manage bills and expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
          {/* 7. Open Bills */}
          <Link href="/accounting/open-bills">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Open Bills</h3>
                  <p className="text-sm text-muted-foreground">View and manage open bills</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
          {/* 8. Recurring Transactions */}
          <Link href="/accounting/recurring-transactions">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <CircleDollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Recurring Transactions</h3>
                  <p className="text-sm text-muted-foreground">Manage recurring payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
          {/* 9. Incoming Payments */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Incoming Payments</h3>
                  <p className="text-sm text-muted-foreground">Manage incoming payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10. Outgoing Payments */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <BanknoteIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Outgoing Payments</h3>
                  <p className="text-sm text-muted-foreground">Manage outgoing payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 11. Unpaid Rent */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Unpaid Rent</h3>
                  <p className="text-sm text-muted-foreground">View and manage unpaid rent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 12. Charge & Payments */}
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Charge & Payments</h3>
                  <p className="text-sm text-muted-foreground">Manage charge payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}

async function fetchFinancialData(): Promise<FinancialData> {
  try {
    const supabase = await createClient()
    
    // Calculate date range for last 6 months to ensure we have enough data for charts
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)
    
    // Format dates for database query
    const formattedStartDate = startDate.toISOString().split('T')[0]
    const formattedEndDate = endDate.toISOString().split('T')[0]
    
    // Run all queries in parallel for faster loading
    const [expensesResult, revenueResult, accountsReceivableResult] = await Promise.all([
      // Query transactions for expenses
      supabase
        .from('transaction')
        .select('id, transaction_type, data, start_date, due_date')
        .in('transaction_type', ['expense', 'bill', 'check'])
        .gte('start_date', formattedStartDate)
        .lte('start_date', formattedEndDate),
      
      // Query transactions for revenue
      supabase
        .from('transaction')
        .select('id, transaction_type, data, start_date, due_date')
        .in('transaction_type', ['payment', 'receipt', 'charge'])
        .gte('start_date', formattedStartDate)
        .lte('start_date', formattedEndDate),
      
      // Query accounts receivable for outstanding amounts
      supabase
        .from('chart_of_accounts')
        .select('id, account_name, account_balance')
        .eq('account_name', 'Accounts Receivable')
        .single()
    ]);
    
    // Handle potential errors from Supabase queries
    if (expensesResult.error) {
      throw new Error(`Error fetching expenses: ${expensesResult.error.message}`)
    }
    
    if (revenueResult.error) {
      throw new Error(`Error fetching revenue: ${revenueResult.error.message}`)
    }
    
    if (accountsReceivableResult.error && accountsReceivableResult.error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is acceptable for accounts receivable
      throw new Error(`Error fetching accounts receivable: ${accountsReceivableResult.error.message}`)
    }
    
    const expenseTransactions = expensesResult.data || [] as Transaction[];
    const revenueTransactions = revenueResult.data || [] as Transaction[];
    const accountsReceivable = accountsReceivableResult.data;
    
    // Calculate total expenses
    const totalExpenses = expenseTransactions.reduce((sum: number, transaction: Transaction) => {
      const amount = transaction.data?.total_amount || 0
      return sum + Number(amount)
    }, 0)
    
    // Calculate total revenue
    const totalRevenue = revenueTransactions.reduce((sum: number, transaction: Transaction) => {
      const amount = transaction.data?.total_amount || 0
      return sum + Number(amount)
    }, 0)
    
    // Calculate net income
    const netIncome = totalRevenue - totalExpenses
    
    // Get outstanding amount from accounts receivable
    const outstanding = accountsReceivable ? Number(accountsReceivable.account_balance) || 0 : 0
    
    // Format transactions for the client component
    const formattedTransactions = [
      ...expenseTransactions.map(t => ({
        date: t.due_date || t.start_date,
        amount: Number(t.data?.total_amount || 0),
        type: 'expense' as const
      })),
      ...revenueTransactions.map(t => ({
        date: t.due_date || t.start_date,
        amount: Number(t.data?.total_amount || 0),
        type: 'revenue' as const
      }))
    ];
    
    return {
      totalExpenses,
      totalRevenue,
      netIncome,
      outstanding,
      transactions: formattedTransactions
    }
  } catch (error) {
    console.error("Error fetching financial data:", error)
    throw error // Rethrow to be handled by the parent component
  }
} 