import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const billId = params.id;

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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