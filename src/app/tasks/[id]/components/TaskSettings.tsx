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
import { BasicInfoModal } from "./settings/basic-info-page";
import { TaskPropertiesModal } from "./settings/task-properties-page";
import { SchedulingModal } from "./settings/scheduling-modal";
import { PeopleModal, type Assignee } from "./settings/people-modal";
import { LocationModal } from "./settings/location-modal";
import { Task } from "../TaskDetailsClient";
import { DeleteTaskModal } from "./settings/delete-task-modal";

// Define the expected shape of the scheduling data from the modal
interface SchedulingData {
  taskType?: 'one-time' | 'recurring';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  dueDate?: Date;
}

// Re-add the TaskSettingsProps interface
interface TaskSettingsProps {
  taskDetails: Task;
  updateTaskDetails: (updates: Partial<Task>) => void;
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

// Define the shape of the data from the PeopleModal
interface PeopleSaveData {
  vendorId?: string | null;
  assignee?: Assignee | null;
  tenantId?: string | null;
}

// Define the shape of the data expected from LocationModal's onSave
export interface LocationSaveData {
  propertyId: string | null;
  unitId: string | null;
  permit_enter?: boolean | null;
}

export function TaskSettings({ taskDetails, updateTaskDetails }: TaskSettingsProps) {
  const router = useRouter();
  const [showBasicInfo, setShowBasicInfo] = React.useState(false);
  const [showTaskProperties, setShowTaskProperties] = React.useState(false);
  const [showScheduling, setShowScheduling] = React.useState(false);
  const [showPeopleModal, setShowPeopleModal] = React.useState(false);
  const [showLocationModal, setShowLocationModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  async function handleSaveBasicInfo({ title, description }: { title: string; description: string }) {
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: title, description }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      const updated = await response.json();
      updateTaskDetails({ subject: updated.subject, description: updated.description });
      // Optionally refresh the router or show a toast
      // router.refresh();
    } catch (err) {
      // Optionally show an error toast
      console.error(err);
    }
  }

