'use client';

import { useState, forwardRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Phone, Mail, Lock, Search, X, Plus, Check, DollarSign, Cat, Ban, Car, Users, EyeIcon, EyeOffIcon, Home } from 'lucide-react';
import { cn } from "@/lib/utils";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from 'next/image';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import CalendarInput from "@/components/calendarwithmonthsinput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

// Province data
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

// Phone input components
const PhoneInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        className={cn("h-[42px] -ms-px rounded-s-none shadow-none bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20 focus-visible:z-10", className)}
        ref={ref}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: { label: string; value: RPNInput.Country | undefined }[];
};

const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as RPNInput.Country);
  };

  return (
    <div className="relative inline-flex items-center self-stretch h-[42px] rounded-s-lg border border-input bg-background px-3 text-muted-foreground transition-shadow focus-within:z-10 focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 hover:bg-background">
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
        <span className="text-muted-foreground/80">
          <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
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
              {option.label} {option.value && `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="w-5 overflow-hidden rounded-sm">
      {Flag ? <Flag title={countryName} /> : <Phone size={16} aria-hidden="true" />}
    </span>
  );
};

interface ContactForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  ssn: string;
  driversLicenseState: string;
  driversLicenseNumber: string;
  dateOfBirth: Date | undefined;
  gender: string;
  maritalStatus: string;
  aboutYou: string;
  leadStatus: string;
  leadSource: string;
  leadMedium: string;
  assigneeId: string;
  expected_move_in_date: Date | undefined;
}

interface ResidenceForm {
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  moveInDate: string;
  monthlyRent: string;
  reasonForLeaving: string;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  noPastResidence: boolean | null;
}

interface PetForm {
  name: string;
  type: string;
  breed: string;
  color: string;
  weight: string;
  age: string;
  gender: string;
  spayedNeutered: boolean;
}

interface VehicleForm {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  state: string;
}

interface DependentForm {
  firstName: string;
  middleName: string;
  lastName: string;
  relationship: string;
  age: string;
}

interface EmploymentForm {
  employerName: string;
  jobTitle: string;
  monthlyIncome: string;
  employmentType: string;
  startDate: string;
  supervisorName: string;
  supervisorPhone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

interface IncomeForm {
  employmentIncome: string;
  governmentAssistance: string;
  investments: string;
  retirement: string;
  childSupport: string;
  alimony: string;
  otherIncome: string;
  otherIncomeSource: string;
}

interface UnitImage {
  id: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  favorite: boolean;
  isFavorite: boolean;
  image_url: string;
}

interface Property {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
}

interface Unit {
  unit_name: string;
  beds: number | null;
  baths: number | null;
  size: number | null;
  created_at: string;
  market_rent: number | null;
  status: string;
  available_date: string | null;
  property_id: string;
  unit_id: string;
  unit_images: UnitImage[];
  properties: Property;
}

interface UnitListing {
  listingid: string;
  created_at: string;
  title: string | null;
  description: string | null;
  
  amenities: Record<string, unknown> | null;
  available_from: string | null;
  status: string | null;
  unitid: string | null;
  units: Unit;
}

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

export default function AddProspectPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'properties' | 'lead_status' | 'personal' | 'residence' | 'employment' | 'income' | 'pets' | 'vehicles' | 'dependents' | 'summary'>('intro');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [listings, setListings] = useState<UnitListing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    ssn: '',
    driversLicenseState: '',
    driversLicenseNumber: '',
    dateOfBirth: undefined,
    gender: '',
    maritalStatus: '',
    aboutYou: '',
    leadStatus: '',
    leadSource: '',
    leadMedium: '',
    assigneeId: '',
    expected_move_in_date: undefined,
  });
  const [emails, setEmails] = useState<string[]>(['']);
  const [phones, setPhones] = useState<string[]>(['']);
  const [residence, setResidence] = useState<ResidenceForm>({
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    },
    moveInDate: '',
    monthlyRent: '',
    reasonForLeaving: '',
    landlordName: '',
    landlordPhone: '',
    landlordEmail: '',
    noPastResidence: null
  });
  const [pets, setPets] = useState<PetForm[]>([{
    name: '',
    type: '',
    breed: '',
    color: '',
    weight: '',
    age: '',
    gender: '',
    spayedNeutered: false
  }]);
  const [havePets, setHavePets] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleForm[]>([{
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    state: ''
  }]);
  const [dependents, setDependents] = useState<DependentForm[]>([{
    firstName: '',
    middleName: '',
    lastName: '',
    relationship: '',
    age: ''
  }]);
  const [employment, setEmployment] = useState<EmploymentForm>({
    employerName: '',
    jobTitle: '',
    monthlyIncome: '',
    employmentType: '',
    startDate: '',
    supervisorName: '',
    supervisorPhone: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: ''
    }
  });
  const [income, setIncome] = useState<IncomeForm>({
    employmentIncome: '',
    governmentAssistance: '',
    investments: '',
    retirement: '',
    childSupport: '',
    alimony: '',
    otherIncome: '',
    otherIncomeSource: ''
  });
  const [emailError, setEmailError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkipAlert, setShowSkipAlert] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  // Add new state for company settings
  const [companySettings, setCompanySettings] = useState<{ leadsource?: string[] }>({});
  const [showNewSourceDialog, setShowNewSourceDialog] = useState(false);
  const [newSourceValue, setNewSourceValue] = useState('');
  const [haveVehicles, setHaveVehicles] = useState(false);
  const [haveDependents, setHaveDependents] = useState(false);
  // Add step completion tracking
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set(['intro']));
  const [showSSN, setShowSSN] = useState(false);
  const [licenseError, setLicenseError] = useState<string>('');

  // Helper function to check if a step is accessible
  const isStepAccessible = (targetStep: string) => {
    const stepOrder = ['intro', 'properties', 'lead_status', 'personal', 'residence', 'employment', 'income', 'pets', 'vehicles', 'dependents', 'summary'];
    const currentStepIndex = stepOrder.indexOf(step);
    const targetStepIndex = stepOrder.indexOf(targetStep);
    
    // Can always go back
    if (targetStepIndex < currentStepIndex) return true;
    
    // Can only go forward if previous step is completed
    return completedSteps.has(stepOrder[targetStepIndex - 1]);
  };

  // Helper function to mark step as completed
  const markStepCompleted = (completedStep: string) => {
    setCompletedSteps(prev => new Set([...prev, completedStep]));
  };

  const handleBack = () => {
    if (step === 'intro') {
      router.push('/people');
    } else if (step === 'properties') {
      setStep('intro');
    } else if (step === 'lead_status') {
      setStep('properties');
    } else if (step === 'personal') {
      setStep('lead_status');
    } else if (step === 'residence') {
      setStep('personal');
    } else if (step === 'employment') {
      setStep('residence');
    } else if (step === 'income') {
      setStep('employment');
    } else if (step === 'pets') {
      setStep('income');
    } else if (step === 'vehicles') {
      setStep('pets');
    } else if (step === 'dependents') {
      setStep('vehicles');
    } else if (step === 'summary') {
      setStep('dependents');
    }
  };

  const handleSkipProperties = () => {
    markStepCompleted('properties');
    setShowSkipAlert(false);
    setStep('lead_status');
  };

  const handleNext = () => {
    if (step === 'intro') {
      markStepCompleted('intro');
      setStep('properties');
    } else if (step === 'properties') {
      if (!selectedUnitId) {
        setShowSkipAlert(true);
      } else {
        markStepCompleted('properties');
        setStep('lead_status');
      }
    } else if (step === 'lead_status') {
      markStepCompleted('lead_status');
      setStep('personal');
    } else if (step === 'personal') {
      if (!contact.firstName || !contact.lastName || !contact.email || emailError) {
        toast.error('Missing Information', {
          description: 'Please fill out all required fields (First Name, Last Name, and Email)'
        });
        return;
      }
      
      if (!contact.ssn || contact.ssn.length !== 9) {
        toast.error('Invalid SSN', {
          description: 'SSN must be exactly 9 digits'
        });
        return;
      }

      if (!contact.expected_move_in_date) {
        toast.error('Missing Information', {
          description: 'Please select an expected move-in date'
        });
        return;
      }

      markStepCompleted('personal');
      setStep('residence');
    } else if (step === 'residence') {
      if (residence.noPastResidence === null) {
        toast.error('Missing Information', {
          description: 'Please select whether you have rental history or not.'
        });
        return;
      }
      if (!residence.noPastResidence && (!residence.address.street || !residence.address.city || !residence.address.province || !residence.address.postalCode)) {
        toast.error('Missing Information', {
          description: 'Please fill out all address fields.'
        });
        return;
      }
      markStepCompleted('residence');
      setStep('employment');
    } else if (step === 'employment') {
      markStepCompleted('employment');
      setStep('income');
    } else if (step === 'income') {
      markStepCompleted('income');
      setStep('pets');
    } else if (step === 'pets') {
      markStepCompleted('pets');
      setStep('vehicles');
    } else if (step === 'vehicles') {
      markStepCompleted('vehicles');
      setStep('dependents');
    } else if (step === 'dependents') {
      markStepCompleted('dependents');
      setStep('summary');
    } else if (step === 'summary') {
      // Log the final property and unit IDs before submission
      console.log('Final data before submission:', {
        propertyId: selectedPropertyId,
        unitId: selectedUnitId,
        listingId: selectedListingId
      });
      
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      // Prepare data for submission - listing_id will be saved in an array format in prospect_property
      console.log(`Saving prospect with listing_id: ${selectedListingId} to prospect_property as array`);
      
      // Create the request payload
      const payload = {
        contact,
        residence,
        pets,
        vehicles,
        dependents,
        employment,
        income,
        role: 'prospect',
        unit_id: selectedUnitId || '',
        property_id: selectedPropertyId || '',
        listing_id: selectedListingId || ''
      };
      
      console.log('Full request payload:', JSON.stringify(payload));
      
      const response = await fetch('/api/people/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create prospect:', errorData);
        throw new Error(errorData.error || 'Failed to create prospect');
      }

      const responseData = await response.json();
      console.log('Response from API:', responseData);
      router.push('/people');
    } catch (error) {
      console.error('Error creating prospect:', error);
    }
  };

  // Add useEffect for fetching listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoadingListings(true);
        setListingsError(null);
        
        const response = await fetch('/api/unit-listings/published');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Full API Response:', data);
        
        // Detailed logging for the first listing
        if (data.length > 0) {
          const firstListing = data[0];
          console.log('First Listing Details:', {
            listingId: firstListing.listingid,
            unitId: firstListing.unitid,
            propertyId: firstListing.propertyid,
            hasUnits: Boolean(firstListing.units),
            unitsObject: firstListing.units,
            unitImages: firstListing.units?.unit_images,
            unitIdFromUnits: firstListing.units?.unit_id,
            rawListing: firstListing
          });
        }
        
        setListings(data);
      } catch (error) {
        console.error('Detailed Error:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setListingsError(
          error instanceof Error 
            ? error.message 
            : 'Failed to load available properties. Please try again later.'
        );
      } finally {
        setIsLoadingListings(false);
      }
    };

    if (step === 'properties') {
      fetchListings();
    }
  }, [step]);

  useEffect(() => {
    const fetchCompanyMembers = async () => {
      try {
        const response = await fetch('/api/company/members');
        if (!response.ok) {
          throw new Error('Failed to fetch company members');
        }
        const data = await response.json();
        setCompanyMembers(data);
      } catch (error) {
        console.error('Error fetching company members:', error);
      }
    };

    fetchCompanyMembers();
  }, []);

  // Add useEffect to fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/company/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch company settings');
        }
        const data = await response.json();
        setCompanySettings(data);
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    };

    fetchCompanySettings();
  }, []);

  // Add debugging when rendering a listing
  const renderListing = (listing: UnitListing) => {
    console.log('Rendering listing:', {
      listingId: listing.listingid,
      unitId: listing.units.unit_id, // Direct reference to unit_id
      propertyId: listing.units.property_id, // Property ID from unit
      hasUnit: Boolean(listing.units),
      unitDetails: listing.units ? {
        unit_id: listing.units.unit_id,
        unit_name: listing.units.unit_name,
        hasImages: Boolean(listing.units.unit_images),
        imageCount: listing.units.unit_images?.length || 0,
        firstImage: listing.units.unit_images?.[0],
        allImages: listing.units.unit_images?.map(img => ({
          id: img.id,
          fileUrl: img.fileUrl,
          fileName: img.fileName,
          createdAt: img.createdAt,
          favorite: img.favorite,
          isFavorite: img.isFavorite
        }))
      } : null
    });

    // Find the image URL to use - prefer fileUrl over image_url
    const imageUrl = listing.units?.unit_images?.length > 0 
      ? (listing.units.unit_images[0]?.fileUrl || listing.units.unit_images[0]?.image_url)
      : null;
    
    console.log('Using image URL:', imageUrl);
    
    return (
      <div
        key={listing.listingid}
        className={`rounded-lg border overflow-hidden ${
          selectedUnitId === listing.units.unit_id
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary hover:bg-primary/5'
        } cursor-pointer transition-all h-full flex flex-col`}
        onClick={() => {
          // Log the current state before making changes
          console.log('Before selection change:', { 
            currentUnitId: selectedUnitId, 
            currentPropertyId: selectedPropertyId,
            clickedUnitId: listing.units.unit_id,
            clickedPropertyId: listing.units.property_id
          });
          
          setSelectedUnitId(prev => {
            if (prev === listing.units.unit_id) {
              // Deselect the unit
              setSelectedPropertyId('');
              setSelectedListingId('');
              console.log('Deselected unit and property');
              return '';
            } else {
              // Select the unit and property - this will be saved to prospect_property
              const newPropertyId = listing.units.property_id;
              setSelectedPropertyId(newPropertyId);
              setSelectedListingId(listing.listingid);
              console.log(`Selected unit ${listing.units.unit_id}, property ${newPropertyId}, and listing ${listing.listingid} for prospect`);
              return listing.units.unit_id;
            }
          });
          
          // Log the state after the change (will be one render behind due to state updates)
          setTimeout(() => {
            console.log('After selection change (delayed):', { 
              newUnitId: selectedUnitId, 
              newPropertyId: selectedPropertyId,
              newListingId: selectedListingId
            });
          }, 100);
        }}
      >
        {listing.units && listing.units.unit_images && listing.units.unit_images.length > 0 ? (
          <div className="relative w-full h-36">
            <Image
              src={imageUrl || '/placeholder-property.jpg'}
              alt={`Unit ${listing.units.unit_name}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="relative w-full h-36 bg-muted flex items-center justify-center">
            <div className="text-muted-foreground">No image available</div>
          </div>
        )}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-left flex-grow">
              <h3 className="font-medium text-base">
                {listing.units.properties.name} - Unit {listing.units.unit_name}
                {selectedUnitId === listing.units.unit_id && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Selected
                  </span>
                )}
              </h3>
              <div className="text-xs text-muted-foreground">
                <p>{listing.units.properties.address_line_1}</p>
                <p>
                  {listing.units.properties.city}, {listing.units.properties.state}{' '}
                  {listing.units.properties.zip}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
            <p>{listing.units.properties.name} - Unit {listing.units.unit_name}</p>
            <p>Available {new Date(listing.available_from || '').toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderContactForm = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
            <Input 
              id="firstName" 
              placeholder="Enter first name" 
              value={contact.firstName}
              onChange={(e) => setContact({...contact, firstName: e.target.value})}
              className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input 
              id="middleName" 
              placeholder="Enter middle name"
              value={contact.middleName}
              onChange={(e) => setContact({...contact, middleName: e.target.value})}
              className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
            <Input 
              id="lastName" 
              placeholder="Enter last name"
              value={contact.lastName}
              onChange={(e) => setContact({...contact, lastName: e.target.value})}
              className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email"
                className={cn(
                  "h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20",
                  { "border-red-500 focus-visible:ring-red-500": emailError.length > 0 }
                )}
                placeholder="Enter email address"
                value={emails[0]}
                onChange={(e) => {
                  const email = e.target.value;
                  setEmails([email]);
                  setContact({...contact, email: email});
                  
                  // Email validation
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!email) {
                    setEmailError('Email is required');
                  } else if (!emailRegex.test(email)) {
                    setEmailError('Please enter a valid email address');
                  } else {
                    setEmailError('');
                  }
                }}
                required
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Mail size={16} strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
            {emailError && (
              <p className="text-sm text-red-500 mt-1">{emailError}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <RPNInput.default
              className="flex rounded-lg shadow-sm shadow-black/5 bg-background hover:bg-background focus-within:border-ring focus-within:outline-[3px] focus-within:outline-ring/20"
              international
              flagComponent={FlagComponent}
              countrySelectComponent={CountrySelect}
              inputComponent={PhoneInput}
              id="phone"
              placeholder="Enter phone number"
              value={phones[0]}
              onChange={(newValue) => {
                setPhones([newValue ?? ""]);
                setContact({...contact, phone: newValue ?? ""});
              }}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ssn">SSN <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input 
                  id="ssn"
                  type={showSSN ? "text" : "password"}
                  placeholder="Enter SSN"
                  value={contact.ssn}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 9) {
                      setContact({...contact, ssn: value});
                    }
                  }}
                  pattern="[0-9]{9}"
                  maxLength={9}
                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20 pr-10"
                  required
                  title="SSN must be exactly 9 digits"
                />
                <button
                  type="button"
                  onClick={() => setShowSSN(!showSSN)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showSSN ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driversLicenseState">Driver License Province</Label>
              <Select
                value={contact.driversLicenseState}
                onValueChange={(value) => {
                  setContact({...contact, driversLicenseState: value, driversLicenseNumber: ''});
                  setLicenseError('');
                }}
              >
                <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
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
            <div className="grid gap-2">
              <Label htmlFor="driversLicenseNumber">Driver&apos;s License Number</Label>
              <div className="relative">
                <Input 
                  id="driversLicenseNumber"
                  placeholder={contact.driversLicenseState ? `Format: ${driverLicenseFormats[contact.driversLicenseState as keyof typeof driverLicenseFormats]?.format}` : "Select province first"}
                  value={contact.driversLicenseNumber}
                  onChange={(e) => {
                    const formattedValue = formatLicenseNumber(e.target.value, contact.driversLicenseState);
                    setContact({...contact, driversLicenseNumber: formattedValue});
                    validateLicenseNumber(formattedValue, contact.driversLicenseState);
                  }}
                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                  disabled={!contact.driversLicenseState}
                />
              </div>
              {licenseError && (
                <p className="text-sm text-red-500">{licenseError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  const validateLicenseNumber = (license: string, province: string) => {
    if (!province) {
      setLicenseError('Please select a province first');
      return false;
    }

    if (!license) {
      setLicenseError('');
      return true;
    }

    const format = driverLicenseFormats[province as keyof typeof driverLicenseFormats];
    if (!format) {
      setLicenseError('Invalid province selected');
      return false;
    }

    const regex = new RegExp(`^${format.pattern}$`);
    if (!regex.test(license)) {
      setLicenseError(`License must match format: ${format.format}`);
      return false;
    }

    setLicenseError('');
    return true;
  };

  return (
    <div className="mx-auto p-6">
      <Card className="bg-card rounded-xl p-6 h-[calc(100vh-3rem)] flex flex-col shadow-sm border relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Add a Prospect</h1>
        </div>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left Column - Steps */}
          <div className="w-72 shrink-0 border-r pr-6 overflow-y-auto">
            <div className="space-y-2">
              {(() => {
                const stepOrder = ['intro', 'properties', 'lead_status', 'personal', 'residence', 'employment', 'income', 'pets', 'vehicles', 'dependents', 'summary'];
                return (
                  <Stepper value={stepOrder.indexOf(step) + 1} orientation="vertical">
                    {[
                      { step: 'intro', title: 'Intro' },
                      { step: 'properties', title: 'Properties' },
                      { step: 'lead_status', title: 'Lead Status' },
                      { step: 'personal', title: 'Personal Info' },
                      { step: 'residence', title: 'Residence' },
                      { step: 'employment', title: 'Employment' },
                      { step: 'income', title: 'Income' },
                      { step: 'pets', title: 'Pets' },
                      { step: 'vehicles', title: 'Vehicles' },
                      { step: 'dependents', title: 'Dependents' },
                      { step: 'summary', title: 'Summary' }
                    ].map(({ step: stepName, title }, index) => {
                      const isAccessible = isStepAccessible(stepName);
                      const isActive = step === stepName;
                      const thisStepIndex = index;
                      const isCompleted = completedSteps.has(stepName);

                      return (
                        <StepperItem
                          key={stepName}
                          step={index + 1}
                          className={cn(
                            "relative items-start [&:not(:last-child)]:flex-1",
                            !isAccessible ? "opacity-50" : ""
                          )}
                        >
                          <StepperTrigger 
                            className="items-start pb-12 last:pb-0 w-full"
                            onClick={() => {
                              if (isAccessible) {
                                setStep(stepName as 'intro' | 'properties' | 'lead_status' | 'personal' | 'residence' | 'employment' | 'pets' | 'vehicles' | 'dependents' | 'income' | 'summary');
                              }
                            }}
                            disabled={!isAccessible}
                          >
                            <StepperIndicator className={cn(
                              isActive ? "border-primary text-primary" : "",
                              isCompleted ? "border-primary bg-primary text-background" : "",
                              !isAccessible ? "border-muted-foreground/30 text-muted-foreground/30" : ""
                            )}>
                              {isCompleted ? <Lock className="h-3 w-3" /> : !isAccessible ? <Lock className="h-3 w-3" /> : thisStepIndex + 1}
                            </StepperIndicator>
                            <div className="mt-0.5 px-2 text-left">
                              <StepperTitle className={cn(
                                isActive ? "text-primary" : "",
                                !isAccessible ? "text-muted-foreground/50" : "",
                                isCompleted ? "text-primary" : ""
                              )}>{title}</StepperTitle>
                            </div>
                          </StepperTrigger>
                          {stepName !== 'summary' && (
                            <StepperSeparator className={cn(
                              "absolute inset-y-0 left-3 top-[calc(1.5rem+0.125rem)] -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)]",
                              isCompleted ? "bg-primary" : ""
                            )} />
                          )}
                        </StepperItem>
                      );
                    })}
                  </Stepper>
                );
              })()}
              </div>
            </div>
            
          {/* Right Column - Content */}
          <div className="flex-1 overflow-y-auto pr-6">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6 pb-24"
              >
                {step === 'intro' ? (
                  <div className="flex flex-col">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Getting Started</h2>
                      <p className="text-gray-600">
                        Let&apos;s set up a new prospect in your system.
                      </p>
            </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="max-w-2xl w-full mx-auto">
                        <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-3">Required Information</h3>
                          <p className="mb-4">
                            Only three fields are mandatory to create a prospect:
                          </p>
                          <ul className="list-disc list-inside space-y-2">
                            <li>First Name</li>
                            <li>Last Name</li>
                            <li>Email Address</li>
                          </ul>
                          <p className="mt-4">
                            Once created, the prospect will receive an email to complete their profile with additional information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 'properties' ? (
                  <div className="flex flex-col">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Select Properties</h2>
                      <p className="text-gray-600">
                        Choose one or more properties that the prospect is interested in, or skip this step.
                      </p>
                  </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="w-full space-y-4 mt-6">
                        {isLoadingListings ? (
                          <>
                            <div className="flex justify-between items-center mb-4">
                              <div className="relative w-64">
                                <div className="h-[42px] w-full bg-muted rounded-lg animate-pulse" />
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                                <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                              </div>
                            </div>
                            <div className="h-px bg-border my-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {[1, 2, 3, 4].map((index) => (
                                <div key={index} className="rounded-lg border border-border overflow-hidden flex flex-col">
                                  <div className="relative w-full h-36 bg-muted animate-pulse" />
                                  <div className="p-4 space-y-3">
                                    <div className="flex items-start gap-2 justify-between">
                                      <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
                                      <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                                      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                                    </div>
                                    <div className="pt-2 border-t border-border flex justify-between">
                                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                                      <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : listingsError ? (
                          <div className="text-center p-8 border border-red-200 rounded-lg bg-red-50">
                            <p className="text-red-600">{listingsError}</p>
                            <button
                              onClick={() => {
                                setIsLoadingListings(true);
                                setListingsError(null);
                                fetch('/api/unit-listings/published')
                                  .then(async response => {
                                    const data = await response.json();
                                    console.log('API Response:', {
                                      status: response.status,
                                      statusText: response.statusText,
                                      data: data
                                    });
                                    
                                    if (!response.ok) {
                                      throw new Error(
                                        data.error || 
                                        `HTTP error! status: ${response.status}, message: ${data.details || 'Unknown error'}`
                                      );
                                    }
                                    return data;
                                  })
                                  .then(data => {
                                    console.log('Listings data:', JSON.stringify(data, null, 2));
                                    console.log('First listing unit images:', data[0]?.units?.unit_images);
                                    if (data[0]?.units?.unit_images) {
                                      console.log('First image URL:', data[0].units.unit_images[0]?.image_url);
                                    }
                                    setListings(data);
                                    setListingsError(null);
                                  })
                                  .catch(error => {
                                    console.error('Detailed error:', {
                                      message: error.message,
                                      stack: error.stack,
                                      name: error.name
                                    });
                                    setListingsError(error.message);
                                  })
                                  .finally(() => {
                                    setIsLoadingListings(false);
                                  });
                              }}
                              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
                            >
                              Try again
                            </button>
                          </div>
                        ) : listings.length === 0 ? (
                          <div className="text-center p-8 border border-dashed rounded-lg">
                            <p className="text-gray-500">No properties available at this time.</p>
                            <p className="text-sm text-gray-400 mt-2">You can proceed without selecting a property.</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center mb-4 px-1">
                              <div className="relative w-72">
                                <Input
                                  type="search"
                                  placeholder="Search properties..."
                                  className="peer ps-9 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <Search size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                                <button
                                  onClick={() => setSearchQuery('')}
                                  className={`absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 ${!searchQuery && 'hidden'}`}
                                  aria-label="Clear search"
                                  type="button"
                                >
                                  <X size={16} strokeWidth={2} aria-hidden="true" />
                                </button>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-500">
                                  {!selectedUnitId
                                    ? "You haven't selected any property yet" 
                                    : "Selected 1 property"}
                                </p>
                                <button
                                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                                  onClick={() => setSelectedUnitId('')}
                                >
                                  Clear selection
                                </button>
                              </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {listings.map((listing: UnitListing) => renderListing(listing))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : step === 'lead_status' ? (
                  <div className="flex flex-col">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Lead Status</h2>
                      <p className="text-gray-600">
                        Set the lead status and assign the prospect to a team member.
                      </p>
                    </div>

                    <div className="max-w-xl mx-auto w-full mt-8">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <Label>Lead Status</Label>
                            <Select
                              value={contact.leadStatus}
                              onValueChange={(value) => setContact({ ...contact, leadStatus: value })}
                            >
                              <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
                                <SelectValue placeholder="Select Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="unqualified">Unqualified</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Lead Source</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                >
                                  <span className={cn("truncate", !contact.leadSource && "text-muted-foreground")}>
                                    {contact.leadSource || "Select Source"}
                                  </span>
                                  <ChevronDown
                                    size={16}
                                    strokeWidth={2}
                                    className="shrink-0 text-muted-foreground/80"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                                align="start"
                              >
                                <Command>
                                  <CommandInput placeholder="Search source..." />
                                  <CommandList>
                                    <CommandEmpty>No source found.</CommandEmpty>
                                    <CommandGroup>
                                      {companySettings.leadsource?.map((source) => (
                                        <CommandItem
                                          key={source}
                                          value={source}
                                          onSelect={(currentValue) => {
                                            setContact({ ...contact, leadSource: currentValue === contact.leadSource ? "" : currentValue });
                                          }}
                                        >
                                          {source}
                                          {contact.leadSource === source && (
                                            <Check size={16} strokeWidth={2} className="ml-auto" />
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                    <CommandGroup>
                                      <Button 
                                        variant="ghost" 
                                        className="w-full justify-start font-normal"
                                        onClick={() => setShowNewSourceDialog(true)}
                                      >
                                        <Plus
                                          size={16}
                                          strokeWidth={2}
                                          className="-ms-2 me-2 opacity-60"
                                          aria-hidden="true"
                                        />
                                        Add new source
                                      </Button>
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label>Lead Medium</Label>
                            <Select
                              value={contact.leadMedium}
                              onValueChange={(value) => setContact({ ...contact, leadMedium: value })}
                            >
                              <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
                                <SelectValue placeholder="Select Medium" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="walk_in">Walk-in</SelectItem>
                                <SelectItem value="online_form">Online Form</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Assignee</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                >
                                  <span className={cn("truncate", !contact.assigneeId && "text-muted-foreground")}>
                                    {contact.assigneeId
                                      ? companyMembers.find((member) => member.id === contact.assigneeId)
                                        ? `${companyMembers.find((member) => member.id === contact.assigneeId)?.first_name} ${companyMembers.find((member) => member.id === contact.assigneeId)?.last_name}`
                                        : "Select assignee"
                                      : "Select assignee"}
                                  </span>
                                  <ChevronDown
                                    size={16}
                                    strokeWidth={2}
                                    className="shrink-0 text-muted-foreground/80"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                                align="start"
                              >
                                <Command>
                                  <CommandInput placeholder="Search assignee..." />
                                  <CommandList>
                                    <CommandEmpty>No assignee found.</CommandEmpty>
                                    <CommandGroup>
                                      {companyMembers.map((member) => (
                                        <CommandItem
                                          key={member.id}
                                          value={`${member.first_name} ${member.last_name}`}
                                          onSelect={() => {
                                            const newAssigneeId = contact.assigneeId === member.id ? "" : member.id;
                                            setContact({ ...contact, assigneeId: newAssigneeId });
                                          }}
                                        >
                                          {member.first_name} {member.last_name}
                                          {contact.assigneeId === member.id && (
                                            <Check size={16} strokeWidth={2} className="ml-auto" />
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 'personal' ? (
                  <div className="flex flex-col">
                <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Personal Information</h2>
                  <p className="text-gray-600">
                        Enter the prospect&apos;s basic contact and personal information.
                  </p>
                </div>

                    <div className="max-w-4xl mx-auto w-full mt-6">
                      <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid gap-4">
                      {renderContactForm()}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="expected_move_in_date">Expected Move-in Date <span className="text-red-500">*</span></Label>
                          <CalendarInput
                            value={contact.expected_move_in_date}
                            onChange={(date) => setContact({...contact, expected_move_in_date: date})}
                            placeholder="Select move-in date"
                            minDate={new Date()}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <CalendarInput
                            value={contact.dateOfBirth}
                            onChange={(date) => setContact({...contact, dateOfBirth: date})}
                            placeholder="Select date of birth"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            value={contact.gender}
                            onValueChange={(value) => setContact({...contact, gender: value})}
                          >
                            <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="maritalStatus">Marital Status</Label>
                          <Select
                            value={contact.maritalStatus}
                            onValueChange={(value) => setContact({...contact, maritalStatus: value})}
                          >
                            <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
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
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="aboutYou">Tell us why you&apos;re Great!</Label>
                        <textarea
                          id="aboutYou"
                          className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2"
                          placeholder="Share a bit about yourself..."
                          value={contact.aboutYou}
                          onChange={(e) => setContact({...contact, aboutYou: e.target.value})}
                          maxLength={1000}
                        />
                        <div className="text-sm text-muted-foreground text-right">
                          {contact.aboutYou.length}/1000 characters
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                    </div>
              </div>
            ) : step === 'residence' ? (
                  <div className="flex flex-col">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Current Residence</h2>
                      <p className="text-gray-600">
                        Do you have any rental history?
                      </p>
                    </div>

                    <div className="max-w-4xl mx-auto w-full mt-6">
                      <div className="space-y-6">
                        <RadioGroup 
                          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto"
                          value={residence.noPastResidence === true ? "no" : (residence.noPastResidence === false ? "yes" : undefined)}
                          onValueChange={(value: 'yes' | 'no') => {
                            setResidence({
                              ...residence,
                              noPastResidence: value === 'no',
                              address: value === 'no' ? {
                                street: '',
                                city: '',
                                province: '',
                                postalCode: ''
                              } : residence.address,
                              moveInDate: value === 'no' ? '' : residence.moveInDate,
                              monthlyRent: value === 'no' ? '' : residence.monthlyRent,
                              reasonForLeaving: value === 'no' ? '' : residence.reasonForLeaving,
                              landlordName: value === 'no' ? '' : residence.landlordName,
                              landlordPhone: value === 'no' ? '' : residence.landlordPhone,
                              landlordEmail: value === 'no' ? '' : residence.landlordEmail
                            });
                          }}
                        >
                          <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="yes" 
                              id="residence-yes" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <Home className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">Yes, I have rental history</p>
                              <p className="text-xs text-muted-foreground">Select this if you have rented before</p>
                            </div>
                          </label>

                          <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                            <RadioGroupItem 
                              value="no" 
                              id="residence-no" 
                              className="sr-only after:absolute after:inset-0" 
                            />
                            <Ban className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">No, this is my first residence</p>
                              <p className="text-xs text-muted-foreground">Select this if you have never rented before</p>
                            </div>
                          </label>
                        </RadioGroup>

                        {residence.noPastResidence === false && (
                          <>
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="street">Street Address</Label>
                        <Input 
                          id="street"
                                    placeholder="Enter street address"
                          value={residence.address.street}
                                    onChange={(e) => setResidence({
                                      ...residence, 
                                      address: {...residence.address, street: e.target.value}
                                    })}
                          className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                        />
                      </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="city">City</Label>
                        <Input 
                          id="city"
                                    placeholder="Enter city"
                          value={residence.address.city}
                                    onChange={(e) => setResidence({
                                      ...residence, 
                                      address: {...residence.address, city: e.target.value}
                                    })}
                          className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                        />
                      </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="province">Province</Label>
                                  <Select
                                    value={residence.address.province}
                                    onValueChange={(value) => setResidence({
                                      ...residence,
                                      address: {...residence.address, province: value}
                                    })}
                                  >
                                    <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
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
                                <div className="grid gap-2">
                                  <Label htmlFor="postalCode">Postal Code</Label>
                        <Input 
                          id="postalCode"
                                    placeholder="Enter postal code"
                          value={residence.address.postalCode}
                                    onChange={(e) => setResidence({
                                      ...residence, 
                                      address: {...residence.address, postalCode: e.target.value}
                                    })}
                          className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                        />
                      </div>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h3 className="text-lg font-semibold mb-4">Residence Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="moveInDate">Move-in Date</Label>
                                  <CalendarInput
                                    value={residence.moveInDate ? new Date(residence.moveInDate) : undefined}
                                    onChange={(date) => setResidence({...residence, moveInDate: date ? date.toISOString().split('T')[0] : ''})}
                                    className="w-full"
                                    placeholder="Select move-in date"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="monthlyRent">Monthly Rent</Label>
                                  <div className="relative">
                                    <Input 
                                      type="number"
                                      placeholder="Enter amount"
                                      value={residence.monthlyRent}
                                      onChange={(e) => setResidence({...residence, monthlyRent: e.target.value})}
                                      className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                      <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                    </div>
                                  </div>
                                </div>
                                <div className="grid gap-2 md:col-span-2">
                                  <Label htmlFor="reasonForLeaving">Reason for Leaving</Label>
                        <Input 
                          id="reasonForLeaving"
                                    placeholder="Enter reason"
                          value={residence.reasonForLeaving}
                                    onChange={(e) => setResidence({...residence, reasonForLeaving: e.target.value})}
                          className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                        />
                      </div>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h3 className="text-lg font-semibold mb-4">Landlord Information</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="landlordName">Landlord Name</Label>
                        <Input 
                          id="landlordName"
                                    placeholder="Enter landlord name"
                          value={residence.landlordName}
                                    onChange={(e) => setResidence({...residence, landlordName: e.target.value})}
                          className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                        />
                      </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="landlordPhone">Landlord Phone</Label>
                                  <RPNInput.default
                                    className="flex rounded-lg shadow-sm shadow-black/5 bg-background hover:bg-background focus-within:border-ring focus-within:outline-[3px] focus-within:outline-ring/20"
                                    international
                                    flagComponent={FlagComponent}
                                    countrySelectComponent={CountrySelect}
                                    inputComponent={PhoneInput}
                                    id="landlordPhone"
                                    placeholder="Enter landlord phone"
                                    value={residence.landlordPhone}
                                    onChange={(newValue) => setResidence({...residence, landlordPhone: newValue ?? ""})}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="landlordEmail">Landlord Email</Label>
                          <Input 
                            id="landlordEmail"
                            type="email"
                                    placeholder="Enter landlord email"
                            value={residence.landlordEmail}
                                    onChange={(e) => setResidence({...residence, landlordEmail: e.target.value})}
                                    className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                  />
                          </div>
                                </div>
                              </div>
                          </>
                  )}
                      </div>
                </div>
              </div>
            ) : step === 'employment' ? (
                  <div className="flex flex-col">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Employment</h2>
                      <p className="text-gray-600">
                        Enter information about the prospect&apos;s employment.
                      </p>
                  </div>

                    <div className="max-w-4xl mx-auto w-full mt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Employer Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                      <Label htmlFor="employerName">Employer Name</Label>
                      <Input 
                        id="employerName"
                                placeholder="Enter employer name"
                        value={employment.employerName}
                                onChange={(e) => setEmployment({...employment, employerName: e.target.value})}
                        className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                      />
                    </div>
                            <div className="grid gap-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle"
                                placeholder="Enter job title"
                        value={employment.jobTitle}
                                onChange={(e) => setEmployment({...employment, jobTitle: e.target.value})}
                        className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                      />
                    </div>
                            <div className="grid gap-2">
                      <Label htmlFor="monthlyIncome">Monthly Income</Label>
                        <Input 
                          id="monthlyIncome"
                          type="number"
                                placeholder="Enter monthly income"
                          value={employment.monthlyIncome}
                                onChange={(e) => setEmployment({...employment, monthlyIncome: e.target.value})}
                                className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                              />
                      </div>
                            <div className="grid gap-2">
                              <Label htmlFor="employmentType">Employment Type</Label>
                              <Select
                                value={employment.employmentType}
                                onValueChange={(value) => setEmployment({...employment, employmentType: value})}
                              >
                                <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
                                  <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full-time">Full-time</SelectItem>
                                  <SelectItem value="part-time">Part-time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="self-employed">Self-employed</SelectItem>
                                  <SelectItem value="unemployed">Unemployed</SelectItem>
                                  <SelectItem value="retired">Retired</SelectItem>
                                </SelectContent>
                              </Select>
                    </div>
                            <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                              <CalendarInput
                                value={employment.startDate ? new Date(employment.startDate) : undefined}
                                onChange={(date) => setEmployment({...employment, startDate: date ? date.toISOString().split('T')[0] : ''})}
                                className="w-full"
                                placeholder="Select start date"
                              />
                    </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Supervisor Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                      <Label htmlFor="supervisorName">Supervisor Name</Label>
                      <Input 
                        id="supervisorName"
                                placeholder="Enter supervisor name"
                        value={employment.supervisorName}
                                onChange={(e) => setEmployment({...employment, supervisorName: e.target.value})}
                        className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                      />
                    </div>
                            <div className="grid gap-2">
                      <Label htmlFor="supervisorPhone">Supervisor Phone</Label>
                              <RPNInput.default
                                className="flex rounded-lg shadow-sm shadow-black/5 bg-background hover:bg-background focus-within:border-ring focus-within:outline-[3px] focus-within:outline-ring/20"
                                international
                                flagComponent={FlagComponent}
                                countrySelectComponent={CountrySelect}
                                inputComponent={PhoneInput}
                                id="supervisorPhone"
                                placeholder="Enter supervisor phone"
                                value={employment.supervisorPhone}
                                onChange={(newValue) => setEmployment({...employment, supervisorPhone: newValue ?? ""})}
                              />
                    </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Employer Address</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="empStreet">Street Address</Label>
                      <Input 
                                id="empStreet"
                                placeholder="Enter street address"
                        value={employment.address.street}
                                onChange={(e) => setEmployment({
                                  ...employment, 
                                  address: {...employment.address, street: e.target.value}
                                })}
                        className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                      />
                    </div>
                            <div className="grid gap-2">
                              <Label htmlFor="empCity">City</Label>
                      <Input 
                                id="empCity"
                                placeholder="Enter city"
                        value={employment.address.city}
                                onChange={(e) => setEmployment({
                                  ...employment, 
                                  address: {...employment.address, city: e.target.value}
                                })}
                        className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                      />
                    </div>
                            <div className="grid gap-2">
                              <Label htmlFor="empProvince">Province</Label>
                              <Select
                                value={employment.address.province}
                                onValueChange={(value) => setEmployment({
                                  ...employment, 
                                  address: {...employment.address, province: value}
                                })}
                              >
                                <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
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
                            <div className="grid gap-2">
                              <Label htmlFor="empPostalCode">Postal Code</Label>
                      <Input 
                                id="empPostalCode"
                                placeholder="Enter postal code"
                        value={employment.address.postalCode}
                                onChange={(e) => setEmployment({
                                  ...employment, 
                                  address: {...employment.address, postalCode: e.target.value}
                                })}
                        className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                      />
                            </div>
                          </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'income' ? (
                  <div className="flex flex-col">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Income</h2>
                      <p className="text-gray-600">
                        Enter information about the prospect&apos;s income sources.
                      </p>
                  </div>

                    <div className="max-w-4xl mx-auto w-full mt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Income Sources</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="employmentIncome">Employment Income</Label>
                              <div className="relative">
                                <Input 
                                  id="employmentIncome"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={income.employmentIncome}
                                  onChange={(e) => setIncome({...income, employmentIncome: e.target.value})}
                                  className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="governmentAssistance">Government Assistance</Label>
                              <div className="relative">
                                <Input 
                                  id="governmentAssistance"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={income.governmentAssistance}
                                  onChange={(e) => setIncome({...income, governmentAssistance: e.target.value})}
                                  className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="investments">Investments</Label>
                              <div className="relative">
                                <Input 
                                  id="investments"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={income.investments}
                                  onChange={(e) => setIncome({...income, investments: e.target.value})}
                                  className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="retirement">Retirement</Label>
                              <div className="relative">
                                <Input 
                                  id="retirement"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={income.retirement}
                                  onChange={(e) => setIncome({...income, retirement: e.target.value})}
                                  className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="childSupport">Child Support</Label>
                              <div className="relative">
                                <Input 
                                  id="childSupport"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={income.childSupport}
                                  onChange={(e) => setIncome({...income, childSupport: e.target.value})}
                                  className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="alimony">Alimony</Label>
                              <div className="relative">
                                <Input 
                                  id="alimony"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={income.alimony}
                                  onChange={(e) => setIncome({...income, alimony: e.target.value})}
                                  className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="otherIncome">Other Income</Label>
                              <div className="relative">
                                <Input 
                                  id="otherIncome"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={income.otherIncome}
                                  onChange={(e) => setIncome({...income, otherIncome: e.target.value})}
                                  className="h-[42px] peer ps-9 bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                                  <DollarSign size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="otherIncomeSource">Other Income Source</Label>
                              <Input 
                                id="otherIncomeSource"
                                placeholder="Enter source"
                                value={income.otherIncomeSource}
                                onChange={(e) => setIncome({...income, otherIncomeSource: e.target.value})}
                                className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                              />
                            </div>
                  </div>
                </div>
              </div>
                            </div>
                            </div>
                ) : step === 'pets' ? (
              <div className="flex flex-col">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Pets</h2>
                  <p className="text-gray-600">
                    Do you have any pets that will be living with you?
                  </p>
                </div>

                <div className="max-w-4xl mx-auto w-full mt-6">
                  <div className="space-y-6">
                    <RadioGroup 
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto"
                      value={havePets ? "yes" : "no"}
                      onValueChange={(value: 'yes' | 'no') => {
                        setHavePets(value === 'yes');
                        if (value === 'no') {
                          setPets([{
                            name: '',
                            type: '',
                            breed: '',
                            color: '',
                            weight: '',
                            age: '',
                            gender: '',
                            spayedNeutered: false
                          }]);
                        }
                      }}
                    >
                      {/* Yes, I have pets Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="yes" 
                          id="pets-yes" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <Cat className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Yes, I have pets</p>
                          <p className="text-xs text-muted-foreground">Select this if you have any pets that will be living with you</p>
                        </div>
                      </label>

                      {/* No pets Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="no" 
                          id="pets-no" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <Ban className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">No pets</p>
                          <p className="text-xs text-muted-foreground">Select this if you don&apos;t have any pets</p>
                        </div>
                      </label>
                    </RadioGroup>

                    {havePets && (
                      <>
                        {pets.map((pet, index) => (
                          <div key={index} className="border rounded-lg p-4 relative">
                            {pets.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                                onClick={() => {
                                  const newPets = [...pets];
                                  newPets.splice(index, 1);
                                  setPets(newPets);
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove pet</span>
                              </Button>
                            )}
                            <h3 className="text-lg font-semibold mb-4">Pet {index + 1}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor={`name-${index}`}>Name</Label>
                                <Input 
                                  id={`name-${index}`}
                                  placeholder="Enter pet name"
                                  value={pet.name}
                                  onChange={(e) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, name: e.target.value};
                                    setPets(newPets);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`type-${index}`}>Type</Label>
                                <Input 
                                  id={`type-${index}`}
                                  placeholder="Enter pet type"
                                  value={pet.type}
                                  onChange={(e) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, type: e.target.value};
                                    setPets(newPets);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`breed-${index}`}>Breed</Label>
                                <Input 
                                  id={`breed-${index}`}
                                  placeholder="Enter pet breed"
                                  value={pet.breed}
                                  onChange={(e) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, breed: e.target.value};
                                    setPets(newPets);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`color-${index}`}>Color</Label>
                                <Input 
                                  id={`color-${index}`}
                                  placeholder="Enter pet color"
                                  value={pet.color}
                                  onChange={(e) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, color: e.target.value};
                                    setPets(newPets);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`weight-${index}`}>Weight</Label>
                                <Input 
                                  id={`weight-${index}`}
                                  placeholder="Enter pet weight"
                                  value={pet.weight}
                                  onChange={(e) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, weight: e.target.value};
                                    setPets(newPets);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`age-${index}`}>Age</Label>
                                <Input 
                                  id={`age-${index}`}
                                  placeholder="Enter pet age"
                                  value={pet.age}
                                  onChange={(e) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, age: e.target.value};
                                    setPets(newPets);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`gender-${index}`}>Gender</Label>
                                <Select
                                  value={pet.gender}
                                  onValueChange={(value) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, gender: value};
                                    setPets(newPets);
                                  }}
                                >
                                  <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
                                    <SelectValue placeholder="Select Gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`spayedNeutered-${index}`}>Spayed/Neutered</Label>
                                <Select
                                  value={pet.spayedNeutered ? "Yes" : "No"}
                                  onValueChange={(value) => {
                                    const newPets = [...pets];
                                    newPets[index] = {...pet, spayedNeutered: value === "Yes"};
                                    setPets(newPets);
                                  }}
                                >
                                  <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
                                    <SelectValue placeholder="Select Spayed/Neutered" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="No">No</SelectItem>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPets([...pets, {
                              name: '',
                              type: '',
                              breed: '',
                              color: '',
                              weight: '',
                              age: '',
                              gender: '',
                              spayedNeutered: false
                            }]);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Pet
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : step === 'vehicles' ? (
              <div className="flex flex-col">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Vehicles</h2>
                  <p className="text-gray-600">
                    Do you have any vehicles that will be parked at the property?
                  </p>
                </div>

                <div className="max-w-4xl mx-auto w-full mt-6">
                  <div className="space-y-6">
                    <RadioGroup 
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto"
                      value={haveVehicles ? "yes" : "no"}
                      onValueChange={(value: 'yes' | 'no') => {
                        setHaveVehicles(value === 'yes');
                        if (value === 'no') {
                          setVehicles([{
                            make: '',
                            model: '',
                            year: '',
                            color: '',
                            licensePlate: '',
                            state: ''
                          }]);
                        }
                      }}
                    >
                      {/* Yes, I have vehicles Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="yes" 
                          id="vehicles-yes" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <Car className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Yes, I have vehicles</p>
                          <p className="text-xs text-muted-foreground">Select this if you have any vehicles that will be parked at the property</p>
                        </div>
                      </label>

                      {/* No vehicles Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="no" 
                          id="vehicles-no" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <Ban className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">No vehicles</p>
                          <p className="text-xs text-muted-foreground">Select this if you don&apos;t have any vehicles</p>
                        </div>
                      </label>
                    </RadioGroup>

                    {haveVehicles && (
                      <>
                        {vehicles.map((vehicle, index) => (
                          <div key={index} className="border rounded-lg p-4 relative">
                            {vehicles.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                                onClick={() => {
                                  const newVehicles = [...vehicles];
                                  newVehicles.splice(index, 1);
                                  setVehicles(newVehicles);
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove vehicle</span>
                              </Button>
                            )}
                            <h3 className="text-lg font-semibold mb-4">Vehicle {index + 1}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor={`make-${index}`}>Make</Label>
                                <Input 
                                  id={`make-${index}`}
                                  placeholder="Enter vehicle make"
                                  value={vehicle.make}
                                  onChange={(e) => {
                                    const newVehicles = [...vehicles];
                                    newVehicles[index] = {...vehicle, make: e.target.value};
                                    setVehicles(newVehicles);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`model-${index}`}>Model</Label>
                                <Input 
                                  id={`model-${index}`}
                                  placeholder="Enter vehicle model"
                                  value={vehicle.model}
                                  onChange={(e) => {
                                    const newVehicles = [...vehicles];
                                    newVehicles[index] = {...vehicle, model: e.target.value};
                                    setVehicles(newVehicles);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`year-${index}`}>Year</Label>
                                <Input 
                                  id={`year-${index}`}
                                  placeholder="Enter vehicle year"
                                  value={vehicle.year}
                                  onChange={(e) => {
                                    const newVehicles = [...vehicles];
                                    newVehicles[index] = {...vehicle, year: e.target.value};
                                    setVehicles(newVehicles);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`color-${index}`}>Color</Label>
                                <Input 
                                  id={`color-${index}`}
                                  placeholder="Enter vehicle color"
                                  value={vehicle.color}
                                  onChange={(e) => {
                                    const newVehicles = [...vehicles];
                                    newVehicles[index] = {...vehicle, color: e.target.value};
                                    setVehicles(newVehicles);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`licensePlate-${index}`}>License Plate</Label>
                                <Input 
                                  id={`licensePlate-${index}`}
                                  placeholder="Enter license plate"
                                  value={vehicle.licensePlate}
                                  onChange={(e) => {
                                    const newVehicles = [...vehicles];
                                    newVehicles[index] = {...vehicle, licensePlate: e.target.value};
                                    setVehicles(newVehicles);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`state-${index}`}>Province</Label>
                                <Select
                                  value={vehicle.state}
                                  onValueChange={(value) => {
                                    const newVehicles = [...vehicles];
                                    newVehicles[index] = {...vehicle, state: value};
                                    setVehicles(newVehicles);
                                  }}
                                >
                                  <SelectTrigger className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20">
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
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setVehicles([...vehicles, {
                              make: '',
                              model: '',
                              year: '',
                              color: '',
                              licensePlate: '',
                              state: ''
                            }]);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Vehicle
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : step === 'dependents' ? (
              <div className="flex flex-col">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Dependents</h2>
                  <p className="text-gray-600">
                    Do you have any dependents that will be living with you?
                  </p>
                </div>

                <div className="max-w-4xl mx-auto w-full mt-6">
                  <div className="space-y-6">
                    <RadioGroup 
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto"
                      value={haveDependents ? "yes" : "no"}
                      onValueChange={(value: 'yes' | 'no') => {
                        setHaveDependents(value === 'yes');
                        if (value === 'no') {
                          setDependents([{
                            firstName: '',
                            middleName: '',
                            lastName: '',
                            relationship: '',
                            age: ''
                          }]);
                        }
                      }}
                    >
                      {/* Yes, I have dependents Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="yes" 
                          id="dependents-yes" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">Yes, I have dependents</p>
                          <p className="text-xs text-muted-foreground">Select this if you have any dependents that will be living with you</p>
                        </div>
                      </label>

                      {/* No dependents Radio Card */}
                      <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                        <RadioGroupItem 
                          value="no" 
                          id="dependents-no" 
                          className="sr-only after:absolute after:inset-0" 
                        />
                        <Ban className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">No dependents</p>
                          <p className="text-xs text-muted-foreground">Select this if you don&apos;t have any dependents</p>
                        </div>
                      </label>
                    </RadioGroup>

                    {haveDependents && (
                      <>
                        {dependents.map((dependent, index) => (
                          <div key={index} className="border rounded-lg p-4 relative">
                            {dependents.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                                onClick={() => {
                                  const newDependents = [...dependents];
                                  newDependents.splice(index, 1);
                                  setDependents(newDependents);
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove dependent</span>
                              </Button>
                            )}
                            <h3 className="text-lg font-semibold mb-4">Dependent {index + 1}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor={`firstName-${index}`}>First Name</Label>
                                <Input 
                                  id={`firstName-${index}`}
                                  placeholder="Enter first name"
                                  value={dependent.firstName}
                                  onChange={(e) => {
                                    const newDependents = [...dependents];
                                    newDependents[index] = {...dependent, firstName: e.target.value};
                                    setDependents(newDependents);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`middleName-${index}`}>Middle Name</Label>
                                <Input 
                                  id={`middleName-${index}`}
                                  placeholder="Enter middle name"
                                  value={dependent.middleName}
                                  onChange={(e) => {
                                    const newDependents = [...dependents];
                                    newDependents[index] = {...dependent, middleName: e.target.value};
                                    setDependents(newDependents);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                                <Input 
                                  id={`lastName-${index}`}
                                  placeholder="Enter last name"
                                  value={dependent.lastName}
                                  onChange={(e) => {
                                    const newDependents = [...dependents];
                                    newDependents[index] = {...dependent, lastName: e.target.value};
                                    setDependents(newDependents);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`relationship-${index}`}>Relationship</Label>
                                <Input 
                                  id={`relationship-${index}`}
                                  placeholder="Enter relationship"
                                  value={dependent.relationship}
                                  onChange={(e) => {
                                    const newDependents = [...dependents];
                                    newDependents[index] = {...dependent, relationship: e.target.value};
                                    setDependents(newDependents);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor={`age-${index}`}>Age</Label>
                                <Input 
                                  id={`age-${index}`}
                                  placeholder="Enter age"
                                  value={dependent.age}
                                  onChange={(e) => {
                                    const newDependents = [...dependents];
                                    newDependents[index] = {...dependent, age: e.target.value};
                                    setDependents(newDependents);
                                  }}
                                  className="h-[42px] bg-background hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDependents([...dependents, {
                              firstName: '',
                              middleName: '',
                              lastName: '',
                              relationship: '',
                              age: ''
                            }]);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Dependent
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : step === 'summary' ? (
                  <div className="flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Your Prospect Summary</h2>
                      <p className="text-gray-600">Review all information before creating the prospect.</p>
                          </div>
                          
                    <div className="flex items-start justify-center flex-grow">
                      <div className="w-full max-w-[600px] overflow-y-auto">
                        <div className="grid divide-y border rounded-lg bg-card">
                          {/* Personal Information */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Name</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('personal')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">{contact.firstName} {contact.middleName ? contact.middleName + ' ' : ''}{contact.lastName}</p>
                          </div>
                          
                          {/* Property Information */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Property & Unit</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('properties')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1">
                              {selectedListingId ? (
                                <div>
                                  {(() => {
                                    const selectedListing = listings.find(
                                      listing => listing.listingid === selectedListingId
                                    );
                                    return selectedListing ? (
                                      <>
                                        <p className="font-medium">{selectedListing.units.properties.name} - Unit {selectedListing.units.unit_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedListing.units.properties.address_line_1}, {selectedListing.units.properties.city}, {selectedListing.units.properties.state} {selectedListing.units.properties.zip}
                                        </p>
                                      </>
                                    ) : (
                                      <p>Selected listing information not available</p>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <p className="text-gray-500">No property or unit selected</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Contact Information */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Contact Information</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('personal')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1 space-y-1">
                              <p>Email: {contact.email}</p>
                              <p>Phone: {contact.phone || 'Not provided'}</p>
                            </div>
                          </div>

                          {/* Lead Status */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Lead Status</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('lead_status')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1 space-y-1">
                              <p>Status: {contact.leadStatus ? contact.leadStatus.charAt(0).toUpperCase() + contact.leadStatus.slice(1) : 'Not specified'}</p>
                              <p>Source: {contact.leadSource || 'Not specified'}</p>
                              <p>Medium: {contact.leadMedium ? contact.leadMedium.replace('_', ' ').charAt(0).toUpperCase() + contact.leadMedium.slice(1) : 'Not specified'}</p>
                              <p>Assignee: {contact.assigneeId ? 
                                  companyMembers.find(member => member.id === contact.assigneeId) 
                                    ? `${companyMembers.find(member => member.id === contact.assigneeId)?.first_name} ${companyMembers.find(member => member.id === contact.assigneeId)?.last_name}`
                                    : "Not specified"
                                : "Not specified"}</p>
                        </div>
                      </div>

                          {/* Residence */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Residence</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('residence')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1">
                              {residence.noPastResidence === true ? (
                                <p className="text-gray-500">No</p>
                              ) : (
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Current Address</p>
                                    <p>{residence.address.street}</p>
                                    <p>{residence.address.city}, {residence.address.province} {residence.address.postalCode}</p>
                                  </div>
                                  {residence.moveInDate && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Move-in Date</p>
                                      <p>{new Date(residence.moveInDate).toLocaleDateString()}</p>
                                    </div>
                                  )}
                                  {residence.monthlyRent && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                                      <p>${residence.monthlyRent}</p>
                                    </div>
                                  )}
                                  {residence.landlordName && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Landlord</p>
                                      <p>{residence.landlordName}</p>
                                      {residence.landlordPhone && <p>Phone: {residence.landlordPhone}</p>}
                                      {residence.landlordEmail && <p>Email: {residence.landlordEmail}</p>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                                {/* Employment */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Employment</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('employment')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1">
                              {employment.employerName ? (
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Employer</p>
                                    <p>{employment.employerName}</p>
                                  </div>
                                  {employment.startDate && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Start Date</p>
                                      <p>{new Date(employment.startDate).toLocaleDateString()}</p>
                                    </div>
                                  )}
                                  {employment.monthlyIncome && (
                                    <div>
                                      <p className="text-sm text-muted-foreground">Monthly Income</p>
                                      <p>${employment.monthlyIncome}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500">No employer specified</p>
                              )}
                            </div>
                          </div>
                               {/* Income */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Income</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('income')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1">
                              {(() => {
                                const totalIncome = [
                                  income.employmentIncome,
                                  income.governmentAssistance,
                                  income.investments,
                                  income.retirement,
                                  income.childSupport,
                                  income.alimony,
                                  income.otherIncome
                                ]
                                .filter(Boolean)
                                .reduce((sum, val) => sum + Number(val), 0);

                                return totalIncome > 0 ? (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Total Monthly Income</p>
                                    <p>${totalIncome.toLocaleString()}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-500">No income specified</p>
                                );
                              })()}
                            </div>
                          </div>
                               {/* Pets */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Pets</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('pets')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1">
                              {!havePets ? (
                                <p className="text-gray-500">No</p>
                              ) : (
                                <p>{pets.length} {pets.length === 1 ? 'pet' : 'pets'}</p>
                              )}
                            </div>
                          </div>
                          {/* Vehicles */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Vehicles</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('vehicles')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1">
                              {!haveVehicles ? (
                                <p className="text-gray-500">No</p>
                              ) : (
                                <p>{vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}</p>
                              )}
                            </div>
                          </div>
                          {/* Dependents */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Dependents</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('dependents')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-1">
                              {!haveDependents ? (
                                <p className="text-gray-500">No</p>
                              ) : (
                                <p>{dependents.length} {dependents.length === 1 ? 'dependent' : 'dependents'}</p>
                              )}
                            </div>
                          </div>
                  </div>
                </div>
              </div>
                  </div>
                ) : (
                  // Other steps will be added in subsequent edits
                  <div></div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-card rounded-b-xl">
          <div className="flex justify-end gap-4 pr-6">
            <Button
              variant="outline"
            onClick={handleBack}
          >
              {step === 'intro' ? 'Cancel' : 'Previous'}
            </Button>
            <Button onClick={handleNext}>
              {step === 'summary' ? 'Create Prospect' : 'Next'}
            </Button>
        </div>
        </div>
      </Card>

        <AlertDialog open={showSkipAlert} onOpenChange={setShowSkipAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Skip Property Selection?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to skip and not pick any properties for this prospect? You can always add properties later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSkipProperties}>Skip</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showNewSourceDialog} onOpenChange={setShowNewSourceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead Source</DialogTitle>
              <DialogDescription>
                Enter a new lead source below to add it to your company settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newLeadSource">Lead Source Name</Label>
                <Input
                  id="newLeadSource"
                  placeholder="Enter lead source name"
                  value={newSourceValue}
                  onChange={(e) => setNewSourceValue(e.target.value)}
                  className="h-[42px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewSourceDialog(false);
                  setNewSourceValue('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={async () => {
                  if (newSourceValue.trim()) {
                    try {
                      const response = await fetch('/api/company/settings/lead-source', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ source: newSourceValue.trim() }),
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to add lead source');
                      }
                      
                      setCompanySettings(prev => ({
                        ...prev,
                        leadsource: [...(prev.leadsource || []), newSourceValue.trim()]
                      }));
                      setContact({ ...contact, leadSource: newSourceValue.trim() });
                      setNewSourceValue('');
                      setShowNewSourceDialog(false);
                    } catch (error) {
                      console.error('Error adding lead source:', error);
                      toast.error('Failed to add lead source');
                    }
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
