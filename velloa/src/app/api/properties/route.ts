import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface PropertySettings {
  type: string;
  value: string;
}

interface Property {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  property_settings?: PropertySettings[];
}

interface PropertySettingsValue {
  category?: string;
  description?: string;
  petPolicy?: {
    petsAllowed: boolean;
    allowedPets: string[];
  };
  bankAccount?: {
    useDefaultAccount: boolean;
    defaultAccountName: string;
  };
  reserveFund?: {
    hasReserve: boolean;
    amount: string;
  };
  ownership?: {
    type: string;
  };
  amenities?: string[];
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
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

    // Get properties for the company
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        address_line_1,
        address_line_2,
        city,
        state,
        zip,
        property_settings (
          type,
          value
        )
      `)
      .eq('company_id', companyMember.company_id)
      .order('name')
      .returns<Property[]>();

    if (propertiesError) {
      console.error('Properties error:', propertiesError);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    // Format the properties for the frontend
    const formattedProperties = properties.map(property => {
      // Get the first property setting if it exists
      const settings = property.property_settings?.[0];
      
      // Parse the settings value if it exists
      let settingsValue: PropertySettingsValue = {};
      if (settings?.value) {
        try {
          settingsValue = typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value;
        } catch (e) {
          console.error(`Error parsing property settings for property ${property.id}:`, e);
        }
      }

      return {
        id: property.id,
        name: property.name,
        address: [
          property.address_line_1,
          property.address_line_2,
          [property.city, property.state, property.zip].filter(Boolean).join(', ')
        ].filter(Boolean).join(', '),
        type: settings?.type || '',
        category: settingsValue.category || '',
        description: settingsValue.description || ''
      };
    });

    return NextResponse.json(formattedProperties);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 