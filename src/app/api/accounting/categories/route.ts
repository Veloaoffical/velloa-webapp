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
    
    // Get the user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (companyError) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 })
    }

    // Get main accounts with their sub-accounts
    const { data: mainAccounts, error: mainAccountsError } = await supabase
      .from('chart_of_accounts')
      .select(`
        id,
        account_name,
        account_type,
        account_subtype,
        account_balance,
        start_balance,
        property_balance,
        start_property_balance,
        sub_accounts:chart_of_sub_accounts!chart_of_sub_accounts_parent_account_fkey(
          id,
          account_name,
          account_subtype,
          account_balance,
          active_account,
          start_balance,
          property_balance,
          start_property_balance
        )
      `)
      .eq('company_id', companyMember.company_id)
      .eq('active_account', true)
      .order('account_type')
      .order('account_name')

    if (mainAccountsError) {
      console.error('Error fetching accounts:', mainAccountsError)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    // Transform the data to match the interface and filter active sub-accounts
    const transformedAccounts = mainAccounts.map(account => ({
      id: account.id,
      account_name: account.account_name,
      account_type: account.account_type,
      account_subtype: account.account_subtype,
      account_balance: account.account_balance,
      start_balance: account.start_balance,
      property_balance: account.property_balance,
      start_property_balance: account.start_property_balance,
      sub_accounts: account.sub_accounts
        ?.filter(sub => sub.active_account)
        ?.map(sub => ({
          id: sub.id,
          account_name: sub.account_name,
          account_subtype: sub.account_subtype,
          account_balance: sub.account_balance,
          start_balance: sub.start_balance,
          property_balance: sub.property_balance,
          start_property_balance: sub.start_property_balance
        }))
    }))

    return NextResponse.json(transformedAccounts)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
} 