'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomDatePicker } from "@/components/ui/date-picker";
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

interface GeneralInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

export function GeneralInformationDialog({ open, onOpenChange, personDetails }: GeneralInformationDialogProps) {
  const [formData, setFormData] = React.useState({
    firstName: personDetails.first_name,
    middleName: '',
    lastName: personDetails.last_name,
    company: '',
    ssn: '',
    driversLicenseState: '',
    driversLicenseNumber: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
  });

  const isProspect = personDetails.role === 'prospect';
  const isOwner = personDetails.role === 'owner';
  const isVendor = personDetails.role === 'vendor';

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update person details');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating person details:', error);
      // TODO: Show error toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">General Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="h-[42px] mt-2"
              />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input 
                id="middleName" 
                value={formData.middleName}
                onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                className="h-[42px] mt-2"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="h-[42px] mt-2"
              />
            </div>
          </div>

          {isProspect && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="ssn">SSN</Label>
                  <Input 
                    id="ssn" 
                    value={formData.ssn}
                    onChange={(e) => setFormData({...formData, ssn: e.target.value})}
                    className="h-[42px] mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) => setFormData({...formData, maritalStatus: value})}
                  >
                    <SelectTrigger className="h-[42px] mt-2">
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="driversLicenseState">Driver&apos;s License State</Label>
                  <Input 
                    id="driversLicenseState" 
                    value={formData.driversLicenseState}
                    onChange={(e) => setFormData({...formData, driversLicenseState: e.target.value})}
                    className="h-[42px] mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="driversLicenseNumber">Driver&apos;s License Number</Label>
                  <Input 
                    id="driversLicenseNumber" 
                    value={formData.driversLicenseNumber}
                    onChange={(e) => setFormData({...formData, driversLicenseNumber: e.target.value})}
                    className="h-[42px] mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                  <div className="mt-2">
                    <CustomDatePicker
                      label=""
                      value={formData.dateOfBirth}
                      onChange={(value: string) => setFormData({...formData, dateOfBirth: value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                  >
                    <SelectTrigger className="h-[42px] mt-2">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {(isOwner || isVendor) && (
            <div>
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="h-[42px] mt-2"
              />
            </div>
          )}
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