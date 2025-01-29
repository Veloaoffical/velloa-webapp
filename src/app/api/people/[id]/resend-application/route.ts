import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ApplicationSubmittedEmail } from '@/components/Emails/NewProspectEmail';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  console.log('Starting resend application process for ID:', params.id);
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Authenticated user:', user.id);

    // Get the user's company
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError);
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 });
    }
    console.log('Company member data:', companyMember);

    // Get the prospect's details
    console.log('Querying prospect with ID:', params.id);
    const { data: prospect, error: prospectError } = await supabase
      .from('people')
      .select('*')
      .eq('id', params.id)
      .single();

    console.log('Raw prospect query result:', { data: prospect, error: prospectError });

    if (prospectError) {
      console.error('Error fetching prospect:', prospectError);
      return NextResponse.json({ 
        error: 'Prospect not found',
        details: prospectError.message,
        code: prospectError.code
      }, { status: 404 });
    }

    if (!prospect) {
      console.error('No prospect found with ID:', params.id);
      return NextResponse.json({ 
        error: 'Prospect not found',
        details: 'No prospect exists with the provided ID'
      }, { status: 404 });
    }

    // Log the structure of the prospect data
    console.log('Prospect data structure:', {
      hasContact: !!prospect.contact,
      contactType: prospect.contact ? typeof prospect.contact : 'undefined',
      contactKeys: prospect.contact ? Object.keys(prospect.contact) : [],
      email: prospect.email,
      first_name: prospect.first_name,
      middle_name: prospect.middle_name,
      last_name: prospect.last_name,
      contact: prospect.contact,
      rawProspect: prospect
    });

    // Check both possible locations for email
    const emailAddress = prospect.contact?.email || prospect.email;

    if (!emailAddress) {
      console.error('No email found for prospect. Data:', {
        prospectEmail: prospect.email,
        contactEmail: prospect.contact?.email,
        fullProspect: prospect
      });
      return NextResponse.json({ 
        error: 'Prospect has no email address',
        details: 'Email not found in either contact.email or email field'
      }, { status: 400 });
    }

    // Get company name
    const { data: companyData, error: companyNameError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyMember.company_id)
      .single();

    if (companyNameError) {
      console.error('Error fetching company name:', companyNameError);
    }
    console.log('Company data:', companyData);

    const fullName = [
      prospect.first_name || '',
      prospect.middle_name || '',
      prospect.last_name || ''
    ].filter(Boolean).join(' ').trim() || 'Valued Prospect';

    const emailData = {
      from: 'Velloa <onboarding@velloa.ca>',
      to: [emailAddress],
      subject: 'Welcome to Velloa - Complete Your Application',
      react: ApplicationSubmittedEmail({
        name: fullName,
        confirmationNumber: prospect.id,
        CompanyName: companyData?.name || 'Velloa'
      }) as React.ReactElement,
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      }
    };

    console.log('Preparing to send email with data:', {
      to: emailData.to,
      subject: emailData.subject,
      name: fullName,
      companyName: companyData?.name || 'Velloa'
    });

    // Send application email
    try {
      console.log('Calling resend.emails.send...');
      const emailResponse = await resend.emails.send(emailData);
      console.log('Email sent successfully, response:', emailResponse);
      
      return NextResponse.json({ 
        success: true,
        data: emailResponse
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error resending application:', error);
    return NextResponse.json({
      error: 'Failed to resend application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 