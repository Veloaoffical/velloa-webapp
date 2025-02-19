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

    // Get company default accounts settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('default_accounts')
      .eq('company_id', companyMember.company_id)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch default accounts settings' }, { status: 500 });
    }

    return NextResponse.json(settings?.default_accounts || {});
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

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

    // Update company default accounts settings
    const { error: updateError } = await supabase
      .from('company_settings')
      .update({ 
        default_accounts: body,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyMember.company_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update default accounts settings' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Default accounts settings updated successfully' });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 