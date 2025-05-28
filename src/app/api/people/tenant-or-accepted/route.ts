import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized', details: userError?.message }, { status: 401 });
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company', details: companyError?.message }, { status: 403 });
    }

    // Fetch tenants
    const { data: tenants, error: tenantsError } = await supabase
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
      .eq('company_id', companyMember.company_id)
      .eq('role', 'tenant');

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return NextResponse.json({ error: 'Failed to fetch tenants', details: tenantsError.message }, { status: 500 });
    }

    // Fetch accepted prospects
    const { data: acceptedProspects, error: prospectsError } = await supabase
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
      .eq('company_id', companyMember.company_id)
      .eq('role', 'prospect')
      .eq('status', 'accepted');

    if (prospectsError) {
      console.error('Error fetching accepted prospects:', prospectsError);
      return NextResponse.json({ error: 'Failed to fetch prospects', details: prospectsError.message }, { status: 500 });
    }

    // Combine and transform the data
    const combinedPeople = [...tenants, ...acceptedProspects];
    
    const transformedPeople = combinedPeople.map(person => ({
      id: person.id,
      name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      email: person.email || '',
      phone: person.phone || '',
      role: person.role || 'Prospect',
      status: (person.status || 'Unknown').toLowerCase()
    }));

    return NextResponse.json(transformedPeople);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 