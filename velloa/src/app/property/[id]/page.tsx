import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2,DoorOpen, Users, FileText, Inbox, StickyNote, Settings, ListTodo, ChartArea } from "lucide-react";
import Link from 'next/link';
import { PropertyOverview } from './components/PropertyOverview';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { PropertySettings } from "./components/PropertySettings";
import { PropertyTasks } from "./components/PropertyTasks";
import { PropertyTenants } from "./components/PropertyTenants";
import { PropertyProspects } from "./components/PropertyProspects";
import { PropertyLeases } from "./components/PropertyLeases";
import { PropertyUnits } from "./components/PropertyUnits";
import { PropertyListings } from "./components/PropertyListings";

interface PropertyTypeData {
  propertyType: string;
  propertyKind: string;
}

interface PropertySetting {
  id: string;
  type: string;
  value: string | null;
  property_type?: PropertyTypeData;
  amenities?: string[];
  pet_policy?: Record<string, unknown>;
  owners?: Record<string, unknown>;
  bank_accounts?: Record<string, unknown>;
}

interface PropertyDetails {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  property_settings: PropertySetting[];
  units: { id: number }[] | null;
  created_at: string;
  company_id: number;
}

// Interface for the PropertyUnits component - matches the Unit interface in PropertyUnits.tsx
interface Unit {
  id: string;
  unit_name: string;
  unit_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  rent_amount?: string;
  status?: string;
  is_occupied?: boolean;
  tenant?: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    phone?: string;
  }[] | null;
  property?: {
    id: string;
    name: string;
    address?: string;
  }[] | null;
}

// Interface for the PropertyTenants component
interface Person {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  property_id: string;
  unit_id: string | null;
  unit?: {
    unit_number: string;
    property_name: string;
  } | null;
}

async function getPropertyDetails(propertyId: string): Promise<PropertyDetails> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // First get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    redirect('/home');
  }

  // Then get the company membership using the profile ID
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', profile.id)
    .single();

  if (companyError || !companyMember) {
    console.error('Company not found for user:', companyError);
    redirect('/home');
  }

  // Fetch property with its settings and units
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select(`
      id,
      name,
      address_line_1,
      address_line_2,
      city,
      state,
      zip,
      units (
        unit_id
      ),
      created_at,
      company_id,
      property_settings
    `)
    .eq('id', propertyId)
    .eq('company_id', companyMember.company_id)
    .single();

  if (propertyError) {
    console.error('Property not found:', propertyError);
    notFound();
  }

  if (!property) {
    console.error('Property not found');
    notFound();
  }

  // Fetch property settings separately
  let propertySettings: PropertySetting[] = [];
  if (property.property_settings) {
    const { data: settings, error: settingsError } = await supabase
      .from('property_settings')
      .select('*')
      .eq('id', property.property_settings)
      .single();
    
    if (!settingsError && settings) {
      propertySettings = [{
        id: settings.id,
        type: 'property_settings',
        value: settings.property_description,
        property_type: settings.property_type,
        amenities: settings.amenities || [],
        pet_policy: settings.pet_policy || {},
        owners: settings.owners || {},
        bank_accounts: settings.bank_accounts || {}
      }];
    }
  }

  // Transform the property data to match the interface
  const transformedProperty: PropertyDetails = {
    id: property.id,
    name: property.name,
    address_line_1: property.address_line_1 || '',
    address_line_2: property.address_line_2,
    city: property.city || '',
    state: property.state || '',
    zip: property.zip || '',
    property_settings: propertySettings,
    units: property.units?.map(unit => ({ id: unit.unit_id })) || [],
    created_at: property.created_at,
    company_id: property.company_id
  };

  return transformedProperty;
}

async function getPropertyProspects(propertyId: string) {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  interface Unit {
    unit_name: string;
    properties: {
      name: string;
    };
  }

  interface Prospect {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email: string;
    phone: string;
    expected_move_in_date: string | null;
    status: string | null;
    assignee_id: string | null;
    property_id: string;
    unit_id: string | null;
    prospect_property: {
      property_id: string;
      unit_id: string;
    } | null;
    units: Unit | null;
  }

  // Fetch prospects from the people table
  const { data: prospects, error: prospectsError } = await supabase
    .from('people')
    .select(`
      id,
      first_name,
      last_name,
      role,
      email,
      phone,
      expected_move_in_date,
      status,
      assignee_id,
      property_id,
      unit_id,
      prospect_property,
      units (
        unit_name,
        properties (
          name
        )
      )
    `)
    .eq('role', 'prospect')
    .returns<Prospect[]>();

  if (prospectsError) {
    console.error('Error fetching prospects:', prospectsError);
    return [];
  }

  // Filter for prospects in this property using property_id or prospect_property.property_id
  const propertyProspects = prospects.filter((person) => {
    // Check both direct property_id and prospect_property.property_id
    return person.property_id === propertyId || 
           person.prospect_property?.property_id === propertyId;
  });

  // Transform the data to match the frontend interface
  return propertyProspects.map(prospect => ({
    id: prospect.id,
    first_name: prospect.first_name,
    last_name: prospect.last_name,
    email: prospect.email,
    phone: prospect.phone,
    role: prospect.role,
    property_id: prospect.property_id,
    unit_id: prospect.unit_id,
    prospect_property: prospect.prospect_property,
    expected_move_in_date: prospect.expected_move_in_date,
    status: prospect.status,
    assignee_id: prospect.assignee_id,
    unit: prospect.units ? {
      unit_number: prospect.units.unit_name,
      property_name: prospect.units.properties.name
    } : null
  }));
}

