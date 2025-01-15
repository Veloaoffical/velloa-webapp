'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardList, StickyNote, FolderOpen, Settings } from "lucide-react";
import Link from 'next/link';
import { TaskOverview } from './components/TaskOverview';
import { TaskNotes } from './components/TaskNotes';
import { TaskFiles } from './components/TaskFiles';
import { TaskSettings } from './components/TaskSettings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Task {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
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
  role: string;
}

async function getTaskDetails(id: string): Promise<Task> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('Unauthorized');
  }

  // First, get the task details
  const { data: task, error: taskError } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      company_members!maintenance_requests_assignees_fkey (
        id,
        profile:profiles (
          first_name,
          last_name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (taskError) {
    console.error('Error fetching task:', taskError);
    throw new Error('Failed to fetch task');
  }

  if (!task) {
    throw new Error('Task not found');
  }

  // If we have a property_id, fetch the property details
  let propertyData = null;
  if (task.property_id) {
    const { data: property } = await supabase
      .from('properties')
      .select('name')
      .eq('id', task.property_id)
      .single();
    
    if (property) {
      propertyData = {
        name: property.name
      };
    }
  }

  // If we have a unit_id, fetch the unit details
  let unitData = null;
  if (task.unit_id) {
    const { data: unit } = await supabase
      .from('units')
      .select('unit_name')
      .eq('unit_id', task.unit_id)
      .single();
    
    if (unit) {
      unitData = {
        unit_name: unit.unit_name
      };
    }
  }

  // Transform the response to match the Task interface
  const transformedTask: Task = {
    id: task.id,
    subject: task.subject,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    created_at: task.created_at,
    assignees: task.assignees,
    created_by: task.created_by,
    nano_id: task.nano_id,
    property_id: task.property_id,
    unit_id: task.unit_id,
    request_type: task.request_type,
    task_type: task.task_type,
    tenant: task.tenant,
    role: task.role,
    property: propertyData,
    unit: unitData,
    assignee: task.company_members?.[0]?.profile ? {
      id: task.company_members[0].id,
      profile: {
        first_name: task.company_members[0].profile[0].first_name,
        last_name: task.company_members[0].profile[0].last_name
      }
    } : null
  };

  return transformedTask;
}

async function getNotes(taskId: string) {
  try {
    const supabase = await createClient();
    
    const { data: notes, error } = await supabase
      .from('task_notes')
      .select(`
        id,
        content,
        created_at,
        created_by:profiles!task_notes_created_by_fkey (
          first_name,
          last_name
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    return notes.map(note => ({
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      created_by: {
        first_name: note.created_by[0].first_name,
        last_name: note.created_by[0].last_name
      }
    }));
  } catch (error) {
    console.error('Error in getNotes:', error);
    return [];
  }
}

export default async function TaskDetails({
  params,
}: {
  params: { id: string }
}) {
  try {
    const taskDetails = await getTaskDetails(params.id);
    const notes = await getNotes(params.id);
    
    return (
      <div className="h-screen flex flex-col">
        <Tabs defaultValue="overview" className="flex flex-col h-full">
          {/* Top section with white background */}
          <div className="bg-card flex-shrink-0">
            <div className="flex flex-col p-6 pb-6">
              <Link href="/tasks" className="mb-12">
                <Button variant="outline" size="sm" className="gap-2 w-fit">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Tasks
                </Button>
              </Link>
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
                        <span>•</span>
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
                    className={`
                      inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-medium
                      ${taskDetails.priority === 'high' ? 'bg-[hsl(var(--high-light))] text-[hsl(var(--high-light-foreground))]' : 
                        taskDetails.priority === 'medium' ? 'bg-[hsl(var(--medium-light))] text-[hsl(var(--medium-light-foreground))]' : 
                        'bg-[hsl(var(--low-light))] text-[hsl(var(--low-light-foreground))]'}
                    `}
                  >
                    {taskDetails.priority ? taskDetails.priority.charAt(0).toUpperCase() + taskDetails.priority.slice(1) : 'Low'}
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
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>

          {/* Scrollable content section */}
          <div className="flex-1 overflow-y-auto bg-transparent px-6 pt-6">
            <TabsContent value="overview" className="mt-0">
              <TaskOverview taskDetails={taskDetails} />
            </TabsContent>
            <TabsContent value="notes" className="mt-0">
              <TaskNotes taskId={params.id} initialNotes={notes} />
            </TabsContent>
            <TabsContent value="files" className="mt-0">
              <TaskFiles />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <TaskSettings taskDetails={taskDetails} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        redirect('/login');
      }
    }
    redirect('/tasks');
  }
} 