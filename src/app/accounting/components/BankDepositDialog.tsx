"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { X, FileText, Plus, ChevronDown, Check, BanknoteIcon, Printer, FileSearch2 } from "lucide-react"
import { format } from "date-fns"
import CalendarInput from "@/components/calendarwithmonthsinput"
import { toast } from "sonner"
import { customAlphabet } from "nanoid"
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ToolbarPlugin } from '@/components/editor/ToolbarPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface BankDepositDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DepositItem {
  id: string
  property: string
  unit: string
  receivedFrom: string
  paymentMethod: string
  amount: string
  description: string
  isSelected: boolean
}

interface Property {
  id: string
  name: string
}

interface Unit {
  id: string
  unit_name: string
}

interface BankAccount {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  active_account: boolean
  account_balance: number
  property_balance?: {
    property_id: string
    property_name: string
    balance: number
  }[]
}

interface Person {
  id: string
  first_name: string
  last_name: string
  company: string | null
  role: string
  unit?: {
    unit_number: string
    property_name: string
  }
}

function Placeholder() {
  return (
    <div className="absolute top-[25px] left-4 text-muted-foreground pointer-events-none select-none">
      Enter additional notes or details about this deposit
    </div>
  );
}

function MemoEditor({ initialValue, onChange }: { initialValue: string; onChange: (value: string) => void }) {
  const initialConfig = {
    namespace: 'DepositMemo',
    editorState: initialValue,
    onError: (error: Error) => {
      console.error(error);
    },
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
      },
      paragraph: 'my-2',
    },
    nodes: [
      ListNode,
      ListItemNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="rounded-lg border bg-background">
        <ToolbarPlugin />
        <div className="relative p-4">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[100px] outline-none prose prose-sm max-w-none px-0" />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={({ children }) => <div>{children}</div>}
          />
          <OnChangePlugin
            onChange={editorState => {
              editorState.read(() => {
                const serializedState = editorState.toJSON();
                onChange(JSON.stringify(serializedState));
              });
            }}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}

