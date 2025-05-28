'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, User, Mail, Phone, Plus, ChevronRight, Calendar, UserCircle } from "lucide-react";
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { format } from 'date-fns';

interface Person {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  property_id: string;
  unit_id: string | null;
  expected_move_in_date: string | null;
  status: string | null;
  assignee_id: string | null;
  prospect_property?: {
    property_id: string;
    unit_id: string;
  } | null;
  unit?: {
    unit_number: string;
    property_name: string;
  } | null;
}

interface PropertyProspectsProps {
  propertyId: string;
  prospects: Person[];
}

export function PropertyProspects({ propertyId, prospects }: PropertyProspectsProps) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return "Invalid date";
    }
  };

  const getApplicationStatusBadge = (status: string | null) => {
    if (!status) return (
      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
        Not Started
      </span>
    );

    const statusMap: Record<string, { bg: string, text: string, ring: string }> = {
      'submitted': { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/20' },
      'reviewing': { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20' },
      'approved': { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-600/20' },
      'rejected': { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20' },
    };

    const style = statusMap[status.toLowerCase()] || { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-600/20' };

    return (
      <span className={`inline-flex items-center rounded-md ${style.bg} px-2 py-1 text-xs font-medium ${style.text} ring-1 ring-inset ${style.ring}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredProspects = prospects.filter(prospect => 
    prospect.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prospect.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prospect.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prospect.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prospect.unit?.unit_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredProspects.length / pageSize);
  const paginatedProspects = filteredProspects.slice(
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
                placeholder="Search prospects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href={`/people/add-prospect?propertyId=${propertyId}`} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Prospect
              </Link>
            </Button>
          </div>

          {/* Prospects table */}
          <div>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Move-in Date</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-52 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-8 w-8 mb-2" />
                        <p>{searchQuery ? 'No matching prospects found' : 'No prospects found for this property'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProspects.map((prospect) => (
                    <TableRow 
                      key={prospect.id}
                      className="cursor-pointer"
                      onClick={() => window.location.href = `/people/${prospect.id}`}
                    >
                      <TableCell>
                      <div className="flex items-center gap-2">
                          <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                            <div className="flex items-center justify-center w-8 h-8">
                              <User className="size-5 text-[#16B364]" strokeWidth={2} />
                            </div>
                          </div>
                          <span className="font-medium">{prospect.first_name} {prospect.last_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(prospect.expected_move_in_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{prospect.email || "Not specified"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{formatPhoneNumber(prospect.phone)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {prospect.assignee_id ? "Agent" : "Unassigned"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getApplicationStatusBadge(prospect.status)}
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
          {prospects.length > 0 && (
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