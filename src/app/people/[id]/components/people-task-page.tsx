"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListTodo, Home, Wrench, UserCircle, ChevronRight, Building } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DueDate } from "@/app/tasks/components/DueDate";
import type { WorkOrder } from '../page';

interface PeopleTaskPageProps {
  workOrders: WorkOrder[];
}

function getPriorityClass(priority?: string) {
  switch (priority) {
    case "high":
      return "inline-flex items-center rounded-md bg-[hsl(var(--high-light))] px-2.5 py-0.5 text-xs text-[hsl(var(--high-light-foreground))] border border-[hsl(var(--high-light-border))] font-normal";
    case "medium":
      return "inline-flex items-center rounded-md bg-[hsl(var(--medium-light))] px-2.5 py-0.5 text-xs text-[hsl(var(--medium-light-foreground))] border border-[hsl(var(--medium-light-border))] font-normal";
    case "low":
      return "inline-flex items-center rounded-md bg-[hsl(var(--low-light))] px-2.5 py-0.5 text-xs text-[hsl(var(--low-light-foreground))] border border-[hsl(var(--low-light-border))] font-normal";
    default:
      return "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-normal";
  }
}

// Helper to get the latest status from task_status
function getCurrentStatus(taskStatus?: Record<string, { date: string | null; value: boolean | null }>): string {
  if (!taskStatus) return 'Open';
  let latestStatus = 'Open';
  let latestDate: Date | null = null;
  Object.entries(taskStatus).forEach(([key, value]) => {
    if (value.value === true && value.date) {
      const currentDate = new Date(value.date);
      if (!latestDate || currentDate > latestDate) {
        latestDate = currentDate;
        latestStatus = key;
      }
    }
  });
  return latestStatus;
}

export default function PeopleTaskPage({ workOrders }: PeopleTaskPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter work orders based on search query
  const filteredWorkOrders = workOrders.filter(workOrder => {
    if (!searchQuery.trim()) return true;
    
    const searchTerm = searchQuery.toLowerCase();
    
    // Search in subject
    if (workOrder.subject?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in description
    if (workOrder.description?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in property name
    if (workOrder.property?.name?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in unit name
    if (workOrder.unit?.unit_name?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in priority
    if (workOrder.priority?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in status
    const currentStatus = getCurrentStatus(workOrder.task_status);
    if (currentStatus.toLowerCase().includes(searchTerm)) return true;
    
    // Search in role/type
    if (workOrder.role?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in nano_id
    if (workOrder.nano_id?.toLowerCase().includes(searchTerm)) return true;
    
    return false;
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search tasks..."
            className="w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={() => router.push('/tasks/add-work-order')}>
            <Wrench className="mr-2 h-4 w-4" />
            New Work Order
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="flex items-center gap-2 font-semibold text-foreground">Title</TableHead>
                <TableHead className="font-semibold text-foreground">Priority</TableHead>
                <TableHead className="font-semibold text-foreground">Due Date</TableHead>
                <TableHead className="font-semibold text-foreground">Related To</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-52 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ListTodo className="h-8 w-8 mb-2" />
                      <p>{searchQuery ? 'No tasks found matching your search' : 'No tasks found'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkOrders.map((task) => (
                  <TableRow
                    key={task.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                          <div className="flex items-center justify-center w-8 h-8">
                            {task.role === "task" && <ListTodo className="size-5 text-[#16B364]" strokeWidth={2} />}
                            {task.role === "tenant_request" && <Home className="size-5 text-[#16B364]" strokeWidth={2} />}
                            {task.role === "work_order" && <Wrench className="size-5 text-[#16B364]" strokeWidth={2} />}
                            {task.role === "owner_request" && <UserCircle className="size-5 text-[#16B364]" strokeWidth={2} />}
                            {!task.role && <ListTodo className="size-5 text-[#16B364]" strokeWidth={2} />}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {task.role ? task.role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Task'}
                            </span>
                            {task.nano_id && (
                              <span className="inline-flex items-center rounded-md bg-muted px-1 py-0.5 text-[9px] font-normal text-muted-foreground leading-none">
                                #{task.nano_id}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground/75">
                            {task.subject.length > 35 ? task.subject.slice(0, 35) + '...' : task.subject}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getPriorityClass(task.priority)}>
                        {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <DueDate date={task.due_date} />
                      ) : (
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {task.unit ?
                          `${task.unit.unit_name}${task.property ? ` - ${task.property.name}` : ''}` :
                          task.property ?
                            task.property.name :
                            <span className="text-muted-foreground">No property</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border">
                        {getCurrentStatus(task.task_status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
