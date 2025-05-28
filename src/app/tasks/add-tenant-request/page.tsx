'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Lock, AlertCircleIcon, ImageIcon, UploadIcon, XIcon, ChevronDown, MinusIcon, CheckIcon, MessageSquareIcon, MailIcon, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { formatBytes, useFileUpload, FilePreview } from "@/hooks/use-file-upload";
import Image from "next/image";
import { Checkbox } from '@/components/ui/checkbox';
import TenantCombobox from '@/components/TenantCombobox';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover } from '@/components/ui/popover';
import { 
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandInput
} from '@/components/ui/command';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from "framer-motion";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


interface Tenant {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

const taskSchema = z.object({
  tenant: z.string().min(1, 'Tenant is required'),
  requestType: z.string().min(1, 'Request type is required'),
  category: z.string().min(1, 'Category is required'),
  property: z.string().optional(),
  unit: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  notify: z.boolean().optional(),
  permissionToEnter: z.boolean().optional(),
  title: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  notify_assignee: z.enum(["none", "sms", "email", "both"]).optional(),
});

type TaskFormType = z.infer<typeof taskSchema>;

// Add AssignmentFormStep as a component
function AssignmentFormStep({ handlePrevious, handleNext, files, isDragging, errors, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, clearFiles, getInputProps }: {
  handlePrevious: () => void;
  handleNext: () => void;
  files: FilePreview[];
  isDragging: boolean;
  errors: string[];
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  openFileDialog: () => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Attachments</h1>
      <p className="mb-6 text-muted-foreground">Upload images, documents, or other files to help with task management.</p>
      <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
        <div className="space-y-8">
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            <div className="grid gap-1.5 w-full max-w-md">
              {/* Drop area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                data-dragging={isDragging || undefined}
                data-files={files.length > 0 || undefined}
                className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
              >
                <input
                  {...getInputProps()}
                  className="sr-only"
                  aria-label="Upload image file"
                />
                <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                  <div
                    className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <ImageIcon className="size-4 opacity-60" />
                  </div>
                  <p className="mb-1.5 text-sm font-medium">Drop your images here</p>
                  <p className="text-muted-foreground text-xs">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </p>
                  <Button variant="outline" className="mt-4" onClick={openFileDialog}>
                    <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
                    Select images
                  </Button>
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
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file: FilePreview) => (
                    <div
                      key={file.id}
                      className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-accent aspect-square shrink-0 rounded">
                          <Image
                            src={file.preview}
                            alt={file.file?.name || file.id}
                            className="size-10 rounded-[inherit] object-cover"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="truncate text-[13px] font-medium">
                            {file.file?.name || file.id}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {file.file ? formatBytes(file.file.size) : ''}
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
                        <XIcon aria-hidden="true" />
                      </Button>
                    </div>
                  ))}

                  {/* Remove all files button */}
                  {files.length > 1 && (
                    <div>
                      <Button size="sm" variant="outline" onClick={clearFiles}>
                        Remove all files
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex w-full justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious}>Previous</Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default function AddTaskPage() {
  const router = useRouter();
  type StepType = 'intro' | 'subject' | 'tenant_request_type' | 'assignment_property' | 'attachments' | 'summary';
  const [step, setStep] = useState<StepType>('intro');
  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set());
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  // Define notification options
  const notificationOptions = [
    { value: "none", label: "None", icon: <XIcon size={24} /> },
    { value: "sms", label: "SMS", icon: <MessageSquareIcon size={24} /> },
    { value: "email", label: "Email", icon: <MailIcon size={24} /> },
    { value: "both", label: "Both", icon: <MonitorSmartphone size={24} /> },
  ];

  // File upload state (moved from AssignmentFormStep)
  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;
  const maxFiles = 6;
  const [fileState, fileHandlers] = useFileUpload({
    accept: "image/svg+xml,image/png,image/jpeg,image/jpg,image/gif",
    maxSize,
    multiple: true,
    maxFiles,
  });
  const { files, isDragging, errors } = fileState;
  const {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    removeFile,
    clearFiles,
    getInputProps,
  } = fileHandlers;

  const form = useForm<TaskFormType>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      tenant: '',
      requestType: '',
      category: '',
      priority: 'low',
      assignedTo: '',
      notify: false,
      permissionToEnter: false,
      title: '',
      description: '',
      status: 'Open',
      notify_assignee: "none",
    },
  });

