"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Eye, Mail, EyeOffIcon } from "lucide-react"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import CalendarInput from "@/components/calendarwithmonthsinput"
import { format, parse, isValid } from "date-fns"
import { type ApplicantFieldsSettings, type PersonalInfoData } from "../page"
import { type Value as PhoneNumberValue } from "react-phone-number-input"

interface PersonalInfoPageProps {
  applicantFields: ApplicantFieldsSettings;
  formData: PersonalInfoData;
  onChange: (field: keyof PersonalInfoData, value: string | boolean) => void;
  onPhoneChange: (value: PhoneNumberValue | undefined) => void;
  onNext: () => void
  onPrevious: () => void
}

// Define the full list of provinces/territories
const provinces = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "YT", label: "Yukon" }
];

// Driver's License Format Patterns
const driverLicenseFormats = {
  AB: { pattern: "[0-9]{9}", format: "999999999", maxLength: 9 },
  BC: { pattern: "[0-9]{7}", format: "9999999", maxLength: 7 },
  MB: { pattern: "[A-Z][A-Z\\*]{5}[A-Z0-9]{2}[0-9]", format: "AKKKKAKXX9XX9", maxLength: 12 },
  NB: { pattern: "[0-9]{7}", format: "9999999", maxLength: 7 },
  NL: { pattern: "[A-Z][0-9]{9}", format: "A999999999", maxLength: 10 },
  NS: { pattern: "[A-Z]{5}[0-9]{9}", format: "AKKKK99999999", maxLength: 14 },
  NT: { pattern: "[0-9]{9}", format: "999999999", maxLength: 9 },
  NU: { pattern: "[0-9]{5}", format: "99999", maxLength: 5 },
  ON: { pattern: "[A-Z][0-9]{14}", format: "A99999999999999", maxLength: 15 },
  PE: { pattern: "[0-9]{5}", format: "99999", maxLength: 5 },
  QC: { pattern: "[A-Z][0-9]{12}", format: "A999999999999", maxLength: 13 },
  SK: { pattern: "[0-9]{8}", format: "99999999", maxLength: 8 },
  YT: { pattern: "[0-9]{6}", format: "999999", maxLength: 6 }
};

