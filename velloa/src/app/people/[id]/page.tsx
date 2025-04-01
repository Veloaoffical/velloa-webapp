import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PersonDetailsClient } from './components/PersonDetailsClient';

// --- Define and Export necessary types ---

export interface PropertyImage {
  id: string;
  fileUrl: string; // Assuming fileUrl field based on usage
  fileName: string;
  createdAt: string;
  favorite: boolean;
  isFavorite: boolean; // Note: Seems redundant with favorite
  listing_favorite_image?: boolean; // Optional based on schema
}

export interface PropertyDetails {
  id: string;
  name: string;
  address_line_1: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
  property_images?: PropertyImage[];
}

export interface UnitImage {
    id: string;
    fileUrl: string; // Assuming fileUrl field
    fileName: string;
    createdAt: string;
    favorite: boolean;
    isFavorite: boolean; // Note: Seems redundant with favorite
}

export interface UnitDetails {
  id: string;
  unit_name: string;
  beds: number;
  baths: number;
  market_rent: number;
  size: number;
  status: string;
  property_id: string;
  created_at: string;
  property?: {
    name: string;
    address_line_1: string;
    city: string;
    state: string;
    zip: string;
  };
  unit_images?: UnitImage[];
}

export interface AssigneeDetails {
  id: string;
  first_name: string;
  last_name: string;
}

export interface VendorServiceAddress {
  type: 'all' | 'specific';
  property_ids?: string[];
}

// Define PersonDetails interface with potentially required fields from Overview
export interface PersonDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string; // May need re-evaluation based on role
  unit_id: string | null;
  role: string;
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
  agreement_start: string | null;
  agreement_end: string | null;
  portal_status: boolean;
  // Fields potentially needed by PersonOverview - fetched in getPersonData
  service_address?: string | VendorServiceAddress; // Store raw initially, parse later
  insurance?: { // Assuming structure based on PersonOverview
    coverage: string;
    provider: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
  };
  services?: { // Assuming structure based on PersonOverview
    categories: string[];
    classifications: string[];
  };
  // Other fields from original page.tsx PersonDetails if needed elsewhere
  unit?: {
    unit_number: string; // This seems redundant if we fetch full unitDetails
    property_name?: string;
  } | null;
    address_info?: { // Keep if used by other components like PersonSettings
    primary?: { street?: string; city?: string; province?: string; postalCode?: string; country?: string; };
    secondary?: { street?: string; city?: string; province?: string; postalCode?: string; country?: string; } | null;
  };
  payments_settings?: { // Keep if used by other components like PersonSettings
    enabled: boolean; method?: 'email' | 'mail_check'; billing_email?: string;
  };
  residence?: { // Keep if used by other components like PersonSettings
    address?: { street: string; city: string; province: string; postal_code: string; };
    move_in_date?: string | null; monthly_rent?: number | null; reason_for_leaving?: string;
    landlord_name?: string; landlord_phone?: string; landlord_email?: string; noPastResidence?: boolean;
  };
}

// Define the return type for the enhanced getPersonData
type GetPersonDataResult = {
  personDetails: PersonDetails; // Use the updated PersonDetails type
  userRole: string;
  assigneeDetails: AssigneeDetails | null;
  properties: PropertyDetails[] | null;
  unitDetails: UnitDetails | null;
  serviceAddress: VendorServiceAddress | null; // Parsed service address for vendors
};

// Helper function to fetch property images (if needed separately)
/*
async function getPropertyImages(supabase: any, propertyId: string): Promise<PropertyImage[]> {
    // Note: Adjust table and column names ('property_images', 'fileUrl', 'createdAt') if different in your schema
    const { data: images, error } = await supabase
        .from('property_images')
        .select('id, fileUrl, fileName, createdAt, favorite, isFavorite, listing_favorite_image')
        .eq('property_id', propertyId);

    if (error) {
        console.error(`Error fetching images for property ${propertyId}:`, error);
        return [];
    }
    return images || [];
}
*/

// Helper function to fetch unit images (if needed separately)
/*
async function getUnitImages(supabase: any, unitId: string): Promise<UnitImage[]> {
    // Note: Adjust table and column names ('unit_images', 'fileUrl', 'createdAt') if different in your schema
    const { data: images, error } = await supabase
        .from('unit_images')
        .select('id, fileUrl, fileName, createdAt, favorite, isFavorite')
        .eq('unit_id', unitId);

    if (error) {
        console.error(`Error fetching images for unit ${unitId}:`, error);
        return [];
    }
    return images || [];
}
*/

