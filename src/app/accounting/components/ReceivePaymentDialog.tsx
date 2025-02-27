"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, X, Banknote } from "lucide-react"
import { format } from "date-fns"
import CalendarInput from "@/components/calendarwithmonthsinput"
import { toast } from "sonner"
import { customAlphabet } from "nanoid"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ReceivePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Lease {
  id: string
  tenant_name: string
  unit_name: string
  property_name: string
  tenant: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    name?: string
  } | null
  property: {
    name: string
    address: string
  }
  unit: {
    unit_number: string
  }
  start_date: string
  end_date: string
  rent_amount: string
  lease_term: string
  deposit_amount: string
}

interface BankAccount {
  id: string
  account_name: string
  account_type: string
  account_subtype?: string
  sub_accounts?: {
    id: string
    account_name: string
    account_subtype?: string
  }[]
}

interface Charge {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  balance: number
  category_id?: string
  category_name?: string
  reference?: string
}

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
}

interface Category {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype?: string;
  sub_accounts?: {
    id: string;
    account_name: string;
    account_subtype?: string;
  }[];
}

export function ReceivePaymentDialog({ open, onOpenChange }: ReceivePaymentDialogProps) {
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return nanoid()
  }

  // Format currency with commas for thousands and millions
  const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const [selectedLease, setSelectedLease] = useState<string>("")
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [depositAccount, setDepositAccount] = useState<string>("")
  const [amountReceived, setAmountReceived] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [memo, setMemo] = useState<string>("")
  const [showMemo, setShowMemo] = useState(false)
  const [leases, setLeases] = useState<Lease[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [charges, setCharges] = useState<Charge[]>([])
  const [reference, setReference] = useState<string>(generateReference())
  const [paymentReference, setPaymentReference] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [autoApplyPayments, setAutoApplyPayments] = useState(true)
  const [autoDepositFunds, setAutoDepositFunds] = useState(true)
  const [emailReceipt, setEmailReceipt] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [shareWithTenants, setShareWithTenants] = useState(false)
  const [selectedCharges, setSelectedCharges] = useState<Record<string, number>>({})
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>("")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leases from lease-contracts API
        const leasesResponse = await fetch("/api/accounting/lease-contracts")
        if (leasesResponse.ok) {
          const leasesData = await leasesResponse.json()
          setLeases(leasesData)
        }

        // Fetch bank accounts
        const accountsResponse = await fetch("/api/accounting/categories")
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json()
          // Filter to only include bank accounts
          const filteredBankAccounts = accountsData.filter(
            (account: BankAccount) => account.account_type === 'Asset' && 
            (account.account_subtype === 'Bank' || account.account_subtype === 'Cash')
          )
          setBankAccounts(filteredBankAccounts)
        }

        // Fetch all tenants
        const tenantsResponse = await fetch("/api/people/tenants")
        if (tenantsResponse.ok) {
          const tenantsData = await tenantsResponse.json()
          setTenants(tenantsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load required data")
      }
    }

    if (open) {
      // Reset state when dialog opens
      setSelectedLease("")
      setPaymentDate(new Date())
      setDepositAccount("")
      setAmountReceived("")
      setPaymentMethod("")
      setMemo("")
      setShowMemo(false)
      setCharges([])
      setReference(generateReference())
      setPaymentReference("")
      setAutoApplyPayments(true)
      setAutoDepositFunds(true)
      setEmailReceipt(true)
      setUploadedFiles([])
      setShareWithTenants(false)
      setSelectedCharges({})
      setSelectedTenant("")
      
      fetchData()
    }
  }, [open])

  useEffect(() => {
    const fetchLeaseDetails = async () => {
      if (!selectedLease) {
        // Clear charges when no lease is selected
        setCharges([])
        return
      }

      try {
        // Fetch lease data
        const leaseData = leases.find(lease => lease.id === selectedLease)
        if (leaseData) {
          // Set tenant details from the lease data
          if (leaseData.tenant && leaseData.tenant.id) {
            setSelectedTenant(leaseData.tenant.id)
            
            // Set tenant details directly from the lease data
            if (leaseData.tenant) {
              const tenant: Tenant = {
                id: leaseData.tenant.id,
                first_name: leaseData.tenant.first_name || leaseData.tenant.name?.split(' ')[0] || '',
                last_name: leaseData.tenant.last_name || leaseData.tenant.name?.split(' ').slice(1).join(' ') || '',
                email: leaseData.tenant.email || '',
                phone: leaseData.tenant.phone || '',
                role: 'tenant'
              }
              
              // Add this tenant to the tenants array if not already present
              if (!tenants.some(t => t.id === tenant.id)) {
                setTenants(prev => [...prev, tenant])
              }
            }
          }
        }

        // Fetch default bank account for the property
        if (leaseData?.property_name) {
          const propertyResponse = await fetch(`/api/property/${leaseData.property_name}`)
          if (propertyResponse.ok) {
            const propertyData = await propertyResponse.json()
            if (propertyData.default_operating_account) {
              setDepositAccount(propertyData.default_operating_account)
            }
          }
        }

        // Fetch unpaid charges for the lease using the dedicated charges API
        console.log(`Fetching charges for lease: ${selectedLease}`)
        // Modify the URL to avoid the lease_contracts join that's causing the error
        const chargesUrl = `/api/accounting/charges?lease_id=${selectedLease}&status=unpaid`
        console.log(`API URL: ${chargesUrl}`)
        
        try {
          const chargesResponse = await fetch(chargesUrl)
          
          if (chargesResponse.ok) {
            const chargesData = await chargesResponse.json()
            console.log(`Received ${chargesData.length} charges:`, chargesData)
            
            if (Array.isArray(chargesData) && chargesData.length > 0) {
              // Log the first charge to see its structure
              console.log('First charge structure:', JSON.stringify(chargesData[0], null, 2))
              
              // Transform charges data to match the Charge interface
              const processedCharges = chargesData.map((charge) => {
                // Check if the charge has the expected data structure
                const hasLines = charge.data && Array.isArray(charge.data.lines) && charge.data.lines.length > 0
                const totalAmount = charge.data?.total_amount || 0
                
                // Extract category information from the first line if available
                let categoryId: string | undefined = undefined;
                let description = 'Charge';
                
                if (hasLines && charge.data.lines.length > 0) {
                  // Get the first line for category info
                  const firstLine = charge.data.lines[0];
                  
                  // Check if category_id exists in the first line
                  if (firstLine && typeof firstLine.category_id === 'string') {
                    categoryId = firstLine.category_id;
                    console.log(`Charge ${charge.id} has category ID: ${categoryId}`);
                  } else {
                    console.log(`Charge ${charge.id} has no valid category ID in first line:`, firstLine);
                  }
                  
                  // Combine descriptions from all lines
                  description = charge.data.lines
                    .map((line: { description?: string }) => line.description || 'Charge')
                    .filter(Boolean)
                    .join(', ');
                }
                
                // If the charge has lines, use the total amount from data
                // Otherwise, try to find amount in other possible locations
                return {
                  id: charge.id,
                  description: description,
                  amount: totalAmount,
                  due_date: charge.due_date || new Date().toISOString(),
                  status: charge.status || 'unpaid',
                  balance: totalAmount, // Assuming balance is the same as amount for unpaid charges
                  category_id: categoryId,
                  reference: charge.reference
                }
              })
              
              console.log('Processed charges with category IDs:', processedCharges.map(c => ({ id: c.id, category_id: c.category_id })))
              setCharges(processedCharges)
              
              // Initialize selected charges for manual allocation
              if (!autoApplyPayments) {
                const initialSelectedCharges: Record<string, number> = {};
                processedCharges.forEach(charge => {
                  initialSelectedCharges[charge.id] = 0;
                });
                setSelectedCharges(initialSelectedCharges);
              }
            } else {
              console.log('No charges found or empty array returned')
              setCharges([])
              setSelectedCharges({})
            }
          } else {
            console.error(`Failed to fetch charges: ${chargesResponse.status} ${chargesResponse.statusText}`)
            
            let errorText = 'Unknown error';
            try {
              errorText = await chargesResponse.text();
            } catch {
              // Ignore error parsing failures
            }
            console.error(`Error response: ${errorText}`);
            
            setCharges([])
            setSelectedCharges({})
          }
        } catch (chargeError) {
          console.error("Error fetching charges:", chargeError)
          setCharges([])
          setSelectedCharges({})
        }
      } catch (error) {
        console.error("Error fetching lease details:", error)
        setCharges([])
        setSelectedCharges({})
      }
    }

    fetchLeaseDetails()
  }, [selectedLease, leases, tenants, autoApplyPayments])

  const fetchCategoryNames = async (charges: Charge[]) => {
    // Extract all unique category IDs from charges
    const categoryIds = charges
      .map(charge => charge.category_id)
      .filter((id): id is string => id !== undefined);

    console.log('Category IDs to fetch:', categoryIds);

    if (categoryIds.length === 0) {
      console.log('No category IDs to fetch');
      return;
    }

    try {
      // Fetch all categories from chart_of_accounts instead of categories
      const response = await fetch("/api/accounting/categories");
      if (response.ok) {
        const categoriesData = await response.json();
        console.log('Fetched categories data:', categoriesData);
        
        // Create a map of category IDs to category names for quick lookup
        const categoryMap: Record<string, string> = {};
        
        // Process the flat list of categories
        categoriesData.forEach((category: Category) => {
          if (category.id) {
            categoryMap[category.id] = category.account_name;
          }
          
          // Also process sub-accounts if they exist
          if (category.sub_accounts && Array.isArray(category.sub_accounts)) {
            category.sub_accounts.forEach((subAccount: { id: string; account_name: string }) => {
              if (subAccount.id) {
                categoryMap[subAccount.id] = subAccount.account_name;
              }
            });
          }
        });
        
        console.log('Category map:', categoryMap);
        
        // Update charges with category names
        setCharges(prevCharges => {
          const updatedCharges = prevCharges.map(charge => ({
            ...charge,
            category_name: charge.category_id ? categoryMap[charge.category_id] || 'Uncategorized' : 'Uncategorized'
          }));
          console.log('Updated charges with category names:', updatedCharges);
          return updatedCharges;
        });
        
        // Also update the categories state for the getCategoryName function
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    if (selectedLease && charges.length > 0) {
      console.log('Fetching category names for charges:', charges);
      fetchCategoryNames(charges);
    }
  }, [charges.length, selectedLease]);

  // Handle tenant selection change
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!selectedLease) {
        toast.error("Please select a lease")
        setIsLoading(false)
        return
      }

      if (!paymentDate) {
        toast.error("Please select a payment date")
        setIsLoading(false)
        return
      }

      if (!amountReceived || parseFloat(amountReceived) <= 0) {
        toast.error("Please enter a valid amount")
        setIsLoading(false)
        return
      }

      if (!depositAccount) {
        toast.error("Please select a deposit account")
        setIsLoading(false)
        return
      }

      if (!paymentMethod) {
        toast.error("Please select a payment method")
        setIsLoading(false)
        return
      }

      // Get the selected lease data
      const leaseData = leases.find(lease => lease.id === selectedLease)
      if (!leaseData) {
        toast.error("Selected lease not found")
        setIsLoading(false)
        return
      }

      // Prepare payment allocation data
      const allocations: Record<string, number> = {}
      
      if (autoApplyPayments && charges.length > 0) {
        // Auto-allocate to oldest charges first
        let remainingAmount = parseFloat(amountReceived)
        const sortedCharges = [...charges].sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        
        for (const charge of sortedCharges) {
          if (remainingAmount <= 0) break
          
          const paymentAmount = Math.min(remainingAmount, charge.balance)
          if (paymentAmount > 0) {
            allocations[charge.id] = paymentAmount
            remainingAmount -= paymentAmount
          }
        }
      } else if (!autoApplyPayments && Object.keys(selectedCharges).length > 0) {
        // Use manually selected allocations, but only include non-zero amounts
        Object.entries(selectedCharges).forEach(([chargeId, amount]) => {
          if (amount > 0) {
            allocations[chargeId] = amount
          }
        })
      }

      // Only proceed if we have allocations or the user has confirmed they want to proceed without allocations
      if (Object.keys(allocations).length === 0) {
        const confirmProceed = window.confirm(
          "You haven't allocated this payment to any charges. Do you want to proceed anyway?"
        )
        if (!confirmProceed) {
          setIsLoading(false)
          return
        }
      }

      // Generate a new reference before saving
      const newReference = generateReference()
      setReference(newReference)

      const response = await fetch("/api/accounting/receive-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lease_id: selectedLease,
          payment_date: format(paymentDate, "yyyy-MM-dd"),
          amount: parseFloat(amountReceived),
          payment_method: paymentMethod,
          check_number: paymentMethod === "check" ? paymentReference : undefined,
          payment_reference: ["check", "eft", "wire", "money_order"].includes(paymentMethod) ? paymentReference : undefined,
          deposit_account_id: depositAccount,
          memo: memo || undefined,
          reference: newReference,
          auto_deposit: autoDepositFunds,
          email_receipt: emailReceipt,
          allocations,
          share_with_tenants: shareWithTenants
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to record payment")
      }

      // Handle file uploads if any
      if (uploadedFiles.length > 0) {
        const paymentData = await response.json()
        const paymentId = paymentData.id
        
        const formData = new FormData()
        uploadedFiles.forEach(file => {
          formData.append('files', file)
        })
        
        const fileResponse = await fetch(`/api/transactions/${paymentId}/attachments`, {
          method: "POST",
          body: formData
        })
        
        if (!fileResponse.ok) {
          toast.warning("Payment recorded but file upload failed")
        }
      }

      toast.success("Payment recorded successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving payment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to record payment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChargeAllocationChange = (chargeId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0
    
    // Ensure amount is not negative and not greater than the charge balance
    const charge = charges.find(c => c.id === chargeId)
    const maxAmount = charge ? charge.balance : 0
    const validAmount = Math.min(Math.max(0, numAmount), maxAmount)
    
    setSelectedCharges(prev => ({
      ...prev,
      [chargeId]: validAmount
    }))
  }

  const getTotalAllocated = () => {
    return Object.values(selectedCharges).reduce((sum, amount) => sum + amount, 0)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files)
      setUploadedFiles([...uploadedFiles, ...fileList])
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...uploadedFiles]
    newFiles.splice(index, 1)
    setUploadedFiles(newFiles)
  }

  // Fetch categories when dialog opens
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/accounting/categories");
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return 'Uncategorized';
    
    // First check in the main categories
    const category = categories.find(cat => cat.id === categoryId);
    if (category) return category.account_name;
    
    // If not found in main categories, check in sub-accounts
    for (const mainCategory of categories) {
      if (mainCategory.sub_accounts) {
        const subAccount = mainCategory.sub_accounts.find(sub => sub.id === categoryId);
        if (subAccount) return subAccount.account_name;
      }
    }
    
    // If we still haven't found it, try to find it in the charges data
    const chargeWithCategory = charges.find(charge => 
      charge.category_id === categoryId && charge.category_name
    );
    if (chargeWithCategory && chargeWithCategory.category_name) {
      return chargeWithCategory.category_name;
    }
    
    console.log(`Category ID ${categoryId} not found in categories:`, categories);
    return 'Uncategorized';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-card max-h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold">Receive Payment</DialogTitle>
              <div className="text-sm text-muted-foreground">
                Record a payment received from a tenant
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Record payments received outside of the tenant portal, such as checks, cash, or direct payments.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-4">
          {/* Lease Selection and Payment Date Row */}
          <div className="pt-4 flex items-start gap-4">
            <div className="w-[400px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Lease <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedLease} onValueChange={setSelectedLease}>
                <SelectTrigger className="w-full h-[42px] bg-background">
                  <SelectValue placeholder="Select lease" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {`${lease.tenant_name} - ${lease.property_name} (${lease.unit_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[200px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Date <span className="text-destructive">*</span>
              </Label>
              <CalendarInput
                value={paymentDate}
                onChange={(date: Date | undefined) => {
                  if (date) setPaymentDate(date)
                }}
                className="w-full h-[42px]"
                placeholder="Select payment date"
              />
            </div>
          </div>

          {/* Received From, Deposit Account, and Amount Received Row */}
          <div className="flex items-start gap-4">
            <div className="w-[400px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Received From
              </Label>
              <Select 
                value={selectedTenant} 
                onValueChange={handleTenantChange}
                disabled={!selectedLease}
              >
                <SelectTrigger className="w-full h-[42px] bg-background">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {`${tenant.first_name} ${tenant.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[250px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Deposit Account <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={depositAccount} 
                onValueChange={setDepositAccount}
                disabled={!selectedLease}
              >
                <SelectTrigger className="w-full h-[42px] bg-background">
                  <SelectValue placeholder="Select deposit account" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(
                    bankAccounts.reduce((acc, account) => {
                      const type = account.account_subtype || 'Other';
                      if (!acc[type]) {
                        acc[type] = [];
                      }
                      acc[type].push(account);
                      return acc;
                    }, {} as Record<string, BankAccount[]>)
                  ).map(([type, accounts]) => (
                    <SelectGroup key={type}>
                      <SelectLabel>{type}</SelectLabel>
                      {accounts.map((account) => (
                        <React.Fragment key={account.id}>
                          <SelectItem value={account.id}>
                            <div className="flex flex-col">
                              <span>{account.account_name}</span>
                              {account.account_subtype && (
                                <span className="text-xs text-muted-foreground">{account.account_subtype}</span>
                              )}
                            </div>
                          </SelectItem>
                          {account.sub_accounts && account.sub_accounts.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="pl-4 text-xs">
                                {account.account_name} Sub-accounts
                              </SelectLabel>
                              {account.sub_accounts.map((subAccount) => (
                                <SelectItem 
                                  key={subAccount.id} 
                                  value={subAccount.id}
                                  className="pl-6"
                                >
                                  <div className="flex flex-col">
                                    <span>{subAccount.account_name}</span>
                                    {subAccount.account_subtype && (
                                      <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </React.Fragment>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[200px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Amount Received <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full h-[42px] bg-background"
              />
            </div>
          </div>

          {/* Payment Method Row */}
          <div className="flex items-start gap-4">
            <div className="w-[400px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Payment Method <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full h-[42px] bg-background">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="eft">EFT/ACH</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                  <SelectItem value="money_order">Money Order</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "check" && (
              <div className="w-[200px]">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Reference Number
                </Label>
                <Input
                  placeholder="Reference #"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full h-[42px] bg-background"
                />
              </div>
            )}

            {["eft", "wire", "money_order"].includes(paymentMethod) && (
              <div className="w-[200px]">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Reference Number
                </Label>
                <Input
                  placeholder="Reference #"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full h-[42px] bg-background"
                />
              </div>
            )}
          </div>

          <div className="border-b" />

          {/* Payment Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="auto-apply" 
                checked={autoApplyPayments}
                onCheckedChange={(checked) => setAutoApplyPayments(checked === true)}
              />
              <label
                htmlFor="auto-apply"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Automatically Apply Payments
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="auto-deposit" 
                checked={autoDepositFunds}
                onCheckedChange={(checked) => setAutoDepositFunds(checked === true)}
              />
              <label
                htmlFor="auto-deposit"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Automatically Deposit Funds
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-receipt" 
                checked={emailReceipt}
                onCheckedChange={(checked) => setEmailReceipt(checked === true)}
              />
              <label
                htmlFor="email-receipt"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email Payment Receipt to the Tenant
              </label>
            </div>
          </div>

          {/* Outstanding Charges (shown only when a lease is selected AND autoApplyPayments is OFF) */}
          {selectedLease && charges.length > 0 && !autoApplyPayments && (
            <div className="border rounded-md p-4 mt-4">
              <h3 className="font-medium mb-3">Outstanding Transactions</h3>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Charges <span className="text-destructive">*</span></TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Payment Amount <span className="text-destructive">*</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map(charge => (
                    <TableRow key={charge.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Banknote className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium capitalize">
                              {charge.category_name || getCategoryName(charge.category_id) || 'Uncategorized'}
                            </div>
                            <div className="text-xs text-muted-foreground">{charge.description || 'No description'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {charge.reference || 'N/A'}
                      </TableCell>
                      <TableCell className="py-2">
                        {new Date(charge.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2 font-medium">
                        ${formatCurrency(charge.balance)}
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="bg-background h-[36px] w-[120px]"
                          value={selectedCharges[charge.id] || ''}
                          onChange={(e) => handleChargeAllocationChange(charge.id, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {charges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No outstanding charges found for this lease
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedLease && charges.length === 0 && !autoApplyPayments && (
            <div className="border rounded-md p-4 mt-4">
              <h3 className="font-medium mb-3">Outstanding Transactions</h3>
              <div className="text-center py-4 text-muted-foreground">
                No outstanding charges found for this lease
              </div>
            </div>
          )}

          {/* Memo */}
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowMemo(!showMemo)} 
              className="flex items-center gap-2 text-primary hover:text-primary/80 p-0"
            >
              <FileText className="h-4 w-4" />
              {showMemo ? "Hide memo" : "Add memo"}
            </Button>
            <div className="overflow-hidden">
              <div 
                className={`transform transition-all duration-200 ease-out ${
                  showMemo 
                    ? 'translate-y-0 opacity-100 h-auto visible' 
                    : 'translate-y-4 opacity-0 h-0 invisible'
                }`}
              >
                <Input
                  placeholder="Add a memo for your reference"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-background"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center relative">
            <input
              type="file"
              id="file-upload"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
            <p className="text-sm text-muted-foreground">
              Drag files or <span className="text-primary cursor-pointer">Click here</span> to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              jpg, png, mp4, doc, docx, pdf, xlsx, xls, no larger than 50 MB.
            </p>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Share with tenants checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="share-with-tenants" 
              checked={shareWithTenants}
              onCheckedChange={(checked) => setShareWithTenants(checked === true)}
            />
            <label
              htmlFor="share-with-tenants"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Share files with the tenants.
            </label>
          </div>
        </div>

        <DialogFooter className="mt-2 border-t pt-4 px-6">
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="text-sm text-muted-foreground">Reference</div>
              <div className="font-medium">{reference}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-6 mr-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="font-medium text-xl">${formatCurrency(amountReceived || "0")}</div>
                </div>
                {!autoApplyPayments && (
                  <div>
                    <div className="text-sm text-muted-foreground">Allocated</div>
                    <div className="font-medium text-xl">${formatCurrency(getTotalAllocated())}</div>
                  </div>
                )}
                {!autoApplyPayments && (
                  <div>
                    <div className="text-sm text-muted-foreground">Unallocated</div>
                    <div className={`font-medium text-xl ${parseFloat(amountReceived || "0") - getTotalAllocated() < 0 ? 'text-destructive' : 'text-amber-500'}`}>
                      ${formatCurrency(parseFloat(amountReceived || "0") - getTotalAllocated())}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 