'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgreementDatePicker } from "./agreement-date-picker";
import { PersonDetails } from '@/types/person';

interface AgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

export function AgreementDialog({ open, onOpenChange, personDetails }: AgreementDialogProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const [startDate, setStartDate] = React.useState(formatDate(personDetails.agreement_start));
  const [endDate, setEndDate] = React.useState(formatDate(personDetails.agreement_end));

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreement_start: startDate ? `${startDate}T00:00:00.000Z` : null,
          agreement_end: endDate ? `${endDate}T00:00:00.000Z` : null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update agreement dates');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating agreement dates:', error);
      // TODO: Show error toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Agreement Dates</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Agreement Period <span className="text-red-500">*</span></h4>
            <AgreementDatePicker
              startValue={startDate}
              endValue={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="default">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 