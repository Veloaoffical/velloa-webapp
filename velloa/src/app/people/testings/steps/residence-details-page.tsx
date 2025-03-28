"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Home, Mail, Minus, Plus, CalendarIcon, PhoneIcon, ChevronDownIcon, DollarSignIcon } from "lucide-react"
import {
  DateRangePicker, 
  Dialog,
  Group,
  Popover,
  Button as AriaButton
} from "react-aria-components"
import React from "react"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { cn } from "@/lib/utils"
import { RangeCalendar } from "@/components/ui/calendar-rac"
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac"

// Define address form interface
interface AddressForm {
  id: number
  isPrimary: boolean
  streetAddress: string
  city: string
  province: string
  postalCode: string
  isExpanded: boolean
}

interface ResidenceDetailsPageProps {
  addressForms: AddressForm[]
  onAddressFormChange: (id: number, field: string, value: string) => void
  onToggleAddressForm: (id: number) => void
  onRemoveAddressForm: (id: number) => void
  onAddAddressForm: () => void
  onNext: () => void
  onPrevious: () => void
}

export default function ResidenceDetailsPage({
  addressForms,
  onAddressFormChange,
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
            <div className="space-y-2">
              <Label htmlFor={`streetAddress-${form.id}`}>Street Address</Label>
              <Input
                id={`streetAddress-${form.id}`}
                placeholder="Enter street address"
                value={form.streetAddress}
                onChange={(e) => onAddressFormChange(form.id, "streetAddress", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`city-${form.id}`}>City</Label>
              <Input
                id={`city-${form.id}`}
                placeholder="Enter city"
                value={form.city}
                onChange={(e) => onAddressFormChange(form.id, "city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`province-${form.id}`}>Province</Label>
              <Select value={form.province} onValueChange={(value) => onAddressFormChange(form.id, "province", value)}>
                <SelectTrigger id={`province-${form.id}`}>
                  <SelectValue placeholder="Select Province" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor={`postalCode-${form.id}`}>Postal Code</Label>
              <Input
                id={`postalCode-${form.id}`}
                placeholder="Enter postal code"
                value={form.postalCode}
                onChange={(e) => onAddressFormChange(form.id, "postalCode", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Residence Details Section */}
        <div className="border-x border-b border-border bg-muted/5 border-b p-6">
          <h2 className="mb-4 text-lg font-medium">Residence Details</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`residentialStatus-${form.id}`}>Residential Status</Label>
              <Select>
                <SelectTrigger id={`residentialStatus-${form.id}`}>
                  <SelectValue placeholder="Rent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="own">Mortgage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`lengthOfStay-${form.id}`}>Length of Stay</Label>
              <DateRangePicker>
                <div className="flex">
                  <Group className={cn(dateInputStyle, "pe-9")}>
                    <DateInput slot="start" unstyled />
                    <span aria-hidden="true" className="text-muted-foreground/70 px-2">
                      -
                    </span>
                    <DateInput slot="end" unstyled />
                  </Group>
                  <AriaButton className="text-muted-foreground/80 hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none data-focus-visible:ring-[3px]">
                    <CalendarIcon size={16} />
                  </AriaButton>
                </div>
                <Popover
                  className="bg-background text-popover-foreground data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 z-50 rounded-md border shadow-lg outline-hidden"
                  offset={4}
                >
                  <Dialog className="max-h-[inherit] overflow-auto p-2">
                    <RangeCalendar />
                  </Dialog>
                </Popover>
              </DateRangePicker>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`monthlyRent-${form.id}`}>Monthly Rent</Label>
              <div className="relative">
                <Input 
                  id={`monthlyRent-${form.id}`} 
                  placeholder="Enter monthly rent" 
                  className="peer ps-9" 
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <DollarSignIcon size={16} aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reasonForLeaving-${form.id}`}>Reason for Leaving</Label>
              <Input id={`reasonForLeaving-${form.id}`} placeholder="Enter reason" />
            </div>
          </div>
        </div>

        {/* Landlord Information Section */}
        <div className="rounded-b-lg border-x border-b border-border bg-muted/5 p-6">
          <h2 className="mb-4 text-lg font-medium">Landlord Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`landlordName-${form.id}`}>Landlord Name</Label>
              <Input id={`landlordName-${form.id}`} placeholder="Enter landlord name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`landlordPhone-${form.id}`}>Landlord Phone</Label>
              <RPNInput.default
                className="flex rounded-md shadow-xs"
                international
                flagComponent={FlagComponent}
                countrySelectComponent={CountrySelect}
                inputComponent={PhoneInput}
                id={`landlordPhone-${form.id}`}
                placeholder="Enter landlord phone"
                onChange={() => {}}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`landlordEmail-${form.id}`}>Landlord Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id={`landlordEmail-${form.id}`} placeholder="Enter landlord email" className="pl-9" />
              </div>
            </div>
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

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">{addressForms.map((form) => renderAddressForm(form))}</CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1" type="button" onClick={onAddAddressForm}>
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

// Add the components for the phone input at the end of the file
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
    <div className="border-input text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 relative inline-flex items-center self-stretch rounded-s-md border py-2 ps-3 pe-2 transition-[color,box-shadow] outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50">
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

