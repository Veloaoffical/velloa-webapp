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

interface PropertyTypeData {
  propertyType: string;
  propertyKind: string;
  [key: string]: string | number | boolean | null | undefined; // Allow for additional properties with specific types
}

// Interface for the raw data returned from Supabase
interface PropertySupabaseRecord {
  id: string;
  name: string;
  property_settings: {
    id: string;
    property_description: string;
    property_type: PropertyTypeData | string | Record<string, unknown>;
    status?: boolean;
  }[] | null;
  units: { unit_id: string }[] | null;
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

    // Fetch properties with joined property_settings
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        property_settings(
          id,
          property_description,
          property_type,
          status
        ),
        units(unit_id)
      `)
      .eq('company_id', companyMember.company_id);

    if (propertiesError) {
      throw new Error(`Failed to fetch properties: ${propertiesError.message}`);
    }

    // Transform the data to match the frontend interface
    return properties.map((property: PropertySupabaseRecord) => {
      // Extract property type data from the JSONB field
      let propertyType = 'Unknown';
      let propertyKind = 'Unknown';
      
      // Get the first property_settings object if it exists
      const propertySetting = property.property_settings && property.property_settings.length > 0 
        ? property.property_settings[0] 
        : null;
      
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
              // Silently handle JSON parse errors
            }
          }
        } catch {
          // Silently handle property type processing errors
        }
      }
      
      return {
        id: property.id,
        propertyName: property.name,
        propertyType: propertyType,
        propertyKind: propertyKind,
        numberOfUnits: property.units?.length || 0,
        status: propertySetting && propertySetting.status !== false ? 'active' : 'inactive'
      };
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
