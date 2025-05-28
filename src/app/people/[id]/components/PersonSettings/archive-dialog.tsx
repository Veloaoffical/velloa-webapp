'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
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
  role: string;
}

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

export function ArchiveDialog({ open, onOpenChange, personDetails }: ArchiveDialogProps) {
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastProps, setToastProps] = React.useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }>({ title: "", description: "" });
  
  const router = useRouter();

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'archived'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to archive person');
      }

      setToastProps({
        title: "Success",
        description: "Person successfully archived",
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
      if (error instanceof Error) {
        setToastProps({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setShowToast(true);

        // Auto-dismiss error toast after 5 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-red-600" />
              Archive Person
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-card border  rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div>
                  <h4 className="font-medium ">Archive Confirmation</h4>
                  <p className="text-sm mt-1">
                    Are you sure you want to archive <strong>{personDetails.first_name} {personDetails.last_name}</strong>?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Archiving this person will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Hide them from active person lists</li>
                <li>Preserve all their data and history</li>
                <li>Allow you to restore them later if needed</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                This action can be reversed by restoring the person from the archived section.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isArchiving ? "Archiving..." : "Archive Person"}
            </Button>
          </DialogFooter>
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
    </>
  );
} 