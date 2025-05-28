"use client"; // Add use client directive

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeftIcon, Banknote, ClipboardList, FolderOpen, NotebookPen, Settings } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskOverview } from "./components/TaskOverview";
import { TaskNotes } from "./components/TaskNotes";
import { TaskFiles } from "./components/TaskFiles";
import { TaskSettings } from "./components/TaskSettings";
import { TaskPartsLabour } from "./components/TaskPartsLabour";

// Define interfaces directly in this file
export interface PartsLabourItem { // Export if needed elsewhere, otherwise remove export
  id: string;
  description: string;
  category: string;
  billDate: Date | undefined;
  quantity: number | string;
  unitPrice: number | string;
  total: number;
  payee?: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    company?: string;
  } | null;
  account_name?: string;
  open_balance?: number;
  actual_bill_id?: string;
  reference?: string;
}

export interface Task {
  id: string;
  subject: string;
  description: string;
  task_status: Record<string, { date: string | null; value: boolean | null }> | null;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  owner_id: string | null;
  tenant_id: string | null;
  vendor_id: string | null;
  request_type: string | null;
  task_type: string | null;
  tenant: string | null;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
  assignee?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
  role: 'task' | 'tenant_request' | 'work_order' | 'owner_request';
  Recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  parts_labour: string | null;
  parts_labour_items?: PartsLabourItem[];
  chargeItems?: PartsLabourItem[];
  permit_enter?: boolean | null;
  vendor_status?: boolean | null;
}

