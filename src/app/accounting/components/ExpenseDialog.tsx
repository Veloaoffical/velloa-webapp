"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import { FileText, X, Plus, ChevronDown } from "lucide-react"
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
import { motion, AnimatePresence } from "framer-motion"
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ExpenseLine {
  category: string
  property: string
  unit: string
  description: string
  amount: string
}

interface Property {
  id: string
  name: string
}

interface AccountCategory {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_balance: number
  sub_accounts?: {
    id: string
    account_name: string
    account_subtype: string
    account_balance: number
  }[]
}

interface Unit {
  id: string
  unit_name: string
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
      Enter additional notes or details about this expense
    </div>
  );
}

function MemoEditor({ initialValue, onChange }: { initialValue: string; onChange: (value: string) => void }) {
  const initialConfig = {
    namespace: 'ExpenseMemo',
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

export function ExpenseDialog({ open, onOpenChange }: ExpenseDialogProps) {
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return nanoid()
  }

  const [payee, setPayee] = useState<string>("")
  const [expenseType, setExpenseType] = useState<"one_time" | "recurring">("one_time")
  const [expenseDate, setExpenseDate] = useState<Date>()
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [frequency, setFrequency] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [payFromAccount, setPayFromAccount] = useState<string>("")
  const [lines, setLines] = useState<ExpenseLine[]>([
    { category: "", property: "", unit: "", description: "", amount: "" }
  ])
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
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [reference, setReference] = useState<string>(generateReference())
  const [isLoading, setIsLoading] = useState(false)
  const [repeatForever, setRepeatForever] = useState(false)
  const [people, setPeople] = useState<Person[]>([])

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

        // Fetch account categories
        const categoriesResponse = await fetch("/api/accounting/categories")
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories")
        const categoriesData = await categoriesResponse.json()
        console.log("Fetched categories data structure:", JSON.stringify(categoriesData, null, 2))
        setCategories(categoriesData)   
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
    const propertyId = lines[0].property;
    const fetchUnits = async () => {
      if (!propertyId) {
        setUnits([])
        return
      }

      try {
        const response = await fetch(`/api/property/${propertyId}/units`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch units")
        }
        const data = await response.json()
        setUnits(data)
      } catch (error) {
        console.error("Error fetching units:", error)
        toast.error(error instanceof Error ? error.message : "Failed to load units")
      }
    }

    fetchUnits()
  }, [lines[0].property])

  const handleAddLine = () => {
    setLines([...lines, { category: "", property: "", unit: "", description: "", amount: "" }])
  }

  const handleDeleteLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index))
    }
  }

  const handleLineChange = (index: number, field: keyof ExpenseLine, value: string) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setLines(newLines)
  }

  const getTotalAmount = () => {
    return lines.reduce((sum, line) => {
      const amount = parseFloat(line.amount) || 0
      return sum + amount
    }, 0)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!payee) {
        toast.error("Please select a payee")
        return
      }

      if (!expenseDate) {
        toast.error("Please select an expense date")
        return
      }

      if (!paymentMethod) {
        toast.error("Please select a payment method")
        return
      }

      if (!payFromAccount) {
        toast.error("Please select a pay from account")
        return
      }

      // Validate lines
      const hasEmptyLine = lines.some(line => !line.category || !line.amount)
      if (hasEmptyLine) {
        toast.error("Please fill in all required fields in the expense lines")
        return
      }

      const response = await fetch("/api/accounting/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payee,
          expense_type: expenseType,
          expense_date: format(expenseDate, "yyyy-MM-dd"),
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          end_date: !repeatForever && endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          frequency,
          repeat_forever: expenseType === "recurring" ? repeatForever : undefined,
          payment_method: paymentMethod,
          pay_from_account: payFromAccount,
          lines,
          memo: memo || undefined,
          reference
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create expense")
      }

      toast.success("Expense created successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving expense:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create expense")
    } finally {
      setIsLoading(false)
    }
  }

  const getAccountBalance = () => {
    if (!payFromAccount) {
      console.log("No account selected");
      return null;
    }
    
    console.log("Looking for account balance for ID:", payFromAccount);
    console.log("Available categories:", categories.map(cat => ({
      id: cat.id,
      name: cat.account_name,
      balance: cat.account_balance,
      sub_accounts: cat.sub_accounts?.map(sub => ({
        id: sub.id,
        name: sub.account_name,
        balance: sub.account_balance
      }))
    })));
    
    // First try to find in main categories
    const mainCategory = categories.find(cat => cat.id === payFromAccount);
    if (mainCategory) {
      console.log("Found in main categories:", mainCategory.account_name, mainCategory.account_balance);
      return mainCategory.account_balance;
    }

    // Then try to find in sub-accounts
    for (const category of categories) {
      if (category.sub_accounts) {
        const subAccount = category.sub_accounts.find(sub => sub.id === payFromAccount);
        if (subAccount) {
          console.log("Found in sub-accounts:", subAccount.account_name, subAccount.account_balance);
          return subAccount.account_balance;
        }
      }
    }

    console.log("No account found with ID:", payFromAccount);
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-card max-h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>New Expense</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-4">
          {/* Payee Selection */}
          <div className="pt-4">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Payee <span className="text-destructive">*</span>
            </Label>
            <Select value={payee} onValueChange={setPayee}>
              <SelectTrigger className="w-[300px] h-[42px] bg-background">
                <SelectValue placeholder="Select payee" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Vendors</SelectLabel>
                  {people
                    .filter(person => person.role === 'vendor')
                    .map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex flex-col">
                          <span>{`${vendor.first_name} ${vendor.last_name}`.trim()}</span>
                          <div className="flex flex-col text-xs text-muted-foreground">
                            {vendor.company && <span>{vendor.company}</span>}
                            {vendor.unit && (
                              <span>{vendor.unit.property_name} - {vendor.unit.unit_number}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectGroup>
                <SelectSeparator />
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
                          <div className="flex flex-col text-xs text-muted-foreground">
                            {owner.company && <span>{owner.company}</span>}
                            {owner.unit && (
                              <span>{owner.unit.property_name} - {owner.unit.unit_number}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="border-b" />

          {/* Expense Type */}
          <RadioGroup
            value={expenseType}
            onValueChange={(value) => setExpenseType(value as "one_time" | "recurring")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="one_time" id="one_time" />
              <Label htmlFor="one_time">One Time Expense</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recurring" id="recurring" />
              <Label htmlFor="recurring">Recurring Expense</Label>
            </div>
          </RadioGroup>

          {/* Expense Date */}
          <div className="relative h-[90px]">
            <AnimatePresence mode="wait">
              {expenseType === "one_time" ? (
                <div className="absolute w-full">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Expense date <span className="text-destructive">*</span>
                  </Label>
                  <CalendarInput
                    value={expenseDate}
                    onChange={setExpenseDate}
                    className="w-[300px] h-[42px]"
                    placeholder="Select expense date"
                  />
                </div>
              ) : (
                <motion.div
                  key="recurring"
                  className="absolute w-full"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <div className="flex gap-4">
                      {/* Start Date */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                      >
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Start date <span className="text-destructive">*</span>
                        </Label>
                        <CalendarInput
                          value={startDate}
                          onChange={setStartDate}
                          className="w-[200px] h-[42px]"
                          placeholder="Select start date"
                        />
                      </motion.div>

                      {/* End Date */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                      >
                        <Label className="text-sm text-muted-foreground mb-2 block">End date</Label>
                        <CalendarInput
                          value={endDate}
                          onChange={setEndDate}
                          className="w-[200px] h-[42px]"
                          placeholder="Select end date"
                          disabled={repeatForever}
                        />
                      </motion.div>

                      {/* Frequency */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.2 }}
                      >
                        <Label className="text-sm text-muted-foreground mb-2 block">Frequency</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger className={`w-[200px] h-[42px] bg-background ${!frequency ? 'text-muted-foreground' : ''}`}>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <Checkbox
                        id="repeatForever"
                        checked={repeatForever}
                        onCheckedChange={(checked) => setRepeatForever(checked as boolean)}
                      />
                      <Label htmlFor="repeatForever" className="text-sm text-muted-foreground">
                        Repeat Forever
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-b mt-1" />

          {/* Payment Method and Account */}
          <div className="grid grid-cols-[2fr,1fr,2fr] gap-4 items-start">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Pay From Account <span className="text-destructive">*</span>
              </Label>
              <Select value={payFromAccount} onValueChange={setPayFromAccount}>
                <SelectTrigger className="h-[42px] bg-background">
                  <SelectValue placeholder="Select account">
                    {payFromAccount && categories.reduce((name, category) => {
                      if (category.id === payFromAccount) {
                        return category.account_name;
                      }
                      if (category.sub_accounts) {
                        const subAccount = category.sub_accounts.find(sub => sub.id === payFromAccount);
                        if (subAccount) {
                          return subAccount.account_name;
                        }
                      }
                      return name;
                    }, "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(category => category.account_type === "Asset" && 
                           (category.account_subtype === "Bank" || 
                            category.sub_accounts?.some(sub => sub.account_subtype === "Bank")))
                    .map((category) => (
                      <React.Fragment key={category.id}>
                        <SelectItem value={category.id}>
                          <div className="flex flex-col">
                            <span>{category.account_name}</span>
                            <span className="text-xs text-muted-foreground">{category.account_subtype}</span>
                          </div>
                        </SelectItem>
                        {category.sub_accounts?.filter(sub => sub.account_subtype === "Bank").map((subAccount) => (
                          <SelectItem 
                            key={subAccount.id} 
                            value={subAccount.id}
                            className="pl-6"
                          >
                            <div className="flex flex-col">
                              <span>{subAccount.account_name}</span>
                              <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Account Balance
              </Label>
              <div className="h-[42px] flex items-center bg-background rounded-md border px-3">
                <div className="text-sm">
                  {(() => {
                    if (!payFromAccount) {
                      return "$0.00";
                    }
                    const balance = getAccountBalance();
                    console.log("Final balance value:", balance);
                    if (balance === null || balance === undefined) {
                      return "$0.00";
                    }
                    return `$${Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  })()}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Payment Method <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-[42px] bg-background">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>In-app</SelectLabel>
                    <SelectItem value="velloapay">Velloa Pay</SelectItem>
                    <SelectItem value="check_inapp">Check</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>External</SelectLabel>
                    <SelectItem value="bank_transfer">Bank Transfer (ACH) / EFT</SelectItem>
                    <SelectItem value="credit_card">Credit/Debit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check_external">Check</SelectItem>
                    <SelectItem value="money_order">Money Order</SelectItem>
                    <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-b" />

          {/* Expense Lines */}
          <div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Category <span className="text-destructive">*</span></TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount <span className="text-destructive">*</span></TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-2">
                      <Select value={line.category} onValueChange={(value) => handleLineChange(index, "category", value)}>
                        <SelectTrigger className={`bg-background h-[42px] ${!line.category ? 'text-muted-foreground' : ''}`}>
                          <SelectValue placeholder="Select category">
                            {line.category && categories.reduce((name, category) => {
                              if (category.id === line.category) {
                                return category.account_name;
                              }
                              if (category.sub_accounts) {
                                const subAccount = category.sub_accounts.find(sub => sub.id === line.category);
                                if (subAccount) {
                                  return subAccount.account_name;
                                }
                              }
                              return name;
                            }, "")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {categories
                            .filter(category => category.account_type === "Expense")
                            .map((category) => (
                              <React.Fragment key={category.id}>
                                <SelectItem value={category.id}>
                                  <div className="flex flex-col">
                                    <span>{category.account_name}</span>
                                    <span className="text-xs text-muted-foreground">{category.account_subtype}</span>
                                  </div>
                                </SelectItem>
                                {category.sub_accounts && category.sub_accounts.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="pl-4 text-xs">
                                      {category.account_name} Sub-accounts
                                    </SelectLabel>
                                    {category.sub_accounts.map((subAccount) => (
                                      <SelectItem 
                                        key={subAccount.id} 
                                        value={subAccount.id}
                                        className="pl-6"
                                      >
                                        <div className="flex flex-col">
                                          <span>{subAccount.account_name}</span>
                                          <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                              </React.Fragment>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select 
                        value={line.property} 
                        onValueChange={(value) => handleLineChange(index, "property", value)}
                      >
                        <SelectTrigger className={`bg-background h-[42px] ${!line.property ? 'text-muted-foreground' : ''}`}>
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
                    </TableCell>
                    <TableCell className="py-2">
                      <Select 
                        value={line.unit} 
                        onValueChange={(value) => handleLineChange(index, "unit", value)}
                        disabled={!line.property}
                      >
                        <SelectTrigger className={`bg-background h-[42px] ${!line.unit ? 'text-muted-foreground' : ''}`}>
                          <SelectValue placeholder={line.property ? "Select unit" : "Select property first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => handleLineChange(index, "description", e.target.value)}
                        className="bg-background h-[42px]"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={line.amount}
                        onChange={(e) => handleLineChange(index, "amount", e.target.value)}
                        className="bg-background h-[42px]"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteLine(index)}
                        disabled={lines.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button variant="link" onClick={handleAddLine} className="text-primary flex items-center gap-2 mt-2">
              <Plus className="h-4 w-4" />
              Add Line Item
            </Button>
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
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="font-medium">${getTotalAmount().toFixed(2)}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
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
                            <span className="text-muted-foreground text-xs">Save and close this expense</span>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="save_and_new" onClick={async () => {
                          await handleSave();
                          // Reset form after successful save
                          setPayee("");
                          setExpenseType("one_time");
                          setExpenseDate(undefined);
                          setStartDate(undefined);
                          setEndDate(undefined);
                          setFrequency("");
                          setPaymentMethod("");
                          setPayFromAccount("");
                          setLines([{ category: "", property: "", unit: "", description: "", amount: "" }]);
                          setMemo(emptyEditorState);
                          setShowMemo(false);
                          setReference(generateReference());
                        }}>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">Save and New</span>
                            <span className="text-muted-foreground text-xs">Save and create another expense</span>
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
      </DialogContent>
    </Dialog>
  )
} 