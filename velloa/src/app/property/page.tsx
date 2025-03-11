'use server';

import { redirect } from 'next/navigation';
import { PropertyTable } from './property-table';
import { createClient } from '@/utils/supabase/server';

interface Property {
  id: string;
  propertyName: string;
  propertyType: string;
  propertyKind: string;
  address: string;
  numberOfUnits: number;
}

interface PropertyTypeData {
  propertyType: string;
  propertyKind: string;
}

interface PropertySetting {
  id: string;
  type: string;
  property_type: PropertyTypeData;
  amenities: string[];
  pet_policy: Record<string, unknown>;
  owners: Record<string, unknown>;
  bank_accounts: Record<string, unknown>;
}

interface PropertyRecord {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  property_settings: PropertySetting | null;
  units: { unit_id: string }[] | null;
}

async function getProperties(): Promise<Property[]> {
  try {
    console.log('Starting getProperties function');
    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Get the authenticated user using the secure method
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Auth user:', { id: user?.id, error: userError?.message });

    if (!user || userError) {
      console.log('No authenticated user found, redirecting to login');
      redirect('/login');
    }

    // First get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    console.log('Profile query result:', { profile: profile?.id, error: profileError?.message });

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return [];
    }

    // Then get the company membership using the profile ID
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', profile.id)
      .single();
    console.log('Company member query result:', { companyId: companyMember?.company_id, error: companyError?.message });

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError);
      return [];
    }

    // Fetch properties with their settings and units
    console.log('Fetching properties for company:', companyMember.company_id);
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        property_settings (
          id,
          type,
          property_type
        ),
        address_line_1,
        address_line_2,
        city,
        state,
        zip,
        units (
          unit_id
        )
      `)
      .eq('company_id', companyMember.company_id)
      .order('id')
      .returns<PropertyRecord[]>();
    console.log('Properties query result:', { count: properties?.length, error: propertiesError?.message });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return [];
    }

    console.log('Raw properties data:', properties);
    return (properties || []).map(property => {
      console.log('Processing property:', property.id);
      // Get property settings
      const settings = property.property_settings;
      console.log('Property settings:', settings);
      
      // Get property type and kind from settings
      let propertyType = 'Unknown';
      let propertyKind = 'Unknown';
      if (settings?.property_type) {
        try {
          const propertyTypeData = settings.property_type;
          propertyType = propertyTypeData.propertyType || 'Unknown';
          propertyKind = propertyTypeData.propertyKind || 'Unknown';
          console.log('Extracted values:', { propertyType, propertyKind });
        } catch (e) {
          console.error(`Error parsing property_type for property ${property.id}:`, e);
        }
      } else {
        console.log('No property_type found in settings');
      }
      
      const result = {
        id: property.id.toString(),
        propertyName: property.name || `Property ${property.id}`,
        propertyType: propertyType.charAt(0).toUpperCase() + propertyType.slice(1),
        propertyKind: propertyKind.charAt(0).toUpperCase() + propertyKind.slice(1),
        address: [
          property.address_line_1,
          property.address_line_2,
          property.city && property.state && property.zip 
            ? `${property.city}, ${property.state} ${property.zip}`
            : null
        ].filter(Boolean).join(', ') || 'No address provided',
        numberOfUnits: property.units?.length || 0
      };
      console.log('Transformed property:', result);
      return result;
    });

  } catch (error) {
    console.error('Error in getProperties:', error);
    return [];
  }
}

export default async function PropertyPage() {
  const properties = await getProperties();

  return (
    <div className="p-6">
      <h1 className="text-4xl font-semibold mb-6">Property</h1>
      <PropertyTable initialProperties={properties} />
    </div>
  );
}
