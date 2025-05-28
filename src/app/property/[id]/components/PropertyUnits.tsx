'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Home, User, ChevronRight, CheckCircle, XCircle, BedDouble, Bath, Ruler, DoorOpen } from "lucide-react";
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  id: string;
  unit_name: string;
  unit_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  rent_amount?: string;
  status?: string;
  is_occupied?: boolean;
  tenant?: Tenant[] | null;
  property?: Property[] | null;
}

interface PropertyUnitsProps {
  propertyId: string;
  units: Unit[];
}

export function PropertyUnits({ propertyId, units }: PropertyUnitsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [occupiedTabPage, setOccupiedTabPage] = useState(1);
  const [vacantTabPage, setVacantTabPage] = useState(1);
  const pageSize = 10;

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '$0.00';
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  };

  const occupiedUnits = units.filter(unit => unit.is_occupied);
  const vacantUnits = units.filter(unit => !unit.is_occupied);

  const getFilteredUnits = (unitList: Unit[]) => {
    return unitList.filter(unit => 
      unit.unit_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.unit_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.tenant && unit.tenant.length > 0 && (
        unit.tenant[0].name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.tenant[0].first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.tenant[0].last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    );
  };

  const filteredOccupiedUnits = getFilteredUnits(occupiedUnits);
  const filteredVacantUnits = getFilteredUnits(vacantUnits);

  // Calculate pagination for occupied units
  const totalOccupiedPages = Math.ceil(filteredOccupiedUnits.length / pageSize);
  const paginatedOccupiedUnits = filteredOccupiedUnits.slice(
    (occupiedTabPage - 1) * pageSize,
    occupiedTabPage * pageSize
  );

  // Calculate pagination for vacant units
  const totalVacantPages = Math.ceil(filteredVacantUnits.length / pageSize);
  const paginatedVacantUnits = filteredVacantUnits.slice(
    (vacantTabPage - 1) * pageSize,
    vacantTabPage * pageSize
  );

  const renderUnitTable = (unitList: Unit[], totalPages: number, status: string, currentPage: number, setCurrentPage: (page: number) => void) => (
    <>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unitList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-52 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <DoorOpen className="h-8 w-8 mb-2" />
                  <p>{searchQuery ? 'No matching units found' : `No ${status.toLowerCase()} units found for this property`}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            unitList.map((unit) => (
              <TableRow 
                key={unit.id}
                className="cursor-pointer"
                onClick={() => window.location.href = `/unit/${unit.id}`}
              >
                <TableCell>
                <div className="flex items-center gap-2">
                          <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                            <div className="flex items-center justify-center w-8 h-8">
                              <Home className="size-5 text-[#16B364]" strokeWidth={2} />
                            </div>
                          </div>
                    <span className="font-medium">{unit.unit_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {unit.bedrooms || 0} bed
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {unit.bathrooms || 0} bath
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {unit.square_feet ? `${unit.square_feet} sq ft` : 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(unit.rent_amount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {unit.tenant && unit.tenant.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {unit.tenant[0].name || `${unit.tenant[0].first_name || ''} ${unit.tenant[0].last_name || ''}`.trim() || 'Unknown'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No tenant</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    unit.is_occupied 
                      ? 'bg-green-50 text-green-700 ring-green-600/20' 
                      : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                  }`}>
                    {unit.is_occupied ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {unit.is_occupied ? 'Occupied' : 'Vacant'}
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
      {unitList.length > 0 && (
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
                placeholder="Search units..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOccupiedTabPage(1);
                  setVacantTabPage(1);
                }}
              />
            </div>
            <Button asChild>
              <Link href={`/unit/add?propertyId=${propertyId}`} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Unit
              </Link>
            </Button>
          </div>

          {/* Tabs for Occupied/Vacant */}
          <Tabs 
            defaultValue="all" 
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="flex-1">
                <DoorOpen className="mr-2 h-4 w-4" />
                All Units
              </TabsTrigger>
              <TabsTrigger value="occupied" className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Occupied
              </TabsTrigger>
              <TabsTrigger value="vacant" className="flex-1">
                <XCircle className="mr-2 h-4 w-4" />
                Vacant
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {renderUnitTable(
                [...paginatedOccupiedUnits, ...paginatedVacantUnits], 
                Math.ceil((filteredOccupiedUnits.length + filteredVacantUnits.length) / pageSize), 
                'All', 
                occupiedTabPage, 
                setOccupiedTabPage
              )}
            </TabsContent>
            
            <TabsContent value="occupied" className="mt-0">
              {renderUnitTable(
                paginatedOccupiedUnits, 
                totalOccupiedPages, 
                'Occupied', 
                occupiedTabPage, 
                setOccupiedTabPage
              )}
            </TabsContent>
            
            <TabsContent value="vacant" className="mt-0">
              {renderUnitTable(
                paginatedVacantUnits, 
                totalVacantPages, 
                'Vacant', 
                vacantTabPage, 
                setVacantTabPage
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
} 