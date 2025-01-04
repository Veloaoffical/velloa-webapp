'use client';

import * as React from "react";
import { 
  Info, 
  Home, 
  CircleUserRound, 
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PersonDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string;
  unit_id: string | null;
  role: string;
  unit?: {
    unit_number: string;
    property_name?: string;
  } | null;
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
}

interface PersonSettingsProps {
  personDetails: PersonDetails;
  personId: string;
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
    className="relative flex w-full items-center gap-3 rounded-lg border border-input p-4 shadow-sm shadow-black/5 hover:border-ring hover:bg-accent transition-colors bg-white"
  >
    <div className={`shrink-0 w-10 h-10 rounded-lg ${isDelete ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
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

export function PersonSettings({ personDetails, personId }: PersonSettingsProps) {
  const [showGeneralInfo, setShowGeneralInfo] = React.useState(false);
  const [showContactInfo, setShowContactInfo] = React.useState(false);
  const [showUnitInfo, setShowUnitInfo] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const settings = [
    {
      icon: <Info className="w-5 h-5 text-green-600" />,
      label: "General Information",
      description: "Update the general information for this person.",
      onClick: () => setShowGeneralInfo(true)
    },
    {
      icon: <CircleUserRound className="w-5 h-5 text-green-600" />,
      label: "Contact Information",
      description: "Update contact details like email and phone number.",
      onClick: () => setShowContactInfo(true)
    },
    {
      icon: <Home className="w-5 h-5 text-green-600" />,
      label: "Unit Assignment",
      description: "Update unit assignment for this person.",
      onClick: () => setShowUnitInfo(true)
    },
    {
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
      label: "Delete Person",
      description: "Permanently delete this person and all associated data.",
      onClick: () => setShowDeleteConfirm(true)
    }
  ];

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {settings.map((setting, index) => (
          <SettingButton
            key={index}
            icon={setting.icon}
            label={setting.label}
            description={setting.description}
            onClick={setting.onClick || (() => console.log(`Clicked ${setting.label}`))}
            isDelete={setting.label === "Delete Person"}
          />
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={showGeneralInfo} onOpenChange={setShowGeneralInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>General Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add form fields for general information */}
            <p className="text-sm text-muted-foreground">ID: {personId}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactInfo} onOpenChange={setShowContactInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add form fields for contact information */}
            <p className="text-sm text-muted-foreground">Current Email: {personDetails.email}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUnitInfo} onOpenChange={setShowUnitInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add form fields for unit assignment */}
            <p className="text-sm text-muted-foreground">
              Current Unit: {personDetails.unit 
                ? `${personDetails.unit.unit_number}${personDetails.unit.property_name ? ` - ${personDetails.unit.property_name}` : ''}`
                : "No Unit Assigned"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete {personDetails.first_name} {personDetails.last_name}? This action cannot be undone.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 