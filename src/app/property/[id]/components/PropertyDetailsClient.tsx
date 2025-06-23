'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, DoorOpen, Users, FileText, Inbox, StickyNote, Settings, ListTodo, ArrowLeftIcon } from "lucide-react";
import Link from 'next/link';
import { PropertyOverview } from './PropertyOverview';
import { PropertySettings } from "./PropertySettings";
import { PropertyTasks } from "./PropertyTasks";
import { PropertyTenants } from "./PropertyTenants";
import { PropertyProspects } from "./PropertyProspects";
import { PropertyLeases } from "./PropertyLeases";
import { PropertyUnits } from "./PropertyUnits";
import { PropertyListings } from "./PropertyListings";

// Import the comprehensive types from page.tsx
import type {
  PropertyDetails,
  Person,
  Photo,
  Owner,
  Lease,
  Unit,
  UnitListing,
  Task,
} from '../page';

interface PropertyDetailsClientProps {
  propertyId: string;
  propertyDetails: PropertyDetails;
  propertyProspects: Person[];
  propertyTenants: Person[];
  propertyPhotos: Photo[];
  propertyOwners: Owner[];
  propertyLeases: Lease[];
  propertyUnits: Unit[];
  propertyListings: UnitListing[];
  propertyTasks: Task[];
}

export function PropertyDetailsClient({
  propertyId,
  propertyDetails,
  propertyProspects,
  propertyTenants,
  propertyPhotos,
  propertyOwners,
  propertyLeases,
  propertyUnits,
  propertyListings,
  propertyTasks,
}: PropertyDetailsClientProps) {
  return (
    <div className="h-screen flex flex-col">
      <Tabs defaultValue="overview" className="flex flex-col h-full">
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href="/property" className="mb-12">
            <Button variant="ghost" className="group w-fit gap-2">
                <ArrowLeftIcon
                  className="-ms-1 opacity-60 transition-transform group-hover:-translate-x-0.5"
                  size={16}
                  aria-hidden="true"
                />
                Back to Properties
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
          <TabsContent value="units" className="mt-0">
            <PropertyUnits propertyId={propertyId} units={propertyUnits} />
          </TabsContent>
          <TabsContent value="leases" className="mt-0">
            <PropertyLeases propertyId={propertyId} leases={propertyLeases} />
          </TabsContent>
          <TabsContent value="tenants" className="mt-0">
            <PropertyTenants propertyId={propertyId} tenants={propertyTenants} />
          </TabsContent>
          <TabsContent value="rental-applications" className="mt-0">
            <PropertyProspects propertyId={propertyId} prospects={propertyProspects} />
          </TabsContent>
          <TabsContent value="listings" className="mt-0">
            <PropertyListings propertyId={propertyId} listings={propertyListings} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <PropertyTasks propertyId={propertyId} tasks={propertyTasks} />
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
            Notes content
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <PropertySettings params={{ id: propertyId }} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 