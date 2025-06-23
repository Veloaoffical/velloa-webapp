import { createClient } from '@/utils/supabase/server';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PropertyClient } from './property-client';

function ErrorAlert({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
    </Alert>
  )
}

interface PropertyData {
  id: string;
  name: string;
  property_settings: string | null;
  units: Array<{ unit_id: string }>;
}

async function getProperties() {
  const supabase = await createClient();

  // Helper function to find a property in an object regardless of case
  function findPropertyCaseInsensitive(obj: Record<string, unknown>, propertyName: string): string | undefined {
    // First try exact match
    if (obj[propertyName] !== undefined) {
      return obj[propertyName] as string;
    }
    
    // Try case-insensitive match
    const lowerPropertyName = propertyName.toLowerCase();
    for (const key in obj) {
      if (key.toLowerCase() === lowerPropertyName) {
        return obj[key] as string;
      }
    }
    
    return undefined;
  }

  try {
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      throw new Error('Failed to get company');
    }

    // First, fetch properties with their property_settings UUID and units
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        property_settings,
        units(unit_id)
      `)
      .eq('company_id', companyMember.company_id);

    if (propertiesError) {
      throw new Error(`Failed to fetch properties: ${propertiesError.message}`);
    }

    if (!properties || properties.length === 0) {
      return [];
    }

    // Get all unique property_settings UUIDs
    const propertySettingsIds = properties
      .map(p => p.property_settings)
      .filter(id => id !== null);

    // Fetch all property_settings data
    const { data: propertySettings, error: settingsError } = await supabase
      .from('property_settings')
      .select('id, property_type, property_address, status')
      .in('id', propertySettingsIds);

    if (settingsError) {
      throw new Error(`Failed to fetch property settings: ${settingsError.message}`);
    }

    // Create a map for quick lookup
    const settingsMap = new Map();
    if (propertySettings) {
      propertySettings.forEach(setting => {
        settingsMap.set(setting.id, setting);
      });
    }

    // Transform the data to match the frontend interface
    return properties.map((property: PropertyData) => {
      // Extract property type data from the JSONB field
      let propertyType = 'Unknown';
      let propertyKind = 'Unknown';
      let address = 'Unknown';
      
      // Get the property_settings data using the UUID
      const propertySetting = property.property_settings ? settingsMap.get(property.property_settings) : null;
      
      // Extract address from property_address JSONB
      if (propertySetting && propertySetting.property_address) {
        try {
          const addressData = propertySetting.property_address;
          if (typeof addressData === 'object' && addressData !== null) {
            const addr = addressData as Record<string, unknown>;
            const streetNumber = addr.street_number || '';
            const street = addr.street || '';
            const city = addr.city || '';
            const province = addr.province || '';
            const postalCode = addr.postal_code || '';
            
            // Format address: "64 Tawes Trail, King City, ON L7B1B4"
            const addressParts = [];
            if (streetNumber && street) {
              addressParts.push(`${streetNumber} ${street}`);
            } else if (street) {
              addressParts.push(street);
            }
            if (city) addressParts.push(city);
            if (province) addressParts.push(province);
            if (postalCode) addressParts.push(postalCode);
            
            if (addressParts.length > 0) {
              address = addressParts.join(', ');
            }
          }
        } catch {
          // Handle address processing errors silently
        }
      }
      
      if (propertySetting && propertySetting.property_type) {
        try {
          const propertyTypeData = propertySetting.property_type;
          
          // For object, extract values
          if (typeof propertyTypeData === 'object' && propertyTypeData !== null) {
            const typedData = propertyTypeData as Record<string, unknown>;
            
            const foundPropertyType = findPropertyCaseInsensitive(typedData, 'propertyType');
            if (foundPropertyType !== undefined) {
              propertyType = foundPropertyType;
            }
            
            const foundPropertyKind = findPropertyCaseInsensitive(typedData, 'propertyKind');
            if (foundPropertyKind !== undefined) {
              propertyKind = foundPropertyKind;
            }
          } 
          // If it's a string (JSON), parse it
          else if (typeof propertyTypeData === 'string') {
            try {
              const typeData = JSON.parse(propertyTypeData);
              
              const foundPropertyType = findPropertyCaseInsensitive(typeData, 'propertyType');
              if (foundPropertyType !== undefined) {
                propertyType = foundPropertyType;
              }
              
              const foundPropertyKind = findPropertyCaseInsensitive(typeData, 'propertyKind');
              if (foundPropertyKind !== undefined) {
                propertyKind = foundPropertyKind;
              }
            } catch {
              // Handle JSON parse errors silently
            }
          }
        } catch {
          // Handle property type processing errors silently
        }
      }
      
      const result = {
        id: property.id,
        propertyName: property.name,
        propertyType: propertyType,
        propertyKind: propertyKind,
        numberOfUnits: property.units?.length || 0,
        status: propertySetting && propertySetting.status !== false ? 'active' : 'inactive',
        address: address
      };
      
      return result;
    });
  } catch (error) {
    throw error;
  }
}

export default async function PropertyPage() {
  try {
    const properties = await getProperties();
    
    return <PropertyClient initialProperties={properties} />;
  } catch (error) {
    return (
      <div className="p-6">
        <ErrorAlert error={error instanceof Error ? error : new Error('An unknown error occurred')} />
      </div>
    );
  }
}