  // Update the parameters to accept task_status
  async function handleSaveTaskProperties({ task_status, priority }: { task_status: Task['task_status']; priority: string }) {
    console.log("Saving task properties:", { task_status, priority });
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Send task_status in the body
        body: JSON.stringify({ task_status, priority }),
      });
      console.log("API Response Status:", response.status);
      if (!response.ok) {
         console.error("API Error Response:", await response.text());
         throw new Error("Failed to update task properties");
      }
      const updated = await response.json();
      console.log("API Response Data:", updated);
      // Update client state with task_status
      updateTaskDetails({ task_status: updated.task_status, priority: updated.priority });
      console.log("Called updateTaskDetails with:", { task_status: updated.task_status, priority: updated.priority });
      // Optionally refresh the router or show a toast
      // router.refresh();
    } catch (err) {
      // Optionally show an error toast
      console.error("Failed to save task properties:", err);
      throw err; // Re-throw error so modal knows save failed
    }
  }

  // Define the save handler for scheduling with the correct type
  async function handleSaveScheduling(data: SchedulingData) {
    console.log("Saving scheduling info:", data);
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_type: data.taskType,
          frequency: data.frequency,
          start_date: data.startDate?.toISOString(),
          due_date: data.dueDate?.toISOString(),
        }),
      });
      console.log("API Response Status (Scheduling):", response.status);
      if (!response.ok) {
        console.error("API Error Response (Scheduling):", await response.text());
        throw new Error("Failed to update task scheduling");
      }
      const updated = await response.json();
      console.log("API Response Data (Scheduling):", updated);
      updateTaskDetails({ 
        task_type: updated.taskType,
        start_date: updated.startDate,
        due_date: updated.dueDate,
      }); 
      console.log("Called updateTaskDetails with scheduling updates");
    } catch (err) {
      console.error("Failed to save task scheduling:", err);
      throw err; // Re-throw error so modal knows save failed
    }
  }

  // Placeholder save handler for people modal
  async function handleSavePeople(data: PeopleSaveData) {
    console.log("[TaskSettings] handleSavePeople received data:", data);
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          vendor_id: taskDetails.role === 'tenant_request' ? null : data.vendorId,
          tenant_id: taskDetails.role === 'tenant_request' ? data.tenantId : null,
          assignees: data.assignee?.id ?? null
        }),
      });
      console.log("API Response Status (People):", response.status);
      if (!response.ok) {
        console.error("API Error Response (People):", await response.text());
        throw new Error("Failed to update task assignees/vendor");
      }
      const updated = await response.json();
      console.log("API Response Data (People):", updated);

      // Log the ID specifically before updating state
      console.log(`[TaskSettings] Calling updateTaskDetails with vendor_id: ${data.vendorId}`);

      // Update local state using data from the modal to trigger effects immediately
      updateTaskDetails({ 
        vendor_id: taskDetails.role === 'tenant_request' ? null : data.vendorId, 
        tenant_id: taskDetails.role === 'tenant_request' ? data.tenantId : null,
        assignee: data.assignee ? { 
          id: data.assignee.id,
          profile: {
            first_name: data.assignee.first_name,
            last_name: data.assignee.last_name,
          }
        } : null
      }); 
      console.log("Called updateTaskDetails with people updates");
      // Optionally refresh or show toast
    } catch (err) {
      console.error("Failed to save task people:", err);
      throw err; // Re-throw error so modal knows save failed
    }
  }

  // Add the save handler for the Location modal
  async function handleSaveLocation(data: LocationSaveData) {
    console.log("[TaskSettings] handleSaveLocation received data:", data);
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          property_id: data.propertyId,
          unit_id: data.unitId,
          permit_enter: data.permit_enter
        }),
      });
      console.log("API Response Status (Location):", response.status);
      if (!response.ok) {
        console.error("API Error Response (Location):", await response.text());
        throw new Error("Failed to update task location");
      }
      const updated = await response.json();
      console.log("API Response Data (Location):", updated);

      // Update local state 
      // Assuming the API returns the updated property_id and unit_id
      // We might need to adjust this based on the actual API response and how properties/units are stored locally
      updateTaskDetails({ 
        property_id: updated.property_id, 
        unit_id: updated.unit_id,
        permit_enter: updated.permit_enter
        // Potentially update property/unit objects if they exist in the Task type
        // property: updated.property, 
        // unit: updated.unit 
      }); 
      console.log("Called updateTaskDetails with location updates");
    } catch (err) {
      console.error("Failed to save task location:", err);
      throw err; // Re-throw error so modal knows save failed
    }
  }

  // Function to handle the confirmed deletion
  async function handleConfirmDelete() {
    console.log(`Attempting to delete task ${taskDetails.id}`);
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}/task-delete`, { 
        method: "DELETE",
      });
      console.log("API Response Status (Delete):", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response (Delete):", errorText);
        throw new Error(`Failed to delete task: ${errorText}`);
      }
      console.log(`Task ${taskDetails.id} deleted successfully.`);
      setShowDeleteModal(false); // Close modal on success
      router.push('/tasks'); // Redirect after successful deletion
      // Optionally show a success toast message here
    } catch (err) {
      console.error("Failed to delete task:", err);
      // Optionally show an error toast message here
      // Keep the modal open by not calling setShowDeleteModal(false)
      throw err; // Re-throw error so the modal's loading state is handled
    }
  }

  const settings = [
    {
      id: 'basic-info',
      icon: <Info className="w-5 h-5 text-green-600" />,
      label: "Basic Information",
      description: "Update the task title and description.",
    },
    {
      id: 'properties',
      icon: <ClipboardList className="w-5 h-5 text-green-600" />,
      label: "Task Properties",
      description: "Update status, priority, and other task properties.",
    },
    {
      id: 'scheduling',
      icon: <Calendar className="w-5 h-5 text-green-600" />,
      label: "Scheduling",
      description: "Set due dates and scheduling preferences.",
    },
    {
      id: 'location',
      icon: <Building2 className="w-5 h-5 text-green-600" />,
      label: "Location",
      description: "Update property and unit assignment.",
    },
    {
      id: 'assignees',
      icon: <Users className="w-5 h-5 text-green-600" />,
      label: "People",
      description: "Manage task assignees/people and notifications.",
    },
    {
      id: 'delete',
      icon: <Trash2 className="w-5 h-5 text-[hsl(var(--error))]" />,
      label: "Delete Task",
      description: "Permanently delete this task and all associated data.",
      isDelete: true
    }
  ];

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settings.map((setting) => (
          <SettingButton
            key={setting.id}
            icon={setting.icon}
            label={setting.label}
            description={setting.description}
            onClick={() => {
              if (setting.id === 'basic-info') {
                setShowBasicInfo(true);
              } else if (setting.id === 'properties') {
                setShowTaskProperties(true);
              } else if (setting.id === 'scheduling') {
                setShowScheduling(true);
              } else if (setting.id === 'location') {
                setShowLocationModal(true);
              } else if (setting.id === 'assignees') {
                setShowPeopleModal(true);
              } else if (setting.id === 'delete') {
                setShowDeleteModal(true);
              } else {
                console.warn(`Unhandled setting button click: ${setting.id}`);
              }
            }}
            isDelete={setting.isDelete}
          />
        ))}
      </div>
      <BasicInfoModal open={showBasicInfo} onOpenChange={setShowBasicInfo} taskDetails={taskDetails} onSave={handleSaveBasicInfo} />
      <TaskPropertiesModal 
        open={showTaskProperties} 
        onOpenChange={setShowTaskProperties} 
        taskDetails={taskDetails} 
        onSave={handleSaveTaskProperties} 
      />
      <SchedulingModal 
        open={showScheduling} 
        onOpenChange={setShowScheduling} 
        taskDetails={taskDetails} 
        onSave={handleSaveScheduling} 
        role={taskDetails.role}
      />
      <PeopleModal 
        open={showPeopleModal} 
        onOpenChange={setShowPeopleModal} 
        taskDetails={taskDetails} 
        onSave={handleSavePeople}
        role={taskDetails.role}
      />
      <LocationModal 
        open={showLocationModal} 
        onOpenChange={setShowLocationModal} 
        taskDetails={taskDetails} 
        onSave={handleSaveLocation}
        role={taskDetails.role}
      />
      <DeleteTaskModal 
        open={showDeleteModal} 
        onOpenChange={setShowDeleteModal} 
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
} 