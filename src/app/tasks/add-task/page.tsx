'use client';

import { useState, useId, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, Lock, AlertCircleIcon, ImageIcon, UploadIcon, XIcon, CalendarCheck, Repeat2, ChevronsUpDown } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarInput from '@/components/calendarwithmonthsinput';
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
import { formatBytes, useFileUpload, FilePreview } from "@/hooks/use-file-upload";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from '@/components/ui/checkbox';

interface Property {
  id: string;
  name: string;
  address?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Unit {
  id: string;
  unit_id?: string;
  unit_name: string;
  beds?: number | null;
  baths?: number | null;
  market_rent?: number | null;
  status?: string;
  size?: string | null;
}

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum([
    "start",
    "in_progress",
    "completed"
  ]).optional(),
  taskType: z.enum(["one-time", "recurring"]).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  assignedTo: z.string().optional(),
  property: z.string().optional(),
  unit: z.string().optional(),
  notify: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.taskType === "recurring") {
      return !!data.frequency && !!data.startDate && !!data.dueDate && data.startDate < data.dueDate;
    }
    return true;
  },
 
);

type TaskFormType = z.infer<typeof taskSchema>;

// Add AssignmentFormStep as a component
function AssignmentFormStep({ handlePrevious, handleNext, files, isDragging, errors, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, clearFiles, getInputProps }: { handlePrevious: () => void; handleNext: () => void; files: FilePreview[]; isDragging: boolean; errors: string[]; handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void; handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void; handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void; handleDrop: (e: React.DragEvent<HTMLDivElement>) => void; openFileDialog: () => void; removeFile: (id: string) => void; clearFiles: () => void; getInputProps: () => React.InputHTMLAttributes<HTMLInputElement> }) {
  const maxSizeMB = 5;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Attachments</h1>
      <p className="mb-6 text-muted-foreground">Upload images, documents, or other files to help with task management.</p>
      <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-2 w-full"
          >
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
                    SVG, PNG, JPG or GIF (max. {maxSizeMB}MB)
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
          </motion.div>
        </motion.div>
        
        <div className="flex w-full justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious}>Previous</Button>
          <Button onClick={handleNext}>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default function AddTaskPage() {
  const id = useId();
  const router = useRouter();
  type StepType = 'intro' | 'subject' | 'type_due_status' | 'assignment' | 'attachments' | 'summary';
  const [step, setStep] = useState<StepType>('intro');
  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set());
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskFormType>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: undefined,
      status: undefined,
      taskType: undefined,
      assignedTo: '',
      property: '',
      unit: '',
      notify: false,
    },
  });

  // Add file upload state here
  const maxSizeMB = 5;
  const maxFiles = 6;
  const [
    { files, isDragging, errors },
    fileUploadHandlers
  ] = useFileUpload({
    accept: "image/svg+xml,image/png,image/jpeg,image/jpg,image/gif",
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: true,
    maxFiles,
  });

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
        const response = await fetch('/api/property', {
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
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]); // Set empty array on error
      }
    };

    fetchProperties();
  }, []);

  // Helper: step order
  const getStepOrder = (): StepType[] => ['intro', 'subject', 'type_due_status', 'assignment', 'attachments', 'summary'];

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
      setIsSubmitting(true);
      // Validate task type is selected
      if (!form.getValues('taskType')) {
        toast.error('Please select a task type (One-time or Recurring)');
        return;
      }
      // Add validation for recurring tasks
      if (form.getValues('taskType') === 'recurring') {
        if (!form.getValues('frequency')) {
          toast.error('Please select a frequency for recurring task');
          return;
        }
        if (!form.getValues('startDate')) {
          toast.error('Please select a start date for recurring task');
          return;
        }
        if (!form.getValues('dueDate')) {
          toast.error('Please select an end date for recurring task');
          return;
        }
        // Validate that end date is after start date
        const startDate = form.getValues('startDate');
        const dueDate = form.getValues('dueDate');
        if (startDate instanceof Date && dueDate instanceof Date && !isNaN(startDate.getTime()) && !isNaN(dueDate.getTime()) && startDate >= dueDate) {
          toast.error('End date must be after start date');
          return;
        }
      } else if (form.getValues('taskType') === 'one-time') {
        // Validate one-time task has due date
        if (!form.getValues('dueDate')) {
          toast.error('Please select a due date for one-time task');
          return;
        }
      }

      // Convert files to base64 and prepare for backend
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

      const taskData = {
        subject: form.getValues('title'),
        description: form.getValues('description'),
        priority: form.getValues('priority'),
        status: form.getValues('status'),
        task_type: form.getValues('taskType'),
        Recurring_frequency: form.getValues('taskType') === 'recurring' ? form.getValues('frequency') : null,
        start_date: form.getValues('startDate'),
        due_date: form.getValues('dueDate'),
        assignees: form.getValues('assignedTo') || null,
        property_id: form.getValues('property') || null,
        unit_id: form.getValues('unit') || null,
        notify_assignee: form.getValues('notify'),
        role: 'task',
        files: filesToSend,
      };

      // 1. Create the task (with files)
      const response = await fetch('/api/tasks/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      // No need for separate file upload step
      // const createdTask = await response.json();
      // const maintenance_id = createdTask.id || createdTask.maintenance_id;

      toast.success('Task created successfully');
      router.push('/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIntroForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Getting Started</h1>
      <p className="mb-6 text-muted-foreground">Let&apos;s set up a new prospect in your system.</p>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-medium text-primary">Adding a new task</CardTitle>
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
            Once created, the task will be added to the task list and assigned to the selected assignee.
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
        <div className="max-w-3xl mx-auto"> 
        <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
          <CardContent className="p-0">
            <div className="p-6 space-y-8">
              <div className="space-y-6">
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
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/5 p-6">
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
              <Button type="submit">Next</Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      </form>
    </Form>
  );

  const renderTypeDueStatusForm = () => (
    <Form {...form}>
      <form onSubmit={(e) => {
        e.preventDefault();
        // Validate form values for this step
        const formValues = form.getValues();
        if (!formValues.taskType) {
          toast.error('Please select a task type (One-time or Recurring)');
          return;
        }
        
        if (formValues.taskType === 'recurring') {
          if (!formValues.frequency) {
            toast.error('Please select a frequency for recurring task');
            return;
          }
          if (!formValues.startDate) {
            toast.error('Please select a start date for recurring task');
            return;
          }
          if (!formValues.dueDate) {
            toast.error('Please select an end date for recurring task');
            return;
          }
          // Validate that end date is after start date
          if (formValues.startDate >= formValues.dueDate) {
            toast.error('End date must be after start date');
            return;
          }
        } else if (formValues.taskType === 'one-time') {
          // Validate one-time task has due date
          if (!formValues.dueDate) {
            toast.error('Please select a due date for one-time task');
            return;
          }
        }
        
        // If all validation passes, proceed to next step
        handleNext();
      }}>
        <h1 className="mb-6 text-2xl font-bold">Task Type, Due Date & Status</h1>
        <p className="mb-6 text-muted-foreground">Choose how this task should be scheduled and when it&apos;s due.</p>
        
        <div className="space-y-8">
          <div className="space-y-6">
            {/* Task Type Selection */}
            <FormField
              control={form.control}
              name="taskType"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-center">
                    <FormLabel className="text-base">What type of task is this?</FormLabel>
                  </div>
                  <FormControl>
                    <RadioGroup
                      className="grid grid-cols-2 gap-4 max-w-md mx-auto"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {/* One-time Task Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem
                          value="one-time"
                          id={`${id}-one-time`}
                          className="sr-only after:absolute after:inset-0"
                        />
                        <CalendarCheck className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">One-time Task</p>
                          <p className="text-xs text-muted-foreground">Create a task that needs to be completed once by a specific due date.</p>
                        </div>
                      </label>
                      {/* Recurring Task Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem
                          value="recurring"
                          id={`${id}-recurring`}
                          className="sr-only after:absolute after:inset-0"
                        />
                        <Repeat2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Recurring Task</p>
                          <p className="text-xs text-muted-foreground">Set up a task that repeats on a regular schedule with defined frequency.</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Show content based on task type selection */}
            <AnimatePresence mode="sync">
              {form.watch('taskType') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Separator className="my-6"/>
                  
                  {/* Different content for recurring vs one-time tasks */}
                  {form.watch('taskType') === 'recurring' ? (
                    <div className="space-y-6">
                      {/* Recurring Frequency Selection */}
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <FormLabel className="text-base">What is the frequency of this recurring task?</FormLabel>
                        </div>
                        <div className="max-w-md mx-auto">
                          <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="block mb-2">How often should this task repeat? <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <div className="inline-flex h-9 items-center rounded-md border border-input bg-background p-0.5 text-muted-foreground w-full">
                                    {["daily","weekly","monthly","yearly"].map((item) => (
                                      <button
                                        key={item}
                                        type="button"
                                        onClick={() => field.onChange(item)}
                                        className={cn(
                                          "flex-1 inline-flex items-center justify-center whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                                          field.value === item 
                                            ? "bg-green-600 text-white hover:bg-green-500" 
                                            : "hover:bg-muted/50"
                                        )}
                                      >
                                        {item.charAt(0).toUpperCase() + item.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Show date fields only after frequency is selected */}
                      <AnimatePresence mode="sync">
                        {form.watch('frequency') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                          >
                            <Separator className="mb-4" />
                            
                            <div className="flex justify-center">
                              <FormLabel className="text-base">When does this recurring task start and end?</FormLabel>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                              <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1, duration: 0.2 }}
                              >
                                <FormField
                                  control={form.control}
                                  name="startDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <CalendarInput
                                          value={field.value}
                                          onChange={field.onChange}
                                          className="w-full"
                                          placeholder="Select start date"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                              
                              <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.2 }}
                              >
                                <FormField
                                  control={form.control}
                                  name="dueDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <CalendarInput
                                          value={field.value}
                                          onChange={field.onChange}
                                          className="w-full"
                                          placeholder="Select end date"
                                          disabled={!form.watch('startDate')}
                                          minDate={form.watch('startDate') || undefined}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <FormLabel className="text-base">When is this task due?</FormLabel>
                      </div>
                      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.2 }}
                        >
                          <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Due Date <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <CalendarInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="w-full "
                                    placeholder="Select due date"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
          
        <div className="flex w-full justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  );

  const renderAssignmentForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)}>
        <h1 className="mb-6 text-2xl font-bold">Assignment & Property</h1>
        <p className="mb-6 text-muted-foreground">Set who will be responsible for this task and which property it relates to.</p>
        <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div
              key="property-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <Label className="text-base">Which property is this task for?</Label>
              <div className="grid gap-1.5 w-full max-w-md">
                <FormField
                  control={form.control}
                  name="property"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={propertiesOpen}
                              className="w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                            >
                              <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                                {field.value ? properties.find(p => p.id === field.value)?.name : "Select property (Optional)"}
                              </span>
                              <ChevronsUpDown // Changed from ChevronDown
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
                              <CommandInput placeholder="Search properties..." />
                              <CommandList>
                                <CommandEmpty>No properties found.</CommandEmpty>
                                <CommandGroup>
                                  {properties.map((property) => (
                                    <CommandItem
                                      key={property.id}
                                      value={property.id} // Use property.id as value
                                      onSelect={async (currentValue) => {
                                        const newPropertyId = currentValue === field.value ? "" : currentValue;
                                        field.onChange(newPropertyId);
                                        form.setValue('unit', ''); // Reset unit when property changes
                                        setPropertiesOpen(false);
                                        setUnits([]); // Clear units immediately

                                        if (newPropertyId) {
                                          setIsLoadingUnits(true); // Start loading units
                                          try {
                                            const response = await fetch(`/api/property/${newPropertyId}/units`, {
                                              method: 'GET',
                                              headers: {
                                                'Content-Type': 'application/json',
                                              },
                                              credentials: 'include'
                                            });
                                            if (!response.ok) throw new Error('Failed to fetch units');
                                            const data = await response.json();
                                            setUnits(data);
                                          } catch (error) {
                                            console.error('Error fetching units:', error);
                                            toast.error('Failed to load units for this property.');
                                            setUnits([]);
                                          } finally {
                                            setIsLoadingUnits(false); // Stop loading units
                                          }
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Check
                                            className={cn(
                                              "h-4 w-4",
                                              field.value === property.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{property.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {property.address || [property.address_line_1, property.city, property.state].filter(Boolean).join(', ')}
                                          </span>
                                        </div>
                                      </div>
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

            <AnimatePresence mode="sync">
              {form.watch('property') && (
                <motion.div
                  key="unit-field" // Existing key is fine
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center gap-2 w-full overflow-hidden"
                >
                  <Label className="text-base">Which unit in the property?</Label>
                  <div className="grid gap-1.5 w-full max-w-md">
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Popover open={unitsOpen} onOpenChange={setUnitsOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={unitsOpen}
                                  className="w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isLoadingUnits || units.length === 0}
                                >
                                  <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                                    {isLoadingUnits ? "Loading units..." :
                                      field.value ? (units.find(u => u.id === field.value || u.unit_id === field.value)?.unit_name || "Select unit...") : "Select unit (Optional)"}
                                  </span>
                                  <ChevronsUpDown // Changed from Select default arrow
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
                                <Command filter={(value, search) => {
                                    const unit = units.find(u => (u.id || u.unit_id) === value);
                                    if (unit?.unit_name.toLowerCase().includes(search.toLowerCase())) return 1;
                                    return 0;
                                }}>
                                  <CommandInput placeholder="Search units..." />
                                  <CommandList>
                                    <CommandEmpty>
                                      {isLoadingUnits ? "Loading..." : units.length === 0 ? "No units available for this property." : "No units found."}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {units.map((unit) => {
                                        const unitId = unit.id || unit.unit_id || 'unknown-' + Math.random(); // Ensure a key
                                        return (
                                          <CommandItem
                                            key={unitId}
                                            value={unitId}
                                            onSelect={(currentValue) => {
                                              field.onChange(currentValue === field.value ? "" : currentValue);
                                              setUnitsOpen(false);
                                            }}
                                          >
                                            <div className="flex items-center gap-2">
                                              <Check
                                                className={cn(
                                                  "h-4 w-4",
                                                  field.value === unitId ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span className="font-medium">{unit.unit_name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {unit.beds ? `${unit.beds} bed • ` : ''}
                                                    {unit.baths ? `${unit.baths} bath • ` : ''}
                                                    {unit.size || 'N/A'} {unit.market_rent ? `• $${unit.market_rent}/month` : ''}
                                                </span>
                                              </div>
                                            </div>
                                          </CommandItem>
                                        );
                                      })}
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
              )}
            </AnimatePresence>
            
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
                            <SelectItem value="start">Start</SelectItem>
                            <SelectItem value="vendor_approval">Vendor Approval</SelectItem>
                            <SelectItem value="vendor_decline">Vendor Decline</SelectItem>
                            <SelectItem value="vendor_bill">Vendor Bill</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
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
                              <CommandList>
                                <CommandEmpty>No assignee found.</CommandEmpty>
                                <CommandGroup>
                                  {companyMembers.map((member) => (
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
            
            <motion.div
              key="notify-field"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 w-full"
            >
              <div className="w-full max-w-md">
                <FormField
                  control={form.control}
                  name="notify"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Notify Assignee(s)</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Send a notification email to the assigned person
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch 
                          id={`${id}-notify`}
                          checked={field.value}
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
      {...fileUploadHandlers}
    />
  );

  const renderSummaryForm = () => {
    const stepOrder = getStepOrder();
    const displayNames: Record<StepType, string> = {
      intro: 'Intro',
      subject: 'Subject',
      type_due_status: 'Type & Due',
      assignment: 'Assignment',
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
            <Button variant="outline" onClick={handlePrevious} type="button" disabled={isSubmitting}>
              Previous
            </Button>
            <Button type="submit" disabled={!allAgreementsChecked() || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Task'}
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
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Add a Task</h2>
        <div className="relative ml-3">
          {getStepOrder().map((stepName, index) => {
            const isAccessible = isStepAccessible(stepName);
            const isActive = step === stepName;
            const isCompleted = completedSteps.has(stepName);
            const stepOrder = getStepOrder();
            // Give user-friendly names for steps
            const displayNames: Record<StepType, string> = {
              intro: 'Intro',
              subject: 'Subject',
              type_due_status: 'Type & Due',
              assignment: 'Assignment',
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
            {step === 'type_due_status' && renderTypeDueStatusForm()}
            {step === 'assignment' && renderAssignmentForm()}
            {step === 'attachments' && renderAttachmentsForm()}
            {step === 'summary' && renderSummaryForm()}
          </div>
        </div>
      </div>
    </div>
  );
} 