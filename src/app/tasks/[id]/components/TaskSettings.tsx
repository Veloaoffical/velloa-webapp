'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Info, 
  ClipboardList, 
  Calendar, 
  Building2, 
  Users,
  Trash2 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { BasicInformationDialog } from "./TaskSettings/basic-information-dialog";
import { TaskPropertiesDialog } from "./TaskSettings/task-properties-dialog";
import { SchedulingDialog } from "./TaskSettings/scheduling-dialog";
import { LocationDialog } from "./TaskSettings/location-dialog";
import { AssigneesDialog } from "./TaskSettings/assignees-dialog";

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

interface TaskSettingsProps {
  taskDetails: Task;
}

interface SettingButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  isDelete?: boolean;
}

const SettingButton = ({ icon, label, description, onClick, isDelete }: SettingButtonProps) => (
  <button
    onClick={onClick}
    className="relative flex w-full items-center gap-3 rounded-lg border border-input p-4 shadow-sm shadow-black/5 hover:border-ring hover:bg-accent transition-colors bg-card"
  >
    <div className={`shrink-0 ${isDelete ? 'bg-[hsl(var(--error-light))]' : 'bg-[hsl(var(--success-light))]'} rounded-lg p-2 flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  </button>
)

export function TaskSettings({ taskDetails }: TaskSettingsProps) {
  const [showBasicInfo, setShowBasicInfo] = React.useState(false);
  const [showTaskProperties, setShowTaskProperties] = React.useState(false);
  const [showScheduling, setShowScheduling] = React.useState(false);
  const [showLocation, setShowLocation] = React.useState(false);
  const [showAssignees, setShowAssignees] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastProps, setToastProps] = React.useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }>({ title: "", description: "" });
  
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/tasks/${taskDetails.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      setToastProps({
        title: "Success",
        description: "Task successfully deleted",
      });
      setShowToast(true);

      // Redirect to tasks page
      router.push('/tasks');
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setToastProps({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setShowToast(true);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const settings = [
    {
      icon: <Info className="w-5 h-5 text-green-600" />,
      label: "Basic Information",
      description: "Update the task title and description.",
      onClick: () => setShowBasicInfo(true)
    },
    {
      icon: <ClipboardList className="w-5 h-5 text-green-600" />,
      label: "Task Properties",
      description: "Update status, priority, and other task properties.",
      onClick: () => setShowTaskProperties(true)
    },
    {
      icon: <Calendar className="w-5 h-5 text-green-600" />,
      label: "Scheduling",
      description: "Set due dates and scheduling preferences.",
      onClick: () => setShowScheduling(true)
    },
    {
      icon: <Building2 className="w-5 h-5 text-green-600" />,
      label: "Location",
      description: "Update property and unit assignment.",
      onClick: () => setShowLocation(true)
    },
    {
      icon: <Users className="w-5 h-5 text-green-600" />,
      label: "Assignees",
      description: "Manage task assignees and notifications.",
      onClick: () => setShowAssignees(true)
    },
    {
      icon: <Trash2 className="w-5 h-5 text-[hsl(var(--error))]" />,
      label: "Delete Task",
      description: "Permanently delete this task and all associated data.",
      onClick: () => setShowDeleteConfirm(true),
      isDelete: true
    }
  ];

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settings.map((setting, index) => (
          <SettingButton
            key={index}
            icon={setting.icon}
            label={setting.label}
            description={setting.description}
            onClick={setting.onClick}
            isDelete={setting.isDelete}
          />
        ))}
      </div>

      {/* Dialogs */}
      <BasicInformationDialog 
        open={showBasicInfo} 
        onOpenChange={setShowBasicInfo}
        taskDetails={taskDetails}
      />

      <TaskPropertiesDialog
        open={showTaskProperties}
        onOpenChange={setShowTaskProperties}
        taskDetails={taskDetails}
      />

      <SchedulingDialog
        open={showScheduling}
        onOpenChange={setShowScheduling}
        taskDetails={taskDetails}
      />

      <LocationDialog
        open={showLocation}
        onOpenChange={setShowLocation}
        taskDetails={taskDetails}
      />

      <AssigneesDialog
        open={showAssignees}
        onOpenChange={setShowAssignees}
        taskDetails={taskDetails}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      <ToastProvider>
        {showToast && (
          <Toast variant={toastProps.variant} onOpenChange={setShowToast}>
            <div className="grid gap-1">
              <ToastTitle>{toastProps.title}</ToastTitle>
              <ToastDescription>
                {toastProps.description}
              </ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </div>
  );
} 