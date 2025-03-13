// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { format, addWeeks, addMonths, addYears, isBefore, isEqual } from "https://esm.sh/date-fns@2.30.0"
import { customAlphabet } from "https://esm.sh/nanoid@4.0.2"

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

// Generate a reference number
const generateReference = () => nanoid(8);

interface ExpenseLine {
  line_id: string
  amount: number
  category: string
  reference: string
  description?: string
  property_id: string | null
  unit_id: string | null
}

interface TransactionLine {
  category: string
  description: string
  debit_amount: number
  credit_amount: number
  reference: string
}

interface PropertyBalance {
  property_id: string;
  property_name: string;
  balance: number;
}

interface SubAccount {
  id: string;
  account_balance: string;
  account_type: string;
  parent_account: string;
  property_balance: PropertyBalance[];
}

interface MainAccount {
  id: string;
  account_balance: string;
  account_type: string;
  property_balance: PropertyBalance[];
}

interface ParentAccount {
  account_balance: string;
  account_type: string;
  property_balance: PropertyBalance[];
}

interface Property {
  name: string;
}

interface RecurringExpense {
  id: string
  company_id: string
  people_id: string
  bill_date: string
  due_date: string
  payee: string | null
  property_id: string | null
  unit_id: string | null
  charge_amount: {
    lines: ExpenseLine[]
    total_amount: number
    accounts_payable_id?: string
  }
  amount_remaining: {
    lines: ExpenseLine[]
    total_amount: number
    accounts_payable_id?: string
  }
  memo?: string | null
  reference?: string
  status: string
  created_by: string
  start_date: string
  frequency: string
  repeat_infinite: boolean
  end_date?: string
  charge_type: string
  transaction_id: string
  last_generated_date?: string
  payment_method: string
  pay_from_account: string
}

// Function to calculate the next date based on frequency
function getNextDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case 'weekly':
      return addWeeks(currentDate, 1)
    case 'biweekly':
      return addWeeks(currentDate, 2)
    case 'monthly':
      return addMonths(currentDate, 1)
    case 'quarterly':
      return addMonths(currentDate, 3)
    case 'semiannually':
      return addMonths(currentDate, 6)
    case 'annually':
      return addYears(currentDate, 1)
    default:
      return addMonths(currentDate, 1) // Default to monthly
  }
}

