'use client';

import { useState, useId, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, UploadCloud, AlertCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { useDropzone } from 'react-dropzone';
import CalendarWithTimeInput from "@/components/calendarwithtimeinput"
import CalendarWithMonthsInput from "@/components/calendarwithmonthsinput"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nanoid } from 'nanoid';

interface TenantRequestForm {
  title: string;
  description: string;
  priority: string;
  status: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  dueDate: Date | undefined;
  assignedTo: string;
  vendorId: string;
  notify: boolean;
  notifyVendor: boolean;
  permissionToEnter: boolean;
  taskType: 'one_time' | 'recurring';
  frequency?: string;
  repeatInfinite?: boolean;
  propertyId?: string;
  unitId?: string;
  approvedByOwner: boolean;
  partsAndLabor: boolean;
  accessToProperty: boolean;
  billDate?: Date | undefined;
  partsAndLaborItems: {
    id: string;
    description: string;
    category: string;
    quantity: number | string;
    unitPrice: number | string;
    total: number;
    billDate?: Date;
  }[];
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export default function AddWorkOrderPage() {
  const id = useId();
  const router = useRouter();
  type StepType = 'intro' | 'details' | 'property' | 'attachments' | 'summary';
  const [step, setStep] = useState<StepType>('intro');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  
  const startDateRef = useRef<{ hasTimeSelected: () => boolean }>(null);
  const endDateRef = useRef<{ hasTimeSelected: () => boolean }>(null);
  const dueDateRef = useRef<{ hasTimeSelected: () => boolean }>(null);

  const [request, setRequest] = useState<TenantRequestForm>({
    title: '',
    description: '',
    priority: 'low',
    status: 'in_progress',
    startDate: undefined,
    endDate: undefined,
    dueDate: undefined,
    assignedTo: '',
    vendorId: '',
    notify: true,
    notifyVendor: true,
    permissionToEnter: false,
    taskType: 'one_time',
    repeatInfinite: false,
    propertyId: '',
    unitId: '',
    approvedByOwner: false,
    partsAndLabor: false,
    accessToProperty: false,
    billDate: undefined,
    partsAndLaborItems: [],
  });

  const [vendors, setVendors] = useState<{ id: string; first_name: string; last_name: string; company?: string; }[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string; }[]>([]);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [units, setUnits] = useState<{ id: string; unit_name: string; }[]>([]);
  const [unitsOpen, setUnitsOpen] = useState(false);

  // Function to validate date format
  const isValidDateFormat = (date: Date | undefined) => {
    if (!date) return false;
    // Check if the date is valid and not in an invalid format
    return !isNaN(date.getTime());
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Initialize uploading files state
    setUploadingFiles(acceptedFiles.map(file => ({
      file,
      progress: 0
    })));
    
    try {
      // Upload files in parallel
      await Promise.all(acceptedFiles.map(async (file, index) => {
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });

          // Update progress to 50% after base64 conversion
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 50 } : f
          ));

          // Send to API
          const response = await fetch(`/api/tasks/files`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileName: file.name,
              fileType: file.type
            }),
            credentials: 'include'
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || error.error || error.message || 'Failed to upload file');
          }

          await response.json();

          // Update progress to 100% after successful upload
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 100 } : f
          ));
        } catch (err) {
          // Update file state with error
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, error: err instanceof Error ? err.message : 'Upload failed' } : f
          ));
        }
      }));

      // Clear uploading files after a delay to show completion
      setTimeout(() => {
        setUploadingFiles([]);
        toast.success('Files uploaded successfully');
      }, 1000);
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error('Some files failed to upload');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Add useEffect to fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        console.log('Fetching vendors...');
        const response = await fetch('/api/people/vendor/search', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Vendors API response status:', response.status);
        
        if (response.status === 401) {
          console.error('Authentication error - redirecting to login');
          router.push('/login');
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(`Failed to fetch vendors: ${response.status} - ${errorData.error || ''} ${errorData.details || ''}`);
        }
        
        const data = await response.json();
        console.log('Vendors data received:', data);
        setVendors(data || []);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast.error('Failed to load vendors. Please try refreshing the page.');
      }
    };

    fetchVendors();
  }, [router]);

  // Add useEffect to fetch company members
  useEffect(() => {
    const fetchCompanyMembers = async () => {
      try {
        const response = await fetch('/api/company/members');
        if (!response.ok) {
          throw new Error('Failed to fetch company members');
        }
        const data = await response.json();
        setCompanyMembers(data);
      } catch (error) {
        console.error('Error fetching company members:', error);
      }
    };

    fetchCompanyMembers();
  }, []);

  // Add useEffect to fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      }
    };

    fetchProperties();
  }, []);

  // Add useEffect to fetch units when property is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (!request.propertyId) {
        setUnits([]);
        return;
      }

      try {
        const response = await fetch(`/api/property/${request.propertyId}/units`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch units');
        }

        const data = await response.json();
        setUnits(data);
      } catch (error) {
        console.error('Error fetching units:', error);
        setUnits([]);
      }
    };

    fetchUnits();
  }, [request.propertyId]);

  const handleSubmit = async () => {
    try {
      // Prepare work order data
      const requestData = {
        subject: request.title,
        description: request.description,
        priority: request.priority,
        status: request.status,
        task_type: request.taskType,
        frequency: request.frequency,
        repeat_infinite: request.repeatInfinite,
        start_date: request.startDate ? new Date(request.startDate).toISOString() : undefined,
        end_date: request.endDate ? new Date(request.endDate).toISOString() : undefined,
        due_date: request.taskType === 'one_time' ? new Date(request.dueDate!).toISOString() : undefined,
        assignees: request.assignedTo || null,
        vendors: request.vendorId || null,
        notify_assignee: request.notify,
        permit_enter: request.permissionToEnter || false,
        role: 'work_order',
        property_id: request.propertyId || null,
        unit_id: request.unitId || null,
        billExpenses: request.partsAndLabor ? request.partsAndLaborItems.map(item => ({
          vendor: request.vendorId,
          frequency: request.taskType === 'recurring' ? request.frequency : null,
          bill_date: item.billDate?.toISOString().split('T')[0],
          due_date: request.taskType === 'recurring' ? 
            request.endDate?.toISOString().split('T')[0] : 
            request.dueDate?.toISOString().split('T')[0],
          memo: request.description,
          nano_id: nanoid(),
          category: item.category,
          property: request.propertyId,
          units: request.unitId,
          quantity: item.quantity.toString(),
          unit_price: typeof item.unitPrice === 'number' ? item.unitPrice.toString() : item.unitPrice,
          description: item.description,
          start_date: request.taskType === 'recurring' ? request.startDate?.toISOString() : null,
          repeat_infinite: request.taskType === 'recurring' ? request.repeatInfinite : null
        })) : []
      };

      console.log('Sending request data:', JSON.stringify(requestData, null, 2));

      // Create work order with bill expenses
      const workOrderResponse = await fetch('/api/tasks/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include'
      });

      if (!workOrderResponse.ok) {
        const error = await workOrderResponse.json();
        throw new Error(`Failed to create work order: ${workOrderResponse.status} - ${error.error || ''} ${error.details || ''} ${error.hint || ''}`);
      }

      toast.success('Work order created successfully');
      router.push('/tasks');
    } catch (error) {
      console.error('Error creating work order:', error);
      toast.error('Failed to create work order. Please try again.');
    }
  };

  const renderIntroForm = () => (
    <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
      <div className="space-y-4 mb-8">
        <h2 className="text-3xl font-bold">Add a Work Order</h2>
        <div className="text-lg text-gray-600">
          Create a new work order to track maintenance tasks, repairs, or vendor assignments.
        </div>
      </div>

      <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border text-left w-full">
        <h3 className="text-lg font-semibold mb-3">Required Information</h3>
        <div className="mb-4">
          The following fields are mandatory to create a work order:
        </div>
        <ul className="list-disc list-inside space-y-2">
          <li>Title</li>
          <li>Priority</li>
          <li>Status</li>
          <li>Vendor</li>
        </ul>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Subject <span className="text-red-500">*</span></Label>
          <Input 
            id="title" 
            placeholder="Enter work order subject"
            value={request.title}
            onChange={(e) => setRequest({...request, title: e.target.value})}
            className="h-[42px] bg-background"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={request.description}
            onChange={(e) => setRequest({...request, description: e.target.value})}
            placeholder="Add work order description..."
            className="min-h-[150px] bg-background"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="taskType">Task Type <span className="text-red-500">*</span></Label>
          <div className="flex gap-4">
            <div
              onClick={() => setRequest({ ...request, taskType: 'one_time', frequency: undefined, repeatInfinite: undefined })}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-1",
                request.taskType === 'one_time'
                  ? "border-green-600 bg-green-50"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "font-medium mb-1",
                request.taskType === 'one_time' && "text-green-600"
              )}>One-time Work Order</div>
              <div className="text-sm text-muted-foreground">Create a single work order</div>
            </div>
            <div
              onClick={() => setRequest({ ...request, taskType: 'recurring' })}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-1",
                request.taskType === 'recurring'
                  ? "border-green-600 bg-green-50"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "font-medium mb-1",
                request.taskType === 'recurring' && "text-green-600"
              )}>Recurring Work Order</div>
              <div className="text-sm text-muted-foreground">Schedule repeating work orders</div>
            </div>
          </div>
        </div>

        {request.taskType === 'recurring' && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Frequency <span className="text-red-500">*</span></Label>
              <div className="inline-flex h-9 items-center rounded-md border border-input bg-background p-0.5 text-muted-foreground w-fit">
                {[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly', label: 'Yearly' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRequest({...request, frequency: item.value})}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                      request.frequency === item.value 
                        ? "bg-green-600 text-white hover:bg-green-500" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
                <CalendarWithTimeInput
                  ref={startDateRef}
                  value={request.startDate}
                  onChange={(date) => setRequest({...request, startDate: date})}
                  className="w-full"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="endDate">End Date {!request.repeatInfinite && <span className="text-red-500">*</span>}</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="repeatInfinite"
                      checked={request.repeatInfinite}
                      onCheckedChange={(checked) => setRequest({...request, repeatInfinite: checked, endDate: checked ? undefined : request.endDate})}
                    />
                    <Label htmlFor="repeatInfinite" className="text-sm font-medium">
                      Repeat Forever
                    </Label>
                  </div>
                </div>
                <CalendarWithTimeInput
                  ref={endDateRef}
                  value={request.endDate}
                  onChange={(date) => setRequest({...request, endDate: date})}
                  className="w-full"
                  disabled={request.repeatInfinite}
                />
              </div>
            </div>
          </div>
        )}

        {request.taskType === 'one_time' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date <span className="text-red-500">*</span></Label>
              <CalendarWithTimeInput
                ref={dueDateRef}
                value={request.dueDate}
                onChange={(date) => setRequest({...request, dueDate: date})}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="assignedTo"
                  variant="outline"
                  role="combobox"
                  aria-expanded={assigneeOpen}
                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !request.assignedTo && "text-muted-foreground")}>
                    {request.assignedTo
                      ? companyMembers.find((member) => member.id === request.assignedTo)
                        ? `${companyMembers.find((member) => member.id === request.assignedTo)?.first_name} ${companyMembers.find((member) => member.id === request.assignedTo)?.last_name}`
                        : "Select assignee"
                      : "Select assignee"}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 text-muted-foreground/80"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search assignee..." />
                  <CommandList>
                    <CommandEmpty>No assignee found.</CommandEmpty>
                    <CommandGroup>
                      {companyMembers.map((member) => (
                        <CommandItem
                          key={member.id}
                          value={`${member.first_name} ${member.last_name}`}
                          onSelect={() => {
                            const newAssigneeId = request.assignedTo === member.id ? "" : member.id;
                            setRequest({ ...request, assignedTo: newAssigneeId });
                            setAssigneeOpen(false);
                          }}
                        >
                          {member.first_name} {member.last_name}
                          {request.assignedTo === member.id && (
                            <Check size={16} strokeWidth={2} className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vendorId">Vendor <span className="text-red-500">*</span></Label>
            <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="vendorId"
                  variant="outline"
                  role="combobox"
                  aria-expanded={vendorOpen}
                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !request.vendorId && "text-muted-foreground")}>
                    {request.vendorId
                      ? vendors.find(vendor => vendor.id === request.vendorId)?.company || 
                        `${vendors.find(vendor => vendor.id === request.vendorId)?.first_name} ${vendors.find(vendor => vendor.id === request.vendorId)?.last_name}` || 
                        "Select vendor"
                      : "Select vendor"}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 text-muted-foreground/80"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search vendors..." />
                  <CommandList>
                    <CommandEmpty>No vendors found.</CommandEmpty>
                    <CommandGroup>
                      {vendors.map((vendor) => (
                        <CommandItem
                          key={vendor.id}
                          value={vendor.id}
                          onSelect={(currentValue) => {
                            const newVendorId = currentValue === request.vendorId ? "" : currentValue;
                            setRequest(prev => ({
                              ...prev,
                              vendorId: newVendorId,
                            }));
                            setVendorOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span>
                              {`${vendor.first_name} ${vendor.last_name}`}
                            </span>
                            {vendor.company && (
                              <span className="text-xs text-muted-foreground">
                                {vendor.company}
                              </span>
                            )}
                          </div>
                          {request.vendorId === vendor.id && (
                            <Check size={16} strokeWidth={2} className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
            <Select
              value={request.priority}
              onValueChange={(value) => setRequest({...request, priority: value})}
            >
              <SelectTrigger id="priority" className="h-[42px] bg-background">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-medium">Notifications & Permissions</Label>
          <div className="flex gap-6">
            <div className="flex items-center gap-2 h-[42px]">
              <Switch 
                id={`${id}-notify`}
                checked={request.notify}
                onCheckedChange={(checked) => setRequest({...request, notify: checked})}
                aria-label="Notify assignee"
              />
              <Label htmlFor={`${id}-notify`} className="text-sm font-medium">
                Notify Assignee
              </Label>
            </div>
            <div className="flex items-center gap-2 h-[42px]">
              <Switch 
                id={`${id}-notify-vendor`}
                checked={request.notifyVendor}
                onCheckedChange={(checked) => setRequest({...request, notifyVendor: checked})}
                aria-label="Notify vendor"
              />
              <Label htmlFor={`${id}-notify-vendor`} className="text-sm font-medium">
                Notify Vendor
              </Label>
            </div>
            <div className="flex items-center gap-2 h-[42px]">
              <Switch 
                id={`${id}-permission`}
                checked={request.permissionToEnter}
                onCheckedChange={(checked) => setRequest({...request, permissionToEnter: checked})}
                aria-label="Permission to enter property"
              />
              <Label htmlFor={`${id}-permission`} className="text-sm font-medium">
                Permission to Enter
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertyForm = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Property Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="property">Property</Label>
              <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="property"
                    variant="outline"
                    role="combobox"
                    aria-expanded={propertiesOpen}
                    className={cn(
                      "w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20",
                      !request.propertyId && "border-red-500 focus-visible:ring-red-500"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {!request.propertyId && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn("truncate", !request.propertyId && "text-muted-foreground")}>
                        {request.propertyId ? properties.find(p => p.id === request.propertyId)?.name || "Select property" : "Select property"}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 text-muted-foreground/80"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search properties..." />
                    <CommandList>
                      <CommandEmpty>No properties found.</CommandEmpty>
                      <CommandGroup>
                        {properties.map((property) => (
                          <CommandItem
                            key={property.id}
                            value={property.name}
                            onSelect={() => {
                              const newPropertyId = request.propertyId === property.id ? "" : property.id;
                              setRequest(prev => ({
                                ...prev,
                                propertyId: newPropertyId,
                                unitId: "" // Reset unit when property changes
                              }));
                              setPropertiesOpen(false);
                            }}
                          >
                            {property.name}
                            {request.propertyId === property.id && (
                              <Check size={16} strokeWidth={2} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Popover open={unitsOpen} onOpenChange={setUnitsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="unit"
                    variant="outline"
                    role="combobox"
                    aria-expanded={unitsOpen}
                    disabled={!request.propertyId}
                    className={cn(
                      "w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20",
                      !request.propertyId && "opacity-50"
                    )}
                  >
                    <span className={cn("truncate", !request.unitId && "text-muted-foreground")}>
                      {request.unitId ? units.find(u => u.id === request.unitId)?.unit_name || "Select unit" : "Select unit"}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 text-muted-foreground/80"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search units..." />
                    <CommandList>
                      <CommandEmpty>No units found.</CommandEmpty>
                      <CommandGroup>
                        {units.map((unit) => (
                          <CommandItem
                            key={unit.id}
                            value={unit.unit_name}
                            onSelect={() => {
                              const newUnitId = request.unitId === unit.id ? "" : unit.id;
                              setRequest(prev => ({
                                ...prev,
                                unitId: newUnitId
                              }));
                              setUnitsOpen(false);
                            }}
                          >
                            {unit.unit_name}
                            {request.unitId === unit.id && (
                              <Check size={16} strokeWidth={2} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Additional Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch 
                id={`${id}-approved`}
                checked={request.approvedByOwner}
                onCheckedChange={(checked) => setRequest({...request, approvedByOwner: checked})}
              />
              <Label htmlFor={`${id}-approved`} className="text-sm font-medium">
                Approved by Owner
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id={`${id}-access`}
                checked={request.accessToProperty}
                onCheckedChange={(checked) => setRequest({...request, accessToProperty: checked})}
              />
              <Label htmlFor={`${id}-access`} className="text-sm font-medium">
                Access to Property
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold">Parts and Labor</h3>
            <div className="flex items-center gap-2">
              <Switch 
                id={`${id}-parts`}
                checked={request.partsAndLabor}
                onCheckedChange={(checked) => setRequest({...request, partsAndLabor: checked})}
              />
            </div>
          </div>

          {request.partsAndLabor && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11">Description</TableHead>
                      <TableHead className="h-11">Category</TableHead>
                      <TableHead className="h-11">Bill Date</TableHead>
                      <TableHead className="h-11">Quantity</TableHead>
                      <TableHead className="h-11">Unit Price</TableHead>
                      <TableHead className="h-11 text-right">Total</TableHead>
                      <TableHead className="h-11 w-[100px] text-right">
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRequest(prev => ({
                                ...prev,
                                partsAndLaborItems: [
                                  ...prev.partsAndLaborItems,
                                  {
                                    id: crypto.randomUUID(),
                                    description: '',
                                    category: '',
                                    quantity: '',
                                    unitPrice: '',
                                    total: 0,
                                    billDate: undefined
                                  }
                                ]
                              }));
                            }}
                            className="h-8 w-8 p-0 bg-green-600 text-white hover:bg-green-500 border-green-600"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.partsAndLaborItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No parts and labor items added
                        </TableCell>
                      </TableRow>
                    ) : (
                      request.partsAndLaborItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!item.description.trim() && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Input
                                value={item.description}
                                onChange={(e) => updatePartsAndLaborItem(item.id, 'description', e.target.value)}
                                placeholder="Enter description"
                                className={cn(
                                  "h-9",
                                  !item.description.trim() && "border-red-500 focus-visible:ring-red-500"
                                )}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.category === '' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Select
                                value={item.category}
                                onValueChange={(value) => updatePartsAndLaborItem(item.id, 'category', value)}
                              >
                                <SelectTrigger className={cn(
                                  "h-9",
                                  item.category === '' && "border-red-500 focus-visible:ring-red-500"
                                )}>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="materials">Materials</SelectItem>
                                  <SelectItem value="labor">Labor</SelectItem>
                                  <SelectItem value="equipment">Equipment</SelectItem>
                                  <SelectItem value="permits">Permits</SelectItem>
                                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!item.billDate && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <CalendarWithMonthsInput
                                value={item.billDate}
                                onChange={(date) => updatePartsAndLaborItem(item.id, 'billDate', date)}
                                className={cn(
                                  "w-full",
                                  !item.billDate && "border-red-500 focus-visible:ring-red-500"
                                )}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.quantity === 0 && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updatePartsAndLaborItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                placeholder="Qty"
                                className={cn(
                                  "h-9",
                                  item.quantity === 0 && "border-red-500 focus-visible:ring-red-500"
                                )}
                                min={0}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updatePartsAndLaborItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              placeholder="Price"
                              className="h-9"
                              min={0}
                              step={0.01}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="h-9 flex items-center justify-end">
                              ${item.total.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRequest(prev => ({
                                    ...prev,
                                    partsAndLaborItems: prev.partsAndLaborItems.filter(i => i.id !== item.id)
                                  }));
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {request.partsAndLaborItems.length > 0 && (
                    <TableFooter className="bg-transparent">
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} />
                        <TableCell className="text-right font-medium">Total:</TableCell>
                        <TableCell className="text-right font-medium">
                          ${request.partsAndLaborItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="w-[100px]" />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
              {request.partsAndLaborItems.some(item => !item.description.trim() || item.quantity === 0 || !item.billDate) && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Please fill in all required fields before proceeding</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSummaryForm = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="text-xl font-semibold">Review Work Order Information</div>
        <div className="text-sm text-gray-600">Please review all the information before creating the work order</div>
      </div>

      <div className="grid gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Work Order Details</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={request.title} className="h-[42px] bg-muted" disabled />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={request.description} className="bg-muted" disabled />
            </div>
            <div className="grid gap-2">
              <Label>Task Type</Label>
              <div className="flex gap-4">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 flex-1",
                    request.taskType === 'one_time'
                      ? "border-green-600 bg-green-50"
                      : "border-border"
                  )}
                >
                  <div className={cn(
                    "font-medium mb-1",
                    request.taskType === 'one_time' && "text-green-600"
                  )}>One-time Work Order</div>
                  <div className="text-sm text-muted-foreground">Create a single work order</div>
                </div>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 flex-1",
                    request.taskType === 'recurring'
                      ? "border-green-600 bg-green-50"
                      : "border-border"
                  )}
                >
                  <div className={cn(
                    "font-medium mb-1",
                    request.taskType === 'recurring' && "text-green-600"
                  )}>Recurring Work Order</div>
                  <div className="text-sm text-muted-foreground">Schedule repeating work orders</div>
                </div>
              </div>
            </div>

            {request.taskType === 'recurring' && (
              <>
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <div className="inline-flex h-9 items-center rounded-md border border-input bg-background p-0.5 text-muted-foreground w-fit">
                    {[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'yearly', label: 'Yearly' },
                    ].map((item) => (
                      <div
                        key={item.value}
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium",
                          request.frequency === item.value 
                            ? "bg-green-600 text-white" 
                            : "text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <CalendarWithTimeInput
                      value={request.startDate}
                      onChange={() => {}}
                      className="w-full"
                      disabled={true}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>End Date</Label>
                      {request.repeatInfinite && (
                        <span className="text-sm text-muted-foreground">Repeats Forever</span>
                      )}
                    </div>
                    {!request.repeatInfinite && (
                      <CalendarWithTimeInput
                        value={request.endDate}
                        onChange={() => {}}
                        className="w-full"
                        disabled={true}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {request.taskType === 'one_time' && (
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <CalendarWithTimeInput
                  value={request.dueDate}
                  onChange={() => {}}
                  className="w-full"
                  disabled={true}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Input 
                  value={request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Input 
                  value={request.status.charAt(0).toUpperCase() + request.status.slice(1)} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
              <div className="grid gap-2">
                <Label>Task Type</Label>
                <Input 
                  value={request.taskType === 'one_time' ? 'One-time Work Order' : 'Recurring Work Order'} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Vendor</Label>
                <Input 
                  value={request.vendorId 
                    ? vendors.find(vendor => vendor.id === request.vendorId)?.company || 
                      `${vendors.find(vendor => vendor.id === request.vendorId)?.first_name} ${vendors.find(vendor => vendor.id === request.vendorId)?.last_name}` || 
                      'No vendor'
                    : 'No vendor'} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Assignment Details</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Assigned To</Label>
              <Input 
                value={request.assignedTo 
                  ? companyMembers.find(member => member.id === request.assignedTo)
                    ? `${companyMembers.find(member => member.id === request.assignedTo)?.first_name} ${companyMembers.find(member => member.id === request.assignedTo)?.last_name}`
                    : 'Unassigned'
                  : 'Unassigned'} 
                className="h-[42px] bg-muted" 
                disabled 
              />
            </div>
            <div className="grid gap-2">
              <Label>Notifications & Permissions</Label>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full",
                    request.notify ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="text-sm">Notify Assignee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full",
                    request.notifyVendor ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="text-sm">Notify Vendor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded-full",
                    request.permissionToEnter ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="text-sm">Permission to Enter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Property Details</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Property</Label>
              <div className="flex items-center gap-2">
                {!request.propertyId && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <Input 
                  value={request.propertyId ? properties.find(p => p.id === request.propertyId)?.name || 'No property selected' : 'No property selected'} 
                  className={cn(
                    "h-[42px] bg-muted",
                    !request.propertyId && "border-red-500"
                  )} 
                  disabled 
                />
              </div>
            </div>
            {request.propertyId && (
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Input 
                  value={request.unitId ? units.find(u => u.id === request.unitId)?.unit_name || 'No unit selected' : 'No unit selected'} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Additional Settings</h3>
          <div className="grid gap-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 rounded-full",
                  request.approvedByOwner ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-sm">Approved by Owner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 rounded-full",
                  request.accessToProperty ? "bg-green-500" : "bg-gray-300"
                )} />
                <span className="text-sm">Access to Property</span>
              </div>
            </div>
          </div>
        </div>

        {request.partsAndLabor && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Parts and Labor</h3>
            <div className="grid gap-2">
              <Label>Bill Date</Label>
              <CalendarWithMonthsInput
                value={request.billDate}
                onChange={() => {}}
                className="w-full"
                disabled={true}
              />
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11">Description</TableHead>
                    <TableHead className="h-11">Category</TableHead>
                    <TableHead className="h-11">Bill Date</TableHead>
                    <TableHead className="h-11">Quantity</TableHead>
                    <TableHead className="h-11">Unit Price</TableHead>
                    <TableHead className="h-11 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.partsAndLaborItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No parts and labor items added
                      </TableCell>
                    </TableRow>
                  ) : (
                    request.partsAndLaborItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.category || 'N/A'}</TableCell>
                        <TableCell>{item.billDate ? item.billDate.toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : '0.00'}</TableCell>
                        <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {request.partsAndLaborItems.length > 0 && (
                  <TableFooter className="bg-transparent">
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} />
                      <TableCell className="text-right font-medium">Total:</TableCell>
                      <TableCell className="text-right font-medium">
                        ${request.partsAndLaborItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="w-[100px]" />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAttachmentsForm = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="text-xl font-semibold">Add Attachments</div>
        <div className="text-sm text-gray-600">Upload any relevant files or documents for this request</div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">
            {isDragActive ? 'Drop the files here...' : 'Drag & drop files here or click to browse'}
          </div>
          <div className="text-xs text-muted-foreground">
            Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT
          </div>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          {uploadingFiles.map((file, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{file.file.name}</span>
                <span>{file.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    file.error ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              {file.error && (
                <p className="text-xs text-red-500">{file.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const updatePartsAndLaborItem = (id: string, field: string, value: string | number | Date | undefined) => {
    setRequest(prev => ({
      ...prev,
      partsAndLaborItems: prev.partsAndLaborItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate total when quantity or unit price changes
          if (field === 'quantity' || field === 'unitPrice') {
            const numericQuantity = typeof updatedItem.quantity === 'string' ? 
              parseFloat(updatedItem.quantity) || 0 : 
              updatedItem.quantity;
            const numericUnitPrice = typeof updatedItem.unitPrice === 'string' ? 
              parseFloat(updatedItem.unitPrice) || 0 : 
              updatedItem.unitPrice;
            updatedItem.total = numericQuantity * numericUnitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  return (
    <div className="mx-auto p-6">
      <div className="bg-card rounded-xl p-16 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-semibold">Add a Work Order</h1>
          </div>

          {/* Progress Steps */}
          <div className="w-full mx-auto mb-8">
            <div className="flex justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-[1px] bg-muted">
                <div className={cn(
                  "h-full bg-green-600 transition-all duration-300",
                  step === 'intro' ? 'w-[12%]' :
                  step === 'details' ? 'w-[38%]' :
                  step === 'property' ? 'w-[50%]' :
                  step === 'attachments' ? 'w-[62%]' :
                  step === 'summary' ? 'w-[88%]' :
                  'w-full'
                )}/>
              </div>

              {/* Steps */}
              <div className="relative flex justify-between w-full">
                {['intro', 'details', 'property', 'attachments', 'summary'].map((stepName, index) => {
                  const displayNumber = index + 1;
                  const stepOrder = ['intro', 'details', 'property', 'attachments', 'summary'];
                  const currentStepIndex = stepOrder.indexOf(step);
                  const thisStepIndex = stepOrder.indexOf(stepName);
                  const isCompleted = thisStepIndex < currentStepIndex;
                  const isActive = step === stepName;

                  return (
                    <div key={stepName} className="relative flex flex-col items-center" style={{ width: 'calc(100% / 5)' }}>
                      <div className={cn(
                        "w-7 h-7 rounded-full border flex items-center justify-center bg-background text-xs font-medium",
                        isActive ? 'border-green-600 text-green-600' :
                        isCompleted ? 'border-green-600 bg-green-600' :
                        'border-muted text-muted-foreground'
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          displayNumber
                        )}
                      </div>
                      <span className={cn(
                        "mt-1 text-[10px] font-medium whitespace-nowrap",
                        (isActive || isCompleted) ? 'text-green-600' : 'text-muted-foreground'
                      )}>
                        {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1">
            {step === 'intro' && renderIntroForm()}
            {step === 'details' && renderDetailsForm()}
            {step === 'property' && renderPropertyForm()}
            {step === 'attachments' && renderAttachmentsForm()}
            {step === 'summary' && renderSummaryForm()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-auto pt-8">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'details') setStep('intro');
              if (step === 'property') setStep('details');
              if (step === 'attachments') setStep('property');
              if (step === 'summary') setStep('attachments');
            }}
            disabled={step === 'intro'}
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (step === 'intro') {
                setStep('details');
              } else if (step === 'details') {
                  // Basic field validation
                  if (!request.title || !request.vendorId || !request.priority) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  // Recurring work order validation
                  if (request.taskType === 'recurring') {
                    if (!request.frequency) {
                      toast.error('Please select a frequency for the recurring work order');
                      return;
                    }
                    if (!request.startDate || !isValidDateFormat(request.startDate)) {
                      toast.error('Please select a valid start date');
                      return;
                    }
                    if (!startDateRef.current?.hasTimeSelected()) {
                      toast.error('Please select a time for the start date');
                      return;
                    }
                    if (!request.repeatInfinite && !request.endDate) {
                      toast.error('Please select an end date or enable Repeat Forever');
                      return;
                    }
                    if (!request.repeatInfinite && request.endDate && !isValidDateFormat(request.endDate)) {
                      toast.error('Please select a valid end date');
                      return;
                    }
                    if (!request.repeatInfinite && request.endDate && !endDateRef.current?.hasTimeSelected()) {
                      toast.error('Please select a time for the end date');
                      return;
                    }
                    // Validate that end date is after start date
                    if (!request.repeatInfinite && request.endDate && request.startDate && request.endDate < request.startDate) {
                      toast.error('End date must be after start date');
                      return;
                    }
                  }

                  // One-time work order validation
                  if (request.taskType === 'one_time') {
                    if (!request.dueDate || !isValidDateFormat(request.dueDate)) {
                      toast.error('Please select a valid due date');
                      return;
                    }
                    if (!dueDateRef.current?.hasTimeSelected()) {
                      toast.error('Please select a time for the due date');
                      return;
                    }
                    // Validate that due date is not in the past
                    if (request.dueDate < new Date()) {
                      toast.error('Due date cannot be in the past');
                      return;
                    }
                  }

                  setStep('property');
                } else if (step === 'property') {
                  // Check if property is selected
                  if (!request.propertyId) {
                    toast.error('Please select a property');
                    return;
                  }

                  // Check if parts and labor is enabled but no items added
                  if (request.partsAndLabor && request.partsAndLaborItems.length === 0) {
                    toast.error('Please add at least one parts and labor item');
                    return;
                  }
                  // Check for empty descriptions and bill dates in parts and labor items
                  const emptyDescriptionItem = request.partsAndLaborItems.find(item => !item.description.trim());
                  const missingBillDateItem = request.partsAndLaborItems.find(item => !item.billDate);
                  if (request.partsAndLabor && (emptyDescriptionItem || missingBillDateItem)) {
                    toast.error('Please fill in all required fields including bill dates');
                    return;
                  }
                  setStep('attachments');
                } else if (step === 'attachments') {
                  setStep('summary');
                } else {
                  handleSubmit();
                }
            }}
          >
            {step === 'summary' ? 'Create Request' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
} 