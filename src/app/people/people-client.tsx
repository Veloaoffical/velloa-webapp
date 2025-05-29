"use client"

import { useState, useEffect } from 'react';
import { User, ChevronRight, Users, ChevronDown, Home, /* Building2, */ Wrench, UserPlus, Mail, Phone, MoreHorizontal, Check, Copy, Share2, CalendarIcon, Send, BookOpenText, CircleCheck, Plus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
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
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

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
  move_in_date: string | null;
  assignee_id: string | null;
  insurance?: {
    coverage: string;
    provider: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
  } | null;
  open_balance?: number;
}

interface SearchParams {
  search?: string;
}

interface FilterOptions {
  properties: Array<{ id: string; name: string }>;
  assignees: Array<{ id: string; first_name: string; last_name: string }>;
  statuses: Array<{ value: string; label: string }>;
}

interface PeopleClientProps {
  initialPeople: {
    tenants: Person[];
    owners: Person[];
    vendors: Person[];
    prospects: Person[];
    filterOptions: FilterOptions;
  };
  searchParams?: SearchParams;
}

const formatPhoneNumber = (phone: string) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if we have enough digits
  if (cleaned.length < 10) return phone;
  
  // Format as +0 (000)-000-0000
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
};

function DataTable({ data, currentTab }: { data: Person[]; currentTab?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      const availableHeight = height - 200;
      const rowHeightEstimate = 80;
      const calculatedItems = Math.floor(availableHeight / rowHeightEstimate);
      
      setItemsPerPage(Math.min(Math.max(calculatedItems, 5), 20));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const newTotalPages = Math.ceil(data.length / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    } else if (data.length === 0) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, data.length, currentPage]);

  const isWithinLast14Days = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const differenceInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return differenceInDays <= 14;
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: Row<Person> }) => {
        const isNew = isWithinLast14Days(row.original.created_at);
        return (
          <div className="flex items-center gap-2">
            <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
              <div className="flex items-center justify-center w-8 h-8">
                <User className="size-5 text-[#16B364]" strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>{`${row.original.first_name} ${row.original.last_name}`}</span>
              {isNew && currentTab === 'prospects' && row.original.role === 'prospect' && (
                <Badge variant="outline" className="gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                  New
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    ...(currentTab !== 'vendors' ? [{
      accessorKey: "role",
      header: () => {
        if (currentTab === 'prospects') {
          return "Move-in Date";
        }
        return "Type";
      },
      cell: ({ row }: { row: Row<Person> }) => {
        const role = row.original.role;

        if (currentTab === 'prospects') {
          return (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {row.original.move_in_date ? format(new Date(row.original.move_in_date), "PPP") : "Not specified"}
              </span>
            </div>
          );
        }

        const roleColors = {
          tenant: "bg-blue-50 text-blue-700 ring-blue-600/20",
          owner: "bg-purple-50 text-purple-700 ring-purple-600/20",
          vendor: "bg-orange-50 text-orange-700 ring-orange-600/20",
          prospect: "bg-blue-50 text-blue-700 ring-blue-600/20"
        };

        const roleIcons = {
          tenant: <Home size={12} strokeWidth={2} />,
          owner: <User size={12} strokeWidth={2} />,
          vendor: <Wrench size={12} strokeWidth={2} />,
          prospect: <UserPlus size={12} strokeWidth={2} />
        };

        return (
          <div className="flex items-center">
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${roleColors[role as keyof typeof roleColors]}`}>
              {roleIcons[role as keyof typeof roleIcons]}
              {role}
            </span>
          </div>
        );
      },
    }] : []),
    {
      accessorKey: "contact",
      header: "Contact Info",
      cell: ({ row }: { row: Row<Person> }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.email || "Not specified"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{row.original.phone ? formatPhoneNumber(row.original.phone) : "Not specified"}</span>
          </div>
        </div>
      ),
    },
    ...(currentTab === 'vendors' ? [{
      accessorKey: "insurance",
      header: "Insurance Status",
      cell: ({ row }: { row: Row<Person> }) => {
        const insurance = row.original.insurance;
        if (!insurance) {
          return (
            <Badge variant="outline" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-gray-500" aria-hidden="true"></span>
              No Insurance
            </Badge>
          );
        }

        const currentDate = new Date();
        const effectiveDate = new Date(insurance.effective_date);
        const expirationDate = new Date(insurance.expiration_date);

        const isValid = currentDate >= effectiveDate && currentDate <= expirationDate;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="gap-1.5">
                  <span className={`size-1.5 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden="true"></span>
                  {isValid ? 'Valid Insurance' : 'Invalid Insurance'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="bg-accent text-accent-foreground">
                <div className="text-sm">
                  <p>Effective: {format(effectiveDate, "PPP")}</p>
                  <p>Expiration: {format(expirationDate, "PPP")}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "open_balance",
      header: "Open Balance",
      cell: ({ row }: { row: Row<Person> }) => {
        const balance = row.original.open_balance || 0;
        return (
          <div className="flex items-center">
            <span className={`text-sm ${balance > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        );
      },
    }] : []),
    ...(currentTab !== 'vendors' ? [{
      accessorKey: "unit_id",
      header: () => {
        return currentTab === 'prospects' ? "Assigned To" : "Unit";
      },
      cell: ({ row }: { row: Row<Person> }) => {
        const unit = row.original.unit;

        if (currentTab === 'prospects') {
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {row.original.assignee_id || "Unassigned"}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {unit ? `${unit.unit_number}${unit.property_name ? ` - ${unit.property_name}` : ''}` : "No Unit Assigned"}
            </span>
          </div>
        );
      },
    }] : []),
    ...(currentTab !== 'vendors' ? [{
      accessorKey: "status",
      header: () => {
        if (currentTab === 'prospects') {
          return "Rental Application";
        }
        return "Status";
      },
      cell: ({ row }: { row: Row<Person> }) => {
        const status = row.original.status;

        if (currentTab === 'prospects') {
          if (status === 'sent') {
            return (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  <Send size={12} strokeWidth={2} />
                  Sent
                </span>
              </div>
            );
          } else if (status === 'review') {
            return (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                  <BookOpenText size={12} strokeWidth={2} />
                  Review
                </span>
              </div>
            );
          } else if (status === 'accepted') {
            return (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CircleCheck size={12} strokeWidth={2} />
                  Accepted
                </span>
              </div>
            );
          } else {
            return (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
                  Not Started
                </span>
              </div>
            );
          }
        }

        if (status === 'active') {
          return (
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                <Check size={12} strokeWidth={2} />
                Active
              </span>
            </div>
          );
        } else if (status === 'inactive') {
          return (
            <div className="flex items-center">
              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
                Inactive
              </span>
            </div>
          );
        } else if (status === 'sent') {
          return (
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                <Send size={12} strokeWidth={2} />
                Sent
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center">
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
              Not Set
            </span>
          </div>
        );
      },
    }] : []),
    {
      id: "actions",
      header: "",
      cell: () => (
        <ChevronRight className="w-5 h-5 text-gray-600" />
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
        pageSize: itemsPerPage,
      },
    },
  });

  const totalPages = Math.ceil(data.length / itemsPerPage);

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
                aria-disabled={currentPage === totalPages || totalPages === 0}
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

export function PeopleClient({ initialPeople, searchParams }: PeopleClientProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || '');
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  // Update search query when searchParams change
  useEffect(() => {
    setSearchQuery(searchParams?.search || '');
  }, [searchParams?.search]);

  // Update URL with search
  const updateSearch = (search: string) => {
    const params = new URLSearchParams(urlSearchParams);
    
    if (search && search.trim()) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    router.push(`/people?${params.toString()}`);
  };

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounce the search
    const timeoutId = setTimeout(() => {
      updateSearch(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Filter people based on search query (client-side filtering)
  const filterPeopleBySearch = (people: Person[]) => {
    if (!searchQuery.trim()) return people;
    
    const searchTerm = searchQuery.toLowerCase().trim();
    return people.filter(person => 
      person.first_name.toLowerCase().includes(searchTerm) ||
      person.last_name.toLowerCase().includes(searchTerm) ||
      person.email.toLowerCase().includes(searchTerm)
    );
  };

  const filteredPeople = {
    tenants: filterPeopleBySearch(initialPeople.tenants),
    vendors: filterPeopleBySearch(initialPeople.vendors),
    prospects: filterPeopleBySearch(initialPeople.prospects)
  };

  const filteredAllPeople = [
    ...filteredPeople.tenants,
    ...filteredPeople.vendors,
    ...filteredPeople.prospects
  ];

  const handleCopy = () => {
    const url = window.location.href + "/add-prospect";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Add a New Prospect");
    const body = encodeURIComponent(window.location.href + "/add-prospect");
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Add a New Prospect",
          url: window.location.href + "/add-prospect"
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-tight mb-6">People</h1>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-[300px]">
              <Input
                placeholder="Search people..."
                className="w-full"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
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
                <div className="flex items-center justify-between pr-2 relative">
                  <Link href="/people/add-prospect" className="flex items-center hover:bg-accent hover:text-accent-foreground px-2 py-1.5 text-sm flex-1">
                    <UserPlus size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                    New Prospect
                  </Link>
                  <div className="flex items-center h-[26px]">
                    <div className="h-4 w-[1px] bg-border mx-2" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent">
                          <Share2 size={16} strokeWidth={2} className="opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleCopy}>
                          <Copy size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                          Copy Link
                          {copied && <Check size={16} className="ml-2 text-green-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleEmailShare}>
                          <Mail size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                          Share via Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSystemShare}>
                          <MoreHorizontal size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                          Share
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/people/add-lease" className="flex items-center">
                    <Home size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                    New Tenant
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/people/add-vendor" className="flex items-center">
                    <Wrench size={16} strokeWidth={2} className="opacity-60 mr-2" aria-hidden="true" />
                    New Vendor
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
              <DataTable data={filteredAllPeople} currentTab="all" />
            </TabsContent>
            <TabsContent value="tenant">
              <DataTable data={filteredPeople.tenants} currentTab="tenants" />
            </TabsContent>
            <TabsContent value="vendor">
              <DataTable data={filteredPeople.vendors} currentTab="vendors" />
            </TabsContent>
            <TabsContent value="prospect">
              <DataTable data={filteredPeople.prospects} currentTab="prospects" />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
} 