  // Fetch tenants
  useEffect(() => {
    const fetchTenants = async () => {
      setIsLoadingTenants(true);
      try {
        const response = await fetch('/api/people/tenants', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch tenants');
        const data = await response.json();
        setTenants(data);
      } catch {
        setTenants([]);
      } finally {
        setIsLoadingTenants(false);
      }
    };
    fetchTenants();
  }, []);

  // Fetch company members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/company/members', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setCompanyMembers(data);
      } catch {
        setCompanyMembers([]);
      }
    };
    fetchMembers();
  }, []);

  // Helper: step order
  const getStepOrder = (): StepType[] => ['intro', 'subject', 'tenant_request_type', 'assignment_property', 'attachments', 'summary'];

  // Helper: mark step completed
  const markStepCompleted = (completedStep: StepType) => {
    setCompletedSteps(prev => new Set([...prev, completedStep]));
  };

  // Helper: is step accessible
  const isStepAccessible = (targetStep: StepType) => {
    const stepOrder = getStepOrder();
    const currentStepIndex = stepOrder.indexOf(step);
    const targetStepIndex = stepOrder.indexOf(targetStep);
    if (targetStepIndex < currentStepIndex) return true;
    const previousStep = stepOrder[targetStepIndex - 1];
    return completedSteps.has(previousStep);
  };

  // Navigation
  const handleNext = () => {
    console.log('handleNext called, current step:', step);
    const stepOrder = getStepOrder();
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      markStepCompleted(step);
      setStep(stepOrder[currentIndex + 1]);
    } else {
      handleSubmit();
    }
  };
  const handlePrevious = () => {
    const stepOrder = getStepOrder();
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  // Convert file to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleSubmit = async () => {
    try {
      // Convert files to base64 for backend
      let filesToSend: { file_url: string; file_name: string; file_type: string }[] = [];
      if (files.length > 0) {
        const fileResults = await Promise.all(
          files.map(async (filePreview) => {
            if (!filePreview.file) return null;
            const base64 = await fileToBase64(filePreview.file);
            return {
              file_url: base64,
              file_name: filePreview.file.name,
              file_type: filePreview.file.type,
            };
          })
        );
        filesToSend = fileResults.filter((f): f is { file_url: string; file_name: string; file_type: string } => !!f);
      }

      // Map form fields to backend fields
      const payload = {
        subject: form.getValues('title'),
        description: form.getValues('description'),
        priority: form.getValues('priority'),
        task_status: {
          "Open": { date: new Date().toISOString(), value: true },
          "In-progress": { date: null, value: null },
          "Work-order-created": { date: null, value: null },
          "Request-canceled": { date: null, value: null },
          "Completed": { date: null, value: null }
        },
        task_type: 'one-time', // or map if you have a type field
        request_type: form.getValues('requestType'),
        request_specific: form.getValues('category'),
        assignees: form.getValues('assignedTo') || null,
        notify_assignee: form.getValues('notify_assignee'),
        permit_enter: form.getValues('permissionToEnter'),
        tenant_id: form.getValues('tenant'),
        role: 'tenant_request',
        files: filesToSend,
      };

      const response = await fetch('/api/tasks/tenant-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create tenant request');
      }

      toast.success('Tenant request created successfully');
      router.push('/tasks');
    } catch (error) {
      console.error('Error creating tenant request:', error);
      toast.error('Failed to create tenant request. Please try again.');
    }
  };

  const renderIntroForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Getting Started</h1>
      <p className="mb-6 text-muted-foreground">Let&apos;s set up a new tenant request in your system.</p>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-medium text-primary">Adding a new tenant request</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="relative w-[300px] h-[300px]">
            <Image
              src="/assets/figures/add-task.png"
              alt="Adding Prospect Illustration"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
         
          <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
            Once created, the tenant request will be added to the task list and assigned to the selected assignee.
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleNext}>Next</Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderSubjectForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)}>
        <h1 className="mb-6 text-2xl font-bold">Task Subject & Description</h1>
        <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div
              key="subject-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">What is the subject of this task?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
            <motion.div
              key="description-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">What is the description of this task?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add task description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          </motion.div>
          <div className="flex w-full justify-between mt-8">
            <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
            <Button onClick={handleNext} type="submit">Next</Button>
          </div>
        </div>
      </form>
    </Form>
  );

  const renderTenantRequestTypeForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)}>
        <h1 className="mb-6 text-2xl font-bold">Tenant Request Type</h1>
        <p className="mb-6 text-muted-foreground">Provide information about the tenant and the type of request.</p>
        <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div
              key="tenant-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">Which tenant is this request for?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="tenant"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TenantCombobox
                          tenants={tenants}
                          value={field.value}
                          onValueChange={field.onChange}
                          isLoading={isLoadingTenants}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            <motion.div
              key="request-type-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">What type of request is this?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="Select request type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="complaint">Complaint</SelectItem>
                            <SelectItem value="inquiry">General Inquiry</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            <motion.div
              key="category-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">What category does this request fall under?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full bg-background">
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="flex w-full justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  );

  // Assignment & Property step
  const renderAssignmentPropertyForm = () => (
    <Form {...form}>
     <form onSubmit={form.handleSubmit(handleNext)}>
        <h1 className="mb-6 text-2xl font-bold">Assignment</h1>
        <p className="mb-6 text-muted-foreground">Set who will be responsible for this task.</p>
        <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div
              key="status-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">What is the status of this task?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="status" className="bg-background w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent align="start">
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In-progress">In Progress</SelectItem>
                            <SelectItem value="Work-order-created">Work Order Created</SelectItem>
                            <SelectItem value="Request-canceled">Request Canceled</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
            
            <motion.div
              key="priority-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">What priority level should this task have?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="priority" className="bg-background w-full">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent align="start">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>

            <motion.div
              key="assignee-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">Who should be assigned to this task?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              id="assignedTo"
                              variant="outline"
                              role="combobox"
                              aria-expanded={assigneeOpen}
                              className="w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                            >
                              <span className={cn("truncate", !field.value && "text-muted-foreground")}> 
                                {field.value
                                  ? companyMembers.find((member) => member.id === field.value)
                                    ? `${companyMembers.find((member) => member.id === field.value)?.first_name} ${companyMembers.find((member) => member.id === field.value)?.last_name}`
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
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput placeholder="Search assignee..." />
                              <CommandEmpty>No assignee found.</CommandEmpty>
                              <CommandList>
                                <CommandGroup>
                                  {companyMembers.map((member: { id: string; first_name: string; last_name: string }) => (
                                    <CommandItem
                                      key={member.id}
                                      value={`${member.first_name} ${member.last_name}`}
                                      onSelect={() => {
                                        const newAssigneeId = field.value === member.id ? "" : member.id;
                                        field.onChange(newAssigneeId);
                                        setAssigneeOpen(false);
                                      }}
                                    >
                                      {member.first_name} {member.last_name}
                                      {field.value === member.id && (
                                        <Check size={16} strokeWidth={2} className="ml-auto" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
            
            {/* Conditional Rendering for Assignee Notification with Animation */}
            <AnimatePresence>
              {form.watch('assignedTo') && (
                <motion.div
                  key="notify-field" 
                  initial={{ opacity: 0, height: 0, y: -10 }} // Start hidden and slightly above
                  animate={{ opacity: 1, height: 'auto', y: 0 }} // Slide down and fade in
                  exit={{ opacity: 0, height: 0, y: -10 }} // Slide up and fade out
                  transition={{ duration: 0.3, ease: "easeInOut" }} // Smooth transition
                  className="flex flex-col items-center justify-center gap-2 w-full overflow-hidden" // Added overflow-hidden
                >
                  {/* RadioGroup for Assignee Notification */}
                  <div className="w-full max-w-md">
                    <FormField
                      control={form.control}
                      name="notify_assignee"
                      render={({ field }) => (
                        <fieldset className="space-y-4 mt-4 rounded-lg border p-4">
                          <legend className="text-foreground text-base leading-none font-medium mb-3">
                            Notify Assignee By:
                          </legend>
                          <div className="flex justify-center w-full">
                            <RadioGroup
                              className="flex gap-5"
                              value={field.value || "none"}
                              onValueChange={field.onChange}
                            >
                              {notificationOptions.map((item) => (
                                <label
                                  key={item.value}
                                  className="flex flex-col items-center cursor-pointer m-0 p-0"
                                  style={{ minWidth: 80 }}
                                >
                                  <RadioGroupItem
                                    id={`assignee-notify-${item.value}`}
                                    value={item.value}
                                    className="peer sr-only after:absolute after:inset-0"
                                  />
                                  <span
                                    className={`flex items-center justify-center rounded-lg border shadow-sm transition-colors w-20 h-20 text-center text-lg
                                      ${field.value === item.value ? "border-ring bg-accent" : "border-input bg-background"}
                                      has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70
                                    `}
                                  >
                                    {item.icon}
                                  </span>
                                  <span className="flex flex-row items-center gap-2 mt-2">
                                    {field.value === item.value ? (
                                      <CheckIcon size={16} className="text-green-600" aria-hidden="true" />
                                    ) : (
                                      <MinusIcon size={16} className="text-muted-foreground" aria-hidden="true" />
                                    )}
                                    <span className="text-xs font-medium">{item.label}</span>
                                  </span>
                                </label>
                              ))}
                            </RadioGroup>
                          </div>
                        </fieldset>
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              key="permission-to-enter-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <div className="w-full max-w-md">
                <FormField
                  control={form.control}
                  name="permissionToEnter"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Permission to Enter</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Tenant has granted permission to enter the property
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          id="permission-to-enter-switch"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          </motion.div>
          
          <div className="flex w-full justify-between mt-8">
            <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
            <Button type="submit">Next</Button>
          </div>
        </div>
      </form>
    </Form>
  );

  const renderAttachmentsForm = () => (
    <AssignmentFormStep
      handlePrevious={handlePrevious}
      handleNext={handleNext}
      files={files}
      isDragging={isDragging}
      errors={errors}
      handleDragEnter={handleDragEnter}
      handleDragLeave={handleDragLeave}
      handleDragOver={handleDragOver}
      handleDrop={handleDrop}
      openFileDialog={openFileDialog}
      removeFile={removeFile}
      clearFiles={clearFiles}
      getInputProps={getInputProps}
    />
  );

  const renderSummaryForm = () => {
    const stepOrder = getStepOrder();
    const displayNames: Record<StepType, string> = {
      intro: 'Intro',
      subject: 'Subject',
      tenant_request_type: 'Tenant Request Type',
      assignment_property: 'Assignment',
      attachments: 'Attachments',
      summary: 'Summary',
    };

    const allAgreementsChecked = () => {
      // Add logic to check if all required agreements are checked
      // For now, let's check the two existing checkboxes
      return agreeAccuracy;
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}> 
          <h1 className="mb-6 text-2xl font-bold">Summary</h1>
          <p className="mb-6 text-muted-foreground">
            Please review the task details and confirm the agreements below before submitting.
          </p>

          <Card className="overflow-hidden border shadow-sm border-border bg-background/5 mb-8">
            <CardContent className="p-6">
            <h2 className="text-lg font-medium mb-4">Adding Task</h2>
              <div className="space-y-3">
                {stepOrder.map((stepName) => {
                  // Exclude the 'summary' step itself from the status list
                  if (stepName === 'summary') return null; 
                  const isCompleted = completedSteps.has(stepName);
                  const displayName = displayNames[stepName];
                  return (
                    <div
                      key={stepName}
                      className="flex items-center justify-between rounded-lg bg-muted/20 p-4 border border-border"
                    >
                      <span className="font-medium">{displayName}</span>
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted/50">
                        {/* Only show checkmark if completed */}
                        {isCompleted ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                           <span className="text-xs text-muted-foreground">-</span> // Indicate not completed
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border shadow-sm border-border bg-background/5 mb-8">
            <CardContent className="p-6">
            <h2 className="text-lg font-medium mb-4">Application Status</h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="accuracy-agreement"
                    checked={agreeAccuracy}
                    onCheckedChange={(checked) => setAgreeAccuracy(checked === true)}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="accuracy-agreement" className="font-medium">
                      Information Accuracy
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      I confirm that all information provided for this task is accurate.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} type="button">
              Previous
            </Button>
            <Button type="submit" disabled={!allAgreementsChecked()}>
              Submit Task
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Stepper sidebar */}
      <div className="w-72 border-r bg-muted/10 p-6 overflow-y-auto">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Add a Tenant Request</h2>
        <div className="relative ml-3">
          {getStepOrder().map((stepName, index) => {
            const isAccessible = isStepAccessible(stepName);
            const isActive = step === stepName;
            const isCompleted = completedSteps.has(stepName);
            const stepOrder = getStepOrder();
            const displayNames: Record<StepType, string> = {
              intro: 'Intro',
              subject: 'Subject',
              tenant_request_type: 'Tenant Request Type',
              assignment_property: 'Assignment',
              attachments: 'Attachments',
              summary: 'Summary',
            };
            const displayName = displayNames[stepName];
            return (
              <div key={stepName} className="relative mb-8">
                {index < stepOrder.length - 1 && (
                  <div className={cn(
                    "absolute left-[14px] top-[28px] h-[calc(100%+4px)] w-0.5 bg-border",
                    isCompleted ? "bg-green-600" : ""
                  )} />
                )}
                <button
                  onClick={() => isAccessible && setStep(stepName)}
                  className="group flex items-center gap-3"
                  disabled={!isAccessible}
                >
                  <div
                    className={cn(
                      "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                      isActive
                        ? "bg-green-600 text-white"
                        : isCompleted
                        ? "bg-green-600/80 text-white"
                        : "border border-border bg-background text-muted-foreground",
                      !isAccessible ? "opacity-50" : ""
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : !isAccessible ? <Lock className="h-3 w-3" /> : index + 1}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-green-600" : isCompleted ? "text-green-600/80" : "text-muted-foreground"
                  )}>{displayName}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-3xl">
            {step === 'intro' && renderIntroForm()}
            {step === 'subject' && renderSubjectForm()}
            {step === 'tenant_request_type' && renderTenantRequestTypeForm()}
            {step === 'assignment_property' && renderAssignmentPropertyForm()}
            {step === 'attachments' && renderAttachmentsForm()}
            {step === 'summary' && renderSummaryForm()}
          </div>
        </div>
      </div>
    </div>
  );
} 