'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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
  address_info?: {
    primary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
    secondary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    } | null;
  };
}

interface AddressInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

export function AddressInformationDialog({ open, onOpenChange, personDetails }: AddressInformationDialogProps) {
  const [addressInfo, setAddressInfo] = React.useState({
    primary: {
      street: personDetails.address_info?.primary?.street || '',
      city: personDetails.address_info?.primary?.city || '',
      province: personDetails.address_info?.primary?.province || '',
      postalCode: personDetails.address_info?.primary?.postalCode || '',
      country: personDetails.address_info?.primary?.country || ''
    },
    secondary: personDetails.address_info?.secondary ? {
      street: personDetails.address_info.secondary.street || '',
      city: personDetails.address_info.secondary.city || '',
      province: personDetails.address_info.secondary.province || '',
      postalCode: personDetails.address_info.secondary.postalCode || '',
      country: personDetails.address_info.secondary.country || ''
    } : null
  });
  const [hasSecondaryAddress, setHasSecondaryAddress] = React.useState(!!personDetails.address_info?.secondary);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address_info: {
            primary: addressInfo.primary,
            secondary: hasSecondaryAddress ? addressInfo.secondary : null
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update address information');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating address information:', error);
      // TODO: Show error toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Address Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Primary Address</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={addressInfo.primary.street}
                    onChange={(e) => setAddressInfo(prev => ({
                      ...prev,
                      primary: { ...prev.primary, street: e.target.value }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={addressInfo.primary.city}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, city: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="province">Province/State</Label>
                    <Input
                      id="province"
                      value={addressInfo.primary.province}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, province: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={addressInfo.primary.postalCode}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, postalCode: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={addressInfo.primary.country}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, country: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasSecondaryAddress"
                checked={hasSecondaryAddress}
                onCheckedChange={(checked) => {
                  setHasSecondaryAddress(checked === true);
                  if (checked && !addressInfo.secondary) {
                    setAddressInfo(prev => ({
                      ...prev,
                      secondary: {
                        street: '',
                        city: '',
                        province: '',
                        postalCode: '',
                        country: ''
                      }
                    }));
                  }
                }}
              />
              <Label htmlFor="hasSecondaryAddress">Add Secondary Address</Label>
            </div>

            {hasSecondaryAddress && addressInfo.secondary && (
              <div>
                <h3 className="text-sm font-medium mb-2">Secondary Address</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="secondary-street">Street Address</Label>
                    <Input
                      id="secondary-street"
                      value={addressInfo.secondary.street}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        secondary: prev.secondary ? {
                          ...prev.secondary,
                          street: e.target.value
                        } : null
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-city">City</Label>
                      <Input
                        id="secondary-city"
                        value={addressInfo.secondary.city}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            city: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-province">Province/State</Label>
                      <Input
                        id="secondary-province"
                        value={addressInfo.secondary.province}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            province: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-postalCode">Postal Code</Label>
                      <Input
                        id="secondary-postalCode"
                        value={addressInfo.secondary.postalCode}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            postalCode: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-country">Country</Label>
                      <Input
                        id="secondary-country"
                        value={addressInfo.secondary.country}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            country: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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