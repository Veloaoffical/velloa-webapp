'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, Home, Calendar, ChevronRight, Tag, FileText, BadgeCheck } from "lucide-react";
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

interface UnitListing {
  listingid: string;
  created_at: string;
  property_title: string | null;
  listing_description: string | null;
  amenities: Record<string, unknown> | null;
  available_date: string | null;
  status: string | null;
  unitid: string | null;
  propertyId: string | null;
  unit?: {
    unit_name: string;
  } | null;
}

interface PropertyListingsProps {
  propertyId: string;
  listings: UnitListing[];
}

export function PropertyListings({ propertyId, listings }: PropertyListingsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return "No description";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
      case 'inactive':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'draft':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  const filteredListings = listings.filter(listing => 
    listing.property_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.unit?.unit_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.listing_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredListings.length / pageSize);
  const paginatedListings = filteredListings.slice(
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
                placeholder="Search listings..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href={`/unit/add-listing?propertyId=${propertyId}`} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Listing
              </Link>
            </Button>
          </div>

          {/* Listings table */}
          <div>
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Available Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-52 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Home className="h-8 w-8 mb-2" />
                        <p>{searchQuery ? 'No matching listings found' : 'No listings found for this property'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedListings.map((listing) => (
                    <TableRow 
                      key={listing.listingid}
                      className="cursor-pointer"
                      onClick={() => window.location.href = `/unit/listing/${listing.listingid}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                            <div className="flex items-center justify-center w-8 h-8">
                              <Tag className="size-5 text-[#16B364]" strokeWidth={2} />
                            </div>
                          </div>
                          <span className="font-medium">{listing.property_title || "Untitled Listing"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {listing.unit ? listing.unit.unit_name : "No unit specified"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {truncateText(listing.listing_description, 50)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {listing.available_date ? formatDate(listing.available_date) : "Not specified"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(listing.status)}`}>
                          <BadgeCheck className="mr-1 h-3 w-3" />
                          {listing.status || "Not Set"}
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
          {listings.length > 0 && (
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
                    Page {currentPage} of {totalPages || 1}
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