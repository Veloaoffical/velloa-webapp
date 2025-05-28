"use client";

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ChevronRight, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { format } from 'date-fns';
import { VendorBillDialog } from "@/app/tasks/[id]/components/task-parts-components/pay-bill";
import { VendorBillDialog as ViewBillDialog } from "@/app/tasks/[id]/components/task-parts-components/view-bill";
import { toast } from "sonner";

interface BillingItem {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  open_balance: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  bill_date: string;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
  type: 'rent' | 'utilities' | 'maintenance' | 'late_fee' | 'deposit' | 'other';
  account_name: string;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
}

interface PeopleBillingPageProps {
  billingItems?: BillingItem[];
  vendorId?: string;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Define the Bill type for ViewBillDialog (matching the interface from view-bill.tsx)
interface Bill {
  id: string
  people_id: string
  bill_date?: string
  due_date?: string
  charge_type: string
  charge_amount: {
    total_amount: number
    lines?: Array<{
      property_id?: string
      unit_id?: string
      category_id?: string
      category?: string
      description?: string
      amount?: number
      category_info?: {
        account_name: string
      }
      line_id?: string
      reference?: number
    }>
    accounts_payable_id?: string
  }
  amount_remaining?: {
    total_amount: number
    lines?: Array<{
      category_info?: {
        account_name: string
      }
    }>
  }
  memo?: string
  reference?: string
  status?: string
  frequency?: string
  start_date?: string
  end_date?: string
  repeat_infinite?: boolean
  charges?: {
    due_date?: string;
  };
}

export default function PeopleBillingPage({ billingItems: initialBillingItems = [], vendorId }: PeopleBillingPageProps) {
  const [billingItems, setBillingItems] = useState<BillingItem[]>(initialBillingItems);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'bill_date' | 'amount' | 'open_balance'>('bill_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isVendorBillDialogOpen, setIsVendorBillDialogOpen] = useState(false);
  const [isViewBillDialogOpen, setIsViewBillDialogOpen] = useState(false);
  const [selectedBillForView, setSelectedBillForView] = useState<Bill | undefined>(undefined);
  const pageSize = 10;

  // Function to fetch billing data
  const fetchBillingData = useCallback(async () => {
    if (!vendorId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/people/${vendorId}/billing`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }
      
      const data = await response.json();
      setBillingItems(data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to refresh billing data');
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  // Initialize with provided data and set up refresh capability
  useEffect(() => {
    setBillingItems(initialBillingItems);
  }, [initialBillingItems]);

  // Filter billing items based on search query
  const filteredBillingItems = billingItems.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const searchTerm = searchQuery.toLowerCase();
    
    // Search in account name
    if (item.account_name?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in amount
    if (formatAmount(item.amount).toLowerCase().includes(searchTerm)) return true;
    
    // Search in open balance
    if (formatAmount(item.open_balance).toLowerCase().includes(searchTerm)) return true;
    
    return false;
  });

  const sortedAndFilteredItems = filteredBillingItems.sort((a, b) => {
    let aValue: number | Date;
    let bValue: number | Date;
    
    switch (sortField) {
      case 'bill_date':
        aValue = new Date(a.bill_date);
        bValue = new Date(b.bill_date);
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'open_balance':
        aValue = a.open_balance;
        bValue = b.open_balance;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedAndFilteredItems.length / pageSize);
  const paginatedItems = sortedAndFilteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: 'bill_date' | 'amount' | 'open_balance') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBillClick = async (item: BillingItem) => {
    try {
      // Fetch the complete charge data from the API
      const response = await fetch(`/api/accounting/bills/${item.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bill details');
      }
      
      const chargeData = await response.json();
      console.log('Fetched charge data:', chargeData);
      
      // Convert the charge data to the format expected by ViewBillDialog
      const billForView = {
        id: chargeData.id,
        people_id: chargeData.people_id,
        bill_date: chargeData.bill_date,
        due_date: chargeData.due_date || undefined,
        charge_type: chargeData.charge_type || 'bill',
        charge_amount: {
          ...chargeData.charge_amount,
          // Ensure lines have category_id properly set
          lines: chargeData.charge_amount?.lines?.map((line: {
            property_id?: string;
            unit_id?: string;
            category_id?: string;
            category?: string;
            description?: string;
            amount?: number;
            category_info?: {
              account_name: string;
            };
            line_id?: string;
            reference?: number;
          }) => ({
            ...line,
            category_id: line.category_id || line.category, // Ensure category_id is set
          })) || []
        },
        amount_remaining: chargeData.amount_remaining,
        memo: chargeData.memo,
        reference: chargeData.reference,
        status: chargeData.status,
        frequency: chargeData.frequency,
        start_date: chargeData.start_date,
        end_date: chargeData.end_date,
        repeat_infinite: chargeData.repeat_infinite
      };
      
      setSelectedBillForView(billForView);
      setIsViewBillDialogOpen(true);
    } catch (error) {
      console.error('Error fetching bill details:', error);
      // Fallback to the basic conversion if API call fails
      const billForView = {
        id: item.id,
        people_id: vendorId || '',
        bill_date: item.bill_date,
        due_date: item.due_date || undefined,
        charge_type: 'bill',
        charge_amount: {
          total_amount: item.amount,
          lines: [{
            description: item.description || '',
            amount: item.amount,
            category_id: item.account_name, // Use account_name as category_id fallback
            category_info: {
              account_name: item.account_name
            }
          }]
        },
        amount_remaining: {
          total_amount: item.open_balance
        },
        reference: item.invoice_number,
        status: item.status
      };
      
      setSelectedBillForView(billForView);
      setIsViewBillDialogOpen(true);
    }
  };

  // Handle successful bill operations (update, delete, create)
  const handleBillOperationSuccess = useCallback(() => {
    fetchBillingData();
    setIsViewBillDialogOpen(false);
  }, [fetchBillingData]);

  const handleNewBillSuccess = useCallback(() => {
    fetchBillingData();
    setIsVendorBillDialogOpen(false);
  }, [fetchBillingData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search billing..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <Button className="gap-2" onClick={() => setIsVendorBillDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New Transaction
              </Button>
            </div>

            <div className="space-y-6">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead 
                      className="h-12 cursor-pointer"
                      onClick={() => handleSort('bill_date')}
                    >
                      Bill Date {sortField === 'bill_date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </TableHead>
                    <TableHead className="h-12">Account Name</TableHead>
                    <TableHead 
                      className="h-12 cursor-pointer"
                      onClick={() => handleSort('amount')}
                    >
                      Amount {sortField === 'amount' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </TableHead>
                    <TableHead 
                      className="h-12 cursor-pointer"
                      onClick={() => handleSort('open_balance')}
                    >
                      Open Balance {sortField === 'open_balance' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-52 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-2" />
                          <p>Loading billing data...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-52 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Search className="h-8 w-8 mb-2" />
                          <p>{searchQuery ? 'No matching items found' : 'No billing items found.'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => handleBillClick(item)}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(item.bill_date), 'PPP')}
                        </TableCell>
                        <TableCell>{item.account_name}</TableCell>
                        <TableCell>${item.amount.toFixed(2)}</TableCell>
                        <TableCell>${item.open_balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {paginatedItems.length > 0 && !isLoading && (
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell />
                      <TableCell className="font-bold">
                        ${sortedAndFilteredItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${sortedAndFilteredItems.reduce((sum, item) => sum + item.open_balance, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>

              {/* Pagination */}
              {sortedAndFilteredItems.length > 0 && !isLoading && (
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill View Dialog - Replace the simple one with ViewBillDialog */}
      <ViewBillDialog
        open={isViewBillDialogOpen}
        onOpenChange={setIsViewBillDialogOpen}
        selectedBill={selectedBillForView}
        onSaveSuccess={handleBillOperationSuccess}
      />

      {/* Vendor Bill Dialog */}
      <VendorBillDialog
        open={isVendorBillDialogOpen}
        onOpenChange={setIsVendorBillDialogOpen}
        defaultVendorId={vendorId}
        onBillCreated={handleNewBillSuccess}
      />
    </div>
  );
} 