import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// List all fields you want to support for company info
const COMPANY_INFO_FIELDS = [
  'company_name',
  'company_type',
  'company_website',
  'company_phone_number',
  'company_email',
  'company_address', // Ensure this is a JSON column in your DB
  'business_registration_number',
  'timezone',
  'company_fiscal_start_date',
  'company_currency',
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get company ID for user
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }
    // Get company info
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select(COMPANY_INFO_FIELDS.join(','))
      .eq('companyid', companyMember.company_id)
      .single();
    if (settingsError) {
      return NextResponse.json({ error: 'Failed to fetch company info', details: settingsError }, { status: 500 });
    }
    return NextResponse.json(settings || {});
  } catch (err) {
    console.error('API error in GET /api/company/settings/companyinfo:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();
    if (companyError || !companyMember) {
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }
    const body = await req.json();

    // Map form fields to DB columns
    const updateData: Record<string, unknown> = {
      company_name: body.companyName,
      company_type: body.companyType,
      company_website: body.website,
      company_phone_number: body.businessPhone,
      company_email: body.businessEmail,
      timezone: body.timeZone,
      business_registration_number: body.registrationNumber,
      company_fiscal_start_date: body.fiscalYearStart ? body.fiscalYearStart.split('T')[0] : null,
      company_currency: body.currency,
      company_address: {
        streetNumber: body.streetNumber,
        streetName: body.streetName,
        poBox: body.poBox,
        city: body.city,
        unit: body.unit,
        province: body.province,
        postalCode: body.postalCode,
        country: body.country,
      },
    };

    // Log the data being upserted
    console.log('Upserting company_settings:', { ...updateData, companyid: companyMember.company_id });

    // Upsert company info
    const { error: upsertError } = await supabase
      .from('company_settings')
      .upsert([
        { ...updateData, companyid: companyMember.company_id },
      ], { onConflict: 'companyid' });
    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message || 'Failed to save company info', details: upsertError }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API error in POST /api/company/settings/companyinfo:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 