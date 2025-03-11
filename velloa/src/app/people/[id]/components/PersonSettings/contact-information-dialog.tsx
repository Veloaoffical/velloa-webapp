'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [formData, setFormData] = React.useState({
    email: personDetails.email || '',
    phone: personDetails.phone || '',
  });

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update contact information');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating contact information:', error);
      // TODO: Show error toast
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
            <Input 
              id="email" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="h-[42px] mt-2"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="h-[42px] mt-2"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#16B364] hover:bg-[#16B364]/90">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 