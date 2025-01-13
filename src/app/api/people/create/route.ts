import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { ApplicationSubmittedEmail } from '@/components/Emails/NewProspectEmail';

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
    const { contact, residence, pets, vehicles, dependents, employment, income, role, unit_id } = data;

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

    // Get company name
    const { data: companyData, error: companyNameError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyMember.company_id)
      .single();

    if (companyNameError) {
      console.error('Error fetching company name:', companyNameError);
    }

    // Generate a unique ID for the application
    const applicationId = crypto.randomUUID();

    // Send welcome email
    try {
      await resend.emails.send({
        from: 'Velloa <onboarding@velloaapp.com>',
        to: [contact.email],
        subject: 'Welcome to Velloa - Complete Your Application',
        react: ApplicationSubmittedEmail({
          name: `${contact.firstName} ${contact.lastName}`,
          confirmationNumber: applicationId,
          CompanyName: companyData?.name || 'Velloa'
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