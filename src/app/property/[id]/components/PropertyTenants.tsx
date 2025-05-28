'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, User, Mail, Phone, Plus, Home, ChevronRight } from "lucide-react";
import Link from 'next/link';
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
  role: string;
  property_id: string;
  unit_id: string | null;
  unit?: {
    unit_number: string;
    property_name: string;
  } | null;
}

interface PropertyTenantsProps {
  propertyId: string;
  tenants: Person[];
}

export function PropertyTenants({ propertyId, tenants }: PropertyTenantsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone?.replace(/\D/g, '');
    if (!cleaned) return "Not specified";
    
    const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      const countryCode = match[1] ? '+1 ' : '';
      return `${countryCode}(${match[2]})-${match[3]}-${match[4]}`;
    }
    
    return phone;
  };

  const filteredTenants = tenants.filter(tenant => 
    tenant.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.unit?.unit_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredTenants.length / pageSize);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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
                placeholder="Search tenants..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href={`/people/add-lease?propertyId=${propertyId}`} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Tenant
              </Link>
            </Button>
          </div>

          {/* Tenants table */}
          <div>
            <Table>
            <TableHeader className="bg-muted">
            <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-52 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-8 w-8 mb-2" />
                        <p>{searchQuery ? 'No matching tenants found' : 'No tenants found for this property'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTenants.map((tenant) => (
                    <TableRow 
                      key={tenant.id}
                      className="cursor-pointer"
                      onClick={() => window.location.href = `/people/${tenant.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                            <div className="flex items-center justify-center w-8 h-8">
                              <User className="size-5 text-[#16B364]" strokeWidth={2} />
                            </div>
                          </div>
                          <span className="font-medium">{tenant.first_name} {tenant.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Tenant
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.email || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{formatPhoneNumber(tenant.phone)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {tenant.unit ? tenant.unit.unit_number : "No unit assigned"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
                          Not Set
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
          </div>
          
          {/* Pagination */}
          {tenants.length > 0 && (
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
                      <ChevronRight className="h-4 w-4 rotate-180" />
                    </PaginationLink>
                  </PaginationItem>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <PaginationItem>
                    <PaginationLink
                      className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        </div>
      </CardContent>
    </Card>
  );
} 