import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface PropertyOwner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ownership_percentage?: number;
}

interface PropertySettings {
  id: string;
  owners: PropertyOwner[] | null;
}

interface Property {
  id: string;
  name: string;
  property_settings: PropertySettings | null;
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!params.id) {
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      );
    }

    // Get the company ID for the authenticated user
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError) {
      console.error('Error fetching company member:', companyError);
      return NextResponse.json(
        { error: 'Failed to fetch company details', details: companyError.message },
        { status: 500 }
      );
    }

    // First get all property settings that have this owner
    const { data: propertySettings, error: settingsError } = await supabase
      .from('property_settings')
      .select('id, owners');

    if (settingsError) {
      console.error('Error fetching property settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch property settings', details: settingsError.message },
        { status: 500 }
      );
    }

    // Filter property settings to find ones where this person is an owner
    const settingsWithOwner = propertySettings.filter(settings => {
      const owners = settings.owners;
      if (!owners) return false;
      
      // Parse owners if it's a string
      const ownersArray = typeof owners === 'string' ? JSON.parse(owners) : owners;
      
      // Check if the owner ID exists in the owners array
      return Array.isArray(ownersArray) && ownersArray.some(owner => owner.id === params.id);
    });

    if (settingsWithOwner.length === 0) {
      return NextResponse.json([]);
    }

    // Now get the properties that use these settings
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, name')
      .eq('company_id', companyMember.company_id)
      .in('property_settings', settingsWithOwner.map(s => s.id));

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json(
        { error: 'Failed to fetch properties', details: propertiesError.message },
        { status: 500 }
      );
    }

    console.log('Found properties for owner:', properties);

    return NextResponse.json(properties.map(property => ({ property_id: property.id })));
  } catch (error) {
    console.error('Error in properties route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 