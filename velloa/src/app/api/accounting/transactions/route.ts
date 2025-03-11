import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const account_id = searchParams.get("account_id")
    const property_id = searchParams.get("property_id")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")
    const lease_id = searchParams.get("lease_id")
    const transaction_type = searchParams.get("transaction_type")
    const status = searchParams.get("status")

    // The middleware has already authenticated the user
    // We can directly access the user ID using getUser instead of getSession
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 })
    }

    let query = supabase
      .from('transaction')
      .select(`
        id,
        transaction_type,
        property,
        start_date,
        memo,
        payee,
        data,
        created_at,
        created_by,
        reference
      `)
      .eq('company', companyMember.company_id)

    // Apply filters
    if (account_id) {
      query = query.contains('data', { lines: [{ category: account_id }] })
    }

    if (property_id) {
      query = query.eq('property', property_id)
    }

    const unit_id = searchParams.get("unit_id")
    if (unit_id) {
      query = query.contains('data', { unit: unit_id })
    }

    if (lease_id) {
      query = query.contains('data', { lease_id: lease_id })
    }

    const portfolio_id = searchParams.get("portfolio_id")
    if (portfolio_id) {
      query = query.eq('portfolio', portfolio_id)
    }

    const owner_id = searchParams.get("owner_id")
    if (owner_id) {
      query = query.eq('owner', owner_id)
    }

    const vendor_id = searchParams.get("vendor_id")
    if (vendor_id) {
      query = query.eq('vendor', vendor_id)
    }

    const tenant_id = searchParams.get("tenant_id")
    if (tenant_id) {
      query = query.eq('tenant', tenant_id)
    }

    const payment_method = searchParams.get("payment_method")
    if (payment_method && payment_method !== 'all') {
      query = query.eq('payment_method', payment_method)
    }

    const beginning_balance = searchParams.get("beginning_balance")
    if (beginning_balance) {
      switch (beginning_balance) {
        case 'positive':
          query = query.gt('data->total_amount', 0)
          break
        case 'negative':
          query = query.lt('data->total_amount', 0)
          break
        case 'zero':
          query = query.eq('data->total_amount', 0)
          break
      }
    }

    if (start_date) {
      query = query.gte('start_date', start_date)
    }

    if (end_date) {
      query = query.lte('start_date', end_date)
    }

    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type)
    }

    if (status) {
      query = query.contains('data', { status: status })
    }

    // Order by date
    query = query.order('start_date', { ascending: false })

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error in transactions route:", error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic' 