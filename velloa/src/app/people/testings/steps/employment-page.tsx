"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Minus, Plus, DollarSign, Upload, BriefcaseBusiness } from "lucide-react"
import CalendarInput from "@/components/calendarwithmonthsinput"
import { useId } from "react"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import type * as RPNInput from "react-phone-number-input"

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
  verificationDocumentFile?: File | null
}

// --- Added Settings Interfaces ---
interface EmploymentFieldSetting {
  enabled: boolean;
  required: boolean;
}

export interface EmploymentFieldsSettings { // Exported for use in parent
  address?: EmploymentFieldSetting; // Optional based on provided JSON
  jobTitle?: EmploymentFieldSetting;
  startDate?: EmploymentFieldSetting;
  employerName?: EmploymentFieldSetting;
  monthlyIncome?: EmploymentFieldSetting;
  employmentType?: EmploymentFieldSetting;
  supervisorName?: EmploymentFieldSetting;
  verifyDocument?: EmploymentFieldSetting;
  supervisorPhone?: EmploymentFieldSetting;
}
// -------------------------------

interface EmploymentPageProps {
  employmentForms: EmploymentForm[]
  employmentFields: EmploymentFieldsSettings
  onEmploymentFormChange: (id: number, field: string, value: unknown) => void
  onToggleEmploymentForm: (id: number) => void
  onRemoveEmploymentForm: (id: number) => void
  onAddEmploymentForm: () => void
  onNext: () => void
  onPrevious: () => void
}

// --- Added Helper Label Component ---
const RequiredLabel = ({ htmlFor, children, isRequired }: { htmlFor: string; children: React.ReactNode; isRequired: boolean }) => (
  <Label htmlFor={htmlFor}>
    {children} {isRequired && <span className="text-destructive">*</span>}
  </Label>
);
// ----------------------------------

