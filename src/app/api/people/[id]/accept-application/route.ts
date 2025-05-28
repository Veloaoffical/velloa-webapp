import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { ApplicationSubmittedEmail } from '@/components/Emails/ApprovedRentalApplication';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { applicantName, applicantEmail, companyName } = body;
    const personId = await Promise.resolve(params.id);

    // Validate required fields
    if (!applicantName || !applicantEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First get the person's unit details
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('unit_id')
      .eq('id', personId)
      .single();

    if (personError) {
      console.error('Error fetching person:', personError);
      throw new Error('Failed to fetch person details');
    }

    // Get unit details including property_id
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('property_id, unit_name')
      .eq('unit_id', person.unit_id)
      .single();

    if (unitError) {
      console.error('Error fetching unit:', unitError);
      throw new Error('Failed to fetch unit details');
    }

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('name, address_line_1, address_line_2, city, state, zip')
      .eq('id', unit.property_id)
      .single();

    if (propertyError) {
      console.error('Error fetching property:', propertyError);
      throw new Error('Failed to fetch property details');
    }

    // Format property address
    const formattedAddress = [
      property.address_line_1,
      property.address_line_2,
      [property.city, property.state, property.zip].filter(Boolean).join(', ')
    ].filter(Boolean).join(', ');

    // Update application status in Supabase
    const { error: updateError } = await supabase
      .from('people')
      .update({ 
        status: 'accepted'
      })
      .eq('id', personId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update application status');
    }

    // Split applicant name into first and last name
    const [firstName, ...lastNameParts] = applicantName.split(' ');
    const lastName = lastNameParts.join(' ');

    // Send approval email
    await resend.emails.send({
      from: 'Velloa <notifications@velloa.ca>',
      to: applicantEmail,
      subject: 'Good News - Your Rental Application Has Been Accepted!',
      react: ApplicationSubmittedEmail({
        firstName,
        lastName,
        CompanyName: companyName || 'Velloa',
        propertyAddress: formattedAddress,
        unitNumber: unit.unit_name,
      }),
    });

    return NextResponse.json(
      { message: 'Application accepted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting application:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept application' },
      { status: 500 }
    );
  }
} 