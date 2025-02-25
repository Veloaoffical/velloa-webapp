import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for our data structures
interface Category {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
}

interface ChargeData {
  category_id: string;
  description: string;
  amount: number;
}

interface Charge {
  id: string;
  company_id: string;
  lease_id: string;
  property_id: string;
  unit_id: string;
  tenant_id: string;
  data: ChargeData;
  due_date: string;
  memo: string | null;
  reference: string;
  status: string;
  created_by: string;
  share_with_tenants: boolean;
  category?: Category;
  leases?: {
    tenant_name: string;
    unit_name: string;
    property_name: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { 
      lease_id, 
      due_date, 
      category_id, 
      description, 
      amount, 
      memo, 
      reference,
      share_with_tenants 
    } = body;

    // Validate required fields
    if (!lease_id || !due_date || !category_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Create a new charge directly with the lease_id from the request
    // No need to fetch lease data first
    const chargeId = uuidv4();
    const { data: charge, error: chargeError } = await supabase
      .from('charges')
      .insert({
        id: chargeId,
        company_id,
        lease_id,  // Using the lease_id directly from the request
        property_id: null,  // We're not fetching property_id anymore
        unit_id: null,      // We're not fetching unit_id anymore
        tenant_id: null,    // Not using tenant_id
        transaction_id: null,
        data: {
          category_id,
          description: description || '',
          amount
        },
        due_date,
        memo: memo || JSON.stringify({
          "root": {
            "type": "root",
            "format": "",
            "indent": 0,
            "version": 1,
            "children": [
              {
                "type": "paragraph",
                "format": "",
                "indent": 0,
                "version": 1,
                "children": [],
                "direction": null,
                "textStyle": "",
                "textFormat": 0
              }
            ],
            "direction": null
          }
        }),
        reference,
        status: 'unpaid',
        created_by: user.id,
        share_with_tenants: share_with_tenants || false
      })
      .select()
      .single();

    if (chargeError) {
      console.error('Error creating charge:', chargeError);
      return NextResponse.json(
        { error: 'Failed to create charge' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(charge, { status: 201 });
  } catch (error) {
    console.error('Error in charges API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company_id from the user's session
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Failed to get company data:', companyError);
      return NextResponse.json(
        { error: 'Failed to get company data' }, 
        { status: 500 }
      );
    }

    const company_id = companyMember.company_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const lease_id = searchParams.get('lease_id');
    const property_id = searchParams.get('property_id');
    const unit_id = searchParams.get('unit_id');
    const tenant_id = searchParams.get('tenant_id');
    const status = searchParams.get('status');
    const category_id = searchParams.get('category_id');

    console.log('Fetching charges with params:', { 
      lease_id, property_id, unit_id, tenant_id, status, category_id, company_id 
    });

    try {
      // Build the query - simplified to avoid join issues
      let query = supabase
        .from('charges')
        .select('*')  // Just select all columns from charges table without joins
        .eq('company_id', company_id);

      // Apply filters if provided
      if (lease_id) query = query.eq('lease_id', lease_id);
      if (property_id) query = query.eq('property_id', property_id);
      if (unit_id) query = query.eq('unit_id', unit_id);
      if (tenant_id) query = query.eq('tenant_id', tenant_id);
      if (status) query = query.eq('status', status);
      if (category_id) query = query.eq('data->category_id', category_id);

      // Order by due date if available
      query = query.order('due_date', { ascending: false });

      // Execute the query
      const { data: charges, error: chargesError } = await query;

      if (chargesError) {
        console.error('Error fetching charges:', chargesError);
        return NextResponse.json(
          { error: 'Failed to fetch charges: ' + chargesError.message }, 
          { status: 500 }
        );
      }

      console.log('Charges fetched successfully:', charges ? charges.length : 0);
      if (charges && charges.length > 0) {
        console.log('Sample charge data:', charges[0]);
      }
      
      // If we need to fetch category information separately
      if (charges && charges.length > 0) {
        // Get unique category IDs from the charges
        const categoryIds = [...new Set(charges
          .filter(charge => charge.data && charge.data.category_id)
          .map(charge => charge.data.category_id))];
        
        if (categoryIds.length > 0) {
          const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('id, account_name, account_type, account_subtype')
            .in('id', categoryIds);
          
          if (!categoriesError && categories) {
            // Create a map for quick lookup with proper typing
            const categoryMap: Record<string, Category> = categories.reduce((acc: Record<string, Category>, cat: Category) => {
              acc[cat.id] = cat;
              return acc;
            }, {});
            
            // Attach category information to each charge
            charges.forEach((charge: Charge) => {
              if (charge.data && charge.data.category_id && categoryMap[charge.data.category_id]) {
                charge.category = categoryMap[charge.data.category_id];
              }
            });
          }
        }
      }

      // Return the charges even if empty
      return NextResponse.json(charges || []);
    } catch (queryError) {
      console.error('Error in database query:', queryError);
      return NextResponse.json(
        { error: 'Database query error: ' + (queryError instanceof Error ? queryError.message : String(queryError)) }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in charges API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
} 