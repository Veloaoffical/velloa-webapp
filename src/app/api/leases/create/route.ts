import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define the schema for lease creation
const leaseSchema = z.object({
  // Basic lease information
  property_id: z.string().min(1, 'Property ID is required'),
  unit_id: z.string().min(1, 'Unit ID is required'),
  tenant_ids: z.array(z.string()).min(1, 'At least one tenant is required'),
  
  // Lease details
  lease_type: z.enum(['fixed', 'month-to-month']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  rollover_to_month_to_month: z.boolean().optional(),
  
  // Tenant portal settings
  tenant_portal_enabled: z.boolean().optional(),
  renters_insurance_required: z.boolean().optional(),
  
  // Rent and charges
  rent_charges: z.object({
    start_date: z.string().optional(),
    first_rent_due_day: z.number().optional(),
    payment_frequency: z.enum(['monthly', 'weekly', 'bi-weekly', 'quarterly', 'annually']),
    rent_amount: z.string(),
    additional_charges: z.array(z.object({
      id: z.string(),
      type: z.string(),
      description: z.string(),
      amount: z.string(),
    })),
  }),
  
  // Rent increase
  rent_increase: z.object({
    date: z.string().optional(),
    type: z.enum(['dollar', 'percentage']),
    amount: z.string(),
  }).optional(),
  
  // Deposits and discounts
  deposits: z.object({
    show_security_deposit: z.boolean(),
    security_deposit_amount: z.string().optional(),
    show_key_deposit: z.boolean(),
    key_deposit_amount: z.string().optional(),
    key_deposit_description: z.string().optional(),
    show_rent_discount: z.boolean(),
    rent_discount_type: z.enum(['dollar', 'percentage']).optional(),
    rent_discount_amount: z.string().optional(),
    rent_discount_description: z.string().optional(),
  }),
  
  // Late fees
  late_fees: z.object({
    show_late_fees: z.boolean(),
    late_fees: z.array(z.object({
      id: z.string(),
      when_to_charge: z.string(),
      frequency: z.string(),
      calculation_type: z.enum(['fixed', 'percentage']),
      amount: z.string(),
      revenue_account: z.string(),
      description: z.string(),
      show_advanced_options: z.boolean(),
    })),
  }),
  
  // Utilities and features
  utilities: z.object({
    utilities: z.array(z.object({
      name: z.string(),
      responsibility: z.object({
        landlord: z.boolean(),
        tenant: z.boolean(),
        na: z.boolean().optional(),
      }),
      required: z.boolean().optional(),
      custom: z.boolean().optional(),
    })),
    unit_features: z.array(z.object({
      name: z.string(),
      availability: z.object({
        included: z.boolean(),
        not_included: z.boolean(),
        no_charge: z.boolean(),
        pay_per_use: z.boolean(),
      }),
      custom: z.boolean().optional(),
    })),
  }),
  
  // Amenities
  amenities: z.array(z.object({
    name: z.string(),
    is_included: z.boolean(),
    custom: z.boolean().optional(),
  })),
  
  // Policy
  policy: z.object({
    parking: z.array(z.string()),
    number_of_car_spots: z.number().nullable(),
    parking_available: z.boolean(),
    smoking_allowed: z.boolean(),
    smoking_designation: z.string(),
    custom_smoking_text: z.string(),
    pets_allowed: z.boolean(),
    pets_designation: z.string(),
    custom_pets_text: z.string(),
  }),
  
  // Addendum
  addendum: z.object({
    show_addendum: z.boolean(),
  }),
  
  // Documents
  documents: z.object({
    document_status: z.enum(['signed', 'not_signed']).optional(),
    uploaded_documents: z.array(z.object({
      id: z.number(),
      name: z.string(),
      file_path: z.string().optional(),
    })).optional(),
  }),
  
  // Form data (tenant information)
  tenant_form_data: z.object({
    first_name: z.string(),
    middle_name: z.string().optional(),
    last_name: z.string(),
    company: z.string(),
    notes: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    primary_address: z.string(),
    primary_address_2: z.string().optional(),
    secondary_address: z.string().optional(),
    secondary_address_2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string(),
    category: z.string(),
    priority: z.string().optional(),
    assigned_to: z.string().optional(),
    notify: z.boolean().optional(),
    permission_to_enter: z.boolean().optional(),
    notify_assignee: z.enum(["none", "sms", "email", "both"]).optional(),
    secondary_city: z.string().optional(),
    secondary_state: z.string().optional(),
    secondary_postal_code: z.string().optional(),
    secondary_country: z.string().optional(),
    insurance_provider: z.string().optional(),
    policy_number: z.string().optional(),
    coverage: z.string().optional(),
    insurance_start: z.string().optional(),
    insurance_end: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = leaseSchema.parse(body);
    
    // Save lease to database
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .insert({
        property_id: validatedData.property_id,
        unit_id: validatedData.unit_id,
        tenant_id: validatedData.tenant_ids,
        lease_type: validatedData.lease_type,
        start_date: validatedData.start_date ? new Date(validatedData.start_date).toISOString() : null,
        end_date: validatedData.end_date ? new Date(validatedData.end_date).toISOString() : null,
        rollover_to_month_to_month: validatedData.rollover_to_month_to_month,
        tenant_portal_enabled: validatedData.tenant_portal_enabled,
        renters_insurance_required: validatedData.renters_insurance_required,
        
        // Set initial lease status
        lease_status: 'active',
        
        // Rent charges
        rent_amount: parseFloat(validatedData.rent_charges.rent_amount),
        payment_frequency: validatedData.rent_charges.payment_frequency,
        first_rent_due_day: validatedData.rent_charges.first_rent_due_day,
        
        // JSON fields for complex data
        rent_charges: validatedData.rent_charges,
        additional_charges: validatedData.rent_charges.additional_charges,
        rent_increase: validatedData.rent_increase,
        deposits: validatedData.deposits,
        late_fees: validatedData.late_fees,
        utilities: validatedData.utilities,
        amenities: validatedData.amenities,
        policy: validatedData.policy,
        addendum: validatedData.addendum,
        documents: validatedData.documents,
        tenant_form_data: validatedData.tenant_form_data,
      })
      .select()
      .single();

    if (leaseError) {
      console.error('Error creating lease:', leaseError);
      return NextResponse.json({
        success: false,
        message: 'Failed to create lease',
        error: leaseError.message
      }, { status: 500 });
    }

    // Update tenant roles in the people table
    const { error: updateRoleError } = await supabase
      .from('people')
      .update({ role: 'tenant' })
      .in('id', validatedData.tenant_ids);

    if (updateRoleError) {
      console.error('Error updating tenant roles:', updateRoleError);
      // Note: We don't return an error here since the lease was created successfully
      // We just log the error for debugging purposes
    }

    // Log the received data for debugging
    console.log('Lease creation request received:', {
      property_id: validatedData.property_id,
      unit_id: validatedData.unit_id,
      tenant_count: validatedData.tenant_ids.length,
      rent_amount: validatedData.rent_charges.rent_amount,
      payment_frequency: validatedData.rent_charges.payment_frequency,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lease created successfully',
      data: {
        lease_id: lease.id,
        property_id: validatedData.property_id,
        unit_id: validatedData.unit_id,
        tenant_ids: validatedData.tenant_ids,
        created_at: lease.created_at,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating lease:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
    }, { status: 500 });
  }
}

// Optional: Add GET method to retrieve lease data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get('id');
    
    if (!leaseId) {
      return NextResponse.json({
        success: false,
        message: 'Lease ID is required'
      }, { status: 400 });
    }
    
    // Fetch the lease from the database
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('*')
      .eq('id', leaseId)
      .single();

    if (leaseError) {
      console.error('Error fetching lease:', leaseError);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch lease',
        error: leaseError.message
      }, { status: 500 });
    }

    if (!lease) {
      return NextResponse.json({
        success: false,
        message: 'Lease not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: lease
    });
    
  } catch (error) {
    console.error('Error fetching lease:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