export default function PersonalInfoPage({ 
  applicantFields, 
  formData, 
  onChange, 
  onPhoneChange, 
  onNext, 
  onPrevious 
}: PersonalInfoPageProps) {
  const [ssnVisible, setSsnVisible] = useState(false)

  const formatSSN = (value: string): string => {
    if (!value) return ""
    const digits = value.replace(/\D/g, "").slice(0, 9)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`
  }

  const handleToggleSsnVisibility = () => {
    setSsnVisible(!ssnVisible)
  }

  const formatLicenseNumber = (value: string, province: string) => {
    if (!province || !driverLicenseFormats[province as keyof typeof driverLicenseFormats]) {
      return value;
    }
    const formatInfo = driverLicenseFormats[province as keyof typeof driverLicenseFormats];
    let formattedValue = value.toUpperCase();
    if (province === 'MB') {
      formattedValue = formattedValue.replace(/[^A-Z0-9*]/g, '');
    } else if (formatInfo.format.includes('A')) {
      formattedValue = formattedValue.replace(/[^A-Z0-9]/g, '');
    } else {
      formattedValue = formattedValue.replace(/[^0-9]/g, '');
    }
    return formattedValue.slice(0, formatInfo.maxLength);
  };

  // Add a handler for saving data to localStorage when next is clicked
  const handleNext = () => {
    // Save personal info data to localStorage
    localStorage.setItem('prospectPersonalInfo', JSON.stringify(formData));
    onNext();
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Personal Information</h1>
      <p className="mb-6 text-muted-foreground">Enter the prospect&apos;s basic contact and personal information.</p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-0">
          {(applicantFields?.firstName?.enabled || applicantFields?.middleName?.enabled || applicantFields?.lastName?.enabled || applicantFields?.email?.enabled || applicantFields?.phoneNumber?.enabled) && (
            <div className="border-b p-6">
              <h2 className="mb-4 text-lg font-medium">Contact Information</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {applicantFields?.firstName?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name {applicantFields.firstName.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input 
                      id="firstName" 
                      placeholder="Enter first name" 
                      value={formData.firstName}
                      onChange={(e) => onChange('firstName', e.target.value)}
                      required={applicantFields.firstName.required}
                    />
                  </div>
                )}
                {applicantFields?.middleName?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="middleName">
                      Middle Name {applicantFields.middleName.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input 
                      id="middleName" 
                      placeholder="Enter middle name" 
                      value={formData.middleName}
                      onChange={(e) => onChange('middleName', e.target.value)}
                      required={applicantFields.middleName.required}
                    />
                  </div>
                )}
                {applicantFields?.lastName?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name {applicantFields.lastName.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input 
                      id="lastName" 
                      placeholder="Enter last name" 
                      value={formData.lastName}
                      onChange={(e) => onChange('lastName', e.target.value)}
                      required={applicantFields.lastName.required}
                    />
                  </div>
                )}
              </div>
              {(applicantFields?.email?.enabled || applicantFields?.phoneNumber?.enabled) && (
                 <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {applicantFields?.email?.enabled && (
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email {applicantFields.email.required && <span className="text-destructive">*</span>}
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="Enter email address" 
                            value={formData.email}
                            onChange={(e) => onChange('email', e.target.value)}
                            required={applicantFields.email.required}
                            className="pl-9" 
                          />
                        </div>
                      </div>
                    )}
                    {applicantFields?.phoneNumber?.enabled && (
                      <div className="space-y-2">
                        <PhoneNumberInput
                          id="phone"
                          label={`Phone Number ${applicantFields.phoneNumber.required ? '*' : ''}`}
                          value={formData.phoneNumber}
                          onChange={onPhoneChange}
                          defaultCountry="CA"
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {(applicantFields?.ssn?.enabled || applicantFields?.driverLicenseState?.enabled || applicantFields?.driverLicenseNumber?.enabled) && (
            <div className="border-b p-6">
              <h2 className="mb-4 text-lg font-medium">Identification</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {applicantFields?.ssn?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="ssn">
                      SSN {applicantFields.ssn.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="ssn"
                        placeholder="XXX-XX-XXXX"
                        type={ssnVisible ? "text" : "password"}
                        value={formatSSN(formData.ssn)}
                        onChange={(e) => onChange('ssn', e.target.value.replace(/\D/g, '').slice(0, 9))}
                        maxLength={11}
                        required={applicantFields.ssn.required}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={handleToggleSsnVisibility}
                        aria-label={ssnVisible ? "Hide SSN" : "Show SSN"}
                      >
                        {ssnVisible ? <EyeOffIcon className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                {applicantFields?.driverLicenseState?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="driverLicenseProvince">
                      Driver License Province {applicantFields.driverLicenseState.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select 
                      value={formData.driverLicenseState} 
                      onValueChange={(value) => {
                        onChange('driverLicenseState', value);
                        onChange('driverLicenseNumber', '');
                      }}
                      required={applicantFields.driverLicenseState.required}
                    >
                      <SelectTrigger id="driverLicenseProvince">
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.value} value={province.value}>
                            {province.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {applicantFields?.driverLicenseNumber?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="driverLicenseNumber">
                      Driver&apos;s License Number {applicantFields.driverLicenseNumber.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      id="driverLicenseNumber"
                      placeholder={formData.driverLicenseState ? `Format: ${driverLicenseFormats[formData.driverLicenseState as keyof typeof driverLicenseFormats]?.format}` : "Select province first"}
                      disabled={!formData.driverLicenseState}
                      value={formData.driverLicenseNumber}
                      onChange={(e) => {
                        const formatted = formatLicenseNumber(e.target.value, formData.driverLicenseState);
                        onChange('driverLicenseNumber', formatted);
                      }}
                      maxLength={formData.driverLicenseState ? driverLicenseFormats[formData.driverLicenseState as keyof typeof driverLicenseFormats]?.maxLength : undefined}
                      required={applicantFields.driverLicenseNumber.required}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {(applicantFields?.moveInDate?.enabled || applicantFields?.dateOfBirth?.enabled || applicantFields?.gender?.enabled || applicantFields?.maritalStatus?.enabled || applicantFields?.tellUs?.enabled) && (
            <div className="p-6">
              <h2 className="mb-4 text-lg font-medium">Additional Information</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {applicantFields?.moveInDate?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="moveInDate">
                      Expected Move-in Date {applicantFields.moveInDate.required && <span className="text-destructive">*</span>}
                    </Label>
                    <CalendarInput
                      value={formData.moveInDate && isValid(parse(formData.moveInDate, 'yyyy-MM-dd', new Date())) ? parse(formData.moveInDate, 'yyyy-MM-dd', new Date()) : undefined}
                      onChange={(date) => onChange('moveInDate', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="Select move-in date"
                    />
                  </div>
                )}
                {applicantFields?.dateOfBirth?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">
                      Date of Birth {applicantFields.dateOfBirth.required && <span className="text-destructive">*</span>}
                    </Label>
                    <CalendarInput
                      value={formData.dateOfBirth && isValid(parse(formData.dateOfBirth, 'yyyy-MM-dd', new Date())) ? parse(formData.dateOfBirth, 'yyyy-MM-dd', new Date()) : undefined}
                      onChange={(date) => onChange('dateOfBirth', date ? format(date, 'yyyy-MM-dd') : '')}
                      placeholder="Select date of birth"
                    />
                  </div>
                )}
                {applicantFields?.gender?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gender {applicantFields.gender.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => onChange('gender', value)}
                      required={applicantFields.gender.required}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {applicantFields?.maritalStatus?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">
                      Marital Status {applicantFields.maritalStatus.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select 
                      value={formData.maritalStatus} 
                      onValueChange={(value) => onChange('maritalStatus', value)}
                      required={applicantFields.maritalStatus.required}
                    >
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {applicantFields?.tellUs?.enabled && (
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="about">
                      Tell us why you&apos;re Great! {applicantFields.tellUs.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Textarea 
                      id="about" 
                      placeholder="Share a bit about yourself..." 
                      value={formData.about}
                      onChange={(e) => onChange('about', e.target.value)}
                      required={applicantFields.tellUs.required}
                      className="min-h-[100px]" 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/5 p-6">
          <div className="flex w-full justify-between">
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}

