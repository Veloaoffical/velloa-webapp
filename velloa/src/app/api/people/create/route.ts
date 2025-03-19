import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ApplicationSubmittedEmail } from '@/components/Emails/NewProspectEmail';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError);
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 });
    }

    const data = await request.json();
    const { contact, residence, pets, vehicles, dependents, employment, income, role, unit_id, property_id } = data;

    // Debug logging
    console.log('Received data for prospect creation:', { 
      unit_id, 
      property_id,
      hasUnitId: Boolean(unit_id),
      hasPropertyId: Boolean(property_id)
    });

    // Generate a 16 character application ID with only uppercase letters and numbers
    const generateApplicationId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Generate a unique ID for the application
    const applicationId = generateApplicationId();
    // Generate a unique token for application access (32 characters)
    const applicationToken = crypto.randomBytes(16).toString('hex');
    // Set token expiration to 7 days from now in local timezone
    const now = new Date();
    // Add 7 days to the current time
    const tokenExpiration = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    // Format with timezone offset
    const tokenExpirationISO = tokenExpiration.toISOString();

    // Prepare the base insert data
    const insertData = {
      // Contact information
      first_name: contact.firstName,
      middle_name: contact.middleName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      ssn: contact.ssn || null,
      drivers_license_state: contact.driversLicenseState,
      drivers_license_number: contact.driversLicenseNumber,
      date_of_birth: contact.dateOfBirth || null,
      gender: contact.gender,
      marital_status: contact.maritalStatus,
      about_you: contact.aboutYou,
      role: role,
      unit_id: unit_id || null,
      company_id: companyMember.company_id,
      lead_status: contact.leadStatus || 'new',
      lead_source: contact.leadSource || null,
      lead_medium: contact.leadMedium || null,
      assignee_id: contact.assigneeId || null,
      expected_move_in_date: contact.expected_move_in_date || null,

      // Set application details directly in the insert
      application_id: applicationId,
      application_token: applicationToken,
      application_token_exp: tokenExpirationISO,

      // Store property information as JSONB - ensure it's always saved
      prospect_property: {
        property_id: property_id || null,
        unit_id: unit_id || null
      },

      // Store employment as JSON
      employment: {
        employer_name: employment.employerName,
        job_title: employment.jobTitle,
        monthly_income: employment.monthlyIncome ? parseFloat(employment.monthlyIncome) : null,
        employment_start_date: employment.startDate || null,
        supervisor_name: employment.supervisorName,
        supervisor_phone: employment.supervisorPhone,
        address: {
          street: employment.address.street,
          city: employment.address.city,
          province: employment.address.province,
          postal_code: employment.address.postalCode
        }
      },

      // Store income as JSON
      income: {
        employment_income: income.employmentIncome ? parseFloat(income.employmentIncome) : null,
        government_assistance: income.governmentAssistance ? parseFloat(income.governmentAssistance) : null,
        investment_income: income.investments ? parseFloat(income.investments) : null,
        retirement_income: income.retirement ? parseFloat(income.retirement) : null,
        child_support: income.childSupport ? parseFloat(income.childSupport) : null,
        alimony: income.alimony ? parseFloat(income.alimony) : null,
        other_income: income.otherIncome ? parseFloat(income.otherIncome) : null,
        other_income_source: income.otherIncomeSource
      },

      // Store arrays as JSON
      pets: pets,
      vehicles: vehicles,
      dependents: dependents,
    };

    // Add residence information only if it exists and noPastResidence is false
    if (residence && !residence.noPastResidence) {
      Object.assign(insertData, {
        current_address: {
          street: residence.address.street,
          city: residence.address.city,
          province: residence.address.province,
          postal_code: residence.address.postalCode
        },
        move_in_date: residence.moveInDate || null,
        monthly_rent: residence.monthlyRent ? parseFloat(residence.monthlyRent) : null,
        reason_for_leaving: residence.reasonForLeaving,
        landlord_name: residence.landlordName,
        landlord_phone: residence.landlordPhone,
        landlord_email: residence.landlordEmail,
      });
    }

    // Create prospect in database
    const { data: prospectData, error } = await supabase
      .from('people')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Debug logging
    console.log('Created prospect with data:', { 
      id: prospectData.id,
      unit_id: prospectData.unit_id,
      prospect_property: prospectData.prospect_property,
      application_id: prospectData.application_id,
      application_token: prospectData.application_token
    });

    // Get company name
    const { data: companyData, error: companyNameError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyMember.company_id)
      .single();

    if (companyNameError) {
      console.error('Error fetching company name:', companyNameError);
    }

    // Generate a sign-in link for the prospect using OTP instead of admin.generateLink
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: contact.email,
      options: {
        emailRedirectTo: `http://localhost:3001/update-prospect?id=${prospectData.id}&application_id=${applicationId}&token=${applicationToken}`,
        data: {
          prospect_id: prospectData.id,
          company_id: companyMember.company_id,
          role: 'prospect',
          application_id: applicationId,
          application_token: applicationToken
        }
      }
    });

    if (magicLinkError) {
      console.error('Error generating sign-in link:', magicLinkError);
      // Continue with email sending even if link generation fails
    }

    // Send welcome email with magic link
    try {
      await resend.emails.send({
        from: 'Velloa <onboarding@velloa.ca>',
        to: [contact.email],
        subject: 'Welcome to Velloa - Complete Your Application',
        react: ApplicationSubmittedEmail({
          name: `${contact.firstName} ${contact.lastName}`,
          applicationId: applicationId,
          CompanyName: companyData?.name || 'Velloa',
          magicLink: `http://localhost:3001/update-prospect?id=${prospectData.id}&application_id=${applicationId}&token=${applicationToken}`
        }) as React.ReactElement,
        headers: {
          'X-Entity-Ref-ID': applicationId,
        }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't throw here, as we still want to return the prospect data
    }

    return NextResponse.json(prospectData);
  } catch (error) {
    console.error('Error creating prospect:', error);
    return NextResponse.json(
      { error: 'Failed to create prospect' },
      { status: 500 }
    );
  }
} 