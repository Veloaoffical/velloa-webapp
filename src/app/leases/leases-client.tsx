"use client"

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, CircleCheck, CircleX, User } from 'lucide-react';
import Link from 'next/link';
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import Lease type from the page component
type Lease = {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: string | null;
  lease_type: string | null;
  lease_status: string | null;
  deposits: {
    show_key_deposit?: boolean;
    key_deposit_amount?: string;
    rent_discount_type?: string;
    show_rent_discount?: boolean;
    rent_discount_amount?: string;
    show_security_deposit?: boolean;
    key_deposit_description?: string;
    security_deposit_amount?: string;
    rent_discount_description?: string;
  } | null;
  property: {
    id: string;
    name: string;
  } | null;
  unit: {
    unit_id: string;
    unit_name: string;
  } | null;
  tenant_id: string[] | null;
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    email?: string;
    phone?: string;
    unit?: {
      unit_number: string;
      property_name: string;
    };
  } | null;
};

interface LeasesClientProps {
  leases: Lease[];
}

function LeaseTable({ leases }: { leases: Lease[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      const availableHeight = height - 250;
      const rowHeightEstimate = 70;
      const calculatedItems = Math.floor(availableHeight / rowHeightEstimate);
      setItemsPerPage(Math.min(Math.max(calculatedItems, 5), 20));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const newTotalPages = Math.ceil(leases.length / itemsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    } else if (leases.length === 0) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, leases.length, currentPage]);

  const totalPages = Math.ceil(leases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeases = leases.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent border-0">
            <TableHead className="font-semibold text-foreground">Tenant</TableHead>
            <TableHead className="font-semibold text-foreground">Related To</TableHead>
            <TableHead className="font-semibold text-foreground">Start Date</TableHead>
            <TableHead className="font-semibold text-foreground">End Date</TableHead>
            <TableHead className="font-semibold text-foreground">Rent</TableHead>
            <TableHead className="font-semibold text-foreground">Deposit Balance</TableHead>
            <TableHead className="font-semibold text-foreground"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentLeases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No leases found
              </TableCell>
            </TableRow>
          ) : (
            currentLeases.map((lease) => {
              const propertyText = lease.property?.name || 'Unknown Property';
              const unitText = lease.unit?.unit_name ? ` - Unit ${lease.unit.unit_name}` : '';

              return (
                <TableRow 
                  key={lease.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => window.location.href = `/leases/${lease.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                        <div className="flex items-center justify-center w-8 h-8">
                          <User className="size-5 text-[#16B364]" strokeWidth={2} />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">
                          {lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'No Tenant'}
                        </span>
                        {lease.lease_status && (
                          <span className="text-xs text-muted-foreground/75">
                            {lease.lease_status.charAt(0).toUpperCase() + lease.lease_status.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {propertyText}{unitText}
                    </span>
                  </TableCell>
                  <TableCell>{lease.start_date ? format(new Date(lease.start_date), "MMM d, yyyy") : 'N/A'}</TableCell>
                  <TableCell>{lease.end_date ? format(new Date(lease.end_date), "MMM d, yyyy") : 'N/A'}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(parseFloat(lease.rent_amount || '0'))}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const securityDeposit = lease.deposits?.security_deposit_amount || '0';
                      const keyDeposit = lease.deposits?.key_deposit_amount || '0';
                      const totalDeposit = parseFloat(securityDeposit) + parseFloat(keyDeposit);
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(totalDeposit);
                    })()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/leases/${lease.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <Pagination className="justify-end">
          <PaginationContent className="gap-3">
            <PaginationItem>
              <PaginationLink
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
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

export function LeasesClient({ leases }: LeasesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter leases based on search query
  const filteredLeases = searchQuery 
    ? leases.filter(lease => 
        (lease.tenant && `${lease.tenant.first_name} ${lease.tenant.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lease.property?.name && lease.property.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lease.unit?.unit_name && lease.unit.unit_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : leases;

  // Filter active and inactive leases
  const activeLeases = filteredLeases.filter(lease => {
    // Use lease_status if available, otherwise fall back to end_date logic
    if (lease.lease_status) {
      return lease.lease_status === 'active';
    }
    // Fallback: if no lease_status, use end_date logic
    if (!lease.end_date) return true;
    return new Date(lease.end_date) >= new Date();
  });

  const inactiveLeases = filteredLeases.filter(lease => {
    // Use lease_status if available, otherwise fall back to end_date logic
    if (lease.lease_status) {
      return lease.lease_status !== 'active';
    }
    // Fallback: if no lease_status, use end_date logic
    if (!lease.end_date) return false;
    return new Date(lease.end_date) < new Date();
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-tight mb-6">Leases</h1>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-[300px]">
              <Input
                placeholder="Search leases..."
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link href="/people/add-lease">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Lease
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="active" className="flex items-center">
                <CircleCheck className="mr-2 h-4 w-4" />
                Active
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center">
                <CircleX className="mr-2 h-4 w-4" />
                Inactive
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <LeaseTable leases={activeLeases} />
            </TabsContent>
            <TabsContent value="inactive">
              <LeaseTable leases={inactiveLeases} />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
} 