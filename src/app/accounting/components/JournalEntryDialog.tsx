"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, FileText, X, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
  const [frequency, setFrequency] = useState<string>("monthly")
  const [repeatForever, setRepeatForever] = useState(false)
  const [lines, setLines] = useState<JournalEntryLine[]>([
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
        if (!response.ok) throw new Error("Failed to fetch units")
        const data = await response.json()
        setUnits(data)
      } catch (error) {
        console.error("Error fetching units:", error)
        toast.error("Failed to load units")
      }
    }

    fetchUnits()
  }, [property])

  const handleAddLine = () => {
    setLines([...lines, { category: "", unit: "", description: "", debits: "", credits: "" }])
  }

  const handleDeleteLine = (index: number) => {
    if (lines.length > 1) {
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
            <Select value={property} onValueChange={handlePropertyChange}>
              <SelectTrigger className="w-[300px] bg-background">
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
          {entryType === "one_time" ? (
            <div className="animate-in fade-in duration-200">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[300px] justify-start text-left font-normal bg-background",
                      !entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entryDate ? format(entryDate, "PPP") : "Select entry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={entryDate}
                    onSelect={setEntryDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex gap-4">
                {/* Start Date */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Start date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal bg-background",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">End date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal bg-background",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={repeatForever}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Frequency */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="w-[200px] bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="repeat-forever"
                  checked={repeatForever}
                  onChange={(e) => {
                    setRepeatForever(e.target.checked)
                    if (e.target.checked) {
                      setEndDate(undefined)
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="repeat-forever" className="text-sm">Repeat forever</Label>
              </div>
            </div>
          )}

          <div className="border-b" />

          {/* Journal Entry Lines */}
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr,1fr,2fr,1fr,1fr,auto] gap-4 px-4 pb-2 border-b">
              <Label className="text-sm font-medium">Category</Label>
              <Label className="text-sm font-medium">Unit</Label>
              <Label className="text-sm font-medium">Description</Label>
              <Label className="text-sm font-medium">Debits</Label>
              <Label className="text-sm font-medium">Credits</Label>
              <div className="w-10" />
            </div>

            {lines.map((line, index) => (
              <div key={index} className="p-2 border-b">
                <div className="grid grid-cols-[1fr,1fr,2fr,1fr,1fr,auto] gap-4">
                  <Select value={line.category} onValueChange={(value) => handleLineChange(index, "category", value)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={line.unit} 
                    onValueChange={(value) => handleLineChange(index, "unit", value)}
                    disabled={!property}
                  >
                    <SelectTrigger className="bg-background">
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

                  <Input
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => handleLineChange(index, "description", e.target.value)}
                    className="bg-background"
                  />

                  <Input
                    type="number"
                    placeholder="0.00"
                    value={line.debits}
                    onChange={(e) => handleLineChange(index, "debits", e.target.value)}
                    className="bg-background"
                  />

                  <Input
                    type="number"
                    placeholder="0.00"
                    value={line.credits}
                    onChange={(e) => handleLineChange(index, "credits", e.target.value)}
                    className="bg-background"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteLine(index)}
                    disabled={lines.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="link" onClick={handleAddLine} className="text-primary flex items-center gap-2">
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
            {showMemo && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <MemoEditor 
                  initialValue={memo} 
                  onChange={(value) => setMemo(value)} 
                />
              </div>
            )}
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