'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Plus, Search, ChevronRight, FileText } from "lucide-react";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { VendorBillDialog as CreateVendorBillDialog } from "@/app/tasks/[id]/components/task-parts-components/pay-bill";
// import { EditBillsDialog } from "@/app/accounting/pay-bills/components/EditBillsDialog"; // Commented out to resolve unused import
import { VendorBillDialog } from "@/app/tasks/[id]/components/task-parts-components/view-bill";

interface PartsLabourItem {
  id: string;
  description: string;
  category: string;
  billDate: Date | undefined;
  quantity: number | string;
  unitPrice: number | string;
  total: number;
  payee?: {
    company?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
  } | null;
  account_name?: string;
  open_balance?: number;
  actual_bill_id?: string;
  reference?: string;
  // Potentially add other bill-related fields if they come from the source
  // e.g., memo?: string; reference?: string; status?: string;
  // property_id_line?: string; unit_id_line?: string; // If different from task defaults
  // frequency?: string; start_date?: string; end_date?: string; repeat_infinite?: boolean;
  // charges_due_date?: string; // If different from task default due_date
}

interface TaskPartsLabourProps {
  items: PartsLabourItem[];
  vendorId?: string;
  propertyId?: string;
  unitId?: string;
  dueDate?: string | null;
  maintenanceRequestId: string;
}

// Define an interface compatible with the 'Bill' structure expected by VendorBillDialog (view-bill.tsx)
interface BillForDialog {
  id: string; // Bill ID
  people_id: string; // Vendor ID
  bill_date?: string;
  due_date?: string;
  charge_type: string; // Added to satisfy the Bill interface in view-bill.tsx
  charge_amount: {
    total_amount: number;
    lines?: Array<{
      property_id?: string;
      unit_id?: string;
      category_id?: string; // Crucial for the category selection
      description?: string;
      amount?: number;
      // category?: string; // Optional: if view-bill.tsx used it directly for name
    }>;
    accounts_payable_id?: string;
  };
  amount_remaining?: { // Optional, if TaskPartsLabourItem provides it
    total_amount: number;
    lines?: Array<{
      category_info?: {
        account_name: string;
      };
    }>;
  };
  memo?: string;
  reference?: string;
  status?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  repeat_infinite?: boolean;
  charges?: {
    due_date?: string;
  };
}

// Conversion function
const convertPartsLabourItemToBill = (
  item: PartsLabourItem,
  defaultPropertyId?: string,
  defaultUnitId?: string,
  defaultVendorId?: string,
  defaultDueDate?: string | null
): BillForDialog => {
  console.log("TASKPARTSLABOUR: Converting item to bill. Item ID being used:", item.id, "Full item:", item);
  const billLines = [
    {
      property_id: defaultPropertyId || "",
      unit_id: defaultUnitId || "",
      category_id: item.category, // **** KEY: Assumes item.category IS the category_id ****
      description: item.description,
      amount: typeof item.total === "number" ? item.total : parseFloat(item.total || "0"),
    },
  ];

  let resolvedDueDate: string | undefined = undefined;
  if (defaultDueDate) {
    resolvedDueDate = format(new Date(defaultDueDate), "yyyy-MM-dd");
  }

  return {
    id: item.actual_bill_id || item.id,
    people_id: defaultVendorId || "",
    bill_date: item.billDate ? format(new Date(item.billDate), "yyyy-MM-dd") : undefined,
    due_date: resolvedDueDate, 
    charge_type: item.account_name || "Expense", // Using account_name or a default for charge_type
    charge_amount: {
      total_amount: typeof item.total === "number" ? item.total : parseFloat(item.total || "0"),
      lines: billLines,
    },
    memo: undefined, // Or item.memo if available
    reference: item.reference, // Pass the reference from the item
    status: "unpaid", // Or item.status if available, or derive based on open_balance
    // Optional fields, can be populated if item has them or if specific logic is needed
    // amount_remaining: item.open_balance !== undefined ? { total_amount: item.open_balance } : undefined,
    // frequency: undefined, 
    // start_date: undefined,
    // end_date: undefined,
    // repeat_infinite: false,
    // charges: undefined,
  };
};

