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
  amount: string
}

interface TransactionLine {
  unit: string;
  category: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  property: string;
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

    // Get the property ID from the first line
    const property_id = lines[0]?.property
    if (!property_id || property_id.trim() === '') {
      return NextResponse.json(
        { error: 'Please select a property for this expense' },
        { status: 400 }
      )
    }

    // Transform expense lines into transaction lines with debit and credit
    const transactionLines: TransactionLine[] = lines.map((line: ExpenseLine) => ({
      unit: line.unit || "",
      category: line.category,
      description: line.description,
      debit_amount: parseFloat(line.amount) || 0, // Expense categories get debited
      credit_amount: 0,
      property: property_id // Add property ID to each line
    }))

    // Add the bank account line (credit)
    transactionLines.unshift({
      unit: "",
      category: pay_from_account,
      description: "Payment from account",
      debit_amount: 0,
      credit_amount: totalAmount, // Bank account gets credited
      property: property_id // Add property ID to bank account line
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
      
      console.log('Processing line for property:', property_id)
      console.log('Line details:', { category, debit_amount, credit_amount, amount, property_id })

      // Determine if this is a bank account being credited
      const isBankAccount = category === pay_from_account
      // For property balances:
      // - For bank accounts (pay from account): Subtract the credit amount (money going out)
      // - For expense accounts: Add the debit amount (money being spent)
      const propertyBalanceAmount = isBankAccount ? -credit_amount : debit_amount
      console.log('Property balance adjustment:', {
        isBankAccount,
        credit_amount,
        debit_amount,
        propertyBalanceAmount,
        category,
        pay_from_account,
        property_id
      })

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
        console.log('Before update - Property Balance:', propertyBalance)
        
        const propertyIndex = propertyBalance.findIndex((pb: { property_id: string }) => pb.property_id === property_id)
        if (propertyIndex >= 0) {
          // Update existing property balance
          const currentBalance = Number(propertyBalance[propertyIndex].balance) || 0
          // For bank accounts, we subtract from the balance
          // For expense accounts, we add to the balance
          const newPropertyBalance = isBankAccount 
            ? currentBalance - credit_amount  // Subtract for bank accounts
            : currentBalance + debit_amount   // Add for expense accounts
          
          console.log('Updating balance:', {
            currentBalance,
            operation: isBankAccount ? 'subtract' : 'add',
            amount: isBankAccount ? credit_amount : debit_amount,
            newPropertyBalance,
            property_id
          })
          
          // Create a new array with the updated balance
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
          
          // For a new property balance entry
          propertyBalance = [
            ...propertyBalance,
            {
              property_id,
              property_name: property?.name || '',
              balance: isBankAccount ? -credit_amount : debit_amount
            }
          ]
        }
        
        console.log('After update - Property Balance to save:', propertyBalance)

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

        // Also update the parent account's account_balance and property_balance if it exists
        if (subAccount.parent_account) {
          const { data: parentAccount, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance, property_balance')
            .eq('id', subAccount.parent_account)
            .single()

          if (!parentError && parentAccount) {
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0
            const parentNewBalance = parentCurrentBalance + amount

            // Update parent's property balance
            let parentPropertyBalance = parentAccount.property_balance || []
            console.log('Before update - Parent Property Balance:', parentPropertyBalance)
            
            const propertyIndex = parentPropertyBalance.findIndex((pb: { property_id: string }) => pb.property_id === property_id)
            if (propertyIndex >= 0) {
              // Update existing property balance
              const currentBalance = Number(parentPropertyBalance[propertyIndex].balance) || 0
              // For bank accounts, we subtract from the balance
              // For expense accounts, we add to the balance
              const newPropertyBalance = isBankAccount 
                ? currentBalance - credit_amount  // Subtract for bank accounts
                : currentBalance + debit_amount   // Add for expense accounts
              
              console.log('Updating parent balance:', {
                currentBalance,
                operation: isBankAccount ? 'subtract' : 'add',
                amount: isBankAccount ? credit_amount : debit_amount,
                newPropertyBalance,
                property_id
              })
              
              // Create a new array with the updated balance
              parentPropertyBalance = parentPropertyBalance.map((pb: PropertyBalance) => 
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
              
              // For a new property balance entry
              parentPropertyBalance = [
                ...parentPropertyBalance,
                {
                  property_id,
                  property_name: property?.name || '',
                  balance: isBankAccount ? -credit_amount : debit_amount
                }
              ]
            }
            
            console.log('After update - Parent Property Balance to save:', parentPropertyBalance)

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
      let propertyBalance = Array.isArray(mainAccount.property_balance) ? mainAccount.property_balance : []
      console.log('Before update - Main Account Property Balance:', propertyBalance)
      const propertyIndex = propertyBalance.findIndex((pb: { property_id: string }) => pb.property_id === property_id)
      if (propertyIndex >= 0) {
        // Update existing property balance
        const currentBalance = Number(propertyBalance[propertyIndex].balance) || 0
        // For bank accounts, we subtract from the balance
        // For expense accounts, we add to the balance
        const newPropertyBalance = isBankAccount 
          ? currentBalance - credit_amount  // Subtract for bank accounts
          : currentBalance + debit_amount   // Add for expense accounts
        
        console.log('Updating main account balance:', {
          currentBalance,
          operation: isBankAccount ? 'subtract' : 'add',
          amount: isBankAccount ? credit_amount : debit_amount,
          newPropertyBalance,
          property_id
        })
        
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
        
        // For a new property balance entry
        propertyBalance = [
          ...propertyBalance,
          {
            property_id,
            property_name: property?.name || '',
            balance: isBankAccount ? -credit_amount : debit_amount
          }
        ]
      }
      console.log('After update - Main Account Property Balance to save:', propertyBalance)

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