"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Minus, Plus, DollarSign, ChevronDownIcon, PhoneIcon } from "lucide-react"
import CalendarInput from "@/components/calendarwithmonthsinput"
import { useId } from "react"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import { cn } from "@/lib/utils"

// Define employment form interface
interface EmploymentForm {
  id: number
  isPrimary: boolean
  employerName: string
  jobTitle: string
  monthlyIncome: string
  employmentType: string
  startDate: string
  endDate: string
  isCurrentJob: boolean
  supervisorName: string
  supervisorPhone: string
  employerStreetAddress: string
  employerCity: string
  employerProvince: string
  employerPostalCode: string
  isExpanded: boolean
  startDateObj?: Date
  endDateObj?: Date
}

interface EmploymentPageProps {
  employmentForms: EmploymentForm[]
  onEmploymentFormChange: (id: number, field: string, value: unknown) => void
  onToggleEmploymentForm: (id: number) => void
  onRemoveEmploymentForm: (id: number) => void
  onAddEmploymentForm: () => void
  onNext: () => void
  onPrevious: () => void
}

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
    <div className="border-input text-muted-foreground focus-within:border-ring focus-within:ring-ring/50 hover:bg-accent hover:text-foreground has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 relative inline-flex items-center self-stretch rounded-l-md border py-2 ps-3 pe-2 transition-[color,box-shadow] outline-none focus-within:z-10 focus-within:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50">
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

