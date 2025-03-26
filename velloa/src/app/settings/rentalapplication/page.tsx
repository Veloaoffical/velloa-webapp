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
import * as React from "react"
import { useState, useEffect, useId } from "react"
import Link from "next/link"
import { toast } from "sonner"
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
  CheckCircle,
  AlertCircle,
  ChevronsUpDown,
  Check,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

const settingsMenu = [
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
];

// Create a customized MultiSelect that doesn't show selected items as badges
function CustomMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  className,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className={cn('space-y-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <span className="truncate">
                {selected.length} selected
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

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
  const [notifiedUsers, setNotifiedUsers] = useState<string[]>([]);
  const [notifyOption, setNotifyOption] = useState("yes");
  const [companyMembers, setCompanyMembers] = useState<{ id: string, first_name: string, last_name: string, role: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("all-in-one");
  const [settings, setSettings] = useState({
    allInOne: true,
    custom: false,
    applicationOnly: false,
    creditCheck: false,
    backgroundCheck: false,
    idVerification: false,
    termsAccepted: false,
    termsAcceptedDate: null as string | null
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
              setNotifiedUsers([data[0].id]);
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

  // Fetch settings
  useEffect(() => {
    fetchExistingSettings();
  }, []);
  
  // Fetch existing settings
  const fetchExistingSettings = async () => {
    try {
      // Use the correct API endpoint - no need to pass companyId anymore
      const response = await fetch(`/api/company/settings/rental-application`);
      
      if (!response.ok) {
        console.error("Error fetching settings:", response.status, await response.text());
        return;
      }
      
      const data = await response.json();
      
      if (data && data.rental_application) {
        const existingSettings = data.rental_application;
        
        // Update settings state
        if (existingSettings.settings) {
          // If settings object already exists, use it
          const newSettings = {
            ...existingSettings.settings
          };
          
          // Ensure all-in-one plan has all services enabled
          if (newSettings.allInOne) {
            newSettings.creditCheck = true;
            newSettings.backgroundCheck = true;
            newSettings.idVerification = true;
          }
          
          setSettings(newSettings);
          
          // Set selected plan based on settings
          if (newSettings.allInOne) setSelectedPlan('all-in-one');
          else if (newSettings.custom) setSelectedPlan('specific');
          else if (newSettings.applicationOnly) setSelectedPlan('application-only');
        } else {
          // For backward compatibility - convert from old format
          const isAllInOne = existingSettings.plan === 'all-in-one';
          const isCustom = existingSettings.plan === 'specific';
          const isApplicationOnly = existingSettings.plan === 'application-only';
          
          const newSettings = {
            allInOne: isAllInOne,
            custom: isCustom,
            applicationOnly: isApplicationOnly,
            // For all-in-one, always set these to true
            creditCheck: isAllInOne ? true : (existingSettings.specificServices?.creditCheck || false),
            backgroundCheck: isAllInOne ? true : (existingSettings.specificServices?.backgroundCheck || false),
            idVerification: isAllInOne ? true : (existingSettings.specificServices?.idVerification || false),
            termsAccepted: existingSettings.termsAccepted || false,
            termsAcceptedDate: existingSettings.termsAcceptedDate || null,
          };
          
          setSettings(newSettings);
          
          // Set selected plan based on settings
          if (existingSettings.plan) setSelectedPlan(existingSettings.plan);
        }
        
        // Handle root level properties correctly
        if (existingSettings.applicantFields) setApplicantFields(existingSettings.applicantFields);
        if (existingSettings.residentialFields) setResidentialFields(existingSettings.residentialFields);
        if (existingSettings.employmentFields) setEmploymentFields(existingSettings.employmentFields);
        
        // Handle custom questions from root level or nested
        if (existingSettings.customQuestions) {
          if (typeof existingSettings.customQuestions === 'object' && existingSettings.customQuestions.questions) {
            // New format
            setCustomQuestions(existingSettings.customQuestions.questions);
            setCustomQuestionsOption(existingSettings.customQuestions.enabled ? 'ask' : 'dont-ask');
          } else {
            // Old format array
            setCustomQuestions(existingSettings.customQuestions);
            setCustomQuestionsOption(existingSettings.customQuestionsOption || 'ask');
          }
        }
        
        // Handle other root level properties
        if (existingSettings.pets && typeof existingSettings.pets === 'object') {
          setPetsOption(existingSettings.pets.enabled ? 'ask' : 'dont-ask');
        } else if (existingSettings.petsOption) {
          setPetsOption(existingSettings.petsOption);
        }
        
        if (existingSettings.vehicle && typeof existingSettings.vehicle === 'object') {
          setVehicleOption(existingSettings.vehicle.enabled ? 'ask' : 'dont-ask');
        } else if (existingSettings.vehicleOption) {
          setVehicleOption(existingSettings.vehicleOption);
        }
        
        if (existingSettings.dependants && typeof existingSettings.dependants === 'object') {
          setDependantsOption(existingSettings.dependants.enabled ? 'ask' : 'dont-ask');
        } else if (existingSettings.dependantsOption) {
          setDependantsOption(existingSettings.dependantsOption);
        }
        
        // Handle terms from terms object or root level
        if (existingSettings.terms && typeof existingSettings.terms === 'object') {
          setTermsOption(existingSettings.terms.option || 'yes');
          setTermsText(existingSettings.terms.text || '');
        } else {
          if (existingSettings.termsOption) setTermsOption(existingSettings.termsOption);
          if (existingSettings.termsText) setTermsText(existingSettings.termsText);
        }
        
        // Handle notifications from notifications object or root level
        if (existingSettings.notifications && typeof existingSettings.notifications === 'object') {
          setNotifyOption(existingSettings.notifications.option || 'yes');
          setNotifiedUsers(existingSettings.notifications.notifiedUsers || []);
        } else {
          if (existingSettings.notifyOption) setNotifyOption(existingSettings.notifyOption);
          if (existingSettings.notifiedUsers) setNotifiedUsers(existingSettings.notifiedUsers || []);
        }
      }
    } catch (error) {
      console.error("Error fetching existing settings:", error);
    }
  };

  const scrollToSection = (label: string) => {
    setActiveSection(label);
    const element = document.getElementById(`section-${label}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleSave = async () => {
    if (!settings.termsAccepted && !settings.applicationOnly) {
      toast.error("You must accept the terms and conditions before saving.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create the request body with just needed properties
      const requestBody = {
        settings: {
          ...settings,
          // Remove the nested properties that will be at the root level
          pets: undefined,
          vehicle: undefined,
          dependants: undefined,
          customQuestions: undefined
        },
        // Add these properties at the root level
        pets: {
          enabled: petsOption === 'ask'
        },
        vehicle: {
          enabled: vehicleOption === 'ask'
        },
        dependants: {
          enabled: dependantsOption === 'ask'
        },
        customQuestions: {
          enabled: customQuestionsOption === 'ask',
          questions: customQuestions
        },
        // Group terms related fields into a terms object
        terms: {
          option: termsOption,
          text: termsText
        },
        // Group notification related fields into a notifications object
        notifications: {
          option: notifyOption,
          notifiedUsers: notifiedUsers
        },
        applicantFields,
        residentialFields,
        employmentFields,
        updatedAt: new Date().toISOString()
      };
      
      console.log("Saving settings with payload:", JSON.stringify(requestBody));
      
      // Save to the database with the correct API endpoint
      const response = await fetch('/api/company/settings/rental-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text();
        console.error("API error response:", text);
        throw new Error(`API responded with status ${response.status}: ${text}`);
      }
      
      // Now that we know the response is OK, try to parse the JSON
      console.log("Settings saved successfully");
      setHasUnsavedChanges(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    // Reset all changes by re-fetching settings
    fetchExistingSettings();
    setHasUnsavedChanges(false);
    toast.info("Changes discarded");
  };
  
  const handleApplicantFieldToggle = (field: string, type: 'enabled' | 'required') => {
    setApplicantFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof applicantFields],
        [type]: !prev[field as keyof typeof applicantFields][type]
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  const handleResidentialFieldToggle = (field: string, type: 'enabled' | 'required') => {
    setResidentialFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof residentialFields],
        [type]: !prev[field as keyof typeof residentialFields][type]
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  const handleEmploymentFieldToggle = (field: string, type: 'enabled' | 'required') => {
    setEmploymentFields(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof employmentFields],
        [type]: !prev[field as keyof typeof employmentFields][type]
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddQuestion = () => {
    // Update just customQuestions state
    setCustomQuestions(prev => [
      ...prev, 
      { 
        id: prev.length > 0 ? Math.max(...prev.map(q => q.id)) + 1 : 1, 
        question: "", 
        answerType: "Yes/No" 
      }
    ]);
    
    setHasUnsavedChanges(true);
  };
  
  const handleRemoveQuestion = (id: number) => {
    // Update just customQuestions state
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
    
    setHasUnsavedChanges(true);
  };
  
  const handleQuestionChange = (id: number, field: 'question' | 'answerType', value: string) => {
    // Update just customQuestions state
    setCustomQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, [field]: value } : q)
    );
    
    setHasUnsavedChanges(true);
  };

  const handleServiceToggle = (service: string, checked: boolean) => {
    if (selectedPlan !== 'specific') {
      // First switch to specific plan if toggling a service but not in specific plan
      setSelectedPlan('specific');
      setSettings(prev => ({
        ...prev,
        allInOne: false,
        custom: true,
        applicationOnly: false,
        [service]: checked,
      }));
    } else {
      // Just update the individual service
      setSettings(prev => ({
        ...prev,
        [service]: checked,
      }));
    }
    setHasUnsavedChanges(true);
  };

  const calculateTotal = () => {
    let total = 0;
    if (settings.allInOne) {
      // All-in-One solution has a fixed price
      total = 30;
    } else if (settings.custom) {
      // Calculate based on selected services
      total = (settings.creditCheck ? 20 : 0) + (settings.backgroundCheck ? 5 : 0) + (settings.idVerification ? 5 : 0);
    } else if (settings.applicationOnly) {
      // Application-only plan is free
      total = 0;
    }
    return total.toFixed(2);
  };

  // Update the handlers to use settings object
  const handleVehicleOptionChange = (value: string) => {
    setVehicleOption(value);
    setHasUnsavedChanges(true);
  };
  
  const handleDependantsOptionChange = (value: string) => {
    setDependantsOption(value);
    setHasUnsavedChanges(true);
  };
  
  const handlePetsOptionChange = (value: string) => {
    setPetsOption(value);
    setHasUnsavedChanges(true);
  };

  const handleCustomQuestionsOptionChange = (value: string) => {
    setCustomQuestionsOption(value);
    setHasUnsavedChanges(true);
  };

  const handleTermsOptionChange = (value: string) => {
    setTermsOption(value);
    setHasUnsavedChanges(true);
  };

  const handleNotifyOptionChange = (value: string) => {
    setNotifyOption(value);
    setHasUnsavedChanges(true);
  };

  const handleNotifiedUsersChange = (selected: string[]) => {
    setNotifiedUsers(selected);
    setHasUnsavedChanges(true);
  };

  // Handle plan selection changes
  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
    
    // Update the settings object based on the plan
    setSettings(prev => ({
      ...prev,
      allInOne: value === 'all-in-one',
      custom: value === 'specific',
      applicationOnly: value === 'application-only',
      // For all-in-one, set all check services to true
      // For specific plan, keep existing values
      // For application-only, set all to false
      creditCheck: value === 'all-in-one' ? true : (value === 'specific' ? prev.creditCheck : false),
      backgroundCheck: value === 'all-in-one' ? true : (value === 'specific' ? prev.backgroundCheck : false),
      idVerification: value === 'all-in-one' ? true : (value === 'specific' ? prev.idVerification : false),
      // Terms acceptance is not required for application-only
      termsAccepted: value === 'application-only' ? true : prev.termsAccepted,
    }));
    
    setHasUnsavedChanges(true);
  };

  // Handle terms acceptance change
  const handleTermsAcceptance = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      termsAccepted: checked,
      termsAcceptedDate: checked ? new Date().toISOString() : null,
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="h-screen p-6">
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
            {settingsMenu.map((settingItem) => (
              <button
                key={settingItem.label}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg text-sm w-full text-left transition-colors",
                  activeSection === settingItem.label && isClient
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] hover:opacity-80"
                )}
                onClick={() => scrollToSection(settingItem.label)}
              >
                {settingItem.icon}
                {settingItem.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-12">
              {settingsMenu.map((settingItem) => (
                <div id={`section-${settingItem.label}`} key={settingItem.label} className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {settingItem.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold">{settingItem.label}</h2>
                        <p className="text-sm text-muted-foreground">{settingItem.description}</p>
                      </div>
                    </div>
                    <Separator className="mt-6" />
                  </div>

                  {settingItem.label === "Settings" ? (
                    <div className="grid gap-6">
                      {/* Settings content */}
                      <RadioGroup className="gap-4" 
                        defaultValue="all-in-one" 
                        value={selectedPlan}
                        onValueChange={handlePlanChange}>
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
                              <div className="text-sm font-medium text-green-600">$30/application</div>
                            </Label>
                            <div id={`${id}-all-in-one-description`} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Credit check through TransUnion
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Background check using SoftCheck™ technology
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                ID verification included
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                No additional setup or merchant account required
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Specific Solution */}
                        <div className="border-input has-data-[state=checked]:border-ring has-data-[state=checked]:bg-accent relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
                          <RadioGroupItem
                            value="specific"
                            id={`${id}-specific`}
                            aria-describedby={`${id}-specific-description`}
                            className="order-1 after:absolute after:inset-0"
                          />
                          <div className="grid grow gap-2">
                            <Label htmlFor={`${id}-specific`} className="flex justify-between">
                              <div>
                                Specific Solution{" "}
                              </div>
                              <div className="text-sm font-medium text-green-600">Custom pricing</div>
                            </Label>
                            <div id={`${id}-specific-description`} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Choose specific screening services
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Pay only for what you need
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Flexible screening options
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
                            <Label htmlFor={`${id}-application-only`} className="flex justify-between">
                              <div>
                                Application-Only Plan{" "}
                              </div>
                              <div className="text-sm font-medium text-green-600">Free</div>
                            </Label>
                            <div id={`${id}-application-only-description`} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Free and unlimited application form submissions
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                Screening not included
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                Background checks available for additional fee
                              </div>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                      
                      {/* Summary Section */}
                      <div className="border rounded-md p-4 space-y-4">
                        <h3 className="font-medium">Summary</h3>
                        
                        {selectedPlan === 'all-in-one' && (
                          <div className="grid gap-4 border-b pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  className="rounded-sm [&_span]:rounded"
                                  checked={true}
                                  disabled={true}
                                />
                                <span className="text-sm">Credit Check</span>
                              </div>
                              <div className="text-sm font-medium">Included</div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  className="rounded-sm [&_span]:rounded"
                                  checked={true}
                                  disabled={true}
                                />
                                <span className="text-sm">Background Check</span>
                              </div>
                              <div className="text-sm font-medium">Included</div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  className="rounded-sm [&_span]:rounded"
                                  checked={true}
                                  disabled={true}
                                />
                                <span className="text-sm">ID Verification</span>
                              </div>
                              <div className="text-sm font-medium">Included</div>
                            </div>
                          </div>
                        )}
                        
                        {selectedPlan === 'specific' && (
                          <div className="grid gap-4 border-b pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  className="rounded-sm [&_span]:rounded"
                                  checked={settings.creditCheck}
                                  onCheckedChange={(checked) => handleServiceToggle('creditCheck', checked)}
                                />
                                <span className="text-sm">Credit Check</span>
                              </div>
                              <div className="text-sm font-medium">$20.00</div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  className="rounded-sm [&_span]:rounded"
                                  checked={settings.backgroundCheck}
                                  onCheckedChange={(checked) => handleServiceToggle('backgroundCheck', checked)}
                                />
                                <span className="text-sm">Background Check</span>
                              </div>
                              <div className="text-sm font-medium">$5.00</div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch 
                                className="rounded-sm [&_span]:rounded"
                                  checked={settings.idVerification}
                                  onCheckedChange={(checked) => handleServiceToggle('idVerification', checked)}
                                />
                                <span className="text-sm">ID Verification</span>
                              </div>
                              <div className="text-sm font-medium">$5.00</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total cost for applicant</span>
                            <span className="text-sm">${calculateTotal()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="terms" 
                            checked={settings.termsAccepted}
                            onCheckedChange={(checked) => {
                              handleTermsAcceptance(checked === true);
                            }}
                            disabled={selectedPlan === 'application-only'}
                          />
                          <label htmlFor="terms" className="text-sm">
                            I accept the <Link href="/terms" className="text-primary hover:underline">Terms and Conditions</Link> and agree to the terms of <Link href="https://stripe.com/legal" className="text-primary hover:underline">Stripe</Link>, <Link href="https://www.transunion.com/legal" className="text-primary hover:underline">TransUnion</Link>, and <Link href="https://certn.co/legal" className="text-primary hover:underline">Certn</Link>
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : settingItem.label === "Applicant Info" ? (
                    <div className="grid gap-6">
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                  ) : settingItem.label === "Residential" ? (
                    <div className="grid gap-6">
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                  ) : settingItem.label === "Employment" ? (
                    <div className="grid gap-6">
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                                className="rounded-sm [&_span]:rounded"
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
                  ) : settingItem.label === "Vehicle" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={vehicleOption}
                          onValueChange={handleVehicleOptionChange}
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
                    </div>
                  ) : settingItem.label === "Dependants" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={dependantsOption}
                          onValueChange={handleDependantsOptionChange}
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
                    </div>
                  ) : settingItem.label === "Pets" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={petsOption}
                          onValueChange={handlePetsOptionChange}
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
                    </div>
                  ) : settingItem.label === "Custom Questions" ? (
                    <div className="grid gap-6">
                      <div className="space-y-4 mb-4">
                        <RadioGroup 
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-2xl mx-auto"
                          value={customQuestionsOption}
                          onValueChange={handleCustomQuestionsOptionChange}
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
                    </div>
                  ) : settingItem.label === "Notifications" ? (
                    <div className="grid gap-6">
                      <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="space-y-4">
                          <div className="font-medium text-lg text-center">Notification Settings</div>
                          
                          <RadioGroup 
                            className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-lg mx-auto"
                            value={notifyOption}
                            onValueChange={handleNotifyOptionChange}
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
                            <Label>Select company members to notify</Label>
                            {isLoading ? (
                              <div className="text-center py-4">Loading company members...</div>
                            ) : companyMembers.length > 0 ? (
                              <CustomMultiSelect
                                options={companyMembers.map(member => ({
                                  label: `${member.first_name} ${member.last_name}${member.role ? ` (${member.role})` : ''}`,
                                  value: member.id
                                }))}
                                selected={notifiedUsers}
                                onChange={handleNotifiedUsersChange}
                                placeholder="Select company members to notify"
                              />
                            ) : (
                              <div className="text-center py-4">No company members found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : settingItem.label === "Terms and Conditions" ? (
                    <div className="grid gap-6">
                      <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="space-y-4">
                          <div className="font-medium text-lg text-center">Include Terms and Conditions?</div>
                          
                          <RadioGroup 
                            className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-lg mx-auto"
                            value={termsOption}
                            onValueChange={handleTermsOptionChange}
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
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Configuration options for {settingItem.label} will go here...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Floating Save/Cancel Button Group */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-24 right-24 flex items-center gap-2 p-4 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg z-50">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
} 