import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';


export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();

    // Get the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Unit settings ID is required' },
        { status: 400 }
      );
    }

    // Get the authenticated user's company ID from company_members
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // Query for the unit row, scoped to the user's company,
    // and fetch the related unit_settings data
    const { data: unitData, error } = await supabase
      .from('units') // Query the 'units' table
      .select(`
        unit_settings!inner (*)
      `)
      .eq('unit_id', params.id) // Filter by the unit_id from the URL
      .eq('company_id', companyMember.company_id) // Ensure unit belongs to user's company
      .single();

    if (error) {
      console.error('Error fetching unit or unit settings:', error);
      return NextResponse.json(
        { error: 'Error fetching unit settings' }, 
        { status: 500 }
      );
    }

    // Extract the unit_settings data
    const settingsData = unitData?.unit_settings;

    if (!settingsData) {
      return NextResponse.json(
        { error: 'Unit settings not found or not authorized' }, 
        { status: 404 }
      );
    }

    // Return the unit_settings data
    return NextResponse.json(settingsData);
  } catch (error) {
    console.error('Unexpected error in unit-settings route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 