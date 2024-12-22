'use server';

import { cookies } from 'next/headers';
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

interface PropertySetting {
  id: string;
  type: string;
  value: string | null;
}

interface PropertyRecord {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  property_settings: PropertySetting[];
  units: { unit_id: string }[] | null;
}

async function getProperties(): Promise<Property[]> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      redirect('/login');
    }

    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return [];
    }

    // First get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

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

    if (companyError || !companyMember) {
      console.error('Error fetching company member:', companyError);
      return [];
    }

    // Fetch properties with their settings and units
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        property_settings!property_settings_property_id_fkey (
          id,
          type,
          value
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

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return [];
    }

    return (properties || []).map(property => {
      // Get the first property setting if it exists
      const settings = property.property_settings?.[0];
      
      // Property type is directly stored in the type field
      const propertyType = settings?.type || 'Unknown';
      
      // Property kind (category) is stored in the value JSON field
      let propertyKind = 'Unknown';
      if (settings?.value) {
        try {
          const parsedValue = JSON.parse(settings.value);
          if (parsedValue && typeof parsedValue === 'object' && 'category' in parsedValue) {
            propertyKind = parsedValue.category;
          }
        } catch (e) {
          console.error(`Error parsing property settings for property ${property.id}:`, e);
        }
      }

      return {
        id: property.id.toString(),
        propertyName: property.name || `Property ${property.id}`,
        propertyType: propertyType, // Use the type directly from the database
        propertyKind: propertyKind.charAt(0).toUpperCase() + propertyKind.slice(1), // Capitalize first letter
        address: [
          property.address_line_1,
          property.address_line_2,
          property.city && property.state && property.zip 
            ? `${property.city}, ${property.state} ${property.zip}`
            : null
        ].filter(Boolean).join(', ') || 'No address provided',
        numberOfUnits: property.units?.length || 0
      };
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
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
