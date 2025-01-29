import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

interface PropertySettingsValue {
  category?: string
  description?: string
  petPolicy?: {
    petsAllowed: boolean
    allowedPets: string[]
  }
  bankAccount?: {
    useDefaultAccount: boolean
    defaultAccountName: string
  }
  reserveFund?: {
    hasReserve: boolean
    amount: string
  }
  ownership?: {
    type: string
  }
  amenities?: string[]
}

interface PropertySettings {
  type: string
  value: string | PropertySettingsValue
}

interface Property {
  id: string
  name: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  zip: string
  company_id: string
  property_settings?: PropertySettings[]
}

interface PropertyResponse extends Omit<Property, 'property_settings'> {
  type: string
  category: string
  description: string
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    console.log("GET route started - property ID:", params.id)
    const supabase = createRouteHandlerClient({ cookies })
    console.log("Supabase client created")

    // First get the property data
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select(`
        id,
        name,
        address_line_1,
        address_line_2,
        city,
        state,
        zip,
        company_id,
        property_settings (
          type,
          value
        )
      `)
      .eq("id", params.id)
      .single()

    if (propertyError) {
      console.error("Supabase error:", propertyError.message, propertyError.details, propertyError.hint)
      return new NextResponse(
        JSON.stringify({ error: propertyError.message, details: propertyError.details }),
        { status: 400 }
      )
    }

    if (!property) {
      console.log("No property found with ID:", params.id)
      return new NextResponse(
        JSON.stringify({ error: "Property not found" }),
        { status: 404 }
      )
    }

    // Extract settings from property data
    const settings = property.property_settings?.[0] || { type: "", value: "{}" }
    
    // Parse the settings value
    let settingsValue: PropertySettingsValue = {}
    try {
      settingsValue = typeof settings.value === 'string' 
        ? JSON.parse(settings.value)
        : settings.value
    } catch (e) {
      console.error("Error parsing settings value:", e)
    }
    
    // Create response without property_settings using object destructuring
    const propertyWithoutSettings: Omit<Property, 'property_settings'> = {
      id: property.id,
      name: property.name,
      address_line_1: property.address_line_1,
      address_line_2: property.address_line_2,
      city: property.city,
      state: property.state,
      zip: property.zip,
      company_id: property.company_id
    }
    
    const responseData: PropertyResponse = {
      ...propertyWithoutSettings,
      type: settings.type || "",
      category: settingsValue.category || "",
      description: settingsValue.description || ""
    }

    console.log("Successfully fetched property:", responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Unexpected error in GET route:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    console.log("Updating property with ID:", params.id)
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    console.log("Update data:", body)

    let property = null

    // Only update property data if we have property fields
    if (body.name || body.address_line_1 || body.address_line_2 || body.city || body.state || body.zip) {
      const { data: updatedProperty, error: propertyError } = await supabase
        .from("properties")
        .update({
          name: body.name,
          address_line_1: body.address_line_1,
          address_line_2: body.address_line_2,
          city: body.city,
          state: body.state,
          zip: body.zip
        })
        .eq("id", params.id)
        .select()
        .single()

      if (propertyError) {
        console.error("Supabase error updating property:", propertyError)
        return new NextResponse(
          JSON.stringify({ error: propertyError.message, details: propertyError.details }),
          { status: 400 }
        )
      }

      property = updatedProperty
    } else {
      // If we're not updating property data, just fetch the current property
      const { data: currentProperty, error: propertyError } = await supabase
        .from("properties")
        .select()
        .eq("id", params.id)
        .single()

      if (propertyError) {
        console.error("Supabase error fetching property:", propertyError)
        return new NextResponse(
          JSON.stringify({ error: propertyError.message, details: propertyError.details }),
          { status: 400 }
        )
      }

      property = currentProperty
    }

    // Get existing settings
    const { data: existingSettings, error: getSettingsError } = await supabase
      .from("property_settings")
      .select("value, type")
      .eq("property_id", params.id)
      .single()

    if (getSettingsError && getSettingsError.code !== "PGRST116") {
      console.error("Error fetching existing settings:", getSettingsError)
      return new NextResponse(
        JSON.stringify({ error: getSettingsError.message, details: getSettingsError.details }),
        { status: 400 }
      )
    }

    // Parse the existing settings value
    let currentSettings: PropertySettingsValue = {}
    try {
      currentSettings = existingSettings?.value ? 
        (typeof existingSettings.value === 'string' ? 
          JSON.parse(existingSettings.value) : 
          existingSettings.value) 
        : {}
    } catch (e) {
      console.error("Error parsing existing settings:", e)
    }

    // Create new settings with updated category and/or description
    const newSettings: PropertySettingsValue = {
      ...currentSettings,
      category: body.type ? body.category : currentSettings.category,
      description: body.description !== undefined ? body.description : currentSettings.description
    }

    // First try to update existing settings
    const { error: updateError } = await supabase
      .from("property_settings")
      .update({
        type: body.type || existingSettings?.type || 'general',
        value: JSON.stringify(newSettings) // Stringify the value before saving
      })
      .eq('property_id', params.id)

    // If update fails because no row exists, then insert
    if (updateError && updateError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from("property_settings")
        .insert({
          property_id: params.id,
          type: body.type || 'general',
          value: JSON.stringify(newSettings) // Stringify the value before saving
        })

      if (insertError) {
        console.error("Error inserting settings:", insertError)
        return new NextResponse(
          JSON.stringify({ error: insertError.message, details: insertError.details }),
          { status: 400 }
        )
      }
    } else if (updateError) {
      console.error("Error updating settings:", updateError)
      return new NextResponse(
        JSON.stringify({ error: updateError.message, details: updateError.details }),
        { status: 400 }
      )
    }

    // Create response without property_settings using object destructuring
    const propertyWithoutSettings: Omit<Property, 'property_settings'> = {
      id: property.id,
      name: property.name,
      address_line_1: property.address_line_1,
      address_line_2: property.address_line_2,
      city: property.city,
      state: property.state,
      zip: property.zip,
      company_id: property.company_id
    }
    
    const responseData: PropertyResponse = {
      ...propertyWithoutSettings,
      type: body.type || existingSettings?.type || "",
      category: body.category || currentSettings.category || "",
      description: body.description || currentSettings.description || ""
    }

    console.log("Updated property:", responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating property:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    )
  }
} 