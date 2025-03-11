import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = session.user

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 })
    }

    // Calculate date range for last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Format dates for database query
    const formattedStartDate = startDate.toISOString().split('T')[0]
    const formattedEndDate = endDate.toISOString().split('T')[0]

    // Query transactions that are expenses from the last 30 days
    const { data: transactions, error: transactionsError } = await supabase
      .from('transaction')
      .select(`
        id,
        transaction_type,
        data
      `)
      .eq('company', companyMember.company_id)
      .in('transaction_type', ['expense', 'bill', 'check']) // Include all expense-type transactions
      .gte('start_date', formattedStartDate)
      .lte('start_date', formattedEndDate)

    if (transactionsError) {
      console.error('Error fetching expense transactions:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch expense data' },
        { status: 500 }
      )
    }

    // Calculate total expenses
    const totalExpenses = transactions.reduce((sum, transaction) => {
      // Get the total amount from transaction data
      const amount = transaction.data?.total_amount || 0
      return sum + Number(amount)
    }, 0)

    return NextResponse.json({
      totalExpenses,
      transactionCount: transactions.length,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    })
  } catch (error) {
    console.error("Error in expenses summary route:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 