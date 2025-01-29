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

    // First try to get from profiles
    console.log('Fetching person details from profiles table for ID:', params.id)
    const { data: profilePerson, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        move_in_date
      `)
      .eq('id', params.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Database error when fetching from profiles:', {
        error: profileError,
        errorMessage: profileError.message,
        errorDetails: profileError.details,
        errorHint: profileError.hint,
        params
      })
      // Only return error if it's not a "not found" error
      return NextResponse.json(
        { 
          error: 'Error fetching from profiles',
          details: profileError.message
        },
        { status: 500 }
      )
    }

    if (profilePerson) {
      console.log('Found person in profiles table:', { id: profilePerson.id })
      return NextResponse.json(profilePerson)
    }

    // If not in profiles, try company_members
    console.log('Trying company_members table for ID:', params.id)
    const { data: memberPerson, error: memberError } = await supabase
      .from('company_members')
      .select(`
        id,
        profiles!inner (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('id', params.id)
      .single()

    if (memberError) {
      console.error('Database error when fetching from company_members:', {
        error: memberError,
        errorMessage: memberError.message,
        errorDetails: memberError.details,
        errorHint: memberError.hint,
        params
      })
      return NextResponse.json(
        { 
          error: 'Error fetching from company_members',
          details: memberError.message
        },
        { status: 500 }
      )
    }

    if (memberPerson?.profiles) {
      console.log('Found person in company_members table:', { id: memberPerson.id })
      return NextResponse.json({
        id: memberPerson.id,
        ...memberPerson.profiles
      })
    }

    // If we get here, we couldn't find the person in either table
    console.error('Person not found in any table:', params.id)
    return NextResponse.json(
      { 
        error: 'Person not found',
        details: `No person exists with ID: ${params.id} in profiles or company_members`
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