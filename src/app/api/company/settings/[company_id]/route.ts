import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { company_id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = params.company_id;
    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 });
    }
    // Fetch company settings for the given company_id
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('company_email, company_phone_number, company_address')
      .eq('companyid', companyId)
      .single();
    if (settingsError) {
      if (settingsError.code === 'PGRST116' || settingsError.message?.includes('No rows')) {
        return NextResponse.json({ error: 'Company settings not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch company settings', details: settingsError.message }, { status: 500 });
    }
    if (!settings) {
      return NextResponse.json({ error: 'Company settings not found' }, { status: 404 });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
