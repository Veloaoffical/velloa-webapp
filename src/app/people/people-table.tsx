'use client';

import { useState } from 'react';
import { User, ChevronRight, Users, ChevronDown, Home, Building2, Wrench, UserPlus, Mail, Phone } from "lucide-react";
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
} from "@tanstack/react-table";
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string;
  unit_id: string | null;
  role: string;
  unit?: {
    unit_number: string;
    property_name?: string;
  } | null;
  status: string | null;
}

interface PeopleTableProps {
  initialPeople: {
    tenants: Person[];
    owners: Person[];
    vendors: Person[];
    prospects: Person[];
  };
}

const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if we have enough digits
  if (cleaned.length < 10) return phone;
  
  // Format as +0 (000)-000-0000
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
};

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <span>{`${row.original.first_name} ${row.original.last_name}`}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Type",
    cell: ({ row }) => {
      const role = row.original.role;
      const roleColors = {
        tenant: "bg-blue-50 text-blue-700 ring-blue-600/20",
        owner: "bg-purple-50 text-purple-700 ring-purple-600/20",
        vendor: "bg-orange-50 text-orange-700 ring-orange-600/20",
        prospect: "bg-blue-50 text-blue-700 ring-blue-600/20"
      };
      return (
        <div className="flex items-center">
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${roleColors[role as keyof typeof roleColors]}`}>
            {role}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Contact Info",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{formatPhoneNumber(row.original.phone)}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "unit_id",
    header: "Unit",
    cell: ({ row }) => {
      const unit = row.original.unit;
      return (
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {unit ? `${unit.unit_number}${unit.property_name ? ` - ${unit.property_name}` : ''}` : "No Unit Assigned"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return status === 'sent' ? (
        <div className="flex items-center">
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            Sent
          </span>
        </div>
      ) : null;
    },
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <ChevronRight className="w-5 h-5 text-gray-600" />
    ),
  },
];

function DataTable({ data }: { data: Person[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const router = useRouter();

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
    },
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/people/${row.original.id}`)}
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
                    <Users className="h-8 w-8 mb-2" />
                    <p>No people found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}

export function PeopleTable({ initialPeople }: PeopleTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const allPeople = [
    ...initialPeople.tenants,
    ...initialPeople.owners,
    ...initialPeople.vendors,
    ...initialPeople.prospects
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Input
          placeholder="Search people..."
          value={(columnFilters[0]?.value as string) ?? ""}
          onChange={(event) =>
            setColumnFilters([{
              id: "name",
              value: event.target.value,
            }])
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
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
            <DropdownMenuItem asChild>
              <Link href="/people/add?type=tenant" className="flex items-center">
                <Home size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                New Tenant
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/people/add?type=prospect" className="flex items-center">
                <UserPlus size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                New Prospect
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/people/add?type=owner" className="flex items-center">
                <Building2 size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                New Owner
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/people/add?type=vendor" className="flex items-center">
                <Wrench size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                New Vendor
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="owners">Owners</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="prospects">Prospects</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <DataTable data={allPeople} />
          </TabsContent>
          <TabsContent value="tenants">
            <DataTable data={initialPeople.tenants} />
          </TabsContent>
          <TabsContent value="owners">
            <DataTable data={initialPeople.owners} />
          </TabsContent>
          <TabsContent value="vendors">
            <DataTable data={initialPeople.vendors} />
          </TabsContent>
          <TabsContent value="prospects">
            <DataTable data={initialPeople.prospects} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 