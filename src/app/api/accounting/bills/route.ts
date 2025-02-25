import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

// Define the schema for bill line items
const BillLineSchema = z.object({
  property_id: z.string().uuid(),
  unit_id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  description: z.string().optional(),
  amount: z.number().positive()
});

// Define the schema for the bill creation request
const BillCreateSchema = z.object({
  vendor_id: z.string().uuid(),
  bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(BillLineSchema).min(1),
  memo: z.string().optional(),
  reference: z.string().optional()
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
      .from("vendors")
      .select("id")
      .eq("id", billData.vendor_id)
      .eq("company_id", company_id)
      .single();

    if (vendorError || !vendorData) {
      return NextResponse.json(
        { error: "Vendor not found or does not belong to your company" },
        { status: 404 }
      );
    }

    // Start a transaction to create the bill and its line items
    const { data: bill, error: billError } = await supabase
      .from("vendor_bills")
      .insert({
        company_id,
        vendor_id: billData.vendor_id,
        bill_date: billData.bill_date,
        due_date: billData.due_date,
        memo: billData.memo,
        reference: billData.reference,
        status: "unpaid",
        created_by: user.id
      })
      .select("id")
      .single();

    if (billError || !bill) {
      console.error("Error creating bill:", billError);
      return NextResponse.json(
        { error: "Failed to create bill" },
        { status: 500 }
      );
    }

    // Create bill line items
    const billLines = billData.lines.map(line => ({
      bill_id: bill.id,
      property_id: line.property_id,
      unit_id: line.unit_id,
      category_id: line.category_id,
      description: line.description || "",
      amount: line.amount,
      company_id
    }));

    const { error: linesError } = await supabase
      .from("vendor_bill_lines")
      .insert(billLines);

    if (linesError) {
      console.error("Error creating bill lines:", linesError);
      // If there's an error with the lines, we should delete the bill to maintain consistency
      await supabase.from("vendor_bills").delete().eq("id", bill.id);
      return NextResponse.json(
        { error: "Failed to create bill lines" },
        { status: 500 }
      );
    }

    // Create a transaction record for accounting
    const totalAmount = billData.lines.reduce((sum, line) => sum + line.amount, 0);
    
    const { error: transactionError } = await supabase
      .from("accounting_transactions")
      .insert({
        company_id,
        transaction_date: billData.bill_date,
        transaction_type: "vendor_bill",
        reference_id: bill.id,
        amount: totalAmount,
        description: `Bill for ${billData.vendor_id}`,
        created_by: user.id
      });

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError);
      // We'll still return success since the bill was created
    }

    return NextResponse.json({ id: bill.id, success: true });
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