export default function EmploymentPage({
  employmentForms,
  employmentFields,
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
  const renderEmploymentForm = (form: EmploymentForm, index: number) => {
    const monthlyIncomeId = `${idPrefix}-monthlyIncome-${form.id}`
    const phoneInputId = `${idPrefix}-supervisorPhone-${form.id}`
    const fileInputId = `${idPrefix}-verifyDocument-${form.id}`;
    
    if (!form.isExpanded) {
      // Collapsed view for employment
      return (
        <div key={form.id} className="mb-2">
          <div
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/5 p-4 text-left transition-colors hover:bg-muted/10 cursor-pointer"
            onClick={() => onToggleEmploymentForm(form.id)}
          >
            <div className="flex items-center gap-2">
             <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                Employment {index + 1}: {form.employerName || "Employer"}
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
          </div>
        </div>
      )
    }

    return (
      <div key={form.id} className="mb-4">
        <div className="flex w-full items-center justify-between rounded-t-lg border border-b-0 border-border bg-muted/5 p-4">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Employment {index + 1}</span>
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

        {/* Combined Content Section (mimicking pets structure) */}
        <div className="border-x border-b rounded-b-lg border-border bg-muted/5 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Employer Name - Conditional Rendering */}
            {employmentFields?.employerName?.enabled && (
              <div className="space-y-2">
                <RequiredLabel htmlFor={`employerName-${form.id}`} isRequired={employmentFields.employerName.required}>
                  Employer Name
                </RequiredLabel>
                <Input
                  id={`employerName-${form.id}`}
                  placeholder="Enter employer name"
                  value={form.employerName}
                  onChange={(e) => onEmploymentFormChange(form.id, "employerName", e.target.value)}
                />
              </div>
            )}

            {/* Job Title - Conditional Rendering */}
            {employmentFields?.jobTitle?.enabled && (
              <div className="space-y-2">
                <RequiredLabel htmlFor={`jobTitle-${form.id}`} isRequired={employmentFields.jobTitle.required}>
                  Job Title
                </RequiredLabel>
                <Input
                  id={`jobTitle-${form.id}`}
                  placeholder="Enter job title"
                  value={form.jobTitle}
                  onChange={(e) => onEmploymentFormChange(form.id, "jobTitle", e.target.value)}
                />
              </div>
            )}

            {/* Monthly Income - Conditional Rendering */}
            {employmentFields?.monthlyIncome?.enabled && (
              <div className="space-y-2">
                <RequiredLabel htmlFor={monthlyIncomeId} isRequired={employmentFields.monthlyIncome.required}>
                  Monthly Income
                </RequiredLabel>
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
            )}

            {/* Employment Type - Conditional Rendering */}
            {employmentFields?.employmentType?.enabled && (
              <div className="space-y-2">
                <RequiredLabel htmlFor={`employmentType-${form.id}`} isRequired={employmentFields.employmentType.required}>
                  Employment Type
                </RequiredLabel>
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
            )}

            {/* Start Date - Conditional Rendering */}
            {employmentFields?.startDate?.enabled && (
              <div className="space-y-2">
                <RequiredLabel htmlFor={`startDate-${form.id}`} isRequired={employmentFields.startDate.required}>
                  Start Date
                </RequiredLabel>
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
            )}

            {/* End Date (only shown if not current job) */}
            {!form.isCurrentJob && (
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
                  />
                </div>
              </div>
            )}

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

            {/* --- Verify Document - Conditional Rendering --- */}
            {employmentFields?.verifyDocument?.enabled && (
              <div className="space-y-2 md:col-span-2">
                <RequiredLabel htmlFor={fileInputId} isRequired={employmentFields.verifyDocument.required}>
                  Proof of Employment / Income Verification Document
                </RequiredLabel>
                {/* Moved description text up */}
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload pay stubs, employment letter, or other verification documents.
                </p>
                {/* Hidden File Input */}
                <input
                  id={fileInputId}
                  type="file"
                  onChange={(e) => onEmploymentFormChange(form.id, "verificationDocumentFile", e.target.files?.[0] ?? null)}
                  className="hidden"
                  // Optional: Add accept attribute for specific file types
                  // accept=".pdf,.doc,.docx,.jpg,.png"
                />
                {/* Visible Upload Trigger (Label wrapping Button) - Now below description */}
                <Label htmlFor={fileInputId} className="mt-2 inline-flex items-center gap-2 cursor-pointer">
                  <Button
                    variant="outline"
                    className="gap-2 pointer-events-none"
                    type="button"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                  {form.verificationDocumentFile?.name && (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {form.verificationDocumentFile.name}
                    </span>
                  )}
                </Label>
              </div>
            )}
            {/* --------------------------------------------- */}
          </div>

          {/* Supervisor Information Section - Moved Inside */}
          <div className="mt-6"> {/* Added margin top for spacing */}
            <h2 className="mb-4 text-lg font-medium">Supervisor Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Supervisor Name - Conditional Rendering */}
              {employmentFields?.supervisorName?.enabled && (
                <div className="space-y-2">
                  <RequiredLabel htmlFor={`supervisorName-${form.id}`} isRequired={employmentFields.supervisorName.required}>
                    Supervisor Name
                  </RequiredLabel>
                  <Input
                    id={`supervisorName-${form.id}`}
                    placeholder="Enter supervisor name"
                    value={form.supervisorName}
                    onChange={(e) => onEmploymentFormChange(form.id, "supervisorName", e.target.value)}
                  />
                </div>
              )}

              {/* Supervisor Phone - Conditional Rendering */}
              {employmentFields?.supervisorPhone?.enabled && (
                <div className="space-y-2">
                  <RequiredLabel htmlFor={phoneInputId} isRequired={employmentFields.supervisorPhone.required}>
                    Supervisor Phone
                  </RequiredLabel>
                  <PhoneNumberInput
                    id={phoneInputId}
                    value={form.supervisorPhone as RPNInput.Value | undefined}
                    onChange={(newValue: RPNInput.Value | undefined) => onEmploymentFormChange(form.id, "supervisorPhone", newValue ?? "")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Employer Address Section - Moved Inside */}
          <div className="mt-6"> {/* Added margin top for spacing */}
            <h2 className="mb-4 text-lg font-medium">Employer Address</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Employer Name - Conditional Rendering */}
              {employmentFields?.address?.enabled && (
                <div className="space-y-2">
                  <RequiredLabel htmlFor={`employerStreetAddress-${form.id}`} isRequired={employmentFields.address.required}>
                    Street Address
                  </RequiredLabel>
                  <Input
                    id={`employerStreetAddress-${form.id}`}
                    placeholder="Enter street address"
                    value={form.employerStreetAddress}
                    onChange={(e) => onEmploymentFormChange(form.id, "employerStreetAddress", e.target.value)}
                  />
                </div>
              )}

              {/* Employer City - Conditional Rendering */}
              {employmentFields?.address?.enabled && (
                <div className="space-y-2">
                  <RequiredLabel htmlFor={`employerCity-${form.id}`} isRequired={employmentFields.address.required}>
                    City
                  </RequiredLabel>
                  <Input
                    id={`employerCity-${form.id}`}
                    placeholder="Enter city"
                    value={form.employerCity}
                    onChange={(e) => onEmploymentFormChange(form.id, "employerCity", e.target.value)}
                  />
                </div>
              )}

              {/* Employer Province - Conditional Rendering */}
              {employmentFields?.address?.enabled && (
                <div className="space-y-2">
                  <RequiredLabel htmlFor={`employerProvince-${form.id}`} isRequired={employmentFields.address.required}>
                    Province/State
                  </RequiredLabel>
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
              )}

              {/* Employer Postal Code - Conditional Rendering */}
              {employmentFields?.address?.enabled && (
                <div className="space-y-2">
                  <RequiredLabel htmlFor={`employerPostalCode-${form.id}`} isRequired={employmentFields.address.required}>
                    Postal/Zip Code
                  </RequiredLabel>
                  <Input
                    id={`employerPostalCode-${form.id}`}
                    placeholder="Enter postal code"
                    value={form.employerPostalCode}
                    onChange={(e) => onEmploymentFormChange(form.id, "employerPostalCode", e.target.value)}
                  />
                </div>
              )}
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

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-6">{employmentForms.map((form, index) => renderEmploymentForm(form, index))}</CardContent>
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

