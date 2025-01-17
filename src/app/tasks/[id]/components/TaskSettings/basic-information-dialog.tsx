'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

interface BasicInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
}

export function BasicInformationDialog({ open, onOpenChange, taskDetails }: BasicInformationDialogProps) {
  const [formData, setFormData] = React.useState({
    subject: taskDetails.subject,
    description: taskDetails.description
  });

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description
        })
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Basic Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="subject">Title</Label>
              <Input 
                id="subject" 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="h-[42px] mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="min-h-[150px] mt-2"
              />
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