export default function EmploymentPage({
  employmentForms,
  onEmploymentFormChange,
  onToggleEmploymentForm,
  onRemoveEmploymentForm,
  onAddEmploymentForm,
  onNext,
  onPrevious,
}: EmploymentPageProps) {
  // Generate a unique ID prefix for each rendering of the component
  const idPrefix = useId()
  
  // Render a single employment form
  const renderEmploymentForm = (form: EmploymentForm) => {
    const monthlyIncomeId = `${idPrefix}-monthlyIncome-${form.id}`
    const phoneInputId = `${idPrefix}-supervisorPhone-${form.id}`
    
    if (!form.isExpanded) {
      // Collapsed view for employment
      return (
        <div key={form.id} className="mb-2">
          <button
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/5 p-4 text-left transition-colors hover:bg-muted/10"
            onClick={() => onToggleEmploymentForm(form.id)}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span className="font-medium">
                {form.employerName || "Employer"}
                {form.jobTitle ? ` - ${form.jobTitle}` : ""}
              </span>
              {form.isCurrentJob && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!form.isPrimary && employmentForms.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveEmploymentForm(form.id)
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span className="font-medium">{form.isPrimary ? "Primary Employment" : "Additional Employment"}</span>
            {form.isCurrentJob && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!form.isPrimary && employmentForms.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={() => onRemoveEmploymentForm(form.id)}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onToggleEmploymentForm(form.id)}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="sr-only">Collapse</span>
            </Button>
          </div>
        </div>

        {/* Employer Information Section */}
        <div className="border-x border-b border-border bg-muted/5 border-b p-6">
          <h2 className="mb-4 text-lg font-medium">Employer Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`employerName-${form.id}`}>
                Employer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`employerName-${form.id}`}
                placeholder="Enter employer name"
                value={form.employerName}
                onChange={(e) => onEmploymentFormChange(form.id, "employerName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`jobTitle-${form.id}`}>
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`jobTitle-${form.id}`}
                placeholder="Enter job title"
                value={form.jobTitle}
                onChange={(e) => onEmploymentFormChange(form.id, "jobTitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={monthlyIncomeId}>
                Monthly Income <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id={monthlyIncomeId}
                  placeholder="Enter monthly income"
                  className="peer ps-9"
                  value={form.monthlyIncome}
                  onChange={(e) => onEmploymentFormChange(form.id, "monthlyIncome", e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                  <DollarSign size={16} aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`employmentType-${form.id}`}>
                Employment Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.employmentType}
                onValueChange={(value) => onEmploymentFormChange(form.id, "employmentType", value)}
              >
                <SelectTrigger id={`employmentType-${form.id}`}>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`startDate-${form.id}`}>
                Start Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <CalendarInput
                  value={form.startDateObj}
                  onChange={(date) => {
                    onEmploymentFormChange(form.id, "startDateObj", date);
                    onEmploymentFormChange(form.id, "startDate", date ? date.toISOString() : "");
                  }}
                  placeholder="Select start date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`endDate-${form.id}`}>End Date</Label>
              <div className="relative">
                <CalendarInput
                  value={form.endDateObj}
                  onChange={(date) => {
                    onEmploymentFormChange(form.id, "endDateObj", date);
                    onEmploymentFormChange(form.id, "endDate", date ? date.toISOString() : "");
                  }}
                  placeholder="Select end date"
                  disabled={form.isCurrentJob}
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`currentJob-${form.id}`}
                  checked={form.isCurrentJob}
                  onCheckedChange={(checked) => onEmploymentFormChange(form.id, "isCurrentJob", checked === true)}
                />
                <label
                  htmlFor={`currentJob-${form.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This is my current job
                </label>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`employmentVerification-${form.id}`}>
                Upload document showing your employment verification <span className="text-destructive">*</span>
              </Label>
              <div className="mt-2">
                <Button variant="outline" className="gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-upload"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  Upload Document
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload pay stubs, employment letter, or other verification documents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor Information Section */}
        <div className="border-x border-b border-border bg-muted/5 border-b p-6">
          <h2 className="mb-4 text-lg font-medium">Supervisor Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`supervisorName-${form.id}`}>Supervisor Name</Label>
              <Input
                id={`supervisorName-${form.id}`}
                placeholder="Enter supervisor name"
                value={form.supervisorName}
                onChange={(e) => onEmploymentFormChange(form.id, "supervisorName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={phoneInputId}>Supervisor Phone</Label>
              <RPNInput.default
                className="flex rounded-md shadow-xs"
                international
                flagComponent={FlagComponent}
                countrySelectComponent={CountrySelect}
                inputComponent={PhoneInput}
                id={phoneInputId}
                placeholder="Enter supervisor phone"
                value={form.supervisorPhone}
                onChange={(newValue) => onEmploymentFormChange(form.id, "supervisorPhone", newValue ?? "")}
              />
            </div>
          </div>
        </div>

        {/* Employer Address Section */}
        <div className="rounded-b-lg border-x border-b border-border bg-muted/5 p-6">
          <h2 className="mb-4 text-lg font-medium">Employer Address</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`employerStreetAddress-${form.id}`}>Street Address</Label>
              <Input
                id={`employerStreetAddress-${form.id}`}
                placeholder="Enter street address"
                value={form.employerStreetAddress}
                onChange={(e) => onEmploymentFormChange(form.id, "employerStreetAddress", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`employerCity-${form.id}`}>City</Label>
              <Input
                id={`employerCity-${form.id}`}
                placeholder="Enter city"
                value={form.employerCity}
                onChange={(e) => onEmploymentFormChange(form.id, "employerCity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`employerProvince-${form.id}`}>Province</Label>
              <Select
                value={form.employerProvince}
                onValueChange={(value) => onEmploymentFormChange(form.id, "employerProvince", value)}
              >
                <SelectTrigger id={`employerProvince-${form.id}`}>
                  <SelectValue placeholder="Select Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ab">Alberta</SelectItem>
                  <SelectItem value="bc">British Columbia</SelectItem>
                  <SelectItem value="on">Ontario</SelectItem>
                  <SelectItem value="qc">Quebec</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`employerPostalCode-${form.id}`}>Postal Code</Label>
              <Input
                id={`employerPostalCode-${form.id}`}
                placeholder="Enter postal code"
                value={form.employerPostalCode}
                onChange={(e) => onEmploymentFormChange(form.id, "employerPostalCode", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mb-4" />
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Employment</h1>
      <p className="mb-6 text-muted-foreground">
        Enter information about the prospect&apos;s employment. You can add up to 2 jobs.
      </p>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">{employmentForms.map((form) => renderEmploymentForm(form))}</CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-1"
              type="button"
              onClick={onAddEmploymentForm}
              disabled={employmentForms.length >= 2}
            >
              <Plus className="h-4 w-4" />
              Add Another Job
            </Button>
            {employmentForms.length >= 2 && (
              <span className="text-xs text-muted-foreground">Maximum of 2 jobs allowed</span>
            )}
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

