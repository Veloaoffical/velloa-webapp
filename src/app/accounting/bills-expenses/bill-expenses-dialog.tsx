"use client"

import { useState, useId, useEffect, useCallback } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { FileText, X, Plus, CheckIcon, ChevronDownIcon, Check, CreditCard, ExternalLink } from "lucide-react"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

interface Bill {
  id: string
  people_id: string
  bill_date?: string
  due_date?: string
  charge_type: string
  charge_amount: {
    total_amount: number
    lines?: Array<{
      property_id?: string
      unit_id?: string
      category_id?: string
      category?: string
      description?: string
      amount?: number
      category_info?: {
        account_name: string
      }
    }>
  }
  amount_remaining?: {
    total_amount: number
    lines?: Array<{
      category_info?: {
        account_name: string
      }
    }>
  }
  memo?: string
  reference?: string
  status?: string
  frequency?: string
  start_date?: string
  end_date?: string
  repeat_infinite?: boolean
}

interface BillLine {
  property: string
  unit: string
  category: string
  description: string
  amount: string
}

interface VendorBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedBill?: Bill
}

interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  company?: string
  service_address?: {
    type: 'all' | 'specific'
    property_ids?: string[]
  }
}

interface Property {
  id: string
  name: string
  address?: string
}

interface Unit {
  id: string
  unit_number: string
  property_id: string
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

interface BillResponse {
  id: string
  error?: string
}

interface MemoNode {
  children?: Array<{
    children?: Array<unknown>
    text?: string
  }>
  direction: null | string
  format: string
  indent: number
  type: string
  version: number
}

interface MemoState {
  root: MemoNode
}

function Placeholder() {
  return (
    <div className="absolute top-[25px] left-4 text-muted-foreground pointer-events-none select-none">
      Enter additional notes or details about this bill
    </div>
  );
}

function MemoEditor({ initialValue, onChange }: { initialValue: string, onChange: (value: string) => void }) {
  const initialConfig = {
    namespace: 'VendorBillEditor',
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
    editorState: null,
  };

  useEffect(() => {
    try {
      const parsedState = JSON.parse(initialValue);
      if (parsedState?.root) {
        onChange(initialValue);
      }
    } catch (e) {
      console.error('Failed to parse editor state:', e);
    }
  }, [initialValue, onChange]);

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

export function VendorBillDialog({ open, onOpenChange, selectedBill }: VendorBillDialogProps) {
  const vendorSelectId = useId();
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return nanoid()
  }

  const [selectedVendor, setSelectedVendor] = useState<string>("")
  const [billDate, setBillDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [lines, setLines] = useState<BillLine[]>([
    { property: "", unit: "", category: "", description: "", amount: "" }
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
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<ChargeCategory[]>([])
  const [reference, setReference] = useState<string>(generateReference())
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false)
  const [vendorSearchQuery, setVendorSearchQuery] = useState("")
  const [step, setStep] = useState<"form" | "confirmation">("form")
  const [billType, setBillType] = useState<"one-time" | "recurring">("one-time")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [frequency, setFrequency] = useState<string>("monthly")
  const [repeatForever, setRepeatForever] = useState<boolean>(false)

  // Load vendors and properties when dialog opens
  useEffect(() => {
    if (open) {
      loadVendors();
      loadProperties();
      loadCategories();
    }
  }, [open]);

  // Fetch units when property changes
  useEffect(() => {
    const selectedProperty = lines[0]?.property;
    const fetchUnits = async () => {
      try {
        if (!selectedProperty) {
          setUnits([]);
          return;
        }

        console.log(`Fetching units for property ${selectedProperty}...`);
        const response = await fetch(`/api/property/${selectedProperty}/units`);
        
        if (!response.ok) {
          console.warn(`Failed to load units: ${response.status} ${response.statusText}`);
          setUnits([]);
          return;
        }
        
        const unitsData = await response.json();
        console.log(`Loaded ${unitsData.length} units for property ${selectedProperty}:`, unitsData);
        setUnits(unitsData);
      } catch (error) {
        console.error("Error loading units:", error);
        setUnits([]);
      }
    };

    fetchUnits();
  }, [lines]);

  // Function to load vendors
  const loadVendors = async () => {
    try {
      setIsLoading(true);
      console.log('Loading vendors from API...');
      
      // Fetch people from general API endpoint
      const response = await fetch(`/api/people`);
      
      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Unknown error' };
        }
        
        console.error('People API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Your session may have expired');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found. Please check your routing configuration.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later or contact support.');
        }
        
        throw new Error(errorData.error || `Failed to fetch people: ${response.status} ${response.statusText}`);
      }
      
      let peopleData;
      try {
        peopleData = await response.json();
      } catch {
        console.error('Error parsing people data JSON');
        throw new Error('Failed to parse people data from server');
      }
      
      if (!Array.isArray(peopleData)) {
        console.error('Invalid people data format:', peopleData);
        throw new Error('Received invalid people data format from server');
      }
      
      // Filter for vendors only and map to our interface
      const vendorsData = peopleData.filter(person => person.role === 'vendor').map(vendor => {
        // Create a display name from company or first/last name
        let name = '';
        if (vendor.name) {
          name = vendor.name;
        } else if (vendor.name) {
          name = vendor.name;
        } else {
          name = `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim();
        }
        
        // If name is still empty, use "Unnamed Vendor"
        if (!name) {
          name = "Unnamed Vendor";
        }

        // Parse service_address if it exists
        let serviceAddress;
        if (vendor.service_address) {
          serviceAddress = typeof vendor.service_address === 'string' 
            ? JSON.parse(vendor.service_address) 
            : vendor.service_address;
        }

        return {
          id: vendor.id,
          name: name,
          email: vendor.email || undefined,
          phone: vendor.phone || undefined,
          address: vendor.address || undefined,
          company: vendor.company || undefined,
          service_address: serviceAddress
        };
      });
      
      console.log(`Successfully loaded ${vendorsData.length} vendors`);
      setVendors(vendorsData);
    } catch (error) {
      console.error("Error loading vendors:", error);
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        toast.error("Session expired. Please refresh the page to log in again.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to load vendors. Please try again later.");
      }
      
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load properties
  const loadProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading properties from API...');
      
      // Get the selected vendor first
      const selectedVendorObj = vendors.find((vendor) => vendor.id === selectedVendor);
      console.log('Selected vendor:', selectedVendorObj);
      
      if (!selectedVendorObj) {
        console.log('No vendor selected, skipping property load');
        setProperties([]);
        return;
      }

      // Check if vendor has service_address configured
      if (!selectedVendorObj.service_address) {
        console.log('No service_address configured for vendor');
        setProperties([]);
        setIsLoading(false);
        return;
      }

      // Check if vendor has any properties assigned when type is specific
      if (selectedVendorObj.service_address.type === 'specific' && 
          (!selectedVendorObj.service_address.property_ids || 
           selectedVendorObj.service_address.property_ids.length === 0)) {
        console.log('Vendor has no properties assigned');
        setProperties([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/property");
      const responseData = await response.text(); // Get response as text first
      
      if (!response.ok) {
        let errorData = { error: 'Unknown error' };
        
        try {
          // Try to parse the error response
          errorData = JSON.parse(responseData);
        } catch {
          // If parsing fails, keep the default error
        }
        
        console.error('Property API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Your session may have expired');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found. Please check your routing configuration.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later or contact support.');
        }
        
        throw new Error(errorData.error || `Failed to fetch properties: ${response.status} ${response.statusText}`);
      }
      
      // Parse the successful response
      let propertiesData;
      try {
        propertiesData = JSON.parse(responseData);
      } catch (parseError) {
        console.error('Error parsing properties data JSON:', parseError);
        throw new Error('Failed to parse properties data from server');
      }
      
      if (!Array.isArray(propertiesData)) {
        console.error('Invalid properties data format:', propertiesData);
        throw new Error('Received invalid properties data format from server');
      }
      
      // Filter properties based on vendor's service_address
      console.log('Vendor service_address:', selectedVendorObj.service_address);
      
      if (selectedVendorObj.service_address.type === 'specific') {
        console.log('Filtering for specific properties:', selectedVendorObj.service_address.property_ids);
        propertiesData = propertiesData.filter(property => 
          selectedVendorObj.service_address?.property_ids?.includes(property.id)
        );
      } else {
        console.log('Vendor has access to all properties');
      }
      
      console.log(`Filtered to ${propertiesData.length} properties for vendor`);
      setProperties(propertiesData);
      
    } catch (error) {
      console.error("Error loading properties:", error);
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        toast.error("Session expired. Please refresh the page to log in again.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to load properties. Please try again later.");
      }
      
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendor, vendors]);

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
      toast.error("Failed to load expense categories");
    }
  };

  // Filter vendors based on search query
  const filteredVendors = vendorSearchQuery === ""
    ? vendors
    : vendors.filter((vendor) => {
        const searchableText = vendor.name.toLowerCase()
        return searchableText.includes(vendorSearchQuery.toLowerCase())
      })

  // Get the selected vendor display text
  const getSelectedVendorText = () => {
    const selectedVendorObj = vendors.find((vendor) => vendor.id === selectedVendor);
    if (!selectedVendorObj) return "Select vendor";
    
    return selectedVendorObj.name;
  }

  // Update useEffect to handle selectedBill
  useEffect(() => {
    if (selectedBill && open) {
      // Populate form with selected bill data
      setSelectedVendor(selectedBill.people_id || "")
      setBillDate(selectedBill.bill_date ? new Date(selectedBill.bill_date) : undefined)
      setDueDate(selectedBill.due_date ? new Date(selectedBill.due_date) : undefined)
      
      // Set bill type and recurring info if available
      if (selectedBill.frequency) {
        setBillType("recurring")
        setFrequency(selectedBill.frequency)
        setStartDate(selectedBill.start_date ? new Date(selectedBill.start_date) : undefined)
        setEndDate(selectedBill.end_date ? new Date(selectedBill.end_date) : undefined)
        setRepeatForever(selectedBill.repeat_infinite || false)
      } else {
        setBillType("one-time")
      }

      // Set lines
      if (selectedBill.charge_amount?.lines) {
        const formattedLines = selectedBill.charge_amount.lines.map((line) => ({
          property: line.property_id || "",
          unit: line.unit_id || "",
          category: line.category_id || line.category || "",
          description: line.description || "",
          amount: line.amount?.toString() || "0"
        }))
        setLines(formattedLines)
      }

      // Set memo if available and not empty
      if (selectedBill.memo) {
        try {
          const parsedMemo = JSON.parse(selectedBill.memo) as MemoState;
          // Check if memo has actual content
          const hasContent = parsedMemo?.root?.children?.some((child) => 
            (child.children?.length ?? 0) > 0 || (child.text?.length ?? 0) > 0
          );
          
          if (hasContent) {
            setMemo(selectedBill.memo);
            setShowMemo(true);
          } else {
            setMemo(emptyEditorState);
            setShowMemo(false);
          }
        } catch {
          // If not valid JSON, set empty state and hide
          setMemo(emptyEditorState);
          setShowMemo(false);
        }
      } else {
        setMemo(emptyEditorState);
        setShowMemo(false);
      }

      // Set reference
      if (selectedBill.reference) {
        setReference(selectedBill.reference)
      }
    }
  }, [selectedBill, open, emptyEditorState])

  // Update useEffect to include loadProperties in dependencies
  useEffect(() => {
    if (selectedVendor) {
      loadProperties();
    }
  }, [selectedVendor, loadProperties]);

  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Validate required fields
      if (!selectedVendor) {
        toast.error("Please select a vendor")
        setIsLoading(false)
        return
      }

      if (!billDate) {
        toast.error("Please select a bill date")
        setIsLoading(false)
        return
      }

      if (billType === "one-time") {
        if (!dueDate) {
          toast.error("Please select a due date")
          setIsLoading(false)
          return
        }
      } else {
        // Recurring bill validation
        if (!startDate) {
          toast.error("Please select a start date")
          setIsLoading(false)
          return
        }
        
        if (!repeatForever && !endDate) {
          toast.error("Please select an end date or check 'Repeat forever'")
          setIsLoading(false)
          return
        }
      }

      if (!lines[0].property) {
        toast.error("Please select a property")
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

      // Verify that we have valid vendor data
      const selectedVendorObj = vendors.find((vendor) => vendor.id === selectedVendor);
      if (!selectedVendorObj) {
        toast.error("Invalid vendor selection. Please try selecting the vendor again.")
        setIsLoading(false)
        return
      }

      // Prepare the payload
      const billData = {
        people_id: selectedVendor,
        bill_date: billDate ? format(billDate, "yyyy-MM-dd") : null,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        lines: lines.map(line => ({
          description: line.description || '',
          amount: parseFloat(line.amount) || 0,
          category_id: line.category,
          property_id: line.property || null,
          unit_id: line.unit ? line.unit : null
        })),
        memo: memo && memo !== emptyEditorState ? memo : null,
        reference: reference,
        status: selectedBill?.status || "unpaid",
        ...(billType === "recurring" ? {
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
          frequency: frequency,
          repeat_infinite: repeatForever
        } : {})
      }

      // Determine if this is an update or create
      const url = selectedBill 
        ? `/api/accounting/bills/${selectedBill.id}` 
        : "/api/accounting/bills"
      
      const method = selectedBill ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      })

      console.log("Response status:", response.status);

      let responseData: BillResponse | null = null;
      
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error('Bill creation error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        })
        
        const errorMessage = responseData && typeof responseData.error === 'string' 
          ? responseData.error 
          : `Failed to create bill: ${response.status} ${response.statusText}`;
        
        throw new Error(errorMessage);
      }

      const billId = responseData?.id;

      if (!billId) {
        throw new Error("Failed to get bill ID from response")
      }

      // Handle file uploads if any
      if (uploadedFiles.length > 0) {
        try {
          const formData = new FormData()
          uploadedFiles.forEach(file => {
            formData.append('files', file)
          })
          
          const fileResponse = await fetch(`/api/accounting/bills/${billId}/attachments`, {
            method: "POST",
            body: formData
          })
          
          if (!fileResponse.ok) {
            toast.warning("Bill created but file upload failed")
          }
        } catch (fileError) {
          console.error("File upload error:", fileError)
          toast.warning("Bill created but file upload failed")
        }
      }

      toast.success(selectedBill ? "Bill updated successfully" : "Bill created successfully")
      setStep("confirmation")
    } catch (error) {
      console.error("Error saving bill:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save bill")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAndNew = async () => {
    try {
      await handleSave()
      // Reset form after successful save
      setSelectedVendor("")
      setBillDate(undefined)
      setDueDate(undefined)
      setLines([{ property: "", unit: "", category: "", description: "", amount: "" }])
      setMemo(emptyEditorState)
      setShowMemo(false)
      setReference(generateReference())
      setUploadedFiles([])
      setStep("form")
    } catch (error) {
      console.error("Error in save and new:", error)
    }
  }

  const handleLineChange = (index: number, field: keyof BillLine, value: string) => {
    const newLines = [...lines]
    newLines[index][field] = value
    
    // If property changes, reset unit
    if (field === 'property') {
      newLines[index].unit = ""
      // Debug: Log units for the selected property
      console.log(`Selected property: ${value}`)
      console.log(`Units for property:`, units)
    }
    
    setLines(newLines)
  }

  const handleAddLine = () => {
    setLines([...lines, { property: "", unit: "", category: "", description: "", amount: "" }])
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
    setSelectedVendor("")
    setBillDate(undefined)
    setDueDate(undefined)
    setLines([{ property: "", unit: "", category: "", description: "", amount: "" }])
    setMemo(emptyEditorState)
    setShowMemo(false)
    setReference(generateReference())
    setUploadedFiles([])
    setStep("form")
    setVendorSearchQuery("")
    setBillType("one-time")
    setStartDate(undefined)
    setEndDate(undefined)
    setFrequency("monthly")
    setRepeatForever(false)
  }

  // Component UI will go here
  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Reset the form when the dialog is closed
          resetForm()
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className={`${step === "form" ? "max-w-7xl" : "sm:max-w-md"} bg-card max-h-[95vh] flex flex-col`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold">
                {selectedBill ? "Edit Vendor Bill" : "New Vendor Bill"}
              </DialogTitle>
              {step === "form" && (
                <div className="text-sm text-muted-foreground">
                  {selectedBill ? "Edit the details of this vendor bill" : "Create the bills for money owed to vendors"}
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
            {/* Vendor Selection Row */}
            <div className="pt-4">
              <Label className="text-sm text-muted-foreground mb-2 block" htmlFor={vendorSelectId}>
                Vendor <span className="text-destructive">*</span>
              </Label>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-[42px] w-[300px]" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : (
                <Popover open={vendorSearchOpen} onOpenChange={setVendorSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id={vendorSelectId}
                      variant="outline"
                      role="combobox"
                      aria-expanded={vendorSearchOpen}
                      className="w-[300px] h-[42px] bg-background justify-between px-3 font-normal"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-muted-foreground">Loading vendors...</span>
                        </div>
                      ) : (
                        <span className={cn("truncate", !selectedVendor && "text-muted-foreground")}>
                          {getSelectedVendorText()}
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
                    className="border-input w-[300px] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput 
                        placeholder="Search vendors..." 
                        value={vendorSearchQuery}
                        onValueChange={setVendorSearchQuery}
                      />
                      <CommandList className="max-h-[300px] overflow-auto">
                        <CommandEmpty>
                          {isLoading ? "Loading vendors..." : "No vendor found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {isLoading ? (
                            // Skeleton loading for vendors
                            Array(5).fill(0).map((_, index) => (
                              <div key={index} className="p-2">
                                <Skeleton className="h-5 w-3/4 mb-1" />
                                <Skeleton className="h-4 w-1/2" />
                              </div>
                            ))
                          ) : (
                            filteredVendors.map((vendor) => (
                              <CommandItem
                                key={vendor.id}
                                value={vendor.id}
                                onSelect={(currentValue) => {
                                  setSelectedVendor(currentValue)
                                  setVendorSearchOpen(false)
                                  setVendorSearchQuery("")
                                }}
                              >
                                <div className="flex flex-col items-start">
                                  <div className="font-medium">{vendor.name}</div>
                                  {vendor.company && (
                                    <div className="text-sm text-muted-foreground">
                                      {vendor.company}
                                    </div>
                                  )}
                                </div>
                                {selectedVendor === vendor.id && <CheckIcon size={16} className="ml-auto" />}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              <div className="border-b mt-4" />
            </div>

            {/* Bill Type, Date and Due Date Row */}
            <div className="pt-4 flex flex-col gap-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-[42px] w-[200px]" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-[42px] w-[200px]" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <RadioGroup 
                      className="flex gap-4" 
                      value={billType} 
                      onValueChange={(value: "one-time" | "recurring") => setBillType(value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one-time" id="one-time" />
                        <Label htmlFor="one-time" className="cursor-pointer">One-time Bill</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recurring" id="recurring" />
                        <Label htmlFor="recurring" className="cursor-pointer">Recurring Bill</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-[200px]">
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Bill Date <span className="text-destructive">*</span>
                      </Label>
                      <CalendarInput
                        value={billDate}
                        onChange={setBillDate}
                        className="w-full h-[42px]"
                        placeholder="Select bill date"
                      />
                    </div>

                    {billType === "one-time" ? (
                      <div className="w-[200px] ml-4">
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
                    ) : (
                      <div className="flex items-start gap-4 ml-4">
                        <div className="w-[180px]">
                          <Label className="text-sm text-muted-foreground mb-2 block">
                            Start date <span className="text-destructive">*</span>
                          </Label>
                          <CalendarInput
                            value={startDate}
                            onChange={setStartDate}
                            className="w-full h-[42px]"
                            placeholder="Select start date"
                          />
                        </div>
                        <div className="w-[180px]">
                          <Label className="text-sm text-muted-foreground mb-2 block">
                            End date
                          </Label>
                          <CalendarInput
                            value={endDate}
                            onChange={setEndDate}
                            className="w-full h-[42px]"
                            placeholder="Select end date"
                            disabled={repeatForever}
                          />
                        </div>
                        <div className="w-[180px]">
                          <Label className="text-sm text-muted-foreground mb-2 block">
                            Frequency
                          </Label>
                          <Select
                            value={frequency}
                            onValueChange={setFrequency}
                          >
                            <SelectTrigger className="bg-background h-[42px]">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="semiannually">Semi-annually</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end h-[42px] ml-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="repeat-forever" 
                              checked={repeatForever} 
                              onCheckedChange={(checked) => {
                                if (checked === true) {
                                  setEndDate(undefined);
                                }
                                setRepeatForever(checked === true);
                              }}
                            />
                            <Label htmlFor="repeat-forever" className="cursor-pointer">Repeat forever</Label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="border-b" />

            {/* Bill Lines Table */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Property <span className="text-destructive">*</span></TableHead>
                    <TableHead>Unit</TableHead>
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
                        {isLoading ? (
                          <Skeleton className="h-[42px] w-full" />
                        ) : (
                          <Select
                            value={line.property}
                            onValueChange={(value) => handleLineChange(index, "property", value)}
                            disabled={!selectedVendor}
                          >
                            <SelectTrigger className={`bg-background h-[42px] ${!line.property ? 'text-muted-foreground' : ''}`}>
                              <SelectValue placeholder={selectedVendor ? "Select property" : "Select a vendor first"}>
                                {line.property && properties.find(p => p.id === line.property)?.name}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {properties.length > 0 ? (
                                properties.map((property) => (
                                  <SelectItem key={property.id} value={property.id}>
                                    {property.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="py-2 px-2 text-sm text-muted-foreground">
                                  {!selectedVendor 
                                    ? "Select a vendor first" 
                                    : "No service address configured for this vendor"}
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {isLoading ? (
                          <Skeleton className="h-[42px] w-full" />
                        ) : (
                          <Select
                            value={line.unit}
                            onValueChange={(value) => handleLineChange(index, "unit", value)}
                            disabled={!line.property || units.length === 0}
                          >
                            <SelectTrigger className={`bg-background h-[42px] ${!line.unit ? 'text-muted-foreground' : ''}`}>
                              <SelectValue placeholder="Select unit">
                                {line.unit && units.find(u => u.id === line.unit)?.unit_number}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {units.length > 0 ? (
                                units.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    {unit.unit_number || 'Unnamed Unit'}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="py-2 px-2 text-sm text-muted-foreground">
                                  {line.property ? "No units available for this property" : "Select a property first"}
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {isLoading ? (
                          <Skeleton className="h-[42px] w-full" />
                        ) : (
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
                                  .filter(category => category.account_type === "Expense")
                                  .reduce((acc, category) => {
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
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {isLoading ? (
                          <Skeleton className="h-[42px] w-full" />
                        ) : (
                          <Input
                            placeholder="Description"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, "description", e.target.value)}
                            className="bg-background h-[42px]"
                          />
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        {isLoading ? (
                          <Skeleton className="h-[42px] w-full" />
                        ) : (
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={line.amount}
                            onChange={(e) => handleLineChange(index, "amount", e.target.value)}
                            className="bg-background h-[42px]"
                          />
                        )}
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

            <DialogFooter className="mt-2 border-t pt-4 px-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Reference</div>
                    <div className="font-medium">{reference}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Balance Due</div>
                    <div className="font-medium text-xl">${getTotalAmount().toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2">
                    {selectedBill && (
                      <Button 
                        variant="destructive" 
                        onClick={async () => {
                          try {
                            setIsLoading(true)
                            const response = await fetch(`/api/accounting/bills/${selectedBill.id}`, {
                              method: 'DELETE'
                            })
                            
                            if (!response.ok) {
                              throw new Error('Failed to delete bill')
                            }
                            
                            toast.success('Bill deleted successfully')
                            onOpenChange(false)
                          } catch (error) {
                            console.error('Error deleting bill:', error)
                            toast.error('Failed to delete bill')
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isLoading}
                      className="shadow-none focus-visible:z-10"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        selectedBill ? "Update" : "Save"
                      )}
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
                <CreditCard className="h-12 w-12 text-primary" />
                <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-0.5">
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <div className="text-4xl font-semibold">
                ${getTotalAmount().toFixed(2)}
              </div>
              <div className="w-full bg-background rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">Vendor</div>
                  <div className="text-sm">
                    {selectedVendor && vendors.find(vendor => vendor.id === selectedVendor)?.name}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm">Due Date</div>
                  <div className="text-sm">{dueDate ? format(dueDate, "MMM d, yyyy") : ""}</div>
                </div>
              </div>
              <Button variant="link" className="text-primary w-full flex items-center justify-between">
                View vendor bills
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
           
            <Button 
              onClick={handleSaveAndNew}
              className="w-full"
            >
              Create Another Bill
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