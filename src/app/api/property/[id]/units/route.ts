import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("units")
      .select("id, unit_name")
      .eq("property_id", params.id)
      .order("unit_name")

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching property units:", error)
    return NextResponse.json(
      { error: "Failed to fetch property units" },
      { status: 500 }
    )
  }
} 