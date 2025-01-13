import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home, NotebookPen, NotepadText, PencilRuler, File, Image, Settings } from "lucide-react";
import Link from 'next/link';
import { UnitOverview } from './components/UnitOverview';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UnitNotes } from './components/UnitNotes';
import { UnitListingDetails } from '@/app/unit/[id]/components/UnitListingDetails';
import { UnitPhotos } from './components/UnitPhotos';
import { UnitFiles } from "./components/UnitFiles";
import { UnitSettings } from "./components/UnitSettings";
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

async function getUnitDetails(id: string): Promise<UnitDetails> {
  const supabase = createServerComponentClient({ cookies });

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
    throw new Error('Failed to fetch unit details');
  }

  if (!unit) {
    throw new Error('Unit not found');
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

export default async function UnitDetails({ params }: PageParams) {
  const { id } = params;
  let unitDetails: UnitDetails;
  
  try {
    unitDetails = await getUnitDetails(id);
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
          <UnitOverview unitDetails={unitDetails} unitId={id} />
        </TabsContent>

        <TabsContent value="listing_details" className="flex-1 p-6">
          <UnitListingDetails unitId={id} />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 p-6">
          <UnitNotes unitId={id} />
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