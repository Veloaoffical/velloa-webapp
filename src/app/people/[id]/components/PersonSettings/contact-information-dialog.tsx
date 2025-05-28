'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import type { Value as PhoneValue } from "react-phone-number-input";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

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

interface ContactInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

export function ContactInformationDialog({ open, onOpenChange, personDetails }: ContactInformationDialogProps) {
  const [email, setEmail] = React.useState(personDetails.email || '');
  const [phone, setPhone] = React.useState<PhoneValue | undefined>(personDetails.phone ? personDetails.phone as PhoneValue : undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastProps, setToastProps] = React.useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }>({ title: "", description: "" });

  const router = useRouter();

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          phone: phone || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update contact information');
      }

      setToastProps({
        title: "Success",
        description: "Contact information updated successfully",
      });
      setShowToast(true);

      // Auto-dismiss toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      // Refresh the page to show updated data
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating contact information:', error);
      setToastProps({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update contact information',
        variant: "destructive",
      });
      setShowToast(true);

      // Auto-dismiss error toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Contact Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                id="email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[42px] pl-10"
              />
            </div>
          </div>
          <div>
            <PhoneNumberInput
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              placeholder="Enter phone number"
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-[#16B364] hover:bg-[#16B364]/90"
          >
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Toast */}
      <ToastProvider duration={toastProps.variant === "destructive" ? 5000 : 3000}>
        {showToast && (
          <Toast 
            variant={toastProps.variant} 
            onOpenChange={setShowToast}
            open={showToast}
          >
            <div className="grid gap-1">
              <ToastTitle>{toastProps.title}</ToastTitle>
              <ToastDescription>
                {toastProps.description}
              </ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport className="fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-auto sm:right-4 sm:top-4 sm:flex-col md:max-w-[420px]" />
      </ToastProvider>
    </Dialog>
  );
} 