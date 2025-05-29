import { Plus, Building, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6">
      {/* Static header - no skeleton */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-semibold">Properties</h1>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search properties..."
              className="relative w-[300px]"
              disabled
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2" disabled>
                <Plus className="w-4 h-4" />
                Add Property
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Building className="opacity-60 mr-2" size={16} strokeWidth={2} aria-hidden="true" />
                New Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Active
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Inactive
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {/* ONLY the table area has skeleton loading */}
              <div className="rounded-md">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="hover:bg-transparent border-0">
                      <TableHead className="font-semibold text-foreground">
                        <Skeleton className="h-6 w-24" />
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Skeleton className="h-6 w-20" />
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Skeleton className="h-6 w-20" />
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Skeleton className="h-6 w-24" />
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Skeleton className="h-6 w-8" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(5).fill(0).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                              <div className="flex items-center justify-center w-8 h-8">
                                <Building className="size-5 text-[#16B364]" strokeWidth={2} />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" disabled>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
            </TabsContent>
            <TabsContent value="active">
              {/* Same skeleton structure for active tab */}
              <div className="rounded-md">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="hover:bg-transparent border-0">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableHead key={i} className="font-semibold text-foreground">
                          <Skeleton className="h-6 w-full" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(3).fill(0).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                              <div className="flex items-center justify-center w-8 h-8">
                                <Building className="size-5 text-[#16B364]" strokeWidth={2} />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" disabled>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="inactive">
              {/* Same skeleton structure for inactive tab */}
              <div className="rounded-md">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="hover:bg-transparent border-0">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableHead key={i} className="font-semibold text-foreground">
                          <Skeleton className="h-6 w-full" />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(2).fill(0).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                              <div className="flex items-center justify-center w-8 h-8">
                                <Building className="size-5 text-[#16B364]" strokeWidth={2} />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" disabled>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 