'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CustomDatePicker } from "@/components/ui/date-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  request_type: string | null;
  task_type: string | null;
  tenant: string | null;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
  assignee?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
  role: string;
  Recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface SchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
}

export function SchedulingDialog({ open, onOpenChange, taskDetails }: SchedulingDialogProps) {
  console.log('Task Details:', {
    task_type: taskDetails.task_type,
    Recurring_frequency: taskDetails.Recurring_frequency,
    start_date: taskDetails.start_date,
    end_date: taskDetails.end_date
  });

  const [formData, setFormData] = React.useState({
    task_type: taskDetails.task_type || 'one-time',
    due_date: taskDetails.due_date || '',
    Recurring_frequency: taskDetails.Recurring_frequency || '',
    start_date: taskDetails.start_date || '',
    end_date: taskDetails.due_date || ''
  });

  console.log('Form Data:', formData);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form data to saved values when closing
      setFormData({
        task_type: taskDetails.task_type || 'one-time',
        due_date: taskDetails.due_date || '',
        Recurring_frequency: taskDetails.Recurring_frequency || '',
        start_date: taskDetails.start_date || '',
        end_date: taskDetails.due_date || ''
      });
    }
    onOpenChange(open);
  };

  const handleSave = async () => {
    try {
      const payload = {
        task_type: formData.task_type,
        ...(formData.task_type === 'one-time' ? {
          due_date: formData.due_date,
          Recurring_frequency: null,
          start_date: null,
          end_date: null
        } : {
          due_date: null,
          Recurring_frequency: formData.Recurring_frequency,
          start_date: formData.start_date,
          end_date: formData.end_date
        })
      };

      const response = await fetch(`/api/tasks/${taskDetails.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
      }

      toast.success('Task updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Scheduling</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Task Type</Label>
            <RadioGroup
              value={formData.task_type}
              onValueChange={(value) => setFormData({...formData, task_type: value})}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              <div className="relative">
                <RadioGroupItem
                  value="one-time"
                  id="one-time"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="one-time"
                  className="flex flex-col gap-1 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-muted-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary hidden peer-data-[state=checked]:block [&:has([data-state=checked])]:block"></div>
                    </div>
                    <span className="font-medium">One-time Task</span>
                  </div>
                  <span className="text-xs text-muted-foreground pl-7">(Single occurrence)</span>
                  <span className="text-xs text-muted-foreground pl-7">Create a task that needs to be completed once by a specific due date.</span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem
                  value="recurring"
                  id="recurring"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="recurring"
                  className="flex flex-col gap-1 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-muted-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary hidden peer-data-[state=checked]:block [&:has([data-state=checked])]:block"></div>
                    </div>
                    <span className="font-medium">Recurring Task</span>
                  </div>
                  <span className="text-xs text-muted-foreground pl-7">(Repeating schedule)</span>
                  <span className="text-xs text-muted-foreground pl-7">Set up a task that repeats on a regular schedule with defined frequency.</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.task_type === 'one-time' ? (
            <div>
              <Label className="text-base font-medium">Due Date *</Label>
              <div className="mt-2">
                <CustomDatePicker
                  label="Select due date"
                  value={formData.due_date}
                  onChange={(value: string) => setFormData({...formData, due_date: value})}
                  className="w-full h-[42px] bg-background"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-base font-medium">Frequency *</Label>
                <div className="flex h-9 items-center rounded-md border border-input bg-background p-0.5 text-muted-foreground mt-2 max-w-[400px]">
                  {[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFormData({...formData, Recurring_frequency: item.value})}
                      className={cn(
                        "flex-1 items-center justify-center whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                        formData.Recurring_frequency === item.value 
                          ? "bg-green-600 text-white hover:bg-green-500" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mt-2">
                    <CustomDatePicker
                      label="Select start date"
                      value={formData.start_date}
                      onChange={(value: string) => setFormData({...formData, start_date: value})}
                      className="w-full h-[42px] bg-background"
                    />
                  </div>
                </div>
                <div>
                  <div className="mt-2">
                    <CustomDatePicker
                      label="Select end date"
                      value={formData.end_date}
                      onChange={(value: string) => setFormData({...formData, end_date: value})}
                      className="w-full h-[42px] bg-background"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#16B364] hover:bg-[#16B364]/90">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 