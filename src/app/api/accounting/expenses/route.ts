import { NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'

interface ExpenseLine {
  category: string
  property: string
  unit: string
  description: string
  amount: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const data = await request.json()

    const {
      payee,
      expense_type,
      expense_date,
      start_date,
      end_date,
      frequency,
      repeat_forever,
      payment_method,
      pay_from_account,
      lines,
      memo,
      reference
    } = data

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

    // Calculate total amount
    const totalAmount = lines.reduce((sum: number, line: ExpenseLine) => {
      return sum + (parseFloat(line.amount) || 0)
    }, 0)

    // Transform expense lines into transaction lines with debit and credit
    const transactionLines = lines.map((line: ExpenseLine) => ({
      unit: line.unit || "",
      category: line.category,
      description: line.description,
      debit_amount: parseFloat(line.amount) || 0, // Expense categories get debited
      credit_amount: 0
    }))

    // Add the bank account line (credit)
    transactionLines.unshift({
      unit: "",
      category: pay_from_account,
      description: "Payment from account",
      debit_amount: 0,
      credit_amount: totalAmount // Bank account gets credited
    })

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: "expense",
        property: lines[0]?.property || null,
        payee: payee,
        start_date: expense_type === "one_time" ? expense_date : start_date,
        due_date: end_date,
        repeat_infinite: repeat_forever,
        frequency: frequency,
        frequency_type: expense_type,
        memo: memo ? JSON.parse(memo) : null,
        created_by: user.id,
        company: companyMember.company_id,
        reference: reference,
        data: {
          payment_method,
          total_amount: totalAmount,
          lines: transactionLines
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

      // First try to find and update sub-account
      const { data: subAccount, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .select('id, account_balance')
        .eq('id', category)
        .single()

      if (!subAccountError && subAccount) {
        // Update sub-account balance
        const currentBalance = parseFloat(subAccount.account_balance) || 0
        const newBalance = currentBalance + amount

        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update({ account_balance: newBalance.toString() })
          .eq('id', category)

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError)
          throw new Error('Failed to update account balance')
        }
        continue // Skip main account update if sub-account was found and updated
      }

      // If not found in sub-accounts, try main accounts
      const { data: mainAccount, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance')
        .eq('id', category)
        .single()

      if (mainAccountError || !mainAccount) {
        console.error('Error finding account:', mainAccountError)
        throw new Error('Account not found')
      }

      // Update main account balance
      const currentBalance = parseFloat(mainAccount.account_balance) || 0
      const newBalance = currentBalance + amount

      const { error: updateError } = await supabase
        .from('chart_of_accounts')
        .update({ account_balance: newBalance.toString() })
        .eq('id', category)

      if (updateError) {
        console.error('Error updating main account balance:', updateError)
        throw new Error('Failed to update account balance')
      }
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create expense" },
      { status: 500 }
    )
  }
} 