export interface ProcessedNote { // Export if needed elsewhere, otherwise remove export
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

export interface PersonDetails { // Export if needed elsewhere, otherwise remove export
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company?: string;
  role: string;
}

interface TaskDetailsClientProps {
  initialTaskDetails: Task;
  initialNotes: ProcessedNote[];
  initialFiles: Array<{ // Define a more specific type if possible
      id: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      createdAt: string;
      fileSize: number;
      createdBy: {
        first_name: string;
        middle_name: string;
        last_name: string;
      };
    }>;
  initialPersonName: string;
  initialVendorDetails: PersonDetails | null;
  tenantDetails: PersonDetails | null;
  userCompanyName: string | null;
}

export function TaskDetailsClient({
  initialTaskDetails,
  initialNotes,
  initialFiles,
  initialPersonName,
  initialVendorDetails,
  tenantDetails,
  userCompanyName,
}: TaskDetailsClientProps) {
  const [taskDetails, setTaskDetails] = useState<Task>(initialTaskDetails);
  const [notes, setNotes] = useState<ProcessedNote[]>(initialNotes);
  const [currentVendorDetails, setCurrentVendorDetails] = useState<PersonDetails | null>(initialVendorDetails);
  const [displayName, setDisplayName] = useState<string>(initialPersonName);
  const [activeTab, setActiveTab] = useState<string>(initialTaskDetails.role === 'work_order' ? 'overview' : 'overview');
  const [notesDialogTrigger, setNotesDialogTrigger] = useState(0); // State to trigger notes dialog

  // Effect to update taskDetails state when initialTaskDetails prop changes
  useEffect(() => {
    setTaskDetails(initialTaskDetails);
  }, [initialTaskDetails]);

  const updateTaskDetails = (updates: Partial<Task>) => {
    console.log("[TaskDetailsClient] updateTaskDetails received:", updates);
    setTaskDetails((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const newVendorId = taskDetails.vendor_id;
    const currentVendorId = currentVendorDetails?.id;
    console.log(`[TaskDetailsClient] useEffect running. New Vendor ID: ${newVendorId}, Current Vendor ID: ${currentVendorId}`);

    if (newVendorId && newVendorId !== currentVendorId) {
      console.log(`[TaskDetailsClient] Fetching vendor details for ID: ${newVendorId}`);
      fetch(`/api/people/${newVendorId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch vendor ${newVendorId} - Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data: PersonDetails) => {
          console.log("[TaskDetailsClient] Fetched vendor data:", data);
          setCurrentVendorDetails(data);
          const name = data.company 
            ? `${data.company} (${data.first_name} ${data.last_name})` 
            : `${data.first_name} ${data.last_name}`;
          setDisplayName(name.trim() ? name : initialPersonName);
        })
        .catch(error => {
          console.error("[TaskDetailsClient] Error fetching vendor details:", error);
          setCurrentVendorDetails(null);
          setDisplayName(initialPersonName);
        });
    } else if (!newVendorId && currentVendorId) {
      console.log("[TaskDetailsClient] Vendor ID removed, clearing details.");
      setCurrentVendorDetails(null);
      setDisplayName(initialPersonName);
    } else {
      console.log("[TaskDetailsClient] useEffect - No vendor fetch needed.");
    }
  }, [taskDetails.vendor_id, currentVendorDetails?.id, initialPersonName]);

  // Function to add a new note to the client-side state
  const addNoteToState = (newNote: ProcessedNote) => {
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  // Function to trigger the notes dialog open
  const triggerNotesDialog = () => {
    setNotesDialogTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col h-full"
      >
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href="/tasks" className="mb-12">
              <Button variant="ghost" className="group w-fit gap-2">
                <ArrowLeftIcon
                  className="-ms-1 opacity-60 transition-transform group-hover:-translate-x-0.5"
                  size={16}
                  aria-hidden="true"
                />
                Back to Tasks
              </Button>
            </Link>
            {/* Use state for subject */}
            <h1 className="text-2xl font-bold mb-2">
              {taskDetails.subject.length > 35 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {`${taskDetails.subject.slice(0, 35)}...`}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{taskDetails.subject}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : taskDetails.subject}
            </h1>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#16B364]">
                <div className="flex items-center gap-2 flex-1">
                  <Link
                    href={taskDetails.property_id ? `/property/${taskDetails.property_id}` : '#'}
                    className={taskDetails.property_id ? "hover:underline" : ""}
                  >
                    <span>{taskDetails.property?.name || 'No Property'}</span>
                  </Link>
                  {taskDetails.unit?.unit_name && (
                    <>
                      <span>-</span>
                      <Link
                        href={`/property/${taskDetails.property_id}/units/${taskDetails.unit_id}`}
                        className="hover:underline"
                      >
                        <span>{taskDetails.unit.unit_name}</span>
                      </Link>
                    </>
                  )}
                </div>
                <span
                  className={
                    `inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-normal
                    ${taskDetails.priority === 'high' ? 'bg-[hsl(var(--high-light))] text-[hsl(var(--high-light-foreground))] border border-[hsl(var(--high-light-border))]' :
                      taskDetails.priority === 'medium' ? 'bg-[hsl(var(--medium-light))] text-[hsl(var(--medium-light-foreground))] border border-[hsl(var(--medium-light-border))]' :
                      'bg-[hsl(var(--low-light))] text-[hsl(var(--low-light-foreground))] border border-[hsl(var(--low-light-border))]'}
                  `
                  }
                >
                  Priority: {taskDetails.priority ? taskDetails.priority.charAt(0).toUpperCase() + taskDetails.priority.slice(1) : 'Low'}
                </span>
              </div>
              {taskDetails.nano_id && (
                <div>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    #{taskDetails.nano_id}
                  </span>
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
                    <ClipboardList className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Overview
                  </TabsTrigger>
                  {taskDetails.role === 'work_order' && (
                    <TabsTrigger
                      value="parts-labour"
                      className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                    >
                      <Banknote className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                      Bills
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="notes"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <NotebookPen className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
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
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Scrollable content section */}
        <div className="flex-1 overflow-y-auto bg-transparent px-6 pt-6">
          <TabsContent value="overview" className="mt-0">
            {/* Pass state to TaskOverview */}
            <TaskOverview
              taskDetails={taskDetails}
              personName={displayName}
              vendorDetails={currentVendorDetails}
              tenantDetails={tenantDetails}
              userCompanyName={userCompanyName}
              chargeItems={taskDetails.chargeItems}
              setActiveTab={setActiveTab}
              onAddNote={triggerNotesDialog}
              updateTaskDetails={updateTaskDetails}
            />
          </TabsContent>
          {taskDetails.role === 'work_order' && (
            <TabsContent value="parts-labour" className="mt-0">
              <TaskPartsLabour
                items={taskDetails.chargeItems || []}
                vendorId={taskDetails.vendor_id || undefined}
                propertyId={taskDetails.property_id || undefined}
                unitId={taskDetails.unit_id || undefined}
                dueDate={taskDetails.due_date || undefined}
                maintenanceRequestId={taskDetails.id}
              />
            </TabsContent>
          )}
          <TabsContent value="notes" className="mt-0">
            <TaskNotes
              taskId={taskDetails.id}
              notes={notes}
              addNoteToState={addNoteToState}
              initialDialogOpen={false}
              dialogOpenTrigger={notesDialogTrigger}
            />
          </TabsContent>
          <TabsContent value="files" className="mt-0">
            <TaskFiles initialFiles={initialFiles} taskId={taskDetails.id} />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <TaskSettings taskDetails={taskDetails} updateTaskDetails={updateTaskDetails} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 