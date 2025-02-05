import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('Starting GET /api/people request');
  try {
    console.log('Creating Supabase client');
    const supabase = await createClient();

    // Get the authenticated user
    console.log('Getting authenticated user');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', {
        error: userError,
        errorMessage: userError?.message,
        user
      });
      return NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 });
    }
    console.log('User authenticated:', user.id);

    // Get the company membership
    console.log('Getting company membership for user:', user.id);
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company membership error:', {
        error: companyError,
        errorMessage: companyError?.message,
        userId: user.id
      });
      return NextResponse.json({ error: 'Failed to get company', details: companyError?.message }, { status: 403 });
    }
    console.log('Found company membership:', companyMember.company_id);

    // Fetch people from the people table
    console.log('Fetching people for company:', companyMember.company_id);
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        status
      `)
      .eq('company_id', companyMember.company_id);

    if (peopleError) {
      console.error('Error fetching people:', {
        error: peopleError,
        errorMessage: peopleError.message,
        companyId: companyMember.company_id
      });
      return NextResponse.json({ error: 'Failed to fetch people', details: peopleError.message }, { status: 500 });
    }

    console.log('Successfully fetched people:', {
      count: people?.length || 0,
      companyId: companyMember.company_id
    });

    // Transform the data to match the frontend interface
    const transformedPeople = people.map(person => ({
      id: person.id,
      name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      email: person.email,
      phone: person.phone,
      role: person.role,
      status: person.status
    }));

    console.log('Transformed people data:', {
      count: transformedPeople.length,
      sampleRoles: transformedPeople.slice(0, 3).map(p => p.role)
    });

    return NextResponse.json(transformedPeople);
  } catch (error) {
    console.error('Unexpected error in people route:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 