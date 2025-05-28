import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the authenticated user's company ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError) {
      console.error('Company error:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // Get the request body
    const { category } = await request.json();

    // Get current company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('vendor_category')
      .eq('companyid', companyMember.company_id)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
    }

    // Get current vendor categories or initialize if none exist
    const currentCategories = settings?.vendor_category?.vendor_categories || {
      custom: [],
      default: [
        "plumbing",
        "Electrical",
        "HVAC",
        "Carpentry",
        "Painting",
        "Cleaning",
        "Landscaping",
        "General Maintenance"
      ]
    };

    // If the request is to fetch categories (i.e., category is an empty string)
    if (category === "") {
      return NextResponse.json({
        message: "Categories fetched successfully", // Or simply omit message
        vendor_categories: currentCategories
      }, { status: 200 });
    }

    // Validate category for adding: must be a non-empty string
    if (typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json({
        error: 'Category name must be a non-empty string.',
        vendor_categories: currentCategories // It's helpful to return current categories
      }, { status: 400 });
    }

    // Check if category already exists
    const allCategories = [...currentCategories.default, ...currentCategories.custom];
    if (allCategories.map(c => c.toLowerCase()).includes(category.toLowerCase())) {
      return NextResponse.json({
        error: 'Category already exists',
        vendor_categories: currentCategories
      }, { status: 409 }); // Changed status to 409 Conflict
    }

    // Add new category to custom categories
    const updatedCategories = {
      ...currentCategories,
      custom: [...currentCategories.custom, category]
    };

    // Update company settings
    const { error: updateError } = await supabase
      .from('company_settings')
      .update({
        vendor_category: {
          vendor_categories: updatedCategories
        }
      })
      .eq('companyid', companyMember.company_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update company settings' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Category added successfully',
      vendor_categories: updatedCategories
    }, { status: 201 }); // Changed status to 201 Created
  } catch (error) {
    console.error('Error in vendor category route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 