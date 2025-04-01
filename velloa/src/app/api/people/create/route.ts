import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';
import { ApplicationSubmittedEmail } from '@/components/Emails/NewProspectEmail';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

interface FileUpload {
  name: string;
  type: string;
  size: number;
  lastModified?: number;
  base64Data?: string;
}

// Define interface for the expected snake_case residence data
interface ResidenceAddressSnakeCase {
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  };
  monthly_rent?: string | number;
  move_in_date?: string;
  landlord_name?: string;
  landlord_email?: string;
  landlord_phone?: string | null;
  reason_for_leaving?: string;
  length_of_stay_years?: number;
  length_of_stay_months?: number;
  residential_status?: string;
}

interface EmploymentData {
  employerName: string;
  jobTitle: string;
  monthlyIncome: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  supervisorName: string;
  supervisorPhone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  verificationDocumentFile?: string | FileUpload; // Base64 string or file object
}

interface PetData {
  type: string;
  breed: string;
  weight: string;
  sex: string;
  age: string;
  photo?: string; // Base64 string
}

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
    // +++ ADD LOG: Raw request body +++
    console.log('--- Raw Request Body Received ---', JSON.stringify(data, null, 2));

    // Destructure using the correct key 'rental_history' and alias it to 'residenceData' for clarity
    const { contact, rental_history: residenceData, pets, vehicles, dependents, employment, income, role, unit_id, property_id, listing_id, prospect_property } = data;

    // +++ ADD LOG: Destructured prospect_property +++
    console.log('--- Destructured prospect_property ---', prospect_property);

    // --- Log Raw Residence Data --- 
    // Log the destructured residenceData (originally sent as rental_history)
    console.log('--- Raw Residence Data Received from Frontend (as rental_history) ---', JSON.stringify(residenceData, null, 2));
    // -------------------------------

    // Debug logging
    console.log('Received data for prospect creation:', { 
      unit_id, 
      property_id,
      listing_id,
      hasUnitId: Boolean(unit_id),
      hasPropertyId: Boolean(property_id),
      hasListingId: Boolean(listing_id),
      prospect_property
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

    // Use the provided prospect_property directly if available, or format it from other fields
    let formattedPropertyData = [];
    
    // If prospect_property is provided directly in the correct format, use it
    if (prospect_property && Array.isArray(prospect_property)) {
      formattedPropertyData = prospect_property;
      console.log('Using directly provided prospect_property:', formattedPropertyData);
    }
    // Otherwise check if listing_id is provided directly
    else if (listing_id) {
      formattedPropertyData.push({ listing_id });
    } 
    // Check if property_id is provided directly
    else if (property_id) {
      formattedPropertyData.push({ property_id });
    }
    
    // Always ensure at least an empty array is assigned, never undefined
    if (!formattedPropertyData || !Array.isArray(formattedPropertyData)) {
      formattedPropertyData = [];
    }
    
    // Log formatted property data for debugging
    console.log('Final formatted property data:', formattedPropertyData);

    // Process employment document uploads if any exist
    const processedEmployment = await Promise.all(employment.map(async (job: EmploymentData, index: number) => {
      let verificationDocumentUrl = null;
      
      if (job.verificationDocumentFile) {
        try {
          // Convert base64 to file and upload to Supabase Storage
          const base64Data = typeof job.verificationDocumentFile === 'string' 
            ? job.verificationDocumentFile.split(',')[1] 
            : job.verificationDocumentFile.base64Data;
            
          if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `prospect_employment_${applicationId}_${index}.pdf`;
            
            // Use Supabase admin client for storage operations to bypass RLS
            const { error: uploadError } = await supabase.storage
              .from('people')
              .upload(`prospect/employment/${filename}`, buffer, {
                contentType: 'application/pdf',
                upsert: true
              });
              
            if (uploadError) {
              console.error('Error uploading employment document:', uploadError);
            } else {
              // Get the public URL
              const { data: urlData } = supabase.storage
                .from('people')
                .getPublicUrl(`prospect/employment/${filename}`);
                
              verificationDocumentUrl = urlData.publicUrl;
            }
          }
        } catch (fileError) {
          console.error('Error processing employment document:', fileError);
        }
      }
      
      return {
        employer_name: job.employerName,
        job_title: job.jobTitle,
        monthly_income: job.monthlyIncome ? parseFloat(job.monthlyIncome) : null,
        employment_type: job.employmentType,
        employment_start_date: job.startDate || null,
        employment_end_date: job.endDate || null,
        is_current_job: job.isCurrentJob,
        supervisor_name: job.supervisorName,
        supervisor_phone: job.supervisorPhone,
        address: {
          street: job.address.street,
          city: job.address.city,
          province: job.address.province,
          postal_code: job.address.postalCode
        },
        verification_document_url: verificationDocumentUrl
      };
    }));

    // Process pet photo uploads if any exist
    const processedPets = await Promise.all((pets || []).map(async (pet: PetData, index: number) => {
      let photoUrl = null;
      
      if (pet.photo) {
        try {
          // Convert base64 to file and upload to Supabase Storage
          const base64Data = pet.photo.split(',')[1];
          if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `prospect_pet_${applicationId}_${index}.jpg`;
            
            // Use Supabase admin client for storage operations to bypass RLS
            const { error: uploadError } = await supabase.storage
              .from('people')
              .upload(`prospect/pets/${filename}`, buffer, {
                contentType: 'image/jpeg',
                upsert: true
              });
              
            if (uploadError) {
              console.error('Error uploading pet photo:', uploadError);
            } else {
              // Get the public URL
              const { data: urlData } = supabase.storage
                .from('people')
                .getPublicUrl(`prospect/pets/${filename}`);
                
              photoUrl = urlData.publicUrl;
            }
          }
        } catch (fileError) {
          console.error('Error processing pet photo:', fileError);
        }
      }
      
      return {
        ...pet,
        photo_url: photoUrl
      };
    }));

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

      // Store property information as JSONB with proper format
      prospect_property: formattedPropertyData,

      // Store employment as JSON with document URLs
      employment: processedEmployment,

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

      // Store arrays as JSON with processed file uploads
      pets: processedPets,
      vehicles: vehicles,
      dependents: dependents,
      // Add custom questions answers
      custom_question_answers: data.customQuestions?.answers || [], // Added custom questions
    };

    // Add residence information only if it exists and no_past_residence is false
    if (residenceData && residenceData.addresses && Array.isArray(residenceData.addresses) && residenceData.addresses.length > 0 && residenceData.no_past_residence !== true) {
      console.log('Adding residence information:', residenceData);
      Object.assign(insertData, {
        // Map directly from the snake_case keys received in the 'residenceData' object
        residence: residenceData.addresses.map((addr: ResidenceAddressSnakeCase) => ({ // Use the specific snake_case interface
          address: {
            street: addr.address?.street, // Use optional chaining for safety
            city: addr.address?.city,
            province: addr.address?.province,
            postal_code: addr.address?.postal_code // Use snake_case key
          },
          // Clean and parse monthly_rent, default to null if invalid
          monthly_rent: addr.monthly_rent ? parseFloat(addr.monthly_rent.toString().replace(/[^\d.]/g, '')) || null : null,
          // move_in_date: addr.move_in_date || null, // Removed obsolete field
          landlord_name: addr.landlord_name, // Use snake_case key
          landlord_email: addr.landlord_email, // Use snake_case key
          landlord_phone: addr.landlord_phone, // Use snake_case key
          no_past_residence: false, // Explicitly set to false here
          reason_for_leaving: addr.reason_for_leaving, // Use snake_case key
          // Ensure length of stay fields are numbers, default to 0 or null as appropriate
          length_of_stay_years: typeof addr.length_of_stay_years === 'number' ? addr.length_of_stay_years : 0,
          length_of_stay_months: typeof addr.length_of_stay_months === 'number' ? addr.length_of_stay_months : 0,
          residential_status: addr.residential_status // Use snake_case key
        }))
      });
    } else {
      // Store empty residence object if no past residence
      console.log('No past residence or missing data, using empty object:', residenceData);
      Object.assign(insertData, {
        residence: [{
          address: {
            city: "",
            street: "",
            province: "",
            postal_code: ""
          },
          monthly_rent: null,
          move_in_date: null,
          landlord_name: "",
          landlord_email: "",
          landlord_phone: "",
          no_past_residence: true,
          reason_for_leaving: "",
          length_of_stay_years: null,
          length_of_stay_months: null,
          residential_status: ""
        }]
      });
    }

    // +++ ADD LOG: Full Insert Data Before DB +++
    console.log('--- Full Insert Data Before DB ---', JSON.stringify(insertData, null, 2));

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
      prospect_property_format: Array.isArray(prospectData.prospect_property) ? 'array' : 'object',
      application_id: prospectData.application_id,
      application_token: prospectData.application_token,
      residence: prospectData.residence,
      has_residence_data: Boolean(prospectData.residence && prospectData.residence.length > 0)
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

    // Send welcome email with application info
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