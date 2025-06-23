'use client';

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
import { useState } from "react";
import type { Task } from '../page';

interface PropertyTasksProps {
  propertyId: string;
  tasks: Task[];
}

export function PropertyTasks({ propertyId, tasks }: PropertyTasksProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Input
          placeholder="Search tasks..."
          className="max-w-sm"
        />
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button>
              Add Task
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link 
                href={`/tasks/add-task?property=${propertyId}`} 
                className="flex items-center py-1.5 px-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
                <ListTodo className="mr-2 h-4 w-4" />
                <span>Task</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link 
                href={`/tasks/new?type=tenant-request&property=${propertyId}`} 
                className="flex items-center py-1.5 px-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
                <Home className="mr-2 h-4 w-4" />
                <span>Tenant Request</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link 
                href={`/tasks/new?type=work-order&property=${propertyId}`} 
                className="flex items-center py-1.5 px-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
                <Wrench className="mr-2 h-4 w-4" />
                <span>Work Order</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-gray-100">
              <Link 
                href={`/tasks/new?type=owner-request&property=${propertyId}`} 
                className="flex items-center py-1.5 px-2 w-full"
                onClick={() => setDropdownOpen(false)}
              >
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
            <TaskTable tasks={tasks} currentTab="all" />
          </TabsContent>
          <TabsContent value="task">
            <TaskTable tasks={tasks.filter(task => task.role === 'task')} currentTab="task" />
          </TabsContent>
          <TabsContent value="tenant_request">
            <TaskTable tasks={tasks.filter(task => task.role === 'tenant_request')} currentTab="tenant_request" />
          </TabsContent>
          <TabsContent value="work_order">
            <TaskTable tasks={tasks.filter(task => task.role === 'work_order' || task.role === 'owner_request')} currentTab="work_order" />
          </TabsContent>
          <TabsContent value="owner_request">
            <TaskTable tasks={tasks.filter(task => task.role === 'owner_request')} currentTab="owner_request" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 