// Function to update account balances for transaction lines
async function updateAccountBalances(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  transactionLines: TransactionLine[],
  property_id: string | null
): Promise<void> {
  for (const line of transactionLines) {
    const { category, debit_amount, credit_amount } = line
    
    try {
      // First try to find and update sub-account
      const { data: subAccountData, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .select('id, account_balance, account_type, parent_account, property_balance')
        .eq('id', category)
        .single()

      if (!subAccountError && subAccountData) {
        // Cast the data to our interface
        const subAccount = subAccountData as unknown as SubAccount;
        
        // Always increase the account balance regardless of account type
        const amount = debit_amount - credit_amount
        
        // Update sub-account balance
        const currentBalance = parseFloat(subAccount.account_balance) || 0
        const newBalance = currentBalance + amount

        // Update property balance in the property_balance JSONB array
        let propertyBalance: PropertyBalance[] = Array.isArray(subAccount.property_balance) ? subAccount.property_balance : []
        
        if (property_id) {
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
            const { data: propertyData } = await supabase
              .from('properties')
              .select('name')
              .eq('id', property_id)
              .single()
            
            const property = propertyData as unknown as Property;
            
            propertyBalance = [
              ...propertyBalance,
              {
                property_id,
                property_name: property?.name || '',
                balance: amount
              }
            ]
          }
        }

        // Only update the account balance without property balance
        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update({ 
            account_balance: newBalance.toString(),
            property_balance: propertyBalance
          })
          .eq('id', category)

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError)
          // Continue with other lines even if one update fails
        }

        // Update parent account if it exists
        if (subAccount.parent_account) {
          const { data: parentAccountData, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance, account_type, property_balance')
            .eq('id', subAccount.parent_account)
            .single()

          if (!parentError && parentAccountData) {
            // Cast the data to our interface
            const parentAccount = parentAccountData as unknown as ParentAccount;
            
            // Always increase the parent account balance
            const parentAmount = debit_amount - credit_amount
            
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0
            const parentNewBalance = parentCurrentBalance + parentAmount

            let parentPropertyBalance: PropertyBalance[] = parentAccount.property_balance || []
            
            if (property_id) {
              const propertyIndex = parentPropertyBalance.findIndex((pb: PropertyBalance) => pb.property_id === property_id)
              
              if (propertyIndex >= 0) {
                const currentPropertyBalance = Number(parentPropertyBalance[propertyIndex].balance) || 0
                const newPropertyBalance = currentPropertyBalance + parentAmount
                
                parentPropertyBalance = parentPropertyBalance.map((pb: PropertyBalance) => 
                  pb.property_id === property_id 
                    ? { ...pb, balance: newPropertyBalance }
                    : pb
                )
              } else {
                const { data: propertyData } = await supabase
                  .from('properties')
                  .select('name')
                  .eq('id', property_id)
                  .single()
                
                const property = propertyData as unknown as Property;
                
                parentPropertyBalance = [
                  ...parentPropertyBalance,
                  {
                    property_id,
                    property_name: property?.name || '',
                    balance: parentAmount
                  }
                ]
              }
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
              // Continue with other lines even if one update fails
            }
          }
        }

        continue // Skip main account update if sub-account was found and updated
      }

      // If not found in sub-accounts, update main account
      const { data: mainAccountData, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, account_type, property_balance')
        .eq('id', category)
        .single()

      if (mainAccountError) {
        console.error('Error finding account:', mainAccountError)
        // Continue with other lines even if one account is not found
        continue
      }

      // Cast the data to our interface
      const mainAccount = mainAccountData as unknown as MainAccount;
      
      // Always increase the account balance
      const amount = debit_amount - credit_amount
      
      // Update main account balance
      const currentBalance = parseFloat(mainAccount.account_balance) || 0
      const newBalance = currentBalance + amount

      // Update property balance in the property_balance JSONB array
      let propertyBalance: PropertyBalance[] = Array.isArray(mainAccount.property_balance) ? mainAccount.property_balance : []
      
      if (property_id) {
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
          const { data: propertyData } = await supabase
            .from('properties')
            .select('name')
            .eq('id', property_id)
            .single()
          
          const property = propertyData as unknown as Property;
          
          propertyBalance = [
            ...propertyBalance,
            {
              property_id,
              property_name: property?.name || '',
              balance: amount
            }
          ]
        }
      }

      // Only update the account balance without property balance
      const { error: updateError } = await supabase
        .from('chart_of_accounts')
        .update({ 
          account_balance: newBalance.toString(),
          property_balance: propertyBalance
        })
        .eq('id', category)

      if (updateError) {
        console.error('Error updating account balance:', updateError)
        // Continue with other lines even if one update fails
      }
    } catch (error) {
      console.error('Error in updateAccountBalances:', error)
    }
  }
}

// Function to create a new expense based on a recurring expense template
async function createNewExpense(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  recurringExpense: RecurringExpense,
  newBillDate: Date,
  newDueDate: Date
): Promise<string | null> {
  try {
    // Generate a new transaction ID
    const transactionId = crypto.randomUUID()
    
    // Generate a new reference
    const newReference = generateReference()
    
    // Create a copy of the charge amount and amount remaining
    const chargeAmount = JSON.parse(JSON.stringify(recurringExpense.charge_amount))
    const amountRemaining = JSON.parse(JSON.stringify(recurringExpense.amount_remaining))
    
    // Prepare transaction lines with debit and credit entries
    const transactionLines: TransactionLine[] = []
    
    // Add credit entry for the payment account (total amount)
    transactionLines.push({
      category: chargeAmount.accounts_payable_id || '',
      description: "Recurring expense - Payment from account",
      debit_amount: 0,
      credit_amount: chargeAmount.total_amount,
      reference: generateReference()
    })
    
    // Add debit entries for each expense line
    chargeAmount.lines.forEach((line: ExpenseLine) => {
      transactionLines.push({
        category: line.category,
        description: line.description || "Recurring expense",
        debit_amount: line.amount,
        credit_amount: 0,
        reference: generateReference()
      })
    })
    
    // Create the transaction record
    const { error: transactionError } = await supabase
      .from('transaction')
      .insert({
        id: transactionId,
        created_at: new Date().toISOString(),
        transaction_type: 'expense',
        property: recurringExpense.property_id,
        due_date: format(newDueDate, 'yyyy-MM-dd'),
        data: {
          payment_method: recurringExpense.payment_method,
          total_amount: chargeAmount.total_amount,
          lines: transactionLines
        },
        company: recurringExpense.company_id,
        memo: recurringExpense.memo,
        reference: newReference,
        share_files: false,
        status: 'unpaid',
        created_by: recurringExpense.created_by,
        payee: recurringExpense.people_id
      })
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return null
    }
    
    // Update account balances for each transaction line
    await updateAccountBalances(supabase, transactionLines, recurringExpense.property_id)
    
    // Create the new charge record
    const { data: chargeData, error: chargeError } = await supabase
      .from("charges")
      .insert({
        company_id: recurringExpense.company_id,
        people_id: recurringExpense.people_id,
        bill_date: format(newBillDate, 'yyyy-MM-dd'),
        due_date: format(newDueDate, 'yyyy-MM-dd'),
        payee: recurringExpense.people_id,
        property_id: recurringExpense.property_id,
        unit_id: recurringExpense.unit_id,
        charge_amount: chargeAmount,
        amount_remaining: amountRemaining,
        memo: recurringExpense.memo,
        reference: newReference,
        status: 'unpaid',
        created_by: recurringExpense.created_by,
        charge_type: 'expense',
        transaction_id: transactionId,
        payment_method: recurringExpense.payment_method,
        pay_from_account: recurringExpense.pay_from_account,
        recurring_expense_id: recurringExpense.id // Reference to the original recurring expense
      })
      .select()
      .single()
    
    if (chargeError) {
      console.error('Error creating charge:', chargeError)
      return null
    }
    
    // Cast the charge data to get the ID
    const charge = chargeData as unknown as { id: string };
    return charge?.id || null
  } catch (error) {
    console.error('Error in createNewExpense:', error)
    return null
  }
}

