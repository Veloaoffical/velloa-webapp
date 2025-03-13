/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, ShieldX, User } from 'lucide-react';
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
import { Lease } from './types';

interface LeasesClientProps {
  leases: Lease[];
}

function LeaseTable({ leases }: { leases: Lease[] }) {
  return (
    <Table>
      <TableHeader className="bg-muted">
        <TableRow className="hover:bg-transparent border-0">
          <TableHead className="font-semibold text-foreground">Tenant</TableHead>
          <TableHead className="font-semibold text-foreground">Property</TableHead>
          <TableHead className="font-semibold text-foreground">Start Date</TableHead>
          <TableHead className="font-semibold text-foreground">End Date</TableHead>
          <TableHead className="font-semibold text-foreground">Rent</TableHead>
          <TableHead className="font-semibold text-foreground">Deposit Balance</TableHead>
          <TableHead className="font-semibold text-foreground"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leases.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-4">
              No leases found
            </TableCell>
          </TableRow>
        ) : (
          leases.map((lease) => {
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
                    <span className="font-bold">
                      {lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'No Tenant'}
                    </span>
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
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(parseFloat(lease.deposit_amount || '0'))}
                </TableCell>
                <TableCell>
                  <Link href={`/leases/${lease.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
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
    if (!lease.end_date) return true;
    return new Date(lease.end_date) >= new Date();
  });

  const inactiveLeases = filteredLeases.filter(lease => {
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
                <ShieldCheck className="mr-2 h-4 w-4" />
                Active
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center">
                <ShieldX className="mr-2 h-4 w-4" />
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

          <div className="flex justify-end mt-4">
            <Pagination className="justify-end">
              <PaginationContent className="gap-3">
                <PaginationItem>
                  <PaginationLink
                    className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    href="#/page/0"
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
                    href="#/page/2"
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
      </Card>
    </div>
  );
} 