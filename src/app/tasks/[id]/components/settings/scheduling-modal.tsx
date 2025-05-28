'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Task } from '../../TaskDetailsClient'; // Import Task type if needed for defaults
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarCheck, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import CalendarInput from '@/components/calendarwithmonthsinput';
import { motion, AnimatePresence } from "framer-motion";
import { useId } from 'react'; // Import useId

// Define the allowed task types
type TaskType = 'one-time' | 'recurring';

// Define the allowed frequency types
type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';
const allowedFrequencies: FrequencyType[] = ['daily', 'weekly', 'monthly', 'yearly'];

// Define the validation schema based on SchedulingPage fields
const schedulingSchema = z.object({
  taskType: z.enum(['one-time', 'recurring']).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
}).refine(data => {
  if (data.taskType === 'recurring') {
    return !!data.frequency && !!data.startDate && !!data.dueDate;
  }
  if (data.taskType === 'one-time') {
    return !!data.dueDate;
  }
  return true; // Allow empty if no taskType selected initially
}, {
  message: "Please complete all required fields based on the task type.",
  // You might want to refine this to target specific fields
});

type SchedulingFormValues = z.infer<typeof schedulingSchema>;

interface SchedulingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task; // Pass taskDetails to pre-fill form if needed
  onSave: (data: SchedulingFormValues) => Promise<void>;
  role?: string; // Add role prop
}

export function SchedulingModal({ open, onOpenChange, taskDetails, onSave, role }: SchedulingModalProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const id = useId(); // Add useId hook

  const form = useForm<SchedulingFormValues>({
    resolver: zodResolver(schedulingSchema),
    defaultValues: {
      // Set taskType based on role or existing task details
      taskType: role === 'tenant_request'
        ? 'one-time'
        : (taskDetails.task_type === 'one-time' || taskDetails.task_type === 'recurring')
          ? taskDetails.task_type as TaskType
          : undefined,
      // Validate and assign frequency
      frequency: (() => {
        const freq = (taskDetails as Task & { frequency?: unknown }).frequency;
        return typeof freq === 'string' && allowedFrequencies.includes(freq as FrequencyType) ? freq as FrequencyType : undefined;
      })(),
      startDate: taskDetails.start_date ? new Date(taskDetails.start_date) : undefined,
      dueDate: taskDetails.due_date ? new Date(taskDetails.due_date) : undefined,
      // Initialize other fields based on taskDetails if applicable
    },
  });

  // Add watch calls needed from scheduling-page
  const { control, watch, reset, handleSubmit } = form;
  const taskType = watch('taskType');
  const frequency = watch('frequency');
  const startDate = watch('startDate');

  const onSubmit = async (data: SchedulingFormValues) => {
    setIsSaving(true);
    try {
      await onSave(data);
      onOpenChange(false); // Close modal on successful save
      reset(); // Reset form state on successful save
    } catch (error) { 
      // Error is logged in the parent save handler
      // You could show a specific error message here if needed
      console.error("Save failed in modal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle modal close/cancel
  const handleClose = () => {
    onOpenChange(false);
    reset(); // Reset form state on close
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Task Scheduling</DialogTitle>
          <DialogDescription>
            Set the schedule for this task. Choose if it&apos;s a one-time or recurring task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Conditionally render based on role */}
            {role === 'tenant_request' ? (
              // Tenant Request: Only show Due Date
              <div className="space-y-4">
                <div className="flex justify-center">
                  <FormLabel className="text-base">When is this task due?</FormLabel>
                </div>
                <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                  <FormField
                    control={control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <CalendarInput
                            value={field.value}
                            onChange={field.onChange}
                            className="w-full"
                            placeholder="Select due date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              // Default: Show full scheduling options
              <div className="space-y-8">
                <div className="space-y-6">
                  {/* Task Type Selection */}
                  <FormField
                    control={control}
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
                                <p className="text-sm font-medium leading-none">One-time Work Order</p>
                                <p className="text-xs text-muted-foreground">Needs to be completed once by a specific due date.</p>
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
                                <p className="text-sm font-medium leading-none">Recurring Work Order</p>
                                <p className="text-xs text-muted-foreground">Repeats on a regular schedule.</p>
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
                    {taskType && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Separator className="my-6"/>

                        {/* Different content for recurring vs one-time tasks */}
                        {taskType === 'recurring' ? (
                          <div className="space-y-6">
                            {/* Recurring Frequency Selection */}
                            <div className="space-y-4">
                              <div className="flex justify-center">
                                <FormLabel className="text-base">What is the frequency?</FormLabel>
                              </div>
                              <div className="max-w-md mx-auto">
                                <FormField
                                  control={control}
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
                                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
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
                              {frequency && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-4"
                                >
                                  <Separator className="mb-4" />

                                  <div className="flex justify-center">
                                    <FormLabel className="text-base">When does this task start and end?</FormLabel>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                    <motion.div
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1, duration: 0.2 }}
                                    >
                                      <FormField
                                        control={control}
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
                                        control={control}
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
                                                disabled={!startDate}
                                                minDate={startDate || undefined}
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
                          // One-time Task Due Date
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
                                  control={control}
                                  name="dueDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Due Date <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <CalendarInput
                                          value={field.value}
                                          onChange={field.onChange}
                                          className="w-full"
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
            )}
            {/* End of conditional content */}

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 