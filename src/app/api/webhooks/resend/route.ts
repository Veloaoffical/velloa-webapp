import { NextResponse } from 'next/server';
import { supabase } from '@/supabase';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Verify webhook signature here if needed
    
    // Extract the entity reference ID from headers
    const entityRefId = payload.data.headers?.find((header: { name: string, value: string }) => 
      header.name === 'X-Entity-Ref-ID'
    )?.value;

    // Get the event type from the payload and map it to the correct status
    const eventType = payload.type;
    let status = 'sent'; // default status

    switch (eventType) {
      case 'email.clicked':
        status = 'clicked';
        break;
      case 'email.delivered':
        status = 'delivered';
        break;
      case 'email.sent':
        status = 'sent';
        break;
      default:
        status = 'sent';
    }

    // Insert the email event
    await supabase
      .from('email_events')
      .insert({
        email_id: payload.data.email_id,
        type: eventType,
        recipient: payload.data.to[0], // Since to is an array
        status: status,
        metadata: payload,
        entity_ref_id: entityRefId
      });

    // Update person's status if entityRefId exists
    if (entityRefId) {
      await supabase
        .from('people')
        .update({ status: status })
        .eq('id', entityRefId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 