"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, X, Banknote, Check } from "lucide-react"
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
  property_id?: string
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
    id?: string
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
  account_balance?: number
  property_balance?: {
    property_id: string
    property_name: string
    balance: number
  }[]
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

  const formatCurrency = (amount: string | number): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount)
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
  const [step, setStep] = useState<"form" | "confirmation">("form")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leases from lease-contracts API
        const leasesResponse = await fetch("/api/accounting/lease-contracts")
        if (leasesResponse.ok) {
          const leasesData = await leasesResponse.json()
          setLeases(leasesData)
        }

        // Fetch bank accounts (without property filter initially)
        const accountsResponse = await fetch("/api/accounting/bank-accounts")
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json()
          setBankAccounts(accountsData)
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
      setStep("form")
      
      fetchData()
    }
  }, [open])

  // Function to get property ID from property name
  const getPropertyIdFromName = async (propertyName: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/properties");
      if (response.ok) {
        const properties = await response.json();
        const property = properties.find((p: { name: string; id: string }) => p.name === propertyName);
        return property ? property.id : null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching property ID:", error);
      return null;
    }
  };

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

          // Get property ID from the lease data
          let propertyId = null;
          
          // First check if the property ID is directly available in the lease data
          if (leaseData.property_id) {
            propertyId = leaseData.property_id;
          } 
          // Check if property.id is available
          else if (leaseData.property && leaseData.property.id) {
            propertyId = leaseData.property.id;
          }
          // If not, try to get it from the property balance array
          else if (bankAccounts.length > 0) {
            // Find a property with matching name in any bank account's property_balance
            for (const account of bankAccounts) {
              if (account.property_balance) {
                const matchingProperty = account.property_balance.find(
                  (pb: { property_name: string; property_id: string }) => 
                    pb.property_name === leaseData.property.name
                );
                if (matchingProperty) {
                  propertyId = matchingProperty.property_id;
                  break;
                }
              }
            }
          }
          
          // If still not found, try to get it from the properties API
          if (!propertyId && leaseData.property && leaseData.property.name) {
            propertyId = await getPropertyIdFromName(leaseData.property.name);
          }
          
          console.log(`Found property ID for lease ${selectedLease}: ${propertyId}`);
          
          // Fetch bank accounts filtered by property ID if available
          if (propertyId) {
            const accountsResponse = await fetch(`/api/accounting/bank-accounts?property_id=${propertyId}`);
            if (accountsResponse.ok) {
              const accountsData = await accountsResponse.json();
              setBankAccounts(accountsData);
              
              // Clear selected deposit account if it's not available for this property
              const currentAccount = accountsData.find((acc: BankAccount) => acc.id === depositAccount);
              if (depositAccount && !currentAccount) {
                setDepositAccount("");
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
                  // Log the raw charge data for debugging
                  console.log(`Processing charge ${charge.id}:`, JSON.stringify(charge, null, 2));
                  
                  // Check if the charge has the expected data structure
                  let categoryId: string | undefined = undefined;
                  let categoryName: string | undefined = undefined;
                  let description = 'Charge';
                  let totalAmount = 0;
                  
                  // First check for amount_remaining structure directly in the charge object
                  if (charge.amount_remaining) {
                    console.log(`Charge ${charge.id} has amount_remaining structure:`, JSON.stringify(charge.amount_remaining, null, 2));
                    
                    // Get the total amount from amount_remaining
                    totalAmount = charge.amount_remaining.total_amount || 0;
                    
                    // Check if amount_remaining has lines array
                    if (charge.amount_remaining.lines && Array.isArray(charge.amount_remaining.lines) && charge.amount_remaining.lines.length > 0) {
                      console.log(`Charge ${charge.id} has ${charge.amount_remaining.lines.length} lines in amount_remaining`);
                      
                      // Use amount_remaining.lines for category info
                      const firstLine = charge.amount_remaining.lines[0];
                      if (firstLine) {
                        // Log the first line to see its structure
                        console.log(`First line of charge ${charge.id}:`, JSON.stringify(firstLine, null, 2));
                        
                        // Check for category object with name directly in the line
                        if (firstLine.category && firstLine.category.id && firstLine.category.account_name) {
                          categoryId = firstLine.category.id;
                          categoryName = firstLine.category.account_name;
                          console.log(`Found category directly in line: ID=${categoryId}, Name=${categoryName}`);
                        }
                        // If no direct category object, check for category_id in different formats
                        else if (typeof firstLine.category_id === 'string') {
                          categoryId = firstLine.category_id;
                          console.log(`Found category_id as string: ${categoryId}`);
                        } else if (firstLine.category && typeof firstLine.category.id === 'string') {
                          categoryId = firstLine.category.id;
                          console.log(`Found category.id as string: ${categoryId}`);
                        } else if (firstLine.category_id && typeof firstLine.category_id.id === 'string') {
                          categoryId = firstLine.category_id.id;
                          console.log(`Found category_id.id as string: ${categoryId}`);
                        }
                        
                        console.log(`Charge ${charge.id} has category ID from amount_remaining.lines[0]: ${categoryId}`);
                        
                        // Use description from amount_remaining if available
                        description = charge.amount_remaining.lines
                          .map((line: { description?: string }) => line.description)
                          .filter(Boolean)
                          .join(', ') || 'Charge';
                      }
                    }
                    // If no lines array, check if category_id is directly in amount_remaining
                    else {
                      // Log the amount_remaining to see its structure
                      console.log(`Charge ${charge.id} amount_remaining structure:`, JSON.stringify(charge.amount_remaining, null, 2));
                      
                      // Check for category object with name directly in amount_remaining
                      if (charge.amount_remaining.category && charge.amount_remaining.category.id && charge.amount_remaining.category.account_name) {
                        categoryId = charge.amount_remaining.category.id;
                        categoryName = charge.amount_remaining.category.account_name;
                        console.log(`Found category directly in amount_remaining: ID=${categoryId}, Name=${categoryName}`);
                      }
                      // If no direct category object, check for category_id in different formats
                      else if (typeof charge.amount_remaining.category_id === 'string') {
                        categoryId = charge.amount_remaining.category_id;
                        console.log(`Found category_id as string in amount_remaining: ${categoryId}`);
                      } else if (charge.amount_remaining.category && typeof charge.amount_remaining.category.id === 'string') {
                        categoryId = charge.amount_remaining.category.id;
                        console.log(`Found category.id as string in amount_remaining: ${categoryId}`);
                      } else if (charge.amount_remaining.category_id && typeof charge.amount_remaining.category_id.id === 'string') {
                        categoryId = charge.amount_remaining.category_id.id;
                        console.log(`Found category_id.id as string in amount_remaining: ${categoryId}`);
                      } else {
                        console.log(`Could not find category ID in amount_remaining. amount_remaining.category_id:`, charge.amount_remaining.category_id);
                        if (charge.amount_remaining.category) console.log(`amount_remaining.category:`, charge.amount_remaining.category);
                      }
                      
                      console.log(`Charge ${charge.id} has category ID directly in amount_remaining: ${categoryId}`);
                      
                      // Use description from amount_remaining if available
                      description = charge.amount_remaining.description || 'Charge';
                    }
                  }
                  // If no amount_remaining, fall back to charge_amount
                  else if (charge.charge_amount) {
                    console.log(`Charge ${charge.id} has no amount_remaining, falling back to charge_amount structure:`, JSON.stringify(charge.charge_amount, null, 2));
                    
                    // Get the total amount
                    totalAmount = charge.charge_amount.total_amount || 0;
                    
                    // Check if charge_amount has lines array
                    if (charge.charge_amount.lines && Array.isArray(charge.charge_amount.lines) && charge.charge_amount.lines.length > 0) {
                      console.log(`Charge ${charge.id} has ${charge.charge_amount.lines.length} lines in charge_amount`);
                      
                      // Use charge_amount.lines for category info
                      const firstLine = charge.charge_amount.lines[0];
                      if (firstLine) {
                        // Log the first line to see its structure
                        console.log(`First line of charge ${charge.id}:`, JSON.stringify(firstLine, null, 2));
                        
                        // Check for category object with name directly in the line
                        if (firstLine.category && firstLine.category.id && firstLine.category.account_name) {
                          categoryId = firstLine.category.id;
                          categoryName = firstLine.category.account_name;
                          console.log(`Found category directly in line: ID=${categoryId}, Name=${categoryName}`);
                        }
                        // If no direct category object, check for category_id in different formats
                        else if (typeof firstLine.category_id === 'string') {
                          categoryId = firstLine.category_id;
                          console.log(`Found category_id as string: ${categoryId}`);
                        } else if (firstLine.category && typeof firstLine.category.id === 'string') {
                          categoryId = firstLine.category.id;
                          console.log(`Found category.id as string: ${categoryId}`);
                        } else if (firstLine.category_id && typeof firstLine.category_id.id === 'string') {
                          categoryId = firstLine.category_id.id;
                          console.log(`Found category_id.id as string: ${categoryId}`);
                        }
                        
                        console.log(`Charge ${charge.id} has category ID from charge_amount.lines[0]: ${categoryId}`);
                        
                        // Use description from charge_amount if available
                        description = charge.charge_amount.lines
                          .map((line: { description?: string }) => line.description)
                          .filter(Boolean)
                          .join(', ') || 'Charge';
                      }
                    }
                    // If no lines array, check if category_id is directly in charge_amount
                    else {
                      // Log the charge_amount to see its structure
                      console.log(`Charge ${charge.id} charge_amount structure:`, JSON.stringify(charge.charge_amount, null, 2));
                      
                      // Check for category object with name directly in charge_amount
                      if (charge.charge_amount.category && charge.charge_amount.category.id && charge.charge_amount.category.account_name) {
                        categoryId = charge.charge_amount.category.id;
                        categoryName = charge.charge_amount.category.account_name;
                        console.log(`Found category directly in charge_amount: ID=${categoryId}, Name=${categoryName}`);
                      }
                      // If no direct category object, check for category_id in different formats
                      else if (typeof charge.charge_amount.category_id === 'string') {
                        categoryId = charge.charge_amount.category_id;
                        console.log(`Found category_id as string in charge_amount: ${categoryId}`);
                      } else if (charge.charge_amount.category && typeof charge.charge_amount.category.id === 'string') {
                        categoryId = charge.charge_amount.category.id;
                        console.log(`Found category.id as string in charge_amount: ${categoryId}`);
                      } else if (charge.charge_amount.category_id && typeof charge.charge_amount.category_id.id === 'string') {
                        categoryId = charge.charge_amount.category_id.id;
                        console.log(`Found category_id.id as string in charge_amount: ${categoryId}`);
                      } else {
                        console.log(`Could not find category ID in charge_amount. charge_amount.category_id:`, charge.charge_amount.category_id);
                        if (charge.charge_amount.category) console.log(`charge_amount.category:`, charge.charge_amount.category);
                      }
                      
                      console.log(`Charge ${charge.id} has category ID directly in charge_amount: ${categoryId}`);
                      
                      // Use description from charge_amount if available
                      description = charge.charge_amount.description || 'Charge';
                    }
                  }
                  
                  // If we still don't have a total amount, try to get it from other fields
                  if (totalAmount === 0) {
                    totalAmount = charge.amount || charge.balance || 0;
                  }
                  
                  console.log(`Processed charge ${charge.id} with category ID: ${categoryId || 'undefined'}, category name: ${categoryName || 'undefined'}, amount: ${totalAmount}`);
                  
                  // Return the processed charge
                  return {
                    id: charge.id,
                    description: description,
                    amount: totalAmount,
                    due_date: charge.due_date || new Date().toISOString(),
                    status: charge.status || 'unpaid',
                    balance: charge.amount_remaining?.total_amount || charge.balance || totalAmount, // Use amount_remaining.total_amount if available, then balance, then amount
                    category_id: categoryId,
                    category_name: categoryName, // Add the category name directly from the data if available
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
      // Fetch categories from the categories API
      console.log('Fetching categories from API...');
      const response = await fetch("/api/accounting/categories");
      if (response.ok) {
        const categoriesData = await response.json();
        console.log(`Fetched ${categoriesData.length} categories:`, categoriesData);
        
        // Create a map of category IDs to category names for quick lookup
        const categoryMap: Record<string, string> = {};
        
        // Process the flat list of categories
        categoriesData.forEach((category: Category) => {
          if (category.id) {
            categoryMap[category.id] = category.account_name;
            console.log(`Mapped category ID ${category.id} to name "${category.account_name}"`);
          }
          
          // Also process sub-accounts if they exist
          if (category.sub_accounts && Array.isArray(category.sub_accounts)) {
            category.sub_accounts.forEach((subAccount: { id: string; account_name: string }) => {
              if (subAccount.id) {
                categoryMap[subAccount.id] = subAccount.account_name;
                console.log(`Mapped sub-account ID ${subAccount.id} to name "${subAccount.account_name}"`);
              }
            });
          }
        });
        
        // Check if we found all category IDs
        const missingCategoryIds = categoryIds.filter(id => !categoryMap[id]);
        if (missingCategoryIds.length > 0) {
          console.warn(`Could not find category names for IDs: ${missingCategoryIds.join(', ')}`);
          
          // Fetch missing categories individually
          for (const missingId of missingCategoryIds) {
            try {
              console.log(`Fetching individual category for ID: ${missingId}`);
              const categoryResponse = await fetch(`/api/accounting/categories/${missingId}`);
              if (categoryResponse.ok) {
                const categoryData = await categoryResponse.json();
                console.log(`Individual category response for ${missingId}:`, categoryData);
                if (categoryData && categoryData.account_name) {
                  categoryMap[missingId] = categoryData.account_name;
                  console.log(`Fetched individual category: ${missingId} -> ${categoryData.account_name}`);
                } else {
                  console.error(`Category data for ${missingId} does not contain account_name:`, categoryData);
                }
              } else {
                console.error(`Failed to fetch individual category ${missingId}: ${categoryResponse.status}`);
              }
            } catch (error) {
              console.error(`Error fetching individual category ${missingId}:`, error);
            }
          }
        }
        
        // Update charges with category names
        setCharges(prevCharges => {
          const updatedCharges = prevCharges.map(charge => {
            const categoryName = charge.category_id ? categoryMap[charge.category_id] : undefined;
            console.log(`Setting category name for charge ${charge.id}: ${categoryName || 'Uncategorized'} (ID: ${charge.category_id})`);
            
            return {
              ...charge,
              category_name: categoryName || 'Uncategorized'
            };
          });
          
          return updatedCharges;
        });
        
        // Also update the categories state for the getCategoryName function
        setCategories(categoriesData);
      } else {
        console.error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
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
        // Auto-allocate to oldest charges first based on due date
        let remainingAmount = parseFloat(amountReceived)
        
        // Sort charges by due date (oldest first)
        const sortedCharges = [...charges].sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        
        console.log('Auto-applying payments to charges sorted by due date:', 
          sortedCharges.map(c => ({ id: c.id, due_date: c.due_date, balance: c.balance }))
        )
        
        for (const charge of sortedCharges) {
          if (remainingAmount <= 0) break
          
          const paymentAmount = Math.min(remainingAmount, charge.balance)
          if (paymentAmount > 0) {
            allocations[charge.id] = paymentAmount
            remainingAmount -= paymentAmount
            
            console.log(`Applied ${paymentAmount} to charge ${charge.id}, remaining: ${remainingAmount}`)
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
          share_with_tenants: shareWithTenants,
          tenant_id: selectedTenant
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
      setStep("confirmation")
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
    if (!categoryId) {
      return 'Uncategorized';
    }
    
    console.log(`Looking up category name for ID: ${categoryId}`);
    
    // First check in the main categories
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      console.log(`Found category in main categories: ${category.account_name}`);
      return category.account_name;
    }
    
    // If not found in main categories, check in sub-accounts
    for (const mainCategory of categories) {
      if (mainCategory.sub_accounts) {
        const subAccount = mainCategory.sub_accounts.find(sub => sub.id === categoryId);
        if (subAccount) {
          console.log(`Found category in sub-accounts: ${subAccount.account_name}`);
          return subAccount.account_name;
        }
      }
    }
    
    // If we still haven't found it, try to find it in the charges data
    const chargeWithCategory = charges.find(charge => 
      charge.category_id === categoryId && charge.category_name && charge.category_name !== 'Uncategorized'
    );
    
    if (chargeWithCategory && chargeWithCategory.category_name) {
      console.log(`Found category name in charges data: ${chargeWithCategory.category_name}`);
      return chargeWithCategory.category_name;
    }
    
    // If we still can't find it, make one more attempt to fetch it directly
    const fetchCategoryDirectly = async (id: string) => {
      try {
        const response = await fetch(`/api/accounting/categories/${id}`);
        if (response.ok) {
          const categoryData = await response.json();
          if (categoryData && categoryData.account_name) {
            console.log(`Fetched category directly: ${categoryData.account_name}`);
            return categoryData.account_name;
          }
        }
        return 'Uncategorized';
      } catch (error) {
        console.error(`Error fetching category ${id} directly:`, error);
        return 'Uncategorized';
      }
    };
    
    // Note: This is an async function but we're returning synchronously
    // The direct fetch will happen but won't affect the initial return value
    if (categoryId) {
      fetchCategoryDirectly(categoryId).then(name => {
        if (name !== 'Uncategorized') {
          // Update the categories map for future lookups
          setCategories(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(c => c.id === categoryId);
            if (existingIndex >= 0) {
              updated[existingIndex].account_name = name;
            } else {
              if (categoryId) {
                updated.push({ id: categoryId, account_name: name, account_type: 'Unknown' });
              }
            }
            return updated;
          });
        }
      });
    }
  }

  // Add a new function to calculate auto-payment allocations for preview
  const calculateAutoPaymentAllocations = () => {
    if (!autoApplyPayments || charges.length === 0 || !amountReceived || parseFloat(amountReceived) <= 0) {
      return {}
    }
    
    // Auto-allocate to oldest charges first based on due date
    let remainingAmount = parseFloat(amountReceived)
    const allocations: Record<string, number> = {}
    
    // Sort charges by due date (oldest first)
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
    
    return allocations
  }
  
  // Calculate auto payment allocations whenever relevant state changes
  const autoPaymentAllocations = calculateAutoPaymentAllocations()

  // Add resetForm function
  const resetForm = () => {
    setSelectedLease("")
    setPaymentDate(new Date())
    setDepositAccount("")
    setAmountReceived("")
    setPaymentMethod("")
    setMemo("")
    setShowMemo(false)
    setReference(generateReference())
    setPaymentReference("")
    setAutoApplyPayments(true)
    setAutoDepositFunds(true)
    setEmailReceipt(true)
    setUploadedFiles([])
    setShareWithTenants(false)
    setSelectedCharges({})
    setSelectedTenant("")
    setStep("form")
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetForm()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className={`${step === "form" ? "max-w-7xl" : "sm:max-w-md"} bg-card max-h-[95vh] flex flex-col`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold">{step === "form" ? "Receive Payment" : "Payment Received"}</DialogTitle>
              {step === "form" && (
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
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {step === "form" ? (
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
                        // Only include accounts that have property_balance matching the selected lease's property
                        const leaseData = leases.find(lease => lease.id === selectedLease);
                        let shouldIncludeAccount = true;
                        
                        if (leaseData && account.property_balance && account.property_balance.length > 0) {
                          // Get property ID from lease
                          const leasePropertyId = leaseData.property_id || 
                            (leaseData.property && leaseData.property.id) || 
                            null;
                          
                          // If we have a property ID from the lease, check if this account has a matching property_balance
                          if (leasePropertyId) {
                            shouldIncludeAccount = account.property_balance.some(
                              pb => pb.property_id === leasePropertyId
                            );
                            
                            if (!shouldIncludeAccount) {
                              console.log(`Account ${account.account_name} excluded - no matching property_id ${leasePropertyId} in:`, 
                                account.property_balance.map(pb => pb.property_id).join(', '));
                            }
                          } else if (leaseData.property && leaseData.property.name) {
                            // If we don't have a property ID but have a property name, match by name
                            shouldIncludeAccount = account.property_balance.some(
                              pb => pb.property_name === leaseData.property.name
                            );
                            
                            if (!shouldIncludeAccount) {
                              console.log(`Account ${account.account_name} excluded - no matching property_name ${leaseData.property.name} in:`, 
                                account.property_balance.map(pb => pb.property_name).join(', '));
                            }
                          }
                        } else if (leaseData) {
                          console.log(`Account ${account.account_name} included by default - no property_balance to filter by`);
                        }
                        
                        // Only add the account to the dropdown if it matches the property
                        if (shouldIncludeAccount) {
                          const type = account.account_subtype || 'Other';
                          if (!acc[type]) {
                            acc[type] = [];
                          }
                          acc[type].push(account);
                        }
                        
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
                    
                    {/* Show a message when there are no matching bank accounts */}
                    {Object.keys(
                      bankAccounts.reduce((acc, account) => {
                        const leaseData = leases.find(lease => lease.id === selectedLease);
                        let shouldIncludeAccount = true;
                        
                        if (leaseData && account.property_balance && account.property_balance.length > 0) {
                          const leasePropertyId = leaseData.property_id || 
                            (leaseData.property && leaseData.property.id) || 
                            null;
                          
                          if (leasePropertyId) {
                            shouldIncludeAccount = account.property_balance.some(
                              pb => pb.property_id === leasePropertyId
                            );
                          } else if (leaseData.property && leaseData.property.name) {
                            shouldIncludeAccount = account.property_balance.some(
                              pb => pb.property_name === leaseData.property.name
                            );
                          }
                        }
                        
                        if (shouldIncludeAccount) {
                          const type = account.account_subtype || 'Other';
                          if (!acc[type]) {
                            acc[type] = [];
                          }
                          acc[type].push(account);
                        }
                        
                        return acc;
                      }, {} as Record<string, BankAccount[]>)
                    ).length === 0 && selectedLease && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No bank accounts linked to this property. Please link a bank account to this property first.
                      </div>
                    )}
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
                  onCheckedChange={(checked) => {
                    const newAutoApply = checked === true;
                    setAutoApplyPayments(newAutoApply);
                    
                    // If switching from auto to manual, initialize selectedCharges
                    if (!newAutoApply && charges.length > 0) {
                      const initialSelectedCharges: Record<string, number> = {};
                      charges.forEach(charge => {
                        initialSelectedCharges[charge.id] = 0;
                      });
                      setSelectedCharges(initialSelectedCharges);
                    }
                    
                    // If switching from manual to auto, clear selectedCharges
                    if (newAutoApply) {
                      setSelectedCharges({});
                    }
                  }}
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

            {/* Outstanding Charges Preview (shown when a lease is selected AND autoApplyPayments is ON) */}
            {selectedLease && charges.length > 0 && autoApplyPayments && amountReceived && parseFloat(amountReceived) > 0 && (
              <div className="border rounded-md p-4 mt-4">
                <h3 className="font-medium mb-3">Payment Preview</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  This payment will be automatically applied to the following charges, starting with the earliest due date.
                  <span className="block mt-1 text-xs italic">Note: Balance shown reflects the remaining amount to be paid based on previous payments.</span>
                </p>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Charges</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Payment Amount</TableHead>
                      <TableHead>Status After Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charges
                      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                      .map(charge => {
                        const allocationAmount = autoPaymentAllocations[charge.id] || 0
                        const newBalance = charge.balance - allocationAmount
                        const newStatus = newBalance <= 0 ? 'Paid' : newBalance === charge.balance ? 'Unpaid' : 'Partial'
                        const statusColor = newStatus === 'Paid' ? 'text-green-600' : newStatus === 'Partial' ? 'text-amber-600' : 'text-muted-foreground'
                        
                        return (
                          <TableRow key={charge.id} className={allocationAmount > 0 ? 'bg-primary/5' : undefined}>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                  <Banknote className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium capitalize">
                                    {(() => {
                                      console.log(`Rendering category for charge ${charge.id}:`);
                                      console.log(`- category_id: ${charge.category_id}`);
                                      console.log(`- category_name: ${charge.category_name}`);
                                      
                                      // First try to use the category_name that was directly extracted from the charge data
                                      if (charge.category_name) {
                                        console.log(`Using category name directly from charge data: ${charge.category_name}`);
                                        return charge.category_name;
                                      } 
                                      // If not available, fall back to the lookup methods
                                      else if (charge.category_id) {
                                        const name = getCategoryName(charge.category_id);
                                        console.log(`Using getCategoryName result: ${name}`);
                                        return name;
                                      } else {
                                        console.log(`No category information available`);
                                        return 'Uncategorized';
                                      }
                                    })()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Charge</div>
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
                            <TableCell className="py-2 font-medium">
                              ${formatCurrency(allocationAmount)}
                            </TableCell>
                            <TableCell className={`py-2 font-medium ${statusColor}`}>
                              {newStatus}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    {charges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No outstanding charges found for this lease
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Show remaining amount if any */}
                {parseFloat(amountReceived) > Object.values(autoPaymentAllocations).reduce((sum, amount) => sum + amount, 0) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> ${formatCurrency(parseFloat(amountReceived) - Object.values(autoPaymentAllocations).reduce((sum, amount) => sum + amount, 0))} will remain unallocated after paying all outstanding charges.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Outstanding Charges (shown only when a lease is selected AND autoApplyPayments is OFF) */}
            {selectedLease && charges.length > 0 && !autoApplyPayments && (
              <div className="border rounded-md p-4 mt-4">
                <h3 className="font-medium mb-3">Outstanding Transactions</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the charges you want to apply this payment to.
                  <span className="block mt-1 text-xs italic">Note: Balance shown reflects the remaining amount to be paid based on previous payments.</span>
                </p>
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
                                {(() => {
                                  console.log(`Rendering category for charge ${charge.id}:`);
                                  console.log(`- category_id: ${charge.category_id}`);
                                  console.log(`- category_name: ${charge.category_name}`);
                                  
                                  // First try to use the category_name that was directly extracted from the charge data
                                  if (charge.category_name) {
                                    console.log(`Using category name directly from charge data: ${charge.category_name}`);
                                    return charge.category_name;
                                  } 
                                  // If not available, fall back to the lookup methods
                                  else if (charge.category_id) {
                                    const name = getCategoryName(charge.category_id);
                                    console.log(`Using getCategoryName result: ${name}`);
                                    return name;
                                  } else {
                                    console.log(`No category information available`);
                                    return 'Uncategorized';
                                  }
                                })()}
                              </div>
                              <div className="text-xs text-muted-foreground">Charge</div>
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
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4 px-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center relative">
                <Banknote className="h-12 w-12 text-primary" />
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5">
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <div className="text-4xl font-semibold">
                ${formatCurrency(amountReceived)}
              </div>
              <div className="w-full bg-background rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">Tenant</div>
                  <div className="text-sm">
                    {selectedLease && leases.find(lease => lease.id === selectedLease)?.tenant_name}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">Payment Date</div>
                  <div className="text-sm">{format(paymentDate, "MMM d, yyyy")}</div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">Payment Method</div>
                  <div className="text-sm capitalize">{paymentMethod.replace('_', ' ')}</div>
                </div>
              </div>
             
              <Button 
                onClick={resetForm}
                className="w-full"
              >
                Record Another Payment
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 