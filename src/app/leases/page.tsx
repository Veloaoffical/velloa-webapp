'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

const sampleData = [
  {
    id: '1',
    created_at: '2024-01-01T00:00:00Z',
    property: { name: 'Sample Property 1', address: '123 Main St' },
    unit: { unit_number: '101' },
    tenant: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    rent_amount: '1500',
    lease_term: 'Annual'
  },
  {
    id: '2',
    created_at: '2024-02-01T00:00:00Z',
    property: { name: 'Sample Property 2', address: '456 Oak Ave' },
    unit: { unit_number: '202' },
    tenant: { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
    start_date: '2024-02-01',
    end_date: '2025-01-31',
    rent_amount: '2000',
    lease_term: 'Monthly'
  }
];

export default function LeasesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Leases</h2>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-[300px]">
              <Input
                placeholder="Search leases..."
                className="w-full"
              />
            </div>
            <Link href="/people/add-lease">
              <Button className="bg-[#26A769] hover:bg-[#1f8f57]">
                <Plus className="mr-2 h-4 w-4" />
                Add Lease
              </Button>
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Property</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleData.map((lease) => (
                <TableRow key={lease.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{lease.property.name}</span>
                      <span className="text-sm text-muted-foreground">{lease.property.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>{lease.unit.unit_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{`${lease.tenant.first_name} ${lease.tenant.last_name}`}</span>
                      <span className="text-sm text-muted-foreground">{lease.tenant.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(lease.start_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{format(new Date(lease.end_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(parseFloat(lease.rent_amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lease.lease_term}</Badge>
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
