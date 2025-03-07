import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface PropertyType {
  propertyType: string
  propertyKind: string
}

interface PetPolicy {
  petsAllowed: boolean
  allowedPets: string[]
  description?: string
}

interface BankAccountEntry {
  accountName: string
  accountNumber: string
  routingNumber: string
  isDefault: boolean
}

interface BankAccountSettings {
  use_default_bank_accounts?: boolean
  operating_bank_account?: string | null
  escrow_bank_account?: string | null
  accounts?: BankAccountEntry[] | null
}

interface Owner {
  id: string
  name: string
  email: string
  phone?: string
  ownership_percentage?: number
}

interface PropertySettings {
  id: string
  type: string
  property_type: PropertyType | null
  amenities: string[] | null
  pet_policy: PetPolicy | null
  owners: Owner[] | null
  bank_accounts: BankAccountSettings | null
  property_description: string | null
  value: string
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
  property_settings?: PropertySettings
}

interface PropertyResponse extends Omit<Property, 'property_settings'> {
  type: string
  category: string
  description: string
  amenities: string[] | null
  pet_policy: PetPolicy | null
  owners: Owner[] | null
  bank_accounts: BankAccountSettings | null
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    console.log("GET route started - property ID:", params.id)
    const supabase = await createClient()
    console.log("Supabase client created")

    // First get the property data
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*, property_settings(*)")
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
    const settings = property.property_settings || {}
    const propertyType = settings.property_type || {}
    
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
      type: propertyType.propertyKind || "",
      category: propertyType.propertyType || "",
      description: settings.property_description || "",
      amenities: settings.amenities || [],
      pet_policy: settings.pet_policy || null,
      owners: settings.owners || [],
      bank_accounts: settings.bank_accounts || null
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
    const supabase = await createClient()
    const body = await request.json()
    console.log("Update data:", body)

    // First get the current property to check if it has property_settings
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*, property_settings(*)")
      .eq("id", params.id)
      .single()

    if (propertyError) {
      console.error("Error fetching property:", propertyError)
      return new NextResponse(
        JSON.stringify({ error: propertyError.message }),
        { status: 400 }
      )
    }

    // If we have property data to update, do that first
    if (body.name || body.address_line_1 || body.address_line_2 || body.city || body.state || body.zip) {
      const updateData: Partial<Omit<Property, 'property_settings' | 'id' | 'company_id'>> = {}
      if (body.name !== undefined) updateData.name = body.name
      if (body.address_line_1 !== undefined) updateData.address_line_1 = body.address_line_1
      if (body.address_line_2 !== undefined) updateData.address_line_2 = body.address_line_2
      if (body.city !== undefined) updateData.city = body.city
      if (body.state !== undefined) updateData.state = body.state
      if (body.zip !== undefined) updateData.zip = body.zip

      const { error: updatePropertyError } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", params.id)

      if (updatePropertyError) {
        console.error("Error updating property:", updatePropertyError)
        return new NextResponse(
          JSON.stringify({ error: updatePropertyError.message }),
          { status: 400 }
        )
      }
    }

    // Prepare settings update data
    const updateData: Partial<PropertySettings> = {}
    
    if (body.type || body.category) {
      updateData.property_type = {
        propertyType: body.category,
        propertyKind: body.type
      }
    }

    if (body.description !== undefined) {
      updateData.property_description = body.description
    }

    if (body.amenities !== undefined) {
      updateData.amenities = body.amenities
    }

    // Handle pet policy update
    if (body.pet_policy !== undefined) {
      updateData.pet_policy = {
        petsAllowed: body.pet_policy.petsAllowed,
        allowedPets: body.pet_policy.allowedPets || [],
        description: body.pet_policy.description || ""
      }
    }

    // Handle owners update
    if (body.owners !== undefined) {
      updateData.owners = body.owners.map((owner: Owner) => ({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone || null,
        ownership_percentage: owner.ownership_percentage || null
      }))
    }

    // Handle bank account settings
    if (body.use_default_bank_accounts !== undefined) {
      updateData.bank_accounts = {
        use_default_bank_accounts: body.use_default_bank_accounts,
        operating_bank_account: body.use_default_bank_accounts ? null : body.operating_bank_account,
        escrow_bank_account: body.use_default_bank_accounts ? null : body.escrow_bank_account,
        accounts: body.use_default_bank_accounts ? null : (body.bank_accounts || []).map((account: BankAccountEntry) => ({
          accountName: account.accountName,
          accountNumber: account.accountNumber,
          routingNumber: account.routingNumber,
          isDefault: account.isDefault
        }))
      };
    } else if (!body.use_default_bank_accounts) {
      // Only update specific bank account fields if not using defaults
      const existingBankAccounts = property.property_settings?.bank_accounts || {};
      updateData.bank_accounts = {
        ...existingBankAccounts,
        operating_bank_account: body.operating_bank_account,
        escrow_bank_account: body.escrow_bank_account,
        accounts: body.bank_accounts || existingBankAccounts.accounts || []
      };
    }

    // If property already has settings, update them
    if (property.property_settings) {
      console.log("Updating existing settings:", property.property_settings.id)
      const { error: updateError } = await supabase
        .from("property_settings")
        .update(updateData)
        .eq("id", property.property_settings.id)

      if (updateError) {
        console.error("Error updating settings:", updateError)
        return new NextResponse(
          JSON.stringify({ error: updateError.message }),
          { status: 400 }
        )
      }
    } else {
      // If no settings exist, create new ones and link to property
      console.log("Creating new settings")
      const { data: newSettings, error: createError } = await supabase
        .from("property_settings")
        .insert({
          type: body.type || 'default',
          property_type: body.type || body.category ? {
            propertyType: body.category,
            propertyKind: body.type
          } : null,
          property_description: body.description,
          amenities: body.amenities || [], // Initialize empty array if no amenities provided
          pet_policy: body.pet_policy || null,
          owners: body.owners || [], // Initialize empty array if no owners provided
          use_default_bank_accounts: body.use_default_bank_accounts,
          operating_bank_account: body.operating_bank_account,
          escrow_bank_account: body.escrow_bank_account
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating settings:", createError)
        return new NextResponse(
          JSON.stringify({ error: createError.message }),
          { status: 400 }
        )
      }

      // Link the new settings to the property
      const { error: linkError } = await supabase
        .from("properties")
        .update({ property_settings: newSettings.id })
        .eq("id", params.id)

      if (linkError) {
        console.error("Error linking settings:", linkError)
        return new NextResponse(
          JSON.stringify({ error: linkError.message }),
          { status: 400 }
        )
      }
    }

    // Get updated property data for response
    const { data: updatedProperty, error: fetchError } = await supabase
      .from("properties")
      .select("*, property_settings(*)")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Error fetching updated property:", fetchError)
      return new NextResponse(
        JSON.stringify({ error: fetchError.message }),
        { status: 400 }
      )
    }

    const settings = updatedProperty.property_settings || {}
    const propertyType = settings.property_type || {}
    
    const responseData: PropertyResponse = {
      id: updatedProperty.id,
      name: updatedProperty.name,
      address_line_1: updatedProperty.address_line_1,
      address_line_2: updatedProperty.address_line_2,
      city: updatedProperty.city,
      state: updatedProperty.state,
      zip: updatedProperty.zip,
      company_id: updatedProperty.company_id,
      type: propertyType.propertyKind || "",
      category: propertyType.propertyType || "",
      description: settings.property_description || "",
      amenities: settings.amenities || [],
      pet_policy: settings.pet_policy || null,
      owners: settings.owners || [],
      bank_accounts: settings.bank_accounts || null
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating property:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    )
  }
} 