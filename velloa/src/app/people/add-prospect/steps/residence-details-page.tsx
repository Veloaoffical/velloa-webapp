"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Home, Mail, Minus, Plus, DollarSignIcon } from "lucide-react"
import {
  // Removed DateRangePicker, Dialog, Group, Popover, AriaButton
} from "react-aria-components"
import React from "react"

import { PhoneNumberInput } from "@/components/ui/phone-input"
import { type Value as PhoneNumberValue } from "react-phone-number-input"

// Define address form interface (Should match the one in page.tsx)
interface AddressForm {
  id: number
  isPrimary: boolean
  streetAddress: string
  city: string
  province: string
  postalCode: string
  isExpanded: boolean
  // Added fields from page.tsx
  monthlyRent?: string
  landlordName?: string
  lengthOfStayYears?: number
  lengthOfStayMonths?: number
  landlordEmail?: string
  landlordPhone?: PhoneNumberValue
  reasonForLeaving?: string
  residentialStatus?: string
}

// Define ResidentialFieldsSettings interface (Ideally import from shared types)
interface ResidentialFieldSetting {
  enabled: boolean;
  required: boolean;
}

interface ResidentialFieldsSettings {
  address?: ResidentialFieldSetting;
  monthlyRent?: ResidentialFieldSetting;
  landlordName?: ResidentialFieldSetting;
  lengthOfStay?: ResidentialFieldSetting;
  landlordEmail?: ResidentialFieldSetting;
  landlordPhone?: ResidentialFieldSetting;
  reasonForLeaving?: ResidentialFieldSetting;
  residentialStatus?: ResidentialFieldSetting;
}

interface ResidenceDetailsPageProps {
  addressForms: AddressForm[]
  residentialFields: ResidentialFieldsSettings; // Add prop for settings
  canAddAddress: boolean; // Add prop to control button state
  onAddressFormChange: (id: number, field: string, value: string | number | boolean) => void
  onLandlordPhoneChange: (id: number, value: PhoneNumberValue | undefined) => void
  onInvalidAddAttempt: () => void; // Add prop for notification handler
  onToggleAddressForm: (id: number) => void
  onRemoveAddressForm: (id: number) => void
  onAddAddressForm: () => void
  onNext: () => void
  onPrevious: () => void
}

