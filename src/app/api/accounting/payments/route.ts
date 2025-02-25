import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { 
      lease_id, 
      payment_date, 
      amount, 
      payment_method,
      check_number,
      deposit_account_id, 
      memo, 
      reference,
      auto_deposit,
      email_receipt,
      allocations,
      share_with_tenants 
    } = body;

    // Validate required fields
    if (!lease_id || !payment_date || !amount || !payment_method || !deposit_account_id) {
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
      .from('leases')
      .select('property_id, unit_id, tenant_id, tenant_name')
      .eq('id', lease_id)
      .single();

    if (leaseError || !leaseData) {
      return NextResponse.json(
        { error: 'Failed to get lease data' }, 
        { status: 500 }
      );
    }

    // Start a transaction
    const paymentId = uuidv4();
    
    // Save directly to transaction table instead of payments table
    const transactionData = {
      id: paymentId,
      transaction_type: 'payment',
      property: leaseData.property_id,
      payee: leaseData.tenant_id,
      start_date: payment_date,
      data: {
        lines: [
          {
            unit: leaseData.unit_id,
            category: deposit_account_id, // Using deposit account as category
            property: leaseData.property_id,
            reference: reference,
            description: "Payment",
            debit_amount: amount,
            credit_amount: 0
          }
        ],
        total_amount: amount,
        payment_method: payment_method,
        check_number: check_number || null,
        lease_id: lease_id
      },
      created_by: user.id,
      company: company_id,
      memo: memo ? { text: memo } : null,
      reference: reference,
      payment_method: payment_method,
      share_files: share_with_tenants || false
    };

    const { data: transaction, error: transactionError } = await supabase
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

    // Process payment allocations
    if (allocations && Object.keys(allocations).length > 0) {
      // Update charge statuses based on allocations
      for (const [charge_id, allocation_amount] of Object.entries(allocations)) {
        // Get the current charge from transaction table
        const { data: chargeTransaction, error: chargeError } = await supabase
          .from('transaction')
          .select('data, id')
          .eq('id', charge_id)
          .single();

        if (chargeError || !chargeTransaction) {
          console.error(`Error fetching charge ${charge_id}:`, chargeError);
          continue;
        }

        // Calculate new balance
        const chargeData = chargeTransaction.data;
        const chargeAmount = chargeData.total_amount || 0;
        const currentBalance = chargeData.balance || chargeAmount;
        const newBalance = currentBalance - (allocation_amount as number);
        const newStatus = newBalance <= 0 ? 'paid' : 'partial';

        // Update the charge transaction
        const { error: updateError } = await supabase
          .from('transaction')
          .update({
            data: {
              ...chargeData,
              balance: newBalance,
              status: newStatus,
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', charge_id);

        if (updateError) {
          console.error(`Error updating charge ${charge_id}:`, updateError);
        }

        // Create a payment allocation record in the transaction table
        const allocationTransactionData = {
          id: uuidv4(),
          transaction_type: 'payment_allocation',
          property: leaseData.property_id,
          start_date: payment_date,
          data: {
            payment_id: paymentId,
            charge_id: charge_id,
            amount: allocation_amount,
            previous_balance: currentBalance,
            new_balance: newBalance
          },
          created_by: user.id,
          company: company_id,
          reference: `Allocation for payment ${reference}`
        };

        const { error: allocationError } = await supabase
          .from('transaction')
          .insert(allocationTransactionData);

        if (allocationError) {
          console.error(`Error creating allocation record:`, allocationError);
        }
      }
    }

    // If auto_deposit is true, create a bank deposit record in the transaction table
    if (auto_deposit) {
      const depositTransactionData = {
        id: uuidv4(),
        transaction_type: 'bank_deposit',
        property: leaseData.property_id,
        start_date: payment_date,
        data: {
          account_id: deposit_account_id,
          amount: amount,
          deposit_date: payment_date,
          payment_id: paymentId
        },
        created_by: user.id,
        company: company_id,
        reference: `Auto-deposit for payment ${reference}`
      };

      const { error: depositError } = await supabase
        .from('transaction')
        .insert(depositTransactionData);

      if (depositError) {
        console.error('Error creating auto-deposit transaction:', depositError);
        // Don't fail the whole transaction, just log the error
      }
    }

    // If email_receipt is true, send an email to the tenant
    if (email_receipt) {
      try {
        // This would typically call an email service or queue an email job
        // For now, we'll just log that we would send an email
        console.log(`Would send payment receipt email to tenant ${leaseData.tenant_name}`);
        
        // In a real implementation, you might do something like:
        // await fetch('/api/send-email', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     to: tenantEmail,
        //     subject: 'Payment Receipt',
        //     template: 'payment-receipt',
        //     data: { payment, tenant: leaseData }
        //   })
        // });
      } catch (emailError) {
        console.error('Error sending email receipt:', emailError);
        // Don't fail the whole transaction, just log the error
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
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
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lease_id = searchParams.get('lease_id');
    const property_id = searchParams.get('property_id');
    const unit_id = searchParams.get('unit_id');
    const tenant_id = searchParams.get('tenant_id');
    const payment_method = searchParams.get('payment_method');

    // Build the query
    let query = supabase
      .from('payments')
      .select(`
        *,
        leases (
          tenant_name,
          unit_name,
          property_name
        ),
        bank_accounts (
          account_name,
          account_type
        )
      `)
      .eq('company_id', company_id)
      .order('payment_date', { ascending: false });

    // Apply filters if provided
    if (lease_id) query = query.eq('lease_id', lease_id);
    if (property_id) query = query.eq('property_id', property_id);
    if (unit_id) query = query.eq('unit_id', unit_id);
    if (tenant_id) query = query.eq('tenant_id', tenant_id);
    if (payment_method) query = query.eq('payment_method', payment_method);

    // Execute the query
    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json(
        { error: 'Failed to fetch payments' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 