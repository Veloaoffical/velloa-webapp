// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isEqual } from "https://esm.sh/date-fns@2.30.0"

interface BillLine {
  line_id: string
  amount: number
  category: string
  reference: number
  description?: string
  property_id: string | null
  unit_id: string | null
}

interface RecurringBill {
  id: string
  company_id: string
  people_id: string
  bill_date: string
  due_date: string
  payee: string | null
  property_id: string | null
  unit_id: string | null
  charge_amount: {
    lines: BillLine[]
    total_amount: number
    accounts_payable_id?: string
  }
  amount_remaining: {
    lines: BillLine[]
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
}

interface TransactionLine {
  category: string
  description: string
  debit_amount: number
  credit_amount: number
  reference: string
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

// Function to generate a new reference number
function generateReference(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Function to update account balances for transaction lines
async function updateAccountBalances(
  supabase: ReturnType<typeof createClient>,
  transactionLines: TransactionLine[]
): Promise<void> {
  for (const line of transactionLines) {
    const { category, debit_amount, credit_amount } = line
    
    try {
      // First try to find and update sub-account
      const { data: subAccount, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .select('id, account_balance, account_type, parent_account')
        .eq('id', category)
        .single()

      if (!subAccountError && subAccount) {
        // Always increase the account balance regardless of account type
        const amount = Math.abs(credit_amount) + Math.abs(debit_amount)
        
        // Update sub-account balance
        const currentBalance = parseFloat(subAccount.account_balance) || 0
        const newBalance = currentBalance + amount

        // Only update the account balance without property balance
        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update({ 
            account_balance: newBalance.toString()
          })
          .eq('id', category)

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError)
          // Continue with other lines even if one update fails
        }

        // Update parent account if it exists
        if (subAccount.parent_account) {
          const { data: parentAccount, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance, account_type')
            .eq('id', subAccount.parent_account)
            .single()

          if (!parentError && parentAccount) {
            // Always increase the parent account balance
            const parentAmount = Math.abs(credit_amount) + Math.abs(debit_amount)
            
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0
            const parentNewBalance = parentCurrentBalance + parentAmount

            const { error: parentUpdateError } = await supabase
              .from('chart_of_accounts')
              .update({ 
                account_balance: parentNewBalance.toString()
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
      const { data: mainAccount, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, account_type')
        .eq('id', category)
        .single()

      if (mainAccountError) {
        console.error('Error finding account:', mainAccountError)
        // Continue with other lines even if one account is not found
        continue
      }

      if (mainAccount) {
        // Always increase the account balance
        const amount = Math.abs(credit_amount) + Math.abs(debit_amount)
        
        // Update main account balance
        const currentBalance = parseFloat(mainAccount.account_balance) || 0
        const newBalance = currentBalance + amount

        // Only update the account balance without property balance
        const { error: updateError } = await supabase
          .from('chart_of_accounts')
          .update({ 
            account_balance: newBalance.toString()
          })
          .eq('id', category)

        if (updateError) {
          console.error('Error updating account balance:', updateError)
          // Continue with other lines even if one update fails
        }
      }
    } catch (error) {
      console.error(`Error updating account balance for category ${category}:`, error)
      // Continue with other lines even if one fails
    }
  }
}

// Function to create a new bill based on a recurring bill template
async function createNewBill(
  supabase: ReturnType<typeof createClient>,
  recurringBill: RecurringBill,
  newBillDate: Date,
  newDueDate: Date
): Promise<string | null> {
  try {
    // Generate a new transaction ID
    const transactionId = crypto.randomUUID()
    
    // Generate a new reference
    const newReference = generateReference()
    
    // Create a copy of the charge amount and amount remaining
    const chargeAmount = JSON.parse(JSON.stringify(recurringBill.charge_amount))
    const amountRemaining = JSON.parse(JSON.stringify(recurringBill.amount_remaining))
    
    // Prepare transaction lines with debit and credit entries
    const transactionLines: TransactionLine[] = []
    
    // Add credit entry for accounts payable (total amount)
    transactionLines.push({
      category: chargeAmount.accounts_payable_id || '',
      description: "Recurring vendor bill - Accounts Payable",
      debit_amount: 0,
      credit_amount: chargeAmount.total_amount,
      reference: generateReference()
    })
    
    // Add debit entries for each bill line
    chargeAmount.lines.forEach((line: BillLine) => {
      transactionLines.push({
        category: line.category,
        description: line.description || "Recurring vendor bill",
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
        transaction_type: 'bill',
        property: recurringBill.property_id,
        due_date: format(newDueDate, 'yyyy-MM-dd'),
        data: {
          lines: transactionLines,
          total_amount: chargeAmount.total_amount,
          vendor_id: recurringBill.people_id,
          unit_id: recurringBill.unit_id,
          status: 'unpaid'
        },
        company: recurringBill.company_id,
        memo: recurringBill.memo,
        reference: newReference,
        share_files: false,
        status: 'unpaid',
        created_by: recurringBill.created_by,
        payee: recurringBill.people_id
      })
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return null
    }
    
    // Update account balances for each transaction line
    await updateAccountBalances(supabase, transactionLines)
    
    // Create the new charge record
    const { data: charge, error: chargeError } = await supabase
      .from("charges")
      .insert({
        company_id: recurringBill.company_id,
        people_id: recurringBill.people_id,
        bill_date: format(newBillDate, 'yyyy-MM-dd'),
        due_date: format(newDueDate, 'yyyy-MM-dd'),
        payee: recurringBill.people_id,
        property_id: recurringBill.property_id,
        unit_id: recurringBill.unit_id,
        charge_amount: chargeAmount,
        amount_remaining: amountRemaining,
        memo: recurringBill.memo,
        reference: newReference,
        status: 'unpaid',
        created_by: recurringBill.created_by,
        charge_type: 'bill',
        transaction_id: transactionId,
        recurring_bill_id: recurringBill.id // Reference to the original recurring bill
      })
      .select()
      .single()
    
    if (chargeError) {
      console.error('Error creating charge:', chargeError)
      return null
    }
    
    return charge?.id || null
  } catch (error) {
    console.error('Error in createNewBill:', error)
    return null
  }
}

// Main handler function
serve(async () => {
  try {
    console.log("Processing recurring bills...")
    
    // Create a Supabase client with the project URL and service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get today's date
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    
    console.log(`Processing recurring bills for date: ${todayStr}`)
    
    // Find all recurring bills that need to be processed
    const { data: recurringBills, error: fetchError } = await supabase
      .from('charges')
      .select('*')
      .eq('charge_type', 'bill')
      .not('frequency', 'is', null)
      .order('id')
    
    if (fetchError) {
      console.error('Error fetching recurring bills:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch recurring bills' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`Found ${recurringBills?.length || 0} recurring bills to process`)
    
    const results = []
    
    // Process each recurring bill
    if (recurringBills) {
      for (const bill of recurringBills) {
        try {
          // Skip if not a valid recurring bill
          if (!bill.start_date || !bill.frequency) {
            continue
          }
          
          const startDate = new Date(bill.start_date)
          const lastGeneratedDate = bill.last_generated_date 
            ? new Date(bill.last_generated_date) 
            : startDate
          
          // Calculate the next bill date
          const nextBillDate = getNextDate(lastGeneratedDate, bill.frequency)
          
          // Check if we've reached the end date (if not repeating forever)
          if (!bill.repeat_infinite && bill.end_date) {
            const endDate = new Date(bill.end_date)
            if (isBefore(endDate, nextBillDate)) {
              console.log(`Bill ${bill.id} has reached its end date, skipping`)
              continue
            }
          }
          
          // Check if the next bill date is today or in the past
          if (isBefore(nextBillDate, today) || isEqual(nextBillDate, today)) {
            console.log(`Processing bill ${bill.id}, next date: ${format(nextBillDate, 'yyyy-MM-dd')}`)
            
            // Calculate the due date (same interval from bill date to due date as in the original bill)
            const originalBillDate = new Date(bill.bill_date)
            const originalDueDate = new Date(bill.due_date)
            const daysDifference = Math.round(
              (originalDueDate.getTime() - originalBillDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            
            const nextDueDate = addDays(nextBillDate, daysDifference)
            
            // Create the new bill
            const newBillId = await createNewBill(supabase, bill, nextBillDate, nextDueDate)
            
            if (newBillId) {
              // Update the last generated date for the recurring bill
              const { error: updateError } = await supabase
                .from('charges')
                .update({ last_generated_date: format(nextBillDate, 'yyyy-MM-dd') })
                .eq('id', bill.id)
              
              if (updateError) {
                console.error(`Error updating last_generated_date for bill ${bill.id}:`, updateError)
              } else {
                results.push({
                  recurring_bill_id: bill.id,
                  new_bill_id: newBillId,
                  bill_date: format(nextBillDate, 'yyyy-MM-dd'),
                  due_date: format(nextDueDate, 'yyyy-MM-dd')
                })
              }
            }
          }
        } catch (billError) {
          console.error(`Error processing bill ${bill.id}:`, billError)
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      processed: results.length,
      bills: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/process-recurring-bills' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
*/
