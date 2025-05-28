import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface UnitResponse {
  unit_id: string;
  unit_name: string;
  beds: number | null;
  baths: number | null;
  market_rent: number | null;
  size: number | null;
  status: string | null;
  property_id: string;
  created_at: string;
  unit_settings: string;
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookies()) })

    // Get the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Unit ID is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user's company ID from company_members
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select(`
        unit_id,
        unit_name,
        beds,
        baths,
        market_rent,
        size,
        unit_settings,
        status,
        property_id,
        created_at,
        company_id
      `)
      .eq('unit_id', params.id)
      .eq('company_id', companyMember.company_id)
      .single()

    if (unitError) {
      console.error('Error fetching unit:', unitError)
      return NextResponse.json(
        { error: 'Error fetching unit' },
        { status: 500 }
      )
    }

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found or not authorized' },
        { status: 404 }
      )
    }

    const typedUnit = unit as UnitResponse & { company_id: string };

    // Transform the data to match the frontend interface
    const transformedUnit = {
      id: typedUnit.unit_id,
      unit_name: typedUnit.unit_name || '',
      tenant: 'Vacant', // Default value since we don't have tenant info in DB yet
      beds: typedUnit.beds || 0,
      baths: typedUnit.baths || 0,
      market_rent: typedUnit.market_rent || 0,
      size: typedUnit.size || 0,
      status: (typedUnit.status as "available" | "occupied" | "vacant") || 'vacant',
      property_id: typedUnit.property_id,
      created_at: typedUnit.created_at,
      unit_settings: typedUnit.unit_settings
    }

    return NextResponse.json(transformedUnit)
  } catch (error) {
    console.error('Unexpected error in unit route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookies()) })
    const body = await request.json()

    // Get the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Unit ID is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user's company ID from company_members
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // Only update if the unit belongs to the user's company
    const { data: unit, error: updateError } = await supabase
      .from('units')
      .update({
        unit_name: body.unit_name,
        beds: body.beds,
        baths: body.baths,
        size: body.size,
        market_rent: body.market_rent,
        unit_settings: body.unit_settings
      })
      .eq('unit_id', params.id)
      .eq('company_id', companyMember.company_id)
      .select()

    if (updateError) {
      console.error('Error updating unit:', updateError)
      return NextResponse.json(
        { error: 'Error updating unit' },
        { status: 500 }
      )
    }

    if (!unit || unit.length === 0) {
      return NextResponse.json(
        { error: 'Unit not found or not authorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Unexpected error in unit route:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 