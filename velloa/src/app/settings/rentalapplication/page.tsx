"use client"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useState, useEffect, useId } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Settings,
  User,
  Building,
  Car,
  Users,
  Briefcase,
  Dog,
  FileQuestion,
  ScrollText,
  Bell,
  Link2,
  Shield,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

const settings = [
  {
    icon: <Settings className="w-5 h-5 text-green-600" />,
    label: "Settings",
    description: "Select a background check plan for your rental applications",
  },
  {
    icon: <User className="w-5 h-5 text-green-600" />,
    label: "Applicant Info",
    description: "Configure which fields are visible and required in the applicant information section",
  },
  {
    icon: <Building className="w-5 h-5 text-green-600" />,
    label: "Residential",
    description: "Set residential history requirements",
  },
  {
    icon: <Briefcase className="w-5 h-5 text-green-600" />,
    label: "Employment",
    description: "Configure employment information fields",
  },
  {
    icon: <Car className="w-5 h-5 text-green-600" />,
    label: "Vehicle",
    description: "Do you want to collect vehicle information from applicants?",
  },
  {
    icon: <Users className="w-5 h-5 text-green-600" />,
    label: "Dependants",
    description: "Configure dependant information fields",
  },
  {
    icon: <Dog className="w-5 h-5 text-green-600" />,
    label: "Pets",
    description: "Configure pet information requirements",
  },
  {
    icon: <FileQuestion className="w-5 h-5 text-green-600" />,
    label: "Custom Questions",
    description: "Add custom questions to the application",
  },
  {
    icon: <ScrollText className="w-5 h-5 text-green-600" />,
    label: "Terms and Conditions",
    description: "Set application terms and conditions",
  },
  {
    icon: <Bell className="w-5 h-5 text-green-600" />,
    label: "Notifications",
    description: "Configure application notification settings",
  },
  {
    icon: <Link2 className="w-5 h-5 text-green-600" />,
    label: "Application Link",
    description: "Manage public application form links",
  },
  {
    icon: <Shield className="w-5 h-5 text-green-600" />,
    label: "Background Check",
    description: "Configure background check settings",
  },
  {
    icon: <UserCheck className="w-5 h-5 text-green-600" />,
    label: "ID Check",
    description: "Set ID verification requirements",
  },
];

