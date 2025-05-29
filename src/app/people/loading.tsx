import { 
  Users,
  Home,
  Wrench,
  UserPlus,
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function PeopleTableSkeleton({ currentTab }: { currentTab: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent border-0">
            <TableHead className="font-semibold text-foreground">Name</TableHead>
            {currentTab !== 'vendors' && (
              <TableHead className="font-semibold text-foreground">
                {currentTab === 'prospects' ? 'Move-in Date' : 'Type'}
              </TableHead>
            )}
            <TableHead className="font-semibold text-foreground">Contact Info</TableHead>
            {currentTab === 'vendors' && (
              <>
                <TableHead className="font-semibold text-foreground">Insurance Status</TableHead>
                <TableHead className="font-semibold text-foreground">Open Balance</TableHead>
              </>
            )}
            {currentTab !== 'vendors' && (
              <>
                <TableHead className="font-semibold text-foreground">
                  {currentTab === 'prospects' ? 'Assigned To' : 'Unit'}
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  {currentTab === 'prospects' ? 'Rental Application' : 'Status'}
                </TableHead>
              </>
            )}
            <TableHead className="font-semibold text-foreground"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <TableRow key={index} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                    <div className="flex items-center justify-center w-8 h-8">
                      <User className="size-5 text-[#16B364]" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </TableCell>
              {currentTab !== 'vendors' && (
                <TableCell>
                  {currentTab === 'prospects' ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <Skeleton className="h-5 w-16 rounded-md" />
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </TableCell>
              {currentTab === 'vendors' && (
                <>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </>
              )}
              {currentTab !== 'vendors' && (
                <>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </TableCell>
                </>
              )}
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
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-tight mb-6">People</h1>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            {/* Static search input - disabled */}
            <div className="relative w-[300px]">
              <Input
                placeholder="Search people..."
                className="w-full"
                disabled
              />
            </div>
            {/* Static dropdown - disabled */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Person
                  <ChevronDown
                    className="-me-1 ms-2 opacity-60"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <UserPlus size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                  New Prospect
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Home size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                  New Tenant
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Wrench size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                  New Vendor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Static tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger 
                value="tenant" 
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Tenants
              </TabsTrigger>
              <TabsTrigger 
                value="vendor" 
                className="flex items-center gap-2"
              >
                <Wrench className="h-4 w-4" />
                Vendors
              </TabsTrigger>
              <TabsTrigger 
                value="prospect" 
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Prospects
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <PeopleTableSkeleton currentTab="all" />
            </TabsContent>
            <TabsContent value="tenant">
              <PeopleTableSkeleton currentTab="tenants" />
            </TabsContent>
            <TabsContent value="vendor">
              <PeopleTableSkeleton currentTab="vendors" />
            </TabsContent>
            <TabsContent value="prospect">
              <PeopleTableSkeleton currentTab="prospects" />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
} 