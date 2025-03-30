"use client"

import { useState } from "react"
import { Value } from "react-phone-number-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Eye, Mail, EyeOffIcon } from "lucide-react"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { cn } from "@/lib/utils"

interface PersonalInfoPageProps {
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

export default function PersonalInfoPage({ onNext, onPrevious }: PersonalInfoPageProps) {
  const [phoneNumber, setPhoneNumber] = useState<Value | undefined>()
  const [ssn, setSsn] = useState("")
  const [ssnVisible, setSsnVisible] = useState(false)
  const [driversLicenseState, setDriversLicenseState] = useState<string>("")
  const [driversLicenseNumber, setDriversLicenseNumber] = useState("")
  const [licenseError, setLicenseError] = useState<string>("")

  const formatSSN = (value: string): string => {
    if (!value) return ""
    const digits = value.replace(/\D/g, "").slice(0, 9)
    if (digits.length <= 3) return digits
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`
  }

  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    const digits = inputVal.replace(/\D/g, "").slice(0, 9)
    setSsn(formatSSN(digits))
  }

  const handleToggleSsnVisibility = () => {
    setSsnVisible(!ssnVisible)
  }

  // Helper function to format license number based on province pattern
  const formatLicenseNumber = (value: string, province: string) => {
    if (!province || !driverLicenseFormats[province as keyof typeof driverLicenseFormats]) {
      return value;
    }

    const format = driverLicenseFormats[province as keyof typeof driverLicenseFormats];
    let formattedValue = value.toUpperCase();

    // Remove any characters that don't match the pattern
    if (province === 'MB') {
      formattedValue = formattedValue.replace(/[^A-Z0-9*]/g, '');
    } else if (format.format.includes('A')) {
      formattedValue = formattedValue.replace(/[^A-Z0-9]/g, '');
    } else {
      formattedValue = formattedValue.replace(/[^0-9]/g, '');
    }

    return formattedValue.slice(0, format.maxLength);
  };

  // Helper function to validate license number
  const validateLicenseNumber = (license: string, province: string) => {
    if (!province) {
      setLicenseError('Please select a province first');
      return false;
    }

    if (!license) {
      setLicenseError(''); // Clear error if input is empty
      return true; // Allow empty input
    }

    const format = driverLicenseFormats[province as keyof typeof driverLicenseFormats];
    if (!format) {
      setLicenseError('Invalid province selected'); // Should not happen if province is selected
      return false;
    }

    const regex = new RegExp(`^${format.pattern}$`);
    if (!regex.test(license)) {
      setLicenseError(`License must match format: ${format.format}`);
      return false;
    }

    setLicenseError(''); // Clear error if valid
    return true;
  };

  const handleProvinceChange = (value: string) => {
    setDriversLicenseState(value);
    setDriversLicenseNumber(""); // Clear license number when province changes
    setLicenseError(""); // Clear any previous errors
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = formatLicenseNumber(e.target.value, driversLicenseState);
    setDriversLicenseNumber(newValue);
    validateLicenseNumber(newValue, driversLicenseState);
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Personal Information</h1>
      <p className="mb-6 text-muted-foreground">Enter the prospect&apos;s basic contact and personal information.</p>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          {/* Contact Information Section */}
          <div className="border-b p-6">
            <h2 className="mb-4 text-lg font-medium">Contact Information</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input id="firstName" placeholder="Enter first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" placeholder="Enter middle name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input id="lastName" placeholder="Enter last name" />
              </div>
              <div className="grid gap-6 md:col-span-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="email" placeholder="Enter email address" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <PhoneNumberInput
                    id="phone"
                    label="Phone Number"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    defaultCountry="CA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Identification Section */}
          <div className="border-b p-6">
            <h2 className="mb-4 text-lg font-medium">Identification</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ssn">SSN</Label>
                <div className="relative">
                  <Input
                    id="ssn"
                    placeholder="XXX-XX-XXXX"
                    type={ssnVisible ? "text" : "password"}
                    value={ssn}
                    onChange={handleSsnChange}
                    maxLength={11}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={handleToggleSsnVisibility}
                  >
                    {ssnVisible ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverLicenseProvince">Driver License Province</Label>
                <Select value={driversLicenseState} onValueChange={handleProvinceChange}>
                  <SelectTrigger id="driverLicenseProvince">
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Map over the provinces array to create SelectItem components */}
                    {provinces.map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverLicenseNumber">Driver&apos;s License Number</Label>
                <Input
                  id="driverLicenseNumber"
                  placeholder={driversLicenseState ? `Format: ${driverLicenseFormats[driversLicenseState as keyof typeof driverLicenseFormats]?.format}` : "Select province first"}
                  disabled={!driversLicenseState}
                  value={driversLicenseNumber}
                  onChange={handleLicenseChange}
                  maxLength={driversLicenseState ? driverLicenseFormats[driversLicenseState as keyof typeof driverLicenseFormats]?.maxLength : undefined}
                  className={cn(licenseError ? "border-destructive" : "")}
                />
                 {licenseError && (
                  <p className="text-xs text-destructive">{licenseError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="p-6">
            <h2 className="mb-4 text-lg font-medium">Additional Information</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="moveInDate">
                  Expected Move-in Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input id="moveInDate" placeholder="Select move-in date" />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date of Birth</Label>
                <div className="relative">
                  <Input id="birthDate" placeholder="Select date of birth" />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select>
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
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select>
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
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="about">Tell us why you&apos;re Great!</Label>
                <Textarea id="about" placeholder="Share a bit about yourself..." className="min-h-[100px]" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={onNext}>Next</Button>
        </CardFooter>
      </Card>
    </>
  )
}

