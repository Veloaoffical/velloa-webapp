"use client"

import { useState, useId, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { FileText, X, Plus, CheckIcon, ChevronDownIcon, Check, CreditCard, ChevronDown, ExternalLink } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface IssueCreditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Lease {
  id: string
  tenant_name: string
  unit_name: string
  property_name: string
  property?: {
    name: string
    address: string
  }
  unit?: {
    unit_number: string
  }
  tenant?: {
    first_name: string
    last_name: string
  }
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

interface CreditLine {
  category: string
  description: string
  amount: string
}

interface CreditResponse {
  id: string;
  success?: boolean;
  error?: string;
}

function Placeholder() {
  return (
    <div className="absolute top-[25px] left-4 text-muted-foreground pointer-events-none select-none">
      Enter additional notes or details about this credit
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

export function IssueCreditDialog({ open, onOpenChange }: IssueCreditDialogProps) {
  const leaseSelectId = useId();
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return nanoid()
  }

  const [selectedLease, setSelectedLease] = useState<string>("")
  const [dueDate, setDueDate] = useState<Date>()
  const [lines, setLines] = useState<CreditLine[]>([
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
  const [shareWithTenants, setShareWithTenants] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [leaseSearchOpen, setLeaseSearchOpen] = useState(false)
  const [leaseSearchQuery, setLeaseSearchQuery] = useState("")
  const [step, setStep] = useState<"form" | "confirmation">("form")

  // Load leases when dialog opens
  useEffect(() => {
    if (open) {
      loadLeases();
      loadCategories();
    }
  }, [open]);

  // Function to load leases using the API
  const loadLeases = async () => {
    try {
      setIsLoading(true);
      console.log('Loading leases from API...');
      
      // Fetch leases from our new API endpoint
      const response = await fetch(`/api/accounting/lease-contracts`);
      
      // Try to parse the error response first in case of non-OK response
      let errorData = null;
      
      if (!response.ok) {
        try {
          errorData = await response.json();
        } catch {
          // If we can't parse the error response, create a default error object
          errorData = { error: 'Unknown error' };
        }
        
        console.error('Lease API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Unauthorized: Your session may have expired');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found. Please check your routing configuration.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later or contact support.');
        }
        
        throw new Error(errorData.error || `Failed to fetch leases: ${response.status} ${response.statusText}`);
      }
      
      // If response is OK, parse the JSON data
      let leasesData;
      try {
        leasesData = await response.json();
      } catch {
        console.error('Error parsing lease data JSON');
        throw new Error('Failed to parse lease data from server');
      }
      
      // Validate that we received an array
      if (!Array.isArray(leasesData)) {
        console.error('Invalid lease data format:', leasesData);
        throw new Error('Received invalid lease data format from server');
      }
      
      console.log(`Successfully loaded ${leasesData.length} leases`);
      // Log first lease to see format
      if (leasesData.length > 0) {
        console.log('Sample lease format:', JSON.stringify(leasesData[0], null, 2));
      }
      
      setLeases(leasesData);
    } catch (error) {
      console.error("Error loading leases:", error);
      
      // Check if it's an unauthorized error
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        toast.error("Session expired. Please refresh the page to log in again.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to load leases. Please try again later.");
      }
      
      // Set empty array instead of using mock data
      setLeases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load categories
  const loadCategories = async () => {
    try {
      const response = await fetch("/api/accounting/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        throw new Error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load charge categories");
    }
  };

  // Filter leases based on search query
  const filteredLeases = leaseSearchQuery === ""
    ? leases
    : leases.filter((lease) => {
        const searchableText = `${lease.tenant_name} ${lease.property_name} ${lease.unit_name}`.toLowerCase()
        return searchableText.includes(leaseSearchQuery.toLowerCase())
      })

  // Get the selected lease display text
  const getSelectedLeaseText = () => {
    const selectedLeaseObj = leases.find((lease) => lease.id === selectedLease);
    if (!selectedLeaseObj) return "Select lease";
    
    return `${selectedLeaseObj.tenant_name} - ${selectedLeaseObj.property_name} (${selectedLeaseObj.unit_name})`;
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

      if (!dueDate) {
        toast.error("Please select a due date")
        setIsLoading(false)
        return
      }

      if (!lines[0].category) {
        toast.error("Please select a category")
        setIsLoading(false)
        return
      }

      if (!lines[0].amount || parseFloat(lines[0].amount) <= 0) {
        toast.error("Please enter a valid amount")
        setIsLoading(false)
        return
      }

      // Verify that we have valid lease data
      const selectedLeaseObj = leases.find((lease) => lease.id === selectedLease);
      if (!selectedLeaseObj) {
        toast.error("Invalid lease selection. Please try selecting the lease again.")
        setIsLoading(false)
        return
      }

      // Format the lines data according to the required structure
      const formattedLines = lines.map(line => ({
        category_id: line.category,
        description: line.description || '',
        amount: parseFloat(line.amount) || 0
      }))

      // Prepare the payload
      const creditData = {
        lease_id: selectedLease,
        due_date: format(dueDate, "yyyy-MM-dd"),
        lines: formattedLines,
        memo: memo && memo !== emptyEditorState ? memo : null,
        reference: reference,
        share_with_tenants: shareWithTenants,
        total_amount: getTotalAmount(),
        charge_type: 'credit'
      }

      console.log("Submitting credit with lease_id:", selectedLease);
      console.log("Credit data:", JSON.stringify(creditData, null, 2));

      // Save the credit using the charges endpoint with credit type
      const response = await fetch("/api/accounting/issue-credit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(creditData),
      })

      let responseData: CreditResponse | null = null;
      
      try {
        // Read the response data once and store it
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error('Credit creation error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        })
        
        // Handle specific errors
        if (responseData?.error?.includes("lease")) {
          throw new Error("Failed to get lease data. Please check if the lease still exists.");
        } else if (responseData?.error?.includes("account")) {
          throw new Error("Failed to process credit. Please check if all required accounts are configured.");
        }
        
        // Get error message safely
        const errorMessage = responseData && typeof responseData.error === 'string' 
          ? responseData.error 
          : `Failed to create credit: ${response.status} ${response.statusText}`;
        
        throw new Error(errorMessage);
      }

      // Use the already parsed response data
      const creditId = responseData?.id;

      if (!creditId) {
        throw new Error("Failed to get credit ID from response")
      }

      // Handle file uploads if any
      if (uploadedFiles.length > 0) {
        try {
          const formData = new FormData()
          uploadedFiles.forEach(file => {
            formData.append('files', file)
          })
          
          const fileResponse = await fetch(`/api/accounting/issue-credit/${creditId}/attachments`, {
            method: "POST",
            body: formData
          })
          
          if (!fileResponse.ok) {
            toast.warning("Credit created but file upload failed")
          }
        } catch (fileError) {
          console.error("File upload error:", fileError)
          toast.warning("Credit created but file upload failed")
        }
      }

      toast.success("Credit created successfully")
      setStep("confirmation")
    } catch (error) {
      console.error("Error saving credit:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create credit")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAndNew = async () => {
    try {
      await handleSave()
      // Reset form after successful save
      setSelectedLease("")
      setDueDate(undefined)
      setLines([{ category: "", description: "", amount: "" }])
      setMemo(emptyEditorState)
      setShowMemo(false)
      setReference(generateReference())
      setShareWithTenants(false)
      setUploadedFiles([])
      setStep("form")
    } catch (error) {
      console.error("Error in save and new:", error)
    }
  }

  const handleLineChange = (index: number, field: keyof CreditLine, value: string) => {
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

  // Function to reset the form to its initial state
  const resetForm = () => {
    setSelectedLease("")
    setDueDate(undefined)
    setLines([{ category: "", description: "", amount: "" }])
    setMemo(emptyEditorState)
    setShowMemo(false)
    setReference(generateReference())
    setShareWithTenants(false)
    setUploadedFiles([])
    setStep("form")
    setLeaseSearchQuery("")
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Reset the form when the dialog is closed
          resetForm()
        }
        onOpenChange(newOpen)
        resetForm()
      }}
    >
      <DialogContent className={`${step === "form" ? "max-w-7xl" : "sm:max-w-md"} bg-card max-h-[95vh] flex flex-col`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold">{step === "form" ? "Issue Credit" : "Credit Issued"}</DialogTitle>
              {step === "form" && (
                <div className="text-sm text-muted-foreground">
                  Issue credits to your tenants
                 
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
            {/* Lease Selection and Due Date Row */}
            <div className="pt-4 flex items-start gap-4">
              <div className="w-[400px]">
                <Label className="text-sm text-muted-foreground mb-2 block" htmlFor={leaseSelectId}>
                  Lease <span className="text-destructive">*</span>
                </Label>
                <Popover open={leaseSearchOpen} onOpenChange={setLeaseSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id={leaseSelectId}
                      variant="outline"
                      role="combobox"
                      aria-expanded={leaseSearchOpen}
                      className="w-full h-[42px] bg-background justify-between px-3 font-normal"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-muted-foreground">Loading leases...</span>
                        </div>
                      ) : (
                        <span className={cn("truncate", !selectedLease && "text-muted-foreground")}>
                          {getSelectedLeaseText()}
                        </span>
                      )}
                      <ChevronDownIcon
                        size={16}
                        className="text-muted-foreground/80 shrink-0"
                        aria-hidden="true"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="border-input w-[400px] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput 
                        placeholder="Search leases..." 
                        value={leaseSearchQuery}
                        onValueChange={setLeaseSearchQuery}
                      />
                      <CommandList className="max-h-[300px] overflow-auto">
                        <CommandEmpty>
                          {isLoading ? "Loading leases..." : "No lease found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {isLoading ? (
                            // Skeleton loading for leases
                            Array(5).fill(0).map((_, index) => (
                              <div key={index} className="p-2">
                                <Skeleton className="h-5 w-3/4 mb-1" />
                                <Skeleton className="h-4 w-1/2" />
                              </div>
                            ))
                          ) : (
                            filteredLeases.map((lease) => (
                              <CommandItem
                                key={lease.id}
                                value={lease.id}
                                onSelect={(currentValue) => {
                                  setSelectedLease(currentValue)
                                  setLeaseSearchOpen(false)
                                  setLeaseSearchQuery("")
                                }}
                              >
                                <div className="flex flex-col items-start">
                                  <div className="font-medium">{lease.tenant_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {lease.property_name} ({lease.unit_name})
                                  </div>
                                </div>
                                {selectedLease === lease.id && <CheckIcon size={16} className="ml-auto" />}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

            {/* Credit Lines Table */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Category <span className="text-destructive">*</span></TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Credit Amount <span className="text-destructive">*</span></TableHead>
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
                              categories
                                .filter(category => ["Revenue", "Liability"].includes(category.account_type))
                                .reduce((acc, category) => {
                                  if (!acc[category.account_type]) {
                                    acc[category.account_type] = [];
                                  }
                                  acc[category.account_type].push(category);
                                  return acc;
                                }, {} as Record<string, ChargeCategory[]>)
                            )
                            .sort(([a], [b]) => {
                              const order = ["Revenue", "Liability"];
                              return order.indexOf(a) - order.indexOf(b);
                            })
                            .map(([type, cats]) => (
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
                          placeholder="Credit description"
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
                Add Credit Line
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
                  <div className="text-sm text-muted-foreground">Ref: <span className="font-medium">{reference}</span></div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-medium text-xl">${getTotalAmount().toFixed(2)}</div>
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
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            <span>Saving...</span>
                          </div>
                        ) : (
                          "Save"
                        )}
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
                                <span className="text-muted-foreground text-xs">Save and close this credit</span>
                              </div>
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="save_and_new" onClick={handleSaveAndNew}>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">Save and New</span>
                                <span className="text-muted-foreground text-xs">Save and create another credit</span>
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
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4 px-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-24 h-24 bg-success/10 rounded-xl flex items-center justify-center relative">
                <CreditCard className="h-12 w-12 text-success" />
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5">
                  <div className="bg-success rounded-full p-1">
                    <Check className="h-4 w-4 text-success-foreground" />
                  </div>
                </div>
              </div>
              <div className="text-4xl font-semibold text-success">
                -${getTotalAmount().toFixed(2)}
              </div>
              <div className="w-full bg-background rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">Tenant</div>
                  <div className="text-sm">
                    {selectedLease && leases.find(lease => lease.id === selectedLease)?.tenant_name}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">Credit Date</div>
                  <div className="text-sm">{dueDate ? format(dueDate, "MMM d, yyyy") : ""}</div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">Reference</div>
                  <div className="text-sm font-medium">{reference}</div>
                </div>
              </div>
              <Button variant="link" className="text-primary w-full flex items-center justify-between">
                View tenant credits
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
           
            <Button 
              onClick={resetForm}
              className="w-full"
            >
              Issue Another Credit
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
        )}
      </DialogContent>
    </Dialog>
  )
} 
