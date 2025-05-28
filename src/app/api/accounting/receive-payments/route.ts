import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for transaction data
interface TransactionLine {
  category: string;
  reference: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  charge_id?: string; // Optional field for linking to charges
  property?: string;
}

interface ChargeLine {
  category: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  reference?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = session.user;

    // Parse the request body
    const body = await request.json();
    const { 
      lease_id, 
      payment_date, 
      amount, 
      payment_method,
      check_number,
      payment_reference,
      deposit_account_id, 
      memo, 
      reference,
      auto_deposit,
      allocations,
      share_with_tenants,
      tenant_id // Accept tenant_id directly from frontend
    } = body;

    // Validate required fields
    if (!lease_id || !payment_date || !amount || !payment_method || !deposit_account_id || !tenant_id) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Get lease details to associate with the payment
    const { data: leaseData, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('property_id, unit_id')
      .eq('id', lease_id)
      .single();

    if (leaseError || !leaseData) {
      console.error('Lease error:', leaseError);
      return NextResponse.json(
        { error: 'Failed to get lease data' }, 
        { status: 500 }
      );
    }

    // Start a transaction
    const paymentId = uuidv4();
    
    // Prepare transaction lines with debit and credit entries
    const transactionLines: TransactionLine[] = [];
    
    // Add debit entry for deposit account (total amount) only if auto_deposit is true
    if (auto_deposit) {
      transactionLines.push({
        category: deposit_account_id,
        reference: reference,
        description: "Payment - Deposit",
        debit_amount: amount,
        credit_amount: 0,
        property: leaseData.property_id
      });
      
      console.log(`Auto deposit enabled: Adding debit entry for bank account ${deposit_account_id}`);
    } else {
      console.log(`Auto deposit disabled: Skipping debit entry for bank account ${deposit_account_id}`);
    }

    // Get company default accounts settings to find the accounts receivable account
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('default_account')
      .eq('companyid', company_id)
      .single();

    if (settingsError) {
      console.error('Error fetching company settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch company settings' }, 
        { status: 500 }
      );
    }

    // Get the accounts receivable account ID from company settings
    const accountsReceivableId = settings?.default_account?.accountreceivable;
    
    if (!accountsReceivableId) {
      console.error('Accounts receivable account not configured in company settings');
      return NextResponse.json(
        { error: 'Accounts receivable account not configured in company settings' }, 
        { status: 400 }
      );
    }

