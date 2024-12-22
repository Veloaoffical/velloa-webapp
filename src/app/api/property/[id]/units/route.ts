import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    console.log('Fetching units for property:', params.id)

    // Fetch just the basic unit data first
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', params.id)

    if (unitsError) {
      console.error('Error fetching units:', unitsError)
      return new NextResponse('Error fetching units', { status: 500 })
    }

    if (!units) {
      console.log('No units found')
      return NextResponse.json([])
    }

    console.log('Found units:', units)

    // Transform the data to match the frontend interface
    const transformedUnits = units.map(unit => ({
      id: unit.unit_id,
      unit_name: unit.unit_name || '',
      tenant: 'Vacant', // Default to vacant for now
      beds: unit.beds || 0,
      baths: unit.baths || 0,
      marketRent: unit.market_rent || 0,
      size: `${unit.size || 0} sq ft`,
      status: 'vacant' // Default to vacant for now
    }))

    return NextResponse.json(transformedUnits)
  } catch (error) {
    console.error('Unexpected error in units route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 