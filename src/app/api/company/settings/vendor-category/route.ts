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

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

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

    // Check if category already exists
    const allCategories = [...currentCategories.default, ...currentCategories.custom];
    if (allCategories.map(c => c.toLowerCase()).includes(category.toLowerCase())) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
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
    });
  } catch (error) {
    console.error('Error in vendor category route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 