'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ListTodo, 
  Home, 
  Wrench, 
  UserCircle,
  AlarmClockMinus,
  AlarmClockCheck,
  Building
} from "lucide-react";
import { DueDate } from './DueDate';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
  vendor_id: string | null;
  vendor?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  } | null;
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case 'high':
      return "inline-flex items-center rounded-md bg-[hsl(var(--high-light))] px-2.5 py-0.5 text-xs text-[hsl(var(--high-light-foreground))] border border-[hsl(var(--high-light-border))] font-normal";
    case 'medium':
      return "inline-flex items-center rounded-md bg-[hsl(var(--medium-light))] px-2.5 py-0.5 text-xs text-[hsl(var(--medium-light-foreground))] border border-[hsl(var(--medium-light-border))] font-normal";
    case 'low':
      return "inline-flex items-center rounded-md bg-[hsl(var(--low-light))] px-2.5 py-0.5 text-xs text-[hsl(var(--low-light-foreground))] border border-[hsl(var(--low-light-border))] font-normal";
    default:
      return "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-normal";
  }
}

export function TaskTable({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      // Assuming each row is about 80px tall and accounting for header/pagination
      const availableHeight = height - 200; // 200px for header, pagination, and padding
      const calculatedItems = Math.floor(availableHeight / 80);
      
      // Set minimum of 5 items and maximum of 15
      setItemsPerPage(Math.min(Math.max(calculatedItems, 5), 15));
    };

    // Initial calculation
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = tasks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="flex items-center gap-2">
                Title
              </TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Due/Frequency</TableHead>
              <TableHead>Related To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-52 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ListTodo className="h-8 w-8 mb-2" />
                    <p>No tasks found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentTasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className="group hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                        <div className="flex items-center justify-center w-8 h-8">
                          {task.role === 'task' && <ListTodo className="size-5 text-[#16B364]" strokeWidth={2} />}
                          {task.role === 'tenant_request' && <Home className="size-5 text-[#16B364]" strokeWidth={2} />}
                          {task.role === 'work_order' && <Wrench className="size-5 text-[#16B364]" strokeWidth={2} />}
                          {task.role === 'owner_request' && <UserCircle className="size-5 text-[#16B364]" strokeWidth={2} />}
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
                          {(task.subject.length > 35 
                            ? task.subject.slice(0, 35) + '...' 
                            : task.subject
                          ).charAt(0).toUpperCase() + 
                            (task.subject.length > 35 
                              ? task.subject.slice(1, 35) + '...' 
                              : task.subject.slice(1)
                            ).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getPriorityClass(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {task.assignee?.profile ? 
                      `${task.assignee.profile.first_name} ${task.assignee.profile.last_name}` : 
                      <span className="text-muted-foreground">Unassigned</span>
                    }
                  </TableCell>
                  <TableCell>
                    {task.vendor ? (
                      <div className="flex flex-col">
                        <span>
                          {`${task.vendor.first_name} ${task.vendor.last_name}`}
                        </span>
                        {task.vendor.company && (
                          <span className="text-xs text-muted-foreground">
                            {task.vendor.company}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No vendor</span>
                    )}
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
                          <span className="text-muted-foreground">No location</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                      task.status === 'complete' ? 'bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border border-[hsl(var(--success-light-border))]' :
                      task.status === 'in_progress' ? 'bg-[hsl(var(--medium-light))] text-[hsl(var(--medium-light-foreground))] border border-[hsl(var(--medium-light-border))]' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {task.status === 'not_started' ? (
                        <>
                          <AlarmClockMinus className="h-3 w-3" />
                          Not Started
                        </>
                      ) : task.status === 'in_progress' ? (
                        <>
                          <AlarmClockMinus className="h-3 w-3" />
                          In Progress
                        </>
                      ) : task.status === 'complete' ? (
                        <>
                          <AlarmClockCheck className="h-3 w-3" />
                          Complete
                        </>
                      ) : (
                        <>
                          <AlarmClockMinus className="h-3 w-3" />
                          Open
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {tasks.length > itemsPerPage && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Page <span className="text-foreground">{currentPage}</span> of{" "}
            <span className="text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-3">
            <Pagination className="w-auto">
              <PaginationContent className="gap-3">
                <PaginationItem>
                  <Button
                    variant="outline"
                    className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>

          
          </div>
        </div>
      )}
    </div>
  );
} 