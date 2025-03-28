"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Eye, Mail, Phone } from "lucide-react"

interface PersonalInfoPageProps {
  onNext: () => void
  onPrevious: () => void
}

export default function PersonalInfoPage({ onNext, onPrevious }: PersonalInfoPageProps) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Personal Information</h1>
      <p className="mb-6 text-muted-foreground">Enter the prospect's basic contact and personal information.</p>

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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="email" placeholder="Enter email address" className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="+1" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                      <SelectItem value="+61">+61</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" placeholder="Enter phone number" className="pl-9" />
                  </div>
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
                  <Input id="ssn" placeholder="Enter SSN" type="password" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverLicenseProvince">Driver License Province</Label>
                <Select>
                  <SelectTrigger id="driverLicenseProvince">
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
                <Label htmlFor="driverLicenseNumber">Driver's License Number</Label>
                <Input id="driverLicenseNumber" placeholder="Select province first" disabled />
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
                <Label htmlFor="about">Tell us why you're Great!</Label>
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

