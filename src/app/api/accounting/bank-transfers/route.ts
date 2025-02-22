import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface BankTransferRequest {
  source_property_id: string
  source_unit_id?: string
  source_account_id: string
  receiving_property_id: string
  receiving_unit_id?: string
  receiving_account_id: string
  transfer_date: string
  amount: number
  memo?: string
  reference: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json() as BankTransferRequest

    const {
      source_property_id,
      source_unit_id,
      source_account_id,
      receiving_property_id,
      receiving_unit_id,
      receiving_account_id,
      transfer_date,
      amount,
      memo,
      reference
    } = body

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
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

    // Create transaction lines with debit and credit
    const transactionLines = [
      {
        unit: source_unit_id || "",
        category: source_account_id,
        description: "Transfer to account",
        debit_amount: 0,
        credit_amount: amount // Source account gets credited (money leaves)
      },
      {
        unit: receiving_unit_id || "",
        category: receiving_account_id,
        description: "Transfer from account",
        debit_amount: amount, // Receiving account gets debited (money comes in)
        credit_amount: 0
      }
    ]

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: "bank_transfer",
        property: source_property_id,
        start_date: transfer_date,
        memo: memo ? JSON.parse(memo) : null,
        created_by: user.id,
        company: companyMember.company_id,
        reference: reference,
        payee: null,
        data: {
          total_amount: amount,
          lines: transactionLines,
          payment_method: "bank_transfer"
        }
      })
      .select()
      .single()

    if (transactionError) {
      throw new Error(transactionError.message)
    }

    // Update account balances
    for (const line of transactionLines) {
      const { category, debit_amount, credit_amount } = line
      const amount = debit_amount - credit_amount // Positive for debits, negative for credits
      const property_id = category === source_account_id ? source_property_id : receiving_property_id

      // First try to find and update sub-account
      const { data: subAccount, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .select('id, account_balance, property_balance, parent_account')
        .eq('id', category)
        .single()

      if (!subAccountError && subAccount) {
        // Update sub-account balance
        const currentBalance = parseFloat(subAccount.account_balance) || 0
        const newBalance = currentBalance + amount

        // Update property balance in the property_balance JSONB array
        const propertyBalance = subAccount.property_balance || []
        const propertyIndex = propertyBalance.findIndex((pb: { property_id: string }) => pb.property_id === property_id)
        
        if (propertyIndex >= 0) {
          // Update existing property balance
          propertyBalance[propertyIndex] = {
            ...propertyBalance[propertyIndex],
            balance: parseFloat(propertyBalance[propertyIndex].balance) + amount
          }
        } else {
          // Get property name
          const { data: property } = await supabase
            .from('properties')
            .select('name')
            .eq('id', property_id)
            .single()

          // Add new property balance
          propertyBalance.push({
            balance: amount,
            property_id,
            property_name: property?.name
          })
        }

        // Update both account_balance and property_balance
        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update({ 
            account_balance: newBalance.toString(), // Convert to string to match numeric type
            property_balance: propertyBalance
          })
          .eq('id', category)

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError)
          throw new Error('Failed to update account balance')
        }

        // Also update the parent account's account_balance if it exists
        if (subAccount.parent_account) {
          const { data: parentAccount, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance')
            .eq('id', subAccount.parent_account)
            .single()

          if (!parentError && parentAccount) {
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0
            const parentNewBalance = parentCurrentBalance + amount

            const { error: parentUpdateError } = await supabase
              .from('chart_of_accounts')
              .update({ 
                account_balance: parentNewBalance.toString()
              })
              .eq('id', subAccount.parent_account)

            if (parentUpdateError) {
              console.error('Error updating parent account balance:', parentUpdateError)
              throw new Error('Failed to update parent account balance')
            }
          }
        }

        continue // Skip main account update if sub-account was found and updated
      }

      // If not found in sub-accounts, try main accounts
      const { data: mainAccount, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, property_balance')
        .eq('id', category)
        .single()

      if (mainAccountError || !mainAccount) {
        console.error('Error finding account:', mainAccountError)
        throw new Error('Account not found')
      }

      // Update main account balance
      const currentBalance = parseFloat(mainAccount.account_balance) || 0
      const newBalance = currentBalance + amount

      // Update property balance in the property_balance JSONB array
      const propertyBalance = mainAccount.property_balance || []
      const propertyIndex = propertyBalance.findIndex((pb: { property_id: string }) => pb.property_id === property_id)
      
      if (propertyIndex >= 0) {
        // Update existing property balance
        propertyBalance[propertyIndex] = {
          ...propertyBalance[propertyIndex],
          balance: parseFloat(propertyBalance[propertyIndex].balance) + amount
        }
      } else {
        // Get property name
        const { data: property } = await supabase
          .from('properties')
          .select('name')
          .eq('id', property_id)
          .single()

        // Add new property balance
        propertyBalance.push({
          balance: amount,
          property_id,
          property_name: property?.name
        })
      }

      // Update both account_balance and property_balance
      const { error: updateError } = await supabase
        .from('chart_of_accounts')
        .update({ 
          account_balance: newBalance.toString(), // Convert to string to match numeric type
          property_balance: propertyBalance
        })
        .eq('id', category)

      if (updateError) {
        console.error('Error updating main account balance:', updateError)
        throw new Error('Failed to update account balance')
      }
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error creating bank transfer:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create bank transfer" },
      { status: 500 }
    )
  }
} 