'use client';

import { useState, forwardRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, ChevronDown, Phone, Mail, Search, X, Check, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateField, DateInput, DateSegment } from "react-aria-components";
import { CalendarDate } from "@internationalized/date";
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
        className={cn("h-[42px] -ms-px rounded-s-none shadow-none focus-visible:z-10", className)}
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
    <div className="relative inline-flex items-center self-stretch h-[42px] rounded-s-lg border border-input bg-background px-3 text-muted-foreground transition-shadow focus-within:z-10 focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 hover:bg-accent hover:text-foreground has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
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
  noPastResidence: boolean;
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

export default function AddProspectPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'properties' | 'lead_status' | 'personal' | 'residence' | 'pets' | 'vehicles' | 'dependents' | 'employment' | 'income' | 'summary'>('intro');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
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
    noPastResidence: false
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
  const [landlordEmailError, setLandlordEmailError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkipAlert, setShowSkipAlert] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  // Add new state for company settings
  const [companySettings, setCompanySettings] = useState<{ leadsource?: string[] }>({});
  const [showNewSourceDialog, setShowNewSourceDialog] = useState(false);
  const [newSourceValue, setNewSourceValue] = useState('');

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
    } else if (step === 'pets') {
      setStep('residence');
    } else if (step === 'vehicles') {
      setStep('pets');
    } else if (step === 'dependents') {
      setStep('vehicles');
    } else if (step === 'employment') {
      setStep('dependents');
    } else if (step === 'income') {
      setStep('employment');
    } else if (step === 'summary') {
      setStep('income');
    }
  };

  const handleNext = () => {
    if (step === 'intro') {
      setStep('properties');
    } else if (step === 'properties') {
      if (!selectedUnitId) {
        setShowSkipAlert(true);
      } else {
        setStep('lead_status');
      }
    } else if (step === 'lead_status') {
      setStep('personal');
    } else if (step === 'personal') {
      if (!contact.firstName || !contact.lastName || !contact.email || emailError) {
        return;
      }
      setStep('residence');
    } else if (step === 'residence') {
      // Skip validation if no past residence is checked
      if (residence.noPastResidence) {
        setStep('pets');
        return;
      }
      setStep('pets');
    } else if (step === 'pets') {
      setStep('vehicles');
    } else if (step === 'vehicles') {
      setStep('dependents');
    } else if (step === 'dependents') {
      setStep('employment');
    } else if (step === 'employment') {
      setStep('income');
    } else if (step === 'income') {
      setStep('summary');
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/people/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact,
          residence,
          pets,
          vehicles,
          dependents,
          employment,
          income,
          role: 'prospect',
          unit_id: selectedUnitId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create prospect:', errorData);
        throw new Error(errorData.error || 'Failed to create prospect');
      }

      await response.json(); // consume the response but don't store it
      router.push('/people');
    } catch (error) {
      console.error('Error creating prospect:', error);
    }
  };

  const handleSkipProperties = () => {
    setShowSkipAlert(false);
    setStep('lead_status');
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
          selectedUnitId === listing.units.unit_id // Direct comparison with unit_id
            ? 'border-green-500 bg-green-50'
            : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
        } cursor-pointer transition-all h-full flex flex-col`}
        onClick={() => {
          setSelectedUnitId(prev => {
            if (prev === listing.units.unit_id) {
              return '';
            } else {
              return listing.units.unit_id; // Direct assignment of unit_id
            }
          });
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
          <div className="relative w-full h-36 bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400">No image available</div>
          </div>
        )}
        <div className="p-4">
          {/* Rest of the listing content */}
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-left flex-grow">
              <div className="flex items-start gap-2 justify-between">
                <h3 className="text-lg font-semibold line-clamp-2">{listing.title}</h3>
                <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-green-500 flex-shrink-0">
                  {selectedUnitId === listing.units.unit_id && (
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <p>{listing.units.properties.address_line_1}</p>
                <p>
                  {listing.units.properties.city}, {listing.units.properties.state}{' '}
                  {listing.units.properties.zip}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
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
              className="h-[42px]"
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
              className="h-[42px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
            <Input 
              id="lastName" 
              placeholder="Enter last name"
              value={contact.lastName}
              onChange={(e) => setContact({...contact, lastName: e.target.value})}
              className="h-[42px]"
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
                  "h-[42px] peer ps-9",
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
              className="flex rounded-lg shadow-sm shadow-black/5"
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
              <Input 
                id="ssn"
                type="password"
                placeholder="Enter SSN"
                value={contact.ssn}
                onChange={(e) => setContact({...contact, ssn: e.target.value})}
                className="h-[42px]"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driversLicenseState">Driver License Province</Label>
              <select 
                id="driversLicenseState"
                className="h-[42px] w-full rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                value={contact.driversLicenseState}
                onChange={(e) => setContact({...contact, driversLicenseState: e.target.value})}
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province.value} value={province.value}>
                    {province.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driversLicenseNumber">Driver&apos;s License Number</Label>
              <Input 
                id="driversLicenseNumber"
                placeholder="Enter license number"
                value={contact.driversLicenseNumber}
                onChange={(e) => setContact({...contact, driversLicenseNumber: e.target.value})}
                className="h-[42px]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto p-6">
      <div className="bg-white rounded-xl p-16 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border">
        <div className="space-y-12">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-semibold">Add a prospect</h1>
              <div className="text-sm text-gray-600">
                {step === 'intro' ? 'Introduction' : 
                 step === 'properties' ? 'Select a Property' :
                 step === 'lead_status' ? 'Lead Status' :
                 step === 'personal' ? 'Personal Information' : 
                 step === 'residence' ? 'Residence' :
                 step === 'pets' ? 'Pets' :
                 step === 'vehicles' ? 'Vehicles' :
                 step === 'dependents' ? 'Dependents' :
                 step === 'employment' ? 'Employment' :
                 step === 'income' ? 'Income' : 'Summary'}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-6">
              <div className={`h-full bg-green-600 rounded-full transition-all duration-300 ${
                step === 'intro' ? 'w-[10%]' :
                step === 'properties' ? 'w-[20%]' :
                step === 'lead_status' ? 'w-[30%]' :
                step === 'personal' ? 'w-[40%]' : 
                step === 'residence' ? 'w-[50%]' :
                step === 'pets' ? 'w-[60%]' :
                step === 'vehicles' ? 'w-[70%]' :
                step === 'dependents' ? 'w-[80%]' :
                step === 'employment' ? 'w-[90%]' : 'w-full'
              }`}></div>
            </div>

            {step === 'lead_status' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Lead Status</p>
                    <p className="text-sm text-gray-600">Set the lead status and assign the prospect</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Lead Status</Label>
                      <Select
                        value={contact.leadStatus}
                        onValueChange={(value) => setContact({ ...contact, leadStatus: value })}
                      >
                        <SelectTrigger className="h-[42px]">
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
                        <SelectTrigger className="h-[42px]">
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
            ) : step === 'intro' ? (
              <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center space-y-8 py-12">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Add a Prospect</h2>
                  <p className="text-lg text-gray-600">
                    Enter the prospect&apos;s basic information. They will be able to complete the remaining sections through their profile.
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-left">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Required Information</h3>
                  <p className="text-green-700 mb-4">
                    Only three fields are mandatory to create a prospect:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-green-700">
                    <li>First Name</li>
                    <li>Last Name</li>
                    <li>Email Address</li>
                  </ul>
                  <p className="text-green-700 mt-4">
                    Once created, the prospect will receive an email to complete their profile with additional information.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Optional Sections for Prospects</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">Pets</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">Vehicles</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">Dependents</p>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    The prospect can provide details about their pets, vehicles, and dependents when they complete their profile.
                  </p>
                </div>
              </div>
            ) : step === 'properties' ? (
              <div className="flex flex-col items-center justify-center max-w-7xl mx-auto text-center space-y-8 py-12">
                <div className="space-y-4 w-full">
                  <h2 className="text-3xl font-bold">Select Properties</h2>
                  <p className="text-lg text-gray-600">
                    Choose one or more properties that the prospect is interested in, or skip this step.
                  </p>
                </div>

                <div className="w-full space-y-4">
                  {isLoadingListings ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <div className="relative w-64">
                          <div className="h-[42px] w-full bg-gray-100 rounded-lg animate-pulse" />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
                          <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                        </div>
                      </div>
                      <div className="h-px bg-gray-100 my-4" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((index) => (
                          <div key={index} className="rounded-lg border overflow-hidden flex flex-col">
                            <div className="relative w-full h-36 bg-gray-100 animate-pulse" />
                            <div className="p-4 space-y-3">
                              <div className="flex items-start gap-2 justify-between">
                                <div className="h-6 bg-gray-100 rounded w-3/4 animate-pulse" />
                                <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse" />
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                              </div>
                              <div className="pt-2 border-t flex justify-between">
                                <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded w-1/4 animate-pulse" />
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
                      <div className="flex justify-between items-center mb-4">
                        <div className="relative w-64">
                          <Input
                            type="search"
                            placeholder="Search properties..."
                            className="peer pe-9 ps-9 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <Search size={16} strokeWidth={2} aria-hidden="true" />
                          </div>
                          <button
                            onClick={() => setSearchQuery('')}
                            className={`absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 ${!searchQuery && 'hidden'}`}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {listings.map((listing: UnitListing) => renderListing(listing))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : step === 'personal' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
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
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <DateField 
                            value={contact.dateOfBirth ? new CalendarDate(
                              contact.dateOfBirth.getFullYear(),
                              contact.dateOfBirth.getMonth() + 1,
                              contact.dateOfBirth.getDate()
                            ) : null}
                            onChange={(date) => setContact({...contact, dateOfBirth: date ? 
                              new Date(date.year, date.month - 1, date.day) : undefined})}
                            className="space-y-2"
                          >
                            <DateInput className="relative inline-flex h-[42px] w-full items-center overflow-hidden whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm shadow-black/5 transition-shadow data-[focus-within]:border-ring data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-[3px] data-[focus-within]:ring-ring/20">
                              {(segment) => (
                                <DateSegment
                                  segment={segment}
                                  className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0 data-[disabled]:cursor-not-allowed data-[focused]:bg-accent data-[invalid]:data-[focused]:bg-destructive data-[type=literal]:px-0 data-[focused]:data-[placeholder]:text-foreground data-[focused]:text-foreground data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive data-[placeholder]:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 data-[disabled]:opacity-50"
                                />
                              )}
                            </DateInput>
                          </DateField>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="gender">Gender</Label>
                          <select 
                            id="gender"
                            className="h-[42px] w-full rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                            value={contact.gender}
                            onChange={(e) => setContact({...contact, gender: e.target.value})}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="maritalStatus">Marital Status</Label>
                          <select 
                            id="maritalStatus"
                            className="h-[42px] w-full rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                            value={contact.maritalStatus}
                            onChange={(e) => setContact({...contact, maritalStatus: e.target.value})}
                          >
                            <option value="">Select Status</option>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="divorced">Divorced</option>
                            <option value="widowed">Widowed</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="aboutYou">Tell us why you&apos;re awesome!</Label>
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
            ) : step === 'residence' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Residence</p>
                    <p className="text-sm text-gray-600">What is the prospect&apos;s current residence?</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="noPastResidence"
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                      checked={residence.noPastResidence}
                      onChange={(e) => {
                        setResidence({ 
                          ...residence, 
                          noPastResidence: e.target.checked,
                          // Clear all fields if no past residence
                          ...(e.target.checked ? {
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
                            landlordEmail: ''
                          } : {})
                        });
                        // Clear validation errors if no past residence
                        if (e.target.checked) {
                          setLandlordEmailError('');
                        }
                      }}
                    />
                    <Label 
                      htmlFor="noPastResidence"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      No past residence
                    </Label>
                  </div>

                  {!residence.noPastResidence && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="street">
                          Address <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="street"
                          type="text"
                          value={residence.address.street}
                          onChange={(e) => setResidence({ ...residence, address: { ...residence.address, street: e.target.value }})}
                          placeholder="Street"
                          className="h-[42px]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="city"
                          type="text"
                          value={residence.address.city}
                          onChange={(e) => setResidence({ ...residence, address: { ...residence.address, city: e.target.value }})}
                          placeholder="City"
                          className="h-[42px]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">
                          Province <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="province"
                          type="text"
                          value={residence.address.province}
                          onChange={(e) => setResidence({ ...residence, address: { ...residence.address, province: e.target.value }})}
                          placeholder="Province"
                          className="h-[42px]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">
                          Postal Code <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="postalCode"
                          type="text"
                          value={residence.address.postalCode}
                          onChange={(e) => setResidence({ ...residence, address: { ...residence.address, postalCode: e.target.value }})}
                          placeholder="Postal Code"
                          className="h-[42px]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="moveInDate">
                          Move-in Date <span className="text-destructive">*</span>
                        </Label>
                        <DateField 
                          value={residence.moveInDate ? new CalendarDate(
                            new Date(residence.moveInDate).getFullYear(),
                            new Date(residence.moveInDate).getMonth() + 1,
                            new Date(residence.moveInDate).getDate()
                          ) : null}
                          onChange={(date) => setResidence({ ...residence, moveInDate: date ? 
                            new Date(date.year, date.month - 1, date.day).toISOString() : "" })}
                          className="space-y-2"
                        >
                          <DateInput className="relative inline-flex h-[42px] w-full items-center overflow-hidden whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm shadow-black/5 transition-shadow data-[focus-within]:border-ring data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-[3px] data-[focus-within]:ring-ring/20">
                            {(segment) => (
                              <DateSegment
                                segment={segment}
                                className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0 data-[disabled]:cursor-not-allowed data-[focused]:bg-accent data-[invalid]:data-[focused]:bg-destructive data-[type=literal]:px-0 data-[focused]:data-[placeholder]:text-foreground data-[focused]:text-foreground data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive data-[placeholder]:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 data-[disabled]:opacity-50"
                              />
                            )}
                          </DateInput>
                        </DateField>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthlyRent">
                          Monthly Rent/ Mortgage <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="monthlyRent"
                            type="number"
                            value={residence.monthlyRent}
                            onChange={(e) => setResidence({ ...residence, monthlyRent: e.target.value })}
                            placeholder="0.00"
                            className="h-[42px] peer ps-6"
                            min="0"
                            required
                          />
                          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground peer-disabled:opacity-50">
                            $
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reasonForLeaving">
                          Reason for Leaving <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="reasonForLeaving"
                          type="text"
                          value={residence.reasonForLeaving}
                          onChange={(e) => setResidence({ ...residence, reasonForLeaving: e.target.value })}
                          placeholder="Reason for leaving"
                          className="h-[42px]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landlordName">
                          Landlord Name <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="landlordName"
                          type="text"
                          value={residence.landlordName}
                          onChange={(e) => setResidence({ ...residence, landlordName: e.target.value })}
                          placeholder="Landlord name"
                          className="h-[42px]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landlordPhone">
                          Landlord Phone <span className="text-destructive">*</span>
                        </Label>
                        <RPNInput.default
                          className="flex rounded-lg shadow-sm shadow-black/5"
                          international
                          flagComponent={FlagComponent}
                          countrySelectComponent={CountrySelect}
                          inputComponent={PhoneInput}
                          id="landlordPhone"
                          placeholder="Enter landlord phone number"
                          value={residence.landlordPhone}
                          onChange={(newValue) => setResidence({ ...residence, landlordPhone: newValue ?? "" })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landlordEmail">
                          Landlord Email <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="landlordEmail"
                            type="email"
                            className={cn(
                              "h-[42px] peer ps-9",
                              { "border-red-500 focus-visible:ring-red-500": landlordEmailError.length > 0 }
                            )}
                            value={residence.landlordEmail}
                            onChange={(e) => {
                              const email = e.target.value;
                              setResidence({ ...residence, landlordEmail: email });
                              
                              // Email validation
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!email) {
                                setLandlordEmailError('Email is required');
                              } else if (!emailRegex.test(email)) {
                                setLandlordEmailError('Please enter a valid email address');
                              } else {
                                setLandlordEmailError('');
                              }
                            }}
                            placeholder="Landlord email"
                            required
                          />
                          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <Mail size={16} strokeWidth={2} aria-hidden="true" />
                          </div>
                        </div>
                        {landlordEmailError && (
                          <p className="text-sm text-red-500 mt-1">{landlordEmailError}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : step === 'pets' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Pets</p>
                    <p className="text-sm text-gray-600">What pets does the prospect have?</p>
                  </div>

                  {pets.map((pet, index) => (
                    <div key={index} className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Pet {index + 1}</h3>
                        {pets.length > 1 && (
                          <Button
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setPets(pets.filter((_, i) => i !== index))}
                          >
                            Remove Pet
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor={`petName-${index}`}>Name</Label>
                          <Input 
                            id={`petName-${index}`}
                            type="text"
                            value={pet.name}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, name: e.target.value };
                              setPets(newPets);
                            }}
                            placeholder="Name"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`petType-${index}`}>Type</Label>
                          <Input 
                            id={`petType-${index}`}
                            type="text"
                            value={pet.type}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, type: e.target.value };
                              setPets(newPets);
                            }}
                            placeholder="Type"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`petBreed-${index}`}>Breed</Label>
                          <Input 
                            id={`petBreed-${index}`}
                            type="text"
                            value={pet.breed}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, breed: e.target.value };
                              setPets(newPets);
                            }}
                            placeholder="Breed"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`petColor-${index}`}>Color</Label>
                          <Input 
                            id={`petColor-${index}`}
                            type="text"
                            value={pet.color}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, color: e.target.value };
                              setPets(newPets);
                            }}
                            placeholder="Color"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`petWeight-${index}`}>Weight</Label>
                          <Input 
                            id={`petWeight-${index}`}
                            type="text"
                            value={pet.weight}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, weight: e.target.value };
                              setPets(newPets);
                            }}
                            placeholder="Weight"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`petAge-${index}`}>Age</Label>
                          <Input 
                            id={`petAge-${index}`}
                            type="text"
                            value={pet.age}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, age: e.target.value };
                              setPets(newPets);
                            }}
                            placeholder="Age"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`petGender-${index}`}>Gender</Label>
                          <Input 
                            id={`petGender-${index}`}
                            type="text"
                            value={pet.gender}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, gender: e.target.value };
                              setPets(newPets);
                            }}
                            placeholder="Gender"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`spayedNeutered-${index}`}>Spayed/Neutered</Label>
                          <select 
                            id={`spayedNeutered-${index}`}
                            className="h-[42px] w-full rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
                            value={pet.spayedNeutered ? "yes" : "no"}
                            onChange={(e) => {
                              const newPets = [...pets];
                              newPets[index] = { ...pet, spayedNeutered: e.target.value === "yes" };
                              setPets(newPets);
                            }}
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                      {index < pets.length - 1 && <Separator className="my-6" />}
                    </div>
                  ))}

                  <div className="flex justify-center mt-6">
                    <Button
                      type="button"
                      onClick={() => setPets([...pets, {
                        name: '',
                        type: '',
                        breed: '',
                        color: '',
                        weight: '',
                        age: '',
                        gender: '',
                        spayedNeutered: false
                      }])}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Another Pet
                    </Button>
                  </div>
                </div>
              </div>
            ) : step === 'vehicles' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Vehicles</p>
                    <p className="text-sm text-gray-600">What vehicles does the prospect own?</p>
                  </div>

                  {vehicles.map((vehicle, index) => (
                    <div key={index} className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Vehicle {index + 1}</h3>
                        {vehicles.length > 1 && (
                          <Button
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setVehicles(vehicles.filter((_, i) => i !== index))}
                          >
                            Remove Vehicle
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor={`vehicleMake-${index}`}>Make</Label>
                          <Input 
                            id={`vehicleMake-${index}`}
                            type="text"
                            value={vehicle.make}
                            onChange={(e) => {
                              const newVehicles = [...vehicles];
                              newVehicles[index] = { ...vehicle, make: e.target.value };
                              setVehicles(newVehicles);
                            }}
                            placeholder="Make"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`vehicleModel-${index}`}>Model</Label>
                          <Input 
                            id={`vehicleModel-${index}`}
                            type="text"
                            value={vehicle.model}
                            onChange={(e) => {
                              const newVehicles = [...vehicles];
                              newVehicles[index] = { ...vehicle, model: e.target.value };
                              setVehicles(newVehicles);
                            }}
                            placeholder="Model"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`vehicleYear-${index}`}>Year</Label>
                          <Input 
                            id={`vehicleYear-${index}`}
                            type="text"
                            value={vehicle.year}
                            onChange={(e) => {
                              const newVehicles = [...vehicles];
                              newVehicles[index] = { ...vehicle, year: e.target.value };
                              setVehicles(newVehicles);
                            }}
                            placeholder="Year"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`vehicleColor-${index}`}>Color</Label>
                          <Input 
                            id={`vehicleColor-${index}`}
                            type="text"
                            value={vehicle.color}
                            onChange={(e) => {
                              const newVehicles = [...vehicles];
                              newVehicles[index] = { ...vehicle, color: e.target.value };
                              setVehicles(newVehicles);
                            }}
                            placeholder="Color"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`vehicleLicensePlate-${index}`}>License Plate</Label>
                          <Input 
                            id={`vehicleLicensePlate-${index}`}
                            type="text"
                            value={vehicle.licensePlate}
                            onChange={(e) => {
                              const newVehicles = [...vehicles];
                              newVehicles[index] = { ...vehicle, licensePlate: e.target.value };
                              setVehicles(newVehicles);
                            }}
                            placeholder="License Plate"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`vehicleState-${index}`}>Province/State</Label>
                          <Input 
                            id={`vehicleState-${index}`}
                            type="text"
                            value={vehicle.state}
                            onChange={(e) => {
                              const newVehicles = [...vehicles];
                              newVehicles[index] = { ...vehicle, state: e.target.value };
                              setVehicles(newVehicles);
                            }}
                            placeholder="Province/State"
                            className="h-[42px]"
                          />
                        </div>
                      </div>
                      {index < vehicles.length - 1 && <Separator className="my-6" />}
                    </div>
                  ))}

                  <div className="flex justify-center mt-6">
                    <Button
                      type="button"
                      onClick={() => setVehicles([...vehicles, {
                        make: '',
                        model: '',
                        year: '',
                        color: '',
                        licensePlate: '',
                        state: ''
                      }])}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Another Vehicle
                    </Button>
                  </div>
                </div>
              </div>
            ) : step === 'dependents' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Dependents</p>
                    <p className="text-sm text-gray-600">Who are the prospect&apos;s dependents?</p>
                  </div>

                  {dependents.map((dependent, index) => (
                    <div key={index} className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Dependent {index + 1}</h3>
                        {dependents.length > 1 && (
                          <Button
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setDependents(dependents.filter((_, i) => i !== index))}
                          >
                            Remove Dependent
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor={`firstName-${index}`}>First Name</Label>
                          <Input 
                            id={`firstName-${index}`}
                            type="text"
                            value={dependent.firstName}
                            onChange={(e) => {
                              const newDependents = [...dependents];
                              newDependents[index] = { ...dependent, firstName: e.target.value };
                              setDependents(newDependents);
                            }}
                            placeholder="First Name"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`middleName-${index}`}>Middle Name</Label>
                          <Input 
                            id={`middleName-${index}`}
                            type="text"
                            value={dependent.middleName}
                            onChange={(e) => {
                              const newDependents = [...dependents];
                              newDependents[index] = { ...dependent, middleName: e.target.value };
                              setDependents(newDependents);
                            }}
                            placeholder="Middle Name"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                          <Input 
                            id={`lastName-${index}`}
                            type="text"
                            value={dependent.lastName}
                            onChange={(e) => {
                              const newDependents = [...dependents];
                              newDependents[index] = { ...dependent, lastName: e.target.value };
                              setDependents(newDependents);
                            }}
                            placeholder="Last Name"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`relationship-${index}`}>Relationship</Label>
                          <Input 
                            id={`relationship-${index}`}
                            type="text"
                            value={dependent.relationship}
                            onChange={(e) => {
                              const newDependents = [...dependents];
                              newDependents[index] = { ...dependent, relationship: e.target.value };
                              setDependents(newDependents);
                            }}
                            placeholder="Relationship"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`age-${index}`}>Age</Label>
                          <Input 
                            id={`age-${index}`}
                            type="text"
                            value={dependent.age}
                            onChange={(e) => {
                              const newDependents = [...dependents];
                              newDependents[index] = { ...dependent, age: e.target.value };
                              setDependents(newDependents);
                            }}
                            placeholder="Age"
                            className="h-[42px]"
                          />
                        </div>
                      </div>
                      {index < dependents.length - 1 && <Separator className="my-6" />}
                    </div>
                  ))}

                  <div className="flex justify-center mt-6">
                    <Button
                      type="button"
                      onClick={() => setDependents([...dependents, {
                        firstName: '',
                        middleName: '',
                        lastName: '',
                        relationship: '',
                        age: ''
                      }])}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Another Dependent
                    </Button>
                  </div>
                </div>
              </div>
            ) : step === 'employment' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Employment</p>
                    <p className="text-sm text-gray-600">What is the prospect&apos;s current employment?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="employerName">Employer Name</Label>
                      <Input 
                        id="employerName"
                        type="text"
                        value={employment.employerName}
                        onChange={(e) => setEmployment({ ...employment, employerName: e.target.value })}
                        placeholder="Employer Name"
                        className="h-[42px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle"
                        type="text"
                        value={employment.jobTitle}
                        onChange={(e) => setEmployment({ ...employment, jobTitle: e.target.value })}
                        placeholder="Job Title"
                        className="h-[42px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">Monthly Income</Label>
                      <div className="relative">
                        <Input 
                          id="monthlyIncome"
                          type="number"
                          value={employment.monthlyIncome}
                          onChange={(e) => setEmployment({ ...employment, monthlyIncome: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-[42px] w-full justify-start text-left font-normal",
                              !employment.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {employment.startDate ? (
                              format(new Date(employment.startDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={employment.startDate ? new Date(employment.startDate) : undefined}
                            onSelect={(date) => setEmployment({ ...employment, startDate: date ? date.toISOString() : "" })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supervisorName">Supervisor Name</Label>
                      <Input 
                        id="supervisorName"
                        type="text"
                        value={employment.supervisorName}
                        onChange={(e) => setEmployment({ ...employment, supervisorName: e.target.value })}
                        placeholder="Supervisor Name"
                        className="h-[42px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supervisorPhone">Supervisor Phone</Label>
                      <RPNInput.default
                        className="flex rounded-lg shadow-sm shadow-black/5"
                        international
                        flagComponent={FlagComponent}
                        countrySelectComponent={CountrySelect}
                        inputComponent={PhoneInput}
                        id="supervisorPhone"
                        placeholder="Enter supervisor phone number"
                        value={employment.supervisorPhone}
                        onChange={(newValue) => setEmployment({ ...employment, supervisorPhone: newValue ?? "" })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentStreet">Address</Label>
                      <Input 
                        id="employmentStreet"
                        type="text"
                        value={employment.address.street}
                        onChange={(e) => setEmployment({ ...employment, address: { ...employment.address, street: e.target.value }})}
                        placeholder="Street"
                        className="h-[42px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentCity">City</Label>
                      <Input 
                        id="employmentCity"
                        type="text"
                        value={employment.address.city}
                        onChange={(e) => setEmployment({ ...employment, address: { ...employment.address, city: e.target.value }})}
                        placeholder="City"
                        className="h-[42px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentProvince">Province</Label>
                      <Input 
                        id="employmentProvince"
                        type="text"
                        value={employment.address.province}
                        onChange={(e) => setEmployment({ ...employment, address: { ...employment.address, province: e.target.value }})}
                        placeholder="Province"
                        className="h-[42px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentPostalCode">Postal Code</Label>
                      <Input 
                        id="employmentPostalCode"
                        type="text"
                        value={employment.address.postalCode}
                        onChange={(e) => setEmployment({ ...employment, address: { ...employment.address, postalCode: e.target.value }})}
                        placeholder="Postal Code"
                        className="h-[42px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'income' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Income</p>
                    <p className="text-sm text-gray-600">What is the prospect&apos;s current income?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="employmentIncome">
                        Employment Income <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input 
                          id="employmentIncome"
                          type="number"
                          value={income.employmentIncome}
                          onChange={(e) => setIncome({ ...income, employmentIncome: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                          required
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="governmentAssistance">Government Assistance</Label>
                      <div className="relative">
                        <Input 
                          id="governmentAssistance"
                          type="number"
                          value={income.governmentAssistance}
                          onChange={(e) => setIncome({ ...income, governmentAssistance: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="investments">Investment Income</Label>
                      <div className="relative">
                        <Input 
                          id="investments"
                          type="number"
                          value={income.investments}
                          onChange={(e) => setIncome({ ...income, investments: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retirement">Retirement Income</Label>
                      <div className="relative">
                        <Input 
                          id="retirement"
                          type="number"
                          value={income.retirement}
                          onChange={(e) => setIncome({ ...income, retirement: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="childSupport">Child Support</Label>
                      <div className="relative">
                        <Input 
                          id="childSupport"
                          type="number"
                          value={income.childSupport}
                          onChange={(e) => setIncome({ ...income, childSupport: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alimony">Alimony</Label>
                      <div className="relative">
                        <Input 
                          id="alimony"
                          type="number"
                          value={income.alimony}
                          onChange={(e) => setIncome({ ...income, alimony: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherIncome">Other Income</Label>
                      <div className="relative">
                        <Input 
                          id="otherIncome"
                          type="number"
                          value={income.otherIncome}
                          onChange={(e) => setIncome({ ...income, otherIncome: e.target.value })}
                          placeholder="0.00"
                          className="h-[42px] peer ps-6"
                          min="0"
                        />
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                          $
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otherIncomeSource">Other Income Source</Label>
                      <Input 
                        id="otherIncomeSource"
                        type="text"
                        value={income.otherIncomeSource}
                        onChange={(e) => setIncome({ ...income, otherIncomeSource: e.target.value })}
                        placeholder="Other Income Source"
                        className="h-[42px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'summary' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-center">Review Your Application</h3>
                    <Separator className="mb-6" />
                    <div className="space-y-6">
                      {/* About you */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">About you</h3>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="firstName">First Name</Label>
                              <Input 
                                id="firstName" 
                                value={contact.firstName}
                                disabled
                                className="opacity-50"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input 
                                id="lastName" 
                                value={contact.lastName}
                                disabled
                                className="opacity-50"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="email">Email</Label>
                              <div className="relative">
                                <Input 
                                  id="email" 
                                  type="email"
                                  className="peer ps-9 opacity-50"
                                  value={emails[0]}
                                  disabled
                                />
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
                                  <Mail size={16} strokeWidth={2} aria-hidden="true" />
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <RPNInput.default
                                className="flex rounded-lg shadow-sm shadow-black/5 opacity-50"
                                international
                                flagComponent={FlagComponent}
                                countrySelectComponent={CountrySelect}
                                inputComponent={PhoneInput}
                                id="phone"
                                value={phones[0]}
                                disabled
                                onChange={() => {}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Additional Information */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="dateOfBirth">Date of Birth</Label>
                              <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal opacity-50"
                                disabled
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {contact.dateOfBirth ? format(contact.dateOfBirth, "PPP") : "Not specified"}
                              </Button>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="gender">Gender</Label>
                              <Input 
                                id="gender"
                                value={contact.gender ? contact.gender.charAt(0).toUpperCase() + contact.gender.slice(1) : "Not specified"}
                                disabled
                                className="opacity-50"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="maritalStatus">Marital Status</Label>
                              <Input 
                                id="maritalStatus"
                                value={contact.maritalStatus ? contact.maritalStatus.charAt(0).toUpperCase() + contact.maritalStatus.slice(1) : "Not specified"}
                                disabled
                                className="opacity-50"
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="aboutYou">About You</Label>
                            <textarea
                              id="aboutYou"
                              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 opacity-50"
                              value={contact.aboutYou || "Not provided"}
                              disabled
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Current Residential History */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Current Residential History</h3>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-sm font-medium mb-4">Current Address</h4>
                            <div className="grid gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="street">Street Address</Label>
                                <Input 
                                  id="street"
                                  value={residence.address.street}
                                  disabled
                                  className="opacity-50"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="city">City</Label>
                                  <Input 
                                    id="city"
                                    value={residence.address.city}
                                    disabled
                                    className="opacity-50"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="province">Province</Label>
                                  <Input 
                                    id="province"
                                    value={provinces.find(p => p.value === residence.address.province)?.label || "Not specified"}
                                    disabled
                                    className="opacity-50"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="postalCode">Postal Code</Label>
                                  <Input 
                                    id="postalCode"
                                    value={residence.address.postalCode}
                                    disabled
                                    className="opacity-50"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="moveInDate">Move-in Date</Label>
                              <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal opacity-50"
                                disabled
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {residence.moveInDate ? format(new Date(residence.moveInDate), "PPP") : "Not specified"}
                              </Button>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="monthlyRent">Monthly Rent</Label>
                              <div className="relative">
                                <Input 
                                  id="monthlyRent"
                                  className="peer pe-12 ps-6 opacity-50"
                                  value={residence.monthlyRent ? `$${residence.monthlyRent}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-sm text-muted-foreground">
                                  CAD
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="reasonForLeaving">Reason for Leaving</Label>
                            <Input 
                              id="reasonForLeaving"
                              value={residence.reasonForLeaving || "Not specified"}
                              disabled
                              className="opacity-50"
                            />
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-4">Current Landlord Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="landlordName">Landlord Name</Label>
                                <Input 
                                  id="landlordName"
                                  value={residence.landlordName || "Not specified"}
                                  disabled
                                  className="opacity-50"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="landlordPhone">Landlord Phone</Label>
                                <Input 
                                  id="landlordPhone"
                                  value={residence.landlordPhone || "Not specified"}
                                  disabled
                                  className="opacity-50"
                                />
                              </div>
                            </div>
                            <div className="grid gap-2 mt-4">
                              <Label htmlFor="landlordEmail">Landlord Email</Label>
                              <Input 
                                id="landlordEmail"
                                value={residence.landlordEmail || "Not specified"}
                                disabled
                                className="opacity-50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Current Employment */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Current Employment</h3>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="employerName">Employer Name</Label>
                              <Input 
                                id="employerName"
                                value={employment.employerName || "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="jobTitle">Job Title</Label>
                              <Input 
                                id="jobTitle"
                                value={employment.jobTitle || "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="monthlyIncome">Monthly Income</Label>
                              <div className="relative">
                                <Input 
                                  id="monthlyIncome"
                                  className="peer pe-12 ps-6 opacity-50"
                                  value={employment.monthlyIncome ? `$${employment.monthlyIncome}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-sm text-muted-foreground">
                                  CAD
                                </span>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="employmentType">Employment Type</Label>
                              <Input 
                                id="employmentType"
                                value={employment.employmentType ? 
                                  employment.employmentType.split('-').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ') : 
                                  "Not specified"}
                                disabled
                                className="opacity-50"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="startDate">Start Date</Label>
                              <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal opacity-50"
                                disabled
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {employment.startDate ? format(new Date(employment.startDate), "PPP") : "Not specified"}
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="supervisorName">Supervisor Name</Label>
                              <Input 
                                id="supervisorName"
                                value={employment.supervisorName || "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="supervisorPhone">Supervisor Phone</Label>
                              <Input 
                                id="supervisorPhone"
                                value={employment.supervisorPhone || "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-4">Employer Address</h4>
                            <div className="grid gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="employmentStreet">Street Address</Label>
                                <Input 
                                  id="employmentStreet"
                                  value={employment.address.street || "Not specified"}
                                  disabled
                                  className="opacity-50 h-[42px]"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="employmentCity">City</Label>
                                  <Input 
                                    id="employmentCity"
                                    value={employment.address.city || "Not specified"}
                                    disabled
                                    className="opacity-50 h-[42px]"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="employmentProvince">Province</Label>
                                  <Input 
                                    id="employmentProvince"
                                    value={provinces.find(p => p.value === employment.address.province)?.label || "Not specified"}
                                    disabled
                                    className="opacity-50 h-[42px]"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="employmentPostalCode">Postal Code</Label>
                                  <Input 
                                    id="employmentPostalCode"
                                    value={employment.address.postalCode || "Not specified"}
                                    disabled
                                    className="opacity-50 h-[42px]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Income Information */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Income Information</h3>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="employmentIncome">Employment Income</Label>
                              <div className="relative">
                                <Input 
                                  id="employmentIncome"
                                  className="peer ps-6 opacity-50 h-[42px]"
                                  value={income.employmentIncome ? `$${income.employmentIncome}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="governmentAssistance">Government Assistance</Label>
                              <div className="relative">
                                <Input 
                                  id="governmentAssistance"
                                  className="peer ps-6 opacity-50 h-[42px]"
                                  value={income.governmentAssistance ? `$${income.governmentAssistance}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="investments">Investment Income</Label>
                              <div className="relative">
                                <Input 
                                  id="investments"
                                  className="peer ps-6 opacity-50 h-[42px]"
                                  value={income.investments ? `$${income.investments}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="retirement">Retirement Income</Label>
                              <div className="relative">
                                <Input 
                                  id="retirement"
                                  className="peer ps-6 opacity-50 h-[42px]"
                                  value={income.retirement ? `$${income.retirement}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="childSupport">Child Support</Label>
                              <div className="relative">
                                <Input 
                                  id="childSupport"
                                  className="peer ps-6 opacity-50 h-[42px]"
                                  value={income.childSupport ? `$${income.childSupport}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="alimony">Alimony</Label>
                              <div className="relative">
                                <Input 
                                  id="alimony"
                                  className="peer ps-6 opacity-50 h-[42px]"
                                  value={income.alimony ? `$${income.alimony}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="otherIncome">Other Income</Label>
                              <div className="relative">
                                <Input 
                                  id="otherIncome"
                                  className="peer ps-6 opacity-50 h-[42px]"
                                  value={income.otherIncome ? `$${income.otherIncome}` : "Not specified"}
                                  disabled
                                />
                                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="otherIncomeSource">Other Income Source</Label>
                              <Input 
                                id="otherIncomeSource"
                                value={income.otherIncomeSource || "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Lead Status Information */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Lead Information</h3>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>Lead Status</Label>
                              <Input 
                                value={contact.leadStatus ? contact.leadStatus.charAt(0).toUpperCase() + contact.leadStatus.slice(1) : "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Lead Source</Label>
                              <Input 
                                value={contact.leadSource || "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Lead Medium</Label>
                              <Input 
                                value={contact.leadMedium ? contact.leadMedium.replace('_', ' ').charAt(0).toUpperCase() + contact.leadMedium.slice(1) : "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Assignee</Label>
                              <Input 
                                value={contact.assigneeId ? 
                                  companyMembers.find(member => member.id === contact.assigneeId) 
                                    ? `${companyMembers.find(member => member.id === contact.assigneeId)?.first_name} ${companyMembers.find(member => member.id === contact.assigneeId)?.last_name}`
                                    : "Not specified"
                                  : "Not specified"}
                                disabled
                                className="opacity-50 h-[42px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Selected Properties */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Selected Property</h3>
                        {selectedUnitId ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {listings
                              .filter(listing => listing.units.unit_id === selectedUnitId)
                              .map(listing => (
                                <div key={listing.listingid} className="border rounded-lg p-4 space-y-2">
                                  <div className="relative w-full h-36">
                                    {listing.units && listing.units.unit_images && listing.units.unit_images.length > 0 ? (
                                      <Image
                                        src={listing.units.unit_images[0]?.fileUrl || listing.units.unit_images[0]?.image_url || '/placeholder-property.jpg'}
                                        alt={`Unit ${listing.units.unit_name}`}
                                        fill
                                        className="object-cover rounded-md"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
                                        <span className="text-gray-400">No image</span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{listing.title || `${listing.units.properties.name} - Unit ${listing.units.unit_name}`}</h4>
                                    <p className="text-sm text-gray-500">{listing.units.properties.address_line_1}</p>
                                    <p className="text-sm text-gray-500">
                                      {listing.units.properties.city}, {listing.units.properties.state} {listing.units.properties.zip}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center p-6 border border-dashed rounded-lg">
                            <p className="text-gray-500">No property selected</p>
                          </div>
                        )}
                      </div>

                      <Separator />

                    </div>

                    <div className="mt-12"></div>

                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex justify-end gap-4 mt-auto">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md text-center w-32"
            onClick={handleBack}
          >
            {step === 'intro' ? 'Exit' : 'Back'}
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-center text-white w-32 ${
              ((step === 'personal' && contact.firstName && contact.lastName && contact.email) || 
               step !== 'personal')
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={step === 'summary' ? handleSubmit : handleNext}
            disabled={
              step === 'personal' && Boolean(!contact.firstName || !contact.lastName || !contact.email || emailError)
            }
          >
            {step === 'summary' ? 'Submit' : step === 'properties' && !selectedUnitId ? 'Skip' : 'Next'}
          </button>
        </div>

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

        {/* Replace the AlertDialog with Dialog */}
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
                      alert('Failed to add lead source');
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
    </div>
  );
}
