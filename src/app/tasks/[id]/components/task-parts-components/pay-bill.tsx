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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircleIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileText as FileTextIcon,
  Upload as FileUpIcon,
  HeadphonesIcon,
  ImageIcon,
  VideoIcon,
  X as XIcon,
} from "lucide-react"
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload"

interface VendorBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultVendorId?: string
  defaultPropertyId?: string
  defaultUnitId?: string
  defaultDueDate?: string | null
  maintenanceRequestId?: string
  onBillCreated?: () => void
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
    unit_id: string;
    unit_name: string;
    property_id: string;
    id?: string; // keep optional for compatibility
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

interface BillLine {
  property: string
  unit: string
  category: string
  description: string
  amount: string
}

interface BillResponse {
  id: string
  error?: string
  details?: {
    [key: string]: {
      _errors?: string[]
    } | unknown
  }
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

export function VendorBillDialog({ open, onOpenChange, defaultVendorId, defaultPropertyId, defaultUnitId, defaultDueDate, maintenanceRequestId, onBillCreated }: VendorBillDialogProps) {
  const vendorSelectId = useId();
  const generateReference = () => {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12)
    return nanoid()
  }

  const [selectedVendor, setSelectedVendor] = useState<string>(defaultVendorId || "")
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
  const [categories, setCategories] = useState<ChargeCategory[]>([])
  const [reference, setReference] = useState<string>(generateReference())
  const [isLoading, setIsLoading] = useState(false)
  const [vendorSearchOpen, setVendorSearchOpen] = useState(false)
  const [vendorSearchQuery, setVendorSearchQuery] = useState("")
  const [step, setStep] = useState<"form" | "confirmation">("form")
  const [units, setUnits] = useState<Unit[]>([]);

  // File upload state using useFileUpload
  const maxSize = 10 * 1024 * 1024 // 10MB
  const maxFiles = 10
  const [
    { files: uploadedFiles, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: true,
    maxFiles,
    maxSize,
  })

  // Helper to convert a File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

  // Load vendors and properties when dialog opens
  useEffect(() => {
    if (open) {
      loadVendors();
      loadCategories();
    }
  }, [open]);

  // When dialog opens, prefill vendor if defaultVendorId is provided
  useEffect(() => {
    if (open && defaultVendorId) {
      setSelectedVendor(defaultVendorId);
    }
  }, [open, defaultVendorId]);

  // When dialog opens, prefill due date if defaultDueDate is provided
  useEffect(() => {
    if (open && defaultDueDate) {
      setDueDate(new Date(defaultDueDate));
    }
  }, [open, defaultDueDate]);

  // Only load properties after both vendors and selectedVendor are set
  useEffect(() => {
    if (selectedVendor && vendors.length > 0) {
      loadProperties();
    }
  }, [selectedVendor, vendors, loadProperties]);

  // When properties are loaded and defaultPropertyId is provided, set property in first line
  useEffect(() => {
    if (
      open &&
      defaultPropertyId &&
      properties.length > 0 &&
      properties.some((p) => p.id === defaultPropertyId)
    ) {
      setLines((prevLines) => {
        const newLines = [...prevLines];
        newLines[0] = {
          ...newLines[0],
          property: defaultPropertyId,
          // Reset unit if property changes
          unit: "",
        };
        return newLines;
      });
    }
  }, [open, defaultPropertyId, properties]);

