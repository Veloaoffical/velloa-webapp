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

    // Get company settings with company ID filter
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('lead_source')
      .eq('companyid', companyMember.company_id)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
    }

    console.log('Retrieved settings:', settings);

    // Get the lead sources array directly from the lead_source field
    const leadSources = settings?.lead_source?.lead_source || [];

    console.log('Lead sources:', leadSources);

    // Return the lead sources array
    return NextResponse.json({
      leadsource: leadSources
    });
  } catch (error) {
    console.error('Error in company settings route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 