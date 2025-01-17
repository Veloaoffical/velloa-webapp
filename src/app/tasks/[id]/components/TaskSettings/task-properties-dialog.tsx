'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

interface TaskPropertiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
}

export function TaskPropertiesDialog({ open, onOpenChange, taskDetails }: TaskPropertiesDialogProps) {
  const [formData, setFormData] = React.useState({
    status: taskDetails.status,
    priority: taskDetails.priority,
  });

  const handleSave = async () => {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: formData.status,
          priority: formData.priority,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Server response:', error);
        throw new Error('Failed to update task settings');
      }

      toast.success('Task settings updated successfully');
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating task settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update task settings');
    }
  };

  // Early return if not in browser
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Task Properties</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger className="h-[42px] mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger className="h-[42px] mt-2">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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