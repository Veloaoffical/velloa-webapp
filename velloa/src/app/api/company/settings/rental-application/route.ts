import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const companyId = companyMember.company_id;
    
    // Get company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('rental_application')
      .eq('companyid', companyId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // Not "no rows returned" error
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch rental application settings' }, { status: 500 });
    }

    // If no settings found, return empty object
    return NextResponse.json(settings || { rental_application: null });
  } catch (error) {
    console.error('Error in rental application settings route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const rentalApplicationSettings = await request.json();
    
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

    const companyId = companyMember.company_id;
    
    // Check if settings already exist for this company
    const { data: existingSettings } = await supabase
      .from('company_settings')
      .select('id')
      .eq('companyid', companyId)
      .maybeSingle();
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      console.log('Updating existing rental application settings for company', companyId);
      
      const { data, error } = await supabase
        .from('company_settings')
        .update({ rental_application: rentalApplicationSettings })
        .eq('companyid', companyId)
        .select();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new settings
      console.log('Creating new settings with rental application for company', companyId);
      
      const { data, error } = await supabase
        .from('company_settings')
        .insert({
          companyid: companyId,
          rental_application: rentalApplicationSettings
        })
        .select();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving rental application settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 