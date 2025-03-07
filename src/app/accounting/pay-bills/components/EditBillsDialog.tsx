'use client';

import { DollarSign, Building2, Info, Receipt, TriangleAlert } from "lucide-react";
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
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import React from "react";

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
  account_balance?: number;
  sub_accounts?: {
    id: string;
    account_name: string;
    account_subtype: string;
    account_balance?: number;
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

interface BankAccountSettings {
  accounts: {
    [key: string]: string;
  } | null;
  escrow_bank_account: string | null;
  operating_bank_account: string | null;
  use_default_bank_accounts: boolean;
}

interface CompanySettings {
  lateFees: string;
  updated_at: string;
  rentalIncome: string;
  applicationFee: string;
  managementFees: string;
  accountspayable: string;
  clearingAccount: string;
  securityDeposit: string;
  Undepositedfunds: string;
  trustBankAccount: string;
  accountreceivable: string;
  ownerContribution: string;
  ownerDistribution: string;
  convenienceFeeIncome: string;
  operatingBankAccount: string;
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
  onSave?: (propertyId: string, totalAmount: number) => void;
}

export function EditBillsDialog({ open, onOpenChange, property, charges, startDate, endDate, vendors, onSave }: EditBillsDialogProps) {
  const [vendorData, setVendorData] = useState<Record<string, Vendor>>({});
  const [categoryData, setCategoryData] = useState<Record<string, Category>>({});
  const [bankAccounts, setBankAccounts] = useState<Array<{
    id: string;
    account_name: string;
    account_type: string;
    account_subtype: string;
    account_balance: number;
    property_balance: Array<{
      property_id: string;
      property_name: string;
      balance: number;
    }>;
  }>>([]);
  const [propertySettings, setPropertySettings] = useState<BankAccountSettings | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize payment inputs when charges change
  useEffect(() => {
    const initialInputs: Record<string, string> = {};
    charges.forEach(charge => {
      const propertyAmount = charge.amount_remaining.lines.reduce(
        (sum, line) => line.property_id === property.id ? sum + line.amount : sum,
        0
      );
      initialInputs[charge.id] = propertyAmount.toFixed(2);
    });
    setPaymentInputs(initialInputs);
  }, [charges, property.id]);

  const handlePaymentChange = (chargeId: string, value: string) => {
    setPaymentInputs(prev => ({
      ...prev,
      [chargeId]: value
    }));
  };

  const handlePaymentBlur = (chargeId: string, value: string) => {
    if (value === '') {
      setPaymentInputs(prev => ({
        ...prev,
        [chargeId]: ''
      }));
      return;
    }

    // Format with 2 decimal places when input loses focus
    const numericValue = parseFloat(value) || 0;
    setPaymentInputs(prev => ({
      ...prev,
      [chargeId]: numericValue.toFixed(2)
    }));
  };

  // Fetch vendors, categories, bank accounts, and settings when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch property settings
        const propertySettingsResponse = await fetch(`/api/property/${property.id}/propertySettings`);
        if (!propertySettingsResponse.ok) {
          throw new Error('Failed to fetch property settings');
        }
        const propertySettingsData = await propertySettingsResponse.json();
        setPropertySettings(propertySettingsData.bank_accounts || null);

        // If use_default_bank_accounts is true, fetch company settings
        if (propertySettingsData.bank_accounts?.use_default_bank_accounts) {
          const companySettingsResponse = await fetch('/api/company/settings');
          if (!companySettingsResponse.ok) {
            throw new Error('Failed to fetch company settings');
          }
          const companySettingsData = await companySettingsResponse.json();
          setCompanySettings(companySettingsData);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

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
        
        // Create a map of category data by ID, including sub-accounts
        const categoryMap: Record<string, Category> = {};
        
        data.forEach((category: Category) => {
          categoryMap[category.id] = category;
          
          // Add sub-accounts to the map if they exist
          if (category.sub_accounts) {
            category.sub_accounts.forEach(subAccount => {
              categoryMap[subAccount.id] = {
                ...subAccount,
                account_type: category.account_type
              };
            });
          }
        });
        
        setCategoryData(categoryMap);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    const fetchBankAccounts = async () => {
      try {
        setIsLoadingBankAccounts(true);
        const response = await fetch(`/api/accounting/bank-accounts?property_id=${property.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bank accounts');
        }
        const data = await response.json();
        setBankAccounts(data);
        
        // Don't set default account here - we'll handle it after settings are loaded
      } catch (error) {
        console.error('Error fetching bank accounts:', error);
      } finally {
        setIsLoadingBankAccounts(false);
      }
    };

    if (open) {
      fetchSettings();
      fetchVendors();
      fetchCategories();
      fetchBankAccounts();
    }
  }, [open, property.id]);

  // Set default bank account based on settings
  useEffect(() => {
    if (!bankAccounts.length || !propertySettings) return;

    if (propertySettings.use_default_bank_accounts && companySettings?.operatingBankAccount) {
      // Use company default operating account
      setSelectedAccount(companySettings.operatingBankAccount);
      const account = bankAccounts.find(acc => acc.id === companySettings.operatingBankAccount);
      if (account) {
        const propertyBalance = account.property_balance?.find(bal => bal.property_id === property.id)?.balance || 0;
        setSelectedAccountBalance(propertyBalance);
      }
    } else if (propertySettings.operating_bank_account) {
      // Use property-specific operating account
      setSelectedAccount(propertySettings.operating_bank_account);
      const account = bankAccounts.find(acc => acc.id === propertySettings.operating_bank_account);
      if (account) {
        const propertyBalance = account.property_balance?.find(bal => bal.property_id === property.id)?.balance || 0;
        setSelectedAccountBalance(propertyBalance);
      }
    } else if (bankAccounts.length > 0) {
      // Fallback to first account
      setSelectedAccount(bankAccounts[0].id);
      const propertyBalance = bankAccounts[0].property_balance?.find(bal => bal.property_id === property.id)?.balance || 0;
      setSelectedAccountBalance(propertyBalance);
    }
  }, [bankAccounts, propertySettings, companySettings, property.id]);

  // Filter charges based on property, vendor, and date range
  const filteredCharges = charges.filter(charge => {
    // Check if any charge line has the property ID
    const hasPropertyLine = charge.amount_remaining?.lines.some(
      line => line.property_id === property.id
    );

    // Check if vendor matches the filter (if any)
    const vendorMatches = !vendors || vendors.length === 0 || 
      (charge.vendor_id && vendors.includes(charge.vendor_id));

    // Check if due date is within the date range (if specified)
    const dateMatches = !startDate || !endDate || 
      (charge.due_date &&
        new Date(charge.due_date) >= startDate &&
        new Date(charge.due_date) <= endDate);

    return hasPropertyLine && vendorMatches && dateMatches;
  });

  // Update the account balance when an account is selected
  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    const account = bankAccounts.find(acc => acc.id === accountId);
    const propertyBalance = account?.property_balance?.find(bal => bal.property_id === property.id)?.balance || 0;
    setSelectedAccountBalance(propertyBalance);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Calculate total payment amount
      const totalPaymentAmount = Object.values(paymentInputs).reduce((sum, value) => {
        return sum + (parseFloat(value) || 0);
      }, 0);

      // Call the onSave callback with the total amount if provided
      if (onSave) {
        onSave(property.id, totalPaymentAmount);
      }

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving payments:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
          {/* Insufficient Funds Warning */}
          {selectedAccountBalance < Object.values(paymentInputs).reduce((total, value) => {
            return total + (parseFloat(value) || 0);
          }, 0) && (
            <div className="rounded-md border border-amber-500/50 px-4 py-3 text-amber-600 mx-6 mb-6">
              <p className="text-sm">
                <TriangleAlert
                  className="me-3 -mt-0.5 inline-flex opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Insufficient Funds - The bank account that you have selected does not have enough funds to cover this payment. Would you still like to proceed?
              </p>
            </div>
          )}

          {/* Account and Balance Section */}
          <div className="grid grid-cols-3 gap-6 mb-6 px-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay From Account</label>
              <Select 
                value={selectedAccount} 
                onValueChange={handleAccountChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingBankAccounts ? (
                    <SelectItem value="loading" disabled>Loading accounts...</SelectItem>
                  ) : bankAccounts.length === 0 ? (
                    <SelectItem value="none" disabled>No bank accounts available</SelectItem>
                  ) : (
                    <SelectGroup>
                      <SelectLabel>Bank</SelectLabel>
                      <SelectSeparator />
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Property Account Balance</label>
              <div className="relative">
                <Input
                  type="text"
                  className="ps-8"
                  value={selectedAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  className="ps-8 pe-10"
                  value={selectedAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  readOnly
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground/80">
                  <DollarSign size={12} aria-hidden="true" />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground/80 hover:text-muted-foreground"
                >
                  <Info size={16} aria-hidden="true" />
                </button>
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
                  filteredCharges.reduce((acc, charge) => {
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
                            const propertyAmount = charge.amount_remaining.lines.reduce(
                              (sum, line) => line.property_id === property.id ? sum + line.amount : sum,
                              0
                            ) || 0;

                            return (
                              <TableRow key={charge.id}>
                                <TableCell>
                                  <div className="space-y-1">
                                    {charge.amount_remaining.lines.map((line) => {
                                      const category = categoryData[line.category];
                                      return (
                                        <div key={line.line_id} className="text-sm">
                                          <div className="flex items-center gap-2">
                                            <div className="bg-emerald-500/10 p-1.5 rounded">
                                              <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                                            </div>
                                            <span className="font-medium">{category?.account_name || 'N/A'}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
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
                                      value={paymentInputs[charge.id] || ''}
                                      onChange={(e) => handlePaymentChange(charge.id, e.target.value)}
                                      onBlur={(e) => handlePaymentBlur(charge.id, e.target.value)}
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
              <div className="text-sm text-muted-foreground">Total Bills: {filteredCharges.length}</div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Payment</div>
                <div className="font-medium text-xl">
                  ${Object.values(paymentInputs).reduce((total, value) => {
                    return total + (parseFloat(value) || 0);
                  }, 0).toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || !selectedAccount || Object.values(paymentInputs).every(value => !parseFloat(value))}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 