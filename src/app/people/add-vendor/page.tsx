'use client';

import { useState, forwardRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Check, ChevronDown, Plus, Building2, Building, Mailbox, Banknote, Ban } from 'lucide-react';
import { cn } from "@/lib/utils";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Textarea } from "@/components/ui/textarea";
import { useCharacterLimit } from "@/hooks/use-character-limit";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CustomDateRangePicker } from "@/components/ui/date-range-picker";
import Image from 'next/image';
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: { label: string; value: RPNInput.Country | undefined }[];
};

interface VendorForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  categories: string[];
  classifications: string[];
  aboutYou: string;
  // Address fields
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  // Secondary address fields
  hasSecondaryAddress: boolean;
  secondaryStreet: string;
  secondaryCity: string;
  secondaryProvince: string;
  secondaryPostalCode: string;
  secondaryCountry: string;
  // Insurance fields
  insuranceProvider: string;
  policyNumber: string;
  coverage: string;
  effectiveDate: string;
  expirationDate: string;
  // Properties access
  propertiesAccess: 'all' | 'specific' | null;
  sendWelcomeEmail: string | null;
  selectedProperties: string[];
  // Payment fields
  enablePayments: boolean;
  paymentMethod: 'email' | 'mail_check' | undefined;
  billingEmail: string;
  portalEmail?: string;
}

interface CompanySettings {
  vendor_categories: {
    custom: string[];
    default: string[];
  };
  vendor_classifications: {
    custom: string[];
    default: string[];
  };
}

interface Property {
  id: string;
  name: string;
  address?: string;
}

