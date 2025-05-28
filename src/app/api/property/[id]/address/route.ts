import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the property to get the property_settings id
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("property_settings")
      .eq("id", params.id)
      .eq("company_id", companyMember.company_id)
      .single();

    if (propertyError || !property || !property.property_settings) {
      return NextResponse.json({ error: "Property not found or no settings" }, { status: 404 });
    }

    // Fetch the property_settings row by its id
    const { data: settings, error: settingsError } = await supabase
      .from("property_settings")
      .select("property_address")
      .eq("id", property.property_settings)
      .single();

    if (settingsError || !settings || !settings.property_address) {
      return NextResponse.json({ error: "Property address not found" }, { status: 404 });
    }

    return NextResponse.json(settings.property_address);
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 }
    );
  }
} 