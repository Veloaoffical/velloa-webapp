'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

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

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface AssigneesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
}

export function AssigneesDialog({ open, onOpenChange, taskDetails }: AssigneesDialogProps) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>(taskDetails.assignees || '');
  const [notifyAssignee, setNotifyAssignee] = React.useState(true);
  const [assigneesOpen, setAssigneesOpen] = React.useState(false);

  // Fetch users on mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/company/members');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignees: selectedAssignee,
          notify_assignee: notifyAssignee
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
          <DialogTitle className="text-xl">Assignees</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label>Assignee</Label>
            <Popover open={assigneesOpen} onOpenChange={setAssigneesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assigneesOpen}
                  className="w-full h-[42px] mt-2 justify-between"
                >
                  {selectedAssignee ? (
                    users.find((user) => user.id === selectedAssignee)?.first_name + ' ' +
                    users.find((user) => user.id === selectedAssignee)?.last_name
                  ) : (
                    "Select assignee"
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.id}
                          onSelect={(currentValue) => {
                            setSelectedAssignee(currentValue === selectedAssignee ? "" : currentValue);
                            setAssigneesOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAssignee === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{user.first_name} {user.last_name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedAssignee && (
            <div className="flex items-center justify-between">
              <Label htmlFor="notify" className="text-base">Notify Assignee</Label>
              <Switch
                id="notify"
                checked={notifyAssignee}
                onCheckedChange={setNotifyAssignee}
              />
            </div>
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