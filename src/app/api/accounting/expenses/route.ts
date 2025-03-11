import { NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'

interface PropertyBalance {
  property_id: string;
  property_name: string;
  balance: number;
}

interface ExpenseLine {
  category: string
  property: string
  unit: string
  description: string
  credit_amount: number
}

interface TransactionLine {
  unit: string;
  category: string;
  property: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
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

    // Get the property ID from the first line
    const property_id = lines[0]?.property
    if (!property_id || property_id.trim() === '') {
      return NextResponse.json(
        { error: 'Please select a property for this expense' },
        { status: 400 }
      )
    }

    // Calculate total amount from expense lines
    const totalAmount = lines.reduce((sum: number, line: ExpenseLine) => {
      return sum + (line.credit_amount || 0)
    }, 0)

    // Transform expense lines into transaction lines with debit and credit
    const transactionLines: TransactionLine[] = []

    // Add bank account line (credit entry - money going out)
    transactionLines.push({
      unit: "",
      category: pay_from_account,
      property: property_id,
      description: "Payment from account",
      debit_amount: 0,
      credit_amount: totalAmount // Bank account gets credited
    })

    // Add expense lines (debit entries - money being spent)
    lines.forEach((line: ExpenseLine) => {
      const lineAmount = line.credit_amount || 0
      if (lineAmount > 0 && line.category !== pay_from_account) {
        transactionLines.push({
          unit: line.unit || "",
          category: line.category,
          property: property_id,
          description: line.description || "",
          debit_amount: lineAmount, // Expense gets debited
          credit_amount: 0
        })
      }
    })

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: "expense",
        property: property_id,
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
      
      console.log('Processing line:', { category, debit_amount, credit_amount, amount, property_id })

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
        let propertyBalance = Array.isArray(subAccount.property_balance) ? subAccount.property_balance : []
        
        const propertyIndex = propertyBalance.findIndex((pb: PropertyBalance) => pb.property_id === property_id)
        if (propertyIndex >= 0) {
          // Update existing property balance
          const currentPropertyBalance = Number(propertyBalance[propertyIndex].balance) || 0
          const newPropertyBalance = currentPropertyBalance + amount
          
          propertyBalance = propertyBalance.map((pb: PropertyBalance) => 
            pb.property_id === property_id 
              ? { ...pb, balance: newPropertyBalance }
              : pb
          )
        } else {
          // Get property name
          const { data: property } = await supabase
            .from('properties')
            .select('name')
            .eq('id', property_id)
            .single()
          
          propertyBalance = [
            ...propertyBalance,
            {
              property_id,
              property_name: property?.name || '',
              balance: amount
            }
          ]
        }

        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update({ 
            account_balance: newBalance.toString(),
            property_balance: propertyBalance
          })
          .eq('id', category)

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError)
          throw new Error('Failed to update account balance')
        }

        // Update parent account if it exists
        if (subAccount.parent_account) {
          const { data: parentAccount, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance, property_balance')
            .eq('id', subAccount.parent_account)
            .single()

          if (!parentError && parentAccount) {
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0
            const parentNewBalance = parentCurrentBalance + amount

            let parentPropertyBalance = parentAccount.property_balance || []
            const propertyIndex = parentPropertyBalance.findIndex((pb: PropertyBalance) => pb.property_id === property_id)
            
            if (propertyIndex >= 0) {
              const currentPropertyBalance = Number(parentPropertyBalance[propertyIndex].balance) || 0
              const newPropertyBalance = currentPropertyBalance + amount
              
              parentPropertyBalance = parentPropertyBalance.map((pb: PropertyBalance) => 
                pb.property_id === property_id 
                  ? { ...pb, balance: newPropertyBalance }
                  : pb
              )
            } else {
              const { data: property } = await supabase
                .from('properties')
                .select('name')
                .eq('id', property_id)
                .single()
              
              parentPropertyBalance = [
                ...parentPropertyBalance,
                {
                  property_id,
                  property_name: property?.name || '',
                  balance: amount
                }
              ]
            }

            const { error: parentUpdateError } = await supabase
              .from('chart_of_accounts')
              .update({ 
                account_balance: parentNewBalance.toString(),
                property_balance: parentPropertyBalance
              })
              .eq('id', subAccount.parent_account)

            if (parentUpdateError) {
              console.error('Error updating parent account balance:', parentUpdateError)
              throw new Error('Failed to update parent account balance')
            }
          }
        }

        continue
      }

      // If not found in sub-accounts, update main account
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

      // Update property balance
      let propertyBalance = Array.isArray(mainAccount.property_balance) ? mainAccount.property_balance : []
      const propertyIndex = propertyBalance.findIndex((pb: PropertyBalance) => pb.property_id === property_id)
      
      if (propertyIndex >= 0) {
        const currentPropertyBalance = Number(propertyBalance[propertyIndex].balance) || 0
        const newPropertyBalance = currentPropertyBalance + amount
        
        propertyBalance = propertyBalance.map((pb: PropertyBalance) => 
          pb.property_id === property_id 
            ? { ...pb, balance: newPropertyBalance }
            : pb
        )
      } else {
        const { data: property } = await supabase
          .from('properties')
          .select('name')
          .eq('id', property_id)
          .single()
        
        propertyBalance = [
          ...propertyBalance,
          {
            property_id,
            property_name: property?.name || '',
            balance: amount
          }
        ]
      }

      const { error: updateError } = await supabase
        .from('chart_of_accounts')
        .update({ 
          account_balance: newBalance.toString(),
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
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create expense" },
      { status: 500 }
    )
  }
} 