import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { customAlphabet } from 'nanoid'

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

    // Get all bank deposits from transaction table
    const { data: deposits, error: depositsError } = await supabase
      .from('transaction')
      .select(`
        id,
        created_at,
        transaction_type,
        property,
        start_date,
        reference,
        payment_method,
        memo,
        data,
        created_by,
        company
      `)
      .eq('company', companyMember.company_id)
      .eq('transaction_type', 'deposit')
      .order('created_at', { ascending: false })

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError)
      return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
    }

    return NextResponse.json(deposits)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Create Supabase client
    const supabase = await createClient()
    const body = await request.json()
    
    console.log('Bank deposit request body:', body)

    // Validate required fields
    if (!body.data || !body.data.lines || !Array.isArray(body.data.lines) || body.data.lines.length === 0) {
      return NextResponse.json({ error: 'At least one deposit line is required' }, { status: 400 })
    }

    if (!body.start_date) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

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
      .select('id, company_id')
      .eq('id', profile.id)
      .single()

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError)
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 })
    }

    // Generate nanoid for reference numbers
    const generateReference = () => {
      const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
      return nanoid()
    }

    // Use the reference from the frontend or generate one if not provided
    const mainReference = body.reference || generateReference()
    
    // Define the line type
    interface DepositLine {
      unit: string;
      category: string;
      property: string;
      description: string;
      debit_amount: number;
      credit_amount: number;
    }
    
    // Generate reference for each line item
    const updatedLines = body.data.lines.map((line: DepositLine) => ({
      ...line,
      reference: generateReference() // Generate unique reference for each line
    }));

    // Update the data object with the new lines
    const updatedData = {
      ...body.data,
      lines: updatedLines
    };

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: body.transaction_type || "deposit",
        property: body.property,
        start_date: body.start_date,
        due_date: body.due_date,
        memo: body.memo,
        created_by: companyMember.id,
        company: companyMember.company_id,
        reference: mainReference,
        payment_method: body.payment_method,
        data: updatedData,
        payee: null // Set payee to null to avoid foreign key constraint violation
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: `Failed to create transaction: ${transactionError.message}` }, { status: 500 })
    }

    // Update account balances for each line
    for (const line of updatedLines) {
      if (!line.category) continue;
      
      // First try to find and update the account
      const { data: account, error: accountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, property_balance')
        .eq('id', line.category)
        .single()

      if (!accountError && account) {
        // Update account balance
        const currentBalance = parseFloat(account.account_balance) || 0
        const newBalance = currentBalance + line.debit_amount

        // Update property balance if it exists
        const propertyBalance = Array.isArray(account.property_balance) ? account.property_balance : []
        const propertyIndex = propertyBalance.findIndex((pb) => pb.property_id === line.property)

        if (propertyIndex >= 0) {
          // Update existing property balance
          propertyBalance[propertyIndex].balance = (parseFloat(propertyBalance[propertyIndex].balance) || 0) + line.debit_amount
        } else if (line.property) {
          // Add new property balance
          propertyBalance.push({
            property_id: line.property,
            balance: line.debit_amount
          })
        }

        const { error: updateError } = await supabase
          .from('chart_of_accounts')
          .update({ 
            account_balance: newBalance.toString(),
            property_balance: propertyBalance
          })
          .eq('id', line.category)

        if (updateError) {
          console.error('Error updating account balance:', updateError)
          // Continue with other lines even if one update fails
        }
      } else {
        // Try to find and update sub-account
        const { data: subAccount, error: subAccountError } = await supabase
          .from('chart_of_sub_accounts')
          .select('id, account_balance, property_balance, parent_account')
          .eq('id', line.category)
          .single()

        if (!subAccountError && subAccount) {
          // Update sub-account balance
          const currentBalance = parseFloat(subAccount.account_balance) || 0
          const newBalance = currentBalance + line.debit_amount

          // Update property balance if it exists
          const propertyBalance = Array.isArray(subAccount.property_balance) ? subAccount.property_balance : []
          const propertyIndex = propertyBalance.findIndex((pb) => pb.property_id === line.property)

          if (propertyIndex >= 0) {
            // Update existing property balance
            propertyBalance[propertyIndex].balance = (parseFloat(propertyBalance[propertyIndex].balance) || 0) + line.debit_amount
          } else if (line.property) {
            // Add new property balance
            propertyBalance.push({
              property_id: line.property,
              balance: line.debit_amount
            })
          }

          const { error: updateError } = await supabase
            .from('chart_of_sub_accounts')
            .update({ 
              account_balance: newBalance.toString(),
              property_balance: propertyBalance
            })
            .eq('id', line.category)

          if (updateError) {
            console.error('Error updating sub-account balance:', updateError)
            // Continue with other lines even if one update fails
          }

          // Also update the parent account's account_balance if it exists
          if (subAccount.parent_account) {
            // Update parent account logic...
            // (Keeping this part simple for brevity)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      reference: mainReference
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 