'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ClipboardList, StickyNote, FolderOpen, Settings, Boxes } from "lucide-react";
import Link from 'next/link';
import { TaskOverview } from './components/TaskOverview';
import { TaskNotes } from './components/TaskNotes';
import { TaskFiles } from './components/TaskFiles';
import { TaskSettings } from './components/TaskSettings';
import { TaskPartsLabour } from './components/TaskPartsLabour';
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
  permit_enter: boolean | null;
  permit_owner: boolean | null;
  Recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  parts_labour: string | null;
  parts_labour_items?: PartsLabourItem[];
}

interface PartsLabourItem {
  id: string;
  description: string;
  category: string;
  billDate: Date | undefined;
  quantity: number | string;
  unitPrice: number | string;
  total: number;
}

interface ProcessedNote {
  id: string;
  note_title: string;
  note: string;
  created_at: string;
  created_by: {
    first_name: string;
    middle_name: string;
    last_name: string;
  };
}

interface BillExpenseData {
  description: string;
  category: string;
  bill_date: string | null;
  quantity: string;
  unit_price: string;
  total: string;
}

async function getTaskSettings(id: string) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('Unauthorized');
  }

  const { data: settings, error: settingsError } = await supabase
    .from('maintenance_requests')
    .select('status, priority, permit_owner, permit_enter')
    .eq('id', id)
    .single();

  if (settingsError) {
    console.error('Error fetching task settings:', settingsError);
    throw new Error('Failed to fetch task settings');
  }

  return settings;
}

async function getTaskDetails(id: string): Promise<Task> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('Unauthorized');
  }

  // First, get the task details and settings
  const [{ data: task, error: taskError }, settings] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select(`
        *,
        company_members!maintenance_requests_assignees_fkey (
          id,
          profile:profiles (
            first_name,
            last_name
          )
        ),
        property:properties!maintenance_requests_property_id_fkey (
          name
        ),
        unit:units!maintenance_requests_unit_id_fkey (
          unit_name
        )
      `)
      .eq('id', id)
      .single(),
    getTaskSettings(id)
  ]);

  if (taskError) {
    console.error('Error fetching task:', taskError);
    throw new Error('Failed to fetch task');
  }

  if (!task) {
    throw new Error('Task not found');
  }

  // If there's a parts_labour ID, fetch the bill expenses
  let billExpenses = null;
  if (task.parts_labour) {
    const { data: billExpensesData, error: billExpensesError } = await supabase
      .from('bill_expenses')
      .select('*')
      .eq('id', task.parts_labour)
      .single();

    if (billExpensesError) {
      console.error('Error fetching bill expenses:', billExpensesError);
    } else if (billExpensesData) {
      billExpenses = billExpensesData;
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
    property: task.property,
    unit: task.unit,
    assignee: task.company_members ? {
      id: task.company_members.id,
      profile: {
        first_name: task.company_members.profile.first_name,
        last_name: task.company_members.profile.last_name
      }
    } : null,
    permit_enter: settings?.permit_enter || false,
    permit_owner: settings?.permit_owner || false,
    Recurring_frequency: task.Recurring_frequency,
    start_date: task.start_date,
    end_date: task.end_date,
    parts_labour: task.parts_labour,
    parts_labour_items: billExpenses?.data ? billExpenses.data.map((item: BillExpenseData) => ({
      id: crypto.randomUUID(),
      description: item.description,
      category: item.category,
      billDate: item.bill_date ? new Date(item.bill_date) : undefined,
      quantity: item.quantity || '',
      unitPrice: item.unit_price || '',
      total: parseFloat(item.total) || 0
    })) : undefined
  };

  return transformedTask;
}

async function getNotes(taskId: string): Promise<ProcessedNote[]> {
  try {
    const supabase = await createClient();
    
    const { data: notes, error } = await supabase
      .from('maintenance_notes')
      .select(`
        id,
        note_title,
        note,
        created_at,
        maintenance_id,
        created_by:profiles!maintenance_notes_created_by_fkey (
          first_name,
          middle_name,
          last_name
        )
      `)
      .eq('maintenance_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    if (!notes) return [];

    console.log('Raw notes from DB:', notes); // Debug log

    // First cast to unknown, then to our expected type
    const typedNotes = notes as unknown as Array<{
      id: string;
      note_title: string | null;
      note: string | null;
      created_at: string;
      maintenance_id: string;
      created_by: {
        first_name: string | null;
        middle_name: string | null;
        last_name: string | null;
      };
    }>;

    return typedNotes.map(note => ({
      id: note.id,
      note_title: note.note_title || '',
      note: note.note || '',
      created_at: note.created_at,
      created_by: {
        first_name: note.created_by?.first_name || '',
        middle_name: note.created_by?.middle_name || '',
        last_name: note.created_by?.last_name || ''
      }
    }));
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export default async function TaskDetails({
  params,
}: {
  params: { id: string }
}) {
  try {
    // Properly await and destructure params
    const { id } = await params;
    const taskDetails = await getTaskDetails(id);
    const notes = await getNotes(id);
    
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
                      inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-normal
                      ${taskDetails.priority === 'high' ? 'bg-[hsl(var(--high-light))] text-[hsl(var(--high-light-foreground))] border border-[hsl(var(--high-light-border))]' : 
                        taskDetails.priority === 'medium' ? 'bg-[hsl(var(--medium-light))] text-[hsl(var(--medium-light-foreground))] border border-[hsl(var(--medium-light-border))]' : 
                        'bg-[hsl(var(--low-light))] text-[hsl(var(--low-light-foreground))] border border-[hsl(var(--low-light-border))]'}
                    `}
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
                        <Boxes className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                        Parts & Labour
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
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>

          {/* Scrollable content section */}
          <div className="flex-1 overflow-y-auto bg-transparent px-6 pt-6">
            <TabsContent value="overview" className="mt-0">
              <TaskOverview taskDetails={taskDetails} />
            </TabsContent>
            {taskDetails.role === 'work_order' && (
              <TabsContent value="parts-labour" className="mt-0">
                <TaskPartsLabour taskDetails={taskDetails} />
              </TabsContent>
            )}
            <TabsContent value="notes" className="mt-0">
              <TaskNotes taskId={taskDetails.id} initialNotes={notes} />
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