    // If we have allocations, add credit lines for each charge's accounts receivable
    if (allocations && Object.keys(allocations).length > 0) {
      // First, get all charge IDs to fetch their category information
      const chargeIds = Object.keys(allocations);
      
      // Fetch all charges from the charges table to get the charge_amount structure
      const { data: charges, error: chargesQueryError } = await supabase
        .from('charges')
        .select('id, charge_amount')
        .in('id', chargeIds);

      if (chargesQueryError) {
        console.error('Error fetching charges:', chargesQueryError);
        return NextResponse.json(
          { error: 'Failed to fetch charge data' }, 
          { status: 500 }
        );
      }

      // Create a map of charge ID to accounts receivable ID
      const chargeARAccounts: Record<string, string> = {};
      if (charges && charges.length > 0) {
        charges.forEach(charge => {
          if (charge.charge_amount && charge.charge_amount.accounts_receivable_id) {
            chargeARAccounts[charge.id] = charge.charge_amount.accounts_receivable_id;
            console.log(`Found AR account in charge_amount: ${charge.charge_amount.accounts_receivable_id} for charge ${charge.id}`);
          }
        });
      }

      // If we couldn't find any charges in the charges table, try the transaction table as fallback
      if (Object.keys(chargeARAccounts).length === 0) {
        console.log('No charges found in charges table, trying transaction table');
        
        const { data: chargeTransactions, error: chargesError } = await supabase
          .from('transaction')
          .select('id, data')
          .in('id', chargeIds);

        if (chargesError) {
          console.error('Error fetching charges from transaction table:', chargesError);
        } else if (chargeTransactions) {
          chargeTransactions.forEach(charge => {
            if (charge.data && charge.data.charge_amount && charge.data.charge_amount.accounts_receivable_id) {
              chargeARAccounts[charge.id] = charge.data.charge_amount.accounts_receivable_id;
              console.log(`Found AR account in transaction data: ${charge.data.charge_amount.accounts_receivable_id} for charge ${charge.id}`);
            } else if (charge.data && charge.data.lines && charge.data.lines.length > 0) {
              // Find the accounts receivable line (debit entry) in the charge
              const arLine = charge.data.lines.find((line: ChargeLine) => line.debit_amount > 0);
              if (arLine) {
                chargeARAccounts[charge.id] = arLine.category;
                console.log(`Found AR account in charge lines: ${arLine.category} for charge ${charge.id}`);
              }
            }
          });
        }
      }

      // Add credit lines for each allocation
      for (const [charge_id, allocation_amount] of Object.entries(allocations)) {
        // Skip if allocation amount is zero
        if (parseFloat(allocation_amount as string) <= 0) continue;
        
        // Get the accounts receivable ID for this charge
        const arAccountId = chargeARAccounts[charge_id];
        
        // Add description suffix if auto_deposit is false
        const descriptionSuffix = auto_deposit ? '' : ' (Pending Deposit)';
        
        if (!arAccountId) {
          console.warn(`No accounts receivable account found for charge ${charge_id}, using default accounts receivable`);
          // Use the default accounts receivable account
          transactionLines.push({
            category: accountsReceivableId,
            reference: reference,
            description: `Payment - Applied to charge ${charge_id}${descriptionSuffix}`,
            debit_amount: 0,
            credit_amount: parseFloat(allocation_amount as string),
            property: leaseData.property_id
          });
        } else {
          // Add a credit line for this allocation using the charge's specific AR account
          transactionLines.push({
            category: arAccountId,
            reference: reference,
            description: `Payment - Applied to charge ${charge_id}${descriptionSuffix}`,
            debit_amount: 0,
            credit_amount: parseFloat(allocation_amount as string),
            property: leaseData.property_id
          });
        }
      }
    } else {
      // If no allocations, add a credit line for the default accounts receivable account
      // Add description suffix if auto_deposit is false
      const descriptionSuffix = auto_deposit ? '' : ' (Pending Deposit)';
      
      transactionLines.push({
        category: accountsReceivableId,
        reference: reference,
        description: `Payment - Accounts Receivable${descriptionSuffix}`,
        debit_amount: 0,
        credit_amount: amount,
        property: leaseData.property_id
      });
    }
    
    // Save directly to transaction table
    const transactionData = {
      id: paymentId,
      transaction_type: 'payment',
      property: leaseData.property_id,
      payee: tenant_id, // Use tenant_id from frontend
      start_date: payment_date,
      data: {
        lines: transactionLines,
        unit_id: leaseData.unit_id,
        property_id: leaseData.property_id,
        lease_id: lease_id,
        total_amount: amount,
        payment_method: payment_method,
        check_number: check_number || null,
        payment_reference: payment_reference || null,
        auto_deposit: auto_deposit || false
      },
      created_by: user.id,
      company: company_id,
      memo: memo ? { text: memo } : null,
      reference: reference,
      payment_method: payment_method,
      share_files: share_with_tenants || false
    };

