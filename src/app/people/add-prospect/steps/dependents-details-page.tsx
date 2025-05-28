"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronDownIcon, ChevronUp, Mail, Minus, PhoneIcon, Plus, User, UserRound } from "lucide-react"
import type { DependentType } from "./dependent-type-selection-page"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Define dependent form interface
interface DependentForm {
  id: number
  type: DependentType
  firstName: string
  middleName: string
  lastName: string
  relationship: string
  email: string
  phone: string
  shareOfRent: string
  isExpanded: boolean
}

interface DependentsDetailsPageProps {
  dependentForms: DependentForm[]
  onDependentFormChange: (id: number, field: string, value: string | number | boolean) => void
  onToggleDependentForm: (id: number) => void
  onRemoveDependentForm: (id: number) => void
  onAddDependentForm: () => void
  onNext: () => void
  onPrevious: () => void
}

// Phone input components
const PhoneInput = ({ className, ...props }: React.ComponentProps<"input">) => {
  return (
    <Input
      data-slot="phone-input"
      className={cn(
        "-ms-px rounded-s-none shadow-none focus-visible:z-10",
        className
      )}
      {...props}
    />
  )
}

PhoneInput.displayName = "PhoneInput"

type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  onChange: (value: RPNInput.Country) => void
  options: { label: string; value: RPNInput.Country | undefined }[]
}

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as RPNInput.Country)
  }

  return (
    <div className="border-input  text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 relative inline-flex items-center self-stretch rounded-l-md border py-2 ps-3 pe-2 transition-[color,box-shadow] outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50">
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
        <span className="text-muted-foreground/80">
          <ChevronDownIcon size={16} aria-hidden="true" />
        </span>
      </div>
      <select
        disabled={disabled}
        value={value}
        onChange={handleSelect}
        className="absolute inset-0 text-sm opacity-0"
        aria-label="Select country"
      >
        <option key="default" value="">
          Select a country
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option key={option.value ?? `empty-${i}`} value={option.value}>
              {option.label}{" "}
              {option.value &&
                `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  )
}

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country]

  return (
    <span className="w-5 overflow-hidden rounded-sm">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <PhoneIcon size={16} aria-hidden="true" />
      )}
    </span>
  )
}

// Validation function for a single dependent - ADJUSTED
const validateDependent = (form: DependentForm): string[] => {
  const missingFields: string[] = [];
  // Common required fields
  if (!form.firstName) missingFields.push("First Name");
  if (!form.lastName) missingFields.push("Last Name");
  if (!form.relationship) missingFields.push("Relationship");

  // Adult specific required fields - ADJUSTED
  if (form.type === 'adult') {
    if (!form.shareOfRent) missingFields.push("Share of Rent");
    // Require EITHER email OR phone
    if (!form.email && !form.phone) {
      missingFields.push("Email or Phone");
    }
  }
  
  // Child specific required fields (currently only common)
  // if (form.type === 'child') { ... }
  
  return missingFields;
}

export default function DependentsDetailsPage({
  dependentForms,
  onDependentFormChange,
  onToggleDependentForm,
  onRemoveDependentForm,
  onAddDependentForm,
  onNext,
  onPrevious,
}: DependentsDetailsPageProps) {

  // Handler for the "Add Another Occupant" button
  const handleAddAnotherClick = () => {
    if (dependentForms.length > 0) {
      const lastDependent = dependentForms[dependentForms.length - 1];
      const missingFields = validateDependent(lastDependent);
      
      if (missingFields.length > 0) {
        toast.error("Missing Dependent Information", {
          description: `Please fill out the following fields for the current dependent before adding another: ${missingFields.join(", ")}.`
        });
        return; // Stop if validation fails
      }
    }
    // If validation passes or no dependents yet, call the parent function
    onAddDependentForm();
  };

  // Render a single dependent form
  const renderDependentForm = (form: DependentForm) => {
    if (!form.isExpanded) {
      // Collapsed view for dependents
      return (
        <div key={form.id} className="mb-2">
          <button
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/5 p-4 text-left transition-colors hover:bg-muted/10"
            onClick={() => onToggleDependentForm(form.id)}
          >
            <div className="flex items-center gap-2">
              {form.type === "adult" ? (
                <User className="h-4 w-4 text-muted-foreground" />
              ) : (
                <UserRound className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">
                {`${form.firstName || (form.type === 'adult' ? 'Adult' : 'Dependent')} ${form.lastName || ''} (${form.relationship || (form.type === 'adult' ? 'Occupant' : 'Dependent')})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveDependentForm(form.id)
                }}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
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
            {form.type === "adult" ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <UserRound className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{form.type === "adult" ? "Adult Occupant" : "Dependent"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onRemoveDependentForm(form.id)}
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onToggleDependentForm(form.id)}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="sr-only">Collapse</span>
            </Button>
          </div>
        </div>

        {/* Adult Information Section */}
        {form.type === "adult" ? (
          <div className="rounded-b-lg border-x border-b border-border bg-muted/5 p-6">
            <div className="flex flex-col space-y-8">
              {/* Row 1: First Name *, Middle Name, Last Name * */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <Label htmlFor={`firstName-${form.id}`} className="mb-2 block">
                    First Name <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id={`firstName-${form.id}`}
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={(e) => onDependentFormChange(form.id, "firstName", e.target.value)}
                    className="bg-background/10 border-border"
                  />
                </div>
                <div>
                  <Label htmlFor={`middleName-${form.id}`} className="mb-2 block">
                    Middle Name
                  </Label>
                  <Input
                    id={`middleName-${form.id}`}
                    placeholder="Enter middle name"
                    value={form.middleName}
                    onChange={(e) => onDependentFormChange(form.id, "middleName", e.target.value)}
                    className="bg-background/10 border-border"
                  />
                </div>
                <div>
                  <Label htmlFor={`lastName-${form.id}`} className="mb-2 block">
                    Last Name <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id={`lastName-${form.id}`}
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={(e) => onDependentFormChange(form.id, "lastName", e.target.value)}
                    className="bg-background/10 border-border"
                  />
                </div>
              </div>

              {/* Row 2: Relationship *, Email, Phone */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <Label htmlFor={`relationship-${form.id}`} className="mb-2 block">
                    Relationship <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={form.relationship}
                    onValueChange={(value) => onDependentFormChange(form.id, "relationship", value)}
                  >
                    <SelectTrigger id={`relationship-${form.id}`} className="bg-background/10 border-border">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="roommate">Roommate</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`email-${form.id}`} className="mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`email-${form.id}`}
                      placeholder="Enter email address"
                      value={form.email}
                      onChange={(e) => onDependentFormChange(form.id, "email", e.target.value)}
                      className="bg-background/10 border-border pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`phone-${form.id}`} className="mb-2 block">
                    Phone
                  </Label>
                  <RPNInput.default
                    className="flex rounded-md shadow-xs bg-background/10"
                    international
                    flagComponent={FlagComponent}
                    countrySelectComponent={CountrySelect}
                    inputComponent={PhoneInput}
                    id={`phone-${form.id}`}
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={(value) => onDependentFormChange(form.id, "phone", value || "")}
                  />
                </div>
              </div>

              {/* Row 3: Share of Rent * */}
              <div>
                <Label htmlFor={`shareOfRent-${form.id}`} className="mb-2 block">
                  Share of Rent ($) <span className="text-destructive ml-1">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id={`shareOfRent-${form.id}`}
                    placeholder="Enter amount"
                    value={form.shareOfRent}
                    onChange={(e) => onDependentFormChange(form.id, "shareOfRent", e.target.value)}
                    className="bg-background/10 border-border pl-7"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Dependent Information Section
          <div className="rounded-b-lg border-x border-b border-border bg-muted/5 p-6">
            <div className="flex flex-col space-y-8">
              {/* Row 1: First Name *, Middle Name, Last Name * */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <Label htmlFor={`dependent-first-name-${form.id}`}>First Name <span className="text-destructive">*</span></Label>
                  <Input
                    id={`dependent-first-name-${form.id}`}
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={(e) => onDependentFormChange(form.id, "firstName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`dependent-middle-name-${form.id}`}>Middle Name</Label>
                  <Input
                    id={`dependent-middle-name-${form.id}`}
                    placeholder="Enter middle name"
                    value={form.middleName}
                    onChange={(e) => onDependentFormChange(form.id, "middleName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`dependent-last-name-${form.id}`}>Last Name <span className="text-destructive">*</span></Label>
                  <Input
                    id={`dependent-last-name-${form.id}`}
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={(e) => onDependentFormChange(form.id, "lastName", e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Relationship *, Phone Number */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <Label htmlFor={`dependent-relationship-${form.id}`}>Relationship <span className="text-destructive">*</span></Label>
                  <Select
                    value={form.relationship}
                    onValueChange={(value) => onDependentFormChange(form.id, "relationship", value)}
                  >
                    <SelectTrigger id={`dependent-relationship-${form.id}`}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`dependent-phone-${form.id}`}>Phone Number</Label>
                  <RPNInput.default
                    id={`dependent-phone-${form.id}`}
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={(value) => onDependentFormChange(form.id, "phone", value || "")}
                    inputComponent={PhoneInput}
                    countrySelectComponent={CountrySelect}
                    flagComponent={FlagComponent}
                    defaultCountry="CA"
                    international
                    withCountryCallingCode
                    className="flex w-full"
                    aria-invalid={!form.phone ? undefined : !RPNInput.isValidPhoneNumber(form.phone)}
                    data-testid="phone-input-group"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {dependentForms.length > 0 ? (
            dependentForms.map(renderDependentForm)
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No dependents added yet.
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
        <Button variant="outline" onClick={handleAddAnotherClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Another Occupant
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={onNext}>Next</Button>
        </div>
      </CardFooter>
    </Card>
  )
}

