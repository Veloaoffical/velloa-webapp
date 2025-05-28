/* eslint-disable jsx-a11y/alt-text */
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home, NotebookPen, NotepadText, PencilRuler, File, Image, Settings } from "lucide-react";
import Link from 'next/link';
import { UnitOverview } from './components/UnitOverview';
import { createClient } from '@/utils/supabase/server';
import { UnitNotes } from './components/UnitNotes';
import { UnitListingDetails } from '@/app/unit/[id]/components/UnitListingDetails';
import { UnitPhotos } from './components/UnitPhotos';
import { UnitFiles } from "./components/UnitFiles";
import { UnitSettings } from "./components/UnitSettings";
import { UnitTasks } from "./components/UnitTasks";
import { notFound, redirect } from 'next/navigation';

interface PageParams {
  params: { id: string };
}

interface UnitDetails {
  id: string;
  unit_name: string;
  tenant: string;
  beds: number;
  baths: number;
  market_rent: number;
  size: number;
  status: "available" | "occupied" | "vacant";
  property_id: string;
  created_at: string;
}

interface UnitPhoto {
  id: string;
  fileUrl: string;
  fileName: string;
  favorite?: boolean;
  isFavorite?: boolean;
}

interface ListingDetails {
  listing_description: string;
  property_title: string;
  status: string;
  favorite_photo: string | null;
  available_date?: Date | null;
  included_in_rent: {
    water: boolean;
    sewage: boolean;
    garbage: boolean;
    electricity: boolean;
    gas: boolean;
    internet: boolean;
    cable: boolean;
    sat_tv: boolean;
    hot_water: boolean;
  };
  interior_appliances: {
    dishwasher: boolean;
    washer: boolean;
    dryer: boolean;
    freezer: boolean;
    microwave: boolean;
    range_oven: boolean;
    ac: boolean;
    ceiling_fan: boolean;
    refrigerator: boolean;
    fireplace: boolean;
    intercom: boolean;
    security_system: boolean;
  };
  heating: {
    central: boolean;
    forced_air: boolean;
    heat_pump: boolean;
    radiant: boolean;
    electric: boolean;
    geothermal: boolean;
    solar: boolean;
    ductless_mini_split: boolean;
    natural_gas: boolean;
    other: boolean;
  };
  cooling: {
    central: boolean;
    evaporative: boolean;
    geothermal: boolean;
    heat_pump: boolean;
    wall: boolean;
    solar: boolean;
    ceiling_fans: boolean;
    ductless_mini_split: boolean;
    other: boolean;
  };
  laundry: {
    in_unit: boolean;
    shared: boolean;
  };
  parking: {
    carport: boolean;
    garage_attached: boolean;
    garage_detached: boolean;
    off_street: boolean;
  };
  exterior: {
    deck: boolean;
    courtyard: boolean;
    fenced_yard: boolean;
    garden: boolean;
    lawn: boolean;
    pool: boolean;
    patio: boolean;
    balcony: boolean;
  };
}

interface Note {
  id: string
  note: string
  note_title: string
  tags: string[]
  created_at: string
  created_by: string
}

async function getUnitDetails(id: string): Promise<UnitDetails> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  const { data: unit, error } = await supabase
    .from('units')
    .select(`
      unit_id,
      unit_name,
      beds,
      baths,
      market_rent,
      size,
      status,
      property_id,
      created_at
    `)
    .eq('unit_id', id)
    .single();

  if (error) {
    console.error('Error fetching unit:', error);
    if (error.code === 'PGRST116') {
      return notFound();
    }
    throw new Error('Failed to fetch unit details');
  }

  if (!unit) {
    return notFound();
  }

  return {
    id: unit.unit_id,
    unit_name: unit.unit_name || '',
    tenant: 'Vacant',
    beds: unit.beds || 0,
    baths: unit.baths || 0,
    market_rent: unit.market_rent || 0,
    size: unit.size || 0,
    status: (unit.status as "available" | "occupied" | "vacant") || 'vacant',
    property_id: unit.property_id,
    created_at: unit.created_at
  };
}

async function getUnitPhotos(unitId: string): Promise<UnitPhoto[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  const { data: photos, error } = await supabase
    .from('unit_images')
    .select('*')
    .eq('unit_id', unitId)
    .order('favorite', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching unit photos:', error);
    return [];
  }

  // Get signed URLs for each photo
  const transformedPhotos = await Promise.all((photos || []).map(async (photo) => {
    const { data } = await supabase.storage
      .from('property_images')
      .createSignedUrl(photo.file_path, 157680000); // 5 year signed URL

    return {
      id: photo.id,
      fileUrl: data?.signedUrl || photo.image_url,
      fileName: photo.file_name,
      favorite: photo.favorite || false,
      isFavorite: photo.favorite || false
    };
  }));

  return transformedPhotos;
}

