import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚀 ============= DEFAULT ACCOUNTS FETCH START =============');
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth User:', {
      id: user?.id,
      email: user?.email,
      role: user?.role
    });
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile:', {
      exists: !!profile,
      data: profile,
      error: profileError
    });

    if (profileError || !profile) {
      console.error('❌ Error fetching profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    // Get the authenticated user's company ID using profile ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single();

    console.log('🏢 Company Membership:', {
      exists: !!companyMember,
      data: companyMember,
      error: companyError
    });

    if (companyError) {
      console.error('❌ Error fetching company member:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // Get company default accounts settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('default_account')
      .eq('companyid', companyMember.company_id)
      .single();

    console.log('⚙️ Settings:', {
      exists: !!settings,
      data: settings,
      error: settingsError
    });

    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch default accounts settings' }, { status: 500 });
    }

    console.log('✅ Default accounts fetched successfully');
    return NextResponse.json(settings?.default_account || {});
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    console.log('🏁 ============= DEFAULT ACCOUNTS FETCH END =============');
  }
}

export async function POST(req: Request) {
  try {
    console.log('🚀 ============= DEFAULT ACCOUNTS UPDATE START =============');
    const supabase = await createClient();
    const data = await req.json();

    console.log('📥 Received data:', JSON.stringify(data, null, 2));

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth User:', {
      id: user?.id,
      email: user?.email,
      role: user?.role
    });
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    console.log('👤 Profile:', {
      exists: !!profile,
      data: profile,
      error: profileError
    });

    if (profileError || !profile) {
      console.error('❌ Error fetching profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    // Get the authenticated user's company ID using profile ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single();

    console.log('🏢 Company Membership:', {
      exists: !!companyMember,
      data: companyMember,
      error: companyError
    });

    if (companyError) {
      console.error('❌ Error fetching company member:', companyError);
      return NextResponse.json({ error: 'Failed to get company' }, { status: 403 });
    }

    // Check if company settings exist
    const { data: existingSettings } = await supabase
      .from('company_settings')
      .select('id')
      .eq('companyid', companyMember.company_id)
      .single();

    console.log('⚙️ Existing Settings:', {
      exists: !!existingSettings,
      id: existingSettings?.id
    });

    let result;
    if (existingSettings) {
      // Update existing settings
      console.log('📝 Updating existing settings...');
      result = await supabase
        .from('company_settings')
        .update({ 
          default_account: {
            ...data,
            updated_at: new Date().toISOString()
          }
        })
        .eq('companyid', companyMember.company_id);
    } else {
      // Create new settings
      console.log('📝 Creating new settings...');
      result = await supabase
        .from('company_settings')
        .insert({
          companyid: companyMember.company_id,
          default_account: {
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
    }

    const { error: operationError } = result;
    if (operationError) {
      console.error('❌ Operation error:', operationError);
      return NextResponse.json({ 
        error: `Failed to ${existingSettings ? 'update' : 'create'} default accounts settings`,
        details: operationError.message 
      }, { status: 500 });
    }

    console.log('✅ Default accounts updated successfully');
    return NextResponse.json({ 
      message: `Default accounts settings ${existingSettings ? 'updated' : 'created'} successfully` 
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  } finally {
    console.log('🏁 ============= DEFAULT ACCOUNTS UPDATE END =============');
  }
}

export const dynamic = 'force-dynamic'; 