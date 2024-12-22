import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Then get the company membership using the profile ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single()

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError)
      return NextResponse.json({ error: 'User is not a member of any company' }, { status: 403 })
    }

    // Get and validate the request body
    const data = await request.json()
    console.log('Received data:', data)

    const {
      category,
      propertyType,
      address,
      selectedAmenities,
      petPolicy,
      units,
      bankAccount,
      reserveFund,
      ownership,
      uploadedFiles
    } = data

    // Validate required fields
    if (!address || !address.street1) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Check if a property with this address already exists for this company
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .eq('company_id', companyMember.company_id)
      .eq('address_line_1', address.street1)
      .eq('city', address.city)
      .eq('state', address.state)
      .eq('zip', address.zipCode)
      .maybeSingle()

    if (existingProperty) {
      return NextResponse.json({ 
        error: 'A property with this address already exists for your company',
        propertyId: existingProperty.id
      }, { status: 409 })
    }

    // Insert the main property record
    console.log('Creating property with data:', {
      name: address.street1,
      address_line_1: address.street1,
      address_line_2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      company_id: companyMember.company_id
    })

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        name: address.street1,
        address_line_1: address.street1,
        address_line_2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zipCode,
        created_at: new Date().toISOString(),
        company_id: companyMember.company_id
      })
      .select()
      .single()

    if (propertyError) {
      console.error('Error creating property:', propertyError)
      return NextResponse.json({ error: `Error creating property: ${propertyError.message}` }, { status: 500 })
    }

    if (!property) {
      console.error('No property returned after insert')
      return NextResponse.json({ error: 'Error creating property: No property returned' }, { status: 500 })
    }

    console.log('Property created successfully:', property)

    // Handle image uploads
    if (uploadedFiles?.length > 0) {
      console.log('Processing uploaded files:', uploadedFiles)

      try {
        for (const file of uploadedFiles) {
          // Extract base64 data
          const base64Data = file.url.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          
          // Generate a unique filename
          const filename = `${property.id}/${Date.now()}-${file.name}`
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase
            .storage
            .from('property-images')
            .upload(filename, buffer, {
              contentType: file.type,
              upsert: false
            })

          if (uploadError) {
            console.error('Error uploading image:', uploadError)
            continue
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase
            .storage
            .from('property-images')
            .getPublicUrl(filename)

          // Save image record in database
          const { error: imageError } = await supabase
            .from('property_images')
            .insert({
              property_id: property.id,
              url: publicUrl,
              created_at: new Date().toISOString()
            })

          if (imageError) {
            console.error('Error saving image record:', imageError)
          }
        }
      } catch (imageError) {
        console.error('Error processing images:', imageError)
      }
    }

    // Insert property settings with amenities as JSON array
    const settingsData = {
      property_id: property.id,
      type: propertyType,
      value: JSON.stringify({
        category,
        petPolicy,
        bankAccount,
        reserveFund,
        ownership,
        amenities: selectedAmenities || [] // Store amenities as an array in the settings
      })
    }
    console.log('Creating property settings:', settingsData)

    const { error: settingsError } = await supabase
      .from('property_settings')
      .insert(settingsData)

    if (settingsError) {
      console.error('Error creating property settings:', settingsError)
      return NextResponse.json({ error: `Error creating property settings: ${settingsError.message}` }, { status: 500 })
    }

    // Insert units
    if (units?.length > 0) {
      const unitRecords = units.map((unit: {
        unitName: string
        beds: string
        baths: string
        size: string
        marketRent: string
      }) => ({
        property_id: property.id,
        unit_name: unit.unitName,
        beds: parseFloat(unit.beds) || 0,
        baths: parseFloat(unit.baths) || 0,
        size: parseFloat(unit.size) || 0,
        market_rent: parseFloat(unit.marketRent.replace(/[^0-9.]/g, '')) || 0,
        created_at: new Date().toISOString()
      }))
      console.log('Creating units:', unitRecords)

      const { error: unitsError } = await supabase
        .from('units')
        .insert(unitRecords)

      if (unitsError) {
        console.error('Error creating units:', unitsError)
        return NextResponse.json({ error: `Error creating units: ${unitsError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: 'Property created successfully',
      propertyId: property.id
    })

  } catch (error) {
    console.error('Error in property creation:', error)
    return NextResponse.json({ 
      error: `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
} 