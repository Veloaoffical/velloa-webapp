'use client';

import { useState, useId, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, UploadCloud } from "lucide-react";
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

interface TenantRequestForm {
  title: string;
  description: string;
  priority: string;
  status: string;
  requestType: string;
  startDate?: Date;
  dueDate?: Date;
  assignedTo: string;
  ownerId: string;
  notify: boolean;
  notifyOwner: boolean;
  permissionToEnter: boolean;
  category: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export default function AddOwnerRequestPage() {
  const id = useId();
  const router = useRouter();
  type StepType = 'intro' | 'details' | 'attachments' | 'summary';
  const [step, setStep] = useState<StepType>('intro');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [request, setRequest] = useState<TenantRequestForm>({
    title: '',
    description: '',
    priority: 'low',
    status: 'in_progress',
    requestType: '',
    assignedTo: '',
    ownerId: '',
    notify: true,
    notifyOwner: true,
    permissionToEnter: false,
    category: '',
  });

  const [owners, setOwners] = useState<{ id: string; first_name: string; last_name: string; unit?: { unit_number: string; property_name?: string; } }[]>([]);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

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

  // Add useEffect to fetch owners
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        console.log('Fetching owners...');
        const response = await fetch('/api/people/owner/search', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Owners API response status:', response.status);
        
        if (response.status === 401) {
          console.error('Authentication error - redirecting to login');
          router.push('/login');
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(`Failed to fetch owners: ${response.status} - ${errorData.error || ''} ${errorData.details || ''}`);
        }
        
        const data = await response.json();
        console.log('Owners data received:', data);
        setOwners(data || []);
      } catch (error) {
        console.error('Error fetching owners:', error);
        toast.error('Failed to load owners. Please try refreshing the page.');
      }
    };

    fetchOwners();
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

  const handleSubmit = async () => {
    try {
      const requestData = {
        subject: request.title,
        description: request.description,
        priority: request.priority,
        status: request.status,
        task_type: 'one_time',
        request_type: request.requestType,
        request_specific: request.category,
        start_date: request.startDate,
        due_date: request.dueDate,
        assignees: request.assignedTo || null,
        owner_id: request.ownerId || null,
        notify_assignee: request.notify,
        notify_owner: request.notifyOwner || false,
        permit_enter: request.permissionToEnter || false,
        role: 'owner_request'
      };

      console.log('Sending request data:', JSON.stringify(requestData, null, 2));

      const response = await fetch('/api/tasks/owner-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include'
      });

      const responseData = await response.json();
      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(`Failed to create owner request: ${response.status} - ${responseData.error || ''} ${responseData.details || ''} ${responseData.hint || ''}`);
      }

