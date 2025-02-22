"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, FileText, ArrowLeftRight, ChevronDown, Check } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface BankTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

function Placeholder() {
  return (
    <div className="absolute top-[25px] left-4 text-muted-foreground pointer-events-none select-none">
      Enter additional notes or details about this bank transfer
    </div>
  );
}

function MemoEditor({ initialValue, onChange }: { initialValue: string; onChange: (value: string) => void }) {
  const initialConfig = {
    namespace: 'BankTransferMemo',
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

export function BankTransferDialog({ open, onOpenChange }: BankTransferDialogProps) {
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return nanoid()
  }

  const [sourceProperty, setSourceProperty] = useState<string>("")
  const [sourceUnit, setSourceUnit] = useState<string>("")
  const [sourceAccount, setSourceAccount] = useState<string>("")
  const [receivingProperty, setReceivingProperty] = useState<string>("")
  const [receivingUnit, setReceivingUnit] = useState<string>("")
  const [receivingAccount, setReceivingAccount] = useState<string>("")
  const [transferDate, setTransferDate] = useState<Date>()
  const [amount, setAmount] = useState<string>("")
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
  const [showMemo, setShowMemo] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [sourceUnits, setSourceUnits] = useState<Unit[]>([])
  const [receivingUnits, setReceivingUnits] = useState<Unit[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [reference, setReference] = useState<string>(generateReference())
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"form" | "confirmation">("form")

  const resetForm = useCallback(() => {
    setSourceProperty("")
    setSourceUnit("")
    setSourceAccount("")
    setReceivingProperty("")
    setReceivingUnit("")
    setReceivingAccount("")
    setTransferDate(undefined)
    setAmount("")
    setMemo(emptyEditorState)
    setShowMemo(false)
    setReference(generateReference())
    setStep("form")
  }, [])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  const getAccountBalance = () => {
    if (!sourceAccount || !sourceProperty) {
      return null;
    }
    
    const account = bankAccounts.find(acc => acc.id === sourceAccount);
    if (!account?.property_balance) return null;

    // Find the property-specific balance
    const propertyBalance = account.property_balance.find(pb => pb.property_id === sourceProperty);
    return propertyBalance?.balance ?? null;
  };

  const getReceivingAccountBalance = () => {
    if (!receivingAccount || !receivingProperty) {
      return null;
    }
    
    const account = bankAccounts.find(acc => acc.id === receivingAccount);
    if (!account?.property_balance) return null;

    // Find the property-specific balance
    const propertyBalance = account.property_balance.find(pb => pb.property_id === receivingProperty);
    return propertyBalance?.balance ?? null;
  };

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

        // Initial fetch of bank accounts (without property filter)
        const accountsResponse = await fetch("/api/accounting/bank-accounts")
        if (!accountsResponse.ok) throw new Error("Failed to fetch bank accounts")
        const accountsData = await accountsResponse.json()
        setBankAccounts(accountsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load required data")
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  // Fetch bank accounts when source property changes
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        if (!sourceProperty) return

        const response = await fetch(`/api/accounting/bank-accounts?property_id=${sourceProperty}`)
        if (!response.ok) throw new Error("Failed to fetch bank accounts")
        const data = await response.json()
        setBankAccounts(prevAccounts => {
          // Keep accounts from receiving property if it exists
          const receivingAccounts = receivingProperty 
            ? prevAccounts.filter(acc => acc.property_balance?.some(pb => pb.property_id === receivingProperty))
            : []
          
          // Combine with new source accounts, removing duplicates
          return [...new Map([...data, ...receivingAccounts].map(acc => [acc.id, acc])).values()]
        })
      } catch (error) {
        console.error("Error fetching bank accounts:", error)
        toast.error("Failed to load bank accounts")
      }
    }

    fetchBankAccounts()
  }, [sourceProperty, receivingProperty])

  // Fetch bank accounts when receiving property changes
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        if (!receivingProperty) return

        const response = await fetch(`/api/accounting/bank-accounts?property_id=${receivingProperty}`)
        if (!response.ok) throw new Error("Failed to fetch bank accounts")
        const data = await response.json()
        setBankAccounts(prevAccounts => {
          // Keep accounts from source property if it exists
          const sourceAccounts = sourceProperty 
            ? prevAccounts.filter(acc => acc.property_balance?.some(pb => pb.property_id === sourceProperty))
            : []
          
          // Combine with new receiving accounts, removing duplicates
          return [...new Map([...data, ...sourceAccounts].map(acc => [acc.id, acc])).values()]
        })
      } catch (error) {
        console.error("Error fetching bank accounts:", error)
        toast.error("Failed to load bank accounts")
      }
    }

    fetchBankAccounts()
  }, [receivingProperty, sourceProperty])

  useEffect(() => {
    const fetchSourceUnits = async () => {
      if (!sourceProperty) {
        setSourceUnits([])
        return
      }

      try {
        const response = await fetch(`/api/property/${sourceProperty}/units`)
        if (!response.ok) throw new Error("Failed to fetch units")
        const data = await response.json()
        setSourceUnits(data)
      } catch (error) {
        console.error("Error fetching source units:", error)
        toast.error("Failed to load source units")
      }
    }

    fetchSourceUnits()
  }, [sourceProperty])

  useEffect(() => {
    const fetchReceivingUnits = async () => {
      if (!receivingProperty) {
        setReceivingUnits([])
        return
      }

      try {
        const response = await fetch(`/api/property/${receivingProperty}/units`)
        if (!response.ok) throw new Error("Failed to fetch units")
        const data = await response.json()
        setReceivingUnits(data)
      } catch (error) {
        console.error("Error fetching receiving units:", error)
        toast.error("Failed to load receiving units")
      }
    }

    fetchReceivingUnits()
  }, [receivingProperty])

  // Update source account when property changes
  useEffect(() => {
    if (sourceProperty) {
      // Clear selected account if it doesn't have a balance for the selected property
      const currentAccount = bankAccounts.find(acc => acc.id === sourceAccount);
      const hasPropertyBalance = currentAccount?.property_balance?.some(pb => pb.property_id === sourceProperty);
      if (sourceAccount && !hasPropertyBalance) {
        setSourceAccount("");
      }
    }
  }, [sourceProperty, bankAccounts, sourceAccount]);

  // Update receiving account when property changes
  useEffect(() => {
    if (receivingProperty) {
      // Clear selected account if it doesn't have a balance for the selected property
      const currentAccount = bankAccounts.find(acc => acc.id === receivingAccount);
      const hasPropertyBalance = currentAccount?.property_balance?.some(pb => pb.property_id === receivingProperty);
      if (receivingAccount && !hasPropertyBalance) {
        setReceivingAccount("");
      }
    }
  }, [receivingProperty, bankAccounts, receivingAccount]);

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!sourceProperty || !sourceAccount) {
        toast.error("Please select source property and account")
        return
      }

      if (!receivingProperty || !receivingAccount) {
        toast.error("Please select receiving property and account")
        return
      }

      if (!transferDate) {
        toast.error("Please select a transfer date")
        return
      }

      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      const response = await fetch("/api/accounting/bank-transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_property_id: sourceProperty,
          source_unit_id: sourceUnit || undefined,
          source_account_id: sourceAccount,
          receiving_property_id: receivingProperty,
          receiving_unit_id: receivingUnit || undefined,
          receiving_account_id: receivingAccount,
          transfer_date: format(transferDate, "yyyy-MM-dd"),
          amount: parseFloat(amount),
          memo: memo || undefined,
          reference
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create bank transfer")
      }

      toast.success("Bank transfer created successfully")
      setStep("confirmation")
    } catch (error) {
      console.error("Error saving bank transfer:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create bank transfer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`${step === "form" ? "max-w-7xl" : "sm:max-w-md"} bg-card max-h-[95vh] flex flex-col`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>{step === "form" ? "Bank Transfer" : "Transfer Complete"}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {step === "form" ? (
          <>
            <div className="space-y-6 flex-1 overflow-y-auto px-4">
              {/* Transfer Date */}
              <div className="pt-4">
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

              {/* Separator */}
              <div className="border-b" />

              {/* Transfer sections container */}
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-8">
                {/* Source Property and Account */}
                <div className="space-y-4">
                  <Label className="text-base text-muted-foreground font-semibold">Transfer from:</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Source Property <span className="text-destructive">*</span>
                      </Label>
                      <Select value={sourceProperty} onValueChange={setSourceProperty}>
                        <SelectTrigger className="h-[42px] bg-background w-full">
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

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Unit</Label>
                      <Select 
                        value={sourceUnit} 
                        onValueChange={setSourceUnit}
                        disabled={!sourceProperty}
                      >
                        <SelectTrigger className="h-[42px] bg-background w-full">
                          <SelectValue placeholder={sourceProperty ? "Select unit" : "Select property first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr,1fr] gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Source Account <span className="text-destructive">*</span>
                      </Label>
                      <Select value={sourceAccount} onValueChange={setSourceAccount}>
                        <SelectTrigger className="h-[42px] bg-background w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts
                            .filter(account => 
                              !sourceProperty || 
                              account.property_balance?.some(pb => pb.property_id === sourceProperty)
                            )
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{account.account_name}</span>
                                </div>
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Account Balance</Label>
                      <div className="h-[42px] flex items-center bg-background rounded-md border px-3 w-full">
                        <div className="text-sm">
                          ${getAccountBalance()?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="flex items-center justify-center mt-8">
                  <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                </div>

                {/* Receiving Property and Account */}
                <div className="space-y-4">
                  <Label className="text-base text-muted-foreground font-semibold">Transfer to:</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Receiving Property <span className="text-destructive">*</span>
                      </Label>
                      <Select value={receivingProperty} onValueChange={setReceivingProperty}>
                        <SelectTrigger className="h-[42px] bg-background w-full">
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

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Unit</Label>
                      <Select 
                        value={receivingUnit} 
                        onValueChange={setReceivingUnit}
                        disabled={!receivingProperty}
                      >
                        <SelectTrigger className="h-[42px] bg-background w-full">
                          <SelectValue placeholder={receivingProperty ? "Select unit" : "Select property first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {receivingUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr,1fr] gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Receiving Account <span className="text-destructive">*</span>
                      </Label>
                      <Select value={receivingAccount} onValueChange={setReceivingAccount}>
                        <SelectTrigger className="h-[42px] bg-background w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts
                            .filter(account => 
                              !receivingProperty || 
                              account.property_balance?.some(pb => pb.property_id === receivingProperty)
                            )
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.account_name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Account Balance</Label>
                      <div className="h-[42px] flex items-center bg-background rounded-md border px-3 w-full">
                        <div className="text-sm">
                          ${getReceivingAccountBalance()?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-b" />

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Amount to Transfer <span className="text-destructive">*</span>
                </Label>
                <div className="relative w-[300px]">
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="peer ps-6 bg-background h-[42px]"
                  />
                  <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm peer-disabled:opacity-50">
                    $
                  </span>
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
            </div>

            <DialogFooter className="mt-2 border-t pt-4 px-6">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  Ref: <span className="font-medium">{reference}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <div className="divide-primary-foreground/30 inline-flex divide-x rounded-lg shadow-xs rtl:space-x-reverse">
                    <Button 
                      onClick={handleSave} 
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
                          <DropdownMenuRadioItem value="save" onClick={handleSave}>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">Save</span>
                              <span className="text-muted-foreground text-xs">Save and close this transfer</span>
                            </div>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="save_and_new" onClick={async () => {
                            await handleSave();
                            resetForm();
                          }}>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">Save and New</span>
                              <span className="text-muted-foreground text-xs">Save and create another transfer</span>
                            </div>
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col gap-4 py-4 px-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center relative">
                <ArrowLeftRight className="h-12 w-12 text-primary" />
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5">
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <div className="text-4xl font-semibold">
                ${parseFloat(amount || "0").toFixed(2)}
              </div>
              <div className="w-full bg-background rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">From</div>
                  <div className="text-sm font-medium">
                    {properties.find(p => p.id === sourceProperty)?.name || ""}
                    {sourceUnit && sourceUnits.find(u => u.id === sourceUnit)?.unit_name && ` - ${sourceUnits.find(u => u.id === sourceUnit)?.unit_name}`}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">To</div>
                  <div className="text-sm font-medium">
                    {properties.find(p => p.id === receivingProperty)?.name || ""}
                    {receivingUnit && receivingUnits.find(u => u.id === receivingUnit)?.unit_name && ` - ${receivingUnits.find(u => u.id === receivingUnit)?.unit_name}`}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">Transfer Date</div>
                  <div className="text-sm font-medium">
                    {transferDate ? format(transferDate, "MMM d, yyyy") : ""}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 