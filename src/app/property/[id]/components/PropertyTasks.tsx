import { createClient } from '@/utils/supabase/server';
import { TaskTable } from '@/app/tasks/components/TaskTable';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListTodo, Home, Wrench, UserCircle, LayoutGrid, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

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
  tenant_id: string | null;
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
  vendor_id: string | null;
  vendor?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  } | null;
}

interface PropertyTasksProps {
  propertyId: string;
}

async function getPropertyTasks(propertyId: string): Promise<Task[]> {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Auth error:', userError);
    return [];
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    return [];
  }

  // Get the company membership
  const { data: companyMember, error: companyError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('id', profile.id)
    .single();

  if (companyError || !companyMember) {
    console.error('Error fetching company member:', companyError);
    return [];
  }

  try {
    // First, let's verify if the property exists and if the user has access to it
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Error verifying property access:', propertyError);
      return [];
    }

    // Now fetch the tasks with a simpler query first
    const { data: tasks, error: tasksError } = await supabase
      .from('maintenance_requests')
      .select(`
        id,
        subject,
        description,
        status,
        priority,
        due_date,
        created_at,
        assignees,
        created_by,
        property_id,
        unit_id,
        request_type,
        task_type,
        tenant_id,
        tenant:tenant_id,
        role,
        nano_id,
        vendor_id,
        property:properties!property_id (
          name
        ),
        unit:units!maintenance_requests_unit_id_fkey (
          unit_name
        ),
        assignee:company_members!maintenance_requests_assignees_fkey (
          id,
          profile:profiles (
            first_name,
            last_name
          )
        ),
        vendor:people!maintenance_requests_vendor_id_fkey (
          id,
          first_name,
          last_name,
          company
        )
      `)
      .eq('property_id', propertyId)
      .returns<Task[]>();

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return [];
    }

    return tasks || [];
  } catch (error) {
    console.error('Unexpected error in getPropertyTasks:', error);
    return [];
  }
}

export async function PropertyTasks({ propertyId }: PropertyTasksProps) {
  const tasks = await getPropertyTasks(propertyId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Input
          placeholder="Search tasks..."
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Add Task
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link href={`/tasks/add-task?property=${propertyId}`} className="flex items-center py-1.5 px-2 w-full">
                <ListTodo className="mr-2 h-4 w-4" />
                <span>Task</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link href={`/tasks/new?type=tenant-request&property=${propertyId}`} className="flex items-center py-1.5 px-2 w-full">
                <Home className="mr-2 h-4 w-4" />
                <span>Tenant Request</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link href={`/tasks/new?type=work-order&property=${propertyId}`} className="flex items-center py-1.5 px-2 w-full">
                <Wrench className="mr-2 h-4 w-4" />
                <span>Work Order</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link href={`/tasks/new?type=owner-request&property=${propertyId}`} className="flex items-center py-1.5 px-2 w-full">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Owner Request</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="all" className="flex items-center">
              <LayoutGrid className="mr-2 h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="task" className="flex items-center">
              <ListTodo className="mr-2 h-4 w-4" />
              Task
            </TabsTrigger>
            <TabsTrigger value="tenant_request" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              Tenant Request
            </TabsTrigger>
            <TabsTrigger value="work_order" className="flex items-center">
              <Wrench className="mr-2 h-4 w-4" />
              Work Order
            </TabsTrigger>
            <TabsTrigger value="owner_request" className="flex items-center">
              <UserCircle className="mr-2 h-4 w-4" />
              Owner Request
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <TaskTable tasks={tasks} />
          </TabsContent>
          <TabsContent value="task">
            <TaskTable tasks={tasks.filter(task => task.role === 'task')} />
          </TabsContent>
          <TabsContent value="tenant_request">
            <TaskTable tasks={tasks.filter(task => task.role === 'tenant_request')} />
          </TabsContent>
          <TabsContent value="work_order">
            <TaskTable tasks={tasks.filter(task => task.role === 'work_order' || task.role === 'owner_request')} />
          </TabsContent>
          <TabsContent value="owner_request">
            <TaskTable tasks={tasks.filter(task => task.role === 'owner_request')} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 