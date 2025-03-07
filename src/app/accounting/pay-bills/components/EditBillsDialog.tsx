'use client';

import { DollarSign, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface ChargeLine {
  property_id: string;
  amount: number;
  category: string;
  line_id: string;
  reference?: string;
  description?: string;
  unit_id?: string;
  credit_amount?: number;
  debit_amount?: number;
}

interface Category {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  sub_accounts?: {
    id: string;
    account_name: string;
    account_subtype: string;
  }[];
}

interface Charge {
  id: string;
  payee: string;
  vendor_id?: string;
  vendor?: {
    id: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    company?: string;
  };
  due_date?: Date;
  amount_remaining: {
    lines: ChargeLine[];
    total_amount: number;
    accounts_receivable_id?: string;
  };
}

interface Vendor {
  id: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  company?: string;
}

interface EditBillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    id: string;
    name: string;
    address?: string;
  };
  charges: Charge[];
  startDate?: Date | null;
  endDate?: Date | null;
  vendors?: string[];
}

export function EditBillsDialog({ open, onOpenChange, property, charges, startDate, endDate, vendors }: EditBillsDialogProps) {
  const [vendorData, setVendorData] = useState<Record<string, Vendor>>({});
  const [categoryData, setCategoryData] = useState<Record<string, Category>>({});
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Fetch vendors when component mounts
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setIsLoadingVendors(true);
        const response = await fetch('/api/people/vendor/search');
        if (!response.ok) {
          throw new Error('Failed to fetch vendors');
        }
        const data = await response.json();
        
        // Create a map of vendor data by ID
        const vendorMap = data.reduce((acc: Record<string, Vendor>, vendor: Vendor) => {
          acc[vendor.id] = {
            id: vendor.id,
            first_name: vendor.first_name,
            middle_name: vendor.middle_name,
            last_name: vendor.last_name,
            company: vendor.company
          };
          return acc;
        }, {});
        
        setVendorData(vendorMap);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setIsLoadingVendors(false);
      }
    };

    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch('/api/accounting/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        console.log('Categories data:', data);
        
        // Create a map of category data by ID, including sub-accounts
        const categoryMap: Record<string, Category> = {};
        data.forEach((category: Category) => {
          categoryMap[category.id] = category;
          // Add sub-accounts to the map if they exist
          if (category.sub_accounts) {
            category.sub_accounts.forEach(subAccount => {
              categoryMap[subAccount.id] = {
                ...subAccount,
                account_type: category.account_type // Inherit parent's account type
              };
            });
          }
        });
        
        console.log('Category map:', categoryMap);
        setCategoryData(categoryMap);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (open) {
      fetchVendors();
      fetchCategories();
    }
  }, [open]);

  // Filter charges for this property and based on date range/vendors
  const propertyCharges = charges.filter(charge => {
    const hasPropertyLine = charge.amount_remaining?.lines?.some(
      line => line.property_id === property.id
    );

    const vendorMatches = !vendors?.length || vendors.includes(charge.payee);

    const dateMatches = !startDate || !endDate ? true :
      (charge.due_date &&
        new Date(charge.due_date) >= startDate &&
        new Date(charge.due_date) <= endDate);

    return hasPropertyLine && vendorMatches && dateMatches;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-card max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-muted/30 p-2.5 rounded-lg">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              Bills Due - {property.name}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Account and Balance Section */}
          <div className="grid grid-cols-3 gap-6 mb-6 px-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay From Account</label>
              <Select defaultValue="operating-2">
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operating-1">Operating Account 1</SelectItem>
                  <SelectItem value="operating-2">Operating Account 2</SelectItem>
                  <SelectItem value="operating-3">Operating Account 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Property Account Balance</label>
              <div className="relative">
                <Input
                  type="text"
                  className="ps-8"
                  value="0.00"
                  readOnly
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground/80">
                  <DollarSign size={12} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Property Available Funds</label>
              <div className="relative">
                <Input
                  type="text"
                  className="ps-8 text-destructive"
                  value="0.00"
                  readOnly
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-destructive/80">
                  <DollarSign size={12} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          {/* Bills Table - Make this section scrollable */}
          <div className="flex-1 overflow-y-auto px-6">
            {isLoadingVendors || isLoadingCategories ? (
              // Loading state
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/30 p-4 border-b">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        {[1, 2].map((j) => (
                          <div key={j} className="flex justify-between items-center">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Actual content
              <div className="space-y-6">
                {Object.entries(
                  propertyCharges.reduce((acc, charge) => {
                    const vendorId = charge.payee;
                    if (!acc[vendorId]) {
                      acc[vendorId] = [];
                    }
                    acc[vendorId].push(charge);
                    return acc;
                  }, {} as Record<string, Charge[]>)
                ).map(([vendorId, vendorCharges]) => {
                  const vendor = vendorData[vendorId];
                  const vendorTotal = vendorCharges.reduce((total, charge) => {
                    const propertyAmount = charge.amount_remaining?.lines?.reduce(
                      (sum, line) => line.property_id === property.id ? sum + line.amount : sum,
                      0
                    ) || 0;
                    return total + propertyAmount;
                  }, 0);

                  return (
                    <div key={vendorId} className="border rounded-lg overflow-hidden">
                      {/* Vendor Header */}
                      <div className="bg-muted/30 p-4 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {vendor ? (
                                [vendor.first_name, vendor.middle_name, vendor.last_name]
                                  .filter(Boolean)
                                  .join(" ") || vendor.company || vendorId
                              ) : vendorId}
                            </h3>
                            {vendor?.company && (
                              <p className="text-sm text-muted-foreground">
                                {vendor.company}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Due</div>
                            <div className="font-medium">${vendorTotal.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Charges Table */}
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Transaction</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Amount Due</TableHead>
                            <TableHead className="text-right">Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendorCharges.map((charge) => {
                            const propertyAmount = charge.amount_remaining?.lines?.reduce(
                              (sum, line) => line.property_id === property.id ? sum + line.amount : sum,
                              0
                            ) || 0;

                            // Get all unique categories from the charge lines
                            const categories = charge.amount_remaining?.lines
                              ?.filter(line => line.property_id === property.id)
                              ?.map(line => {
                                const category = categoryData[line.category];
                                return {
                                  name: category?.account_name || 'N/A',
                                  amount: line.credit_amount || line.debit_amount || 0,
                                  description: line.description || ''
                                };
                              }) || [];

                            console.log('Processed categories:', categories);

                            return (
                              <TableRow key={charge.id}>
                                <TableCell>
                                  <div className="space-y-1">
                                    {categories.map((cat, idx) => (
                                      <div key={idx} className="text-sm">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{cat.name}</span>
                                        </div>
                                      </div>
                                    ))}
                                    {categories.length === 0 && (
                                      <div className="text-sm text-muted-foreground">N/A</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm">
                                      {charge.due_date ? new Date(charge.due_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                    {charge.due_date && new Date(charge.due_date) < new Date() && (
                                      <div className="text-xs text-destructive">
                                        Expired {Math.floor((new Date().getTime() - new Date(charge.due_date).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {charge.amount_remaining.lines[0]?.line_id || 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${propertyAmount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="relative w-32 ml-auto">
                                    <Input
                                      type="text"
                                      className="ps-7 text-right px-4"
                                      defaultValue={propertyAmount.toFixed(2)}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-muted-foreground/80">
                                      <DollarSign size={14} aria-hidden="true" />
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2 border-t pt-4 px-6 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="text-sm text-muted-foreground">Total Bills: {propertyCharges.length}</div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="font-medium text-xl">
                  ${propertyCharges.reduce((total, charge) => {
                    const propertyAmount = charge.amount_remaining?.lines?.reduce(
                      (sum, line) => line.property_id === property.id ? sum + line.amount : sum,
                      0
                    ) || 0;
                    return total + propertyAmount;
                  }, 0).toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // TODO: Implement save functionality
                  onOpenChange(false);
                }}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 