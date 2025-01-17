import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ApplicationSubmittedEmail } from '@/components/Emails/NewOwnerEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Log the incoming request
    const requestBody = await request.clone().json();
    console.log('Incoming request body:', requestBody);

    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Auth response:', { user, userError });

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 });
    }

    // Get the request body
    const body = requestBody;  // Use the already parsed body

    // Get the user's profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    console.log('Profile query response:', { profile, profileError });

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ 
        error: 'User profile not found', 
        details: profileError?.message,
        userId: user.id 
      }, { status: 404 });
    }

    // Check if user has permission to create owners
    if (!['admin', 'owner'].includes(profile.role)) {
      console.error('Permission denied for role:', profile.role);
      return NextResponse.json(
        { 
          error: 'Unauthorized - Insufficient permissions',
          details: `User role ${profile.role} is not authorized to create owners`
        },
        { status: 403 }
      );
    }

    // Get company member info
    let companyMember;
    const { data: initialCompanyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)  // This is the user's profile ID
      .single();

    console.log('Initial company member query:', {
      profileId: profile.id,
      result: initialCompanyMember,
      error: companyError
    });

    if (companyError || !initialCompanyMember) {
      // Try alternative query if first one fails
      const { data: altCompanyMember, error: altCompanyError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('id', user.id)  // Try with user ID as fallback
        .single();

      console.log('Alternative company member query:', {
        userId: user.id,
        result: altCompanyMember,
        error: altCompanyError
      });

      if (altCompanyError || !altCompanyMember) {
        console.error('All company member queries failed:', {
          initialError: companyError,
          altError: altCompanyError,
          profileId: profile.id,
          userId: user.id
        });
        return NextResponse.json(
          { 
            error: 'Company not found', 
            details: {
              initialError: companyError?.message,
              altError: altCompanyError?.message,
              profileId: profile.id,
              userId: user.id
            }
          },
          { status: 404 }
        );
      }

      companyMember = altCompanyMember;
    } else {
      companyMember = initialCompanyMember;
    }

    if (!companyMember?.company_id) {
      console.error('No company_id found for user. Profile ID:', profile.id, 'User ID:', user.id);
      return NextResponse.json(
        { error: 'User is not associated with any company' },
        { status: 404 }
      );
    }

    // Get company name
    const { data: company, error: companyNameError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyMember.company_id)
      .single();

    console.log('Company query results:', {
      companyId: companyMember.company_id,
      companyData: company,
      companyError: companyNameError
    });

    let companyName = 'Velloa'; // Default value
    if (companyNameError || !company?.name) {
      console.error('Error fetching company name:', companyNameError);
      console.error('Company ID:', companyMember.company_id);
    } else {
      companyName = company.name;
      console.log('Successfully retrieved company name:', companyName);
    }

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email || !body.portal_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email) || !emailRegex.test(body.portal_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate agreement dates
    if (body.agreement_start && body.agreement_end) {
      const startDate = new Date(body.agreement_start);
      const endDate = new Date(body.agreement_end);
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'Agreement end date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Check if owner with same portal email already exists
    const { data: existingOwner } = await supabase
      .from('people')
      .select('id')
      .eq('portal_email', body.portal_email)
      .eq('company_id', companyMember.company_id)
      .single();

    if (existingOwner) {
      return NextResponse.json(
        { error: 'An owner with this portal email already exists' },
        { status: 409 }
      );
    }

    // Insert the new owner
    console.log('Attempting to insert owner with payload:', {
      first_name: body.first_name,
      last_name: body.last_name,
      middle_name: body.middle_name,
      company: body.company,
      portal_email: body.portal_email,
      email: body.email,
      phone: body.phone,
      about_you: body.about_you,
      role: 'owner',
      date_of_birth: body.date_of_birth,
      address_info: body.address_info,
      agreement_start: body.agreement_start,
      agreement_end: body.agreement_end,
      payments_settings: body.payments_settings,
      company_id: companyMember.company_id,
      status: 'sent',
      unit_id: null
    });

    const { data: owner, error: insertError } = await supabase
      .from('people')
      .insert([
        {
          first_name: body.first_name,
          last_name: body.last_name,
          middle_name: body.middle_name || null,
          company: body.company || null,
          portal_email: body.portal_email,
          email: body.email,
          phone: body.phone || null,
          about_you: body.about_you || null,
          role: 'owner',
          date_of_birth: body.date_of_birth || null,
          address_info: body.address_info || null,
          agreement_start: body.agreement_start || null,
          agreement_end: body.agreement_end || null,
          payments_settings: body.payments_settings || null,
          company_id: companyMember.company_id,
          status: 'sent',
          unit_id: null
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Owner insertion failed:', {
        error: insertError,
        errorMessage: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return NextResponse.json(
        { 
          error: 'Failed to create owner', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint 
        },
        { status: 500 }
      );
    }

    console.log('Owner created successfully:', owner);

    // Generate a unique ID for the owner
    const ownerId = crypto.randomUUID();

    // Send welcome email
    try {
      await resend.emails.send({
        from: 'Velloa <onboarding@velloaapp.com>',
        to: [body.portal_email],
        subject: 'Welcome to Velloa - Owner Portal Access',
        react: ApplicationSubmittedEmail({
          name: `${body.first_name} ${body.last_name}`,
          CompanyName: companyName
        }) as React.ReactElement,
        headers: {
          'X-Entity-Ref-ID': ownerId,
        }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't return here, continue with the success response even if email fails
    }

    return NextResponse.json({
      message: 'Owner created successfully',
      owner
    });

  } catch (error) {
    console.error('Error in create owner route:', error);
    // Log the full request body for debugging
    try {
      const body = await request.clone().json();
      console.error('Request body:', body);
    } catch (e) {
      console.error('Could not parse request body:', e);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 