  // When property and units are loaded, prefill unit in first line if defaultUnitId is provided
  const firstLineProperty = lines[0]?.property;
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        if (!firstLineProperty) {
          setUnits([]);
          return;
        }
        console.log(`Fetching units for property ${firstLineProperty}...`);
        const response = await fetch(`/api/property/${firstLineProperty}/units`);
        if (!response.ok) {
          console.warn(`Failed to load units: ${response.status} ${response.statusText}`);
          setUnits([]);
          return;
        }
        const unitsData = await response.json();
        console.log(`Loaded ${unitsData.length} units for property ${firstLineProperty}:`, unitsData);
        setUnits(unitsData);
      } catch (error) {
        console.error("Error loading units:", error);
        setUnits([]);
      }
    };
    fetchUnits();
  }, [firstLineProperty, lines]);

  // Dedicated effect to set the default unit after units are loaded
  const firstLineUnit = lines[0]?.unit;
  useEffect(() => {
    if (
      defaultUnitId &&
      units.some((u: Unit) => String(u.unit_id) === String(defaultUnitId)) &&
      firstLineUnit !== defaultUnitId
    ) {
      setLines((prevLines) => {
        const newLines = [...prevLines];
        newLines[0] = {
          ...newLines[0],
          unit: defaultUnitId,
        };
        return newLines;
      });
    }
  }, [units, defaultUnitId, firstLineUnit, lines]);

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

      if (!dueDate) {
        toast.error("Please select a due date")
        setIsLoading(false)
        return
      }

      // Validate line items
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line.property) {
          toast.error(`Please select a property for line item ${i + 1}`)
          setIsLoading(false)
          return
        }

        if (!line.category) {
          toast.error(`Please select a category for line item ${i + 1}`)
          setIsLoading(false)
          return
        }

        // Validate amount is a valid number
        const amount = parseFloat(line.amount);
        if (isNaN(amount) || amount <= 0) {
          toast.error(`Please enter a valid amount for line item ${i + 1}`)
          setIsLoading(false)
          return
        }

        // Debug: Log line item details
        console.log(`Line item ${i + 1} details:`, {
          property: line.property,
          unit: line.unit,
          category: line.category,
          description: line.description,
          amount: line.amount,
          parsedAmount: parseFloat(line.amount)
        });
      }

      // Verify that we have valid vendor data
      const selectedVendorObj = vendors.find((vendor) => vendor.id === selectedVendor);
      if (!selectedVendorObj) {
        toast.error("Invalid vendor selection. Please try selecting the vendor again.")
        setIsLoading(false)
        return
      }

      // Generate a new reference before saving
      const newReference = generateReference()
      setReference(newReference)

      // Debug: Check memo format
      console.log("Memo value:", {
        memo,
        isEmptyEditorState: memo === emptyEditorState,
        memoType: typeof memo
      });

      // Prepare the payload - ensure all dates are properly formatted
      // We've already validated that billDate exists at this point
      interface BillDataType {
        people_id: string;
        bill_date: string;
        due_date: string;
        lines: {
          description: string;
          amount: number;
          category_id: string;
          property_id: string | null;
          unit_id: string | null;
        }[];
        memo: string | null;
        reference: string;
        status: string;
        charge_type: string;
        maintenance_request_id?: string;
        files?: {
          file_url: string;
          file_name: string;
          file_type: string;
          file_size: number;
        }[];
      }

      // Prepare files array for API (convert to base64)
      const files = await Promise.all(
        uploadedFiles.map(async (file) => {
          const fileObj = file.file as File;
          const base64 = fileObj ? await fileToBase64(fileObj) : '';
          return {
            file_url: base64,
            file_name: fileObj?.name || '',
            file_type: fileObj?.type || '',
            file_size: fileObj?.size || 0,
          };
        })
      );

      const billData: BillDataType = {
        people_id: selectedVendor,
        bill_date: format(billDate!, "yyyy-MM-dd"),
        due_date: format(dueDate!, "yyyy-MM-dd"),
        lines: lines.map(line => ({
          description: line.description || '',
          amount: parseFloat(line.amount) || 0,
          category_id: line.category,
          property_id: line.property || null,
          unit_id: line.unit || null // Ensure unit_id is always a string or null, not undefined
        })),
        memo: memo && memo !== emptyEditorState ? memo : null,
        reference: newReference,
        status: "unpaid",
        charge_type: "bill",
        files: files.length > 0 ? files : undefined,
        maintenance_request_id: maintenanceRequestId
      };

      console.log("Submitting bill data:", JSON.stringify(billData, null, 2));

      // Save the bill
      const response = await fetch("/api/tasks/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries([...response.headers.entries()]));

      // Try to parse the response as JSON
      let responseData: BillResponse | null = null;
      let responseText = "";
      
      try {
        // First get the raw text for debugging
        responseText = await response.clone().text();
        console.log("Raw response:", responseText);
        
        // Then try to parse as JSON
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        console.error('Raw response text:', responseText);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error('Bill creation error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          rawResponse: responseText
        });
        
        // Log more detailed validation errors if available
        if (responseData?.details) {
          console.error('Validation details:', JSON.stringify(responseData.details, null, 2));
        }
        
        let errorMessage = 'Failed to create bill';
        
        if (responseData?.error) {
          errorMessage = responseData.error;
          
          // Extract field-specific errors
          const fieldErrors: string[] = [];
          
          // Only process details if they exist
          if (responseData.details) {
            Object.entries(responseData.details).forEach(([field, error]) => {
              if (field !== '_errors' && error && typeof error === 'object' && '_errors' in error) {
                const errors = (error as { _errors: string[] })._errors;
                if (Array.isArray(errors)) {
                  fieldErrors.push(`${field}: ${errors.join(', ')}`);
                }
              }
            });
          }
          
          if (fieldErrors.length > 0) {
            errorMessage += `: ${fieldErrors.join('; ')}`;
          }
        } else {
          errorMessage = `Failed to create bill: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const billId = responseData?.id;

      if (!billId) {
        throw new Error("Failed to get bill ID from response")
      }

      toast.success("Bill created successfully")
      if (onBillCreated) onBillCreated();
      setStep("confirmation")
    } catch (error) {
      console.error("Error saving bill:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create bill")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLineChange = (index: number, field: keyof BillLine, value: string) => {
    const newLines = [...lines];
    if (field === 'property') {
      // Only reset unit if property actually changed
      if (newLines[index].property !== value) {
        newLines[index].unit = "";
      }
    }
    newLines[index][field] = value;
    setLines(newLines);
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

  // Update resetForm to clearFiles
  const resetForm = () => {
    setSelectedVendor("")
    setBillDate(undefined)
    setDueDate(undefined)
    setLines([{ property: "", unit: "", category: "", description: "", amount: "" }])
    setMemo(emptyEditorState)
    setShowMemo(false)
    setReference(generateReference())
    clearFiles()
    setStep("form")
    setVendorSearchQuery("")
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
        resetForm()
      }}
    >
      <DialogContent className={`${step === "form" ? "max-w-7xl" : "sm:max-w-md"} bg-card max-h-[95vh] flex flex-col`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold">{step === "form" ? "New Vendor Bill" : "Bill Created"}</DialogTitle>
              {step === "form" && (
                <div className="text-sm text-muted-foreground">
                  Create the bills for money owed to vendors
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Create bills for tracking money owed to vendors.</p>
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
            {/* Vendor Selection Row */}
            <div className="pt-4">
              <Label className="text-sm text-muted-foreground mb-2 block" htmlFor={vendorSelectId}>
                Vendor <span className="text-destructive">*</span>
              </Label>
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
              <div className="border-b mt-4" />
            </div>

            {/* Bill Type, Date and Due Date Row */}
            <div className="pt-4 flex flex-col gap-4">
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
              </div>
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
                        <Select
                          value={line.property}
                          onValueChange={(value) => handleLineChange(index, "property", value)}
                          disabled={index === 0 && !!defaultPropertyId}
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
                      </TableCell>
                      <TableCell className="py-2">
                        <Select
                          value={line.unit}
                          onValueChange={(value) => handleLineChange(index, "unit", value || "")}
                          disabled={(!line.property || units.length === 0) || (index === 0 && !!defaultUnitId)}
                        >
                          <SelectTrigger className={`bg-background h-[42px] ${!line.unit ? 'text-muted-foreground' : ''}`}>
                            <SelectValue placeholder="Select unit">
                              {line.unit && units.find(u => String(u.unit_id) === String(line.unit))?.unit_name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {units.length > 0 ? (
                              units.map((unit) => (
                                <SelectItem key={unit.unit_id} value={unit.unit_id}>
                                  {unit.unit_name || 'Unnamed Unit'}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="py-2 px-2 text-sm text-muted-foreground">
                                {line.property ? "No units available for this property" : "Select a property first"}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-2">
                        <Select
                          value={line.category}
                          onValueChange={(value) => handleLineChange(index, "category", value)}
                        >
                          <SelectTrigger className={`bg-background h-[42px] ${!line.category ? 'text-muted-foreground' : ''}`}>
                            <SelectValue placeholder="Select category">
                              {line.category && (() => {
                                // Try to find the main category
                                const mainCat = categories.find(category => category.id === line.category);
                                if (mainCat) return mainCat.account_name;
                                // Try to find a sub-account
                                for (const category of categories) {
                                  if (category.sub_accounts) {
                                    const sub = category.sub_accounts.find(sub => sub.id === line.category);
                                    if (sub) return sub.account_name;
                                  }
                                }
                                return "";
                              })()}
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
                          onBlur={(e) => {
                            let value = e.target.value;
                            if (value) {
                              // Format to two decimal places
                              value = parseFloat(value).toFixed(2);
                              handleLineChange(index, "amount", value);
                            }
                          }}
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
            <div
              role="button"
              onClick={openFileDialog}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-dragging={isDragging || undefined}
              className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]"
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload files"
              />
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                  aria-hidden="true"
                >
                  <FileUpIcon className="size-4 opacity-60" />
                </div>
                <p className="mb-1.5 text-sm font-medium">Upload files</p>
                <p className="text-muted-foreground mb-2 text-xs">
                  Drag & drop or click to browse
                </p>
                <div className="text-muted-foreground/70 flex flex-wrap justify-center gap-1 text-xs">
                  <span>All files</span>
                  <span>∙</span>
                  <span>Max {maxFiles} files</span>
                  <span>∙</span>
                  <span>Up to {formatBytes(maxSize)}</span>
                </div>
              </div>
            </div>

            {errors.length > 0 && (
              <div
                className="text-destructive flex items-center gap-1 text-xs"
                role="alert"
              >
                <AlertCircleIcon className="size-3 shrink-0" />
                <span>{errors[0]}</span>
              </div>
            )}

            {/* File list */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                        {(() => {
                          const fileObj = file.file as File | undefined | null
                          const fileType = fileObj?.type || ''
                          const fileName = fileObj?.name || ''
                          if (!fileType && !fileName) return <FileIcon className="size-4 opacity-60" />
                          if (
                            fileType.includes("pdf") ||
                            fileName.endsWith(".pdf") ||
                            fileType.includes("word") ||
                            fileName.endsWith(".doc") ||
                            fileName.endsWith(".docx")
                          ) {
                            return <FileTextIcon className="size-4 opacity-60" />
                          } else if (
                            fileType.includes("zip") ||
                            fileType.includes("archive") ||
                            fileName.endsWith(".zip") ||
                            fileName.endsWith(".rar")
                          ) {
                            return <FileArchiveIcon className="size-4 opacity-60" />
                          } else if (
                            fileType.includes("excel") ||
                            fileName.endsWith(".xls") ||
                            fileName.endsWith(".xlsx")
                          ) {
                            return <FileSpreadsheetIcon className="size-4 opacity-60" />
                          } else if (fileType.includes("video/")) {
                            return <VideoIcon className="size-4 opacity-60" />
                          } else if (fileType.includes("audio/")) {
                            return <HeadphonesIcon className="size-4 opacity-60" />
                          } else if (fileType.startsWith("image/")) {
                            return <ImageIcon className="size-4 opacity-60" />
                          }
                          return <FileIcon className="size-4 opacity-60" />
                        })()}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13px] font-medium">
                          {(file.file && (file.file as File).name) || ''}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatBytes((file.file && (file.file as File).size) || 0)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                      onClick={() => removeFile(file.id)}
                      aria-label="Remove file"
                    >
                      <XIcon className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                {/* Remove all files button */}
                {uploadedFiles.length > 1 && (
                  <div>
                    <Button size="sm" variant="outline" onClick={clearFiles}>
                      Remove all files
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isLoading}
                      className="rounded-lg shadow-none focus-visible:z-10 w-24"
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