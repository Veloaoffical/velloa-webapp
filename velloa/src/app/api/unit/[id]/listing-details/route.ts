import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()

    // First get the unit details to ensure the unit exists
    const { data: unitDetails, error: unitError } = await supabase
      .from('units')
      .select('unit_name')
      .eq('unit_id', params.id)
      .single()

    if (unitError) {
      console.error('Error fetching unit:', unitError)
      return new NextResponse(
        JSON.stringify({ error: 'Unit not found' }),
        { status: 404 }
      )
    }

    // Then get the listing details
    const { data: listingDetails, error } = await supabase
      .from('unit_listing')
      .select('*')
      .eq('unitid', params.id)
      .single()

    if (error && error.code !== 'PGRST116') { // Ignore not found error
      throw error
    }

    // If no listing exists yet, return default values with unit name
    if (!listingDetails) {
      return NextResponse.json({
        listing_description: "",
        property_title: unitDetails.unit_name,
        status: "draft",
        favorite_photo: null,
        included_in_rent: {},
        interior_appliances: {},
        heating: {},
        cooling: {},
        laundry: {},
        parking: {},
        exterior: {}
      })
    }

    // Extract amenities from the database response
    const {
      included_in_rent = {},
      interior_appliances = {},
      heating = {},
      cooling = {},
      laundry = {},
      parking = {},
      exterior = {}
    } = listingDetails.amenities || {}

    // Return the formatted response
    return NextResponse.json({
      listing_description: listingDetails.listing_description || "",
      property_title: listingDetails.property_title || unitDetails.unit_name,
      status: listingDetails.status || "draft",
      favorite_photo: listingDetails.favorite_photo || null,
      included_in_rent,
      interior_appliances,
      heating,
      cooling,
      laundry,
      parking,
      exterior
    })
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Error fetching listing details' }),
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated and is a company member
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      )
    }
    
    // Check if the user is a company member
    const { data: companyMember, error: memberError } = await supabase
      .from('company_members')
      .select('id')
      .eq('id', user.id)
      .single()
      
    if (memberError || !companyMember) {
      return new NextResponse(
        JSON.stringify({ error: 'Only company members can update listing details' }),
        { status: 403 }
      )
    }
    
    const body = await request.json()

    // Log the request body for debugging
    console.log('Request body:', body)
    console.log('Unit ID:', params.id)

    // Validate required fields
    if (!body.description) {
      return new NextResponse(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400 }
      )
    }

    // First, check if a record exists
    const { data: existingRecord } = await supabase
      .from('unit_listing')
      .select('listingid')
      .eq('unitid', params.id)
      .single()

    // Fetch unit details
    const { data: unitDetails, error: unitError } = await supabase
      .from('units')
      .select('unit_name, beds, baths, market_rent, size')
      .eq('unit_id', params.id)
      .single()

    if (unitError) {
      console.error('Error fetching unit details:', unitError)
      return new NextResponse(
        JSON.stringify({ error: 'Error fetching unit details', details: unitError }),
        { status: 500 }
      )
    }

    // Prepare amenities object including favorite_photo
    const amenities = {
      included_in_rent: body.included_in_rent || {},
      interior_appliances: body.interior_appliances || {},
      heating: body.heating || {},
      cooling: body.cooling || {},
      laundry: body.laundry || {},
      parking: body.parking || {},
      exterior: body.exterior || {},
      favorite_photo: body.favorite_photo || null
    }

    let result;

    if (existingRecord?.listingid) {
      // Update existing record
      const { data: updatedData, error: updateError } = await supabase
        .from('unit_listing')
        .update({
          listing_description: body.description,
          property_title: body.property_title || unitDetails.unit_name,
          status: body.status || 'draft',
          available_date: body.available_date,
          amenities: amenities
        })
        .eq('listingid', existingRecord.listingid)
        .select()

      if (updateError) {
        console.error('Update error:', updateError)
        return new NextResponse(
          JSON.stringify({ 
            error: `Database error: ${updateError.message}`,
            details: updateError
          }),
          { status: 500 }
        )
      }
      result = updatedData
    } else {
      // Insert new record
      const { data: insertedData, error: insertError } = await supabase
        .from('unit_listing')
        .insert({
          unitid: params.id,
          listing_description: body.description,
          property_title: body.property_title || unitDetails.unit_name,
          status: body.status || 'draft',
          available_date: body.available_date,
          amenities: amenities,
          created_at: new Date().toISOString()
        })
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        return new NextResponse(
          JSON.stringify({ 
            error: `Database error: ${insertError.message}`,
            details: insertError
          }),
          { status: 500 }
        )
      }
      result = insertedData
    }

    return new NextResponse(JSON.stringify({ 
      success: true,
      data: result
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error updating listing details',
        details: error
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}