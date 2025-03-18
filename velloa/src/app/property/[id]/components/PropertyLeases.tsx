'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar, Home, User, DollarSign, ChevronRight, ShieldCheck, ShieldX } from "lucide-react";
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

interface Tenant {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface Property {
  id: string;
  name: string;
  address?: string;
}

interface Unit {
  unit_id: string;
  unit_name: string;
}

interface Lease {
  id: string;
  created_at: string;
  start_date: string;
  end_date: string;
  rent_amount: string | null;
  lease_term: string | null;
  deposit_amount: string | null;
  property: Property | null;
  unit: Unit | null;
  tenant: Tenant | null;
  tenant_name?: string;
}

interface PropertyLeasesProps {
  propertyId: string;
  leases: Lease[];
}

export function PropertyLeases({ propertyId, leases }: PropertyLeasesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabPage, setActiveTabPage] = useState(1);
  const [inactiveTabPage, setInactiveTabPage] = useState(1);
  const pageSize = 10;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const isLeaseActive = (lease: Lease) => {
    if (!lease.end_date) return true;
    const today = new Date();
    const endDate = new Date(lease.end_date);
    return endDate >= today;
  };

  const activeLeases = leases.filter(lease => isLeaseActive(lease));
  const inactiveLeases = leases.filter(lease => !isLeaseActive(lease));

  const getFilteredLeases = (leaseList: Lease[]) => {
    return leaseList.filter(lease => 
      lease.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.unit?.unit_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredActiveLeases = getFilteredLeases(activeLeases);
  const filteredInactiveLeases = getFilteredLeases(inactiveLeases);

  // Calculate pagination for active leases
  const totalActivePages = Math.ceil(filteredActiveLeases.length / pageSize);
  const paginatedActiveLeases = filteredActiveLeases.slice(
    (activeTabPage - 1) * pageSize,
    activeTabPage * pageSize
  );

  // Calculate pagination for inactive leases
  const totalInactivePages = Math.ceil(filteredInactiveLeases.length / pageSize);
  const paginatedInactiveLeases = filteredInactiveLeases.slice(
    (inactiveTabPage - 1) * pageSize,
    inactiveTabPage * pageSize
  );

  const renderLeaseTable = (leaseList: Lease[], totalPages: number, status: string, currentPage: number, setCurrentPage: (page: number) => void) => (
    <>
      <Table>
      <TableHeader className="bg-muted">
      <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Lease Term</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaseList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-52 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mb-2" />
                  <p>{searchQuery ? 'No matching leases found' : `No ${status.toLowerCase()} leases found for this property`}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leaseList.map((lease) => (
              <TableRow 
                key={lease.id}
                className="cursor-pointer"
                onClick={() => window.location.href = `/leases/${lease.id}`}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                      <div className="flex items-center justify-center w-8 h-8">
                        <User className="size-5 text-[#16B364]" strokeWidth={2} />
                      </div>
                    </div>
                    <span className="font-medium">{lease.tenant_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {lease.unit?.unit_name || 'Unknown Unit'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(lease.rent_amount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    status === 'Active' 
                      ? 'bg-green-50 text-green-700 ring-green-600/20' 
                      : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                  }`}>
                    {status === 'Active' ? (
                      <ShieldCheck className="mr-1 h-3 w-3" />
                    ) : (
                      <ShieldX className="mr-1 h-3 w-3" />
                    )}
                    {status}
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
      
      {/* Pagination */}
      {leaseList.length > 0 && (
        <div className="flex justify-end mt-4">
          <Pagination className="justify-end">
            <PaginationContent className="gap-3">
              <PaginationItem>
                <PaginationLink
                  className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  aria-label="Go to previous page"
                  aria-disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </PaginationLink>
              </PaginationItem>
              
              <div className="flex items-center text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </div>
              
              <PaginationItem>
                <PaginationLink
                  className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  aria-label="Go to next page"
                  aria-disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-6">
          {/* Header section */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leases..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveTabPage(1);
                  setInactiveTabPage(1);
                }}
              />
            </div>
            <Button asChild>
              <Link href={`/people/add-lease?propertyId=${propertyId}`} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Lease
              </Link>
            </Button>
          </div>

          {/* Tabs for Active/Inactive */}
          <Tabs 
            defaultValue="active" 
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="flex-1">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Active 
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex-1">
                <ShieldX className="mr-2 h-4 w-4" />
                Inactive
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-0">
              {renderLeaseTable(
                paginatedActiveLeases, 
                totalActivePages, 
                'Active', 
                activeTabPage, 
                setActiveTabPage
              )}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-0">
              {renderLeaseTable(
                paginatedInactiveLeases, 
                totalInactivePages, 
                'Inactive', 
                inactiveTabPage, 
                setInactiveTabPage
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
} 