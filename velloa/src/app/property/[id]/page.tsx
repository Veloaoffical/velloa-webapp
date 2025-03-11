import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Users, FileText, Inbox, StickyNote, Settings, ListTodo, ChartArea } from "lucide-react";
import Link from 'next/link';
import { PropertyOverview } from './components/PropertyOverview';
import { PropertyUnit } from './components/PropertyUnit';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { PropertySettings } from "./components/PropertySettings";
import { PropertyTasks } from "./components/PropertyTasks";

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

interface PropertyDetails {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  property_settings: PropertySetting | null;
  units: { unit_id: number }[] | null;
  created_at: string;
  company_id: number;
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
      property_settings (
        id,
        type,
        property_type,
        amenities,
        pet_policy,
        owners,
        bank_accounts
      ),
      address_line_1,
      address_line_2,
      city,
      state,
      zip,
      units (
        unit_id
      ),
      created_at,
      company_id
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

  // Transform the property data to match the interface
  const transformedProperty: PropertyDetails = {
    id: property.id,
    name: property.name,
    address_line_1: property.address_line_1,
    address_line_2: property.address_line_2,
    city: property.city,
    state: property.state,
    zip: property.zip,
    property_settings: property.property_settings?.[0] ? {
      id: property.property_settings[0].id,
      type: property.property_settings[0].type,
      property_type: property.property_settings[0].property_type,
      amenities: property.property_settings[0].amenities || [],
      pet_policy: property.property_settings[0].pet_policy || {},
      owners: property.property_settings[0].owners || {},
      bank_accounts: property.property_settings[0].bank_accounts || {}
    } : null,
    units: property.units || [],
    created_at: property.created_at,
    company_id: property.company_id
  };

  return transformedProperty;
}

export default async function PropertyDetails(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const propertyDetails = await getPropertyDetails(params.id);

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
                    <Building2 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
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
            <PropertyOverview propertyDetails={propertyDetails} propertyId={params.id} />
          </TabsContent>
          <TabsContent value="analytics" className="mt-0">
            Analytics content
          </TabsContent>
          <TabsContent value="units" className="mt-0">
            <PropertyUnit propertyId={params.id} />
          </TabsContent>
          <TabsContent value="leases" className="mt-0">
            Leases content
          </TabsContent>
          <TabsContent value="tenants" className="mt-0">
            Tenants content
          </TabsContent>
          <TabsContent value="rental-applications" className="mt-0">
            Rental Applications content
          </TabsContent>
          <TabsContent value="listings" className="mt-0">
            Listings content
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