// Main handler function
serve(async () => {
  try {
    console.log("Processing recurring expenses...")
    
    // Create a Supabase client with the project URL and service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get today's date
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    
    console.log(`Processing recurring expenses for date: ${todayStr}`)
    
    // Find all recurring expenses that need to be processed
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from('charges')
      .select('*')
      .eq('charge_type', 'expense')
      .not('frequency', 'is', null)
      .order('id')
    
    if (fetchError) {
      console.error('Error fetching recurring expenses:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch recurring expenses' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`Found ${recurringExpenses?.length || 0} recurring expenses to process`)
    
    const results = []
    
    // Process each recurring expense
    if (recurringExpenses) {
      for (const expense of recurringExpenses) {
        try {
          // Skip if not a valid recurring expense
          if (!expense.start_date || !expense.frequency) {
            continue
          }
          
          const startDate = new Date(expense.start_date)
          const lastGeneratedDate = expense.last_generated_date 
            ? new Date(expense.last_generated_date) 
            : startDate
          
          // Calculate the next expense date
          const nextExpenseDate = getNextDate(lastGeneratedDate, expense.frequency)
          
          // Check if we've reached the end date (if not repeating forever)
          if (!expense.repeat_infinite && expense.end_date) {
            const endDate = new Date(expense.end_date)
            if (isBefore(endDate, nextExpenseDate)) {
              console.log(`Expense ${expense.id} has reached its end date, skipping`)
              continue
            }
          }
          
          // Check if the next expense date is today or in the past
          if (isBefore(nextExpenseDate, today) || isEqual(nextExpenseDate, today)) {
            console.log(`Processing expense ${expense.id}, next date: ${format(nextExpenseDate, 'yyyy-MM-dd')}`)
            
            // For expenses, due date is the same as the expense date
            const nextDueDate = nextExpenseDate
            
            // Create the new expense
            const newExpenseId = await createNewExpense(
              supabase,
              expense as RecurringExpense,
              nextExpenseDate,
              nextDueDate
            )
            
            if (newExpenseId) {
              // Update the last generated date for the recurring expense
              const { error: updateError } = await supabase
                .from('charges')
                .update({ last_generated_date: format(nextExpenseDate, 'yyyy-MM-dd') })
                .eq('id', expense.id)
              
              if (updateError) {
                console.error(`Error updating last_generated_date for expense ${expense.id}:`, updateError)
              } else {
                results.push({
                  recurring_expense_id: expense.id,
                  new_expense_id: newExpenseId,
                  expense_date: format(nextExpenseDate, 'yyyy-MM-dd'),
                  due_date: format(nextDueDate, 'yyyy-MM-dd')
                })
              }
            }
          }
        } catch (expenseError) {
          console.error(`Error processing expense ${expense.id}:`, expenseError)
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      processed: results.length,
      expenses: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in process-recurring-expenses:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 