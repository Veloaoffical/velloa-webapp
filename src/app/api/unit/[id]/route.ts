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
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    if (!params.id) {
      return NextResponse.json(
        { error: 'Unit ID is required' },
        { status: 400 }
      )
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
        status,
        property_id,
        created_at
      `)
      .eq('unit_id', params.id)
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
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    const typedUnit = unit as UnitResponse;

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
      created_at: typedUnit.created_at
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()

    if (!params.id) {
      return NextResponse.json(
        { error: 'Unit ID is required' },
        { status: 400 }
      )
    }

    const { data: unit, error: updateError } = await supabase
      .from('units')
      .update({
        unit_name: body.unit_name,
        beds: body.beds,
        baths: body.baths,
        size: body.size,
        market_rent: body.market_rent
      })
      .eq('unit_id', params.id)
      .select()

    if (updateError) {
      console.error('Error updating unit:', updateError)
      return NextResponse.json(
        { error: 'Error updating unit' },
        { status: 500 }
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