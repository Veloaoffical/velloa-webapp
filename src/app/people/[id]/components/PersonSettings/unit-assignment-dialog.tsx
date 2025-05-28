'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building, DoorClosed } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { useRouter } from "next/navigation";
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

interface UnitAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

interface PropertyOption {
  value: string;
  label: string;
}

export function UnitAssignmentDialog({ open, onOpenChange, personDetails }: UnitAssignmentDialogProps) {
  const [propertyOptions, setPropertyOptions] = React.useState<PropertyOption[]>([]);
  const [selectedProperties, setSelectedProperties] = React.useState<string[]>([]);
  const [propertyAccess, setPropertyAccess] = React.useState<'all' | 'specific'>('all');
  const [loadingProperties, setLoadingProperties] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastProps, setToastProps] = React.useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }>({ title: "", description: "" });

  const router = useRouter();

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const response = await fetch('/api/property');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setPropertyOptions(
        data.map((p: { id: string; name: string; address?: string }) => ({
          value: p.id,
          label: p.name + (p.address ? ` — ${p.address}` : ''),
        }))
      );
    } catch (error) {
      console.error('Error fetching properties:', error);
      setPropertyOptions([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchCurrentAssignments = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}/properties`);
      if (!response.ok) {
        throw new Error('Failed to fetch current property assignments');
      }
      const data = await response.json();
      if (data.length === 0) {
        setPropertyAccess('all');
      } else {
        setPropertyAccess('specific');
        setSelectedProperties(data.map((assignment: { property_id: string }) => assignment.property_id));
      }
    } catch (error) {
      console.error('Error fetching current assignments:', error);
    }
  }, [personDetails.id]);

  // Fetch properties and current assignments when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchProperties();
      fetchCurrentAssignments();
    }
  }, [open, fetchCurrentAssignments]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedProperties: propertyAccess === 'all' ? [] : selectedProperties,
          propertiesAccess: propertyAccess,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update unit assignment');
      }

      setToastProps({
        title: "Success",
        description: "Unit assignment updated successfully",
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
      console.error('Error updating unit assignment:', error);
      setToastProps({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update unit assignment',
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
          <DialogTitle className="text-xl">Unit Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-muted-foreground">Specify which properties this vendor can work on.</p>
          <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
            <RadioGroup
              className="gap-2 w-full"
              value={propertyAccess}
              onValueChange={(v) => setPropertyAccess(v as 'all' | 'specific')}
            >
              {/* Radio card #1: All properties */}
              <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                <RadioGroupItem
                  value="all"
                  id="properties-all"
                  aria-describedby="properties-all-description"
                  className="order-1 after:absolute after:inset-0"
                />
                <div className="flex grow items-start gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--success-light))]">
                    <Building className="text-[hsl(var(--primary))]" size={24} />
                  </div>
                  <div className="grid grow gap-2">
                    <Label htmlFor="properties-all">
                      This vendor can work on all my properties
                    </Label>
                    <p
                      id="properties-all-description"
                      className="text-muted-foreground text-xs"
                    >
                      The vendor will be available for every property you manage.
                    </p>
                  </div>
                </div>
              </div>
              {/* Radio card #2: Specific properties */}
              <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                <RadioGroupItem
                  value="specific"
                  id="properties-specific"
                  aria-describedby="properties-specific-description"
                  className="order-1 after:absolute after:inset-0"
                />
                <div className="flex grow items-start gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--success-light))]">
                    <DoorClosed className="text-[hsl(var(--primary))]" size={24} />
                  </div>
                  <div className="grid grow gap-2">
                    <Label htmlFor="properties-specific">
                      This vendor can work on specific properties
                      <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
                        {" "}(Custom)
                      </span>
                    </Label>
                    <p
                      id="properties-specific-description"
                      className="text-muted-foreground text-xs"
                    >
                      Select which properties this vendor can work on.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
            {propertyAccess === 'specific' && (
              <div className="w-full mt-4">
                <Label>Select specific properties</Label>
                <MultiSelect
                  options={propertyOptions}
                  selected={selectedProperties}
                  onChange={setSelectedProperties}
                  placeholder={loadingProperties ? "Loading properties..." : "Select properties"}
                />
                <p
                  className="text-muted-foreground mt-2 text-xs"
                  role="region"
                  aria-live="polite"
                >
                  {loadingProperties ? "Loading property list..." : "Select one or more properties for this vendor."}
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || (!propertyAccess || (propertyAccess === 'specific' && selectedProperties.length === 0))}
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