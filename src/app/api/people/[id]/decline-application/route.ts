import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import DeclineRentalApplication from '@/components/Emails/DeclineRentalApplication';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { propertyName, unitNumber, propertyAddress, applicantName, applicantEmail } = body;

    // Validate required fields
    if (!propertyName || !applicantName || !applicantEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send decline email using Resend
    const data = await resend.emails.send({
      from: 'Velloa <no-reply@velloa.ca>',
      to: [applicantEmail],
      subject: 'Update Regarding Your Rental Application',
      react: DeclineRentalApplication({
        propertyName,
        unitNumber,
        propertyAddress,
        applicantName,
      }),
    });

    // Update application status in Supabase
    const { error: updateError } = await supabase
      .from('rental_applications')
      .update({ 
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      throw new Error('Failed to update application status');
    }

    return NextResponse.json(
      { message: 'Application declined successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error declining application:', error);
    return NextResponse.json(
      { error: 'Failed to decline application' },
      { status: 500 }
    );
  }
} 