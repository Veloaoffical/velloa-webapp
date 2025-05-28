import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    console.log('GET /api/people/[id] - Starting request for ID:', params.id)
    const supabase = await createClient()

    if (!params.id) {
      console.error('Missing person ID in request')
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      )
    }

    // First try to get from people table
    console.log('Fetching person details from people table for ID:', params.id)
    const { data: person, error: personError } = await supabase
      .from('people')
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        email,
        phone,
        ssn,
        drivers_license_state,
        drivers_license_number,
        date_of_birth,
        gender,
        marital_status,
        about_you,
        status,
        company_id,
        residence,
        pets,
        vehicles,
        dependents,
        employment,
        income,
        company
      `)
      .eq('id', params.id)
      .single()

    if (personError) {
      console.error('Database error when fetching from people:', {
        error: personError,
        errorMessage: personError.message,
        errorDetails: personError.details,
        errorHint: personError.hint,
        params
      })
      return NextResponse.json(
        { 
          error: 'Error fetching from people',
          details: personError.message
        },
        { status: 500 }
      )
    }

    if (person) {
      console.log('Found person in people table:', { id: person.id })
      return NextResponse.json(person)
    }

    // If we get here, we couldn't find the person
    console.error('Person not found:', params.id)
    return NextResponse.json(
      { 
        error: 'Person not found',
        details: `No person exists with ID: ${params.id}`
      },
      { status: 404 }
    )

  } catch (error) {
    console.error('Unexpected error in person route:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      params
    })
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Get the person's current details
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('role, service_address')
      .eq('id', params.id)
      .single();

    if (personError) {
      console.error('Error fetching person:', personError);
      return NextResponse.json(
        { error: 'Failed to fetch person details', details: personError.message },
        { status: 500 }
      );
    }

    // If this is a vendor and we're updating property assignments
    if (person.role === 'vendor' && 'propertiesAccess' in body) {
      // Parse existing service_address or initialize empty object
      const serviceAddress = person.service_address ? 
        (typeof person.service_address === 'string' ? JSON.parse(person.service_address) : person.service_address) 
        : {};

      // Update service_address with new property access settings
      const updatedServiceAddress = {
        ...serviceAddress,
        type: body.propertiesAccess,
        property_ids: body.propertiesAccess === 'specific' ? body.selectedProperties : []
      };

      // Update vendor's service_address field
      const { error: updateError } = await supabase
        .from('people')
        .update({ service_address: updatedServiceAddress })
        .eq('id', params.id);

      if (updateError) {
        console.error('Error updating service address:', updateError);
        return NextResponse.json(
          { error: 'Failed to update service address', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Successfully updated vendor properties' });
    }

    // Handle general information updates
    const updateData: Record<string, string | null> = {};
    
    // Helper function to convert empty strings to null
    const sanitizeValue = (value: string): string | null => {
      return value.trim() === '' ? null : value;
    };
    
    // Map form fields to database fields
    if (body.firstName !== undefined) updateData.first_name = sanitizeValue(body.firstName);
    if (body.middleName !== undefined) updateData.middle_name = sanitizeValue(body.middleName);
    if (body.lastName !== undefined) updateData.last_name = sanitizeValue(body.lastName);
    if (body.company !== undefined) updateData.company = sanitizeValue(body.company);
    if (body.email !== undefined) updateData.email = sanitizeValue(body.email);
    if (body.phone !== undefined) updateData.phone = sanitizeValue(body.phone);
    if (body.ssn !== undefined) updateData.ssn = sanitizeValue(body.ssn);
    if (body.driversLicenseState !== undefined) updateData.drivers_license_state = sanitizeValue(body.driversLicenseState);
    if (body.driversLicenseNumber !== undefined) updateData.drivers_license_number = sanitizeValue(body.driversLicenseNumber);
    if (body.dateOfBirth !== undefined) updateData.date_of_birth = sanitizeValue(body.dateOfBirth);
    if (body.gender !== undefined) updateData.gender = sanitizeValue(body.gender);
    if (body.maritalStatus !== undefined) updateData.marital_status = sanitizeValue(body.maritalStatus);

    // Only update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', params.id);

      if (updateError) {
        console.error('Error updating person:', updateError);
        return NextResponse.json(
          { error: 'Failed to update person', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Successfully updated person details' });
    }

    return NextResponse.json({ message: 'No changes made' });
  } catch (error) {
    console.error('Error in PUT route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      );
    }

    // Delete the person
    const { error: deleteError } = await supabase
      .from('people')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting person:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete person', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 