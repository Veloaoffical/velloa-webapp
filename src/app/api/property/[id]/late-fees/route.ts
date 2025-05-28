import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

interface LateFee {
  type: string;
  amount: number;
  frequency: string;
  gracePeriod?: number;
  revenueAccount: string;
  description?: string;
}

interface LateFeeSettings {
  isEnabled: boolean;
  lateFees: LateFee[];
  maxDailyFeesEnabled: boolean;
  maxMonthlyFeesEnabled: boolean;
  minBalanceEnabled: boolean;
  applyToMostRecentEnabled: boolean;
  applyToSpecificEnabled: boolean;
  maxDailyAmount: string;
  maxMonthlyAmount: string;
  minBalanceAmount: string;
  selectedChargeTypes: string;
  useCompanyPolicy: boolean;
}

interface RequestBody {
  late_fees: LateFeeSettings;
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*, property_settings(*)")
      .eq("id", params.id)
      .single();

    if (propertyError) {
      console.error("Error fetching property:", propertyError);
      return new NextResponse(
        JSON.stringify({ error: propertyError.message }),
        { status: 400 }
      );
    }

    if (!property) {
      return new NextResponse(
        JSON.stringify({ error: "Property not found" }),
        { status: 404 }
      );
    }

    const lateFees = property.property_settings?.late_fees as LateFeeSettings | null;
    return NextResponse.json({
      late_fees: lateFees || {
        isEnabled: false,
        lateFees: [],
        maxDailyFeesEnabled: false,
        maxMonthlyFeesEnabled: false,
        minBalanceEnabled: false,
        applyToMostRecentEnabled: false,
        applyToSpecificEnabled: false,
        maxDailyAmount: "",
        maxMonthlyAmount: "",
        minBalanceAmount: "",
        selectedChargeTypes: "",
        useCompanyPolicy: true
      }
    });
  } catch (error) {
    console.error("Error in GET /api/property/[id]/late-fees:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const body = await request.json() as RequestBody;

    // First get the property to check if it has property_settings
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("*, property_settings(*)")
      .eq("id", params.id)
      .single();

    if (propertyError) {
      console.error("Error fetching property:", propertyError);
      return new NextResponse(
        JSON.stringify({ error: propertyError.message }),
        { status: 400 }
      );
    }

    if (!property) {
      return new NextResponse(
        JSON.stringify({ error: "Property not found" }),
        { status: 404 }
      );
    }

    // If property has settings, update them
    if (property.property_settings) {
      const { error: updateError } = await supabase
        .from("property_settings")
        .update({
          late_fees: body.late_fees
        })
        .eq("id", property.property_settings.id);

      if (updateError) {
        console.error("Error updating late fees:", updateError);
        return new NextResponse(
          JSON.stringify({ error: updateError.message }),
          { status: 400 }
        );
      }
    } else {
      // If no settings exist, create new ones
      const { error: createError } = await supabase
        .from("property_settings")
        .insert({
          property_id: params.id,
          type: 'default',
          late_fees: body.late_fees
        });

      if (createError) {
        console.error("Error creating late fees:", createError);
        return new NextResponse(
          JSON.stringify({ error: createError.message }),
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/property/[id]/late-fees:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
} 