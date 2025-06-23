import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Finix webhook configuration
const FINIX_WEBHOOK_SECRET = process.env.FINIX_WEBHOOK_SECRET;

interface FinixWebhookPayload {
  id: string;
  type: string;
  created_at: string;
  data: {
    object: {
      id: string;
      state: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'UNKNOWN';
      amount: number;
      currency: string;
      source: string;
      merchant: string;
      failure_code?: string;
      failure_message?: string;
      tags: Record<string, string>;
      created_at: string;
      updated_at: string;
    };
  };
}

interface PaymentRecord {
  id: string;
  finix_transfer_id: string;
  amount: number;
  currency: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: Record<string, string>;
  lease_id?: string;
  property_id?: string;
  unit_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface TransactionRecord {
  id: string;
  company_id?: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  transaction_date: string;
  payment_method: string;
  reference_number: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Helper function to verify webhook signature (placeholder)
function verifyWebhookSignature(_payload: string, _signature: string): boolean {
  // TODO: Implement proper webhook signature verification
  // This would typically use HMAC-SHA256 with the webhook secret
  if (!FINIX_WEBHOOK_SECRET) {
    console.warn('Finix webhook secret not configured - skipping signature verification');
    return true; // Allow in development/testing
  }
  
  // Placeholder verification logic
  // In production, implement proper HMAC signature verification
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('finix-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookPayload: FinixWebhookPayload = JSON.parse(body);
    const { type, data } = webhookPayload;
    const transfer = data.object;

    console.log(`Received Finix webhook: ${type} for transfer ${transfer.id}`);

    // Handle different webhook types
    switch (type) {
      case 'transfer.succeeded':
      case 'transfer.failed':
      case 'transfer.canceled':
      case 'transfer.pending':
        await handleTransferUpdate(transfer);
        break;
      
      default:
        console.log(`Unhandled webhook type: ${type}`);
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleTransferUpdate(transfer: FinixWebhookPayload['data']['object']) {
  try {
    // Update payment status in database
    const { data: existingPayment, error: fetchError } = await supabase
      .from('finix_payments')
      .select('*')
      .eq('finix_transfer_id', transfer.id)
      .single();

    if (fetchError) {
      console.error('Error fetching payment record:', fetchError);
      return;
    }

    if (!existingPayment) {
      console.warn(`Payment record not found for transfer ${transfer.id}`);
      return;
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('finix_payments')
      .update({
        status: transfer.state.toLowerCase(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...existingPayment.metadata,
          webhook_received_at: new Date().toISOString(),
          finix_updated_at: transfer.updated_at,
          ...(transfer.failure_code && { failure_code: transfer.failure_code }),
          ...(transfer.failure_message && { failure_message: transfer.failure_message }),
        }
      })
      .eq('finix_transfer_id', transfer.id);

    if (updateError) {
      console.error('Error updating payment record:', updateError);
      return;
    }

    // Handle successful payments
    if (transfer.state === 'SUCCEEDED') {
      await handleSuccessfulPayment(existingPayment, transfer);
    } else if (transfer.state === 'FAILED') {
      await handleFailedPayment(existingPayment, transfer);
    }

    console.log(`Updated payment ${existingPayment.id} status to ${transfer.state.toLowerCase()}`);

  } catch (error) {
    console.error('Error handling transfer update:', error);
  }
}

async function handleSuccessfulPayment(
  payment: PaymentRecord, 
  transfer: FinixWebhookPayload['data']['object']
) {
  try {
    // Create transaction record for successful payment
    const { data: transaction, error: transactionError } = await supabase
      .from('transaction')
      .insert({
        company_id: payment.metadata?.company_id,
        amount: payment.amount,
        type: 'payment',
        category: 'rent_payment',
        description: `Finix payment - ${payment.customer_name}`,
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'finix',
        reference_number: transfer.id,
        metadata: {
          finix_transfer_id: transfer.id,
          payment_id: payment.id,
          customer_email: payment.customer_email,
          lease_id: payment.lease_id,
          property_id: payment.property_id,
          unit_id: payment.unit_id,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      return;
    }

    // If payment is associated with a lease, apply to outstanding charges
    if (payment.lease_id) {
      await applyPaymentToCharges(payment, transaction);
    }

    console.log(`Created transaction ${transaction.id} for successful payment`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function applyPaymentToCharges(payment: PaymentRecord, transaction: TransactionRecord) {
  try {
    // Get outstanding charges for the lease
    const { data: charges, error: chargesError } = await supabase
      .from('lease_charge')
      .select('*')
      .eq('lease_id', payment.lease_id)
      .gt('balance', 0)
      .order('due_date', { ascending: true });

    if (chargesError || !charges?.length) {
      console.log('No outstanding charges found for lease:', payment.lease_id);
      return;
    }

    let remainingPayment = payment.amount;
    const paymentAllocations = [];

    // Apply payment to charges (oldest first)
    for (const charge of charges) {
      if (remainingPayment <= 0) break;

      const allocationAmount = Math.min(remainingPayment, charge.balance);
      
      // Create payment allocation record
      paymentAllocations.push({
        lease_id: payment.lease_id,
        charge_id: charge.id,
        transaction_id: transaction.id,
        amount: allocationAmount,
        allocation_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Update charge balance
      const newBalance = charge.balance - allocationAmount;
      await supabase
        .from('lease_charge')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', charge.id);

      remainingPayment -= allocationAmount;
    }

    // Insert payment allocations
    if (paymentAllocations.length > 0) {
      const { error: allocationError } = await supabase
        .from('payment_allocation')
        .insert(paymentAllocations);

      if (allocationError) {
        console.error('Error creating payment allocations:', allocationError);
      } else {
        console.log(`Created ${paymentAllocations.length} payment allocations`);
      }
    }

    // Handle any remaining payment amount (overpayment/credit)
    if (remainingPayment > 0) {
      console.log(`Remaining payment amount: $${remainingPayment} - could be applied as credit`);
      // TODO: Implement credit/overpayment handling
    }

  } catch (error) {
    console.error('Error applying payment to charges:', error);
  }
}

async function handleFailedPayment(
  payment: PaymentRecord, 
  transfer: FinixWebhookPayload['data']['object']
) {
  try {
    console.log(`Payment failed for ${payment.customer_email}:`, {
      transfer_id: transfer.id,
      failure_code: transfer.failure_code,
      failure_message: transfer.failure_message,
      amount: payment.amount,
    });

    // TODO: Implement failed payment handling
    // - Send notification to customer
    // - Update lease status if needed
    // - Log for follow-up

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// GET method for webhook verification (if needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ message: 'Finix webhook endpoint' });
} 