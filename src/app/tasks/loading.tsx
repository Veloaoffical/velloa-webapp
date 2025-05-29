import { 
  LayoutGrid,
  ListTodo,
  Home,
  Wrench,
  ChevronDown,
  Building,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

function TaskTableSkeleton({ currentTab }: { currentTab: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="flex items-center gap-2 font-semibold text-foreground">
              <Skeleton className="h-5 w-16" />
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <Skeleton className="h-5 w-12" />
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <Skeleton className="h-5 w-24" />
            </TableHead>
            {currentTab === 'work_order' && (
              <TableHead className="font-semibold text-foreground">
                <Skeleton className="h-5 w-16" />
              </TableHead>
            )}
            <TableHead className="font-semibold text-foreground">
              <Skeleton className="h-5 w-20" />
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <Skeleton className="h-5 w-20" />
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <Skeleton className="h-5 w-16" />
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <Skeleton className="h-5 w-4" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 9 }).map((_, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                    <div className="flex items-center justify-center w-8 h-8">
                      <ListTodo className="size-5 text-[#16B364]" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              {currentTab === 'work_order' && (
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
              )}
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-md" />
              </TableCell>
              <TableCell>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <Pagination className="justify-end">
          <PaginationContent className="gap-3">
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                aria-label="Go to previous page"
                aria-disabled={true}
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Page <span className="text-foreground">1</span> of{" "}
                <span className="text-foreground">1</span>
              </p>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                aria-label="Go to next page"
                aria-disabled={true}
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="p-6">
      {/* Static header - no skeleton */}
      <h1 className="text-4xl font-semibold mb-6">Tasks & Maintenance</h1>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          {/* Static TaskHeader components - no skeleton */}
          <Input
            placeholder="Search tasks..."
            className="relative w-[300px]"
            disabled
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled>
                Add Task
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem className="focus:bg-gray-100">
                <ListTodo className="mr-2 h-4 w-4" />
                <span>Task</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-gray-100">
                <Home className="mr-2 h-4 w-4" />
                <span>Tenant Request</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-gray-100">
                <Wrench className="mr-2 h-4 w-4" />
                <span>Work Order</span>
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
            </TabsList>
            <TabsContent value="all">
              <TaskTableSkeleton currentTab="all" />
            </TabsContent>
            <TabsContent value="task">
              <TaskTableSkeleton currentTab="task" />
            </TabsContent>
            <TabsContent value="tenant_request">
              <TaskTableSkeleton currentTab="tenant_request" />
            </TabsContent>
            <TabsContent value="work_order">
              <TaskTableSkeleton currentTab="work_order" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 