export function TaskPartsLabour({ items, vendorId, propertyId, unitId, dueDate, maintenanceRequestId }: TaskPartsLabourProps) {
  console.log('TaskPartsLabour items prop:', items);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [createBillOpen, setCreateBillOpen] = useState(false);
  // const [payBillOpen, setPayBillOpen] = useState(false); // Commented out to resolve unused state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [isViewBillDialogOpen, setIsViewBillDialogOpen] = useState(false);
  const [selectedBillItem, setSelectedBillItem] = useState<PartsLabourItem | undefined>(undefined);

  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const sortedAndFilteredItems = filteredItems.sort((a, b) => {
    if (!a.billDate && !b.billDate) return 0;
    if (!a.billDate) return 1;
    if (!b.billDate) return -1;
    const dateA = a.billDate instanceof Date ? a.billDate : a.billDate ? new Date(a.billDate as unknown as string) : new Date(0);
    const dateB = b.billDate instanceof Date ? b.billDate : b.billDate ? new Date(b.billDate as unknown as string) : new Date(0);
    return sortDirection === 'asc' 
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });

  const totalPages = Math.ceil(sortedAndFilteredItems.length / pageSize);
  const paginatedItems = sortedAndFilteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

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
                  placeholder="Search parts and labour..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New transaction
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-full min-w-[165px]">
                    <DropdownMenuItem onClick={() => setCreateBillOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Bill
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem onClick={() => setPayBillOpen(true)}> Commented out to resolve unused state setter
                      <DollarSign className="h-4 w-4 mr-2" />
                      Pay Bill
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-6">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead 
                      className="h-12 cursor-pointer"
                      onClick={toggleSort}
                    >
                      Bill Date {sortDirection === 'asc' ? '↑' : '↓'}
                    </TableHead>
                    <TableHead className="h-12">Account</TableHead>
                    <TableHead className="h-12">Name</TableHead>
                    <TableHead className="h-12">Amount</TableHead>
                    <TableHead className="h-12">Open Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-52 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Search className="h-8 w-8 mb-2" />
                          <p>{search ? 'No matching items found' : 'No parts and labour items found.'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => {
                          console.log("TASKPARTSLABOUR: Row clicked, item data:", item);
                          setSelectedBillItem(item);
                          setIsViewBillDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {item.billDate ? format(new Date(item.billDate), 'PPP') : '-'}
                        </TableCell>
                        <TableCell>{item.account_name || '-'}</TableCell>
                        <TableCell>{
                          item.payee
                            ? (
                                (item.payee.first_name || item.payee.middle_name || item.payee.last_name)
                                  ? <div>
                                      <div>{[item.payee.first_name, item.payee.middle_name, item.payee.last_name].filter(Boolean).join(' ')}</div>
                                      {item.payee.company && <div className="text-sm text-muted-foreground">{item.payee.company}</div>}
                                    </div>
                                  : item.payee.company
                                    ? <div className="text-sm text-muted-foreground">{item.payee.company}</div>
                                    : '-'
                              )
                            : '-'
                        }</TableCell>
                        <TableCell>${item.total.toFixed(2)}</TableCell>
                        <TableCell>${item.open_balance !== undefined ? item.open_balance.toFixed(2) : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {paginatedItems.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell colSpan={2} />
                      <TableCell className="font-bold">
                        ${sortedAndFilteredItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${sortedAndFilteredItems.reduce((sum, item) => sum + (item.open_balance ?? 0), 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>

              {/* Pagination */}
              {sortedAndFilteredItems.length > 0 && (
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

          {/* Dialogs for Create Bill and Pay Bill */}
          <CreateVendorBillDialog 
            open={createBillOpen} 
            onOpenChange={setCreateBillOpen} 
            defaultVendorId={vendorId} 
            defaultPropertyId={propertyId} 
            defaultUnitId={unitId} 
            defaultDueDate={dueDate} 
            maintenanceRequestId={maintenanceRequestId}
          />
          {/* <EditBillsDialog open={payBillOpen} onOpenChange={setPayBillOpen} /> */}
          {/* Temporarily commented out to avoid props error & keep focus on view-bill issue */}
          {/* If EditBillsDialog is needed here, it requires property and charges props. */}
          
          {selectedBillItem && (() => {
            const billToView = convertPartsLabourItemToBill(selectedBillItem, propertyId, unitId, vendorId, dueDate);
            console.log("TASKPARTSLABOUR: Bill object being passed to VendorBillDialog:", billToView);
            return (
              <VendorBillDialog
                open={isViewBillDialogOpen}
                onOpenChange={(isOpen) => {
                  setIsViewBillDialogOpen(isOpen);
                  if (!isOpen) {
                    setSelectedBillItem(undefined); // Clear selection when dialog closes
                  }
                }}
                selectedBill={billToView}
                onSaveSuccess={() => {
                  setIsViewBillDialogOpen(false);
                  setSelectedBillItem(undefined);
                  // Potentially refresh data here, e.g., by re-fetching items
                  router.refresh(); // Example: simple refresh
                }}
              />
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
} 