async function getPropertyTenants(propertyId: string): Promise<Person[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Fetch tenants from the people table
  const { data: tenants, error: tenantsError } = await supabase
    .from('people')
    .select(`
      id,
      first_name,
      last_name,
      role,
      email,
      phone,
      property_id,
      unit_id,
      units (
        unit_name,
        properties (
          name
        )
      )
    `)
    .eq('role', 'tenant')
    .eq('property_id', propertyId);

  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
    return [];
  }

  // Transform the data to match the frontend interface
  return tenants.map(tenant => {
    let unitInfo = null;
    if (tenant.units) {
      // Handle both array and single object cases
      const unitData = Array.isArray(tenant.units) ? tenant.units[0] : tenant.units;
      if (unitData && unitData.unit_name) {
        const propertyData = Array.isArray(unitData.properties) 
          ? unitData.properties[0] 
          : unitData.properties;
        
        if (propertyData && propertyData.name) {
          unitInfo = {
            unit_number: unitData.unit_name,
            property_name: propertyData.name
          };
        }
      }
    }

    return {
      id: tenant.id,
      first_name: tenant.first_name || '',
      last_name: tenant.last_name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      role: tenant.role,
      property_id: tenant.property_id,
      unit_id: tenant.unit_id,
      unit: unitInfo
    };
  });
}

async function getPropertyPhotos(propertyId: string) {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Fetch photos from the property_images table
  const { data: photos, error: photosError } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('favorite', { ascending: false })
    .order('created_at', { ascending: false });

  if (photosError) {
    console.error('Error fetching photos:', photosError);
    return [];
  }

  if (!photos || photos.length === 0) {
    return [];
  }

  // Transform the data to match the frontend interface
  return Promise.all(photos.map(async (photo) => {
    const { data } = await supabase.storage
      .from('property_images')
      .createSignedUrl(photo.file_path, 157680000); // 5 year signed URL

    return {
      id: photo.id,
      fileUrl: data?.signedUrl || photo.image_url,
      fileName: photo.file_name,
      createdAt: photo.created_at,
      favorite: photo.favorite || false,
      isFavorite: photo.favorite || false,
    };
  }));
}

async function getPropertyOwners(propertyId: string) {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  interface Owner {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    ownership_percentage?: number;
  }

  interface OwnerDetails {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    company?: string;
  }

  // First get the property settings
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*, property_settings(*)')
    .eq('id', propertyId)
    .single();

  if (propertyError || !property || !property.property_settings) {
    console.error('Error fetching property settings:', propertyError);
    return [];
  }

  // Get the owners from the settings
  const propertyOwners = property.property_settings.owners as Owner[] || [];
  if (propertyOwners.length === 0) {
    return [];
  }

  // Get owner details from the people table
  const ownerIds = propertyOwners.map((owner: Owner) => owner.id);
  const { data: ownerDetails, error: ownersError } = await supabase
    .from('people')
    .select('id, first_name, last_name, email, company')
    .in('id', ownerIds);

  if (ownersError) {
    console.error('Error fetching owner details:', ownersError);
    return propertyOwners;
  }

  // Combine the data
  return propertyOwners.map((propertyOwner: Owner) => {
    const ownerDetail = ownerDetails?.find(o => o.id === propertyOwner.id) as OwnerDetails | undefined;
    return {
      ...propertyOwner,
      first_name: ownerDetail?.first_name,
      last_name: ownerDetail?.last_name,
      company: ownerDetail?.company,
    };
  });
}