export function BankDepositDialog({ open, onOpenChange }: BankDepositDialogProps) {
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12)
    return nanoid()
  }

  const [depositAccount, setDepositAccount] = useState<string>("")
  const [transferDate, setTransferDate] = useState<Date>()
  const [reference, setReference] = useState<string>(generateReference())
  const [depositItems, setDepositItems] = useState<DepositItem[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"form" | "confirmation">("form")
  const [showMemo, setShowMemo] = useState(false)
  const emptyEditorState = JSON.stringify({
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    }
  });
  const [memo, setMemo] = useState<string>(emptyEditorState)
  const [printDepositSlip, setPrintDepositSlip] = useState(false)
  const [newDepositItem, setNewDepositItem] = useState<DepositItem>({
    id: '',
    property: '',
    unit: '',
    receivedFrom: '',
    paymentMethod: '',
    amount: '',
    description: '',
    isSelected: true
  })

  const resetForm = useCallback(() => {
    setDepositAccount("")
    setTransferDate(undefined)
    setReference(generateReference())
    setDepositItems([])
    setMemo(emptyEditorState)
    setShowMemo(false)
    setPrintDepositSlip(false)
    setStep("form")
    setNewDepositItem({
      id: '',
      property: '',
      unit: '',
      receivedFrom: '',
      paymentMethod: '',
      amount: '',
      description: '',
      isSelected: true
    })
  }, [emptyEditorState])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset reference number
        setReference(generateReference())
        
        // Fetch properties
        const propertiesResponse = await fetch("/api/property")
        if (!propertiesResponse.ok) throw new Error("Failed to fetch properties")
        const propertiesData = await propertiesResponse.json()
        setProperties(propertiesData)

        // Fetch all people
        const peopleResponse = await fetch("/api/people/all")
        if (!peopleResponse.ok) throw new Error("Failed to fetch people")
        const peopleData = await peopleResponse.json()
        setPeople(peopleData)

        // Fetch bank accounts
        const bankAccountsResponse = await fetch("/api/accounting/bank-accounts")
        if (!bankAccountsResponse.ok) throw new Error("Failed to fetch bank accounts")
        const bankAccountsData = await bankAccountsResponse.json()
        setBankAccounts(bankAccountsData)

        try {
          // Fetch pending deposit items
          const depositItemsResponse = await fetch("/api/accounting/pending-deposits")
          if (!depositItemsResponse.ok) {
            const errorData = await depositItemsResponse.json().catch(() => ({}));
            console.error("Pending deposits error:", errorData);
            
            // Handle specific error cases
            if (depositItemsResponse.status === 403) {
              throw new Error("You are not a member of any company. Please contact your administrator.");
            } else {
              throw new Error(`Failed to fetch pending deposits: ${depositItemsResponse.status} ${errorData.error || ''}`);
            }
          }
          const depositItemsData = await depositItemsResponse.json()
          setDepositItems(depositItemsData.map((item: DepositItem) => ({
            ...item,
            isSelected: false
          })))
        } catch (depositError) {
          console.error("Error fetching pending deposits:", depositError);
          toast.error(depositError instanceof Error ? depositError.message : "Failed to load pending deposits");
          // Continue with empty deposit items rather than failing the entire component
          setDepositItems([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error(error instanceof Error ? error.message : "Failed to load required data")
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  // Fetch units when property changes
  useEffect(() => {
    const selectedProperty = newDepositItem.property
    const fetchUnits = async () => {
      try {
        if (!selectedProperty) return;

        const response = await fetch(`/api/property/${selectedProperty}/units`)
        if (!response.ok) throw new Error("Failed to fetch units")
        const data = await response.json()
        setUnits(data)
      } catch (error) {
        console.error("Error fetching units:", error)
        toast.error(error instanceof Error ? error.message : "Failed to load units")
      }
    }

    fetchUnits()
  }, [newDepositItem.property])

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm]);

  const handleAddDepositItem = () => {
    if (!newDepositItem.property || !newDepositItem.paymentMethod || !newDepositItem.amount || parseFloat(newDepositItem.amount) <= 0) {
      toast.error("Please fill in all required fields for the deposit item")
      return
    }

    const newId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12)()
    
    setDepositItems([
      ...depositItems,
      {
        ...newDepositItem,
        id: newId,
        isSelected: true
      }
    ])

    // Reset the new deposit item form
    setNewDepositItem({
      id: '',
      property: '',
      unit: '',
      receivedFrom: '',
      paymentMethod: '',
      amount: '',
      description: '',
      isSelected: true
    })
  }

  const handleToggleItemSelection = (id: string) => {
    setDepositItems(depositItems.map(item => 
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    ))
  }

  const handleDeleteItem = (id: string) => {
    setDepositItems(depositItems.filter(item => item.id !== id))
  }

  const getSelectedItemsTotal = () => {
    return depositItems
      .filter(item => item.isSelected)
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  }

  const getSelectedItemsCount = () => {
    return depositItems.filter(item => item.isSelected).length
  }

  const getAccountBalance = () => {
    if (!depositAccount) return null;
    
    const account = bankAccounts.find(acc => acc.id === depositAccount);
    return account?.account_balance ?? null;
  }

  const validateForm = () => {
    if (!depositAccount) {
      toast.error("Please select a deposit account")
      return false
    }

    if (!transferDate) {
      toast.error("Please select a transfer date")
      return false
    }

    const selectedItems = depositItems.filter(item => item.isSelected)
    if (selectedItems.length === 0) {
      toast.error("Please select at least one deposit item")
      return false
    }

    return true
  }

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return
      }

      setIsLoading(true)
      
      const selectedItems = depositItems.filter(item => item.isSelected)
      
      // Format data for transaction table
      const transactionData = {
        lines: selectedItems.map(item => ({
          unit: item.unit || "",
          category: depositAccount, // Using deposit account as category
          property: item.property,
          description: item.description || "Payment",
          debit_amount: parseFloat(item.amount),
          credit_amount: 0
        })),
        total_amount: getSelectedItemsTotal(),
        payment_method: selectedItems[0]?.paymentMethod || "check_inapp"
      }
      
      const depositData = {
        transaction_type: "deposit",
        property: selectedItems[0]?.property || null,
        start_date: transferDate ? format(transferDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null,
        due_date: null,
        data: transactionData,
        memo: showMemo ? memo : null,
        payment_method: selectedItems[0]?.paymentMethod || "check_inapp",
        reference: reference
      }

      console.log('Final deposit data:', JSON.stringify(depositData, null, 2))

      const response = await fetch("/api/accounting/bank-deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(depositData),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API error response:', error)
        throw new Error(error.error || "Failed to create bank deposit")
      }

      const responseData = await response.json()
      console.log('API success response:', responseData)
      
      toast.success("Bank deposit created successfully")
      setStep("confirmation")
    } catch (error) {
      console.error("Error saving bank deposit:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create bank deposit")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAndNew = async () => {
    try {
      if (!validateForm()) {
        return
      }

      await handleSave()
      resetForm()
    } catch (error) {
      console.error("Error in save and new:", error)
    }
  }

  const handlePrintDepositSlip = async () => {
    try {
      // Add your deposit slip printing logic here
      toast.success("Deposit slip printed successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error printing deposit slip:", error)
      toast.error("Failed to print deposit slip")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${step === "form" ? "max-w-7xl" : "sm:max-w-md"} bg-card max-h-[95vh] flex flex-col`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>{step === "form" ? "Bank Deposit" : "Deposit Recorded"}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {step === "form" ? (
          <>
            <div className="space-y-6 flex-1 overflow-y-auto px-4">
              {/* Deposit Account Selection */}
              <div className="pt-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Deposit Account <span className="text-destructive">*</span>
                </Label>
                <Select value={depositAccount} onValueChange={setDepositAccount}>
                  <SelectTrigger className="w-[300px] h-[42px] bg-background">
                    <SelectValue placeholder="Select deposit account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Bank Accounts</SelectLabel>
                      {bankAccounts
                        .filter(account => account.account_type === "Asset" && account.account_subtype === "Bank")
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex flex-col">
                              <span>{account.account_name}</span>
                              <span className="text-xs text-muted-foreground">
                                Balance: ${account.account_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-b" />

              {/* Transfer Date */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Transfer Date <span className="text-destructive">*</span>
                </Label>
                <CalendarInput
                  value={transferDate}
                  onChange={setTransferDate}
                  className="w-[300px] h-[42px]"
                  placeholder="Select transfer date"
                />
              </div>

              <div className="border-b" />

              {/* Deposit Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Deposit Details For {depositAccount ? bankAccounts.find(acc => acc.id === depositAccount)?.account_name : "Selected Account"}</h3>
                  <div className="text-sm text-muted-foreground">
                    Account Balance: ${getAccountBalance()?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={depositItems.length > 0 && depositItems.every(item => item.isSelected)}
                          onCheckedChange={(checked) => {
                            setDepositItems(depositItems.map(item => ({
                              ...item,
                              isSelected: !!checked
                            })))
                          }}
                        />
                      </TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Property-Unit</TableHead>
                      <TableHead>Received From</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depositItems.length > 0 ? (
                      depositItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-2">
                            <Checkbox 
                              checked={item.isSelected}
                              onCheckedChange={() => handleToggleItemSelection(item.id)}
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            {item.description || "Payment"}
                          </TableCell>
                          <TableCell className="py-2">
                            {transferDate ? format(transferDate, "MM/dd/yyyy") : ""}
                          </TableCell>
                          <TableCell className="py-2">
                            {properties.find(p => p.id === item.property)?.name || ""} 
                            {item.unit ? ` - ${units.find(u => u.id === item.unit)?.unit_name || ""}` : ""}
                          </TableCell>
                          <TableCell className="py-2">
                            {item.receivedFrom ? (() => {
                              const person = people.find(p => p.id === item.receivedFrom);
                              return person ? `${person.first_name} ${person.last_name}` : "";
                            })() : ""}
                          </TableCell>
                          <TableCell className="py-2">
                            {item.paymentMethod === "bank_transfer" ? "EFT" : 
                             item.paymentMethod === "credit_card" ? "Credit Card" :
                             item.paymentMethod === "cash" ? "Cash" :
                             item.paymentMethod === "check" ? "Check" :
                             item.paymentMethod}
                          </TableCell>
                          <TableCell className="py-2">
                            ${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FileSearch2 className="h-12 w-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground font-medium">No deposits available</p>
                            <p className="text-sm text-muted-foreground/70">Add a new deposit item using the form below</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="border-b" />

              {/* Add New Deposit Item */}
              <div>
                <h3 className="text-lg font-medium mb-4">Other Deposit Items</h3>
                
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="text-base font-medium mb-3">Deposit 1</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Property <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={newDepositItem.property} 
                        onValueChange={(value) => setNewDepositItem({...newDepositItem, property: value})}
                      >
                        <SelectTrigger className="bg-background h-[42px]">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id}>
                              {prop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Unit
                      </Label>
                      <Select 
                        value={newDepositItem.unit} 
                        onValueChange={(value) => setNewDepositItem({...newDepositItem, unit: value})}
                        disabled={!newDepositItem.property}
                      >
                        <SelectTrigger className="bg-background h-[42px]">
                          <SelectValue placeholder={newDepositItem.property ? "Select unit" : "Select property first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Category
                      </Label>
                      <Select 
                        value={newDepositItem.description} 
                        onValueChange={(value) => setNewDepositItem({...newDepositItem, description: value})}
                      >
                        <SelectTrigger className="bg-background h-[42px]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Rent & Fees</SelectLabel>
                            <SelectItem value="Payment">Payment</SelectItem>
                            <SelectItem value="Rent">Rent</SelectItem>
                            <SelectItem value="Late Fee">Late Fee</SelectItem>
                            <SelectItem value="Security Deposit">Security Deposit</SelectItem>
                            <SelectItem value="Pet Deposit">Pet Deposit</SelectItem>
                            <SelectItem value="Pet Rent">Pet Rent</SelectItem>
                            <SelectItem value="Application Fee">Application Fee</SelectItem>
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Additional Income</SelectLabel>
                            <SelectItem value="Parking">Parking</SelectItem>
                            <SelectItem value="Storage">Storage</SelectItem>
                            <SelectItem value="Utility Reimbursement">Utility Reimbursement</SelectItem>
                            <SelectItem value="Laundry">Laundry</SelectItem>
                            <SelectItem value="Maintenance Fee">Maintenance Fee</SelectItem>
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Other</SelectLabel>
                            <SelectItem value="Owner Contribution">Owner Contribution</SelectItem>
                            <SelectItem value="Insurance Claim">Insurance Claim</SelectItem>
                            <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Amount <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newDepositItem.amount}
                        onChange={(e) => setNewDepositItem({...newDepositItem, amount: e.target.value})}
                        className="bg-background h-[42px]"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Payment Method <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={newDepositItem.paymentMethod} 
                        onValueChange={(value) => setNewDepositItem({...newDepositItem, paymentMethod: value})}
                      >
                        <SelectTrigger className="bg-background h-[42px]">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer (ACH) / EFT</SelectItem>
                          <SelectItem value="credit_card">Credit/Debit Card</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="money_order">Money Order</SelectItem>
                          <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Received From
                      </Label>
                      <Select 
                        value={newDepositItem.receivedFrom} 
                        onValueChange={(value) => setNewDepositItem({...newDepositItem, receivedFrom: value})}
                      >
                        <SelectTrigger className="bg-background h-[42px]">
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Tenants</SelectLabel>
                            {people
                              .filter(person => person.role === 'tenant')
                              .map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                  <div className="flex flex-col">
                                    <span>{`${tenant.first_name} ${tenant.last_name}`.trim()}</span>
                                    {tenant.unit && (
                                      <span className="text-xs text-muted-foreground">
                                        {tenant.unit.property_name} - {tenant.unit.unit_number}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Owners</SelectLabel>
                            {people
                              .filter(person => person.role === 'owner')
                              .map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                  <div className="flex flex-col">
                                    <span>{`${owner.first_name} ${owner.last_name}`.trim()}</span>
                                    {owner.company && <span className="text-xs text-muted-foreground">{owner.company}</span>}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-start mt-4">
                    <Button 
                      variant="link"
                      className="text-primary p-0 h-auto"
                      onClick={handleAddDepositItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line Item
                    </Button>
                  </div>
                </div>
              </div>

              {/* Memo */}
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowMemo(!showMemo)
                    if (!showMemo) {
                      setMemo(emptyEditorState)
                    }
                  }} 
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
                    <MemoEditor 
                      initialValue={memo} 
                      onChange={(value) => setMemo(value)} 
                    />
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Drag files or <span className="text-primary cursor-pointer">Click here</span> to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  jpg, png, mp4, doc, docx, pdf, xlsx, xls, no larger than 50 MB.
                </p>
              </div>

              {/* Print Deposit Slip */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="printDepositSlip"
                  checked={printDepositSlip}
                  onCheckedChange={(checked) => setPrintDepositSlip(!!checked)}
                />
                <Label htmlFor="printDepositSlip" className="text-sm">
                  Print Deposit Slip
                </Label>
              </div>
            </div>

            <DialogFooter className="mt-2 border-t pt-4 px-6">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  Ref: <span className="font-medium">{reference}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Number of Payments</div>
                    <div className="font-medium">{getSelectedItemsCount()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Deposit</div>
                    <div className="font-medium">${getSelectedItemsTotal().toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <div className="divide-primary-foreground/30 inline-flex divide-x rounded-lg shadow-xs rtl:space-x-reverse">
                      <Button 
                        onClick={async () => {
                          await handleSave();
                        }} 
                        disabled={isLoading}
                        className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                      >
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                            size="icon"
                            disabled={isLoading}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                          <DropdownMenuRadioGroup>
                            <DropdownMenuRadioItem value="save" onClick={async () => {
                              await handleSave();
                            }}>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Save</span>
                                <span className="text-muted-foreground text-xs">Save and close this deposit</span>
                              </div>
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="save_and_new" onClick={handleSaveAndNew}>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Save and New</span>
                                <span className="text-muted-foreground text-xs">Save and create another deposit</span>
                              </div>
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col gap-4 py-4 px-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center relative">
                <BanknoteIcon className="h-12 w-12 text-primary" />
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5">
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <div className="text-4xl font-semibold">
                ${getSelectedItemsTotal().toFixed(2)}
              </div>
              <div className="w-full bg-background rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">Properties</div>
                  <div className="text-sm">
                    {new Set(depositItems.filter(item => item.isSelected).map(item => item.property)).size}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">Number of Payments</div>
                  <div className="text-sm">{getSelectedItemsCount()}</div>
                </div>
              </div>
              <Button variant="link" className="text-primary w-full flex items-center justify-between">
                View transactions report
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.7761 3 12 3.22386 12 3.5L12 9C12 9.27614 11.7761 9.5 11.5 9.5C11.2239 9.5 11 9.27614 11 9L11 4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </Button>
            </div>
            {printDepositSlip && (
              <Button 
                className="w-full bg-primary" 
                onClick={handlePrintDepositSlip}
                size="lg"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Deposit Slip
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 