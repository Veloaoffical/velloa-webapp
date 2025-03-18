'use client';

import { useState } from 'react';
import { Plus, Building, ArrowUpDown, Search, MoreHorizontal, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import { useRouter } from 'next/navigation';
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

interface Property {
  id: string;
  propertyName: string;
  propertyType: string;
  propertyKind: string;
  address: string;
  numberOfUnits: number;
  status?: string;
}

interface PropertyClientProps {
  initialProperties: Property[];
  isLoading?: boolean;
}

function TableSkeleton() {
  return (
    <>
      <div className="rounded-md">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent border-0">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TableHead key={i} className="font-semibold text-foreground">
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array(6).fill(0).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className={`h-8 w-${cellIndex === 0 ? 'full' : '[80%]'}`} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end mt-4">
        <Skeleton className="h-10 w-40" />
      </div>
    </>
  );
}

function DataTable({ data, currentTab, isLoading }: { data: Property[]; currentTab?: string; isLoading?: boolean }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: "propertyName",
      header: "Property Name",
      cell: ({ row }: { row: Row<Property> }) => (
        <div className="flex items-center gap-2">
          <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
            <div className="flex items-center justify-center w-8 h-8">
              <Building className="size-5 text-[#16B364]" strokeWidth={2} />
            </div>
          </div>
          <span>{row.getValue("propertyName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "propertyType",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Property Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "propertyKind",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Property Kind
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
    },
    {
      accessorKey: "numberOfUnits",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Number of Units
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: { row: Row<Property> }) => (
        <div>{row.getValue("numberOfUnits")}</div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/property/${row.original.id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/property/${row.original.id}/settings`)}>
                Edit Property
              </DropdownMenuItem>
              {currentTab === "active" && (
                <DropdownMenuItem onClick={() => console.log("Mark as inactive")}>
                  Mark as Inactive
                </DropdownMenuItem>
              )}
              {currentTab === "inactive" && (
                <DropdownMenuItem onClick={() => console.log("Mark as active")}>
                  Mark as Active
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  });

  const totalPages = Math.ceil(data.length / pageSize);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-md">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent border-0">
              {table.getHeaderGroups().map((headerGroup) => (
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/property/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-52 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Building className="h-8 w-8 mb-2" />
                    <p>No properties found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end mt-4">
        <Pagination className="justify-end">
          <PaginationContent className="gap-3">
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                aria-label="Go to previous page"
                aria-disabled={currentPage === 1}
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Page <span className="text-foreground">{currentPage}</span> of{" "}
                <span className="text-foreground">{totalPages || 1}</span>
              </p>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                aria-label="Go to next page"
                aria-disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}

export function PropertyClient({ initialProperties, isLoading = false }: PropertyClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Add status to properties if not present
  const propertiesWithStatus = initialProperties.map(property => ({
    ...property,
    status: property.status || "active"
  }));
  
  // Filter properties by status
  const activeProperties = propertiesWithStatus.filter(property => property.status === "active");
  const inactiveProperties = propertiesWithStatus.filter(property => property.status === "inactive");
  
  // Filter properties by search term
  const filteredActiveProperties = activeProperties.filter(property => 
    property.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredInactiveProperties = inactiveProperties.filter(property => 
    property.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredAllProperties = propertiesWithStatus.filter(property => 
    property.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-semibold">Properties</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Property
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/property/add" className="flex items-center">
                <Building className="opacity-60 mr-2" size={16} strokeWidth={2} aria-hidden="true" />
                New Property
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
              <DataTable data={filteredAllProperties} currentTab="all" isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="active">
              <DataTable data={filteredActiveProperties} currentTab="active" isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="inactive">
              <DataTable data={filteredInactiveProperties} currentTab="inactive" isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 