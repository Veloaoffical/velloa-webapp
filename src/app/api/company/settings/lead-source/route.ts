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
    const { source } = await request.json();

    if (!source) {
      return NextResponse.json({ error: 'Lead source is required' }, { status: 400 });
    }

    // Get current company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('lead_source')
      .eq('companyid', companyMember.company_id)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
    }

    // Prepare the new lead sources array
    const currentSources = settings?.lead_source?.lead_source || [];
    const newSources = [...new Set([...currentSources, source])]; // Use Set to ensure uniqueness

    // Update the existing record
    const { error: updateError } = await supabase
      .from('company_settings')
      .update({
        lead_source: { lead_source: newSources }
      })
      .eq('companyid', companyMember.company_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update company settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, leadsource: newSources });
  } catch (error) {
    console.error('Error in lead source route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 