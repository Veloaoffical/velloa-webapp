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
    const { classification } = await request.json();

    // Get current company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('vendor_classification')
      .eq('companyid', companyMember.company_id)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
    }

    // Get current vendor classifications or initialize if none exist
    const currentClassifications = settings?.vendor_classification?.vendor_classifications || {
      custom: [],
      default: [
        "contractor",
        "supplier",
        "consultant",
        "service_provider",
        "manufacturer",
        "distributor"
      ]
    };

    // If no classification provided, just return the list (for fetch)
    if (!classification) {
      return NextResponse.json({ vendor_classifications: currentClassifications });
    }

    // Check if classification already exists
    const allClassifications = [...currentClassifications.default, ...currentClassifications.custom];
    if (allClassifications.map(c => c.toLowerCase()).includes(classification.toLowerCase())) {
      return NextResponse.json({ error: 'Classification already exists' }, { status: 400 });
    }

    // Add new classification to custom classifications
    const updatedClassifications = {
      ...currentClassifications,
      custom: [...currentClassifications.custom, classification]
    };

    // Update company settings
    const { error: updateError } = await supabase
      .from('company_settings')
      .update({
        vendor_classification: {
          vendor_classifications: updatedClassifications
        }
      })
      .eq('companyid', companyMember.company_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update company settings' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Classification added successfully',
      vendor_classifications: updatedClassifications
    });
  } catch (error) {
    console.error('Error in vendor classification route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 