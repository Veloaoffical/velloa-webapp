import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    // Create Supabase client
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single()

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError)
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 })
    }

    // Fetch transactions that represent undeposited funds
    // These are typically payments that haven't been deposited to a bank account yet
    const { data: transactions, error: transactionsError } = await supabase
      .from('transaction')
      .select(`
        id,
        property,
        start_date,
        data,
        memo
      `)
      .eq('company', companyMember.company_id)
      // Filter for payment transactions that haven't been deposited yet
      .in('transaction_type', ['payment', 'receipt'])
      .not('data->is_deposited', 'eq', true)
      .order('start_date', { ascending: false })

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch pending deposits' }, { status: 500 })
    }

    // Get property IDs from transactions to fetch property names
    const propertyIds = transactions
      .map(transaction => transaction.property)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    // Fetch property names if there are property IDs
    let propertyMap: Record<string, string> = {}
    if (propertyIds.length > 0) {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name')
        .in('id', propertyIds)

      if (!propertiesError && properties) {
        propertyMap = properties.reduce((map: Record<string, string>, property) => {
          map[property.id] = property.name
          return map
        }, {})
      }
    }

    // Transform the transactions into the format expected by the client
    const pendingDeposits = transactions.map(transaction => {
      // Extract payment method from transaction data
      const paymentMethod = transaction.data?.payment_method || 'unknown'
      
      // Extract amount from transaction data
      const amount = transaction.data?.total_amount?.toString() || '0.00'
      
      // Extract description from memo or use a default
      const description = transaction.memo?.content || 
                          (transaction.data?.description || 
                          (paymentMethod === 'check' ? 'Security Deposit' : 'Rent Payment'))
      
      // Extract unit information if available
      const unit = transaction.data?.unit || ''
      
      // Extract received from information if available
      const receivedFrom = transaction.data?.received_from || ''

      // Get property name from the map
      const propertyName = propertyMap[transaction.property] || ''

      return {
        id: transaction.id,
        property: transaction.property,
        unit: unit,
        receivedFrom: receivedFrom,
        paymentMethod: paymentMethod,
        amount: amount,
        description: description,
        propertyName: propertyName
      }
    })

    return NextResponse.json(pendingDeposits)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 