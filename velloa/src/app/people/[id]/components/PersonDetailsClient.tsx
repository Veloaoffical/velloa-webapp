'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, FileText, ClipboardList, StickyNote, FolderOpen, Settings, Building2 } from "lucide-react";
import Link from 'next/link';
import { PersonOverview } from '@/app/people/[id]/components/PersonOverview';
import { PersonSettings } from '@/app/people/[id]/components/PersonSettings';
import { PersonFiles } from '@/app/people/[id]/components/PersonFiles';
import { PersonNotes } from '@/app/people/[id]/components/PersonNotes';
import { PersonRentalApplication } from '@/app/people/[id]/components/PersonRentalApplication';

// Import types from page.tsx
import type {
    PersonDetails,
    AssigneeDetails,
    PropertyDetails,
    UnitDetails,
    VendorServiceAddress
} from '../page'; // Adjust path if necessary

// Use imported types in the props interface
interface PersonDetailsClientProps {
  personDetails: PersonDetails;
  userRole: string;
  personId: string;
  assigneeDetails: AssigneeDetails | null;
  properties: PropertyDetails[] | null;
  unitDetails: UnitDetails | null;
  serviceAddress: VendorServiceAddress | null;
}

export function PersonDetailsClient({
    personDetails,
    userRole,
    personId,
    assigneeDetails,
    properties,
    unitDetails,
    serviceAddress
}: PersonDetailsClientProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      {/* Top section with white background */}
      <div className="bg-card flex-shrink-0">
         <div className="flex flex-col p-6 pb-8">
            <Link href="/people" className="mb-4 md:mb-6 lg:mb-8">
                <Button variant="outline" size="sm" className="gap-2 w-fit">
                    <ArrowLeft className="w-4 h-4" />
                    Back to People
                </Button>
            </Link>
           <h1 className="text-2xl font-bold">{`${personDetails.first_name} ${personDetails.last_name}`}</h1>
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
                  <User className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                  Overview
                </TabsTrigger>
                {personDetails.role === 'vendor' && (
                  <TabsTrigger
                    value="billing"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Billing
                  </TabsTrigger>
                )}
                {personDetails.role !== 'owner' && personDetails.role !== 'vendor' && (
                  <TabsTrigger
                    value="rental-application"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Rental Application
                  </TabsTrigger>
                )}
                {personDetails.role === 'owner' && (
                  <>
                    <TabsTrigger
                      value="properties"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      <Building2 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                      Properties
                    </TabsTrigger>
                    <TabsTrigger
                      value="transactions"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                      Transactions
                    </TabsTrigger>
                  </>
                )}
                {(personDetails.role === 'owner' || personDetails.role === 'vendor' || personDetails.role === 'tenant') && (
                  <TabsTrigger
                    value="tasks"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <ClipboardList className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tasks
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="notes"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                >
                  <StickyNote className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                  Notes
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                >
                  <FolderOpen className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
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
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-8">
          <TabsContent value="overview" className="m-0">
            <PersonOverview
              personDetails={personDetails}
              setActiveTab={setActiveTab}
              assigneeDetails={assigneeDetails}
              properties={properties}
              unitDetails={unitDetails}
              serviceAddress={serviceAddress}
            />
          </TabsContent>
           {personDetails.role === 'vendor' && (
            <TabsContent value="billing" className="m-0">
              <div className="text-muted-foreground text-center py-8">
                Billing content coming soon
              </div>
            </TabsContent>
          )}
          {personDetails.role !== 'owner' && personDetails.role !== 'vendor' && (
            <TabsContent value="rental-application" className="m-0">
              <PersonRentalApplication />
            </TabsContent>
          )}
          {(personDetails.role === 'owner' || personDetails.role === 'vendor' || personDetails.role === 'tenant') && (
            <TabsContent value="tasks" className="m-0">
              <div className="text-muted-foreground text-center py-8">
                Tasks content coming soon
              </div>
            </TabsContent>
          )}
          {personDetails.role === 'owner' && (
            <>
              <TabsContent value="properties" className="m-0">
                <div className="text-muted-foreground text-center py-8">
                  Properties content coming soon
                </div>
              </TabsContent>
              <TabsContent value="transactions" className="m-0">
                <div className="text-muted-foreground text-center py-8">
                  Transactions content coming soon
                </div>
              </TabsContent>
            </>
          )}
          <TabsContent value="notes" className="m-0">
            <PersonNotes personId={personId} />
          </TabsContent>
          <TabsContent value="files" className="m-0">
            <PersonFiles />
          </TabsContent>
          <TabsContent value="settings" className="m-0">
            <PersonSettings personDetails={personDetails} userRole={userRole} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
} 