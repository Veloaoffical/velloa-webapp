import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const createVendorSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_name: z.string().optional(),
  company: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  about_you: z.string().optional(),
  services: z.object({
    categories: z.array(z.string()),
    classifications: z.array(z.string())
  }),
  address_info: z.object({
    primary: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional()
    }),
    secondary: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional()
    }).nullable()
  }),
  properties_access: z.object({
    type: z.enum(['all', 'specific']),
    property_ids: z.array(z.string()).optional()
  }),
  insurance: z.object({
    provider: z.string().optional(),
    policy_number: z.string().optional(),
    coverage: z.string().optional(),
    effective_date: z.string().optional(),
    expiration_date: z.string().optional()
  })
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Company membership not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = createVendorSchema.parse(body);

    // Insert the new vendor
    const { data: vendor, error: insertError } = await supabase
      .from('people')
      .insert([
        {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          middle_name: validatedData.middle_name,
          company: validatedData.company,
          email: validatedData.email,
          phone: validatedData.phone,
          about_you: validatedData.about_you,
          services: validatedData.services,
          address_info: validatedData.address_info,
          service_address: validatedData.properties_access.type === 'all' ? { type: 'all' } : {
            type: 'specific',
            property_ids: validatedData.properties_access.property_ids
          },
          insurance: validatedData.insurance.provider ? validatedData.insurance : null,
          role: 'vendor',
          company_id: companyMember.company_id,
          userid: user.id,
          status: 'active',
          unit_id: null
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Vendor insertion failed:', insertError);
      return NextResponse.json(
        { error: 'Failed to create vendor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Vendor created successfully',
      vendor
    });

  } catch (error) {
    console.error("[VENDOR_CREATE]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 