export default function ResidenceDetailsPage({
  addressForms,
  residentialFields, // Destructure prop
  canAddAddress, // Destructure prop
  onAddressFormChange,
  onLandlordPhoneChange,
  onInvalidAddAttempt, // Destructure prop
  onToggleAddressForm,
  onRemoveAddressForm,
  onAddAddressForm,
  onNext,
  onPrevious,
}: ResidenceDetailsPageProps) {
  // Render a single address form
  const renderAddressForm = (form: AddressForm) => {
    if (!form.isExpanded) {
      // Collapsed view for all addresses
      return (
        <div key={form.id} className="mb-2">
          <button
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/5 p-4 text-left transition-colors hover:bg-muted/10"
            onClick={() => onToggleAddressForm(form.id)}
          >
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {form.isPrimary ? form.streetAddress || "Current Address" : form.streetAddress || "Previous Address"}
              </span>
              {form.isPrimary && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!form.isPrimary && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveAddressForm(form.id)
                  }}
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      )
    }

    return (
      <div key={form.id} className="mb-4">
        <div className="flex w-full items-center justify-between rounded-t-lg border border-b-0 border-border bg-muted/5 p-4">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{form.isPrimary ? "Current Address" : "Previous Address"}</span>
            {form.isPrimary && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!form.isPrimary && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={() => onRemoveAddressForm(form.id)}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onToggleAddressForm(form.id)}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="sr-only">Collapse</span>
            </Button>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="border-x border-b border-border bg-muted/5 border-b p-6">
          <h2 className="mb-4 text-lg font-medium">Address Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Conditionally render Address fields based on residentialFields.address */}
            {residentialFields?.address?.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`streetAddress-${form.id}`}>
                    Street Address {residentialFields.address.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={`streetAddress-${form.id}`}
                    placeholder="Enter street address"
                    value={form.streetAddress}
                    onChange={(e) => onAddressFormChange(form.id, "streetAddress", e.target.value)}
                    required={residentialFields.address.required}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`city-${form.id}`}>
                    City {residentialFields.address.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={`city-${form.id}`}
                    placeholder="Enter city"
                    value={form.city}
                    onChange={(e) => onAddressFormChange(form.id, "city", e.target.value)}
                    required={residentialFields.address.required}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`province-${form.id}`}>
                    Province {residentialFields.address.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={form.province}
                    onValueChange={(value) => onAddressFormChange(form.id, "province", value)}
                    required={residentialFields.address.required}
                  >
                    <SelectTrigger id={`province-${form.id}`}>
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Province options */}
                      <SelectItem value="ab">Alberta</SelectItem>
                      <SelectItem value="bc">British Columbia</SelectItem>
                      <SelectItem value="on">Ontario</SelectItem>
                      <SelectItem value="qc">Quebec</SelectItem>
                      <SelectItem value="mb">Manitoba</SelectItem>
                      <SelectItem value="sk">Saskatchewan</SelectItem>
                      <SelectItem value="nb">New Brunswick</SelectItem>
                      <SelectItem value="ns">Nova Scotia</SelectItem>
                      <SelectItem value="pe">Prince Edward Island</SelectItem>
                      <SelectItem value="nl">Newfoundland and Labrador</SelectItem>
                      <SelectItem value="nt">Northwest Territories</SelectItem>
                      <SelectItem value="nu">Nunavut</SelectItem>
                      <SelectItem value="yt">Yukon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`postalCode-${form.id}`}>
                    Postal Code {residentialFields.address.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id={`postalCode-${form.id}`}
                    placeholder="Enter postal code"
                    value={form.postalCode}
                    onChange={(e) => onAddressFormChange(form.id, "postalCode", e.target.value)}
                    required={residentialFields.address.required}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Residence Details Section */}
        <div className="border-x border-b border-border bg-muted/5 border-b p-6">
          <h2 className="mb-4 text-lg font-medium">Residence Details</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Residential Status */}
            {residentialFields?.residentialStatus?.enabled && (
              <div className="space-y-2">
                <Label htmlFor={`residentialStatus-${form.id}`}>
                  Residential Status {residentialFields.residentialStatus.required && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={form.residentialStatus}
                  onValueChange={(value) => onAddressFormChange(form.id, "residentialStatus", value)}
                  required={residentialFields.residentialStatus.required}
                >
                  <SelectTrigger id={`residentialStatus-${form.id}`}>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="own">Mortgage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Length of Stay */}
            {residentialFields?.lengthOfStay?.enabled && (
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>
                  Length of Stay {residentialFields.lengthOfStay.required && <span className="text-destructive">*</span>}
                </Label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <Input
                      id={`lengthOfStayYears-${form.id}`}
                      type="number"
                      placeholder="Years"
                      value={form.lengthOfStayYears ?? ""}
                      onChange={(e) =>
                        onAddressFormChange(form.id, "lengthOfStayYears", e.target.value ? parseInt(e.target.value, 10) : 0)
                      }
                      min="0"
                      required={residentialFields.lengthOfStay.required}
                    />
                     <p className="text-xs text-muted-foreground">Years</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      id={`lengthOfStayMonths-${form.id}`}
                      type="number"
                      placeholder="Months"
                      value={form.lengthOfStayMonths ?? ""}
                      onChange={(e) =>
                        onAddressFormChange(form.id, "lengthOfStayMonths", e.target.value ? parseInt(e.target.value, 10) : 0)
                      }
                      min="0"
                      max="11"
                      required={residentialFields.lengthOfStay.required}
                    />
                    <p className="text-xs text-muted-foreground">Months</p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Rent */}
            {residentialFields?.monthlyRent?.enabled && (
              <div className="space-y-2">
                <Label htmlFor={`monthlyRent-${form.id}`}>
                  Monthly Rent {residentialFields.monthlyRent.required && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input 
                    id={`monthlyRent-${form.id}`}
                    placeholder="Enter monthly rent"
                    type="number" // Use number type for currency
                    value={form.monthlyRent}
                    onChange={(e) => onAddressFormChange(form.id, "monthlyRent", e.target.value)}
                    required={residentialFields.monthlyRent.required}
                    className="peer ps-9"
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <DollarSignIcon size={16} aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}

            {/* Reason for Leaving */}
            {residentialFields?.reasonForLeaving?.enabled && (
              <div className="space-y-2">
                <Label htmlFor={`reasonForLeaving-${form.id}`}>
                  Reason for Leaving {residentialFields.reasonForLeaving.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`reasonForLeaving-${form.id}`}
                  placeholder="Enter reason"
                  value={form.reasonForLeaving}
                  onChange={(e) => onAddressFormChange(form.id, "reasonForLeaving", e.target.value)}
                  required={residentialFields.reasonForLeaving.required}
                />
              </div>
            )}
          </div>
        </div>

        {/* Landlord Information Section */}
        <div className="rounded-b-lg border-x border-b border-border bg-muted/5 p-6">
          <h2 className="mb-4 text-lg font-medium">Landlord Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Landlord Name */}
            {residentialFields?.landlordName?.enabled && (
              <div className="space-y-2">
                <Label htmlFor={`landlordName-${form.id}`}>
                  Landlord Name {residentialFields.landlordName.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`landlordName-${form.id}`}
                  placeholder="Enter landlord's name"
                  value={form.landlordName}
                  onChange={(e) => onAddressFormChange(form.id, "landlordName", e.target.value)}
                  required={residentialFields.landlordName.required}
                />
              </div>
            )}

            {/* Landlord Email */}
            {residentialFields?.landlordEmail?.enabled && (
              <div className="space-y-2">
                <Label htmlFor={`landlordEmail-${form.id}`}>
                  Landlord Email {residentialFields.landlordEmail.required && <span className="text-destructive">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id={`landlordEmail-${form.id}`}
                    type="email"
                    placeholder="Enter landlord's email"
                    value={form.landlordEmail}
                    onChange={(e) => onAddressFormChange(form.id, "landlordEmail", e.target.value)}
                    required={residentialFields.landlordEmail.required}
                    className="peer ps-9"
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <Mail size={16} aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}

            {/* Landlord Phone - TODO: Needs state/handler update for PhoneInput */}
            {residentialFields?.landlordPhone?.enabled && (
              <div className="space-y-2">
                <Label htmlFor={`landlordPhone-${form.id}`}>
                  Landlord Phone {residentialFields.landlordPhone.required && <span className="text-destructive">*</span>}
                </Label>
                {/* Replace with PhoneNumberInput */}
                <PhoneNumberInput
                  id={`landlordPhone-${form.id}`}
                  placeholder="Enter landlord's phone"
                  value={form.landlordPhone}
                  onChange={(value) => onLandlordPhoneChange(form.id, value)}
                  // The 'required' prop might not be directly supported by RPNInput, validation is handled in page.tsx
                  // required={residentialFields.landlordPhone.required}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4" />
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Residence</h1>
      <p className="mb-6 text-muted-foreground">Enter the prospect&apos;s residence information.</p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-6">{addressForms.map((form) => renderAddressForm(form))}</CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-1" 
              type="button" 
              onClick={() => {
                if (canAddAddress) {
                  onAddAddressForm();
                } else {
                  onInvalidAddAttempt(); // Show toast if invalid
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Add Previous Address
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
            <Button onClick={onNext}>Next</Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}

