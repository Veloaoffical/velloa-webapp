"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  FileSignature, 
  StickyNote, 
  AlarmClockMinus,
  AlarmClock,
  AlarmClockCheck,
  Users,
  Wrench,
  Repeat,
  DoorOpen,
  Boxes,
  Check
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

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
  owner_id?: string | null;
  tenant_id?: string | null;
  vendor_id?: string | null;
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
  role: 'task' | 'tenant_request' | 'work_order' | 'owner_request';
  Recurring_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  permit_owner: boolean | null;
  permit_enter: boolean | null;
  parts_labour: string | null;
}

interface TaskOverviewProps {
  taskDetails: Task;
  setActiveTab?: (value: string) => void;
  onAddNote?: () => void;
}

interface UpdateStatusForm {
  status: string;
  note: string;
}

interface OwnerData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

interface TenantData {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface VendorData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

export function TaskOverview({ taskDetails, setActiveTab, onAddNote }: TaskOverviewProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [personName, setPersonName] = useState<string>('Loading...');
  const router = useRouter();
  const form = useForm<UpdateStatusForm>({
    defaultValues: {
      status: taskDetails.status,
      note: ""
    }
  });

  // Fetch owner, tenant, or vendor details based on role
  useEffect(() => {
    const fetchPersonDetails = async () => {
      if (taskDetails.role === 'tenant_request') {
        if (!taskDetails.tenant_id) {
          setPersonName('No Tenant Set');
          return;
        }

        try {
          const response = await fetch('/api/people/tenants/search');
          if (!response.ok) {
            throw new Error('Failed to fetch tenant details');
          }
          const tenants = await response.json();
          const tenant = tenants.find((t: TenantData) => t.id === taskDetails.tenant_id);
          if (tenant) {
            const displayName = [tenant.first_name, tenant.last_name].filter(Boolean).join(' ');
            setPersonName(displayName || tenant.id);
          } else {
            setPersonName('Tenant not found');
          }
        } catch (error) {
          console.error('Error fetching tenant details:', error);
          setPersonName('Error loading tenant');
        }
      } else if (taskDetails.role === 'work_order') {
        if (!taskDetails.vendor_id) {
          setPersonName('No Vendor Set');
          return;
        }

        try {
          const response = await fetch('/api/people/vendor/search');
          if (!response.ok) {
            throw new Error('Failed to fetch vendor details');
          }
          const vendors = await response.json();
          const vendor = vendors.find((v: VendorData) => v.id === taskDetails.vendor_id);
          if (vendor) {
            const personFullName = [vendor.first_name, vendor.last_name].filter(Boolean).join(' ');
            const displayName = vendor.company 
              ? `${vendor.company}${personFullName ? ` (${personFullName})` : ''}`
              : personFullName || vendor.id;
            setPersonName(displayName);
          } else {
            setPersonName('Vendor not found');
          }
        } catch (error) {
          console.error('Error fetching vendor details:', error);
          setPersonName('Error loading vendor');
        }
      } else {
        if (!taskDetails.owner_id) {
          setPersonName('Not Set');
          return;
        }

        try {
          const response = await fetch('/api/people/owner/search');
          if (!response.ok) {
            throw new Error('Failed to fetch owner details');
          }
          const owners = await response.json();
          const owner = owners.find((o: OwnerData) => o.id === taskDetails.owner_id);
          if (owner) {
            const displayName = [owner.first_name, owner.last_name].filter(Boolean).join(' ');
            setPersonName(displayName || owner.company || owner.id);
          } else {
            setPersonName('Owner not found');
          }
        } catch (error) {
          console.error('Error fetching owner details:', error);
          setPersonName('Error loading owner');
        }
      }
    };

    fetchPersonDetails();
  }, [taskDetails.owner_id, taskDetails.tenant_id, taskDetails.vendor_id, taskDetails.role]);

  const handleNavigateToNotes = () => {
    if (onAddNote) {
      onAddNote();
    } else if (setActiveTab) {
      setActiveTab("notes");
    }
  };

  const handleUpdateStatus = async (data: UpdateStatusForm) => {
    try {
      const supabase = createClient();
      
      // Update task status
      const { error: statusError } = await supabase
        .from("maintenance_requests")
        .update({ status: data.status })
        .eq("id", taskDetails.id);

      if (statusError) throw statusError;

      // Add note if provided
      if (data.note.trim()) {
        const { error: noteError } = await supabase
          .from("maintenance_notes")
          .insert([{
            maintenance_id: taskDetails.id,
            note: data.note,
            note_title: `Status updated to ${formatStatus(data.status)}`
          }]);

        if (noteError) throw noteError;
      }

      // Show success page if status is complete
      if (data.status === "complete") {
        setShowStatusDialog(false);
        setShowSuccessPage(true);
        setTimeout(() => {
          setShowSuccessPage(false);
          const link = document.createElement('a');
          link.href = '/tasks';
          link.click();
        }, 2000);
      } else {
        setShowStatusDialog(false);
        router.refresh();
      }

      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'complete':
        return 'Complete';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not Set';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <AlarmClockMinus className="h-6 w-6 mb-2 text-muted-foreground" />;
      case 'in_progress':
        return <AlarmClock className="h-6 w-6 mb-2 text-muted-foreground" />;
      case 'complete':
        return <AlarmClockCheck className="h-6 w-6 mb-2 text-muted-foreground" />;
      default:
        return <AlarmClockMinus className="h-6 w-6 mb-2 text-muted-foreground" />;
    }
  };

  const formatAssigneesNames = (assignee: { profile: { first_name: string; last_name: string; }; } | null | undefined) => {
    if (!assignee) return 'Not Assigned';
    return `${assignee.profile.first_name} ${assignee.profile.last_name}`;
  };

  const formatFrequency = (frequency: string | null | undefined) => {
    if (!frequency) return null;
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {taskDetails.role === 'task' ? (
              <>
                <Button 
                  className="w-full gap-2"
                  onClick={() => {
                    form.setValue("status", "complete");
                    setShowStatusDialog(true);
                  }}
                >
                  <FileSignature className="w-4 h-4" />
                  Update Status
                </Button>
                <Button className="w-full gap-2" onClick={handleNavigateToNotes}>
                  <StickyNote className="w-4 h-4" />
                  Add Note
                </Button>
                <Link href={`/tasks/add-work-order?task_id=${taskDetails.id}`} className="w-full">
                  <Button className="w-full gap-2">
                    <Wrench className="w-4 h-4" />
                    New Work Order
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button 
                  className="w-full gap-2"
                  onClick={() => setShowStatusDialog(true)}
                >
                  <FileSignature className="w-4 h-4" />
                  Update Status
                </Button>
                <Button className="w-full gap-2" onClick={handleNavigateToNotes}>
                  <StickyNote className="w-4 h-4" />
                  Add Note
                </Button>
                <Button className="w-full gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Add Subtask
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {getStatusIcon(taskDetails.status)}
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{formatStatus(taskDetails.status)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {taskDetails.role === 'task' ? (
              <>
                <Repeat className="h-6 w-6 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">
                  {taskDetails.task_type === 'recurring' ? 'Recurring' : 'One Time'}
                </p>
              </>
            ) : (
              <>
                <Users className="h-6 w-6 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {taskDetails.role === 'tenant_request' ? 'Tenant' : taskDetails.role === 'work_order' ? 'Vendor' : 'Owner'}
                </p>
                <p className="font-medium">
                  {personName}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Users className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Assignee</p>
            <p className="font-medium">{formatAssigneesNames(taskDetails.assignee)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {taskDetails.task_type === 'recurring' ? (
              <Repeat className="h-6 w-6 mb-2 text-muted-foreground" />
            ) : (
              <FileSignature className="h-6 w-6 mb-2 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {taskDetails.task_type === 'recurring' ? 'Frequency' : 'Due Date'}
            </p>
            <p className="font-medium">
              {taskDetails.task_type === 'recurring' ? (
                <span className="flex flex-col gap-1">
                  <span>{formatFrequency(taskDetails.Recurring_frequency)}</span>
                  <span className="text-xs text-muted-foreground">
                    {taskDetails.start_date && format(parseISO(taskDetails.start_date), 'MMM d')} - {taskDetails.end_date && format(parseISO(taskDetails.end_date), 'MMM d, yyyy')}
                  </span>
                </span>
              ) : (
                taskDetails.due_date ? format(parseISO(taskDetails.due_date), 'MMM d, yyyy h:mm a') : 'Not Set'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work Order Details */}
      {taskDetails.role === 'work_order' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <FileSignature className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Owner Approval</p>
              <p className="font-medium">
                {taskDetails.permit_owner === true ? 'Granted' : 'Not Granted'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Boxes className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Parts and Labour</p>
              <p className="font-medium">
                {taskDetails.parts_labour ? 'Required' : 'Not Required'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <DoorOpen className="h-6 w-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Permit to Enter</p>
              <p className="font-medium">
                {taskDetails.permit_enter === true ? 'Granted' : 'Not Granted'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task Description */}
      <div className="grid grid-cols-2 gap-4 pb-6">
        <Card>
          <CardContent className="p-6 min-h-[300px]">
            <h2 className="font-semibold mb-4">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {taskDetails.description || 'No description provided'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateStatus)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a note about this status update..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Success Page Dialog */}
      <Dialog open={showSuccessPage} onOpenChange={setShowSuccessPage}>
        <DialogContent className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px]">
          <DialogHeader>
            <DialogTitle className="sr-only">Task Status Update</DialogTitle>
          </DialogHeader>
          <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/20">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            {taskDetails.role.charAt(0).toUpperCase() + taskDetails.role.slice(1)} Complete
          </h2>
        </DialogContent>
      </Dialog>
    </div>
  );
} 