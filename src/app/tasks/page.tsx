'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { TaskTable } from './components/TaskTable';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskHeader from './components/TaskHeader';
import { 
  LayoutGrid,
  ListTodo,
  Home,
  Wrench,
  UserCircle,
} from "lucide-react";

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
  tenant_id: string | null;
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
  vendor_id: string | null;
  vendor?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  } | null;
}

async function getTasks() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      redirect('/login');
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

    // Fetch all tasks with their related details
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
        role,
        nano_id,
        vendor_id,
        property:properties!property_id (
          name
        ),
        units (
          unit_name
        ),
        assignee:company_members!maintenance_requests_assignees_fkey (
          id,
          profile:profiles (
            first_name,
            middle_name,
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
      .returns<Task[]>();

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return [];
    }

    return tasks;
  } catch (error) {
    console.error('Unexpected error in getTasks:', error);
    return [];
  }
}

export default async function TasksPage() {
  const allTasks = await getTasks();

  return (
    <div className="p-6">
      <h1 className="text-4xl font-semibold mb-6">Tasks & Maintenance</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <TaskHeader />
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
              <TaskTable tasks={allTasks} currentTab="all" />
            </TabsContent>
            <TabsContent value="task">
              <TaskTable tasks={allTasks.filter(task => task.role === 'task')} currentTab="task" />
            </TabsContent>
            <TabsContent value="tenant_request">
              <TaskTable tasks={allTasks.filter(task => task.role === 'tenant_request')} currentTab="tenant_request" />
            </TabsContent>
            <TabsContent value="work_order">
              <TaskTable tasks={allTasks.filter(task => task.role === 'work_order' || task.role === 'owner_request')} currentTab="work_order" />
            </TabsContent>
            <TabsContent value="owner_request">
              <TaskTable tasks={allTasks.filter(task => task.role === 'owner_request')} currentTab="owner_request" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 