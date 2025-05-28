import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface Unit {
  id: string;
  unit_number: string;
  property_id: string;
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // The middleware has already authenticated the user
    // We can directly access the user ID from the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.error('Auth error:', sessionError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = session.user
    
    // Get the authenticated user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (companyError) {
      console.error('Company error:', companyError)
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 })
    }

    // Get properties for the company
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, name')
      .eq('company_id', companyMember.company_id)

    if (propertiesError) {
      console.error('Properties error:', propertiesError)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }

    // Get all units for all properties
    const propertyIds = properties.map(p => p.id)
    
    const { data: units, error: unitsError } = await supabase
      .from("units")
      .select("unit_id, unit_name, property_id")
      .in("property_id", propertyIds)
      .order("unit_name")

    if (unitsError) {
      console.error('Units error:', unitsError)
      return NextResponse.json({ error: "Failed to fetch property units" }, { status: 500 })
    }

    // Transform the response to match the expected interface
    const transformedUnits = units.map(unit => ({
      id: unit.unit_id,
      unit_number: unit.unit_name,
      property_id: unit.property_id
    }))

    // Group units by property ID
    const unitsByProperty: Record<string, Unit[]> = transformedUnits.reduce((acc: Record<string, Unit[]>, unit: Unit) => {
      if (!acc[unit.property_id]) {
        acc[unit.property_id] = []
      }
      acc[unit.property_id].push(unit)
      return acc
    }, {})

    return NextResponse.json(unitsByProperty)
  } catch (error) {
    console.error("Error fetching property units:", error)
    return NextResponse.json(
      { error: "Failed to fetch property units" },
      { status: 500 }
    )
  }
} 