async function getPersonData(id: string): Promise<GetPersonDataResult> {
  const supabase = await createClient();

  // Get user (keep existing logic)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User not authenticated, redirecting to login.');
    redirect('/login');
  }

  try {
    // Fetch person details (select needed fields and relations)
    // Adjust select string based on actual related table names and fields
    const personQuery = supabase
      .from('people')
      // Temporarily select only '*' to isolate the issue
      .select('*') 
      /* Original select with relations:
      .select(`
        *,
        insurance:insurance_info(*),
        services:service_info(*)
      `) // Example: Fetch related insurance/services if needed
      */
      .eq('id', id)
      .maybeSingle();

    const { data: person, error: personError } = await personQuery;

    if (personError) {
      console.error('Error fetching person details:', personError);
      notFound();
    }
    if (!person) {
      console.log('No person found with ID:', id);
      notFound();
    }

    // Fetch user role (keep existing logic)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Consider default role or redirect based on requirements
    }
    const userRole = profile?.role || '';


    // Initialize additional data
    let assigneeDetails: AssigneeDetails | null = null;
    let properties: PropertyDetails[] | null = null;
    let unitDetails: UnitDetails | null = null;
    let serviceAddress: VendorServiceAddress | null = null;


    // --- Fetch additional data based on role ---

    // 1. Fetch Assignee Details (if assignee_id exists)
    if (person.assignee_id) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('profiles') // Assuming assignees are in 'profiles'
        .select('id, first_name, last_name')
        .eq('id', person.assignee_id)
        .maybeSingle(); // Use maybeSingle as assignee might not exist

      if (assigneeError) {
        console.error('Error fetching assignee details:', assigneeError);
      } else if (assignee) {
        assigneeDetails = assignee;
      }
    }

    // 2. Fetch Properties (for owner or vendor)
    if (person.role === 'owner') {
        // Assuming properties linked via 'owner_id'. Adjust if needed.
        const { data: ownerProperties, error: ownerPropsError } = await supabase
            .from('properties')
            .select('*, property_images(*)') // Fetch images relation
            .eq('owner_id', person.id);

        if (ownerPropsError) {
            console.error('Error fetching owner properties:', ownerPropsError);
        } else {
            properties = ownerProperties || [];
        }

    } else if (person.role === 'vendor') {
        // Parse service_address
        try {
            const rawAddress = person.service_address;
            if (rawAddress) {
                serviceAddress = typeof rawAddress === 'string' ? JSON.parse(rawAddress) : rawAddress;
            } else {
                 serviceAddress = { type: 'specific', property_ids: [] }; // Default if null/undefined
            }
        } catch (e) {
            console.error("Error parsing vendor service_address:", e);
            serviceAddress = { type: 'specific', property_ids: [] }; // Default on error
        }

        if (serviceAddress?.type === 'specific' && serviceAddress.property_ids?.length) {
             const { data: vendorProperties, error: vendorPropsError } = await supabase
                .from('properties')
                .select('*, property_images(*)') // Fetch images relation
                .in('id', serviceAddress.property_ids);

            if (vendorPropsError) {
                console.error('Error fetching vendor properties:', vendorPropsError);
            } else {
                properties = vendorProperties || [];
            }
        } else if (serviceAddress?.type === 'all') {
            // Handle 'all' properties case if business logic requires it
            // e.g., fetch all properties for the company_id
             console.log("Vendor service address type is 'all'. Implement fetching logic if needed.");
             properties = []; // Defaulting to empty for now
        } else {
             properties = []; // Default if type is not 'specific' or no IDs
        }
    }

    // 3. Fetch Unit Details (for prospect if unit_id exists)
    if (person.role === 'prospect' && person.unit_id) {
        const { data: unit, error: unitError } = await supabase
            .from('units')
            .select(`
                *,
                property:properties ( name, address_line_1, city, state, zip ),
                unit_images ( * )
            `) // Fetch related property and images
            .eq('id', person.unit_id)
            .maybeSingle(); // Use maybeSingle

        if (unitError) {
            console.error('Error fetching unit details. Full error:', JSON.stringify(unitError, null, 2));
            if (unitError.message) console.error('Error message:', unitError.message);
            if (unitError.details) console.error('Error details:', unitError.details);
            if (unitError.hint) console.error('Error hint:', unitError.hint);
        } else if (unit) {
             // Structure the data according to UnitDetails interface
             unitDetails = {
                ...unit,
                // Supabase returns related records as arrays or objects based on relationship type
                // Assuming 'properties' is a one-to-one/many-to-one -> object
                // Assuming 'unit_images' is one-to-many -> array
                property: unit.property || undefined,
                unit_images: Array.isArray(unit.unit_images) ? unit.unit_images : [],
             };
        }
    }

    // --- Prepare final PersonDetails object ---
    // Ensure the final object conforms to the PersonDetails interface
    const finalPersonDetails: PersonDetails = {
        ...person,
        // Ensure nested JSON fields are correctly typed if not handled by Supabase
        // Supabase might return related tables as objects/arrays directly if selected correctly
        insurance: person.insurance || undefined,
        services: person.services || undefined,
        // service_address is already part of 'person' spread
    };

    // Validate final structure (optional)
    if (!finalPersonDetails.id || !finalPersonDetails.first_name) {
        console.error('Constructed person data is missing required fields.');
        notFound();
    }


    return {
      personDetails: finalPersonDetails, // No casting needed if types match
      userRole,
      assigneeDetails,
      properties,
      unitDetails,
      serviceAddress, // Return the parsed version
    };

  } catch (error) {
    console.error('Unexpected error in getPersonData:', error);
    notFound();
  }
}


export default async function PersonDetailsPage({ params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    console.error("No ID provided in params");
    notFound();
  }

  // Fetch all data on the server
  const { personDetails, userRole, assigneeDetails, properties, unitDetails, serviceAddress } = await getPersonData(id);

  return (
    <div className="h-screen flex flex-col">
        {/* Render the client component with all fetched data */}
        <PersonDetailsClient
            personDetails={personDetails}
            userRole={userRole}
            personId={id}
            assigneeDetails={assigneeDetails}
            properties={properties}
            unitDetails={unitDetails}
            serviceAddress={serviceAddress} // Pass parsed serviceAddress here
        />
    </div>
  );
} 