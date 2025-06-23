import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Finix API configuration
const FINIX_API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://finix.live-payments-api.com' 
  : 'https://finix.sandbox-payments-api.com';

const FINIX_USERNAME = process.env.FINIX_USERNAME || 'USsRhsHYZGBPnQw8CByJyEQW'; // Sandbox default
const FINIX_PASSWORD = process.env.FINIX_PASSWORD || '8a14c2f9-d94b-4c72-8f5c-a62908e5b30e'; // Sandbox default

interface FinixTransferRequest {
  amount: number;
  currency: string;
  source: string; // Payment Instrument ID
  merchant: string; // Merchant ID
  fraud_session_id?: string;
  tags?: Record<string, string>;
  idempotency_id?: string;
}

interface FinixTransferResponse {
  id: string;
  amount: number;
  state: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'UNKNOWN';
  currency: string;
  source: string;
  merchant: string;
  created_at: string;
  updated_at: string;
  failure_code?: string;
  failure_message?: string;
  tags: Record<string, string>;
}

interface PaymentRequest {
  amount: number;
  currency?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      region: string;
      postal_code: string;
      country: string;
    };
  };
  payment_instrument_id: string; // Pre-tokenized payment instrument
  merchant_id: string;
  lease_id?: string;
  property_id?: string;
  unit_id?: string;
  metadata?: Record<string, any>;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!body.payment_instrument_id || !body.merchant_id) {
      return NextResponse.json(
        { error: 'Payment instrument ID and merchant ID are required' },
        { status: 400 }
      );
    }

    // Generate idempotency key for duplicate prevention
    const idempotencyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Prepare Finix Transfer request
    const transferRequest: FinixTransferRequest = {
      amount: Math.round(body.amount * 100), // Convert to cents
      currency: body.currency || 'USD',
      source: body.payment_instrument_id,
      merchant: body.merchant_id,
      fraud_session_id: 'velloa_payment',
      idempotency_id: idempotencyId,
      tags: {
        platform: 'velloa',
        customer_email: body.customer.email,
        customer_name: body.customer.name,
        ...(body.lease_id && { lease_id: body.lease_id }),
        ...(body.property_id && { property_id: body.property_id }),
        ...(body.unit_id && { unit_id: body.unit_id }),
        ...(body.description && { description: body.description }),
      }
    };

    // Make request to Finix API
    const finixResponse = await fetch(`${FINIX_API_BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Finix-Version': '2022-02-01',
        'Authorization': `Basic ${Buffer.from(`${FINIX_USERNAME}:${FINIX_PASSWORD}`).toString('base64')}`,
      },
      body: JSON.stringify(transferRequest),
    });

    const finixData: FinixTransferResponse = await finixResponse.json();

    if (!finixResponse.ok) {
      console.error('Finix API error:', finixData);
      return NextResponse.json(
        { 
          error: 'Payment processing failed',
          details: finixData
        },
        { status: finixResponse.status }
      );
    }

    // Store payment record in database
    const { data: paymentRecord, error: dbError } = await supabase
      .from('finix_payments')
      .insert({
        finix_transfer_id: finixData.id,
        amount: body.amount,
        currency: body.currency || 'USD',
        status: finixData.state.toLowerCase(),
        customer_name: body.customer.name,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone,
        customer_address: body.customer.address,
        lease_id: body.lease_id,
        property_id: body.property_id,
        unit_id: body.unit_id,
        metadata: {
          ...body.metadata,
          finix_response: finixData,
          idempotency_id: idempotencyId,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue even if DB insert fails - payment was processed
    }

    return NextResponse.json({
      success: true,
      payment_id: paymentRecord?.id || null,
      finix_transfer_id: finixData.id,
      status: finixData.state.toLowerCase(),
      amount: body.amount,
      currency: body.currency || 'USD',
      created_at: finixData.created_at,
      message: finixData.state === 'SUCCEEDED' 
        ? 'Payment processed successfully' 
        : `Payment status: ${finixData.state}`,
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get('lease_id');
    const propertyId = searchParams.get('property_id');
    const unitId = searchParams.get('unit_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('finix_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (leaseId) {
      query = query.eq('lease_id', leaseId);
    }
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    if (unitId) {
      query = query.eq('unit_id', unitId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
      pagination: {
        limit,
        offset,
        total: payments?.length || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}