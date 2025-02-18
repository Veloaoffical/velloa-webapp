import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
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

    // Get properties for the company to verify access
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', params.id)
      .eq('company_id', companyMember.company_id)
      .single()

    if (propertyError || !property) {
      console.error('Property error:', propertyError)
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 })
    }

    // Get units for the property
    const { data, error } = await supabase
      .from("units")
      .select("unit_id, unit_name")
      .eq("property_id", params.id)
      .order("unit_name")

    if (error) {
      console.error('Units error:', error)
      return NextResponse.json({ error: "Failed to fetch property units" }, { status: 500 })
    }

    // Transform the response to match the expected interface
    const transformedData = data?.map(unit => ({
      id: unit.unit_id,
      unit_name: unit.unit_name
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching property units:", error)
    return NextResponse.json(
      { error: "Failed to fetch property units" },
      { status: 500 }
    )
  }
} 