"use client"

import React, { useId } from "react"
import { ChevronDownIcon, PhoneIcon } from "lucide-react"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Define the props for the main PhoneNumberInput component
interface PhoneNumberInputProps extends Omit<RPNInput.Props<typeof RPNInput.default>, 'value' | 'onChange'> {
  value: RPNInput.Value | undefined;
  onChange: (value: RPNInput.Value | undefined) => void;
  label?: string;
  id?: string;
}

// Main component that wraps react-phone-number-input
const PhoneNumberInput = React.forwardRef<
  HTMLInputElement,
  PhoneNumberInputProps
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, label, id: propId, value, onChange, ...props }, _ref) => {
  const internalId = useId()
  const id = propId || internalId

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <RPNInput.default
        className="flex rounded-md shadow-xs"
        international
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneInput}
        id={id}
        placeholder="Enter phone number"
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  )
})
PhoneNumberInput.displayName = "PhoneNumberInput"

// Custom Input component for phone number field
const PhoneInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        data-slot="phone-input"
        className={cn(
          "-ms-px rounded-s-none shadow-none focus-visible:z-10",
          className
        )}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

// Custom Country Select component
type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  onChange: (value: RPNInput.Country) => void
  options: { label: string; value: RPNInput.Country | undefined }[]
}

const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
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
              {option.value && `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  )
}

// Custom Flag component
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

export { PhoneNumberInput } 