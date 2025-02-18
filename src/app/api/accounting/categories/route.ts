import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("id, account_name, account_type, account_subtype")
      .order("account_name")

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching account categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch account categories" },
      { status: 500 }
    )
  }
} 