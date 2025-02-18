"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, X, Plus } from "lucide-react"
import { format } from "date-fns"
import CalendarInput from "@/components/calendarwithmonthsinput"
import { toast } from "sonner"
import { customAlphabet } from "nanoid"
import { Checkbox } from "@/components/ui/checkbox"
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

interface JournalEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface JournalEntryLine {
  category: string
  unit: string
  description: string
  debits: string
  credits: string
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
  sub_accounts?: {
    id: string
    account_name: string
    account_subtype: string
  }[]
}

interface Unit {
  id: string
  unit_name: string
}

function Placeholder() {
  return (
    <div className="absolute top-[25px] left-4 text-muted-foreground pointer-events-none select-none">
      Enter additional notes or details about this journal entry
    </div>
  );
}

function MemoEditor({ initialValue, onChange }: { initialValue: string; onChange: (value: string) => void }) {
  const initialConfig = {
    namespace: 'JournalEntryMemo',
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

export function JournalEntryDialog({ open, onOpenChange }: JournalEntryDialogProps) {
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return nanoid()
  }

  const [property, setProperty] = useState<string>("")
  const [entryType, setEntryType] = useState<"one_time" | "recurring">("one_time")
  const [entryDate, setEntryDate] = useState<Date>()
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [frequency, setFrequency] = useState<string>("")
  const [repeatForever, setRepeatForever] = useState(false)
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { category: "", unit: "", description: "", debits: "", credits: "" },
    { category: "", unit: "", description: "", debits: "", credits: "" }
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

        // Fetch account categories
        const categoriesResponse = await fetch("/api/accounting/categories")
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories")
        const categoriesData = await categoriesResponse.json()
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
    const fetchUnits = async () => {
      if (!property) {
        setUnits([])
        return
      }

      try {
        const response = await fetch(`/api/property/${property}/units`)
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
  }, [property])

  const handleAddLine = () => {
    setLines([...lines, { category: "", unit: "", description: "", debits: "", credits: "" }])
  }

  const handleDeleteLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index))
    }
  }

  const handleLineChange = (index: number, field: keyof JournalEntryLine, value: string) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setLines(newLines)
  }

  const getTotalDebits = () => {
    return lines.reduce((sum, line) => sum + (parseFloat(line.debits) || 0), 0)
  }

  const getTotalCredits = () => {
    return lines.reduce((sum, line) => sum + (parseFloat(line.credits) || 0), 0)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!property) {
        toast.error("Please select a property")
        return
      }

      if (!entryDate) {
        toast.error("Please select an entry date")
        return
      }

      // Validate lines
      const hasEmptyLine = lines.some(line => !line.category || (!line.debits && !line.credits))
      if (hasEmptyLine) {
        toast.error("Please fill in all required fields in the journal entry lines")
        return
      }

      // Validate debits and credits balance
      const totalDebits = getTotalDebits()
      const totalCredits = getTotalCredits()
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        toast.error("Debits and credits must be equal")
        return
      }

      const response = await fetch("/api/accounting/journal-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: property,
          entry_type: entryType,
          entry_date: format(entryDate, "yyyy-MM-dd"),
          lines,
          memo: memo || undefined,
          reference
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create journal entry")
      }

      toast.success("Journal entry created successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving journal entry:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create journal entry")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePropertyChange = (value: string) => {
    setProperty(value)
    // Clear unit selections when property changes
    setLines(lines.map(line => ({ ...line, unit: "" })))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-card max-h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>Journal Entry</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-4">
          {/* Property Selection */}
          <div className="pt-4">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Property <span className="text-destructive">*</span>
            </Label>
            <Select value={property} onValueChange={handlePropertyChange}>
              <SelectTrigger className="w-[300px] h-[42px] bg-background">
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

          <div className="border-b" />

          {/* Entry Type */}
          <RadioGroup
            value={entryType}
            onValueChange={(value) => setEntryType(value as "one_time" | "recurring")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="one_time" id="one_time" />
              <Label htmlFor="one_time">One Time Journal Entry</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recurring" id="recurring" />
              <Label htmlFor="recurring">Recurring Journal Entry</Label>
            </div>
          </RadioGroup>

          {/* Entry Date for One Time / Recurring Options */}
          <div className="relative h-[120px]">
            <AnimatePresence mode="wait">
              {entryType === "one_time" ? (
                <div className="absolute w-full">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Entry date <span className="text-destructive">*</span>
                  </Label>
                  <CalendarInput
                    value={entryDate}
                    onChange={setEntryDate}
                    className="w-[300px] h-[42px]"
                    placeholder="Select entry date"
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
                  <div className="space-y-4">
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

                    <motion.div
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.2 }}
                    >
                      <Checkbox
                        id="repeat-forever"
                        checked={repeatForever}
                        onCheckedChange={(checked) => {
                          setRepeatForever(checked as boolean)
                          if (checked) {
                            setEndDate(undefined)
                          }
                        }}
                        className="h-[18px] w-[18px]"
                      />
                      <Label htmlFor="repeat-forever" className="text-sm text-muted-foreground">Repeat forever</Label>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-b" />

          {/* Journal Entry Lines */}
          <div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Category <span className="text-destructive">*</span></TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Debits</TableHead>
                  <TableHead>Credits</TableHead>
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
                          {Object.entries(
                            categories.reduce((acc, category) => {
                              if (!acc[category.account_type]) {
                                acc[category.account_type] = [];
                              }
                              acc[category.account_type].push(category);
                              return acc;
                            }, {} as Record<string, AccountCategory[]>)
                          ).map(([type, cats]) => (
                            <SelectGroup key={type}>
                              <SelectLabel>{type}</SelectLabel>
                              {cats.map((category) => (
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
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select 
                        value={line.unit} 
                        onValueChange={(value) => handleLineChange(index, "unit", value)}
                        disabled={!property}
                      >
                        <SelectTrigger className={`bg-background h-[42px] ${!line.unit ? 'text-muted-foreground' : ''}`}>
                          <SelectValue placeholder={property ? "Select unit" : "Select property first"} />
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
                        value={line.debits}
                        onChange={(e) => handleLineChange(index, "debits", e.target.value)}
                        className="bg-background h-[42px]"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={line.credits}
                        onChange={(e) => handleLineChange(index, "credits", e.target.value)}
                        className="bg-background h-[42px]"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteLine(index)}
                        disabled={lines.length <= 2}
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
            <div className="flex gap-8">
              <div>
                <div className="text-sm text-muted-foreground">Total Debit</div>
                <div className="font-medium">${getTotalDebits().toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Credit</div>
                <div className="font-medium">${getTotalCredits().toFixed(2)}</div>
              </div>
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