      toast.success('Owner request created successfully');
      router.push('/tasks');
    } catch (error) {
      console.error('Error creating owner request:', error);
      toast.error('Failed to create owner request. Please try again.');
    }
  };

  const renderIntroForm = () => (
    <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
      <div className="space-y-4 mb-8">
        <h2 className="text-3xl font-bold">Add an Owner Request</h2>
        <div className="text-lg text-gray-600">
          Create a new request to track owner maintenance, complaints, or general inquiries.
        </div>
      </div>

      <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border text-left w-full">
        <h3 className="text-lg font-semibold mb-3">Required Information</h3>
        <div className="mb-4">
          The following fields are mandatory to create an owner request:
        </div>
        <ul className="list-disc list-inside space-y-2">
          <li>Title</li>
          <li>Property</li>
          <li>Request Type</li>
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
            placeholder="Enter request subject"
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
            placeholder="Add request description..."
            className="min-h-[150px] bg-background"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ownerId">Owner <span className="text-red-500">*</span></Label>
            <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="ownerId"
                  variant="outline"
                  role="combobox"
                  aria-expanded={ownerOpen}
                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !request.ownerId && "text-muted-foreground")}>
                    {request.ownerId
                      ? owners.find(owner => owner.id === request.ownerId)?.first_name + " " + owners.find(owner => owner.id === request.ownerId)?.last_name || "Select owner"
                      : "Select owner"}
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
                  <CommandInput placeholder="Search owners..." />
                  <CommandList>
                    <CommandEmpty>No owners found.</CommandEmpty>
                    <CommandGroup>
                      {owners.map((owner) => (
                        <CommandItem
                          key={owner.id}
                          value={owner.id}
                          onSelect={(currentValue) => {
                            const newOwnerId = currentValue === request.ownerId ? "" : currentValue;
                            setRequest(prev => ({
                              ...prev,
                              ownerId: newOwnerId,
                            }));
                            setOwnerOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span>{owner.first_name} {owner.last_name}</span>
                            {owner.unit && (
                              <span className="text-xs text-muted-foreground">{owner.unit.unit_number} - {owner.unit.property_name}</span>
                            )}
                          </div>
                          {request.ownerId === owner.id && (
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
            <Label htmlFor="requestType">Request Type <span className="text-red-500">*</span></Label>
            <Select
              value={request.requestType}
              onValueChange={(value) => setRequest({...request, requestType: value})}
            >
              <SelectTrigger id="requestType" className="h-[42px] bg-background">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="inquiry">General Inquiry</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            <Select
              value={request.category}
              onValueChange={(value) => setRequest({...request, category: value})}
            >
              <SelectTrigger id="category" className="h-[42px] bg-background">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="appliance">Appliance</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="pest">Pest Control</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="noise">Noise</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
            <Select
              value={request.status}
              onValueChange={(value) => setRequest({...request, status: value})}
            >
              <SelectTrigger id="status" className="h-[42px] bg-background">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="grid gap-2">
            <Label htmlFor="assignedTo">Assign To</Label>
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
                id={`${id}-notify-owner`}
                checked={request.notifyOwner}
                onCheckedChange={(checked) => setRequest({...request, notifyOwner: checked})}
                aria-label="Notify owner"
              />
              <Label htmlFor={`${id}-notify-owner`} className="text-sm font-medium">
                Notify Owner
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

  const renderSummaryForm = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="text-xl font-semibold">Review Request Information</div>
        <div className="text-sm text-gray-600">Please review all the information before creating the request</div>
      </div>

      <div className="grid gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Request Details</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={request.title} className="h-[42px] bg-muted" disabled />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={request.description} className="bg-muted" disabled />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Request Type</Label>
                <Input 
                  value={request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input 
                  value={request.category.charAt(0).toUpperCase() + request.category.slice(1)} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Input 
                  value={request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Location & Assignment</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Owner</Label>
              <Input 
                value={request.ownerId 
                  ? owners.find(owner => owner.id === request.ownerId)?.first_name + " " + owners.find(owner => owner.id === request.ownerId)?.last_name || 'No owner'
                  : 'No owner'} 
                className="h-[42px] bg-muted" 
                disabled 
              />
            </div>
            {request.ownerId && owners.find(owner => owner.id === request.ownerId)?.unit && (
              <div className="grid gap-2">
                <Label>Property</Label>
                <Input 
                  value={owners.find(owner => owner.id === request.ownerId)?.unit?.property_name || 'No property'} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
            )}
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
                    request.notifyOwner ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <span className="text-sm">Notify Owner</span>
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

  return (
    <div className="mx-auto p-6">
      <div className="bg-card rounded-xl p-16 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-semibold">Add an Owner Request</h1>
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
                  step === 'attachments' ? 'w-[62%]' :
                  step === 'summary' ? 'w-[88%]' :
                  'w-full'
                )}/>
              </div>

              {/* Steps */}
              <div className="relative flex justify-between w-full">
                {['intro', 'details', 'attachments', 'summary'].map((stepName, index) => {
                  const displayNumber = index + 1;
                  const stepOrder = ['intro', 'details', 'attachments', 'summary'];
                  const currentStepIndex = stepOrder.indexOf(step);
                  const thisStepIndex = stepOrder.indexOf(stepName);
                  const isCompleted = thisStepIndex < currentStepIndex;
                  const isActive = step === stepName;

                  return (
                    <div key={stepName} className="relative flex flex-col items-center" style={{ width: 'calc(100% / 4)' }}>
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
              if (step === 'attachments') setStep('details');
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
                if (!request.title || !request.ownerId || !request.requestType) {
                  toast.error('Please fill in all required fields');
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