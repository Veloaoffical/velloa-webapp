'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseISO } from 'date-fns';
import { Task } from "../../TaskDetailsClient"; // Adjust the import path if necessary

interface TaskPropertiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
  onSave: (updates: { task_status: Task['task_status']; priority: string }) => Promise<void>;
}

// Helper function to get the latest active status (copied from TaskOverview)
const getCurrentStatusInfo = (taskStatus: Task['task_status']): { name: string | null; date: string | null } => {
  if (!taskStatus) return { name: null, date: null };

  let latestStatus: { name: string | null; date: string | null } = { name: null, date: null };
  let latestDate: Date | null = null;

  Object.entries(taskStatus).forEach(([key, value]) => {
    if (value.value === true && value.date) {
      const currentDate = parseISO(value.date);
      if (!latestDate || currentDate > latestDate) {
        latestDate = currentDate;
        latestStatus = { name: key, date: value.date };
      }
    }
  });

  return latestStatus;
};

// Define your available statuses and priorities
// These might come from an API or be defined constants
const defaultStatuses = ["Open", "In Progress", "Completed", "Cancelled"];
const workOrderStatuses = [
  "Work-order Started",
  "Vendor Approval",
  "Vendor Decline",
  "Vendor Bill",
  "Vendor Paid",
  "Owner Approval",
  "Owner Decline",
  "Job Complete"
];
const priorities = ["Low", "Medium", "High", "Urgent"];

export function TaskPropertiesModal({ open, onOpenChange, taskDetails, onSave }: TaskPropertiesModalProps) {
  // Determine statuses based on role
  const getStatusesForRole = (role: Task['role']) => {
      return role === 'work_order' ? workOrderStatuses : defaultStatuses;
  };

  // Get the actual current status key from task_status using the helper
  const currentStatusKey = getCurrentStatusInfo(taskDetails.task_status).name;
  const availableStatuses = getStatusesForRole(taskDetails.role);

  // Initial state setup
  const [status, setStatus] = React.useState(() => {
      // If a current status exists and is in the available list, use it. Otherwise, default.
      return currentStatusKey && availableStatuses.includes(currentStatusKey) ? currentStatusKey : availableStatuses[0];
  });

  const [priority, setPriority] = React.useState(taskDetails.priority || priorities[1]);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset state when taskDetails change or modal opens
  React.useEffect(() => {
    if (open) {
      // Recalculate available statuses based on potentially updated taskDetails
      const currentAvailableStatuses = getStatusesForRole(taskDetails.role);
      
      // Get the *current* actual status from the potentially updated taskDetails
      const latestStatusKey = getCurrentStatusInfo(taskDetails.task_status).name;
      
      // Set status state: use latest if valid, else default for the role
      setStatus(latestStatusKey && currentAvailableStatuses.includes(latestStatusKey) ? latestStatusKey : currentAvailableStatuses[0]);

      // Use the same helper logic for resetting priority (handles case difference)
      const getResetPriority = () => {
        const currentPriorityLower = taskDetails.priority?.toLowerCase();
        const matchedPriority = priorities.find(p => p.toLowerCase() === currentPriorityLower);
        return matchedPriority || priorities[1]; // Default to Medium
      };
      setPriority(getResetPriority());
    }
  }, [open, taskDetails]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newTaskStatus = { ...(taskDetails.task_status || {}) };
      const currentDate = new Date().toISOString();

      // Determine the key and value to update based on the selected status string
      let targetKey: string | null = null;
      let targetValue: boolean | null = null;

      if (status === "Vendor Decline") {
        targetKey = "Vendor Approval";
        targetValue = false;
      } else if (status === "Owner Decline") {
        targetKey = "Owner Approval";
        targetValue = false;
      } else if (status) { // For all other non-null statuses, treat as approval/completion
        targetKey = status;
        targetValue = true;
      }

      // Update the target key in the task_status object
      if (targetKey !== null && targetValue !== null) {
        // Ensure the key exists before setting its properties
        if (!(targetKey in newTaskStatus)) {
            newTaskStatus[targetKey] = { date: null, value: null };
        }
        newTaskStatus[targetKey] = {
          ...(newTaskStatus[targetKey]), // Keep existing info if modifying partially (though unlikely here)
          value: targetValue,
          date: currentDate,
        };
      }

      const priorityToSend = priority.toLowerCase();

      await onSave({ task_status: newTaskStatus, priority: priorityToSend });
      onOpenChange(false); // Close modal on successful save
    } catch (error) {
      console.error("Failed to save task properties:", error);
      // Optionally show an error message to the user
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Task Properties</DialogTitle>
          <DialogDescription>
            Update the status and priority for this task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="">
              Status
            </Label>
            <Select value={status || ''} onValueChange={setStatus}>
              <SelectTrigger id="status" className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {getStatusesForRole(taskDetails.role).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="">
              Priority
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority" className="col-span-3">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="default" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
