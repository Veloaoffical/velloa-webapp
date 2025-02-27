import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";

// Create a custom nanoid that only uses capital letters and numbers
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

// Define interface for charge data
interface ChargeData {
  company_id: string;
  people_id: string;
  bill_date: string;
  due_date: string;
  property_id: string | null;
  charge_amount: {
    lines: {
      line_id: string;
      amount: number;
      category: string;
      reference: number;
      description?: string;
      property_id: string | null;
      unit_id: string | null;
    }[];
    total_amount: number;
  };
  amount_remaining: {
    lines: {
      line_id: string;
      amount: number;
      category: string;
      reference: number;
      description?: string;
      property_id: string | null;
      unit_id: string | null;
    }[];
    total_amount: number;
  };
  memo?: unknown;
  reference?: string;
  status: string;
  created_by: string;
  start_date?: string;
  frequency?: string;
  repeat_infinite?: boolean;
  unit_id: string | null;
}

// Define the schema for bill line items
const BillLineSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive(),
  category_id: z.string().uuid(),
  property_id: z.string().uuid().nullable(),
  unit_id: z.string().uuid().nullable(),
  line_id: z.string().optional()
});

// Define the schema for the bill creation request
const BillCreateSchema = z.object({
  people_id: z.string().uuid(),
  bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(BillLineSchema).min(1),
  memo: z.any().nullable().optional(),
  reference: z.string().optional(),
  status: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  frequency: z.string().optional(),
  repeat_infinite: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    const company_id = companyMember.company_id;

    // Parse the request body
    const body = await request.json();
    
    // Validate the request body against the schema
    const validationResult = BillCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const billData = validationResult.data;

    // Verify the vendor exists and belongs to the company
    const { data: vendorData, error: vendorError } = await supabase
      .from("people")
      .select("id")
      .eq("id", billData.people_id)
      .eq("company_id", company_id)
      .eq("role", "vendor")
      .single();

    if (vendorError || !vendorData) {
      return NextResponse.json(
        { error: "Vendor not found or does not belong to your company" },
        { status: 404 }
      );
    }

    // Verify the unit exists if one is specified
    const firstLine = billData.lines[0];
    let validatedUnitId: string | null = null;
    
    console.log("Checking unit_id:", firstLine.unit_id);
    // Only proceed with unit validation if unit_id exists and is not null
    if (firstLine.unit_id) {
      console.log("Validating unit_id:", firstLine.unit_id);
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .select("id")
        .eq("id", firstLine.unit_id)
        .eq("property_id", firstLine.property_id)
        .single();

      if (unitError) {
        console.error("Error verifying unit:", unitError);
        return NextResponse.json(
          { error: "Invalid unit selected" },
          { status: 400 }
        );
      }

      if (!unitData) {
        console.error("Unit not found:", firstLine.unit_id);
        return NextResponse.json(
          { error: "Unit not found" },
          { status: 404 }
        );
      }
      
      validatedUnitId = unitData.id;
      console.log("Unit validated:", validatedUnitId);
    }

    // Transform line items and calculate total
    const transformedLines = billData.lines.map(line => {
      const lineItem: {
        line_id: string;
        amount: number;
        category: string;
        reference: number;
        description?: string;
        property_id: string | null;
        unit_id: string | null;
      } = {
        line_id: line.line_id || nanoid(),
        amount: line.amount,
        category: line.category_id,
        reference: 0,
        description: line.description || undefined,
        property_id: line.property_id,
        unit_id: null // Default to null
      };
      
      // Only set unit_id if it has a valid value
      if (line.unit_id) {
        lineItem.unit_id = line.unit_id;
      }
      
      return lineItem;
    });

    const totalAmount = transformedLines.reduce((sum, line) => sum + line.amount, 0);

    // Prepare charge data
    const chargeData: ChargeData = {
      company_id,
      people_id: billData.people_id,
      bill_date: billData.bill_date,
      due_date: billData.due_date,
      property_id: billData.lines[0].property_id,
      unit_id: null, // Default to null
        charge_amount: {
          lines: transformedLines,
          total_amount: totalAmount
        },
        amount_remaining: {
          lines: transformedLines,
          total_amount: totalAmount
        },
      memo: billData.memo,
      reference: billData.reference,
      status: billData.status,
      created_by: user.id,
      start_date: billData.start_date,
      frequency: billData.frequency,
      repeat_infinite: billData.repeat_infinite
    };

    // Only set unit_id if it exists and is not null
    if (firstLine.unit_id) {
      chargeData.unit_id = validatedUnitId;
    }

    console.log("Creating charge with data:", chargeData);

    // Create the charge record
    const { data: charge, error: chargeError } = await supabase
      .from("charges")
      .insert(chargeData)
      .select()
      .single();

    if (chargeError) {
      console.error("Error creating charge:", chargeError);
      return NextResponse.json(
        { error: chargeError.message || "Failed to create bill" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: charge.id, success: true });
  } catch (error) {
    console.error("Unexpected error in bill creation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    const company_id = companyMember.company_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const vendor_id = searchParams.get("vendor_id");
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    
    // Build the query
    let query = supabase
      .from("vendor_bills")
      .select(`
        id,
        bill_date,
        due_date,
        reference,
        status,
        memo,
        vendor_id,
        vendors (
          id,
          name,
          email
        ),
        vendor_bill_lines (
          id,
          property_id,
          unit_id,
          category_id,
          description,
          amount
        )
      `)
      .eq("company_id", company_id)
      .order("bill_date", { ascending: false });

    // Apply filters if provided
    if (status) {
      query = query.eq("status", status);
    }
    
    if (vendor_id) {
      query = query.eq("vendor_id", vendor_id);
    }
    
    if (from_date) {
      query = query.gte("bill_date", from_date);
    }
    
    if (to_date) {
      query = query.lte("bill_date", to_date);
    }

    // Execute the query
    const { data: bills, error } = await query;

    if (error) {
      console.error("Error fetching bills:", error);
      return NextResponse.json(
        { error: "Failed to fetch bills" },
        { status: 500 }
      );
    }

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Unexpected error in fetching bills:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 