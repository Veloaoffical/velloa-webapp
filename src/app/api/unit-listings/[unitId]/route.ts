// File: velloa/src/app/api/unit-listings/[unitId]/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { unitId: string } }
) {
  const { unitId } = params
  const supabase = await createClient();

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the company ID for the current user
  const { data: companyMember, error: companyMemberError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (companyMemberError) {
    console.error('Error fetching company member data:', companyMemberError);
    return NextResponse.json({ error: 'Failed to fetch company information' }, { status: 500 });
  }

  if (!companyMember || !companyMember.company_id) {
    console.log('User is not associated with any company');
    // Depending on requirements, might return 403 Forbidden or an empty response
    return NextResponse.json({ error: 'User not associated with a company' }, { status: 403 });
  }

  const companyId = companyMember.company_id;

  if (!unitId) {
    return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 })
  }

  try {
    // Fetch unit listing, ensuring it belongs to the user's company via property join
    const { data, error } = await supabase
      .from('unit_listing')
      .select(`
        amenities,
        property:properties!inner(company_id)
      `)
      .eq('unitid', unitId)
      .eq('property.company_id', companyId) // Filter by company ID
      .maybeSingle()

    if (error) {
      console.error('Error fetching unit listing:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If data is null, it means either the unit doesn't exist OR it doesn't belong to the user's company
    if (!data || !data.amenities) {
      return NextResponse.json({ amenities: null, property_address: null, unit_title: null }, { status: 200 })
    }

    // Return all needed fields
    return NextResponse.json({
      amenities: data.amenities,
    }, { status: 200 })
  } catch (e) {
    const error = e as Error
    console.error('Unexpected error fetching unit listing:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}