    const { error: transactionError } = await supabase
      .from('transaction')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create payment transaction' }, 
        { status: 500 }
      );
    }

    // Update account balances for each transaction line
    for (const line of transactionLines) {
      const { category, debit_amount, credit_amount, property } = line;
      const property_id = property || leaseData.property_id; // Use property from line if available, otherwise from leaseData
      
      console.log(`Processing line for category ${category}, property_id: ${property_id}`);
      
      // Skip bank account updates if auto_deposit is false and this is a debit entry (bank account)
      if (!auto_deposit && debit_amount > 0) {
        console.log(`Auto deposit disabled: Skipping balance update for bank account ${category}`);
        continue;
      }
      
      // First try to find and update sub-account
      const { data: subAccount, error: subAccountError } = await supabase
        .from('chart_of_sub_accounts')
        .select('id, account_balance, account_type, parent_account, property_balance')
        .eq('id', category)
        .single();

      if (!subAccountError && subAccount) {
        // Determine if this is a debit or credit entry
        const isDebit = debit_amount > 0;
        const amount = isDebit ? debit_amount : credit_amount;
        
        console.log(`Updating sub-account ${subAccount.id} (${subAccount.account_type}): ${isDebit ? 'Adding' : 'Subtracting'} ${amount}`);
        
        // Update sub-account balance
        const currentBalance = parseFloat(subAccount.account_balance) || 0;
        // For bank accounts (debit entries), add the amount; for AR accounts (credit entries), subtract
        const newBalance = isDebit ? currentBalance + amount : currentBalance - amount;
        
        console.log(`Sub-account balance: ${currentBalance} -> ${newBalance}`);

        // Update property balance if it exists
        const propertyBalance = Array.isArray(subAccount.property_balance) ? subAccount.property_balance : [];
        const propertyIndex = propertyBalance.findIndex((pb) => pb.property_id === property_id);

        if (propertyIndex >= 0) {
          // Update existing property balance
          const currentPropertyBalance = parseFloat(propertyBalance[propertyIndex].balance) || 0;
          // For bank accounts (debit entries), add the amount; for AR accounts (credit entries), subtract
          propertyBalance[propertyIndex].balance = isDebit 
            ? currentPropertyBalance + amount 
            : currentPropertyBalance - amount;
          
          console.log(`Property balance for ${property_id}: ${currentPropertyBalance} -> ${propertyBalance[propertyIndex].balance}`);
        } else if (property_id) {
          // Add new property balance
          propertyBalance.push({
            property_id: property_id,
            balance: isDebit ? amount : -amount
          });
          
          console.log(`Added new property balance for ${property_id}: ${isDebit ? amount : -amount}`);
        }

        // Update the account balance and property balance
        const { error: updateError } = await supabase
          .from('chart_of_sub_accounts')
          .update({ 
            account_balance: newBalance.toString(),
            property_balance: propertyBalance
          })
          .eq('id', category);

        if (updateError) {
          console.error('Error updating sub-account balance:', updateError);
          // Continue with other lines even if one update fails
        }

        // Update parent account if it exists
        if (subAccount.parent_account) {
          const { data: parentAccount, error: parentError } = await supabase
            .from('chart_of_accounts')
            .select('account_balance, account_type, property_balance')
            .eq('id', subAccount.parent_account)
            .single();

          if (!parentError && parentAccount) {
            // Update parent account balance
            const parentCurrentBalance = parseFloat(parentAccount.account_balance) || 0;
            // For bank accounts (debit entries), add the amount; for AR accounts (credit entries), subtract
            const parentNewBalance = isDebit ? parentCurrentBalance + amount : parentCurrentBalance - amount;

            // Update property balance if it exists
            const parentPropertyBalance = Array.isArray(parentAccount.property_balance) ? parentAccount.property_balance : [];
            const parentPropertyIndex = parentPropertyBalance.findIndex((pb) => pb.property_id === property_id);

            if (parentPropertyIndex >= 0) {
              // Update existing property balance
              const currentParentPropertyBalance = parseFloat(parentPropertyBalance[parentPropertyIndex].balance) || 0;
              // For bank accounts (debit entries), add the amount; for AR accounts (credit entries), subtract
              parentPropertyBalance[parentPropertyIndex].balance = isDebit 
                ? currentParentPropertyBalance + amount 
                : currentParentPropertyBalance - amount;
            } else if (property_id) {
              // Add new property balance
              parentPropertyBalance.push({
                property_id: property_id,
                balance: isDebit ? amount : -amount
              });
              
              console.log(`Added new parent property balance for ${property_id}: ${isDebit ? amount : -amount}`);
            }

            const { error: parentUpdateError } = await supabase
              .from('chart_of_accounts')
              .update({ 
                account_balance: parentNewBalance.toString(),
                property_balance: parentPropertyBalance
              })
              .eq('id', subAccount.parent_account);

            if (parentUpdateError) {
              console.error('Error updating parent account balance:', parentUpdateError);
              // Continue with other lines even if one update fails
            }
          }
        }

        continue; // Skip main account update if sub-account was found and updated
      }

      // If not found in sub-accounts, update main account
      const { data: mainAccount, error: mainAccountError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_balance, account_type, property_balance')
        .eq('id', category)
        .single();

      if (mainAccountError) {
        console.error('Error finding account:', mainAccountError);
        // Continue with other lines even if one account is not found
        continue;
      }

      if (mainAccount) {
        // Determine if this is a debit or credit entry
        const isDebit = debit_amount > 0;
        const amount = isDebit ? debit_amount : credit_amount;
        
        console.log(`Updating main account ${mainAccount.id} (${mainAccount.account_type}): ${isDebit ? 'Adding' : 'Subtracting'} ${amount}`);
        
        // Update main account balance
        const currentBalance = parseFloat(mainAccount.account_balance) || 0;
        // For bank accounts (debit entries), add the amount; for AR accounts (credit entries), subtract
        const newBalance = isDebit ? currentBalance + amount : currentBalance - amount;
        
        console.log(`Main account balance: ${currentBalance} -> ${newBalance}`);

        // Update property balance if it exists
        const propertyBalance = Array.isArray(mainAccount.property_balance) ? mainAccount.property_balance : [];
        const propertyIndex = propertyBalance.findIndex((pb) => pb.property_id === property_id);

        if (propertyIndex >= 0) {
          // Update existing property balance
          const currentPropertyBalance = parseFloat(propertyBalance[propertyIndex].balance) || 0;
          // For bank accounts (debit entries), add the amount; for AR accounts (credit entries), subtract
          propertyBalance[propertyIndex].balance = isDebit 
            ? currentPropertyBalance + amount 
            : currentPropertyBalance - amount;
            
          console.log(`Main account property balance for ${property_id}: ${currentPropertyBalance} -> ${propertyBalance[propertyIndex].balance}`);
        } else if (property_id) {
          // Add new property balance
          propertyBalance.push({
            property_id: property_id,
            balance: isDebit ? amount : -amount
          });
          
          console.log(`Added new main account property balance for ${property_id}: ${isDebit ? amount : -amount}`);
        }

        // Update the account balance and property balance
        const { error: updateError } = await supabase
          .from('chart_of_accounts')
          .update({ 
            account_balance: newBalance.toString(),
            property_balance: propertyBalance
          })
          .eq('id', category);

        if (updateError) {
          console.error('Error updating account balance:', updateError);
          // Continue with other lines even if one update fails
        }
      }
    }

    // Process payment allocations
    if (allocations && Object.keys(allocations).length > 0) {
      // Update charge statuses based on allocations
      for (const [charge_id, allocation_amount] of Object.entries(allocations)) {
        // Skip if allocation amount is zero
        if (parseFloat(allocation_amount as string) <= 0) continue;
        
        // Get the charge to update
        const { data: charge, error: chargeError } = await supabase
          .from('charges')
          .select('id, amount, balance, status')
          .eq('id', charge_id)
          .single();

        if (chargeError) {
          console.error(`Error fetching charge ${charge_id}:`, chargeError);
          continue; // Skip this charge if there's an error
        }

        if (!charge) {
          console.warn(`Charge ${charge_id} not found`);
          continue; // Skip this charge if not found
        }

        // Calculate new balance
        const newBalance = parseFloat(charge.balance) - parseFloat(allocation_amount as string);
        
        // Determine new status
        let newStatus = charge.status;
        if (newBalance <= 0) {
          newStatus = 'paid';
        } else if (newBalance < parseFloat(charge.amount)) {
          newStatus = 'partial';
        }

        // Update charge balance and status
        const { error: updateError } = await supabase
          .from('charges')
          .update({
            balance: newBalance.toString(),
            status: newStatus
          })
          .eq('id', charge_id);

        if (updateError) {
          console.error(`Error updating charge ${charge_id}:`, updateError);
          // Continue with other charges even if one update fails
        }
      }
    }

    // Create a success response with appropriate message
    const successMessage = auto_deposit 
      ? "Payment recorded and deposited successfully" 
      : "Payment recorded successfully (pending deposit)";
    
    return NextResponse.json({ 
      id: paymentId, 
      message: successMessage,
      auto_deposit: auto_deposit
    });
  } catch (error) {
    console.error('Error in receive-payments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 