// Phone input components
const PhoneInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        className={cn("h-[42px] -ms-px rounded-s-none shadow-none focus-visible:z-10 bg-muted", className)}
        ref={ref}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as RPNInput.Country);
  };

  return (
    <div className="relative inline-flex items-center self-stretch h-[42px] rounded-s-lg border border-input bg-background px-3 text-muted-foreground transition-shadow focus-within:z-10 focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 hover:bg-accent hover:text-foreground has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
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

export default function AddVendorPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'personal' | 'contact' | 'address' | 'services' | 'insurance' | 'properties' | 'payment' | 'summary'>('intro');
  const [vendor, setVendor] = useState<VendorForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    categories: [],
    classifications: [],
    aboutYou: '',
    // Address fields
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    // Secondary address fields
    hasSecondaryAddress: false,
    secondaryStreet: '',
    secondaryCity: '',
    secondaryProvince: '',
    secondaryPostalCode: '',
    secondaryCountry: '',
    // Insurance fields
    insuranceProvider: '',
    policyNumber: '',
    coverage: '',
    effectiveDate: '',
    expirationDate: '',
    // Properties access
    propertiesAccess: null,
    sendWelcomeEmail: null,
    selectedProperties: [],
    // Payment fields
    enablePayments: false,
    paymentMethod: undefined,
    billingEmail: '',
    portalEmail: ''
  });
  const [emailError, setEmailError] = useState<string>('');
  const [insurancePeriodError, setInsurancePeriodError] = useState<string>('');
  const maxLength = 1000;
  const {
    value: notesValue,
    characterCount,
    handleChange: handleNotesChange,
    maxLength: limit,
  } = useCharacterLimit({ maxLength });
  const [categoryOpen, setCategoryOpen] = useState<boolean>(false);
  const [classificationOpen, setClassificationOpen] = useState<boolean>(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    vendor_categories: { custom: [], default: [] },
    vendor_classifications: { custom: [], default: [] }
  });
  const [newCategoryDialog, setNewCategoryDialog] = useState<boolean>(false);
  const [newClassificationDialog, setNewClassificationDialog] = useState<boolean>(false);
  const [newCategoryValue, setNewCategoryValue] = useState<string>('');
  const [newClassificationValue, setNewClassificationValue] = useState<string>('');
  const [emailPreferenceError, setEmailPreferenceError] = useState<string>('');
  const [showInsuranceSkipDialog, setShowInsuranceSkipDialog] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [billingEmailError, setBillingEmailError] = useState<string>('');

  // Add useEffect to fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/company/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch company settings');
        }
        const data = await response.json();
        setCompanySettings({
          vendor_categories: data.vendor_categories,
          vendor_classifications: data.vendor_classifications
        });
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    };

    fetchCompanySettings();
  }, []);

  // Add useEffect to fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/property', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]); // Set empty array on error
      }
    };

    if (vendor.propertiesAccess === 'specific') {
      fetchProperties();
    }
  }, [vendor.propertiesAccess]);

  // Transform settings into options for dropdowns
  const vendorCategories = [
    ...companySettings.vendor_categories.default.map(cat => ({
      value: cat.toLowerCase(),
      label: cat,
      isDefault: true
    })),
    ...companySettings.vendor_categories.custom.map(cat => ({
      value: cat.toLowerCase(),
      label: cat,
      isDefault: false
    }))
  ];

  const vendorClassifications = [
    ...companySettings.vendor_classifications.default.map(cls => ({
      value: cls.toLowerCase(),
      label: cls.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      isDefault: true
    })),
    ...companySettings.vendor_classifications.custom.map(cls => ({
      value: cls.toLowerCase(),
      label: cls,
      isDefault: false
    }))
  ];

  const handleNext = () => {
    if (step === 'insurance') {
      const hasAnyInsuranceInfo = vendor.insuranceProvider.trim() !== '' || 
                                 vendor.policyNumber.trim() !== '' || 
                                 vendor.coverage.trim() !== '';

      const hasAllInsuranceInfo = vendor.insuranceProvider.trim() !== '' && 
                                 vendor.policyNumber.trim() !== '' && 
                                 vendor.coverage.trim() !== '';

      const hasDateRange = vendor.effectiveDate && vendor.expirationDate;

      // If they have filled out any insurance info but not all required fields
      if ((hasAnyInsuranceInfo && !hasAllInsuranceInfo) || (hasAllInsuranceInfo && !hasDateRange)) {
        setInsurancePeriodError('Please complete all insurance fields or remove all insurance information');
        return;
      }

      // If they haven't filled out any insurance info at all
      if (!hasAnyInsuranceInfo && !hasDateRange) {
        setShowInsuranceSkipDialog(true);
        return;
      }
    }

    switch (step) {
      case 'intro':
        setStep('personal');
        break;
      case 'personal':
        setStep('contact');
        break;
      case 'contact':
        setStep('address');
        break;
      case 'address':
        setStep('services');
        break;
      case 'services':
        setStep('insurance');
        break;
      case 'insurance':
        setStep('properties');
        break;
      case 'properties':
        setStep('payment');
        break;
      case 'payment':
        setStep('summary');
        break;
      case 'summary':
        setStep('properties');
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'personal':
        setStep('intro');
        break;
      case 'contact':
        setStep('personal');
        break;
      case 'address':
        setStep('contact');
        break;
      case 'services':
        setStep('address');
        break;
      case 'insurance':
        setStep('services');
        break;
      case 'properties':
        setStep('insurance');
        break;
      case 'payment':
        setStep('properties');
        break;
      case 'summary':
        setStep('payment');
        break;
      case 'intro':
        router.push('/people');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!vendor.sendWelcomeEmail) {
      setEmailPreferenceError('Please select an email preference before proceeding');
      return;
    }
    setEmailPreferenceError('');

    try {
      const response = await fetch('/api/people/vendor/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: vendor.firstName,
          last_name: vendor.lastName,
          middle_name: vendor.middleName,
          company: vendor.company,
          email: vendor.email,
          phone: vendor.phone,
          about_you: vendor.aboutYou,
          services: {
            categories: vendor.categories,
            classifications: vendor.classifications
          },
          address_info: {
            primary: {
              street: vendor.street,
              city: vendor.city,
              province: vendor.province,
              postalCode: vendor.postalCode,
              country: vendor.country
            },
            secondary: vendor.hasSecondaryAddress ? {
              street: vendor.secondaryStreet,
              city: vendor.secondaryCity,
              province: vendor.secondaryProvince,
              postalCode: vendor.secondaryPostalCode,
              country: vendor.secondaryCountry
            } : null
          },
          properties_access: {
            type: vendor.propertiesAccess || 'all',
            property_ids: vendor.propertiesAccess === 'specific' ? vendor.selectedProperties : []
          },
          payments_settings: {
            enabled: vendor.enablePayments,
            method: vendor.enablePayments ? vendor.paymentMethod : undefined,
            billing_email: vendor.enablePayments && vendor.paymentMethod === 'email' ? vendor.billingEmail : undefined
          },
          insurance: {
            provider: vendor.insuranceProvider,
            policy_number: vendor.policyNumber,
            coverage: vendor.coverage,
            effective_date: vendor.effectiveDate,
            expiration_date: vendor.expirationDate
          },
          send_welcome_email: vendor.sendWelcomeEmail === "send"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('A vendor with this email already exists');
          return;
        }
        throw new Error(data.error || 'Failed to create vendor');
      }

      toast.success(`${vendor.firstName} ${vendor.lastName} has been added as a vendor`, {
        description: 'You will be redirected to the people page'
      });
      
      setTimeout(() => {
        router.push('/people');
      }, 2000);

    } catch (error) {
      console.error('Error creating vendor:', error);
      toast.error('Failed to create vendor. Please try again.');
    }
  };

  const handleEmailChange = (email: string) => {
    setVendor({...vendor, email});
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleAddNewCategory = async () => {
    try {
      const response = await fetch('/api/company/settings/vendor-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: newCategoryValue
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add new category');
      }

      const data = await response.json();
      setCompanySettings(prev => ({
        ...prev,
        vendor_categories: data.vendor_categories
      }));
      setNewCategoryValue('');
      setNewCategoryDialog(false);
      setVendor(prev => ({
        ...prev,
        categories: [...prev.categories, newCategoryValue.toLowerCase()]
      }));
    } catch (error) {
      console.error('Error adding new category:', error);
    }
  };

  const handleAddNewClassification = async () => {
    try {
      const response = await fetch('/api/company/settings/vendor-classification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classification: newClassificationValue
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add new classification');
      }

      const data = await response.json();
      setCompanySettings(prev => ({
        ...prev,
        vendor_classifications: data.vendor_classifications
      }));
      setNewClassificationValue('');
      setNewClassificationDialog(false);
      setVendor(prev => ({
        ...prev,
        classifications: [...prev.classifications, newClassificationValue.toLowerCase()]
      }));
    } catch (error) {
      console.error('Error adding new classification:', error);
    }
  };

  const handleCategorySelect = (currentValue: string) => {
    setVendor(prev => {
      const categories = prev.categories.includes(currentValue)
        ? prev.categories.filter(cat => cat !== currentValue)
        : [...prev.categories, currentValue];
      return { ...prev, categories };
    });
  };

  const handleClassificationSelect = (currentValue: string) => {
    setVendor(prev => {
      const classifications = prev.classifications.includes(currentValue)
        ? prev.classifications.filter(cls => cls !== currentValue)
        : [...prev.classifications, currentValue];
      return { ...prev, classifications };
    });
  };

  const renderPersonalForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
        <Input 
          id="firstName" 
          placeholder="Enter first name" 
          value={vendor.firstName}
          onChange={(e) => setVendor({...vendor, firstName: e.target.value})}
          className="h-[42px] bg-background"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="middleName">Middle Name</Label>
        <Input 
          id="middleName" 
          placeholder="Enter middle name"
          value={vendor.middleName}
          onChange={(e) => setVendor({...vendor, middleName: e.target.value})}
          className="h-[42px] bg-background"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
        <Input 
          id="lastName" 
          placeholder="Enter last name"
          value={vendor.lastName}
          onChange={(e) => setVendor({...vendor, lastName: e.target.value})}
          className="h-[42px] bg-background"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">Company <span className="text-red-500">*</span></Label>
        <Input 
          id="company" 
          placeholder="Enter company name"
          value={vendor.company}
          onChange={(e) => setVendor({...vendor, company: e.target.value})}
          className="h-[42px] bg-background"
          required
        />
      </div>
      <div className="md:col-span-3 grid gap-2">
        <Label htmlFor="aboutYou">Notes</Label>
        <Textarea
          id="aboutYou"
          value={notesValue}
          maxLength={maxLength}
          onChange={(e) => {
            handleNotesChange(e);
            setVendor({...vendor, aboutYou: e.target.value});
          }}
          aria-describedby="characters-left-textarea"
          placeholder="Add any notes about this vendor..."
          className="min-h-[150px] bg-background"
        />
        <p
          id="characters-left-textarea"
          className="text-right text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <span className="tabular-nums">{limit - characterCount}</span> characters left
        </p>
      </div>
    </div>
  );

  const renderContactForm = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="portalEmail">Portal Email <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input 
              id="portalEmail" 
              type="email"
              className={cn(
                "h-[42px] peer ps-9 bg-background",
                { "border-red-500 focus-visible:ring-red-500": emailError.length > 0 }
              )}
              placeholder="Enter portal email address"
              value={vendor.portalEmail || ''}
              onChange={(e) => {
                const newEmail = e.target.value;
                setVendor(prev => ({
                  ...prev,
                  portalEmail: newEmail,
                  // If they're synced, update contact email too
                  email: prev.email === prev.portalEmail ? newEmail : prev.email
                }));
              }}
              required
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <Mail size={16} strokeWidth={2} aria-hidden="true" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            This email will be used for portal access and notifications.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox 
            id="sameAsPortal"
            checked={vendor.email === vendor.portalEmail}
            onCheckedChange={(checked) => {
              if (checked) {
                handleEmailChange(vendor.portalEmail || '');
              }
            }}
          />
          <Label htmlFor="sameAsPortal" className="text-sm text-muted-foreground">
            Use portal email as contact email
          </Label>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contactEmail">Contact Email <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input 
              id="contactEmail" 
              type="email"
              className={cn(
                "h-[42px] peer ps-9 bg-background",
                { "border-red-500 focus-visible:ring-red-500": emailError.length > 0 }
              )}
              placeholder="Enter contact email address"
              value={vendor.email}
              onChange={(e) => handleEmailChange(e.target.value)}
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
            value={vendor.phone}
            onChange={(value) => setVendor({...vendor, phone: value || ''})}
            placeholder="+0 012 345 6789"
          />
        </div>
      </div>
    </div>
  );

  const renderServicesForm = () => (
    <div className="space-y-8">
      <div className="space-y-6">        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor Categories Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="category">Vendor Categories <span className="text-red-500">*</span></Label>
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="category"
                  variant="outline"
                  role="combobox"
                  aria-expanded={categoryOpen}
                  className="w-full h-[42px] justify-between px-3 font-normal outline-offset-0 hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !vendor.categories.length && "text-muted-foreground")}>
                    {vendor.categories.length
                      ? `${vendor.categories.length} categories selected`
                      : "Select categories"}
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
                  <CommandInput placeholder="Find category" />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup heading="Default Categories">
                      {vendorCategories
                        .filter(cat => cat.isDefault)
                        .map((category) => (
                          <CommandItem
                            key={category.value}
                            value={category.value}
                            onSelect={handleCategorySelect}
                          >
                            {category.label}
                            {vendor.categories.includes(category.value) && (
                              <Check size={16} strokeWidth={2} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                    {companySettings.vendor_categories.custom.length > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup heading="Custom Categories">
                          {vendorCategories
                            .filter(cat => !cat.isDefault)
                            .map((category) => (
                              <CommandItem
                                key={category.value}
                                value={category.value}
                                onSelect={handleCategorySelect}
                              >
                                {category.label}
                                {vendor.categories.includes(category.value) && (
                                  <Check size={16} strokeWidth={2} className="ml-auto" />
                                )}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </>
                    )}
                    <CommandSeparator />
                    <CommandGroup>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start font-normal"
                        onClick={() => {
                          setCategoryOpen(false);
                          setNewCategoryDialog(true);
                        }}
                      >
                        <Plus
                          size={16}
                          strokeWidth={2}
                          className="-ms-2 me-2 opacity-60"
                          aria-hidden="true"
                        />
                        New category
                      </Button>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Vendor Classifications Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="classification">Vendor Classifications <span className="text-red-500">*</span></Label>
            <Popover open={classificationOpen} onOpenChange={setClassificationOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="classification"
                  variant="outline"
                  role="combobox"
                  aria-expanded={classificationOpen}
                  className="w-full h-[42px] justify-between px-3 font-normal outline-offset-0 hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !vendor.classifications.length && "text-muted-foreground")}>
                    {vendor.classifications.length
                      ? `${vendor.classifications.length} classifications selected`
                      : "Select classifications"}
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
                  <CommandInput placeholder="Find classification" className="h-[42px]" />
                  <CommandList>
                    <CommandEmpty>No classification found.</CommandEmpty>
                    <CommandGroup heading="Default Classifications">
                      {vendorClassifications
                        .filter(cls => cls.isDefault)
                        .map((classification) => (
                          <CommandItem
                            key={classification.value}
                            value={classification.value}
                            onSelect={handleClassificationSelect}
                          >
                            {classification.label}
                            {vendor.classifications.includes(classification.value) && (
                              <Check size={16} strokeWidth={2} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                    {companySettings.vendor_classifications.custom.length > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup heading="Custom Classifications">
                          {vendorClassifications
                            .filter(cls => !cls.isDefault)
                            .map((classification) => (
                              <CommandItem
                                key={classification.value}
                                value={classification.value}
                                onSelect={handleClassificationSelect}
                              >
                                {classification.label}
                                {vendor.classifications.includes(classification.value) && (
                                  <Check size={16} strokeWidth={2} className="ml-auto" />
                                )}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </>
                    )}
                    <CommandSeparator />
                    <CommandGroup>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start font-normal"
                        onClick={() => {
                          setClassificationOpen(false);
                          setNewClassificationDialog(true);
                        }}
                      >
                        <Plus
                          size={16}
                          strokeWidth={2}
                          className="-ms-2 me-2 opacity-60"
                          aria-hidden="true"
                        />
                        New classification
                      </Button>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* New Category Dialog */}
      <Dialog open={newCategoryDialog} onOpenChange={setNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Enter a new vendor category to add to your custom categories.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newCategory">Category Name</Label>
              <Input
                id="newCategory"
                placeholder="Enter category name"
                value={newCategoryValue}
                onChange={(e) => setNewCategoryValue(e.target.value)}
                className="h-[42px] bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewCategory} disabled={!newCategoryValue}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Classification Dialog */}
      <Dialog open={newClassificationDialog} onOpenChange={setNewClassificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Classification</DialogTitle>
            <DialogDescription>
              Enter a new vendor classification to add to your custom classifications.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newClassification">Classification Name</Label>
              <Input
                id="newClassification"
                placeholder="Enter classification name"
                value={newClassificationValue}
                onChange={(e) => setNewClassificationValue(e.target.value)}
                className="h-[42px] bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClassificationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewClassification} disabled={!newClassificationValue}>
              Add Classification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderAddressForm = () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-lg font-medium mb-4">Primary Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="street">Street Address</Label>
            <Input 
              id="street"
              placeholder="Enter street address"
              value={vendor.street}
              onChange={(e) => setVendor({...vendor, street: e.target.value})}
              className="h-[42px] bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city"
              placeholder="Enter city"
              value={vendor.city}
              onChange={(e) => setVendor({...vendor, city: e.target.value})}
              className="h-[42px] bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="province">Province/State</Label>
            <Input 
              id="province"
              placeholder="Enter province or state"
              value={vendor.province}
              onChange={(e) => setVendor({...vendor, province: e.target.value})}
              className="h-[42px] bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postalCode">Postal Code/ZIP</Label>
            <Input 
              id="postalCode"
              placeholder="Enter postal code or ZIP"
              value={vendor.postalCode}
              onChange={(e) => setVendor({...vendor, postalCode: e.target.value})}
              className="h-[42px] bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input 
              id="country"
              placeholder="Enter country"
              value={vendor.country}
              onChange={(e) => setVendor({...vendor, country: e.target.value})}
              className="h-[42px] bg-background"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <input
          type="checkbox"
          id="hasSecondaryAddress"
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          checked={vendor.hasSecondaryAddress}
          onChange={(e) => setVendor({...vendor, hasSecondaryAddress: e.target.checked})}
        />
        <Label htmlFor="hasSecondaryAddress" className="text-sm text-gray-600">
          Add Secondary Address
        </Label>
      </div>

      {vendor.hasSecondaryAddress && (
        <div>
          <h4 className="text-lg font-medium mb-4">Secondary Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid gap-2">
              <Label htmlFor="secondaryStreet">Street Address</Label>
              <Input 
                id="secondaryStreet"
                placeholder="Enter street address"
                value={vendor.secondaryStreet}
                onChange={(e) => setVendor({...vendor, secondaryStreet: e.target.value})}
                className="h-[42px] bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryCity">City</Label>
              <Input 
                id="secondaryCity"
                placeholder="Enter city"
                value={vendor.secondaryCity}
                onChange={(e) => setVendor({...vendor, secondaryCity: e.target.value})}
                className="h-[42px] bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryProvince">Province/State</Label>
              <Input 
                id="secondaryProvince"
                placeholder="Enter province or state"
                value={vendor.secondaryProvince}
                onChange={(e) => setVendor({...vendor, secondaryProvince: e.target.value})}
                className="h-[42px] bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryPostalCode">Postal Code/ZIP</Label>
              <Input 
                id="secondaryPostalCode"
                placeholder="Enter postal code or ZIP"
                value={vendor.secondaryPostalCode}
                onChange={(e) => setVendor({...vendor, secondaryPostalCode: e.target.value})}
                className="h-[42px] bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryCountry">Country</Label>
              <Input 
                id="secondaryCountry"
                placeholder="Enter country"
                value={vendor.secondaryCountry}
                onChange={(e) => setVendor({...vendor, secondaryCountry: e.target.value})}
                className="h-[42px] bg-background"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInsuranceForm = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="insuranceProvider">Insurance Provider</Label>
            <Input 
              id="insuranceProvider"
              placeholder="Enter insurance provider"
              value={vendor.insuranceProvider}
              onChange={(e) => {
                setVendor({...vendor, insuranceProvider: e.target.value});
                if (e.target.value.trim() === '') {
                  setVendor(prev => ({
                    ...prev,
                    insuranceProvider: '',
                    policyNumber: '',
                    coverage: '',
                    effectiveDate: '',
                    expirationDate: ''
                  }));
                }
              }}
              className="h-[42px] bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policyNumber">Policy Number</Label>
            <Input 
              id="policyNumber"
              placeholder="Enter policy number"
              value={vendor.policyNumber}
              onChange={(e) => setVendor({...vendor, policyNumber: e.target.value})}
              className="h-[42px] bg-background"
              disabled={!vendor.insuranceProvider}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coverage">Coverage</Label>
            <div className="relative">
              <Input 
                id="coverage"
                type="number"
                placeholder="0.00"
                value={vendor.coverage}
                onChange={(e) => setVendor({...vendor, coverage: e.target.value})}
                className="h-[42px] peer ps-6 bg-background"
                min="0"
                disabled={!vendor.insuranceProvider}
              />
              <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground peer-disabled:opacity-50">
                $
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <CustomDateRangePicker
              label="Insurance Period"
              startValue={vendor.effectiveDate}
              endValue={vendor.expirationDate}
              onStartChange={(value) => {
                setVendor(prev => ({
                  ...prev,
                  effectiveDate: value,
                  expirationDate: prev.expirationDate || value
                }));
                setInsurancePeriodError('');
              }}
              onEndChange={(value) => {
                setVendor(prev => ({
                  ...prev,
                  expirationDate: value
                }));
                setInsurancePeriodError('');
              }}
            />
            {insurancePeriodError && (
              <div className="text-sm text-red-500">{insurancePeriodError}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertiesForm = () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-center">Properties Access</h3>
        <RadioGroup 
          className="gap-4 w-full" 
          value={vendor.propertiesAccess || undefined}
          onValueChange={(value: 'all' | 'specific') => {
            setVendor(prev => ({
              ...prev,
              propertiesAccess: value,
              selectedProperties: []
            }));
          }}
        >
          {/* Radio card #1 */}
          <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
            <RadioGroupItem
              value="all"
              id="properties-all"
              aria-describedby="properties-all-description"
              className="order-1 after:absolute after:inset-0"
            />
            <div className="flex grow items-center gap-3">
              <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                <div className="flex items-center justify-center w-8 h-8">
                  <Building2 className="size-5 text-[#16B364]" strokeWidth={2} />
                </div>
              </div>
              <div className="grid grow gap-2">
                <Label htmlFor="properties-all">This vendor can work on all my properties</Label>
                <div id="properties-all-description" className="text-xs text-muted-foreground">
                  The vendor will have access to work on all properties in your portfolio.
                </div>
              </div>
            </div>
          </div>

          {/* Radio card #2 */}
          <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
            <RadioGroupItem
              value="specific"
              id="properties-specific"
              aria-describedby="properties-specific-description"
              className="order-1 after:absolute after:inset-0"
            />
            <div className="flex grow items-center gap-3">
              <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                <div className="flex items-center justify-center w-8 h-8">
                  <Building className="size-5 text-[#16B364]" strokeWidth={2} />
                </div>
              </div>
              <div className="grid grow gap-2">
                <Label htmlFor="properties-specific">This vendor can work only on specific properties</Label>
                <div id="properties-specific-description" className="text-xs text-muted-foreground">
                  You can select which properties this vendor is allowed to work on.
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Property Selector */}
        {vendor.propertiesAccess === 'specific' && (
          <div className="w-full mt-6 space-y-2">
            <Label htmlFor="property-select">Select Properties</Label>
            <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="property-select"
                  variant="outline"
                  role="combobox"
                  aria-expanded={propertiesOpen}
                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !vendor.selectedProperties.length && "text-muted-foreground")}>
                    {vendor.selectedProperties.length
                      ? `${vendor.selectedProperties.length} properties selected`
                      : "Select properties"}
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
                  <CommandInput placeholder="Search properties..." />
                  <CommandList>
                    <CommandEmpty>No properties found.</CommandEmpty>
                    <CommandGroup>
                      {properties.map((property) => (
                        <CommandItem
                          key={property.id}
                          value={property.id}
                          onSelect={(currentValue) => {
                            setVendor(prev => {
                              const selectedProperties = prev.selectedProperties.includes(currentValue)
                                ? prev.selectedProperties.filter(id => id !== currentValue)
                                : [...prev.selectedProperties, currentValue];
                              return { ...prev, selectedProperties };
                            });
                          }}
                        >
                          <div className="flex flex-col">
                            <span>{property.name}</span>
                            {property.address && (
                              <span className="text-xs text-muted-foreground">{property.address}</span>
                            )}
                          </div>
                          {vendor.selectedProperties.includes(property.id) && (
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
        )}
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="flex flex-col h-full">
      <div className="flex-grow space-y-6">
        <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-center">Payment Settings</h3>
          <RadioGroup 
            className="gap-4 w-full" 
            value={vendor.enablePayments ? 'enabled' : 'disabled'}
            onValueChange={(value) => {
              setVendor({
                ...vendor,
                enablePayments: value === 'enabled',
                paymentMethod: value === 'enabled' ? vendor.paymentMethod : undefined,
                billingEmail: value === 'enabled' ? vendor.billingEmail : ''
              });
            }}
          >
            {/* Radio card #1 */}
            <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
              <RadioGroupItem
                value="enabled"
                id="enable-payments"
                aria-describedby="enable-payments-description"
                className="order-1 after:absolute after:inset-0"
              />
              <div className="flex grow items-center gap-3">
                <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                  <div className="flex items-center justify-center w-8 h-8">
                    <Banknote className="size-5 text-[#16B364]" strokeWidth={2} />
                  </div>
                </div>
                <div className="grid grow gap-2">
                  <Label htmlFor="enable-payments">Enable send payments for this vendor</Label>
                  <div id="enable-payments-description" className="text-xs text-muted-foreground">
                    Allow sending payments to this vendor through the system.
                  </div>
                </div>
              </div>
            </div>

            {/* Radio card #2 */}
            <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
              <RadioGroupItem
                value="disabled"
                id="disable-payments"
                aria-describedby="disable-payments-description"
                className="order-1 after:absolute after:inset-0"
              />
              <div className="flex grow items-center gap-3">
                <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                  <div className="flex items-center justify-center w-8 h-8">
                    <Ban className="size-5 text-[#16B364]" strokeWidth={2} />
                  </div>
                </div>
                <div className="grid grow gap-2">
                  <Label htmlFor="disable-payments">Do not send payments</Label>
                  <div id="disable-payments-description" className="text-xs text-muted-foreground">
                    Payments will not be sent through the system
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>

          {vendor.enablePayments && (
            <div className="mt-8 space-y-8">
              <div className="h-px bg-border" />
              <div>
                <h4 className="text-lg font-medium mb-4 text-center">Payment Sending Method</h4>
                <RadioGroup 
                  className="flex justify-center gap-4 max-w-3xl mx-auto" 
                  value={vendor.paymentMethod}
                  onValueChange={(value: 'email' | 'mail_check') => setVendor({...vendor, paymentMethod: value})}
                >
                  {/* Email payment method */}
                  <div className="relative flex w-[300px] items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                    <RadioGroupItem
                      value="email"
                      id="payment-email"
                      aria-describedby="payment-email-description"
                      className="order-1 after:absolute after:inset-0"
                    />
                    <div className="flex grow items-start gap-3">
                      <Mail className="shrink-0 size-8" />
                      <div className="grid grow gap-2">
                        <Label htmlFor="payment-email">
                          Email{" "}
                          <span className="text-xs font-normal leading-[inherit] text-green-600">
                            (Recommended)
                          </span>
                        </Label>
                        <div id="payment-email-description" className="text-xs text-muted-foreground">
                          An email will be sent to the vendor, asking them how they prefer to get paid.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mail check payment method */}
                  <div className="relative flex w-[300px] items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                    <RadioGroupItem
                      value="mail_check"
                      id="payment-check"
                      aria-describedby="payment-check-description"
                      className="order-1 after:absolute after:inset-0"
                    />
                    <div className="flex grow items-start gap-3">
                      <Mailbox className="shrink-0 size-8" />
                      <div className="grid grow gap-2">
                        <Label htmlFor="payment-check">Mail Check</Label>
                        <div id="payment-check-description" className="text-xs text-muted-foreground">
                          A check will be printed and mailed on your behalf to the address above
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {vendor.paymentMethod === 'email' && (
                <div className="bg-[hsl(var(--success-light))] rounded-lg p-6 border border-[hsl(var(--success-light-border))] max-w-3xl mx-auto">
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium">Email</h5>
                      <div className="text-sm text-muted-foreground mt-1">
                        An email will be sent to the vendor, asking them how they prefer to get paid.
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        This is the preferred payment method, as it requires the user to authenticate their bank account, and gives them control if they ever need to make any changes etc.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">They can choose between:</div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Image
                            src="/assests/Interac_logo.png"
                            alt="Interac"
                            width={30}
                            height={30}
                            className="shrink-0 mt-0.5 object-contain"
                          />
                          <div>
                            <div className="text-sm font-medium">Direct Deposit</div>
                            <div className="text-sm text-muted-foreground">Have the funds deposited directly to their bank account via Interac e-Transfer</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vendor.paymentMethod === 'email' && (
                <div className="max-w-3xl mx-auto">
                  <h4 className="text-lg font-medium mb-4">Email Settings</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="billingEmail">Billing Email <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="billingEmail"
                        type="email"
                        className={cn(
                          "h-[42px] peer ps-9 bg-background",
                          { "border-red-500 focus-visible:ring-red-500": billingEmailError.length > 0 }
                        )}
                        placeholder="Enter billing email address"
                        value={vendor.billingEmail}
                        onChange={(e) => {
                          const email = e.target.value;
                          setVendor({...vendor, billingEmail: email});
                          
                          // Email validation
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!email) {
                            setBillingEmailError('Billing email is required');
                          } else if (!emailRegex.test(email)) {
                            setBillingEmailError('Please enter a valid email address');
                          } else {
                            setBillingEmailError('');
                          }
                        }}
                        required
                      />
                      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                        <Mail size={16} strokeWidth={2} aria-hidden="true" />
                      </div>
                    </div>
                    {billingEmailError && (
                      <div className="text-sm text-red-500 mt-1">{billingEmailError}</div>
                    )}
                  </div>
                </div>
              )}

              {vendor.paymentMethod === 'mail_check' && (
                <>
                  <div className="bg-[hsl(var(--success-light))] rounded-lg p-6 border border-[hsl(var(--success-light-border))] max-w-3xl mx-auto">
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium">Mail Check</h5>
                        <div className="text-sm text-muted-foreground mt-1">
                          A check will be printed and mailed on your behalf to the address below
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Please Note:</div>
                        <div className="text-sm text-muted-foreground">
                          The preferred payment sending method is email as it would allow the recipient to input and verify this information.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-3xl mx-auto">
                    <h4 className="text-lg font-medium mb-4">Address Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 grid gap-2">
                        <Label htmlFor="street">Street Address <span className="text-red-500">*</span></Label>
                        <Input 
                          id="street"
                          placeholder="Enter street address"
                          value={vendor.street}
                          onChange={(e) => setVendor({...vendor, street: e.target.value})}
                          className="h-[42px] bg-background"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                        <Input 
                          id="city"
                          placeholder="Enter city"
                          value={vendor.city}
                          onChange={(e) => setVendor({...vendor, city: e.target.value})}
                          className="h-[42px] bg-background"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="province">Province/State <span className="text-red-500">*</span></Label>
                        <Input 
                          id="province"
                          placeholder="Enter province or state"
                          value={vendor.province}
                          onChange={(e) => setVendor({...vendor, province: e.target.value})}
                          className="h-[42px] bg-background"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="postalCode">Postal Code/ZIP <span className="text-red-500">*</span></Label>
                        <Input 
                          id="postalCode"
                          placeholder="Enter postal code or ZIP"
                          value={vendor.postalCode}
                          onChange={(e) => setVendor({...vendor, postalCode: e.target.value})}
                          className="h-[42px] bg-background"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                        <Input 
                          id="country"
                          placeholder="Enter country"
                          value={vendor.country}
                          onChange={(e) => setVendor({...vendor, country: e.target.value})}
                          className="h-[42px] bg-background"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-12"></div>
    </div>
  );

  const isServicesStepValid = vendor.categories.length > 0 && vendor.classifications.length > 0;

  return (
    <div className="mx-auto p-6">
      <div className="bg-card rounded-xl p-16 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border">
        <div className="space-y-12">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-semibold">Add a Vendor</h1>
            </div>

            {/* Progress Steps */}
            <div className="w-full mx-auto mb-8">
              <div className="flex justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-4 left-0 right-0 h-[1px] bg-gray-200">
                  <div className={cn(
                    "h-full bg-green-600 transition-all duration-300",
                    step === 'intro' ? 'w-[28%]' :
                    step === 'personal' ? 'w-[38%]' :
                    step === 'contact' ? 'w-[45%]' :
                    step === 'address' ? 'w-[55%]' :
                    step === 'services' ? 'w-[63%]' :
                    step === 'insurance' ? 'w-[72%]' :
                    step === 'properties' ? 'w-[55%]' :
                    step === 'payment' ? 'w-[63%]' :
                    step === 'summary' ? 'w-[72%]' :
                    'w-full'
                  )}/>
                </div>

                {/* Steps Container with Animation */}
                <div className="w-full overflow-hidden max-w-3xl mx-auto">
                  <div className={cn(
                    "flex w-[150%] transition-transform duration-500 ease-in-out",
                    (step === 'properties' || step === 'payment' || step === 'summary') ? '-translate-x-[33.33%]' : 'translate-x-0'
                  )}>
                    {['intro', 'personal', 'contact', 'address', 'services', 'insurance', 'properties', 'payment', 'summary'].map((stepName, index) => {
                      // Calculate the step number to display
                      const displayNumber = index + 1;

                      // Determine if step should be marked as completed
                      const stepOrder = ['intro', 'personal', 'contact', 'address', 'services', 'insurance', 'properties', 'payment', 'summary'];
                      const currentStepIndex = stepOrder.indexOf(step);
                      const thisStepIndex = stepOrder.indexOf(stepName);
                      const isCompleted = thisStepIndex < currentStepIndex;
                      const isActive = step === stepName;

                      return (
                        <div key={stepName} className="relative flex flex-col items-center" style={{ width: 'calc(100% / 9)' }}>
                          <div className={cn(
                            "w-7 h-7 rounded-full border flex items-center justify-center bg-white text-xs font-medium",
                            isActive ? 'border-green-600 text-green-600' :
                            isCompleted ? 'border-green-600 text-green-600 bg-green-600' :
                            'border-gray-300 text-gray-300'
                          )}>
                            {isCompleted ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              displayNumber
                            )}
                          </div>
                          <span className={cn(
                            "mt-1 text-[10px] font-medium whitespace-nowrap",
                            (isActive || isCompleted) ? 'text-green-600' : 'text-gray-400'
                          )}>
                            {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {step === 'intro' ? (
              <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center space-y-8 py-12">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Add a Vendor</h2>
                  <p className="text-lg text-gray-600">
                    Enter the vendor&apos;s information to add them to your property management system.
                  </p>
                </div>

                <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border text-left">
                  <h3 className="text-lg font-semibold mb-3">Required Information</h3>
                  <p className="mb-4">
                    The following fields are mandatory to create a vendor:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>First Name</li>
                    <li>Last Name</li>
                    <li>Company</li>
                    <li>Email</li>
                    <li>Services Offered</li>
                  </ul>
                </div>
              </div>
            ) : step === 'personal' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                    <div className="grid gap-4">
                      {renderPersonalForm()}
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'contact' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid gap-4">
                      {renderContactForm()}
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'address' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                    <div className="grid gap-4">
                      {renderAddressForm()}
                    </div>
                  </div>
                </div>
                <div className="mt-12"></div>
              </div>
            ) : step === 'services' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Services Offered</h3>
                    <div className="grid gap-4">
                      {renderServicesForm()}
                    </div>
                  </div>
                </div>
                <div className="mt-12"></div>
              </div>
            ) : step === 'insurance' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Insurance Information</h3>
                    <div className="grid gap-4">
                      {renderInsuranceForm()}
                    </div>
                  </div>
                </div>
                <div className="mt-12"></div>
              </div>
            ) : step === 'properties' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <div className="grid gap-4">
                      {renderPropertiesForm()}
                    </div>
                  </div>
                </div>
                <div className="mt-12"></div>
              </div>
            ) : step === 'payment' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <div className="grid gap-4">
                      {renderPaymentForm()}
                    </div>
                  </div>
                </div>
                <div className="mt-12"></div>
              </div>
            ) : step === 'summary' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Review Vendor Information</p>
                    <p className="text-sm text-gray-600">Please review all the information before proceeding</p>
                  </div>

                  <div className="grid gap-8">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input 
                            id="firstName" 
                            value={vendor.firstName}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="middleName">Middle Name</Label>
                          <Input 
                            id="middleName" 
                            value={vendor.middleName}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={vendor.lastName}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="company">Company</Label>
                          <Input 
                            id="company" 
                            value={vendor.company}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Input 
                              id="email" 
                              type="email"
                              className="h-[42px] ps-9 bg-muted"
                              value={vendor.email}
                              disabled
                            />
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
                              <Mail size={16} strokeWidth={2} aria-hidden="true" />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2" >
                          <Label htmlFor="phone">Phone Number</Label>
                          <RPNInput.default
                            className="flex rounded-lg shadow-sm shadow-black/5 opacity-50"
                            international
                            flagComponent={FlagComponent}
                            countrySelectComponent={CountrySelect}
                            inputComponent={PhoneInput}
                            id="phone"
                            value={vendor.phone}
                            disabled
                            onChange={() => {}}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Primary Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 grid gap-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input 
                            id="street"
                            value={vendor.street}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="city">City</Label>
                          <Input 
                            id="city"
                            value={vendor.city}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="province">Province/State</Label>
                          <Input 
                            id="province"
                            value={vendor.province}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">Postal Code/ZIP</Label>
                          <Input 
                            id="postalCode"
                            value={vendor.postalCode}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="country">Country</Label>
                          <Input 
                            id="country"
                            value={vendor.country}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {vendor.hasSecondaryAddress && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Secondary Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 grid gap-2">
                            <Label htmlFor="secondaryStreet">Street Address</Label>
                            <Input 
                              id="secondaryStreet"
                              value={vendor.secondaryStreet}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryCity">City</Label>
                            <Input 
                              id="secondaryCity"
                              value={vendor.secondaryCity}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryProvince">Province/State</Label>
                            <Input 
                              id="secondaryProvince"
                              value={vendor.secondaryProvince}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryPostalCode">Postal Code/ZIP</Label>
                            <Input 
                              id="secondaryPostalCode"
                              value={vendor.secondaryPostalCode}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryCountry">Country</Label>
                            <Input 
                              id="secondaryCountry"
                              value={vendor.secondaryCountry}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Services Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Services Offered</h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Categories</Label>
                          <div className="flex flex-wrap gap-2">
                            {vendor.categories.map(cat => {
                              const category = vendorCategories.find(c => c.value === cat);
                              return category ? (
                                <div
                                  key={cat}
                                  className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium"
                                >
                                  {category.label}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Classifications</Label>
                          <div className="flex flex-wrap gap-2">
                            {vendor.classifications.map(cls => {
                              const classification = vendorClassifications.find(c => c.value === cls);
                              return classification ? (
                                <div
                                  key={cls}
                                  className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium"
                                >
                                  {classification.label}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Payment Settings</h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Payment Status</Label>
                          <div className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            vendor.enablePayments
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          )}>
                            {vendor.enablePayments ? "Enabled" : "Disabled"}
                          </div>
                        </div>

                        {vendor.enablePayments && (
                          <>
                            <div className="space-y-2">
                              <Label>Payment Method</Label>
                              <div className="text-sm">
                                {vendor.paymentMethod === 'email' ? (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>Email Payment</span>
                                  </div>
                                ) : vendor.paymentMethod === 'mail_check' ? (
                                  <div className="flex items-center gap-2">
                                    <Mailbox className="h-4 w-4" />
                                    <span>Mail Check</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {vendor.paymentMethod === 'email' && (
                              <div className="space-y-2">
                                <Label>Billing Email</Label>
                                <div className="text-sm">{vendor.billingEmail}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Email Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Email Preferences <span className="text-red-500">*</span></h3>
                      <RadioGroup 
                        className="gap-6" 
                        value={vendor.sendWelcomeEmail || ""}
                        onValueChange={(value) => {
                          setVendor({...vendor, sendWelcomeEmail: value});
                          setEmailPreferenceError('');
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <RadioGroupItem
                            value="send"
                            id="send-email"
                            aria-describedby="send-email-description"
                          />
                          <div className="grid grow gap-2">
                            <Label htmlFor="send-email">Send welcome email</Label>
                            <p id="send-email-description" className="text-xs text-muted-foreground">
                              Send an automated welcome email to the vendor.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <RadioGroupItem
                            value="dont-send"
                            id="dont-send-email"
                            aria-describedby="dont-send-email-description"
                          />
                          <div className="grid grow gap-2">
                            <Label htmlFor="dont-send-email">Don&apos;t send email</Label>
                            <p id="dont-send-email-description" className="text-xs text-muted-foreground">
                              Skip sending the welcome email to this vendor.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                      {emailPreferenceError && (
                        <p className="text-sm text-red-500 mt-2">{emailPreferenceError}</p>
                      )}
                    </div>
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
              ((step === 'personal' && vendor.firstName && vendor.lastName && vendor.company) || 
               (step === 'contact' && vendor.email && !emailError) ||
               step === 'address' ||
               (step === 'services' && isServicesStepValid) ||
               step === 'insurance' ||
               (step === 'properties' && vendor.propertiesAccess) ||
               (step === 'payment' && (!vendor.enablePayments || (vendor.enablePayments && vendor.paymentMethod && (vendor.paymentMethod === 'mail_check' || (vendor.paymentMethod === 'email' && vendor.billingEmail && !billingEmailError))))) ||
               step === 'intro' ||
               (step === 'summary' && vendor.sendWelcomeEmail))
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={() => {
              if (step === 'summary') {
                handleSubmit();
              } else {
                handleNext();
              }
            }}
            disabled={
              step !== 'summary' && (
                (step === 'personal' && (!vendor.firstName || !vendor.lastName || !vendor.company)) ||
                (step === 'contact' && (!vendor.email || !!emailError)) ||
                (step === 'services' && !isServicesStepValid) ||
                (step === 'properties' && !vendor.propertiesAccess) ||
                (step === 'payment' && vendor.enablePayments && (!vendor.paymentMethod || (vendor.paymentMethod === 'email' && (!vendor.billingEmail || !!billingEmailError))))
              ) || (step === 'summary' && !vendor.sendWelcomeEmail)
            }
          >
            {step === 'summary' ? 'Save' : 'Next'}
          </button>
        </div>
      </div>

      {/* Insurance Skip Confirmation Dialog */}
      <Dialog open={showInsuranceSkipDialog} onOpenChange={setShowInsuranceSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Insurance Information?</DialogTitle>
            <DialogDescription>
              Are you sure you want to continue without adding insurance information? You can always add it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInsuranceSkipDialog(false)}>
              Go Back
            </Button>
            <Button 
              onClick={() => {
                setShowInsuranceSkipDialog(false);
                setStep('properties');
              }}
            >
              Continue Without Insurance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}