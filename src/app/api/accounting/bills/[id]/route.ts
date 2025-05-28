import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const billId = params.id;

    // The middleware has already authenticated the user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company data' }, { status: 400 });
    }

    const company_id = companyMember.company_id;

    // Fetch the charge with all related data
    const { data: charge, error: chargeError } = await supabase
      .from('charges')
      .select(`
        id,
        people_id,
        bill_date,
        due_date,
        charge_type,
        charge_amount,
        amount_remaining,
        memo,
        reference,
        status,
        frequency,
        start_date,
        end_date,
        repeat_infinite,
        property_id,
        unit_id,
        created_at
      `)
      .eq('id', billId)
      .eq('company_id', company_id)
      .single();

    if (chargeError || !charge) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Enhance the charge_amount.lines with category information
    if (charge.charge_amount?.lines) {
      const enhancedLines = await Promise.all(
        charge.charge_amount.lines.map(async (line: {
          property_id?: string;
          unit_id?: string;
          category_id?: string;
          category?: string;
          description?: string;
          amount?: number;
          line_id?: string;
          reference?: number;
        }) => {
          let categoryInfo = null;
          
          if (line.category_id || line.category) {
            const categoryId = line.category_id || line.category;
            
            // First try to find in main chart_of_accounts
            const { data: mainCategory } = await supabase
              .from('chart_of_accounts')
              .select('id, account_name, account_type, account_subtype')
              .eq('id', categoryId)
              .single();
            
            if (mainCategory) {
              categoryInfo = {
                account_name: mainCategory.account_name
              };
            } else {
              // Try to find in sub_accounts
              const { data: subCategory } = await supabase
                .from('chart_of_sub_accounts')
                .select('id, account_name, account_type, account_subtype')
                .eq('id', categoryId)
                .single();
              
              if (subCategory) {
                categoryInfo = {
                  account_name: subCategory.account_name
                };
              }
            }
          }
          
          return {
            ...line,
            category_info: categoryInfo
          };
        })
      );
      
      // Update the charge_amount with enhanced lines
      charge.charge_amount = {
        ...charge.charge_amount,
        lines: enhancedLines
      };
    }

    return NextResponse.json(charge);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const billId = params.id;

    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company data' }, { status: 400 });
    }

    const company_id = companyMember.company_id;

    // Begin transaction
    const { error: beginError } = await supabase.rpc('begin_transaction');
    if (beginError) {
      return NextResponse.json({ error: 'Failed to begin transaction' }, { status: 500 });
    }

    try {
      // First get the charge record to check status and get transaction_id
      const { data: charge, error: chargeError } = await supabase
        .from('charges')
        .select('*')
        .eq('id', billId)
        .eq('company_id', company_id)
        .single();

      if (chargeError || !charge) {
        throw new Error('Bill not found');
      }

      // Check if the bill is already paid
      if (charge.status === 'paid') {
        throw new Error('Cannot delete a paid bill');
      }

      // Get the charge amount details from the charge record
      const charge_amount = charge.charge_amount;

      // Update Accounts Payable balance first
      const { data: accountsPayable, error: apError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance')
        .eq('account_type', 'Liability')
        .eq('account_name', 'Accounts Payable')
        .single();

      if (apError) {
        throw new Error('Failed to get Accounts Payable account');
      }

      if (accountsPayable) {
        const currentBalance = parseFloat(accountsPayable.account_balance) || 0;
        const totalAmount = charge_amount.total_amount || 0;
        const newBalance = currentBalance - totalAmount;

        const { error: updateError } = await supabase
          .from('chart_of_accounts')
          .update({ account_balance: newBalance.toString() })
          .eq('id', accountsPayable.id);

        if (updateError) {
          throw new Error('Failed to update Accounts Payable balance');
        }
      }

      // Update expense account balances
      if (charge_amount?.lines) {
        for (const line of charge_amount.lines) {
          const categoryId = line.category_id || line.category;
          if (!categoryId) continue;

          // First try to find and update sub-account
          const { data: subAccount, error: subAccountError } = await supabase
            .from('chart_of_sub_accounts')
            .select('id, account_balance, account_type, parent_account')
            .eq('id', categoryId)
            .single();

          if (!subAccountError && subAccount) {
            // Calculate new balance by subtracting the line amount
            const currentBalance = parseFloat(subAccount.account_balance) || 0;
            const lineAmount = Math.abs(line.amount || 0);
            const newBalance = currentBalance - lineAmount;

            // Update sub-account balance
            const { error: updateError } = await supabase
              .from('chart_of_sub_accounts')
              .update({ account_balance: newBalance.toString() })
              .eq('id', categoryId);

            if (updateError) {
              throw new Error('Failed to update sub-account balance');
            }

            // Update parent account if exists
            if (subAccount.parent_account) {
              const { data: parentAccount } = await supabase
                .from('chart_of_accounts')
                .select('account_balance')
                .eq('id', subAccount.parent_account)
                .single();

              if (parentAccount) {
                const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0;
                const parentNewBalance = parentCurrentBalance - lineAmount;

                const { error: parentUpdateError } = await supabase
                  .from('chart_of_accounts')
                  .update({ account_balance: parentNewBalance.toString() })
                  .eq('id', subAccount.parent_account);

                if (parentUpdateError) {
                  throw new Error('Failed to update parent account balance');
                }
              }
            }
          }

          // Update main account if exists
          const { data: mainAccount } = await supabase
            .from('chart_of_accounts')
            .select('account_balance')
            .eq('id', categoryId)
            .single();

          if (mainAccount) {
            const currentBalance = parseFloat(mainAccount.account_balance) || 0;
            const lineAmount = Math.abs(line.amount || 0);
            const newBalance = currentBalance - lineAmount;

            const { error: updateError } = await supabase
              .from('chart_of_accounts')
              .update({ account_balance: newBalance.toString() })
              .eq('id', categoryId);

            if (updateError) {
              throw new Error('Failed to update main account balance');
            }
          }
        }
      }

      // Store transaction_id for later deletion
      const transactionId = charge.transaction_id;

      // Delete the charge record first to remove the foreign key reference
      const { error: deleteChargeError } = await supabase
        .from('charges')
        .delete()
        .eq('id', billId);

      if (deleteChargeError) {
        throw new Error('Failed to delete charge');
      }

      // Now delete the transaction record if it exists (after charge is deleted)
      if (transactionId) {
        const { error: deleteTransactionError } = await supabase
          .from('transaction')
          .delete()
          .eq('id', transactionId);

        if (deleteTransactionError) {
          console.error('Error deleting transaction:', deleteTransactionError);
          throw new Error(`Failed to delete transaction: ${deleteTransactionError.message}`);
        }
      }

      // Remove from maintenance_requests.charges_id and maintenance_requests.transaction_id
      // Find all maintenance_requests that reference this charge or transaction
      const { data: requests, error: reqError } = await supabase
        .from('maintenance_requests')
        .select('id, charges_id, transaction_id')
        .or(`charges_id.cs.[{"id":"${billId}"}],transaction_id.cs.[{"id":"${transactionId}"}]`);

      if (!reqError && requests && requests.length > 0) {
        for (const req of requests) {
          // Remove the charge and transaction from the arrays
          const newCharges = (req.charges_id || []).filter((c: { id: string }) => c.id !== billId);
          const newTransactions = (req.transaction_id || []).filter((t: { id: string }) => t.id !== transactionId);

          await supabase
            .from('maintenance_requests')
            .update({
              charges_id: newCharges,
              transaction_id: newTransactions,
            })
            .eq('id', req.id);
        }
      }

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) {
        throw new Error('Failed to commit transaction');
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc('rollback_transaction');
      console.error('Error in bill deletion:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: error instanceof Error && error.message === 'Bill not found' ? 404 : 500 }
      );
    }
  } catch (error) {
    console.error('Error in bill deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 