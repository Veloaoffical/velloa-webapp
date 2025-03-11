import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import AccountingPageClient from "./accounting-page-client"

// Define interface for financial data
export interface FinancialData {
  totalExpenses: number;
  totalRevenue: number;
  netIncome: number;
  outstanding: number;
}

// Define transaction interface to avoid using 'any'
interface Transaction {
  id: string;
  transaction_type: string;
  data?: {
    total_amount?: number | string;
    [key: string]: unknown;
  };
}

// Loading component for SSR
function AccountingLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
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

export default async function AccountingPageServer() {
  try {
    return (
      <Suspense fallback={<AccountingLoading />}>
        <AccountingContent />
      </Suspense>
    )
  } catch (error) {
    console.error("Error in AccountingPageServer:", error);
    return <AccountingErrorDisplay errorMessage={(error as Error).message || "An unexpected error occurred"} />;
  }
}

// Main content component with data fetching
async function AccountingContent() {
  try {
    // Fetch financial data on the server
    const financialData = await fetchFinancialData()
    
    // Pass the data to the client component
    return <AccountingPageClient initialFinancialData={financialData} />
  } catch (error) {
    console.error("Error in AccountingContent:", error);
    return <AccountingErrorDisplay errorMessage={(error as Error).message || "Failed to load financial data"} />;
  }
}

async function fetchFinancialData(): Promise<FinancialData> {
  try {
    const supabase = await createClient()
    
    // Calculate date range for last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    // Format dates for database query
    const formattedStartDate = startDate.toISOString().split('T')[0]
    const formattedEndDate = endDate.toISOString().split('T')[0]
    
    // Run all queries in parallel for faster loading
    const [expensesResult, revenueResult, accountsReceivableResult] = await Promise.all([
      // Query transactions for expenses
      supabase
        .from('transaction')
        .select('id, transaction_type, data')
        .in('transaction_type', ['expense', 'bill', 'check'])
        .gte('start_date', formattedStartDate)
        .lte('start_date', formattedEndDate),
      
      // Query transactions for revenue
      supabase
        .from('transaction')
        .select('id, transaction_type, data')
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
    
    return {
      totalExpenses,
      totalRevenue,
      netIncome,
      outstanding
    }
  } catch (error) {
    console.error("Error fetching financial data:", error)
    throw error // Rethrow to be handled by the parent component
  }
} 