import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Fetching property with ID:", params.id)
    const supabase = createRouteHandlerClient({ cookies })

    const { data: property, error } = await supabase
      .from("properties")
      .select(`
        id,
        name,
        address_line_1,
        address_line_2,
        city,
        state,
        zip,
        country,
        description
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    console.log("Fetched property:", property)
    return NextResponse.json(property)
  } catch (error) {
    console.error("Error fetching property:", error)
    return new NextResponse("Error fetching property", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Updating property with ID:", params.id)
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    console.log("Update data:", body)

    const { data: property, error } = await supabase
      .from("properties")
      .update({
        name: body.name,
        address_line_1: body.address_line_1,
        address_line_2: body.address_line_2,
        city: body.city,
        state: body.state,
        zip: body.zip,
        country: body.country,
        description: body.description,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    console.log("Updated property:", property)
    return NextResponse.json(property)
  } catch (error) {
    console.error("Error updating property:", error)
    return new NextResponse("Error updating property", { status: 500 })
  }
}