async function getPropertyLeases(propertyId: string) {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Get the company membership
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    redirect('/home');
  }

  // Then get the company membership using the profile ID
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', profile.id)
    .single();

  if (companyError || !companyMember) {
    console.error('Company error:', companyError);
    return [];
  }

  // Fetch leases with related data
  const { data: leases, error: leasesError } = await supabase
    .from('lease_contracts')
    .select(`
      id,
      created_at,
      start_date,
      end_date,
      rent_amount,
      lease_term,
      deposit_amount,
      property:properties!lease_contracts_property_id_fkey (
        id,
        name,
        address_line_1,
        address_line_2,
        city,
        state,
        zip
      ),
      unit:units!lease_contracts_unit_id_fkey (
        unit_id,
        unit_name
      ),
      tenant_id
    `)
    .eq('company_id', companyMember.company_id)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (leasesError) {
    console.error('Error fetching leases:', leasesError);
    return [];
  }

  if (!leases || leases.length === 0) {
    return [];
  }

  // Extract tenant IDs from the tenant_id field
  const tenantIds: string[] = [];
  leases.forEach(lease => {
    if (lease.tenant_id) {
      try {
        const tenantData = typeof lease.tenant_id === 'string' 
          ? JSON.parse(lease.tenant_id) 
          : lease.tenant_id;
        
        if (Array.isArray(tenantData)) {
          tenantData.forEach(tenant => {
            if (tenant.id) {
              tenantIds.push(tenant.id);
            }
          });
        } else if (tenantData.id) {
          tenantIds.push(tenantData.id);
        }
      } catch (e) {
        console.error('Error parsing tenant data:', e);
      }
    }
  });

  // Fetch tenant details from the people table if we have tenant IDs
  const tenantDetailsMap: Record<string, {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }> = {};
  
  if (tenantIds.length > 0) {
    const { data: tenants, error: tenantsError } = await supabase
      .from('people')
      .select('id, first_name, last_name, email, phone')
      .in('id', tenantIds);
    
    if (tenantsError) {
      console.error('Error fetching tenant details:', tenantsError);
    } else if (tenants) {
      // Create a map of tenant ID to tenant details
      tenants.forEach(tenant => {
        tenantDetailsMap[tenant.id] = {
          id: tenant.id,
          first_name: tenant.first_name,
          last_name: tenant.last_name,
          email: tenant.email,
          phone: tenant.phone
        };
      });
    }
  }

  // Transform the data to match the frontend interface
  return leases.map(lease => {
    // Parse tenant information from JSON string if it exists
    let tenant = null;
    if (lease.tenant_id) {
      try {
        const tenantData = typeof lease.tenant_id === 'string' 
          ? JSON.parse(lease.tenant_id) 
          : lease.tenant_id;
        
        if (Array.isArray(tenantData) && tenantData.length > 0) {
          tenant = tenantData[0];
        } else if (tenantData.id) {
          tenant = tenantData;
        }
      } catch (e) {
        console.error('Error parsing tenant data:', e);
      }
    }

    // Enrich tenant data with details from people table
    if (tenant && tenant.id && tenantDetailsMap[tenant.id]) {
      tenant = {
        ...tenant,
        ...tenantDetailsMap[tenant.id]
      };
    }

    // Determine tenant name from available data
    let tenantName = 'Unknown Tenant';
    if (tenant) {
      if (tenant.first_name && tenant.last_name) {
        tenantName = `${tenant.first_name} ${tenant.last_name}`.trim();
      } else if (tenant.name) {
        tenantName = tenant.name;
      }
    }

    // Format address - ensure property and unit are objects, not arrays
    const propertyData = Array.isArray(lease.property) 
      ? lease.property[0] 
      : lease.property || {};
      
    const formattedAddress = [
      propertyData.address_line_1,
      propertyData.address_line_2,
      [propertyData.city, propertyData.state, propertyData.zip].filter(Boolean).join(', ')
    ].filter(Boolean).join(', ');

    const unitData = Array.isArray(lease.unit) 
      ? lease.unit[0] 
      : lease.unit || {};

    return {
      id: lease.id,
      tenant_name: tenantName,
      created_at: lease.created_at,
      property: {
        id: propertyData.id || '',
        name: propertyData.name || 'Unknown Property',
        address: formattedAddress
      },
      unit: {
        unit_id: unitData.unit_id || '',
        unit_name: unitData.unit_name || 'Unknown Unit'
      },
      tenant: tenant,
      start_date: lease.start_date,
      end_date: lease.end_date,
      rent_amount: lease.rent_amount || '0',
      lease_term: lease.lease_term,
      deposit_amount: lease.deposit_amount || '0'
    };
  });
}

