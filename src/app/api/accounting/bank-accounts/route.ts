import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface PropertyBalance {
  property_id: string
  property_name: string
  balance: number
}

interface SubAccount {
  id: string
  account_name: string
  account_subtype: string
  account_balance: number
  property_balance: PropertyBalance[]
  active_account: boolean
}

interface BankAccount {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_balance: number
  property_balance: PropertyBalance[]
  sub_accounts?: SubAccount[]
}

interface TransformedBankAccount {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_balance: number
  property_balance: PropertyBalance[]
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (companyError) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 })
    }

    // Get bank accounts with their property balances
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select(`
        id,
        account_name,
        account_type,
        account_subtype,
        account_balance,
        property_balance,
        sub_accounts:chart_of_sub_accounts!chart_of_sub_accounts_parent_account_fkey(
          id,
          account_name,
          account_subtype,
          account_balance,
          property_balance,
          active_account
        )
      `)
      .eq('company_id', companyMember.company_id)
      .eq('account_type', 'Asset')
      .eq('account_subtype', 'Bank')
      .eq('active_account', true)

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    // Filter and transform accounts based on property_id if provided
    const transformedAccounts = accounts.reduce((acc: TransformedBankAccount[], account: BankAccount) => {
      const accounts: TransformedBankAccount[] = []
      
      // Check if main account has property balance for the selected property
      const hasPropertyBalance = !propertyId || 
        (account.property_balance && account.property_balance.some((pb: PropertyBalance) => pb.property_id === propertyId))
      
      if (hasPropertyBalance) {
        accounts.push({
          id: account.id,
          account_name: account.account_name,
          account_type: account.account_type,
          account_subtype: account.account_subtype,
          account_balance: account.account_balance,
          property_balance: account.property_balance
        })
      }
      
      // Add sub-accounts if they exist and have property balance
      if (account.sub_accounts) {
        const filteredSubAccounts = account.sub_accounts
          .filter(sub => 
            sub.active_account && 
            (!propertyId || (sub.property_balance && sub.property_balance.some((pb: PropertyBalance) => pb.property_id === propertyId)))
          )
          .map(sub => ({
            id: sub.id,
            account_name: `${account.account_name} - ${sub.account_name}`,
            account_type: account.account_type,
            account_subtype: sub.account_subtype,
            account_balance: sub.account_balance,
            property_balance: sub.property_balance
          }))
        
        accounts.push(...filteredSubAccounts)
      }
      
      return [...acc, ...accounts]
    }, [])

    return NextResponse.json(transformedAccounts)
  } catch (error) {
    console.error("Error in bank accounts API:", error)
    return NextResponse.json(
      { error: "Failed to fetch bank accounts" },
      { status: 500 }
    )
  }
} 