export default function RentalApplicationSettingsPage() {
  const [activeSection, setActiveSection] = useState("Settings");
  const [isClient, setIsClient] = useState(false);
  const id = useId();
  
  // Applicant Info field states
  const [applicantFields, setApplicantFields] = useState({
    firstName: { enabled: true, required: true },
    middleName: { enabled: true, required: false },
    lastName: { enabled: true, required: true },
    ssn: { enabled: true, required: true },
    dateOfBirth: { enabled: true, required: true },
    email: { enabled: true, required: true },
    phoneNumber: { enabled: true, required: true },
    gender: { enabled: true, required: false },
    maritalStatus: { enabled: true, required: false },
    driverLicenseState: { enabled: true, required: false },
    driverLicenseNumber: { enabled: true, required: false },
    moveInDate: { enabled: true, required: true },
    tellUs: { enabled: true, required: false },
  });
  
  // Residential field states
  const [residentialFields, setResidentialFields] = useState({
    address: { enabled: true, required: true },
    landlordName: { enabled: true, required: false },
    landlordPhone: { enabled: true, required: false },
    landlordEmail: { enabled: true, required: false },
    lengthOfStay: { enabled: true, required: true },
    monthlyRent: { enabled: true, required: true },
    residentialStatus: { enabled: true, required: true },
    reasonForLeaving: { enabled: true, required: true },
  });
  
  // Employment field states
  const [employmentFields, setEmploymentFields] = useState({
    employerName: { enabled: true, required: true },
    jobTitle: { enabled: true, required: true },
    monthlyIncome: { enabled: true, required: true },
    employmentType: { enabled: true, required: true },
    startDate: { enabled: true, required: true },
    verifyDocument: { enabled: true, required: true },
    supervisorName: { enabled: true, required: false },
    supervisorPhone: { enabled: true, required: false },
    address: { enabled: true, required: false },
  });

  // Vehicle field states
  const [vehicleOption, setVehicleOption] = useState("ask");
  
  // Dependants field states
  const [dependantsOption, setDependantsOption] = useState("ask");
  
  // Pets field states
  const [petsOption, setPetsOption] = useState("ask");
  
  // Custom Questions field states
  const [customQuestionsOption, setCustomQuestionsOption] = useState("ask");
  const [customQuestions, setCustomQuestions] = useState([
    { id: 1, question: "", answerType: "Yes/No" }
  ]);
  
  // Terms and Conditions state
  const [termsOption, setTermsOption] = useState("yes");
  const [termsText, setTermsText] = useState("");
  
  // Notifications state
  const [selectedUser, setSelectedUser] = useState("");
  const [notifyOption, setNotifyOption] = useState("yes");
  const [companyMembers, setCompanyMembers] = useState<{ id: string, first_name: string, last_name: string, role: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch company members
  useEffect(() => {
    if (notifyOption === "yes") {
      const fetchCompanyMembers = async () => {
        setIsLoading(true);
        try {
          // Get company members from API
          const response = await fetch('/api/company/members');
          const data = await response.json();
          
          if (Array.isArray(data)) {
            setCompanyMembers(data);
            
            // Select first member if available
            if (data.length > 0) {
              setSelectedUser(data[0].id);
            }
          } else {
            console.error("Invalid response format:", data);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching company members:", error);
          setIsLoading(false);
        }
      };
      
      fetchCompanyMembers();
    }
  }, [notifyOption]);

  const scrollToSection = (label: string) => {
    setActiveSection(label);
    const element = document.getElementById(`section-${label}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleSave = () => {
    // Add save functionality here
    console.log("Settings saved");
  };
  
  const handleApplicantFieldToggle = (field: string, type: 'enabled' | 'required') => {
    setApplicantFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof applicantFields],
        [type]: !prev[field as keyof typeof applicantFields][type]
      }
    }));
  };
  
  const handleResidentialFieldToggle = (field: string, type: 'enabled' | 'required') => {
    setResidentialFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof residentialFields],
        [type]: !prev[field as keyof typeof residentialFields][type]
      }
    }));
  };
  
  const handleEmploymentFieldToggle = (field: string, type: 'enabled' | 'required') => {
    setEmploymentFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof employmentFields],
        [type]: !prev[field as keyof typeof employmentFields][type]
      }
    }));
  };

  const handleAddQuestion = () => {
    setCustomQuestions(prev => [
      ...prev, 
      { 
        id: prev.length > 0 ? Math.max(...prev.map(q => q.id)) + 1 : 1, 
        question: "", 
        answerType: "Yes/No" 
      }
    ]);
  };
  
  const handleRemoveQuestion = (id: number) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  };
  
  const handleQuestionChange = (id: number, field: 'question' | 'answerType', value: string) => {
    setCustomQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, [field]: value } : q)
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6">
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-2">
            <Link
              href="/settings"
              className="group inline-flex items-center justify-start gap-2 px-4 py-2 hover:bg-muted rounded-lg"
            >
              <ArrowLeft
                className="-ms-1 me-2 opacity-60 transition-transform group-hover:-translate-x-0.5"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Back to Settings
            </Link>
            <div className="border-b border-border mb-4" />
            {settings.map((setting) => (
              <button
                key={setting.label}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg text-sm w-full text-left transition-colors",
                  activeSection === setting.label && isClient
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] hover:opacity-80"
                )}
                onClick={() => scrollToSection(setting.label)}
              >
                {setting.icon}
                {setting.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-12">
              {settings.map((setting) => (
                <div id={`section-${setting.label}`} key={setting.label} className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {setting.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">{setting.label}</h2>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                    </div>
                    {setting.label === "Settings" && <Separator className="mt-6" />}
                  </div>

                  {setting.label === "Settings" ? (
                    <div className="grid gap-6">
                      {/* Settings content */}
                      <RadioGroup className="gap-4" defaultValue="all-in-one">
                        {/* All-in-One Solution */}
                        <div className="border-input has-data-[state=checked]:border-ring has-data-[state=checked]:bg-accent relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                          <RadioGroupItem
                            value="all-in-one"
                            id={`${id}-all-in-one`}
                            aria-describedby={`${id}-all-in-one-description`}
                            className="order-1 after:absolute after:inset-0"
                          />
                          <div className="grid grow gap-2">
                            <Label htmlFor={`${id}-all-in-one`} className="flex justify-between">
                              <div>
                                All-in-One Solution{" "}
                                <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
                                  (Recommended)
                                </span>
                              </div>
                            </Label>
                            <div id={`${id}-all-in-one-description`} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                No additional setup or merchant account required
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Applicants pay $25 for their background check
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Access comprehensive criminal, eviction, and credit reports from TransUnion
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Application-Only Plan */}
                        <div className="border-input has-data-[state=checked]:border-ring has-data-[state=checked]:bg-accent relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                          <RadioGroupItem
                            value="application-only"
                            id={`${id}-application-only`}
                            aria-describedby={`${id}-application-only-description`}
                            className="order-1 after:absolute after:inset-0"
                          />
                          <div className="grid grow gap-2">
                            <Label htmlFor={`${id}-application-only`}>
                              Application-Only Plan{" "}
                            </Label>
                            <div id={`${id}-application-only-description`} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Free and unlimited application form submissions
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                Screening not included; reports available for a fee upon request
                              </div>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Applicant Info" ? (
                    <div className="grid gap-6">
                     
                      
                      <div className="border rounded-md p-4 bg-background">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <div className="font-medium text-sm">Field</div>
                            <div className="font-medium text-sm text-right">Required</div>
                          </div>
                          
                          <div className="space-y-4">
                            {/* First Name */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={true}
                                  disabled={true}
                                />
                                <div className="text-sm">First Name</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={true}
                                  disabled={true}
                                />
                              </div>
                            </div>
                            
                            {/* Middle Name */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.middleName.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('middleName', 'enabled')}
                                />
                                <div className="text-sm">Middle Name</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.middleName.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('middleName', 'required')}
                                  disabled={!applicantFields.middleName.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Last Name */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={true}
                                  disabled={true}
                                />
                                <div className="text-sm">Last Name</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={true}
                                  disabled={true}
                                />
                              </div>
                            </div>
                            
                            {/* SSN */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.ssn.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('ssn', 'enabled')}
                                />
                                <div className="text-sm">SSN</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.ssn.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('ssn', 'required')}
                                  disabled={!applicantFields.ssn.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Date of Birth */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.dateOfBirth.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('dateOfBirth', 'enabled')}
                                />
                                <div className="text-sm">Date Of Birth</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.dateOfBirth.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('dateOfBirth', 'required')}
                                  disabled={!applicantFields.dateOfBirth.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Email */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={true}
                                  disabled={true}
                                />
                                <div className="text-sm">Email</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={true}
                                  disabled={true}
                                />
                              </div>
                            </div>
                            
                            {/* Phone Number */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.phoneNumber.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('phoneNumber', 'enabled')}
                                />
                                <div className="text-sm">Phone Number</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.phoneNumber.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('phoneNumber', 'required')}
                                  disabled={!applicantFields.phoneNumber.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Gender */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.gender.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('gender', 'enabled')}
                                />
                                <div className="text-sm">Gender</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.gender.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('gender', 'required')}
                                  disabled={!applicantFields.gender.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Marital Status */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.maritalStatus.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('maritalStatus', 'enabled')}
                                />
                                <div className="text-sm">Marital Status</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.maritalStatus.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('maritalStatus', 'required')}
                                  disabled={!applicantFields.maritalStatus.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Driver License State */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.driverLicenseState.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('driverLicenseState', 'enabled')}
                                />
                                <div className="text-sm">Driver License State</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.driverLicenseState.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('driverLicenseState', 'required')}
                                  disabled={!applicantFields.driverLicenseState.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Driver License Number */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.driverLicenseNumber.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('driverLicenseNumber', 'enabled')}
                                />
                                <div className="text-sm">Driver License Number</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.driverLicenseNumber.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('driverLicenseNumber', 'required')}
                                  disabled={!applicantFields.driverLicenseNumber.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Move-in Date */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.moveInDate.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('moveInDate', 'enabled')}
                                />
                                <div className="text-sm">Move-in Date</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.moveInDate.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('moveInDate', 'required')}
                                  disabled={!applicantFields.moveInDate.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Tell us why you're awesome */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={applicantFields.tellUs.enabled}
                                  onCheckedChange={() => handleApplicantFieldToggle('tellUs', 'enabled')}
                                />
                                <div className="text-sm">about you</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={applicantFields.tellUs.required}
                                  onCheckedChange={() => handleApplicantFieldToggle('tellUs', 'required')}
                                  disabled={!applicantFields.tellUs.enabled}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Residential" ? (
                    <div className="grid gap-6">
                      <div className="border rounded-md p-4 bg-background">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <div className="font-medium text-sm">Field</div>
                            <div className="font-medium text-sm text-right">Required</div>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Address */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={true}
                                  disabled={true}
                                />
                                <div className="text-sm">Address</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={true}
                                  disabled={true}
                                />
                              </div>
                            </div>
                            
                            {/* Landlord/Company Name */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={residentialFields.landlordName.enabled}
                                  onCheckedChange={() => handleResidentialFieldToggle('landlordName', 'enabled')}
                                />
                                <div className="text-sm">Landlord/Company Name</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={residentialFields.landlordName.required}
                                  onCheckedChange={() => handleResidentialFieldToggle('landlordName', 'required')}
                                  disabled={!residentialFields.landlordName.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Landlord Phone */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={residentialFields.landlordPhone.enabled}
                                  onCheckedChange={() => handleResidentialFieldToggle('landlordPhone', 'enabled')}
                                />
                                <div className="text-sm">Landlord Phone</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={residentialFields.landlordPhone.required}
                                  onCheckedChange={() => handleResidentialFieldToggle('landlordPhone', 'required')}
                                  disabled={!residentialFields.landlordPhone.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Landlord Email */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={residentialFields.landlordEmail.enabled}
                                  onCheckedChange={() => handleResidentialFieldToggle('landlordEmail', 'enabled')}
                                />
                                <div className="text-sm">Landlord Email</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={residentialFields.landlordEmail.required}
                                  onCheckedChange={() => handleResidentialFieldToggle('landlordEmail', 'required')}
                                  disabled={!residentialFields.landlordEmail.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Length of Stay */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={true}
                                  disabled={true}
                                />
                                <div className="text-sm">Length of Stay</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={true}
                                  disabled={true}
                                />
                              </div>
                            </div>
                            
                            {/* Monthly Rent */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={true}
                                  disabled={true}
                                />
                                <div className="text-sm">Monthly Rent</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={true}
                                  disabled={true}
                                />
                              </div>
                            </div>
                            
                            {/* Residential Status */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={true}
                                  disabled={true}
                                />
                                <div className="text-sm">Residential Status</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={true}
                                  disabled={true}
                                />
                              </div>
                            </div>
                            
                            {/* Reason for Leaving */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={residentialFields.reasonForLeaving.enabled}
                                  onCheckedChange={() => handleResidentialFieldToggle('reasonForLeaving', 'enabled')}
                                />
                                <div className="text-sm">Reason for Leaving</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={residentialFields.reasonForLeaving.required}
                                  onCheckedChange={() => handleResidentialFieldToggle('reasonForLeaving', 'required')}
                                  disabled={!residentialFields.reasonForLeaving.enabled}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Employment" ? (
                    <div className="grid gap-6">
                      <div className="border rounded-md p-4 bg-background">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4 border-b pb-2">
                            <div className="font-medium text-sm">Field</div>
                            <div className="font-medium text-sm text-right">Required</div>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Employer Name */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.employerName.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('employerName', 'enabled')}
                                />
                                <div className="text-sm">Employer Name</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.employerName.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('employerName', 'required')}
                                  disabled={!employmentFields.employerName.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Job Title */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.jobTitle.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('jobTitle', 'enabled')}
                                />
                                <div className="text-sm">Job Title</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.jobTitle.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('jobTitle', 'required')}
                                  disabled={!employmentFields.jobTitle.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Monthly Income */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.monthlyIncome.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('monthlyIncome', 'enabled')}
                                />
                                <div className="text-sm">Monthly Income</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.monthlyIncome.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('monthlyIncome', 'required')}
                                  disabled={!employmentFields.monthlyIncome.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Employment Type */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.employmentType.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('employmentType', 'enabled')}
                                />
                                <div className="text-sm">Employment Type</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.employmentType.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('employmentType', 'required')}
                                  disabled={!employmentFields.employmentType.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Start Date */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.startDate.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('startDate', 'enabled')}
                                />
                                <div className="text-sm">Start Date</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.startDate.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('startDate', 'required')}
                                  disabled={!employmentFields.startDate.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Verify Document */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.verifyDocument.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('verifyDocument', 'enabled')}
                                />
                                <div className="text-sm">Verify Document</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.verifyDocument.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('verifyDocument', 'required')}
                                  disabled={!employmentFields.verifyDocument.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Supervisor Name */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.supervisorName.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('supervisorName', 'enabled')}
                                />
                                <div className="text-sm">Supervisor Name</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.supervisorName.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('supervisorName', 'required')}
                                  disabled={!employmentFields.supervisorName.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Supervisor Phone */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.supervisorPhone.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('supervisorPhone', 'enabled')}
                                />
                                <div className="text-sm">Supervisor Phone</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.supervisorPhone.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('supervisorPhone', 'required')}
                                  disabled={!employmentFields.supervisorPhone.enabled}
                                />
                              </div>
                            </div>
                            
                            {/* Address */}
                            <div className="grid grid-cols-2 items-center">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={employmentFields.address.enabled}
                                  onCheckedChange={() => handleEmploymentFieldToggle('address', 'enabled')}
                                />
                                <div className="text-sm">Address</div>
                              </div>
                              <div className="flex justify-end">
                                <Checkbox 
                                  checked={employmentFields.address.required}
                                  onCheckedChange={() => handleEmploymentFieldToggle('address', 'required')}
                                  disabled={!employmentFields.address.enabled}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Vehicle" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={vehicleOption}
                          onValueChange={setVehicleOption}
                        >
                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="ask" 
                              id="vehicle-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <Car className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">Ask for vehicle information</p>
                              <p className="text-xs text-muted-foreground">Collect vehicle details from applicants</p>
                            </div>
                          </label>

                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="dont-ask" 
                              id="vehicle-dont-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">Don&apos;t ask for vehicle information</p>
                              <p className="text-xs text-muted-foreground">Skip vehicle details collection</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Dependants" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={dependantsOption}
                          onValueChange={setDependantsOption}
                        >
                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="ask" 
                              id="dependants-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">Ask for dependant information</p>
                              <p className="text-xs text-muted-foreground">Collect details about children or other dependants</p>
                            </div>
                          </label>

                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="dont-ask" 
                              id="dependants-dont-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">Don&apos;t ask for dependant information</p>
                              <p className="text-xs text-muted-foreground">Skip dependant details collection</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Pets" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={petsOption}
                          onValueChange={setPetsOption}
                        >
                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="ask" 
                              id="pets-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <Dog className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">Ask for pet information</p>
                              <p className="text-xs text-muted-foreground">Collect details about applicants&apos; pets</p>
                            </div>
                          </label>

                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="dont-ask" 
                              id="pets-dont-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">Don&apos;t ask for pet information</p>
                              <p className="text-xs text-muted-foreground">Skip pet details collection</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Custom Questions" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={customQuestionsOption}
                          onValueChange={setCustomQuestionsOption}
                        >
                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="ask" 
                              id="custom-questions-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <FileQuestion className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">Include custom questions</p>
                              <p className="text-xs text-muted-foreground">Add your own questions to the application</p>
                            </div>
                          </label>

                          <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="dont-ask" 
                              id="custom-questions-dont-ask" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium leading-none">No custom questions</p>
                              <p className="text-xs text-muted-foreground">Use only standard application questions</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>
                      
                      {customQuestionsOption === "ask" && (
                        <div className="space-y-4">
                          <div className="font-medium text-lg text-center">Additional Questions</div>
                          
                          <div className="grid gap-4 max-w-4xl mx-auto">
                            {/* Header row */}
                            <div className="grid grid-cols-12 gap-4 items-center font-medium text-sm border-b pb-2">
                              <div className="col-span-7">Question</div>
                              <div className="col-span-4">Answer Type</div>
                              <div className="col-span-1"></div>
                            </div>
                            
                            {/* Question rows */}
                            {customQuestions.map((question) => (
                              <div key={question.id} className="grid grid-cols-12 gap-4 items-center border-b pb-3 last:border-0">
                                <div className="col-span-7">
                                  <input
                                    className="w-full p-2 border rounded-md"
                                    value={question.question}
                                    onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                                    placeholder="Enter your question here"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <Select
                                    value={question.answerType}
                                    onValueChange={(value) => handleQuestionChange(question.id, 'answerType', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Answer type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Yes/No">Yes/No</SelectItem>
                                      <SelectItem value="Text">Text</SelectItem>
                                      <SelectItem value="Number">Number</SelectItem>
                                      <SelectItem value="Date">Date</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  {customQuestions.length > 1 && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleRemoveQuestion(question.id)}
                                      className="h-8 text-destructive hover:text-destructive/90"
                                    >
                                      ✕
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-start max-w-4xl mx-auto">
                            <Button 
                              variant="link"
                              onClick={handleAddQuestion}
                              className="px-0 text-primary font-medium"
                            >
                              + Add Another
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Notifications" ? (
                    <div className="grid gap-6">
                      <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="space-y-4">
                          <div className="font-medium text-lg text-center">Notification Settings</div>
                          
                          <RadioGroup 
                            className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-lg mx-auto"
                            value={notifyOption}
                            onValueChange={setNotifyOption}
                          >
                            <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                              <RadioGroupItem 
                                value="yes" 
                                id="notify-yes" 
                                className="sr-only after:absolute after:inset-0" 
                              />
                              <Bell className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">Yes, enable notifications</p>
                                <p className="text-xs text-muted-foreground">Notify users when applications are submitted</p>
                              </div>
                            </label>

                            <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                              <RadioGroupItem 
                                value="no" 
                                id="notify-no" 
                                className="sr-only after:absolute after:inset-0" 
                              />
                              <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">No notifications</p>
                                <p className="text-xs text-muted-foreground">Don&apos;t send notification emails</p>
                              </div>
                            </label>
                          </RadioGroup>
                        </div>
                        
                        {notifyOption === "yes" && (
                          <div className="space-y-2 max-w-3xl mx-auto pt-4">
                            <Label>Select company member to notify</Label>
                            <Select
                              value={selectedUser}
                              onValueChange={setSelectedUser}
                              disabled={isLoading}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={isLoading ? "Loading members..." : "Select a company member"} />
                              </SelectTrigger>
                              <SelectContent>
                                {companyMembers.length > 0 ? (
                                  companyMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      <div className="flex flex-col">
                                        <span>{member.first_name} {member.last_name}</span>
                                        <span className="text-xs text-muted-foreground"></span>
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-members" disabled>
                                    {isLoading ? "Loading..." : "No company members found"}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                        
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : setting.label === "Terms and Conditions" ? (
                    <div className="grid gap-6">
                      <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="space-y-4">
                          <div className="font-medium text-lg text-center">Include Terms and Conditions?</div>
                          
                          <RadioGroup 
                            className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-lg mx-auto"
                            value={termsOption}
                            onValueChange={setTermsOption}
                          >
                            <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                              <RadioGroupItem 
                                value="yes" 
                                id="terms-yes" 
                                className="sr-only after:absolute after:inset-0" 
                              />
                              <ScrollText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">Yes, include terms and conditions</p>
                                <p className="text-xs text-muted-foreground">Applicants must agree to your terms</p>
                              </div>
                            </label>

                            <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-3 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                              <RadioGroupItem 
                                value="no" 
                                id="terms-no" 
                                className="sr-only after:absolute after:inset-0" 
                              />
                              <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">No terms and conditions</p>
                                <p className="text-xs text-muted-foreground">Skip terms and conditions</p>
                              </div>
                            </label>
                          </RadioGroup>
                        </div>
                        
                        {termsOption === "yes" && (
                          <div className="space-y-4 max-w-3xl mx-auto">
                            <div className="font-medium">Enter Your Terms and Conditions</div>
                            <Textarea 
                              value={termsText}
                              onChange={(e) => setTermsText(e.target.value)}
                              placeholder="Enter the terms and conditions that applicants must agree to..."
                              className="min-h-[200px]"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-6">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Configuration options for {setting.label} will go here...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 