"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, X } from "lucide-react"
import { format } from "date-fns"
import CalendarInput from "@/components/calendarwithmonthsinput"
import { toast } from "sonner"
import { customAlphabet } from "nanoid"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReceivePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Lease {
  id: string
  tenant_name: string
  unit_name: string
  property_name: string
  tenant_id: string
}

interface BankAccount {
  id: string
  account_name: string
  account_type: string
}

interface Charge {
  id: string
  description: string
  amount: number
  due_date: string
  status: string
  balance: number
}

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
}

interface Transaction {
  id: string
  transaction_type: string
  start_date: string
  data: {
    description?: string
    total_amount?: number
    status?: string
    balance?: number
    [key: string]: unknown
  }
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
  const [checkNumber, setCheckNumber] = useState<string>("")
  const [memo, setMemo] = useState<string>("")
  const [showMemo, setShowMemo] = useState(false)
  const [leases, setLeases] = useState<Lease[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [charges, setCharges] = useState<Charge[]>([])
  const [reference, setReference] = useState<string>(generateReference())
  const [isLoading, setIsLoading] = useState(false)
  const [autoApplyPayments, setAutoApplyPayments] = useState(true)
  const [autoDepositFunds, setAutoDepositFunds] = useState(true)
  const [emailReceipt, setEmailReceipt] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [shareWithTenants, setShareWithTenants] = useState(false)
  const [selectedCharges, setSelectedCharges] = useState<Record<string, number>>({})
  const [tenantDetails, setTenantDetails] = useState<Tenant | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leases
        const leasesResponse = await fetch("/api/leases")
        if (leasesResponse.ok) {
          const leasesData = await leasesResponse.json()
          setLeases(leasesData)
        }

        // Fetch bank accounts
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
      fetchData()
    }
  }, [open])

  useEffect(() => {
    const fetchLeaseDetails = async () => {
      if (!selectedLease) return

      try {
        // Fetch lease data
        const leaseData = leases.find(lease => lease.id === selectedLease)
        if (leaseData) {
          // Set tenant ID from lease data
          if (leaseData.tenant_id) {
            setSelectedTenant(leaseData.tenant_id)
            
            // Find tenant in the tenants array
            const tenant = tenants.find(t => t.id === leaseData.tenant_id)
            if (tenant) {
              setTenantDetails(tenant)
            } else {
              // If tenant not found in the array, fetch from API
              const tenantResponse = await fetch(`/api/people/${leaseData.tenant_id}`)
              if (tenantResponse.ok) {
                const tenantData = await tenantResponse.json()
                setTenantDetails(tenantData)
              }
            }
          }
        }

        // Fetch default bank account for the property
        const propertyResponse = await fetch(`/api/property/${leaseData?.property_name}`)
        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json()
          if (propertyData.default_operating_account) {
            setDepositAccount(propertyData.default_operating_account)
          }
        }

        // Fetch unpaid charges for the lease from transaction table
        const chargesResponse = await fetch(`/api/accounting/transactions?lease_id=${selectedLease}&transaction_type=charge&status=unpaid`)
        if (chargesResponse.ok) {
          const transactionsData = await chargesResponse.json()
          
          // Transform transaction data to match the Charge interface
          const chargesData = transactionsData.map((transaction: Transaction) => ({
            id: transaction.id,
            description: transaction.data?.description || 'Charge',
            amount: transaction.data?.total_amount || 0,
            due_date: transaction.start_date || new Date().toISOString(),
            status: transaction.data?.status || 'unpaid',
            balance: transaction.data?.balance || transaction.data?.total_amount || 0
          }))
          
          setCharges(chargesData)
        }
      } catch (error) {
        console.error("Error fetching lease details:", error)
      }
    }

    fetchLeaseDetails()
  }, [selectedLease, leases, tenants])

  // Handle tenant selection change
  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId)
    const tenant = tenants.find(t => t.id === tenantId)
    if (tenant) {
      setTenantDetails(tenant)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!selectedLease) {
        toast.error("Please select a lease")
        return
      }

      if (!paymentDate) {
        toast.error("Please select a payment date")
        return
      }

      if (!amountReceived || parseFloat(amountReceived) <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      if (!depositAccount) {
        toast.error("Please select a deposit account")
        return
      }

      if (!paymentMethod) {
        toast.error("Please select a payment method")
        return
      }

      // Prepare payment allocation data
      let allocations: Record<string, number> = {}
      
      if (autoApplyPayments) {
        // Auto-allocate to oldest charges first
        let remainingAmount = parseFloat(amountReceived)
        const sortedCharges = [...charges].sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        
        for (const charge of sortedCharges) {
          if (remainingAmount <= 0) break
          
          const paymentAmount = Math.min(remainingAmount, charge.balance)
          allocations[charge.id] = paymentAmount
          remainingAmount -= paymentAmount
        }
      } else {
        // Use manually selected allocations
        allocations = selectedCharges
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
          check_number: paymentMethod === "check" ? checkNumber : undefined,
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
    setSelectedCharges({
      ...selectedCharges,
      [chargeId]: numAmount
    })
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
              <Select value={selectedTenant} onValueChange={handleTenantChange}>
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
              {tenantDetails && (
                <div className="text-xs text-muted-foreground mt-1">
                  {tenantDetails.email && `Email: ${tenantDetails.email}`}
                  {tenantDetails.phone && tenantDetails.email && ' • '}
                  {tenantDetails.phone && `Phone: ${tenantDetails.phone}`}
                </div>
              )}
            </div>

            <div className="w-[250px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Deposit Account <span className="text-destructive">*</span>
              </Label>
              <Select value={depositAccount} onValueChange={setDepositAccount}>
                <SelectTrigger className="w-full h-[42px] bg-background">
                  <SelectValue placeholder="Select deposit account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
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
                  Check Number
                </Label>
                <Input
                  placeholder="Check #"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
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

          {/* Manual Payment Allocation (shown only when autoApplyPayments is false) */}
          {!autoApplyPayments && charges.length > 0 && (
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="font-medium">Payment Allocation</h3>
              <div className="space-y-2">
                {charges.map(charge => (
                  <div key={charge.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{charge.description || 'Charge'}</div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(charge.due_date).toLocaleDateString()} - Balance: ${formatCurrency(charge.balance)}
                      </div>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="w-[120px]"
                      value={selectedCharges[charge.id] || ''}
                      onChange={(e) => handleChargeAllocationChange(charge.id, e.target.value)}
                    />
                  </div>
                ))}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total Allocated:</span>
                  <span>${formatCurrency(getTotalAllocated())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unallocated Amount:</span>
                  <span>${formatCurrency(parseFloat(amountReceived) - getTotalAllocated())}</span>
                </div>
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
            <div className="flex gap-6">
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
              {!autoApplyPayments && parseFloat(amountReceived || "0") > getTotalAllocated() && (
                <div>
                  <div className="text-sm text-muted-foreground">Unallocated</div>
                  <div className="font-medium text-xl text-amber-500">
                    ${formatCurrency(parseFloat(amountReceived || "0") - getTotalAllocated())}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Ref: <span className="font-medium">{reference}</span>
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