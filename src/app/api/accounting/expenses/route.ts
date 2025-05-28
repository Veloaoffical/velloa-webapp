import { NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'
import { customAlphabet } from "nanoid"

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

interface PropertyBalance {
  property_id: string;
  property_name: string;
  balance: number;
}

interface TransactionLine {
  unit: string;
  category: string;
  property: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  reference?: string;
}

// Define interface for expense line from request
interface ExpenseLineRequest {
  amount: number;
  category_id: string;
  property_id: string;
  unit_id?: string | null;
  description?: string;
}

// Define interface for charge data
interface ChargeData {
  company_id: string;
  people_id: string;
  bill_date: string;
  due_date: string;
  payee: string | null;
  property_id: string | null;
  charge_amount: {
    lines: {
      line_id: string;
      amount: number;
      category: string;
      reference: string;
      description?: string;
      property_id: string | null;
      unit_id: string | null;
    }[];
    total_amount: number;
    accounts_payable_id?: string;
  };
  amount_remaining: {
    lines: {
      line_id: string;
      amount: number;
      category: string;
      reference: string;
      description?: string;
      property_id: string | null;
      unit_id: string | null;
    }[];
    total_amount: number;
    accounts_payable_id?: string;
  };
  memo?: unknown;
  reference?: string;
  status: string;
  created_by: string;
  start_date?: string;
  frequency?: string;
  repeat_infinite?: boolean;
  unit_id: string | null;
  charge_type: string;
  transaction_id?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const data = await request.json()

    const {
      people_id,
      bill_date,
      due_date,
      lines,
      memo,
      reference,
      status,
      charge_type,
      payment_method,
      pay_from_account,
      start_date,
      frequency,
      repeat_infinite
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

    const company_id = companyMember.company_id

    // Get the property ID from the first line
    const property_id = lines[0]?.property_id
    if (!property_id || property_id.trim() === '') {
      return NextResponse.json(
        { error: 'Please select a property for this expense' },
        { status: 400 }
      )
    }

    // Calculate total amount from expense lines
    const totalAmount = lines.reduce((sum: number, line: ExpenseLineRequest) => {
      return sum + (line.amount || 0)
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
      credit_amount: totalAmount, // Bank account gets credited
      reference: nanoid()
    })

    // Add expense lines (debit entries - money being spent)
    lines.forEach((line: ExpenseLineRequest) => {
      const lineAmount = line.amount || 0
      if (lineAmount > 0 && line.category_id !== pay_from_account) {
        transactionLines.push({
          unit: line.unit_id || "",
          category: line.category_id,
          property: property_id,
          description: line.description || "",
          debit_amount: lineAmount, // Expense gets debited
          credit_amount: 0,
          reference: nanoid()
        })
      }
    })

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transaction")
      .insert({
        transaction_type: "expense",
        property: property_id,
        payee: people_id,
        start_date: bill_date,
        due_date: due_date || bill_date,
        repeat_infinite: repeat_infinite,
        frequency: frequency,
        frequency_type: frequency ? "recurring" : "one_time",
        memo: memo,
        created_by: user.id,
        company: company_id,
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

        continue // Skip main account update if sub-account was found and updated
      }

      // If not found in sub-accounts, update main account
      const { data: mainAccount, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, property_balance')
        .eq('id', category)
        .single()

      if (mainAccountError) {
        console.error('Error finding main account:', mainAccountError)
        throw new Error('Failed to find account')
      }

      // Update main account balance
      const currentBalance = parseFloat(mainAccount.account_balance) || 0
      const newBalance = currentBalance + amount

      // Update property balance in the property_balance JSONB array
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

    // Prepare charge data
    // Transform expense lines for charge record
    const transformedLines = lines.map((line: ExpenseLineRequest) => ({
      line_id: nanoid(),
      amount: line.amount,
      category: line.category_id,
      reference: nanoid(),
      description: line.description || '',
      property_id: property_id,
      unit_id: line.unit_id || null
    }));

    // Create charge data
    const chargeData: ChargeData = {
      company_id,
      people_id,
      bill_date,
      due_date: due_date || bill_date,
      payee: people_id,
      property_id,
      unit_id: null, // Default to null
      charge_amount: {
        lines: transformedLines,
        total_amount: totalAmount,
        accounts_payable_id: pay_from_account
      },
      amount_remaining: {
        lines: transformedLines,
        total_amount: totalAmount,
        accounts_payable_id: pay_from_account
      },
      memo,
      reference,
      status: status || "unpaid",
      created_by: user.id,
      charge_type: charge_type || 'expense',
      transaction_id: transaction.id
    };

    // Add recurring fields if applicable
    if (frequency) {
      chargeData.start_date = start_date;
      chargeData.frequency = frequency;
      chargeData.repeat_infinite = repeat_infinite;
    }

    console.log("Creating charge with data:", chargeData);

    // Create the charge record
    const { data: charge, error: chargeError } = await supabase
      .from("charges")
      .insert(chargeData)
      .select()
      .single();

    if (chargeError) {
      console.error('Error creating charge:', chargeError);
      throw new Error('Failed to create charge record');
    }

    return NextResponse.json({
      transaction,
      charge
    })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create expense" },
      { status: 500 }
    )
  }
} 