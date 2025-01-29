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
  permit_owner: boolean | null;
  permit_enter: boolean | null;
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
  const router = useRouter();

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
      label: "Assignees",
      description: "Manage task assignees and notifications.",
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
              if (setting.id === 'delete') {
                router.push(`/tasks/${taskDetails.id}/settings?section=delete`);
              } else {
                router.push(`/tasks/${taskDetails.id}/settings?section=${setting.id}`);
              }
            }}
            isDelete={setting.isDelete}
          />
        ))}
      </div>
    </div>
  );
} 