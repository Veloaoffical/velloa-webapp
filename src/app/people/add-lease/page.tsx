'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Lock, CircleAlertIcon, ChevronsUpDown, CalendarClock, CalendarDays, Search, Mail, Phone, Plus, X, Laptop, Umbrella, Info, Settings2, CalendarRange, DollarSign, Zap, Flame, Droplet, Heater, Snowflake, Archive, WashingMachine, Car, PlusCircle, FileText, CircleCheck, PenTool, ImageIcon, UploadIcon, AlertCircleIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { formatBytes, useFileUpload, FilePreview } from "@/hooks/use-file-upload";
import Image from "next/image";
import CalendarWithMonthsInput from "@/components/calendarwithmonthsinput";
import AccountCombobox from "@/components/AccountCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { APIProvider } from '@vis.gl/react-google-maps';

// Remove the existing tenantSchema and replace with a minimal schema
const leaseSchema = z.object({
  // We don't need tenant form fields since we're selecting existing tenants
  dummy: z.string().optional(), // Just a placeholder to keep the form working
});

type LeaseFormType = z.infer<typeof leaseSchema>;

// Interface for Property (matching add-lease)
interface Property {
  id: string;
  name: string;
  // Add other fields if needed from your API response, e.g., address
  address_line_1?: string; 
  city?: string;
  state?: string;
  zip?: string;
  address?: string; // Added missing property
}

// Interface for Unit (matching add-lease)
interface Unit {
  id: string;          // Usually unit_id from DB
  unit_id?: string;    // Alternative property name that might be used
  unit_name: string;   // Name/number of the unit
  // Add other relevant fields from your API if needed for display
  beds?: number | null;
  baths?: number | null;
  market_rent?: number | null;
  status?: string;
  size?: string;       // Added missing property
}

// Interface for Tenant (matching tenant-select-page)
interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

// Rent Charges Types
type PaymentFrequency = 'monthly' | 'weekly' | 'bi-weekly' | 'quarterly' | 'annually';
type AdditionalCharge = {
  id: string;
  key?: string;
  type: string;
  description: string;
  amount: string;
};
type LeaseData = {
  start_date?: Date;
  first_rent_due_day?: number;
  payment_frequency: PaymentFrequency;
  rent_amount: string;
  additional_charges: AdditionalCharge[];
};
type RentIncreaseData = {
  date?: Date;
  type: 'dollar' | 'percentage';
  amount: string;
  frequency: 'monthly' | 'quarterly' | 'bi-annual' | 'annually';
};

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  account_balance: number;
  sub_accounts?: {
    id: string;
    account_name: string;
    account_subtype: string;
    account_balance: number;
  }[];
}




