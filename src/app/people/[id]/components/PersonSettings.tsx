'use client';

import * as React from "react";
import { 
  Info, 
  Home, 
  CircleUserRound, 
  Trash2,
  MapPin,
  CalendarRange,
  Banknote
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { GeneralInformationDialog } from "./PersonSettings/general-information-dialog";
import { ContactInformationDialog } from "./PersonSettings/contact-information-dialog";
import { UnitAssignmentDialog } from "./PersonSettings/unit-assignment-dialog";
import { AddressInformationDialog } from "./PersonSettings/address-information-dialog";
import { AgreementDialog } from "./PersonSettings/agreement-dialog";
import { PaymentSettingsDialog } from "./PersonSettings/payment-settings-dialog";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { PersonDetails } from '@/types/person';

interface PersonSettingsProps {
  personDetails: PersonDetails;
  userRole: string;
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

export function PersonSettings({ personDetails, userRole }: PersonSettingsProps) {
  const [showGeneralInfo, setShowGeneralInfo] = React.useState(false);
  const [showContactInfo, setShowContactInfo] = React.useState(false);
  const [showUnitInfo, setShowUnitInfo] = React.useState(false);
  const [showAddressInfo, setShowAddressInfo] = React.useState(false);
  const [showAgreement, setShowAgreement] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastProps, setToastProps] = React.useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }>({ title: "", description: "" });
  
  const router = useRouter();

  const isVendor = personDetails.role === 'vendor';
  const isOwner = personDetails.role === 'owner';
  const showAddressSettings = isVendor || isOwner;
  const showPayments = isVendor || isOwner;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete person');
      }

      setToastProps({
        title: "Success",
        description: "Person successfully deleted",
      });
      setShowToast(true);

      // Redirect to people page
      router.push('/people');
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
    ...(showAddressSettings ? [{
      icon: <MapPin className="w-5 h-5 text-green-600" />,
      label: "Address Information",
      description: "Update primary and secondary addresses.",
      onClick: () => setShowAddressInfo(true)
    }] : []),
    ...(isOwner ? [{
      icon: <CalendarRange className="w-5 h-5 text-green-600" />,
      label: "Agreement",
      description: "Update agreement start and end dates.",
      onClick: () => setShowAgreement(true)
    }] : []),
    ...(isVendor ? [{
      icon: <Home className="w-5 h-5 text-green-600" />,
      label: "Unit Assignment",
      description: "Update unit assignment for this vendor.",
      onClick: () => setShowUnitInfo(true)
    }] : []),
    ...(showPayments ? [{
      icon: <Banknote className="w-5 h-5 text-green-600" />,
      label: "Payment Settings",
      description: `Configure payment settings for this ${personDetails.role}.`,
      onClick: () => setShowPaymentSettings(true)
    }] : []),
    ...((userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'owner') ? [{
      icon: <Trash2 className="w-5 h-5 text-[hsl(var(--error))]" />,
      label: "Delete Person",
      description: "Permanently delete this person and all associated data.",
      onClick: () => setShowDeleteConfirm(true)
    }] : [])
  ];

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
        {settings.map((setting, index) => (
          <SettingButton
            key={index}
            icon={setting.icon}
            label={setting.label}
            description={setting.description}
            onClick={setting.onClick}
            isDelete={setting.label === "Delete Person"}
          />
        ))}
      </div>

      {/* Dialogs */}
      <GeneralInformationDialog 
        open={showGeneralInfo} 
        onOpenChange={setShowGeneralInfo}
        personDetails={personDetails}
      />

      <ContactInformationDialog
        open={showContactInfo}
        onOpenChange={setShowContactInfo}
        personDetails={personDetails}
      />

      <UnitAssignmentDialog
        open={showUnitInfo}
        onOpenChange={setShowUnitInfo}
        personDetails={personDetails}
      />

      <AddressInformationDialog
        open={showAddressInfo}
        onOpenChange={setShowAddressInfo}
        personDetails={personDetails}
      />

      <AgreementDialog
        open={showAgreement}
        onOpenChange={setShowAgreement}
        personDetails={personDetails}
      />

      <PaymentSettingsDialog
        open={showPaymentSettings}
        onOpenChange={setShowPaymentSettings}
        personDetails={personDetails}
      />

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