"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { FileText, X, Plus } from "lucide-react"
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

interface PostChargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Lease {
  id: string
  tenant_name: string
  unit_name: string
  property_name: string
}

interface ChargeCategory {
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

interface ChargeLine {
  category: string
  description: string
  amount: string
}

function Placeholder() {
  return (
    <div className="absolute top-[25px] left-4 text-muted-foreground pointer-events-none select-none">
      Enter additional notes or details about this charge
    </div>
  );
}

function MemoEditor({ initialValue, onChange }: { initialValue: string, onChange: (value: string) => void }) {
  const initialConfig = {
    namespace: 'PostChargeEditor',
    theme: {
      ltr: 'ltr',
      rtl: 'rtl',
      paragraph: 'mb-2 last:mb-0',
      list: {
        listitem: 'ml-4',
        nested: {
          listitem: 'ml-4',
        },
      },
    },
    nodes: [ListNode, ListItemNode],
    onError: (error: Error) => {
      throw error;
    },
    editorState: initialValue,
  };

  return (
    <div className="relative min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <ToolbarPlugin />
          <div className="relative">
            <RichTextPlugin
              contentEditable={<ContentEditable className="min-h-[80px] outline-none" />}
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin
              onChange={(editorState) => {
                onChange(JSON.stringify(editorState));
              }}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function PostChargeDialog({ open, onOpenChange }: PostChargeDialogProps) {
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return nanoid()
  }

  const [selectedLease, setSelectedLease] = useState<string>("")
  const [dueDate, setDueDate] = useState<Date>()
  const [lines, setLines] = useState<ChargeLine[]>([
    { category: "", description: "", amount: "" }
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
  const [leases, setLeases] = useState<Lease[]>([])
  const [categories, setCategories] = useState<ChargeCategory[]>([])
  const [reference, setReference] = useState<string>(generateReference())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leases
        const leasesResponse = await fetch("/api/leases")
        if (leasesResponse.ok) {
          const leasesData = await leasesResponse.json()
          setLeases(leasesData)
        }

        // Fetch charge categories
        const categoriesResponse = await fetch("/api/accounting/categories")
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
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

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!selectedLease) {
        toast.error("Please select a lease")
        return
      }

      if (!dueDate) {
        toast.error("Please select a due date")
        return
      }

      if (!lines[0].amount || parseFloat(lines[0].amount) <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      // Generate a new reference before saving
      const newReference = generateReference()
      setReference(newReference)

      const response = await fetch("/api/charges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lease_id: selectedLease,
          due_date: format(dueDate, "yyyy-MM-dd"),
          category_id: lines[0].category,
          description: lines[0].description,
          amount: parseFloat(lines[0].amount),
          memo: memo || undefined,
          reference: newReference
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create charge")
      }

      toast.success("Charge created successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving charge:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create charge")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLineChange = (index: number, field: keyof ChargeLine, value: string) => {
    const newLines = [...lines]
    newLines[index][field] = value
    setLines(newLines)
  }

  const handleAddLine = () => {
    setLines([...lines, { category: "", description: "", amount: "" }])
  }

  const handleDeleteLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index)
      setLines(newLines)
    }
  }

  const getTotalAmount = () => {
    return lines.reduce((total, line) => total + (parseFloat(line.amount) || 0), 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl bg-card max-h-[95vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>Post Charge</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto px-4">
          {/* Lease Selection and Due Date Row */}
          <div className="pt-4 flex items-start gap-4">
            <div className="w-[400px]">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Select Lease <span className="text-destructive">*</span>
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
                Due Date <span className="text-destructive">*</span>
              </Label>
              <CalendarInput
                value={dueDate}
                onChange={setDueDate}
                className="w-full h-[42px]"
                placeholder="Select due date"
              />
            </div>
          </div>

          <div className="border-b" />

          {/* Charge Lines Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Category <span className="text-destructive">*</span></TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount <span className="text-destructive">*</span></TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-2">
                      <Select
                        value={line.category}
                        onValueChange={(value) => handleLineChange(index, "category", value)}
                      >
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
                            }, {} as Record<string, ChargeCategory[]>)
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

            <Button
              variant="link"
              onClick={handleAddLine}
              className="text-primary flex items-center gap-2 mt-2"
            >
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
            <div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="font-medium">${getTotalAmount().toFixed(2)}</div>
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