export default function AddTenantPage() {
  const router = useRouter();
  type StepType = 'Intro' | 'Properties' | 'Tenant' | 'Rent & Charges' | 'Deposits & Discounts' | 'Late Fees' | 'Utilities & Features' | 'Policy' | 'Addendum' | 'Documents' | 'Summary';
  const [step, setStep] = useState<StepType>('Intro');
  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set());
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [showAddressAlert, setShowAddressAlert] = useState(false);
  const [showInsuranceAlert, setShowInsuranceAlert] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LeaseFormType>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      dummy: '',
    },
  });
  

  // Helper: step order
  const getStepOrder = (): StepType[] => ['Intro', 'Properties', 'Tenant', 'Rent & Charges', 'Deposits & Discounts', 'Late Fees', 'Utilities & Features', 'Policy', 'Addendum', 'Documents', 'Summary'];

  // Helper: mark step completed
  const markStepCompleted = (completedStep: StepType) => {
    setCompletedSteps(prev => new Set([...prev, completedStep]));
  };

  // Helper: is step accessible
  const isStepAccessible = (targetStep: StepType) => {
    const stepOrder = getStepOrder();
    const currentStepIndex = stepOrder.indexOf(step);
    const targetStepIndex = stepOrder.indexOf(targetStep);
    if (targetStepIndex < currentStepIndex) return true;
    const previousStep = stepOrder[targetStepIndex - 1];
    return completedSteps.has(previousStep);
  };

  // Navigation
  const handleNext = async (options?: { skipAddressValidationOverride?: boolean; skipInsuranceValidationOverride?: boolean }) => {
    console.log('handleNext called, current step:', step, 'skipAddressOverride:', options?.skipAddressValidationOverride, 'skipInsuranceOverride:', options?.skipInsuranceValidationOverride);

    const stepOrder = getStepOrder();
    const currentIndex = stepOrder.indexOf(step);

    // Custom validation for each step
    let validationPassed = true;
    
    if (step === 'Tenant') {
      // Check if at least one tenant is selected
      if (selectedTenants.length === 0) {
        toast.error("Please select at least one tenant before proceeding.");
        validationPassed = false;
      }
    }
    
    if (step === 'Late Fees') {
      // Check if late fees are enabled and have required fields filled
      if (lateFeesState.showLateFees && lateFeesState.lateFees.length > 0) {
        const hasInvalidFees = lateFeesState.lateFees.some(fee => {
          // Check required fields
          if (!fee.whenToCharge || !fee.frequency || !fee.calculationType || !fee.amount) {
            return true;
          }
          // Validate amount
          const num = parseFloat(fee.amount);
          if (isNaN(num) || num < 0) {
            return true;
          }
          // Check advanced options if enabled
          if (fee.showAdvancedOptions && (!fee.revenueAccount || !fee.description)) {
            return true;
          }
          return false;
        });
        
        if (hasInvalidFees) {
          toast.error("Please fill in all required late fee fields before proceeding.");
          validationPassed = false;
        }
      }
    }
    // Properties step has custom logic in its button's disabled state
    // Other steps will be defined as we implement their forms

    if (!validationPassed) {
      toast.error("Please correct the errors on the page before proceeding.");
      return; // Stop if validation failed
    }

    // If validation passed or no specific validation needed for this step's "Next" button
    if (currentIndex < stepOrder.length - 1) {
      markStepCompleted(step);
      setStep(stepOrder[currentIndex + 1]);
    } else {

      await form.handleSubmit(handleSubmit)(); 
    }

    // Reset skip flag only after advancing
    // setProceedAddressStep(false); // Removed
  };

  const handlePrevious = () => {
    const stepOrder = getStepOrder();
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };



  const handleSubmit = async (data: LeaseFormType) => {
    console.log("Submit button clicked, form data:", data);
    setSubmitting(true);
    try {
      // Prepare the complete lease payload
      const leasePayload = {
        // Basic lease information
        property_id: selectedPropertyId || '',
        unit_id: selectedUnitId || '',
        tenant_ids: selectedTenants,
        
        // Lease details
        lease_type: lease.lease_type,
        start_date: lease.start_date?.toISOString(),
        end_date: lease.end_date?.toISOString(),
        rollover_to_month_to_month: lease.rollover_to_month_to_month,
        
        // Tenant portal settings
        tenant_portal_enabled: tenantPortalEnabled,
        renters_insurance_required: rentersInsuranceRequired,
        
        // Rent and charges
        rent_charges: {
          start_date: rentChargesLease.start_date?.toISOString(),
          first_rent_due_day: rentChargesLease.first_rent_due_day,
          payment_frequency: rentChargesLease.payment_frequency,
          rent_amount: rentChargesLease.rent_amount,
          additional_charges: rentChargesLease.additional_charges,
        },
        
        // Rent increase
        rent_increase: rentIncrease.date ? {
          date: rentIncrease.date.toISOString(),
          type: rentIncrease.type,
          amount: rentIncrease.amount,
          frequency: rentIncrease.frequency,
        } : undefined,
        
        // Deposits and discounts
        deposits: {
          show_security_deposit: depositsState.showSecurityDeposit,
          security_deposit_amount: depositsState.securityDepositAmount,
          show_key_deposit: depositsState.showKeyDeposit,
          key_deposit_amount: depositsState.keyDepositAmount,
          key_deposit_description: depositsState.keyDepositDescription,
          show_rent_discount: depositsState.showRentDiscount,
          rent_discount_type: depositsState.rentDiscountType,
          rent_discount_amount: depositsState.rentDiscountAmount,
          rent_discount_description: depositsState.rentDiscountDescription,
        },
        
        // Late fees
        late_fees: {
          show_late_fees: lateFeesState.showLateFees,
          late_fees: lateFeesState.lateFees.map(fee => ({
            id: fee.id,
            when_to_charge: fee.whenToCharge,
            frequency: fee.frequency,
            calculation_type: fee.calculationType,
            amount: fee.amount,
            revenue_account: fee.revenueAccount,
            description: fee.description,
            show_advanced_options: fee.showAdvancedOptions,
          })),
        },
        
        // Utilities and features
        utilities: {
          utilities: utilitiesState.utilities,
          unit_features: utilitiesState.unitFeatures,
        },
        
        // Amenities
        amenities: amenityFeatures.map(amenity => ({
          name: amenity.name,
          is_included: amenity.isIncluded,
          custom: amenity.custom,
        })),
        
        // Policy
        policy: {
          parking: policyState.parking,
          number_of_car_spots: policyState.numberOfCarSpots,
          parking_available: policyState.parkingAvailable,
          smoking_allowed: policyState.smokingAllowed,
          smoking_designation: policyState.smokingDesignation,
          custom_smoking_text: policyState.customSmokingText,
          pets_allowed: policyState.petsAllowed,
          pets_designation: policyState.petsDesignation,
          custom_pets_text: policyState.customPetsText,
        },
        
        // Addendum
        addendum: {
          show_addendum: addendumState.showAddendum,
        },
        
        // Documents
        documents: {
          document_status: documentsState.document_status,
          uploaded_documents: documentsState.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            file_path: undefined, // File path would be set after upload
          })),
        },
      };

      const response = await fetch('/api/leases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leasePayload),
        credentials: 'include'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create lease');
      }

      toast.success('Lease created successfully');
      router.push('/leases'); // redirect to leases page
    } catch (error) {
      console.error('Error creating lease:', error);
      toast.error('Failed to create lease. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderIntroForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Getting Started</h1>
      <p className="mb-6 text-muted-foreground">Let&apos;s set up a new tenant in your system.</p>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-medium text-primary">Adding a new tenant</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="relative w-[300px] h-[300px]">
            <Image
              src="/assets/figures/add-tenant.png"
              alt="Adding Tenant Illustration"
              sizes="(max-width: 768px) 100vw, 300px"
              style={{ objectFit: "contain" }}
              fill
            />
          </div>
         
          <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
          Once created, the tenat will receive an email to complete their profile with additional information.
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={() => handleNext()}>Next</Button>
        </CardFooter>
      </Card>
    </div>
  );









  // State for property/unit selection
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingPropertiesNew, setIsLoadingPropertiesNew] = useState(true);
  const [propertyOpen, setPropertyOpen] = useState(false);
  
  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState("");
  const [unitOpen, setUnitOpen] = useState(false);
  
  // Selection state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  
  // Lease State
  const [lease, setLease] = useState<{
    property_id: string | null;
    unit_id: string | null;
    unit_number?: string;
    lease_type?: 'fixed' | 'month-to-month';
    start_date?: Date;
    end_date?: Date;
    rollover_to_month_to_month?: boolean;
  }>({
    property_id: null,
    unit_id: null,
    unit_number: undefined,
    lease_type: undefined,
    start_date: undefined,
    end_date: undefined,
    rollover_to_month_to_month: false
  });

  // Tenant Selection State
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [tenantPortalEnabled, setTenantPortalEnabled] = useState(false);
  const [rentersInsuranceRequired, setRentersInsuranceRequired] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");

  // Rent Charges State
  const [rentChargesLease, setRentChargesLease] = useState<LeaseData>({
    start_date: undefined,
    first_rent_due_day: undefined,
    payment_frequency: 'monthly',
    rent_amount: '',
    additional_charges: [{ id: crypto.randomUUID(), type: '', description: '', amount: '' }]
  });
  
  const [rentIncrease, setRentIncrease] = useState<RentIncreaseData>({
    date: undefined,
    type: 'dollar',
    amount: '',
    frequency: 'monthly'
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showRentIncreaseDialog, setShowRentIncreaseDialog] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  // Deposits State
  const [depositsState, setDepositsState] = useState({
    showSecurityDeposit: false,
    securityDepositAmount: '',
    showKeyDeposit: false,
    keyDepositAmount: '',
    keyDepositDescription: '',
    showRentDiscount: false,
    rentDiscountType: 'dollar' as 'dollar' | 'percentage',
    rentDiscountAmount: '',
    rentDiscountDescription: ''
  });

  // Late Fees State
  type LateFee = {
    id: string;
    whenToCharge: string;
    frequency: string;
    calculationType: 'fixed' | 'percentage';
    amount: string;
    revenueAccount: string;
    description: string;
    showAdvancedOptions: boolean;
  };

  const [lateFeesState, setLateFeesState] = useState({
    showLateFees: false,
    lateFees: [] as LateFee[]
  });

  // Utilities & Features State
  interface UtilityResponsibility {
    landlord: boolean;
    tenant: boolean;
    na?: boolean;
  }

  interface UtilityEntry {
    name: string;
    responsibility: UtilityResponsibility;
    required?: boolean;
    custom?: boolean;
  }

  type FeatureAvailabilityKey = 'included' | 'not_included' | 'no_charge' | 'pay_per_use';

  interface FeatureAvailability {
    included: boolean;
    not_included: boolean;
    no_charge: boolean;
    pay_per_use: boolean;
  }

  interface UnitFeatureEntry {
    name: string;
    availability: FeatureAvailability;
    icon?: React.ElementType;
    custom?: boolean;
  }

  interface ServiceSettings {
    utilities: UtilityEntry[];
    unitFeatures: UnitFeatureEntry[];
  }

  const [utilitiesState, setUtilitiesState] = useState<ServiceSettings>({
    utilities: [
      { name: "Electricity", responsibility: { landlord: false, tenant: false }, required: true },
      { name: "Heat", responsibility: { landlord: false, tenant: false }, required: true },
      { name: "Water", responsibility: { landlord: false, tenant: false }, required: true },
    ],
    unitFeatures: [
      { name: "Gas", availability: { included: false, not_included: false, no_charge: false, pay_per_use: false }, icon: Flame },
      { name: "Air Conditioning", availability: { included: false, not_included: false, no_charge: false, pay_per_use: false }, icon: Snowflake },
      { name: "Additional Storage", availability: { included: false, not_included: false, no_charge: false, pay_per_use: false }, icon: Archive },
      { name: "On-site Laundry", availability: { included: false, not_included: false, no_charge: false, pay_per_use: false }, icon: WashingMachine },
      { name: "Guest Parking", availability: { included: false, not_included: false, no_charge: false, pay_per_use: false }, icon: Car },
    ]
  });

  const [newUtilityName, setNewUtilityName] = useState("");
  const [newFeatureName, setNewFeatureName] = useState("");
  const [utilitiesValidationError, setUtilitiesValidationError] = useState<string | null>(null);

  // Amenities State
  interface AmenityFeature {
    name: string;
    isIncluded: boolean;
    custom?: boolean;
  }

  const amenitiesList = [
    "Bathtub", "BBQ Ready", "Carpets", "Coin Laundry", "Dishwasher", "Fridge", "Garbage Collection", "Garburator", "In-suite Dryer", "In-suite Washer", "Jacuzzi", "Microwave", "Sewage Disposal", "Snow Removal", "TV Unit", "Wheelchair Accessible", "Windows Covering"
  ];

  const [amenityFeatures, setAmenityFeatures] = useState<AmenityFeature[]>(() => {
    return amenitiesList.map(name => ({
      name,
      isIncluded: false,
      custom: false,
    }));
  });

  const [newCustomAmenity, setNewCustomAmenity] = useState("");

  // Policy State
  const [policyState, setPolicyState] = useState({
    parking: [] as string[],
    numberOfCarSpots: null as number | null,
    parkingAvailable: false,
    smokingAllowed: false,
    smokingDesignation: "",
    customSmokingText: "",
    petsAllowed: false,
    petsDesignation: "",
    customPetsText: ""
  });

  // Addendum State
  const [addendumState, setAddendumState] = useState({
    showAddendum: false
  });

  // Documents State
  interface UploadingDocument {
    id: number;
    name: string;
    file: File;
    progress: number;
  }

  const [documentsState, setDocumentsState] = useState({
    document_status: undefined as 'signed' | 'not_signed' | undefined,
    document_action: undefined as 'draft' | 'esign' | undefined,
    documents: [] as UploadingDocument[]
  });

  // File upload state for documents
  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;
  const maxFiles = 6;
  const [fileState, fileHandlers] = useFileUpload({
    accept: "image/svg+xml,image/png,image/jpeg,image/jpg,image/gif,.pdf,.doc,.docx",
    maxSize,
    multiple: true,
    maxFiles,
  });
  const { files, isDragging, errors } = fileState;
  const {
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    openFileDialog,
    removeFile,
    clearFiles,
    getInputProps,
  } = fileHandlers;

  const parkingOptions = [
    { id: "carport", label: "Carport" },
    { id: "garage_attached", label: "Garage / Attached" },
    { id: "garage_detached", label: "Garage / Detached" },
    { id: "off_street", label: "Off-street" },
  ];

  // Policy handlers
  const updatePolicyState = (updates: Partial<typeof policyState>) => {
    setPolicyState(prev => ({ ...prev, ...updates }));
  };

  // Policy effects
  useEffect(() => {
    if (!policyState.parkingAvailable) {
      setPolicyState(prev => ({
        ...prev,
        parking: [],
        numberOfCarSpots: null
      }));
    }
  }, [policyState.parkingAvailable]);

  useEffect(() => {
    if (!policyState.parking || policyState.parking.length === 0) {
      setPolicyState(prev => ({
        ...prev,
        numberOfCarSpots: null,
        parkingAvailable: false
      }));
    } else {
      setPolicyState(prev => ({
        ...prev,
        parkingAvailable: true
      }));
    }
  }, [policyState.parking]);

  // Fetch Properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoadingPropertiesNew(true);
        const response = await fetch('/api/property');
        
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = `HTTP error! status: ${response.status}`;
          if (contentType && contentType.indexOf("application/json") !== -1) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
              console.error('Error parsing JSON error response:', jsonError);
              errorMessage = response.statusText || errorMessage; 
            }
          } else {
            try {
              const textData = await response.text();
              console.error('Received non-JSON error response:', textData);
              errorMessage = `Server returned non-JSON response: ${response.statusText || response.status}`; 
            } catch (textError) {
              console.error('Error reading text error response:', textError);
              errorMessage = response.statusText || errorMessage;
            }
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoadingPropertiesNew(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch units when property is selected
  useEffect(() => {
    if (!selectedPropertyId) {
      setUnits([]);
      return;
    }

    const fetchUnits = async () => {
      try {
        setIsLoadingUnits(true);
        const response = await fetch(`/api/property/${selectedPropertyId}/units`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch units: ${response.status}`);
        }
        
        const data = await response.json();
        setUnits(data);
      } catch (error) {
        console.error('Error fetching units:', error);
        setUnits([]);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [selectedPropertyId]);

  // Fetch tenants and accepted prospects
  useEffect(() => {
    async function fetchPeople() {
      setLoadingTenants(true);
      
      try {
        // Fetch tenants and accepted prospects from the API
        const response = await fetch('/api/people/tenant-or-accepted');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json() as {
          id: string;
          name: string;
          email: string;
          phone: string;
          role: string;
          status: string;
        }[];
        
        // Map API results to Tenant interface
        const mappedTenants: Tenant[] = data.map(person => ({
          id: person.id,
          name: person.name,
          email: person.email,
          phone: person.phone,
          role: person.role,
          status: person.status
          // No image in API response, will use fallback avatar
        }));
        
        setTenants(mappedTenants);
      } catch (error) {
        console.error('Error fetching people:', error);
      } finally {
        setLoadingTenants(false);
      }
    }
    
    fetchPeople();
  }, []);

  // Fetch accounts for rent charges
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const response = await fetch('/api/accounting/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        // Filter to only show income accounts
        const incomeAccounts = data.filter((account: Account) => 
          account.account_type.toLowerCase().includes('income') || 
          account.account_type.toLowerCase().includes('revenue')
        );
        setAccounts(incomeAccounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  // Rent charges validation
  useEffect(() => {
    let disabled = false;

    // Rule 1: Core requirement - Check if a day is selected
    if (rentChargesLease.first_rent_due_day === undefined || rentChargesLease.first_rent_due_day === null) {
      disabled = true;
    }

    // Rule 2/3: Based on advanced options
    if (!disabled) { // Only check further if core reqs met
      if (showAdvancedOptions) {
        // Advanced view: Check all additional charges
        if (rentChargesLease.additional_charges.length === 0) {
          disabled = true; // Must have at least one charge row
        } else {
          const allChargesValid = rentChargesLease.additional_charges.every(charge => 
            charge.type && 
            charge.description.trim() !== '' && 
            isValidAmount(charge.amount)
          );
          if (!allChargesValid) {
            disabled = true;
          }
        }
      } else {
        // Simple view: Check rent_amount
        if (!isValidAmount(rentChargesLease.rent_amount)) {
          disabled = true;
        }
      }
    }

    // Rule 4: Rent Increase section validation
    if (!disabled && showRentIncreaseDialog) {
      if (!rentIncrease.date || !isValidAmount(rentIncrease.amount) || !rentIncrease.frequency) {
        disabled = true;
      }
    }

    setIsNextDisabled(disabled);

  }, [rentChargesLease, rentIncrease, showAdvancedOptions, showRentIncreaseDialog]);





  // Handlers for Property Selection
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedUnitId(null);
    setUnitSearchQuery("");
    setPropertyOpen(false);
    // Update lease state
    setLease(prev => ({
      ...prev,
      property_id: propertyId,
      unit_id: null,
      unit_number: undefined
    }));
  };

  // Handlers for Unit Selection
  const handleUnitSelect = (unitId: string) => {
    console.log('Unit selected:', unitId);
    if (!unitId) {
      console.error('Unit ID is undefined or null!');
      return;
    }
    
    setSelectedUnitId(unitId);
    setUnitOpen(false);
    // Update lease state
    const selectedUnit = units.find(u => u.id === unitId || u.unit_id === unitId);
    setLease(prev => ({
      ...prev,
      unit_id: unitId,
      unit_number: selectedUnit?.unit_name
    }));
    console.log('After unit selection, selectedUnitId:', unitId);
  };

  // Tenant Selection Handlers
  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prevSelected => {
      const newSelected = prevSelected.includes(tenantId)
        ? prevSelected.filter((id) => id !== tenantId)
        : [...prevSelected, tenantId];
      return newSelected;
    });
  };

  const handleTenantConfirm = () => {
    console.log(
      "Confirmed tenants:",
      tenants.filter((tenant) => selectedTenants.includes(tenant.id)),
    );
    setTenantDialogOpen(false);
  };

  const removeTenant = (tenantId: string) => {
    setSelectedTenants(prevSelected => {
      const updatedIds = prevSelected.filter((id) => id !== tenantId);
      return updatedIds;
    });
  };

  // Get the full tenant objects for the selected IDs
  const selectedTenantObjects = tenants.filter((tenant) => selectedTenants.includes(tenant.id));

  // Filter tenants based on search query
  const filteredTenants = tenants.filter(tenant => {
    if (!tenantSearchQuery) return true;
    
    const query = tenantSearchQuery.toLowerCase();
    return (
      tenant.name.toLowerCase().includes(query) ||
      tenant.email.toLowerCase().includes(query) ||
      tenant.phone.toLowerCase().includes(query)
    );
  });

  // Handle tenant portal toggle
  const handleTenantPortalChange = (checked: boolean) => {
    setTenantPortalEnabled(checked);
  };

  // Handle renters insurance toggle
  const handleRentersInsuranceChange = (checked: boolean) => {
    setRentersInsuranceRequired(checked);
  };

  // Rent charges helper functions
  const isValidAmount = (amount: string): boolean => {
    if (!amount || amount.trim() === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  const renderPropertiesForm = () => {
    return (
      <>
        <h1 className="mb-6 text-2xl font-bold">Properties</h1>
        <p className="mb-6 text-muted-foreground">Select the property and unit for this tenant lease agreement.</p>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="grid gap-3 max-w-md mx-auto">
              <div className="flex justify-center">
                <Label className="text-base">Select the property this lease is for?</Label>
        </div>
              <div className="grid gap-1.5">
                <Label htmlFor="property">Property <span className="text-red-500">*</span></Label>
                <Popover open={propertyOpen} onOpenChange={setPropertyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                      className="w-full justify-between h-[42px]"
                      disabled={isLoadingPropertiesNew}
                    >
                      {isLoadingPropertiesNew ? "Loading properties..." : 
                        properties.find(p => p.id === selectedPropertyId)?.name || "Select property..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0">
                <Command>
                      <CommandInput placeholder="Search property..." />
                      <CommandEmpty>No property found.</CommandEmpty>
                      <CommandGroup>
                        {properties.map((property) => (
                        <CommandItem
                            key={property.id}
                            onSelect={() => handlePropertySelect(property.id)}
                          >
                            <div className="flex items-center gap-2">
                              <Check 
                                className={cn(
                                  "h-4 w-4",
                                  selectedPropertyId === property.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{property.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {property.address || [property.address_line_1, property.city, property.state].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

              {selectedPropertyId && (
                <AnimatePresence mode="sync">
                  <motion.div 
                    key="unit-selection"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ 
                      duration: 0.2,
                      ease: "easeOut",
                      height: {
                        duration: 0.2
                      }
                    }}
                    className="grid gap-1.5 overflow-hidden"
                  >
                    <Label htmlFor="unit">Unit <span className="text-red-500">*</span></Label>
                    <Popover open={unitOpen} onOpenChange={setUnitOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                          className="w-full justify-between h-[42px]"
                          disabled={isLoadingUnits}
                        >
                          {isLoadingUnits ? "Loading units..." : 
                            units.find(u => u.id === selectedUnitId || u.unit_id === selectedUnitId)?.unit_name || "Select unit..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-0">
                <Command>
                          <CommandInput placeholder="Search unit..." onValueChange={setUnitSearchQuery} />
                          <CommandEmpty>No unit found.</CommandEmpty>
                          <CommandGroup>
                            {units.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No units available for this property.
                              </div>
                            ) : units.filter(unit => unitSearchQuery === "" || 
                              unit.unit_name.toLowerCase().includes(unitSearchQuery.toLowerCase()))
                              .map((unit) => {
                                const unitId = unit.id || unit.unit_id || '';
                                if (!unitId) {
                                  console.warn('Unit without ID found:', unit);
                                }
                                return (
                        <CommandItem
                                    key={unitId || 'unknown-' + Math.random()}
                          onSelect={() => {
                                      console.log('CommandItem unit:', unit);
                                      console.log('Using unitId:', unitId);
                                      handleUnitSelect(unitId);
                                    }}
                                    className="flex items-center gap-2 py-3"
                                    value={unitId}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <Check 
                                        className={cn(
                                          "h-4 w-4",
                                          selectedUnitId === unitId ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{unit.unit_name}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {unit.beds} bed • {unit.baths} bath • {unit.size || 'N/A'} • ${unit.market_rent || 'N/A'}/month
                                        </span>
                                      </div>
                                    </div>
                        </CommandItem>
                                );
                              })}
                    </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
                  </motion.div>
                </AnimatePresence>
                            )}
              </div>
            </div>

          {/* Lease Term Selection */}
          <AnimatePresence mode="sync" key={`unit-${selectedUnitId}`}>
            {selectedUnitId && (
              <motion.div
                key="lease-type-selection"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ 
                  duration: 0.2,
                  ease: "easeOut",
                  height: {
                    duration: 0.2
                  }
                }}
                className="mt-8"
              >
                <div className="space-y-4">
                  <Separator className="my-4" />
                  <div className="flex justify-center">
                    <Label className="text-base">What is the term of this lease?</Label>
                  </div>
                  <div className="max-w-md mx-auto">
          <RadioGroup
                      className="grid grid-cols-2 gap-4" 
                      value={lease.lease_type || ""}
                      onValueChange={(value: 'fixed' | 'month-to-month') => {
                        // Clear end date when switching to month-to-month
                        const updatedLease = value === 'month-to-month' 
                          ? {...lease, lease_type: value, end_date: undefined, rollover_to_month_to_month: false}
                          : {...lease, lease_type: value};
                        
                        setLease(updatedLease);
                      }}
                    >
                      {/* Fixed Term Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem
                          value="fixed" 
                          id="lease-fixed" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <CalendarClock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Fixed Term</p>
                          <p className="text-xs text-muted-foreground">Set a specific start and end date for the lease</p>
                </div>
                      </label>

                      {/* Month-to-Month Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem
                          value="month-to-month" 
                          id="lease-month" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <CalendarDays className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Month-to-Month</p>
                          <p className="text-xs text-muted-foreground">Automatically renews each month until terminated</p>
                </div>
                      </label>
          </RadioGroup>
                  </div>

                  {/* Date Selection Fields */}
                  <AnimatePresence mode="sync">
                    {lease.lease_type && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 pt-4"
                      >
                        <div className={cn(
                          "grid gap-4 max-w-md mx-auto",
                          lease.lease_type === 'fixed' ? "grid-cols-2" : "grid-cols-1"
                        )}>
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.2 }}
                            className="space-y-2"
                          >
                            <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
                            <CalendarWithMonthsInput
                              value={lease.start_date}
                              onChange={(date) => {
                                setLease(prev => ({...prev, start_date: date}));
                              }}
                              placeholder="Select start date"
                              className="h-[42px]"
                            />
                          </motion.div>
                          
                          {lease.lease_type === 'fixed' && (
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2, duration: 0.2 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="end_date">End Date <span className="text-red-500">*</span></Label>
                              <CalendarWithMonthsInput
                                value={lease.end_date}
                                onChange={(date) => {
                                  setLease(prev => ({...prev, end_date: date}));
                                }}
                                placeholder="Select end date"
                                disabled={!lease.start_date}
                                minDate={lease.start_date || undefined}
                                className="h-[42px]"
                              />
                            </motion.div>
                          )}
            </div>
                        
                        {lease.lease_type === 'fixed' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.2 }}
                            className="flex items-center space-x-2 max-w-md mx-auto"
                          >
                            <Switch
                              id="rollover"
                              checked={lease.rollover_to_month_to_month}
                              onCheckedChange={(checked) => {
                                setLease(prev => ({...prev, rollover_to_month_to_month: checked}));
                              }}
                            />
                            <Label htmlFor="rollover" className="text-sm">
                              Rollover to &quot;Month to Month&quot; at the end of the term
                            </Label>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
        </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
            >
              Previous
            </Button>
          <Button
            onClick={() => handleNext()}
              disabled={!selectedPropertyId || !selectedUnitId || !lease.start_date || (lease.lease_type === 'fixed' && !lease.end_date)}
          >
            Next
          </Button>
        </div>
      </div>
      </>
    );
  };

  const renderSummaryForm = () => {
    const stepOrder = getStepOrder();

    const allAgreementsChecked = () => {
      // Add logic to check if all required agreements are checked
      // For now, let's check the two existing checkboxes
      return agreeAccuracy;
    };

    return (
      <>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => { 
            console.error('RHF Validation Failed:', errors);
            toast.error("Please correct the validation errors before submitting.");
          })}>
            <h1 className="mb-6 text-2xl font-bold">Summary</h1>
            <p className="mb-6 text-muted-foreground">
              Please review the task details and confirm the agreements below before submitting.
            </p>

            <Card className="overflow-hidden border shadow-sm border-border bg-background/5 mb-8">
              <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Adding Task</h2>
                <div className="space-y-3">
                  {stepOrder.map((stepName) => {
                    // Exclude the 'Summary' step itself from the status list
                    if (stepName === 'Summary') return null; 
                    const isCompleted = completedSteps.has(stepName);
                    return (
                      <div
                        key={stepName}
                        className="flex items-center justify-between rounded-lg bg-muted/20 p-4 border border-border"
                      >
                        <span className="font-medium">{stepName}</span>
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted/50">
                          {isCompleted ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border shadow-sm border-border bg-background/5 mb-8">
              <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Application Status</h2>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="accuracy-agreement"
                      checked={agreeAccuracy}
                      onCheckedChange={(checked) => setAgreeAccuracy(checked === true)}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="accuracy-agreement" className="font-medium">
                        Information Accuracy
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        I confirm that all information provided for this vendor is accurate.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} type="button">
                Previous
              </Button>
              <Button 
                type="submit" 
                disabled={!allAgreementsChecked() || submitting}
              >
                {submitting ? "Submitting..." : "Submit Task"}
              </Button>
            </div>
          </form>
        </Form>
      </>
    );
  };

  // Tenant Selection Form
  const renderTenantForm = () => (
    <>
      <h1 className="mb-6 text-2xl font-bold">Select People</h1>
      <p className="mb-6 text-muted-foreground">Select tenants or accepted prospects for this lease.</p>

      {/* Container for Tenant Cards and Add Button - Centered */}
      <div className="flex flex-wrap gap-4 items-start justify-center mt-8">
        
        {/* Map over selected tenants and display their cards */}
        {selectedTenantObjects.map((tenant) => (
          <div 
            key={tenant.id} 
            className="relative flex flex-col items-center justify-center w-40 h-40 border border-border rounded-lg bg-card text-card-foreground p-4 text-center"
          >
            {/* Remove Button */}
            <button 
              onClick={() => removeTenant(tenant.id)}
              className="absolute top-1 right-1 p-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" 
              aria-label={`Remove ${tenant.name}`}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Tenant Info */}
            <Avatar className="h-12 w-12 mb-2 bg-muted border-border border">
              <AvatarFallback className="text-muted-foreground">
                {tenant.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium truncate w-full">{tenant.name}</span>
          </div>
        ))}

        {/* Add Tenant Button Card */}
        <button
          onClick={() => setTenantDialogOpen(true)}
          className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Add Person"
        >
          <div className="flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-muted">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium">Add Person</span>
        </button>
      </div>

      <Dialog open={tenantDialogOpen} onOpenChange={setTenantDialogOpen}>
        <DialogContent className="sm:max-w-[800px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Select Tenants & Prospects</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose from existing tenants or prospects who have accepted your application.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10 bg-background border-input focus-visible:ring-ring text-foreground"
              value={tenantSearchQuery}
              onChange={(e) => setTenantSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="mt-4">
            {loadingTenants ? (
              <div className="py-8 text-center text-muted-foreground">Loading tenants...</div>
            ) : filteredTenants.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {tenantSearchQuery ? "No tenants match your search" : "No tenants or accepted prospects found"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Select</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className={`cursor-pointer transition-colors ${selectedTenants.includes(tenant.id) ? "bg-primary/10" : "hover:bg-accent"}`}
                      onClick={() => toggleTenantSelection(tenant.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-primary/10 border-primary/30 border">
                            <AvatarFallback className="text-primary">
                              {tenant.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-accent text-accent-foreground border-border">
                          {tenant.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tenant.status.toLowerCase() === "accepted" ? (
                          <Badge
                            variant="outline"
                            className="bg-success-light text-success-light-foreground border-success-light-border"
                          >
                            Accepted
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-medium-light text-medium-light-foreground border-medium-light-border"
                          >
                            {tenant.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center border transition-colors ${
                              selectedTenants.includes(tenant.id) ? "bg-primary border-primary" : "border-border"
                            }`}
                          >
                            {selectedTenants.includes(tenant.id) && <Check className="h-4 w-4 text-primary-foreground" />}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setTenantDialogOpen(false)}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTenantConfirm}
              disabled={selectedTenants.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/30 disabled:text-primary-foreground/50"
            >
              Select People 
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conditional Rendering for Tenant Portal and Renters Insurance Switches */}
      {selectedTenants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4 max-w-xl mx-auto"
        >
          <Separator className="my-8" />
          
          {/* Tenant Portal Switch */}
          <div className="relative flex w-full items-center gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
            <Switch
              checked={tenantPortalEnabled}
              onCheckedChange={handleTenantPortalChange}
              className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-2 rtl:[&_span]:data-[state=checked]:-translate-x-2"
            />
            <div className="flex grow items-start gap-3">
              <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                <div className="flex items-center justify-center w-8 h-8">
                  <Laptop className="size-5 text-[hsl(var(--success))]" />
                </div>
              </div>
              <div className="grid grow gap-2">
                <div className="flex items-center justify-between">
                  <Label>Tenant Portal</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  If turned on, tenants will receive an invitation by email to access their online portal.
                </p>
              </div>
            </div>
          </div>

          {/* Renters Insurance Switch */}
          <div className="relative flex w-full items-center gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
            <Switch
              checked={rentersInsuranceRequired}
              onCheckedChange={handleRentersInsuranceChange}
              className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-2 rtl:[&_span]:data-[state=checked]:-translate-x-2"
            />
            <div className="flex grow items-start gap-3">
              <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                <div className="flex items-center justify-center w-8 h-8">
                  <Umbrella className="size-5 text-[hsl(var(--success))]" />
                </div>
              </div>
              <div className="grid grow gap-2">
                <div className="flex items-center justify-between">
                  <Label>Renters Insurance</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  If turned on, we will require the tenant to purchase renters insurance to protect your property and provide proof of coverage.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between mt-8">
         <Button variant="outline" onClick={handlePrevious}>
           Previous
         </Button>
         <Button 
           onClick={() => handleNext()} 
           disabled={selectedTenants.length === 0}
           className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/30 disabled:text-primary-foreground/50"
         >
           Next
         </Button>
      </div>
    </>
  );

  const renderRentChargesForm = () => {
    // Helper function for ordinal suffixes
    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    // Define fixed descriptions
    const FIXED_DESCRIPTIONS: { [key: string]: string } = {
      baseRent: "Base rental for unit",
      parking: "Parking"
    };

    const updateCharge = (id: string, field: keyof Omit<AdditionalCharge, 'id' | 'key'>, value: string) => {
      setRentChargesLease(prevLease => {
        let updatedRentAmount = prevLease.rent_amount; // Keep track of the simple rent amount
        const updatedCharges = prevLease.additional_charges.map(charge => {
          if (charge.id === id) {
            const updatedCharge = { ...charge, [field]: value };
            // If updating the amount of the base rent charge, sync simple rent amount
            if (charge.key === 'baseRent' && field === 'amount') {
              updatedRentAmount = value;
            }
            return updatedCharge;
          }
          return charge;
        });
        // Return the updated lease state including the potentially synced rent_amount
        return { ...prevLease, rent_amount: updatedRentAmount, additional_charges: updatedCharges };
      });
    };

    const addCharge = () => {
      setRentChargesLease(prevLease => {
        // Determine the key for the new charge: '3', '4', ...
        const nextIndex = prevLease.additional_charges.length + 1; // 1-based
        let key: string | undefined = undefined;
        if (nextIndex > 2) {
          key = nextIndex.toString();
        }
        const newCharge = { id: crypto.randomUUID(), key, type: '', description: '', amount: '' };
        const updatedCharges = [...prevLease.additional_charges, newCharge];
        return { ...prevLease, additional_charges: updatedCharges };
      });
    };

    const removeCharge = (id: string) => {
      // Find the charge to potentially remove
      const chargeToRemove = rentChargesLease.additional_charges.find(c => c.id === id);
      
      // Prevent removing fixed rows by key
      if (chargeToRemove && (chargeToRemove.key === 'baseRent' || chargeToRemove.key === 'parking')) {
        console.log("Cannot remove fixed charge row.");
        return; 
      }
      
      // Ensure we don't remove below the minimum number of fixed rows (should be covered by key check, but adds safety)
      if (rentChargesLease.additional_charges.length > Object.keys(FIXED_DESCRIPTIONS).length) { 
        setRentChargesLease(prevLease => {
          const updatedCharges = prevLease.additional_charges.filter(charge => charge.id !== id);
          return { ...prevLease, additional_charges: updatedCharges };
        });
      }
    };

    const handleAdvancedOptions = (show: boolean) => {
      setShowAdvancedOptions(prevShow => {
        const nextShowState = show !== undefined ? show : !prevShow;
        if (nextShowState) {
          // Switching TO advanced view
          setRentChargesLease(prevLease => {
            const updatedCharges = [...prevLease.additional_charges];
            // Ensure first charge exists and has fixed description and key
            if (updatedCharges.length === 0) {
              updatedCharges.push({ 
                id: crypto.randomUUID(), 
                key: 'baseRent', // Assign key
                type: '', 
                description: FIXED_DESCRIPTIONS.baseRent, 
                amount: prevLease.rent_amount || '' 
              });
            } else {
              updatedCharges[0] = { 
                ...updatedCharges[0], 
                key: 'baseRent', // Ensure key
                description: FIXED_DESCRIPTIONS.baseRent // Ensure description
              };
            }
            // Ensure second charge exists and has fixed description and key
            if (updatedCharges.length === 1) {
              updatedCharges.push({ 
                id: crypto.randomUUID(), 
                key: 'parking', // Assign key
                type: '', 
                description: FIXED_DESCRIPTIONS.parking, 
                amount: '' 
              });
            } else {
              if (updatedCharges[1] && updatedCharges[1].key !== 'baseRent') {
                updatedCharges[1] = { 
                  ...updatedCharges[1], 
                  key: 'parking', // Ensure key
                  description: FIXED_DESCRIPTIONS.parking // Ensure description
                };
              } else if (!updatedCharges[1]) { 
                updatedCharges.push({ 
                  id: crypto.randomUUID(), 
                  key: 'parking', // Assign key
                  type: '', 
                  description: FIXED_DESCRIPTIONS.parking, 
                  amount: '' 
                });
              }
            }
            // Assign keys '3', '4', ... to all subsequent rows
            for (let i = 2; i < updatedCharges.length; i++) {
              updatedCharges[i] = {
                ...updatedCharges[i],
                key: (i + 1).toString(), // 3rd row gets '3', 4th gets '4', etc.
              };
            }
            return { ...prevLease, additional_charges: updatedCharges };
          });
        } else {
          // Switching FROM advanced view (optional: consolidate back to simple rent amount)
        }
        return nextShowState; // Return the new show state
      });
    };

    return (
      <>
        <h1 className="mb-6 text-2xl font-bold">Rent Charges</h1>
        <p className="mb-6 text-muted-foreground">Set up the recurring rent charges and any additional fees for this lease.</p>
        <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {rentChargesLease.start_date && rentChargesLease.start_date < new Date() && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full"
            >
              <div className="flex gap-3">
                <div className="shrink-0">
                  <Info className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-yellow-800">
                    It looks like you are adding a lease that has already started. We recommend charging rent in Velloa on the 1st of the following month.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-2 w-full"
          >
            <Label className="text-base">What day of the month is the first rent due?</Label>
            <div className="grid gap-1.5 w-full max-w-md">
              <Select
                value={rentChargesLease.first_rent_due_day?.toString()}
                onValueChange={(value) => {
                  const day = value ? parseInt(value, 10) : undefined;
                  setRentChargesLease(prev => ({ ...prev, first_rent_due_day: day }));
                }}
              >
                <SelectTrigger className="w-full h-[42px]">
                  <SelectValue placeholder="Select day of the month">
                    {rentChargesLease.first_rent_due_day ? `${rentChargesLease.first_rent_due_day}${getOrdinalSuffix(rentChargesLease.first_rent_due_day)}` : "Select day of the month"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 29 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {`${day}${getOrdinalSuffix(day)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-2 w-full"
          >
            <Label className="text-base">How often do you charge rent?</Label>
            <div className="grid gap-1.5 w-full max-w-md">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-[42px]"
                  >
                    {rentChargesLease.payment_frequency.charAt(0).toUpperCase() + rentChargesLease.payment_frequency.slice(1)}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Search frequency..." />
                    <CommandEmpty>No frequency found.</CommandEmpty>
                    <CommandGroup>
                      {(['monthly', 'weekly','bi-weekly','quarterly', 'annually'] as PaymentFrequency[]).map((frequency) => (
                        <CommandItem
                          key={frequency}
                          onSelect={() => {
                            setRentChargesLease(prev => ({...prev, payment_frequency: frequency}));
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              rentChargesLease.payment_frequency === frequency ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-2 w-full"
          >
            {!showAdvancedOptions ? (
              <>
                <Label className="text-base">What is the rent amount?</Label>
                <div className="relative w-full max-w-md mx-auto">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="rent_amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    required
                    value={rentChargesLease.rent_amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setRentChargesLease(prev => ({...prev, rent_amount: value}));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value !== "") {
                        // Format to two decimals
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                          const formatted = num.toFixed(2);
                          setRentChargesLease(prev => ({...prev, rent_amount: formatted}));
                        }
                      }
                    }}
                    className="pl-8 w-full h-[42px]"
                    autoComplete="off"
                  />
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ width: "400px" }}
                animate={{ width: "900px" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[900px] overflow-visible"
              >
                <div className="grid grid-cols-[2fr,2fr,1fr] gap-4 mb-2">
                  <motion.div
                    initial={{ x: -800, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="col-span-2 grid grid-cols-2 gap-4"
                  >
                    <Label className="text-sm text-muted-foreground">Additional Charges</Label>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                  </motion.div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Amount</Label>
                  </div>
                </div>
                <div className="pr-2 space-y-3">
                  {rentChargesLease.additional_charges.map((charge: AdditionalCharge, index: number) => {
                    const isFixedRow = charge.key === 'baseRent' || charge.key === 'parking'; // Check by key
                    const fixedDescription = isFixedRow ? FIXED_DESCRIPTIONS[charge.key!] : ''; // Get description by key
                    
                    return (
                      <div key={charge.id}>
                        <motion.div 
                          initial={{ x: -800, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 + (index * 0.05), ease: [0.16, 1, 0.3, 1] }}
                          className="grid grid-cols-[2fr,2fr,1fr] gap-4 items-center"
                        >
                          <div className="col-span-2 grid grid-cols-2 gap-4">
                            <AccountCombobox
                              accounts={accounts}
                              value={charge.type}
                              onValueChange={(value) => updateCharge(charge.id, 'type', value)}
                              isLoading={isLoadingAccounts}
                              className="h-[42px] w-full"
                              showAllOption={false}
                            />
                            <Input
                              placeholder={isFixedRow ? fixedDescription : "e.g. Late Fee"}
                              value={isFixedRow ? fixedDescription : charge.description}
                              onChange={(e) => !isFixedRow && updateCharge(charge.id, 'description', e.target.value)}
                              readOnly={isFixedRow} // Make description read-only for fixed rows
                              className={cn("h-[42px] w-full", isFixedRow ? "bg-muted/50 cursor-not-allowed" : "")} // Style read-only field
                              autoComplete="off"
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={charge.amount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*\.?\d*$/.test(value)) {
                                    updateCharge(charge.id, 'amount', value);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  if (value !== "") {
                                    const num = parseFloat(value);
                                    if (!isNaN(num)) {
                                      updateCharge(charge.id, 'amount', num.toFixed(2));
                                    }
                                  }
                                }}
                                className="pl-8 h-[42px] w-full"
                                autoComplete="off"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCharge(charge.id)}
                              className="shrink-0"
                              disabled={isFixedRow}
                            >
                              <X className={cn(
                                "h-4 w-4",
                                isFixedRow ? "text-muted-foreground/40" : ""
                              )} />
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="flex justify-start mt-4"
                >
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={addCharge}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add another charge
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="flex flex-col items-center justify-center gap-2 w-full"
          >
            <div className="w-full max-w-md space-y-4 pb-16">
              <Button 
                variant="default"
                className={cn(
                  "w-full h-[42px] max-w-md mx-auto transition-colors",
                   showAdvancedOptions 
                    ? "bg-black text-white border-black" 
                    : "bg-primary text-primary-foreground" 
                )}
                onClick={() => handleAdvancedOptions(!showAdvancedOptions)}
              >
                <Settings2 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                {showAdvancedOptions ? "Hide advanced options" : "Show advanced options"}
              </Button>

              <Separator className="my-2" />

              <Button 
                variant="outline" 
                className="w-full h-[42px] border-primary hover:bg-primary/10 text-primary font-medium"
                onClick={() => {
                  const newShowState = !showRentIncreaseDialog;
                  setShowRentIncreaseDialog(newShowState);
                  
                  // Set default date to lease start date when opening for the first time
                  if (newShowState && !rentIncrease.date && lease.start_date) {
                    setRentIncrease(prev => ({
                      ...prev,
                      date: lease.start_date
                    }));
                  }
                }}
              >
                <CalendarRange className="-ms-1 me-2 opacity-80" size={16} strokeWidth={2} aria-hidden="true" />
                {showRentIncreaseDialog ? "Hide Rent Increase Schedule" : "Schedule Rent Increase"}
              </Button>

              {showRentIncreaseDialog && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-visible"
                >
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label>When would you like to increase the rent?</Label>
                      <div className="custom-height-calendar [&_input]:h-[42px] [&_button]:h-[42px]">
                        <CalendarWithMonthsInput
                          value={rentIncrease.date}
                          onChange={(date: Date | undefined) => 
                            setRentIncrease(prev => ({...prev, date: date}))
                          }
                          className=""
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Frequency</Label>
                      <Select
                        value={rentIncrease.frequency}
                        onValueChange={(value: 'monthly' | 'quarterly' | 'bi-annual' | 'annually') => 
                          setRentIncrease(prev => ({...prev, frequency: value}))
                        }
                      >
                        <SelectTrigger className="w-full h-[42px]">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="bi-annual">Bi-Annual</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Increase Type</Label>
                      <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5 w-full">
                        <RadioGroup
                          value={rentIncrease.type}
                          onValueChange={(value: 'dollar' | 'percentage') => 
                            setRentIncrease(prev => ({...prev, type: value, amount: ''}))
                          }
                          className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=percentage]:after:translate-x-full data-[state=dollar]:after:translate-x-0 w-full"
                          data-state={rentIncrease.type}
                        >
                          <label className="group-data-[state=percentage]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                            Dollar Amount
                            <RadioGroupItem value="dollar" className="sr-only" />
                          </label>
                          <label className="group-data-[state=dollar]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                            <span>
                              Percentage{" "}
                            </span>
                            <RadioGroupItem value="percentage" className="sr-only" />
                          </label>
                        </RadioGroup>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Amount</Label>
                      <div className="relative">
                        {rentIncrease.type === 'dollar' && (
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        )}
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder={rentIncrease.type === 'dollar' ? '0.00' : '0'}
                          value={rentIncrease.amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d*$/.test(value)) {
                              setRentIncrease(prev => ({...prev, amount: value}));
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value !== "") {
                              const num = parseFloat(value);
                              if (!isNaN(num)) {
                                const formatted = num.toFixed(2);
                                setRentIncrease(prev => ({...prev, amount: formatted}));
                              }
                            }
                          }}
                          className={cn(
                            "h-[42px]",
                            rentIncrease.type === 'dollar' ? "pl-8" : "pl-3"
                          )}
                          autoComplete="off"
                        />
                        {rentIncrease.type === 'percentage' && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
         <div className="flex justify-between gap-4 mt-8">
             <Button variant="outline" onClick={handlePrevious}>Previous</Button>
             <Button 
               onClick={() => handleNext()} 
               disabled={isNextDisabled}
               className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/30 disabled:text-primary-foreground/50"
              >Next</Button>
         </div>
      </div>
      </>
    );
  };

  const renderDepositsDiscountsForm = () => {
    const securityDepositId = `security-deposit-${Math.random()}`;
    const keyDepositId = `key-deposit-${Math.random()}`;

    const isValidAmount = (amount: string): boolean => {
      if (!amount) return false;
      const num = parseFloat(amount);
      return !isNaN(num) && num >= 0; 
    };

    // Calculate if Next button should be disabled
    const isNextDisabled = () => {
      if (depositsState.showSecurityDeposit && !isValidAmount(depositsState.securityDepositAmount)) {
        return true;
      }
      
      if (depositsState.showKeyDeposit && (!depositsState.keyDepositAmount || isNaN(Number(depositsState.keyDepositAmount)) || Number(depositsState.keyDepositAmount) <= 0)) {
        return true;
      }
      
      if (depositsState.showRentDiscount && !isValidAmount(depositsState.rentDiscountAmount)) {
        return true;
      }
      
      return false;
    };

    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6">Deposits & Discounts</h1>
        <p className="text-muted-foreground mb-6">Define the security deposit amounts and any rent discounts for this lease.</p>
        
        {/* Rent Security Deposit Section */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4 w-full">
          <Label htmlFor={securityDepositId} className="text-base font-medium w-48">Rent Deposit</Label>
          <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
            <RadioGroup
              value={depositsState.showSecurityDeposit ? "yes" : "no"}
              onValueChange={(value) => {
                setDepositsState(prev => ({
                  ...prev,
                  showSecurityDeposit: value === "yes",
                  securityDepositAmount: value !== "yes" ? '' : prev.securityDepositAmount
                }));
              }}
              className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=no]:after:translate-x-0 data-[state=yes]:after:translate-x-full"
              data-state={depositsState.showSecurityDeposit ? "yes" : "no"}
            >
              <label className="group-data-[state=yes]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                No
                <RadioGroupItem id={`${securityDepositId}-1`} value="no" className="sr-only" />
              </label>
              <label className="group-data-[state=no]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                Yes
                <RadioGroupItem id={`${securityDepositId}-2`} value="yes" className="sr-only" />
              </label>
            </RadioGroup>
          </div>
        </div>
        
        <AnimatePresence mode="sync">
          {depositsState.showSecurityDeposit && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full mb-6"
            >
              <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                <Label htmlFor="security-deposit-amount" className="text-base font-medium w-48">Deposit Amount</Label>
                <div className="relative w-64">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="security-deposit-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={depositsState.securityDepositAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setDepositsState(prev => ({ ...prev, securityDepositAmount: value }));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value !== "") {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                          const formatted = num.toFixed(2);
                          setDepositsState(prev => ({ ...prev, securityDepositAmount: formatted }));
                        }
                      }
                    }}
                    className="pl-8 w-full h-[42px]"
                    autoComplete="off"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className="my-6" />

        {/* Key Deposit Section */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4 w-full">
          <Label htmlFor={keyDepositId} className="text-base font-medium w-48">Key Deposit</Label>
          <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
            <RadioGroup
              value={depositsState.showKeyDeposit ? "yes" : "no"}
              onValueChange={(value) => {
                setDepositsState(prev => ({
                  ...prev,
                  showKeyDeposit: value === "yes",
                  keyDepositAmount: value !== "yes" ? '' : prev.keyDepositAmount,
                  keyDepositDescription: value !== "yes" ? '' : prev.keyDepositDescription
                }));
              }}
              className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=no]:after:translate-x-0 data-[state=yes]:after:translate-x-full"
              data-state={depositsState.showKeyDeposit ? "yes" : "no"}
            >
              <label className="group-data-[state=yes]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                No
                <RadioGroupItem id={`${keyDepositId}-1`} value="no" className="sr-only" />
              </label>
              <label className="group-data-[state=no]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                Yes
                <RadioGroupItem id={`${keyDepositId}-2`} value="yes" className="sr-only" />
              </label>
            </RadioGroup>
          </div>
        </div>
        
        <AnimatePresence mode="sync">
          {depositsState.showKeyDeposit && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full mb-6"
            >
              <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                <Label htmlFor="key-deposit-amount" className="text-base font-medium w-48">Key Deposit Amount</Label>
                <div className="relative w-64">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="key-deposit-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={depositsState.keyDepositAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setDepositsState(prev => ({ ...prev, keyDepositAmount: value }));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value !== "") {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                          const formatted = num.toFixed(2);
                          setDepositsState(prev => ({ ...prev, keyDepositAmount: formatted }));
                        }
                      }
                    }}
                    className="pl-8 w-full h-[42px]"
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                <Label htmlFor="key-deposit-description" className="text-base font-medium w-48">Description</Label>
                <Input
                  id="key-deposit-description"
                  type="text"
                  placeholder="Description (amount of keys, key type, etc.)"
                  value={depositsState.keyDepositDescription}
                  onChange={e => setDepositsState(prev => ({ ...prev, keyDepositDescription: e.target.value }))}
                  className="w-64 h-[42px]"
                  autoComplete="off"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className="my-6" />

        {/* Rent Discount Section */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4 w-full">
          <Label htmlFor="rent-discount" className="text-base font-medium w-48">Rent Discount</Label>
          <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
            <RadioGroup
              value={depositsState.showRentDiscount ? "yes" : "no"}
              onValueChange={(value) => {
                setDepositsState(prev => ({
                  ...prev,
                  showRentDiscount: value === "yes",
                  rentDiscountAmount: value !== "yes" ? '' : prev.rentDiscountAmount,
                  rentDiscountDescription: value !== "yes" ? '' : prev.rentDiscountDescription
                }));
              }}
              className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=no]:after:translate-x-0 data-[state=yes]:after:translate-x-full"
              data-state={depositsState.showRentDiscount ? "yes" : "no"}
            >
              <label className="group-data-[state=yes]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                No
                <RadioGroupItem id="rent-discount-1" value="no" className="sr-only" />
              </label>
              <label className="group-data-[state=no]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                Yes
                <RadioGroupItem id="rent-discount-2" value="yes" className="sr-only" />
              </label>
            </RadioGroup>
          </div>
        </div>
        
        <AnimatePresence mode="sync">
          {depositsState.showRentDiscount && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full mb-6"
            >
              <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                <Label htmlFor="rent-discount-type" className="text-base font-medium w-48">Discount Type</Label>
                <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5 w-64">
                  <RadioGroup
                    value={depositsState.rentDiscountType}
                    onValueChange={(value: 'dollar' | 'percentage') => {
                      setDepositsState(prev => ({
                        ...prev,
                        rentDiscountType: value,
                        rentDiscountAmount: '' // Clear amount when type changes
                      }));
                    }}
                    className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=percentage]:after:translate-x-full data-[state=dollar]:after:translate-x-0 w-full"
                    data-state={depositsState.rentDiscountType}
                  >
                    <label className="group-data-[state=percentage]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                      Dollar Amount
                      <RadioGroupItem value="dollar" className="sr-only" />
                    </label>
                    <label className="group-data-[state=dollar]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                      Percentage
                      <RadioGroupItem value="percentage" className="sr-only" />
                    </label>
                  </RadioGroup>
                </div>
              </div>
              
              <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                <Label htmlFor="rent-discount-amount" className="text-base font-medium w-48">Discount Amount</Label>
                <div className="relative w-64">
                  {depositsState.rentDiscountType === 'dollar' && (
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  )}
                  <Input 
                    id="rent-discount-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder={depositsState.rentDiscountType === 'dollar' ? '0.00' : '0'}
                    value={depositsState.rentDiscountAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setDepositsState(prev => ({ ...prev, rentDiscountAmount: value }));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value !== "") {
                        const num = parseFloat(value);
                        if (!isNaN(num)) {
                          const formatted = depositsState.rentDiscountType === 'dollar' ? num.toFixed(2) : num.toString();
                          setDepositsState(prev => ({ ...prev, rentDiscountAmount: formatted }));
                        }
                      }
                    }}
                    className={cn(
                      "w-full h-[42px]",
                      depositsState.rentDiscountType === 'dollar' ? "pl-8" : "pl-3"
                    )}
                    autoComplete="off"
                  />
                  {depositsState.rentDiscountType === 'percentage' && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                <Label htmlFor="rent-discount-description" className="text-base font-medium w-48">Description</Label>
                <Input
                  id="rent-discount-description"
                  type="text"
                  placeholder="e.g. First month discount, Student discount, etc."
                  value={depositsState.rentDiscountDescription}
                  onChange={e => setDepositsState(prev => ({ ...prev, rentDiscountDescription: e.target.value }))}
                  className="w-64 h-[42px]"
                  autoComplete="off"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-10 flex justify-between border-t pt-6">
          <div>
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          </div>
          <div>
            <Button 
              onClick={() => handleNext()} 
              disabled={isNextDisabled()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderLateFeesForm = () => {
    const lateFeeId = `late-fee-${Math.random()}`;

    const addLateFee = () => {
      const newLateFee: LateFee = {
        id: crypto.randomUUID(),
        whenToCharge: '',
        frequency: '',
        calculationType: 'fixed',
        amount: '',
        revenueAccount: '',
        description: '',
        showAdvancedOptions: false
      };
      setLateFeesState(prev => ({
        ...prev,
        lateFees: [...prev.lateFees, newLateFee]
      }));
    };

    const removeLateFee = (id: string) => {
      setLateFeesState(prev => ({
        ...prev,
        lateFees: prev.lateFees.filter(fee => fee.id !== id)
      }));
    };

    const updateLateFee = (id: string, field: keyof Omit<LateFee, 'id'>, value: string | boolean) => {
      setLateFeesState(prev => ({
        ...prev,
        lateFees: prev.lateFees.map(fee => 
          fee.id === id ? { ...fee, [field]: value } : fee
        )
      }));
    };

    // Calculate if Next button should be disabled
    const isNextDisabled = () => {
      // Always allow clicking the Next button so validation can show toast messages
      return false;
    };

    return (
    <div>
        <h1 className="text-2xl font-semibold mb-6">Late Fees</h1>
        <p className="text-muted-foreground mb-6">Configure late fee policies for this lease agreement.</p>
        
        {/* Late Fee Section */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4 w-full">
          <Label htmlFor={lateFeeId} className="text-base font-medium w-48">Late Fee</Label>
          <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
            <RadioGroup
              value={lateFeesState.showLateFees ? "yes" : "no"}
              onValueChange={(value) => {
                const showLateFees = value === "yes";
                setLateFeesState(prev => ({
                  ...prev,
                  showLateFees,
                  lateFees: showLateFees && prev.lateFees.length === 0 ? [{
                    id: crypto.randomUUID(),
                    whenToCharge: '',
                    frequency: '',
                    calculationType: 'fixed',
                    amount: '',
                    revenueAccount: '',
                    description: '',
                    showAdvancedOptions: false
                  }] : showLateFees ? prev.lateFees : []
                }));
              }}
              className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=no]:after:translate-x-0 data-[state=yes]:after:translate-x-full"
              data-state={lateFeesState.showLateFees ? "yes" : "no"}
            >
              <label className="group-data-[state=yes]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                No
                <RadioGroupItem id={`${lateFeeId}-1`} value="no" className="sr-only" />
              </label>
              <label className="group-data-[state=no]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                Yes
                <RadioGroupItem id={`${lateFeeId}-2`} value="yes" className="sr-only" />
              </label>
            </RadioGroup>
      </div>
        </div>
        
        <AnimatePresence mode="sync">
          {lateFeesState.showLateFees && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full mb-6 space-y-6"
            >
              <Accordion type="single" collapsible className="w-full space-y-4">
                {lateFeesState.lateFees.map((lateFee, index) => (
                  <AccordionItem key={lateFee.id} value={lateFee.id} className="border rounded-lg">
                    <div className="flex items-center justify-between">
                      <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                        <span className="font-medium">
                          Late Fee {index + 1}
                          {lateFee.whenToCharge && lateFee.amount && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({lateFee.whenToCharge} - {lateFee.calculationType === 'fixed' ? `$${lateFee.amount}` : `${lateFee.amount}%`})
                            </span>
                          )}
                        </span>
                      </AccordionTrigger>
                      {lateFeesState.lateFees.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLateFee(lateFee.id)}
                          className="mr-4 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-6">
                        {/* Grid layout for the 4 main fields */}
                        <div className="grid grid-cols-2 gap-6">
                          {/* When should we charge this late fee? */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">When should we charge this late fee?</Label>
                            <Select
                              value={lateFee.whenToCharge}
                              onValueChange={(value) => updateLateFee(lateFee.id, 'whenToCharge', value)}
                            >
                              <SelectTrigger className="w-full h-[42px]">
                                <SelectValue placeholder="Days after rent is due" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediately">Immediately when due</SelectItem>
                                <SelectItem value="1-day">1 day after rent is due</SelectItem>
                                <SelectItem value="3-days">3 days after rent is due</SelectItem>
                                <SelectItem value="5-days">5 days after rent is due</SelectItem>
                                <SelectItem value="7-days">7 days after rent is due</SelectItem>
                                <SelectItem value="10-days">10 days after rent is due</SelectItem>
                                <SelectItem value="15-days">15 days after rent is due</SelectItem>
                                <SelectItem value="30-days">30 days after rent is due</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* How often should we charge this fee? */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">How often should we charge this fee?</Label>
                            <Select
                              value={lateFee.frequency}
                              onValueChange={(value) => updateLateFee(lateFee.id, 'frequency', value)}
                            >
                              <SelectTrigger className="w-full h-[42px]">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="once">Once</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* How should we calculate this fee? */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">How should we calculate this fee?</Label>
                            <Select
                              value={lateFee.calculationType}
                              onValueChange={(value: 'fixed' | 'percentage') => {
                                updateLateFee(lateFee.id, 'calculationType', value);
                                updateLateFee(lateFee.id, 'amount', ''); // Clear amount when type changes
                              }}
                            >
                              <SelectTrigger className="w-full h-[42px]">
                                <SelectValue placeholder="Fixed amount" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed amount</SelectItem>
                                <SelectItem value="percentage">Percentage of rent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* How much should we charge? */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">How much should we charge?</Label>
                            <div className="relative">
                              {lateFee.calculationType === 'fixed' && (
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                              )}
                              <Input 
                                type="text"
                                inputMode="decimal"
                                placeholder={lateFee.calculationType === 'fixed' ? '$1' : '5'}
                                value={lateFee.amount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*\.?\d*$/.test(value)) {
                                    updateLateFee(lateFee.id, 'amount', value);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value;
                                  if (value !== "") {
                                    const num = parseFloat(value);
                                    if (!isNaN(num)) {
                                      const formatted = lateFee.calculationType === 'fixed' ? num.toFixed(2) : num.toString();
                                      updateLateFee(lateFee.id, 'amount', formatted);
                                    }
                                  }
                                }}
                                className={cn(
                                  "w-full h-[42px]",
                                  lateFee.calculationType === 'fixed' ? "pl-8" : "pl-3"
                                )}
                                autoComplete="off"
                              />
                              {lateFee.calculationType === 'percentage' && (
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                  %
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Advanced Options */}
                        <AnimatePresence mode="sync">
                          {lateFee.showAdvancedOptions && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="grid grid-cols-2 gap-6"
                            >
                              {/* Revenue Account */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Revenue Account</Label>
                                <AccountCombobox
                                  accounts={accounts}
                                  value={lateFee.revenueAccount}
                                  onValueChange={(value) => updateLateFee(lateFee.id, 'revenueAccount', value)}
                                  isLoading={isLoadingAccounts}
                                  className="h-[42px] w-full"
                                  showAllOption={false}
                                />
                              </div>

                              {/* Description */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Description</Label>
                                <Input
                                  type="text"
                                  placeholder="Late fee description"
                                  value={lateFee.description}
                                  onChange={(e) => updateLateFee(lateFee.id, 'description', e.target.value)}
                                  className="w-full h-[42px]"
                                  autoComplete="off"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Advanced Options Button */}
                        <div className="flex justify-center">
                          <Button 
                            variant="default"
                            className={cn(
                              "w-full max-w-md h-[42px] transition-colors",
                              lateFee.showAdvancedOptions 
                                ? "bg-black text-white border-black" 
                                : "bg-green-600 text-white hover:bg-green-700" 
                            )}
                            onClick={() => updateLateFee(lateFee.id, 'showAdvancedOptions', !lateFee.showAdvancedOptions)}
                          >
                            <Settings2 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                            {lateFee.showAdvancedOptions ? "Hide advanced options" : "Show advanced options"}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Add another late fee button */}
              <div className="flex justify-center">
                <Button
                  variant="link"
                  size="sm"
                  className="text-green-600 hover:text-green-700 h-auto p-0"
                  onClick={addLateFee}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add another late fee
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-10 flex justify-between border-t pt-6">
          <div>
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          </div>
          <div>
            <Button 
              onClick={() => handleNext()} 
              disabled={isNextDisabled()}
            >
              Next
            </Button>
          </div>
      </div>
    </div>
  );
  };

  // Utilities & Features handlers
  const handleUtilityChange = (index: number, party: 'landlord' | 'tenant' | 'na', checked: boolean) => {
    const updatedUtilities = [...utilitiesState.utilities];
    const utility = updatedUtilities[index];

    if (party === 'na') {
      if (checked) {
        utility.responsibility = { landlord: false, tenant: false, na: true };
      } else {
        utility.responsibility = { ...utility.responsibility, na: false };
      }
    } else {
      if (checked) {
        utility.responsibility = {
          landlord: party === 'landlord',
          tenant: party === 'tenant',
          na: false,
        };
      } else {
        utility.responsibility = {
          ...utility.responsibility,
          [party]: false,
          na: false,
        };
      }
    }

    setUtilitiesState(prev => ({ ...prev, utilities: updatedUtilities }));
  };

  const handleFeatureChange = (index: number, option: FeatureAvailabilityKey, checked: boolean) => {
    const updatedFeatures = [...utilitiesState.unitFeatures];
    const feature = updatedFeatures[index];

    const newAvailability: FeatureAvailability = { ...feature.availability };

    if (option === 'included' || option === 'not_included') {
      if (checked) {
        newAvailability[option] = true;
        newAvailability[option === 'included' ? 'not_included' : 'included'] = false;
      } else {
        newAvailability[option] = false;
      }
    } else {
      newAvailability[option] = checked;
    }

    feature.availability = newAvailability;
    setUtilitiesState(prev => ({ ...prev, unitFeatures: updatedFeatures }));
  };

  const addCustomUtility = () => {
    if (newUtilityName.trim()) {
      const updatedUtilities = [
        ...utilitiesState.utilities,
        {
          name: newUtilityName.trim(),
          responsibility: { landlord: false, tenant: false },
          custom: true
        }
      ];
      setUtilitiesState(prev => ({ ...prev, utilities: updatedUtilities }));
      setNewUtilityName("");
    }
  };

  const removeCustomUtility = (index: number) => {
    const updatedUtilities = utilitiesState.utilities.filter((_, i) => i !== index);
    setUtilitiesState(prev => ({ ...prev, utilities: updatedUtilities }));
  };

  const addCustomFeature = () => {
    if (newFeatureName.trim()) {
      const updatedFeatures = [
        ...utilitiesState.unitFeatures,
        {
          name: newFeatureName.trim(),
          availability: { included: false, not_included: false, no_charge: false, pay_per_use: false },
          custom: true
        }
      ];
      setUtilitiesState(prev => ({ ...prev, unitFeatures: updatedFeatures }));
      setNewFeatureName("");
    }
  };

  const removeCustomFeature = (index: number) => {
    const updatedFeatures = utilitiesState.unitFeatures.filter((_, i) => i !== index);
    setUtilitiesState(prev => ({ ...prev, unitFeatures: updatedFeatures }));
  };

  const hasRequiredUtilitySelections = () => {
    return !utilitiesState.utilities
      .filter(utility => utility.required)
      .some(utility => !utility.responsibility.landlord && !utility.responsibility.tenant);
  };

  const requiredFeatureNames = [
    "Gas", 
    "Air Conditioning", 
    "On-site Laundry", 
    "Guest Parking", 
    "Additional Storage"
  ];

  const hasRequiredFeatureSelections = () => {
    return !utilitiesState.unitFeatures
      .filter(feature => requiredFeatureNames.includes(feature.name))
      .some(feature => 
        !feature.availability.included && 
        !feature.availability.not_included && 
        !feature.availability.no_charge && 
        !feature.availability.pay_per_use
      );
  };

  // Amenities handlers
  const handleAmenityChange = (index: number, checked: boolean) => {
    setAmenityFeatures(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isIncluded: checked };
      return updated;
    });
  };

  const handleAddCustomAmenity = () => {
    const name = newCustomAmenity.trim();
    if (name && !amenityFeatures.find(f => f.name.toLowerCase() === name.toLowerCase())) {
      setAmenityFeatures(prev => [...prev, { name, isIncluded: false, custom: true }]);
      setNewCustomAmenity("");
    }
  };

  const handleRemoveCustomAmenity = (name: string) => {
    setAmenityFeatures(prev => prev.filter(f => f.name !== name));
  };



  // Function to get icon color based on feature name
  const getFeatureIconColor = (featureName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Gas': 'text-purple-500',
      'Air Conditioning': 'text-blue-400', 
      'Additional Storage': 'text-amber-700',
      'On-site Laundry': 'text-indigo-500',
      'Guest Parking': 'text-green-500'
    };
    return colorMap[featureName] || 'text-purple-500'; // Default color for custom features
  };

  const renderUtilitiesForm = () => {
    const handleUtilitiesContinue = () => {
      const missingRequiredUtilities = utilitiesState.utilities
        .filter(utility => utility.required)
        .filter(utility => !utility.responsibility.landlord && !utility.responsibility.tenant && !utility.responsibility.na);

      if (missingRequiredUtilities.length > 0) {
        const missingNames = missingRequiredUtilities.map(u => u.name).join(', ');
        setUtilitiesValidationError(`Please select responsibility for required utilities: ${missingNames}`);
        return;
      }

      const missingRequiredFeatures = utilitiesState.unitFeatures
        .filter(feature => requiredFeatureNames.includes(feature.name))
        .filter(feature => 
          !feature.availability.included && 
          !feature.availability.not_included && 
          !feature.availability.no_charge && 
          !feature.availability.pay_per_use
        );

      if (missingRequiredFeatures.length > 0) {
        const missingNames = missingRequiredFeatures.map(f => f.name).join(', ');
        setUtilitiesValidationError(`Please make a selection for required features: ${missingNames}`);
        return;
      }

      setUtilitiesValidationError(null);
      handleNext();
    };

    return (
      <div className="space-y-6">
    <div>
          <h1 className="text-2xl font-bold tracking-tight">Services & Utilities</h1>
          <p className="text-muted-foreground">
            Specify utility responsibilities and unit features.
          </p>
      </div>

        {/* Utility Responsibilities Card */}
        <Card>
          <CardHeader>
            <CardTitle>Utility Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-2 font-medium pb-2 border-b text-sm">
              <div>Utility</div>
              <div className="text-center">Landlord</div>
              <div className="text-center">Tenant</div>
              <div className="text-center">N/A</div>
            </div>
            
            {/* Utility Rows */}
            {utilitiesState.utilities.map((utility, index) => (
              <div key={`utility-${index}`} className="grid grid-cols-4 items-center gap-2 py-2 border-b last:border-0">
                {/* Utility Name + Icon */}
                <div className="flex items-center text-sm">
                  {utility.name === "Electricity" && <Zap className="h-4 w-4 mr-2 text-amber-500" />}
                  {utility.name === "Heat" && <Heater className="h-4 w-4 mr-2 text-red-500" />}
                  {utility.name === "Water" && <Droplet className="h-4 w-4 mr-2 text-blue-600" />}
                  {utility.name}  
                  {utility.custom && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground" onClick={() => removeCustomUtility(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Landlord Checkbox */}
                <div className="flex justify-center">
                  <Checkbox 
                    id={`landlord-${index}`}
                    checked={utility.responsibility.landlord}
                    onCheckedChange={(checked) => handleUtilityChange(index, 'landlord', checked as boolean)}
                  />
                </div>
                
                {/* Tenant Checkbox */}
                <div className="flex justify-center">
                  <Checkbox 
                    id={`tenant-${index}`}
                    checked={utility.responsibility.tenant}
                    onCheckedChange={(checked) => handleUtilityChange(index, 'tenant', checked as boolean)}
                  />
                </div>
                
                {/* N/A Checkbox */}
                <div className="flex justify-center">
                  <Checkbox 
                    id={`na-${index}`}
                    checked={!!utility.responsibility.na}
                    onCheckedChange={(checked) => handleUtilityChange(index, 'na', checked as boolean)}
                    disabled={utility.required}
                    className={utility.required ? "invisible" : ""}
                  />
                </div>
              </div>
            ))}
            
            {/* Custom utility input section */}
            <div className="pt-4">
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Add custom utility..." 
                  value={newUtilityName}
                  onChange={(e) => setNewUtilityName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomUtility();
                    }
                  }}
                  autoComplete="off"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={addCustomUtility}
                  disabled={!newUtilityName.trim()}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-5 gap-2 font-medium pb-2 border-b text-sm">
              <div>Feature</div>
              <div className="text-center">Included</div>
              <div className="text-center">Not Included</div>
              <div className="text-center">No Charge</div>
              <div className="text-center">Pay Per Use</div>
            </div>

            {/* Feature Rows */}
            {utilitiesState.unitFeatures.map((feature, index) => (
              <div key={`feature-${index}`} className="grid grid-cols-5 items-center gap-2 py-2 border-b last:border-0">
                {/* Feature Name + Icon + Remove Button for Custom */} 
                <div className="flex items-center text-sm">
                   {feature.icon && <feature.icon className={`h-4 w-4 mr-2 ${getFeatureIconColor(feature.name)}`} />}
                   {feature.name}
                   {feature.custom && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground" onClick={() => removeCustomFeature(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Checkbox Columns */} 
                {(['included', 'not_included', 'no_charge', 'pay_per_use'] as FeatureAvailabilityKey[]).map((option) => (
                  <div key={option} className="flex justify-center items-center">
                    <Checkbox 
                      id={`feature-${index}-${option}`}
                      checked={feature.availability[option]}
                      onCheckedChange={(checked) => handleFeatureChange(index, option, checked as boolean)}
                    />
                  </div>
                ))}
              </div>
            ))}
            
            {/* Add Custom Feature Input */}
            <div className="pt-4">
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Add custom feature..." 
                  value={newFeatureName} 
                  onChange={(e) => setNewFeatureName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomFeature();
                    }
                  }}
                  autoComplete="off"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={addCustomFeature}
                  disabled={!newFeatureName.trim()}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities Card */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header Row - Modified for two columns */}
            <div className="grid grid-cols-2 gap-x-8 pb-2 border-b">
              {[...Array(2)].map((_, colIndex) => (
                <div key={colIndex} className="grid grid-cols-[1fr,auto] gap-4 font-medium text-sm">
                  <div>Amenity</div>
                  <div className="flex justify-center items-center">Included</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {amenityFeatures.map((feature, index) => (
                <div key={feature.name} className="grid grid-cols-[1fr,auto] items-center gap-4 py-2 border-b">
                  <div className="flex items-center text-sm truncate">
                    <span className="truncate">{feature.name}</span>
                    {feature.custom && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground flex-shrink-0" onClick={() => handleRemoveCustomAmenity(feature.name)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex justify-center items-center">
                    <Checkbox
                      id={`amenity-${index}`}
                      checked={feature.isIncluded}
                      onCheckedChange={checked => handleAmenityChange(index, Boolean(checked))}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Add custom amenity..."
                  value={newCustomAmenity}
                  onChange={e => setNewCustomAmenity(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(); } }}
                  autoComplete="off"
                />
                <Button variant="outline" size="icon" onClick={handleAddCustomAmenity} disabled={!newCustomAmenity.trim()}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {utilitiesValidationError && (
          <div className="text-red-500 text-sm font-medium">
            {utilitiesValidationError}
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
          <Button 
            onClick={handleUtilitiesContinue} 
            disabled={!hasRequiredUtilitySelections() || !hasRequiredFeatureSelections()}
          >
            Next
          </Button>
      </div>
    </div>
  );
  };

  const renderPolicyForm = () => {
    return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Policy</h1>
        <p className="text-muted-foreground mb-6">Select the type of policy available for this property.</p>
        
        <Alert variant="destructive" className="mb-6 border-yellow-500 bg-yellow-50 text-yellow-800">
          <CircleAlertIcon className="h-4 w-4 text-yellow-300" />
          <AlertDescription>
            Please ensure your policy matches the terms listed in your actual lease agreement and complies with your province/local laws regarding late fees.
          </AlertDescription>
        </Alert>
        
        {/* Parking Section */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4 w-full">
          <Label className="text-base font-medium w-48">Parking Available</Label>
          <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
            <RadioGroup
              value={policyState.parkingAvailable ? "yes" : "no"}
              onValueChange={val => updatePolicyState({ parkingAvailable: val === "yes" })}
              className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=yes]:after:translate-x-0 data-[state=no]:after:translate-x-full"
              data-state={policyState.parkingAvailable ? "yes" : "no"}
            >
              <label className="group-data-[state=yes]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                Yes
                <RadioGroupItem value="yes" className="sr-only" />
              </label>
              <label className="group-data-[state=no]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                No
                <RadioGroupItem value="no" className="sr-only" />
              </label>
            </RadioGroup>
      </div>
        </div>
        {policyState.parkingAvailable && (
          <div className="w-full space-y-6 mb-6">
            <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
              <Label className="text-base font-medium w-48">Parking Options</Label>
              <Select
                value={policyState.parking[0] || ""}
                onValueChange={val => updatePolicyState({ parking: val ? [val] : [] })}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select parking option" />
                </SelectTrigger>
                <SelectContent>
                  {parkingOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {policyState.parking.length > 0 && (
              <div className="space-y-4 w-full">
                <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
                  <Label htmlFor="car-spots" className="text-base font-medium w-48">Number of Car Spots</Label>
                  <Input
                    id="car-spots"
                    type="number"
                    placeholder="Enter number of spots"
                    value={policyState.numberOfCarSpots === null ? '' : policyState.numberOfCarSpots}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? null : parseInt(value, 10);
                      if (value === '' || (!isNaN(numValue!) && numValue! >= 0)) {
                        updatePolicyState({ numberOfCarSpots: numValue });
                      }
                    }}
                    className="w-64"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        <Separator className="my-6" />
        
        {/* Smoking Section */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4 w-full">
          <Label className="text-base font-medium w-48">Smoking Allowed</Label>
          <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
            <RadioGroup
              value={policyState.smokingAllowed ? "yes" : "no"}
              onValueChange={val => updatePolicyState({ smokingAllowed: val === "yes" })}
              className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=yes]:after:translate-x-0 data-[state=no]:after:translate-x-full"
              data-state={policyState.smokingAllowed ? "yes" : "no"}
            >
              <label className="group-data-[state=yes]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                Yes
                <RadioGroupItem value="yes" className="sr-only" />
              </label>
              <label className="group-data-[state=no]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                No
                <RadioGroupItem value="no" className="sr-only" />
              </label>
            </RadioGroup>
          </div>
        </div>
        {policyState.smokingAllowed && (
          <div className="w-full space-y-6 mb-6">
            <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
              <Label className="text-base font-medium w-48">Smoking Designation</Label>
              <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
                <RadioGroup
                  value={policyState.smokingDesignation}
                  onValueChange={val => updatePolicyState({ smokingDesignation: val })}
                  className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=custom]:after:translate-x-0 data-[state=addendum]:after:translate-x-full after:opacity-0 data-[state=custom]:after:opacity-100 data-[state=addendum]:after:opacity-100"
                  data-state={policyState.smokingDesignation}
                >
                  <label className="group-data-[state=addendum]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                    Custom
                    <RadioGroupItem value="custom" className="sr-only" />
                  </label>
                  <label className="group-data-[state=custom]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                    Addendum
                    <RadioGroupItem value="addendum" className="sr-only" />
                  </label>
                </RadioGroup>
              </div>
            </div>
            {policyState.smokingDesignation === "custom" && (
              <div className="w-full mb-4">
                <Textarea
                  placeholder="Enter custom smoking policy"
                  value={policyState.customSmokingText}
                  onChange={(e) => updatePolicyState({ customSmokingText: e.target.value })}
                  className="w-full"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
        
        <Separator className="my-6" />
        
        {/* Pets Section */}
        <div className="mb-6 flex flex-row items-center justify-between gap-4 w-full">
          <Label className="text-base font-medium w-48">Pets Allowed</Label>
          <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
            <RadioGroup
              value={policyState.petsAllowed ? "yes" : "no"}
              onValueChange={val => updatePolicyState({ petsAllowed: val === "yes" })}
              className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=yes]:after:translate-x-0 data-[state=no]:after:translate-x-full"
              data-state={policyState.petsAllowed ? "yes" : "no"}
            >
              <label className="group-data-[state=yes]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                Yes
                <RadioGroupItem value="yes" className="sr-only" />
              </label>
              <label className="group-data-[state=no]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                No
                <RadioGroupItem value="no" className="sr-only" />
              </label>
            </RadioGroup>
          </div>
        </div>
        {policyState.petsAllowed && (
          <div className="w-full space-y-6 mb-6">
            <div className="flex flex-row items-center justify-between gap-4 w-full mb-4">
              <Label className="text-base font-medium w-48">Pets Rules</Label>
              <div className="bg-input/50 inline-flex h-9 rounded-md p-0.5">
                <RadioGroup
                  value={policyState.petsDesignation}
                  onValueChange={val => updatePolicyState({ petsDesignation: val })}
                  className="group after:bg-background has-focus-visible:after:border-ring has-focus-visible:after:ring-ring/50 relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-sm font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:ring-[3px] data-[state=custom]:after:translate-x-0 data-[state=addendum]:after:translate-x-full after:opacity-0 data-[state=custom]:after:opacity-100 data-[state=addendum]:after:opacity-100"
                  data-state={policyState.petsDesignation}
                >
                  <label className="group-data-[state=addendum]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                    Custom
                    <RadioGroupItem value="custom" className="sr-only" />
                  </label>
                  <label className="group-data-[state=custom]:text-muted-foreground/70 relative z-10 inline-flex h-full min-w-8 cursor-pointer items-center justify-center px-4 whitespace-nowrap transition-colors select-none">
                    Addendum
                    <RadioGroupItem value="addendum" className="sr-only" />
                  </label>
                </RadioGroup>
              </div>
            </div>
            {policyState.petsDesignation === "custom" && (
              <div className="w-full mb-4">
                <Textarea
                  placeholder="Enter custom pets policy"
                  value={policyState.customPetsText}
                  onChange={(e) => updatePolicyState({ customPetsText: e.target.value })}
                  className="w-full"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="mt-10 flex justify-between border-t pt-6">
          <div>
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          </div>
          <div>
            <Button onClick={() => handleNext()}>
              Next
            </Button>
          </div>
      </div>
    </div>
  );
  };

  const renderAddendumForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Addendum</h1>
      <p className="mb-6 text-muted-foreground">Would you like to include any lease addendums with this agreement?</p>
      
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <RadioGroup
            value={addendumState.showAddendum ? "yes" : "no"}
            onValueChange={(value) => {
              setAddendumState(prev => ({
                ...prev,
                showAddendum: value === "yes"
              }));
            }}
            className="grid grid-cols-2 gap-4 max-w-md mx-auto"
          >
            {/* Yes Card */}
            <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-12 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem
                value="yes"
                id="addendum-yes"
                className="sr-only after:absolute after:inset-0"
              />
              <Check className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Yes</p>
                <p className="text-xs text-muted-foreground">Include addendums</p>
              </div>
            </label>

            {/* No Card */}
            <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-12 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem
                value="no"
                id="addendum-no"
                className="sr-only after:absolute after:inset-0"
              />
              <X className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">No</p>
                <p className="text-xs text-muted-foreground">No addendums</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        <AnimatePresence mode="sync">
          {addendumState.showAddendum && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Velloa Standard Addendums Card */}
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Velloa standard addendums </h3>
                      <p className="text-sm text-muted-foreground">
                        Standard addendums that we have prepared for your convenience.
                      </p>
                    </div>
                    <div className="ml-4">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Addendums by Your Company Card */}
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Addendums by your company (Coming Soon)</h3>
                      <p className="text-sm text-muted-foreground">
                        Addendums created by your company admins. Admins may also make changes.
                      </p>
                    </div>
                    <div className="ml-4">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Create One-time Addendum Card */}
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Create one-time addendum</h3>
                                             <p className="text-sm text-muted-foreground">
                         Create for your personal use. This won&apos;t be saved or shared with anyone.
                       </p>
                    </div>
                    <div className="ml-4">
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex w-full justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
        <Button onClick={() => handleNext()} type="button">Next</Button>
      </div>
    </div>
  );

  const renderDocumentsForm = () => {
    const canProceed = () => {
      if (!documentsState.document_status) {
        return false;
      }
      if (documentsState.document_status === 'signed') {
        return files.length > 0;
      } else if (documentsState.document_status === 'not_signed') {
        return !!documentsState.document_action;
      }
      return false;
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-6 text-2xl font-bold">Documents</h1>
          <p className="mb-6 text-muted-foreground">Upload any relevant documents for the tenant (e.g., ID, proof of income, references).</p>
        </div>

        <div className="w-full max-w-[1200px] mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="space-y-4 w-full">
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-xl">
                  {/* Document Status Selection */}
                  <div className="space-y-4 mb-8">
                    <Label className="text-base">Document Status</Label>
                    <RadioGroup 
                      className="grid grid-cols-2 gap-4" 
                      value={documentsState.document_status || ""}
                      onValueChange={(value: 'signed' | 'not_signed') => 
                        setDocumentsState(prev => ({ ...prev, document_status: value, document_action: undefined }))
                      }
                    >
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="signed" 
                          id="doc-signed" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <CircleCheck className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Signed</p>
                          <p className="text-xs text-muted-foreground">Documents are already signed</p>
                        </div>
                      </label>

                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="not_signed" 
                          id="doc-not-signed" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <Lock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Not Signed</p>
                          <p className="text-xs text-muted-foreground">Documents need signatures</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  {/* Action Selection - Only show when Not Signed is selected */}
                  <AnimatePresence mode="sync">
                    {documentsState.document_status === 'not_signed' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 mb-8"
                      >
                        <Label className="text-base">What would you like to do?</Label>
                        <RadioGroup 
                          className="grid grid-cols-2 gap-4" 
                          value={documentsState.document_action || ""}
                          onValueChange={(value: 'draft' | 'esign') => 
                            setDocumentsState(prev => ({ ...prev, document_action: value }))
                          }
                        >
                          <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="draft" 
                              id="action-draft" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <FileText className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Save as Draft</p>
                              <p className="text-xs text-muted-foreground">Save lease for later</p>
                            </div>
                          </label>

                          <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="esign" 
                              id="action-esign" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <PenTool className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Send for eSignature</p>
                              <p className="text-xs text-muted-foreground">Get documents signed electronically</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Document Upload Section - Only show when Signed is selected */}
                  <AnimatePresence mode="sync">
                    {documentsState.document_status === 'signed' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="space-y-4 mb-8">
                          <Label className="text-base">Upload Documents</Label>
                          {/* Drop area using work order style */}
                          <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            data-dragging={isDragging || undefined}
                            data-files={files.length > 0 || undefined}
                            className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
                          >
                            <input
                              {...getInputProps()}
                              className="sr-only"
                              aria-label="Upload document file"
                            />
                            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                              <div
                                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                                aria-hidden="true"
                              >
                                <ImageIcon className="size-4 opacity-60" />
                              </div>
                              <p className="mb-1.5 text-sm font-medium">Drop your documents here</p>
                              <p className="text-muted-foreground text-xs">
                                PDF, DOC, DOCX or images (max. 5MB)
                              </p>
                              <Button variant="outline" className="mt-4" onClick={openFileDialog}>
                                <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
                                Select documents
                              </Button>
                            </div>
                          </div>

                          {errors.length > 0 && (
                            <div
                              className="text-destructive flex items-center gap-1 text-xs"
                              role="alert"
                            >
                              <AlertCircleIcon className="size-3 shrink-0" />
                              <span>{errors[0]}</span>
                            </div>
                          )}

                          {/* File list */}
                          {files.length > 0 && (
                            <div className="space-y-2">
                              {files.map((file: FilePreview) => (
                                <div
                                  key={file.id}
                                  className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
                                >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-accent aspect-square shrink-0 rounded">
                                      {file.file?.type.startsWith('image/') ? (
                                        <Image
                                          src={file.preview}
                                          alt={file.file?.name || file.id}
                                          width={40}
                                          height={40}
                                          className="size-10 rounded-[inherit] object-cover"
                                        />
                                      ) : (
                                        <div className="size-10 rounded-[inherit] flex items-center justify-center">
                                          <FileText className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                      <p className="truncate text-[13px] font-medium">
                                        {file.file?.name || file.id}
                                      </p>
                                      <p className="text-muted-foreground text-xs">
                                        {file.file ? formatBytes(file.file.size) : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                                    onClick={() => removeFile(file.id)}
                                    aria-label="Remove file"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}

                              {/* Remove all files button */}
                              {files.length > 1 && (
                                <div>
                                  <Button size="sm" variant="outline" onClick={clearFiles}>
                                    Remove all files
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex w-full justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
          <Button 
            onClick={() => handleNext()} 
            type="button"
            disabled={!canProceed()}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <AlertDialog open={showAddressAlert} onOpenChange={setShowAddressAlert}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <CircleAlertIcon className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Proceed without Address?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to proceed with no address?
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAddressAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowAddressAlert(false);
              await handleNext({ skipAddressValidationOverride: true });
            }}>
              Skip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New AlertDialog for Insurance */}
      <AlertDialog open={showInsuranceAlert} onOpenChange={setShowInsuranceAlert}>
        <AlertDialogContent>
          <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <CircleAlertIcon className="opacity-80" size={16} />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Proceed without Insurance Provider?</AlertDialogTitle>
              <AlertDialogDescription>
                The insurance provider is not specified. Are you sure you want to proceed?
                This will clear any other insurance information you might have entered for this vendor.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowInsuranceAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowInsuranceAlert(false);
              // No need to clear insurance fields since we don't have them in this form
              await handleNext({ skipInsuranceValidationOverride: true });
            }}>
              Skip & Clear Insurance Info
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex h-screen bg-background">
        {/* Stepper sidebar */}
        <div className="w-72 border-r bg-muted/10 p-6 overflow-y-auto h-full flex flex-col">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">Add a Tenant</h2>
          <div className="relative ml-3 flex-grow">
            {getStepOrder().map((stepName, index) => {
              const isAccessible = isStepAccessible(stepName);
              const isActive = step === stepName;
              const isCompleted = completedSteps.has(stepName);
              return (
                <div key={stepName} className="relative mb-8">
                  {index < getStepOrder().length - 1 && (
                    <div className={cn(
                      "absolute left-[14px] top-[28px] h-[calc(100%+4px)] w-0.5 bg-border",
                      isCompleted ? "bg-green-600" : ""
                    )} />
                  )}
                  <button
                    onClick={() => isAccessible && setStep(stepName)}
                    className="group flex items-center gap-3"
                    disabled={!isAccessible}
                  >
                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                        isActive
                          ? "bg-green-600 text-white"
                          : isCompleted
                          ? "bg-green-600/80 text-white"
                          : "border border-border bg-background text-muted-foreground",
                        !isAccessible ? "opacity-50" : ""
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : !isAccessible ? <Lock className="h-3 w-3" /> : index + 1}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isActive ? "text-green-600" : isCompleted ? "text-green-600/80" : "text-muted-foreground"
                    )}>{stepName}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-3xl">
              {step === 'Intro' && renderIntroForm()}
              {step === 'Properties' && renderPropertiesForm()}
              {step === 'Tenant' && renderTenantForm()}
              {step === 'Rent & Charges' && renderRentChargesForm()}
              {step === 'Deposits & Discounts' && renderDepositsDiscountsForm()}
              {step === 'Late Fees' && renderLateFeesForm()}
              {step === 'Utilities & Features' && renderUtilitiesForm()}
              {step === 'Policy' && renderPolicyForm()}
              {step === 'Addendum' && renderAddendumForm()}
              {step === 'Documents' && renderDocumentsForm()}
              {step === 'Summary' && renderSummaryForm()}
            </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
} 