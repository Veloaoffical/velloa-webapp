'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {User, FileText, ClipboardList, StickyNote, FolderOpen, Settings, Building2, ArrowLeftIcon, BarChart3 } from "lucide-react";
import Link from 'next/link';
import { PersonOverview } from '@/app/people/[id]/components/PersonOverview';
import { PersonSettings } from '@/app/people/[id]/components/PersonSettings';
import { PersonFiles } from '@/app/people/[id]/components/PersonFiles';
import { PersonNotes } from '@/app/people/[id]/components/PersonNotes';
import { PersonRentalApplication } from '@/app/people/[id]/components/PersonRentalApplication';
import PeopleTaskPage from './people-task-page';
import PeopleBillingPage from './people-billing-page';

// Import the comprehensive PersonDetails type from page.tsx
import type {
    PersonDetails,
    AssigneeDetails,
    PropertyDetails,
    UnitDetails,
    VendorServiceAddress,
    PersonFile,
    WorkOrder,
    BillingItem,
} from '../page'; // Path should be correct

export interface ProcessedNote {
  id: string;
  note_title: string;
  note: string | Record<string, unknown>;
  created_at: string;
  created_by: {
    first_name: string;
    middle_name: string;
    last_name: string;
  };
}

// Use the comprehensive PersonDetails type here
interface PersonDetailsClientProps {
  personDetails: PersonDetails; // Use the comprehensive type
  userRole: string;
  personId: string;
  assigneeDetails: AssigneeDetails | null;
  properties: PropertyDetails[] | null;
  unitDetails: UnitDetails | null;
  serviceAddress: VendorServiceAddress | null;
  initialNotes: ProcessedNote[];
  initialFiles: PersonFile[]; // Add initialFiles prop
  workOrders: WorkOrder[]; // Add workOrders prop
  billingItems: BillingItem[]; // Add billingItems prop
  outstandingBalance: number; // Add outstandingBalance prop
}

export function PersonDetailsClient({
    personDetails, // Receive the comprehensive object
    userRole,
    personId,
    assigneeDetails,
    properties,
    unitDetails,
    serviceAddress,
    initialNotes,
    initialFiles, // Destructure initialFiles
    workOrders, // Destructure workOrders
    billingItems, // Destructure billingItems
    outstandingBalance, // Destructure outstandingBalance
}: PersonDetailsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [notesDialogTrigger, setNotesDialogTrigger] = useState(0); // State to trigger notes dialog
  const [notes, setNotes] = useState<ProcessedNote[]>(initialNotes || []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to trigger the notes dialog open
  const triggerNotesDialog = () => {
    setNotesDialogTrigger(prev => prev + 1);
  };
  const addNoteToState = (newNote: ProcessedNote) => {
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      {/* Top section with white background */}
      <div className="bg-card flex-shrink-0">
         <div className="flex flex-col p-6 pb-[53px]">
            <Link href="/people" className="mb-12">
            <Button variant="ghost" className="group w-fit gap-2">
                <ArrowLeftIcon
                  className="-ms-1 opacity-60 transition-transform group-hover:-translate-x-0.5"
                  size={16}
                  aria-hidden="true"
                />
                Back to People
              </Button>
            </Link>
           <h1 className="text-2xl font-bold mb-2">{`${personDetails.first_name} ${personDetails.last_name}`}</h1>
           <div className="flex flex-col gap-1">
             {personDetails.company && (
               <div className="text-[#16B364]">
                 <span>{personDetails.company}</span>
               </div>
             )}
           </div>
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
                {personDetails.role === 'tenant' && (
                  <TabsTrigger
                    value="reports"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <BarChart3 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Reports
                  </TabsTrigger>
                )}
                {(personDetails.role === 'vendor' || personDetails.role === 'tenant') && (
                  <TabsTrigger
                    value="bills"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FileText className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Bills
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
              onAddNote={triggerNotesDialog}
              outstandingBalance={outstandingBalance}
              workOrders={workOrders}
            />
          </TabsContent>
          {personDetails.role === 'tenant' && (
            <TabsContent value="reports" className="m-0">
              <div className="space-y-6">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Reports Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed reports and analytics for {personDetails.first_name} {personDetails.last_name} will be available here.
                  </p>
                </div>
              </div>
            </TabsContent>
          )}
           {(personDetails.role === 'vendor' || personDetails.role === 'tenant') && (
            <TabsContent value="bills" className="m-0">
              <PeopleBillingPage billingItems={billingItems} vendorId={personId} />
            </TabsContent>
          )}
          {personDetails.role !== 'owner' && personDetails.role !== 'vendor' && (
            <TabsContent value="rental-application" className="m-0">
              <PersonRentalApplication personDetails={personDetails} />
            </TabsContent>
          )}
          {(personDetails.role === 'owner' || personDetails.role === 'vendor' || personDetails.role === 'tenant') && (
            <TabsContent value="tasks" className="m-0">
              <PeopleTaskPage workOrders={workOrders} />
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
            <PersonNotes 
              peopleId={personId} 
              notes={notes} 
              addNoteToState={addNoteToState}
              initialDialogOpen={false}
              dialogOpenTrigger={notesDialogTrigger}
            />
          </TabsContent>
          <TabsContent value="files" className="m-0">
            <PersonFiles initialFiles={initialFiles} personId={personId} />
          </TabsContent>
          <TabsContent value="settings" className="m-0">
            <PersonSettings personDetails={personDetails} userRole={userRole} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
} 