// Add a function to get property units
async function getPropertyUnits(propertyId: string): Promise<Unit[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
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
    console.error('Company not found for user:', companyError);
    return [];
  }
  
  interface DbUnit {
    unit_id: string;
    unit_name: string;
    beds: number | null;
    baths: number | null;
    size: number | null;
    market_rent: string | null;
    status: string;
    property_id: string;
  }
  
  // Get units for the property
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('unit_id, unit_name, beds, baths, size, market_rent, status, property_id')
    .eq('property_id', propertyId);
  
  if (unitsError) {
    console.error('Error fetching units:', unitsError);
    return [];
  }
  
  // Transform the data to match the expected structure
  return (units || []).map((unit: DbUnit): Unit => {
    // Determine if unit is occupied based on status
    const is_occupied = unit.status === 'occupied';
    
    return {
      id: unit.unit_id,
      unit_name: unit.unit_name,
      bedrooms: unit.beds || undefined,
      bathrooms: unit.baths || undefined,
      square_feet: unit.size || undefined,
      rent_amount: unit.market_rent || undefined,
      status: unit.status,
      is_occupied,
      unit_type: '', // Default empty string as it's not in the schema
      tenant: [], // Empty array as there's no tenant relationship
      property: [] // Empty array as we're not fetching property details
    };
  });
}

// Add a function to get property listings
async function getPropertyListings(propertyId: string) {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
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
    console.error('Company not found for user:', companyError);
    return [];
  }
  
  // Get listings for the property with unit information
  const { data: listings, error: listingsError } = await supabase
    .from('unit_listing')
    .select(`
      listingid,
      created_at,
      property_title,
      listing_description,
      amenities,
      available_date,
      status,
      unitid,
      "propertyId",
      units:unitid (
        unit_name
      )
    `)
    .eq('propertyId', propertyId);
  
  if (listingsError) {
    console.error('Error fetching listings:', listingsError);
    return [];
  }
  
  return listings || [];
}

export default async function PropertyDetails(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const propertyDetails = await getPropertyDetails(params.id);
  const propertyProspects = await getPropertyProspects(params.id);
  const propertyTenants = await getPropertyTenants(params.id);
  const propertyPhotos = await getPropertyPhotos(params.id);
  const propertyOwners = await getPropertyOwners(params.id);
  const propertyLeases = await getPropertyLeases(params.id);
  const propertyUnits = await getPropertyUnits(params.id);
  const propertyListings = await getPropertyListings(params.id);

  return (
    <div className="h-screen flex flex-col">
      <Tabs defaultValue="overview" className="flex flex-col h-full">
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href="/property" className="mb-12">
              <Button variant="outline" size="sm" className="gap-2 w-fit">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{propertyDetails.name}</h1>
          </div>

          {/* Tabs navigation */}
          <div className="border-b-2 border-border">
            <ScrollArea>
              <TabsList className="mb-0 h-auto rounded-none bg-transparent py-1 text-foreground">
                <div className="px-6 flex gap-2">
                  <TabsTrigger
                    value="overview"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Building2 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <ChartArea className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="units"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <DoorOpen className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Units
                  </TabsTrigger>
                  <TabsTrigger
                    value="leases"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Leases
                  </TabsTrigger>
                  <TabsTrigger
                    value="tenants"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Users className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tenants
                  </TabsTrigger>
                  <TabsTrigger
                    value="rental-applications"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Inbox className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Rental Applications
                  </TabsTrigger>
                  <TabsTrigger
                    value="listings"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Building2 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Listings
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <ListTodo className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <StickyNote className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Settings className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Settings
                  </TabsTrigger>
                </div>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Scrollable content section */}
        <div className="flex-1 overflow-y-auto bg-transparent px-6 pt-6">
          <TabsContent value="overview" className="mt-0">
            <PropertyOverview 
              propertyDetails={propertyDetails} 
              photos={propertyPhotos}
              owners={propertyOwners}
            />
          </TabsContent>
          <TabsContent value="analytics" className="mt-0">
            Analytics content
          </TabsContent>
          <TabsContent value="units" className="mt-0">
            <PropertyUnits propertyId={params.id} units={propertyUnits} />
          </TabsContent>
          <TabsContent value="leases" className="mt-0">
            <PropertyLeases propertyId={params.id} leases={propertyLeases} />
          </TabsContent>
          <TabsContent value="tenants" className="mt-0">
            <PropertyTenants propertyId={params.id} tenants={propertyTenants} />
          </TabsContent>
          <TabsContent value="rental-applications" className="mt-0">
            <PropertyProspects propertyId={params.id} prospects={propertyProspects} />
          </TabsContent>
          <TabsContent value="listings" className="mt-0">
            <PropertyListings propertyId={params.id} listings={propertyListings} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <PropertyTasks propertyId={params.id} />
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
            Notes content
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <PropertySettings params={{ id: params.id }} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 