async function getUnitListingDetails(unitId: string): Promise<ListingDetails> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // First get the unit details to ensure the unit exists
  const { data: unitDetails, error: unitError } = await supabase
    .from('units')
    .select('unit_name')
    .eq('unit_id', unitId)
    .single();

  if (unitError) {
    console.error('Error fetching unit:', unitError);
    throw new Error('Unit not found');
  }

  // Then get the listing details
  const { data: listingDetails, error } = await supabase
    .from('unit_listing')
    .select('*')
    .eq('unitid', unitId)
    .single();

  // Default values if no listing exists yet
  const defaultListingDetails: ListingDetails = {
    listing_description: "",
    property_title: unitDetails.unit_name,
    status: "draft",
    favorite_photo: null,
    included_in_rent: {
      water: false,
      sewage: false,
      garbage: false,
      electricity: false,
      gas: false,
      internet: false,
      cable: false,
      sat_tv: false,
      hot_water: false
    },
    interior_appliances: {
      dishwasher: false,
      washer: false,
      dryer: false,
      freezer: false,
      microwave: false,
      range_oven: false,
      ac: false,
      ceiling_fan: false,
      refrigerator: false,
      fireplace: false,
      intercom: false,
      security_system: false
    },
    heating: {
      central: false,
      forced_air: false,
      heat_pump: false,
      radiant: false,
      electric: false,
      geothermal: false,
      solar: false,
      ductless_mini_split: false,
      natural_gas: false,
      other: false
    },
    cooling: {
      central: false,
      evaporative: false,
      geothermal: false,
      heat_pump: false,
      wall: false,
      solar: false,
      ceiling_fans: false,
      ductless_mini_split: false,
      other: false
    },
    laundry: {
      in_unit: false,
      shared: false
    },
    parking: {
      carport: false,
      garage_attached: false,
      garage_detached: false,
      off_street: false
    },
    exterior: {
      deck: false,
      courtyard: false,
      fenced_yard: false,
      garden: false,
      lawn: false,
      pool: false,
      patio: false,
      balcony: false
    }
  };

  // If no listing exists or there's an error, return default values
  if (error || !listingDetails) {
    return defaultListingDetails;
  }

  // Extract amenities from the database response
  const {
    included_in_rent = {},
    interior_appliances = {},
    heating = {},
    cooling = {},
    laundry = {},
    parking = {},
    exterior = {}
  } = listingDetails.amenities || {};

  // Return the formatted response
  return {
    listing_description: listingDetails.listing_description || "",
    property_title: listingDetails.property_title || unitDetails.unit_name,
    status: listingDetails.status || "draft",
    favorite_photo: listingDetails.favorite_photo || null,
    available_date: listingDetails.available_date ? new Date(listingDetails.available_date) : null,
    included_in_rent: {
      ...defaultListingDetails.included_in_rent,
      ...included_in_rent
    },
    interior_appliances: {
      ...defaultListingDetails.interior_appliances,
      ...interior_appliances
    },
    heating: {
      ...defaultListingDetails.heating,
      ...heating
    },
    cooling: {
      ...defaultListingDetails.cooling,
      ...cooling
    },
    laundry: {
      ...defaultListingDetails.laundry,
      ...laundry
    },
    parking: {
      ...defaultListingDetails.parking,
      ...parking
    },
    exterior: {
      ...defaultListingDetails.exterior,
      ...exterior
    }
  };
}

async function getUnitNotes(unitId: string): Promise<Note[]> {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  const { data: notes, error } = await supabase
    .from('unit_notes')
    .select(`
      id,
      note,
      note_title,
      tags,
      created_at,
      created_by,
      unit_id,
      profiles!created_by (
        first_name,
        last_name
      )
    `)
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  // Cast notes to the correct type
  interface NoteWithProfile {
    id: string;
    note: string;
    note_title: string;
    tags: string[] | null;
    created_at: string;
    created_by: string;
    unit_id: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
    };
  }

  // Ensure tags are always an array and format the creator's name
  const processedNotes = (notes as unknown as NoteWithProfile[])?.map(note => ({
    id: note.id,
    note: note.note,
    note_title: note.note_title,
    tags: Array.isArray(note.tags) ? note.tags : [],
    created_by: note.profiles ? 
      `${note.profiles.first_name || ''} ${note.profiles.last_name || ''}`.trim() :
      'Unknown User',
    created_at: new Date(note.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })) || [];

  return processedNotes;
}

export default async function UnitDetails(props: PageParams) {
  const params = props.params;
  const { id } = params;
  let unitDetails: UnitDetails;
  let unitPhotos: UnitPhoto[] = [];
  let listingDetails: ListingDetails;
  let unitNotes: Note[] = [];

  try {
    unitDetails = await getUnitDetails(id);
    unitPhotos = await getUnitPhotos(id);
    listingDetails = await getUnitListingDetails(id);
    unitNotes = await getUnitNotes(id);
  } catch (error) {
    console.error('Error fetching unit:', error);
    throw new Error('Failed to fetch unit details');
  }

  return (
    <div className="h-screen flex flex-col">
      <Tabs defaultValue="overview" className="flex flex-col h-full">
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href={`/property/${unitDetails.property_id}`} className="mb-12">
              <Button variant="outline" size="sm" className="gap-2 w-fit">
                <ArrowLeft className="w-4 h-4" />
                Back to Property
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{unitDetails.unit_name}</h1>
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
                    <Home className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <PencilRuler className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger
                    value="listing_details"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <NotepadText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Listing Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <NotebookPen className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="images"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Image className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Images
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <File className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Files
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

        <TabsContent value="overview" className="flex-1 p-6">
          <UnitOverview unitDetails={unitDetails} photos={unitPhotos} />
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 p-6">
          <UnitTasks unitId={id} propertyId={unitDetails.property_id} />
        </TabsContent>

        <TabsContent value="listing_details" className="flex-1 p-6">
          <UnitListingDetails unitId={id} unitDetails={unitDetails} listingDetails={listingDetails} photos={unitPhotos} />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 p-6">
          <UnitNotes unitId={id} notes={unitNotes} />
        </TabsContent>

        <TabsContent value="images" className="flex-1 p-6">
          <UnitPhotos />
        </TabsContent>

        <TabsContent value="files" className="flex-1 p-6">
          <UnitFiles />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-6">
          <UnitSettings unitId={id} />
        </TabsContent>

      </Tabs>
    </div>
  );
} 