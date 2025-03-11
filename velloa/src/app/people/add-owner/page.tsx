'use client';

import { useState, forwardRef, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Phone, CalendarIcon, ChevronLeft, ChevronRight, Mailbox } from 'lucide-react';
import { cn } from "@/lib/utils";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { DateField, DateInput, DateSegment, Button, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, DateRangePicker, Dialog, Group, Heading, Popover, RangeCalendar } from "react-aria-components";
import { CalendarDate } from "@internationalized/date";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Image from 'next/image';
import { Textarea } from "@/components/ui/textarea";
import { useCharacterLimit } from "@/hooks/use-character-limit";

type DateRangeValue = {
  start: CalendarDate;
  end: CalendarDate;
} | null;

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

interface OwnerForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactEmail: string;
  phone: string;
  company: string;
  ownershipPercentage: string;
  dateOfBirth: Date | undefined;
  ssn: string;
  driversLicenseState: string;
  driversLicenseNumber: string;
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
  // Agreement fields
  agreementStartDate: Date | undefined;
  agreementEndDate: Date | undefined;
  // Payment fields
  enablePayments: boolean;
  paymentMethod: 'email' | 'mail_check' | undefined;
  billingEmail: string;
}

export default function AddOwnerPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'personal' | 'contact' | 'address' | 'agreement' | 'payment' | 'summary' | 'additional'>('intro');
  const [owner, setOwner] = useState<OwnerForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactEmail: '',
    phone: '',
    company: '',
    ownershipPercentage: '',
    dateOfBirth: undefined,
    ssn: '',
    driversLicenseState: '',
    driversLicenseNumber: '',
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
    // Agreement fields
    agreementStartDate: undefined,
    agreementEndDate: undefined,
    // Payment fields
    enablePayments: false,
    paymentMethod: undefined,
    billingEmail: ''
  });
  const [emails, setEmails] = useState<string[]>(['']);
  const [contactEmails, setContactEmails] = useState<string[]>(['']);
  const [emailError, setEmailError] = useState<string>('');
  const [contactEmailError, setContactEmailError] = useState<string>('');
  const [sameAsPortal, setSameAsPortal] = useState(false);
  const billingEmailRef = useRef<HTMLInputElement>(null);
  const [billingEmailError, setBillingEmailError] = useState<string>('');
  const [dateRangeError, setDateRangeError] = useState<string>('');
  const maxLength = 1000;
  const {
    value: notesValue,
    characterCount,
    handleChange: handleNotesChange,
    maxLength: limit,
  } = useCharacterLimit({ maxLength });

  const handleNext = () => {
    // Add validation for agreement dates
    if (step === 'agreement' && owner.agreementStartDate && owner.agreementEndDate) {
      if (owner.agreementEndDate <= owner.agreementStartDate) {
        setDateRangeError('End date must be after start date');
        return; // Don't proceed if end date is not after start date
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
        setStep('agreement');
        break;
      case 'agreement':
        setStep('payment');
        break;
      case 'payment':
        setStep('summary');
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
      case 'agreement':
        setStep('address');
        break;
      case 'payment':
        setStep('agreement');
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
    try {
      // Format address info
      const addressInfo = {
        primary: {
          street: owner.street,
          city: owner.city,
          province: owner.province,
          postalCode: owner.postalCode,
          country: owner.country
        },
        secondary: owner.hasSecondaryAddress ? {
          street: owner.secondaryStreet,
          city: owner.secondaryCity,
          province: owner.secondaryProvince,
          postalCode: owner.secondaryPostalCode,
          country: owner.secondaryCountry
        } : null
      };

      // Format payment settings
      const paymentSettings = owner.enablePayments ? {
        enabled: true,
        method: owner.paymentMethod,
        billingEmail: owner.paymentMethod === 'email' ? owner.billingEmail : null
      } : {
        enabled: false
      };

      const response = await fetch('/api/people/owner/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: owner.firstName,
          last_name: owner.lastName,
          middle_name: owner.middleName,
          company: owner.company,
          portal_email: owner.email,
          email: owner.contactEmail,
          phone: owner.phone,
          about_you: owner.aboutYou,
          date_of_birth: owner.dateOfBirth,
          address_info: addressInfo,
          agreement_start: owner.agreementStartDate,
          agreement_end: owner.agreementEndDate,
          payments_settings: paymentSettings
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create owner');
      }

      router.push('/people');
    } catch (error) {
      console.error('Error creating owner:', error);
      // Here you might want to show an error message to the user
    }
  };

  const handlePortalEmailChange = (email: string) => {
    setEmails([email]);
    setOwner({...owner, email});
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }

    // If same as portal is checked, update contact email too
    if (sameAsPortal) {
      setContactEmails([email]);
      setOwner(prev => ({...prev, email, contactEmail: email}));
      if (!email) {
        setContactEmailError('Contact email is required');
      } else if (!emailRegex.test(email)) {
        setContactEmailError('Please enter a valid email address');
      } else {
        setContactEmailError('');
      }
    }
  };

  const handleSameAsPortalChange = (checked: boolean) => {
    setSameAsPortal(checked);
    if (checked && owner.email) {
      setContactEmails([owner.email]);
      setOwner(prev => ({...prev, contactEmail: prev.email}));
      // Validate contact email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!owner.email) {
        setContactEmailError('Contact email is required');
      } else if (!emailRegex.test(owner.email)) {
        setContactEmailError('Please enter a valid email address');
      } else {
        setContactEmailError('');
      }
    }
  };

  const renderPersonalForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
        <Input 
          id="firstName" 
          placeholder="Enter first name" 
          value={owner.firstName}
          onChange={(e) => setOwner({...owner, firstName: e.target.value})}
          className="h-[42px]"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="middleName">Middle Name</Label>
        <Input 
          id="middleName" 
          placeholder="Enter middle name"
          value={owner.middleName}
          onChange={(e) => setOwner({...owner, middleName: e.target.value})}
          className="h-[42px]"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
        <Input 
          id="lastName" 
          placeholder="Enter last name"
          value={owner.lastName}
          onChange={(e) => setOwner({...owner, lastName: e.target.value})}
          className="h-[42px]"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">Company</Label>
        <Input 
          id="company" 
          placeholder="Enter company name"
          value={owner.company}
          onChange={(e) => setOwner({...owner, company: e.target.value})}
          className="h-[42px]"
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
            setOwner({...owner, aboutYou: e.target.value});
          }}
          aria-describedby="characters-left-textarea"
          placeholder="Add any notes about this owner..."
          className="min-h-[150px]"
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
          <Label htmlFor="email">Portal Email <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input 
              id="email" 
              type="email"
              className={cn(
                "h-[42px] peer ps-9",
                { "border-red-500 focus-visible:ring-red-500": emailError.length > 0 }
              )}
              placeholder="Enter portal email address"
              value={emails[0]}
              onChange={(e) => handlePortalEmailChange(e.target.value)}
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

        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsPortal"
              checked={sameAsPortal}
              onCheckedChange={(checked) => handleSameAsPortalChange(checked as boolean)}
            />
            <Label htmlFor="sameAsPortal" className="text-sm text-gray-600">
              Same as portal email
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contactEmail">Contact Email <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input 
                id="contactEmail"
                type="email"
                className={cn(
                  "h-[42px] peer ps-9",
                  { "border-red-500 focus-visible:ring-red-500": contactEmailError.length > 0 }
                )}
                placeholder="Enter contact email address"
                value={contactEmails[0]}
                onChange={(e) => {
                  const email = e.target.value;
                  setContactEmails([email]);
                  setOwner({...owner, contactEmail: email});
                  setSameAsPortal(false);
                  
                  // Email validation
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!email) {
                    setContactEmailError('Contact email is required');
                  } else if (!emailRegex.test(email)) {
                    setContactEmailError('Please enter a valid email address');
                  } else {
                    setContactEmailError('');
                  }
                }}
                required
                disabled={sameAsPortal}
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Mail size={16} strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
            {contactEmailError && (
              <p className="text-sm text-red-500 mt-1">{contactEmailError}</p>
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
              value={owner.phone}
              onChange={(value) => setOwner({...owner, phone: value || ''})}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddressForm = () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-lg font-medium mb-4">Primary Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="street">Street Address <span className="text-red-500">*</span></Label>
            <Input 
              id="street"
              placeholder="Enter street address"
              value={owner.street}
              onChange={(e) => setOwner({...owner, street: e.target.value})}
              className="h-[42px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
            <Input 
              id="city"
              placeholder="Enter city"
              value={owner.city}
              onChange={(e) => setOwner({...owner, city: e.target.value})}
              className="h-[42px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="province">Province/State <span className="text-red-500">*</span></Label>
            <Input 
              id="province"
              placeholder="Enter province or state"
              value={owner.province}
              onChange={(e) => setOwner({...owner, province: e.target.value})}
              className="h-[42px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postalCode">Postal Code/ZIP <span className="text-red-500">*</span></Label>
            <Input 
              id="postalCode"
              placeholder="Enter postal code or ZIP"
              value={owner.postalCode}
              onChange={(e) => setOwner({...owner, postalCode: e.target.value})}
              className="h-[42px]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
            <Input 
              id="country"
              placeholder="Enter country"
              value={owner.country}
              onChange={(e) => setOwner({...owner, country: e.target.value})}
              className="h-[42px]"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <input
          type="checkbox"
          id="hasSecondaryAddress"
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          checked={owner.hasSecondaryAddress}
          onChange={(e) => setOwner({...owner, hasSecondaryAddress: e.target.checked})}
        />
        <Label htmlFor="hasSecondaryAddress" className="text-sm text-gray-600">
          Add Secondary Address
        </Label>
      </div>

      {owner.hasSecondaryAddress && (
        <div>
          <h4 className="text-lg font-medium mb-4">Secondary Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid gap-2">
              <Label htmlFor="secondaryStreet">Street Address</Label>
              <Input 
                id="secondaryStreet"
                placeholder="Enter street address"
                value={owner.secondaryStreet}
                onChange={(e) => setOwner({...owner, secondaryStreet: e.target.value})}
                className="h-[42px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryCity">City</Label>
              <Input 
                id="secondaryCity"
                placeholder="Enter city"
                value={owner.secondaryCity}
                onChange={(e) => setOwner({...owner, secondaryCity: e.target.value})}
                className="h-[42px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryProvince">Province/State</Label>
              <Input 
                id="secondaryProvince"
                placeholder="Enter province or state"
                value={owner.secondaryProvince}
                onChange={(e) => setOwner({...owner, secondaryProvince: e.target.value})}
                className="h-[42px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryPostalCode">Postal Code/ZIP</Label>
              <Input 
                id="secondaryPostalCode"
                placeholder="Enter postal code or ZIP"
                value={owner.secondaryPostalCode}
                onChange={(e) => setOwner({...owner, secondaryPostalCode: e.target.value})}
                className="h-[42px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryCountry">Country</Label>
              <Input 
                id="secondaryCountry"
                placeholder="Enter country"
                value={owner.secondaryCountry}
                onChange={(e) => setOwner({...owner, secondaryCountry: e.target.value})}
                className="h-[42px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto p-6">
      <div className="bg-card rounded-xl p-16 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border">
        <div className="space-y-12">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-semibold">Add an Owner</h1>
              <div className="text-sm text-gray-600">
                {step === 'intro' ? 'Introduction' : 
                 step === 'personal' ? 'Personal Information' : 
                 step === 'contact' ? 'Contact Information' :
                 step === 'address' ? 'Address Information' :
                 step === 'agreement' ? 'Agreement Period' :
                 step === 'payment' ? 'Payment Settings' :
                 step === 'summary' ? 'Review Owner Information' :
                 step === 'additional' ? 'Additional Information' : 'Additional Information'}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-6">
              <div className={`h-full bg-green-600 rounded-full transition-all duration-300 ${
                step === 'intro' ? 'w-[14.28%]' :
                step === 'personal' ? 'w-[28.57%]' :
                step === 'contact' ? 'w-[42.85%]' :
                step === 'address' ? 'w-[57.14%]' :
                step === 'agreement' ? 'w-[71.42%]' :
                step === 'payment' ? 'w-[85.71%]' :
                step === 'summary' ? 'w-[100%]' : 'w-full'
              }`}></div>
            </div>

            {step === 'intro' ? (
              <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center space-y-8 py-12">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">Add an Owner</h2>
                  <p className="text-lg text-gray-600">
                    Enter the owner&apos;s information to add them to your property management system.
                  </p>
                </div>

                <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border text-left">
                  <h3 className="text-lg font-semibold mb-3">Required Information</h3>
                  <p className="mb-4">
                    The following fields are mandatory to create an owner:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>First Name</li>
                    <li>Last Name</li>
                    <li>Contact Email</li>
                    <li>Address Information</li>
                    <li>Agreement Period</li>
                    <li>Payment Settings</li>
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
            ) : step === 'agreement' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-center">Agreement Period</h3>
                    <div className="grid gap-4 max-w-xl mx-auto">
                      <DateRangePicker
                        className="space-y-2"
                        value={
                          owner.agreementStartDate && owner.agreementEndDate
                            ? {
                                start: new CalendarDate(
                                  owner.agreementStartDate.getFullYear(),
                                  owner.agreementStartDate.getMonth() + 1,
                                  owner.agreementStartDate.getDate()
                                ),
                                end: new CalendarDate(
                                  owner.agreementEndDate.getFullYear(),
                                  owner.agreementEndDate.getMonth() + 1,
                                  owner.agreementEndDate.getDate()
                                )
                              }
                            : null
                        }
                        onChange={(range: DateRangeValue) => {
                          if (range) {
                            setOwner({
                              ...owner,
                              agreementStartDate: new Date(range.start.year, range.start.month - 1, range.start.day),
                              agreementEndDate: new Date(range.end.year, range.end.month - 1, range.end.day)
                            });
                            setDateRangeError(''); // Clear error when dates change
                          } else {
                            setOwner({
                              ...owner,
                              agreementStartDate: undefined,
                              agreementEndDate: undefined
                            });
                            setDateRangeError(''); // Clear error when dates are cleared
                          }
                        }}
                      >
                        <Label className="text-sm font-medium text-foreground text-center block">Select Agreement Period <span className="text-red-500">*</span></Label>
                        <div className="flex justify-center">
                          <Group className="inline-flex h-[42px] w-full max-w-md items-center overflow-hidden whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 pe-9 text-sm shadow-sm shadow-black/5 data-[focus-within]:border-ring data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-[3px] data-[focus-within]:ring-ring/20">
                            <DateInput slot="start">
                              {(segment) => (
                                <DateSegment
                                  segment={segment}
                                  className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0 data-[disabled]:cursor-not-allowed data-[focused]:bg-accent data-[invalid]:data-[focused]:bg-destructive data-[type=literal]:px-0 data-[focused]:data-[placeholder]:text-foreground data-[focused]:text-foreground data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive data-[placeholder]:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 data-[disabled]:opacity-50"
                                />
                              )}
                            </DateInput>
                            <span aria-hidden="true" className="px-2 text-muted-foreground/70">
                              -
                            </span>
                            <DateInput slot="end">
                              {(segment) => (
                                <DateSegment
                                  segment={segment}
                                  className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0 data-[disabled]:cursor-not-allowed data-[focused]:bg-accent data-[invalid]:data-[focused]:bg-destructive data-[type=literal]:px-0 data-[focused]:data-[placeholder]:text-foreground data-[focused]:text-foreground data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive data-[placeholder]:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 data-[disabled]:opacity-50"
                                />
                              )}
                            </DateInput>
                          </Group>
                          <Button className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70">
                            <CalendarIcon size={16} strokeWidth={2} />
                          </Button>
                        </div>
                        <Popover
                          className="z-50 rounded-lg border border-border bg-background text-popover-foreground shadow-lg shadow-black/5 outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2"
                          offset={4}
                        >
                          <Dialog className="max-h-[inherit] overflow-auto p-2">
                            <RangeCalendar className="w-fit">
                              <header className="flex w-full items-center gap-1 pb-1">
                                <Button
                                  slot="previous"
                                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:bg-accent hover:text-foreground data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70"
                                >
                                  <ChevronLeft size={16} strokeWidth={2} />
                                </Button>
                                <Heading className="grow text-center text-sm font-medium" />
                                <Button
                                  slot="next"
                                  className="flex size-9 items-center justify-center rounded-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:bg-accent hover:text-foreground data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70"
                                >
                                  <ChevronRight size={16} strokeWidth={2} />
                                </Button>
                              </header>
                              <CalendarGrid>
                                <CalendarGridHeader>
                                  {(day: string) => (
                                    <CalendarHeaderCell className="size-9 rounded-lg p-0 text-xs font-medium text-muted-foreground/80">
                                      {day}
                                    </CalendarHeaderCell>
                                  )}
                                </CalendarGridHeader>
                                <CalendarGridBody className="[&_td]:px-0">
                                  {(date: CalendarDate) => (
                                    <CalendarCell
                                      date={date}
                                      className={cn(
                                        "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg border border-transparent p-0 text-sm font-normal text-foreground outline-offset-2 duration-150 [transition-property:border-radius,box-shadow] focus-visible:outline-none data-[disabled]:pointer-events-none data-[unavailable]:pointer-events-none data-[focus-visible]:z-10 data-[selected]:rounded-none data-[selection-end]:rounded-e-lg data-[selection-start]:rounded-s-lg data-[hovered]:bg-accent data-[invalid]:bg-red-100 data-[selected]:bg-accent data-[hovered]:text-foreground data-[selected]:text-foreground data-[unavailable]:line-through data-[disabled]:opacity-30 data-[unavailable]:opacity-30 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70 data-[invalid]:data-[selection-end]:[&:not([data-hover])]:bg-destructive data-[invalid]:data-[selection-start]:[&:not([data-hover])]:bg-destructive data-[selection-end]:[&:not([data-hover])]:bg-primary data-[selection-start]:[&:not([data-hover])]:bg-primary data-[invalid]:data-[selection-end]:[&:not([data-hover])]:text-destructive-foreground data-[invalid]:data-[selection-start]:[&:not([data-hover])]:text-destructive-foreground data-[selection-end]:[&:not([data-hover])]:text-primary-foreground data-[selection-start]:[&:not([data-hover])]:text-primary-foreground"
                                      )}
                                    />
                                  )}
                                </CalendarGridBody>
                              </CalendarGrid>
                            </RangeCalendar>
                          </Dialog>
                        </Popover>
                        {dateRangeError && (
                          <p className="text-sm text-red-500 mt-1 text-center">{dateRangeError}</p>
                        )}
                      </DateRangePicker>
                    </div>
                  </div>
                </div>
                <div className="mt-12"></div>
              </div>
            ) : step === 'payment' ? (
              <div className="flex flex-col h-full">
                <div className="flex-grow space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-center">Payment Settings</h3>
                    <div className="grid gap-4 max-w-3xl mx-auto">
                      <RadioGroup 
                        className="flex flex-col items-center gap-4" 
                        value={owner.enablePayments ? 'enabled' : 'disabled'}
                        onValueChange={(value) => {
                          setOwner({
                            ...owner,
                            enablePayments: value === 'enabled',
                            paymentMethod: value === 'enabled' ? owner.paymentMethod : undefined,
                            billingEmail: value === 'enabled' ? owner.billingEmail : ''
                          });
                        }}
                      >
                        <div className="flex items-start gap-2 w-full max-w-[400px]">
                          <RadioGroupItem
                            value="enabled"
                            id="enable-payments"
                            aria-describedby="enable-payments-description"
                          />
                          <div className="grid grow gap-1">
                            <Label htmlFor="enable-payments" className="text-sm">Enable send payments for this owner</Label>
                            <p id="enable-payments-description" className="text-xs text-muted-foreground">
                              Allow sending payments to this owner through the system.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 w-full max-w-[400px]">
                          <RadioGroupItem
                            value="disabled"
                            id="disable-payments"
                            aria-describedby="disable-payments-description"
                          />
                          <div className="grid grow gap-1">
                            <Label htmlFor="disable-payments" className="text-sm">Do not send payments</Label>
                            <p id="disable-payments-description" className="text-xs text-muted-foreground">
                              Payments will not be sent through the system
                            </p>
                          </div>
                        </div>
                      </RadioGroup>

                      {owner.enablePayments && (
                        <div className="mt-8 space-y-8">
                          <div className="h-px bg-border" />
                          <div>
                            <h4 className="text-lg font-medium mb-4 text-center">Payment Sending Method</h4>
                            <RadioGroup 
                              className="flex justify-center gap-4 max-w-3xl mx-auto" 
                              value={owner.paymentMethod}
                              onValueChange={(value: 'email' | 'mail_check') => setOwner({...owner, paymentMethod: value})}
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
                                    <p id="payment-email-description" className="text-xs text-muted-foreground">
                                      An email will be sent to the owner, asking them how they prefer to get paid.
                                    </p>
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
                                    <p id="payment-check-description" className="text-xs text-muted-foreground">
                                      A check will be printed and mailed on your behalf to the address below
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>

                          {owner.paymentMethod === 'email' && (
                            <div className="bg-green-50 rounded-lg p-6 border border-green-200 max-w-3xl mx-auto">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-medium">Email</h5>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    An email will be sent to the owner, asking them how they prefer to get paid.
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

                          {owner.paymentMethod === 'email' && (
                            <div className="max-w-3xl mx-auto">
                              <h4 className="text-lg font-medium mb-4">Email Settings</h4>
                              <div className="grid gap-2">
                                <Label htmlFor="billingEmail">Billing Email <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                  <Input
                                    ref={billingEmailRef}
                                    id="billingEmail"
                                    type="email"
                                    className={cn(
                                      "h-[42px] peer ps-9",
                                      { "border-red-500 focus-visible:ring-red-500": billingEmailError.length > 0 }
                                    )}
                                    placeholder="Enter billing email address"
                                    value={owner.billingEmail}
                                    onChange={(e) => {
                                      const email = e.target.value;
                                      setOwner({...owner, billingEmail: email});
                                      
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
                                  <p className="text-sm text-red-500 mt-1">{billingEmailError}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {owner.paymentMethod === 'mail_check' && (
                            <>
                              <div className="bg-green-50 rounded-lg p-6 border border-green-200 max-w-3xl mx-auto">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-medium">Mail Check</h5>
                                    <p className="text-sm text-gray-600 mt-1">
                                      A check will be printed and mailed on your behalf to the address below
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Please Note:</p>
                                    <p className="text-sm text-gray-600">
                                      The preferred payment sending method is email as it would allow the recipient to input and verify this information.
                                    </p>
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
                                      value={owner.street}
                                      onChange={(e) => setOwner({...owner, street: e.target.value})}
                                      className="h-[42px]"
                                      required
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                                    <Input 
                                      id="city"
                                      placeholder="Enter city"
                                      value={owner.city}
                                      onChange={(e) => setOwner({...owner, city: e.target.value})}
                                      className="h-[42px]"
                                      required
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="province">Province/State <span className="text-red-500">*</span></Label>
                                    <Input 
                                      id="province"
                                      placeholder="Enter province or state"
                                      value={owner.province}
                                      onChange={(e) => setOwner({...owner, province: e.target.value})}
                                      className="h-[42px]"
                                      required
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="postalCode">Postal Code/ZIP <span className="text-red-500">*</span></Label>
                                    <Input 
                                      id="postalCode"
                                      placeholder="Enter postal code or ZIP"
                                      value={owner.postalCode}
                                      onChange={(e) => setOwner({...owner, postalCode: e.target.value})}
                                      className="h-[42px]"
                                      required
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                                    <Input 
                                      id="country"
                                      placeholder="Enter country"
                                      value={owner.country}
                                      onChange={(e) => setOwner({...owner, country: e.target.value})}
                                      className="h-[42px]"
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
                </div>
                <div className="mt-12"></div>
              </div>
            ) : step === 'summary' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Review Owner Information</p>
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
                            value={owner.firstName}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="middleName">Middle Name</Label>
                          <Input 
                            id="middleName" 
                            value={owner.middleName}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input 
                            id="lastName" 
                            value={owner.lastName}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="company">Company</Label>
                          <Input 
                            id="company" 
                            value={owner.company}
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
                          <Label htmlFor="email">Portal Email</Label>
                          <div className="relative">
                            <Input 
                              id="email" 
                              type="email"
                              className="h-[42px] ps-9 bg-muted"
                              value={owner.email}
                              disabled
                            />
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
                              <Mail size={16} strokeWidth={2} aria-hidden="true" />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <div className="relative">
                            <Input 
                              id="contactEmail"
                              type="email"
                              className="h-[42px] ps-9 bg-muted"
                              value={owner.contactEmail}
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
                            value={owner.phone}
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
                            value={owner.street}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="city">City</Label>
                          <Input 
                            id="city"
                            value={owner.city}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="province">Province/State</Label>
                          <Input 
                            id="province"
                            value={owner.province}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">Postal Code/ZIP</Label>
                          <Input 
                            id="postalCode"
                            value={owner.postalCode}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="country">Country</Label>
                          <Input 
                            id="country"
                            value={owner.country}
                            className="h-[42px] bg-muted"
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    {owner.hasSecondaryAddress && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Secondary Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 grid gap-2">
                            <Label htmlFor="secondaryStreet">Street Address</Label>
                            <Input 
                              id="secondaryStreet"
                              value={owner.secondaryStreet}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryCity">City</Label>
                            <Input 
                              id="secondaryCity"
                              value={owner.secondaryCity}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryProvince">Province/State</Label>
                            <Input 
                              id="secondaryProvince"
                              value={owner.secondaryProvince}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryPostalCode">Postal Code/ZIP</Label>
                            <Input 
                              id="secondaryPostalCode"
                              value={owner.secondaryPostalCode}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryCountry">Country</Label>
                            <Input 
                              id="secondaryCountry"
                              value={owner.secondaryCountry}
                              className="h-[42px] bg-muted"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Agreement Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Agreement Period</h3>
                      <div className="grid gap-4">
                        <DateRangePicker
                          className="space-y-2"
                          value={
                            owner.agreementStartDate && owner.agreementEndDate
                              ? {
                                  start: new CalendarDate(
                                    owner.agreementStartDate.getFullYear(),
                                    owner.agreementStartDate.getMonth() + 1,
                                    owner.agreementStartDate.getDate()
                                  ),
                                  end: new CalendarDate(
                                    owner.agreementEndDate.getFullYear(),
                                    owner.agreementEndDate.getMonth() + 1,
                                    owner.agreementEndDate.getDate()
                                  )
                                }
                              : null
                          }
                          isDisabled={true}
                        >
                          <Label className="text-sm font-medium text-foreground text-center block">Agreement Period</Label>
                          <div className="flex justify-center">
                            <Group className="inline-flex h-[42px] w-full max-w-md items-center overflow-hidden whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 pe-9 text-sm shadow-sm shadow-black/5 data-[focus-within]:border-ring data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-[3px] data-[focus-within]:ring-ring/20">
                              <DateInput slot="start">
                                {(segment) => (
                                  <DateSegment
                                    segment={segment}
                                    className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0"
                                  />
                                )}
                              </DateInput>
                              <span aria-hidden="true" className="px-2 text-muted-foreground/70">
                                -
                              </span>
                              <DateInput slot="end">
                                {(segment) => (
                                  <DateSegment
                                    segment={segment}
                                    className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0"
                                  />
                                )}
                              </DateInput>
                            </Group>
                          </div>
                        </DateRangePicker>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Payment Settings</h3>
                      <div className="space-y-4">
                        <RadioGroup 
                          className="flex flex-col items-center gap-4" 
                          value={owner.enablePayments ? 'enabled' : 'disabled'}
                          disabled
                        >
                          <div className="flex items-start gap-2 w-full max-w-[400px]">
                            <RadioGroupItem
                              value="enabled"
                              id="enable-payments-review"
                              aria-describedby="enable-payments-description"
                            />
                            <div className="grid grow gap-1">
                              <Label htmlFor="enable-payments-review" className="text-sm">Enable send payments for this owner</Label>
                              <p id="enable-payments-description" className="text-xs text-muted-foreground">
                                Allow sending payments to this owner through the system.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 w-full max-w-[400px]">
                            <RadioGroupItem
                              value="disabled"
                              id="disable-payments-review"
                              aria-describedby="disable-payments-description"
                            />
                            <div className="grid grow gap-1">
                              <Label htmlFor="disable-payments-review" className="text-sm">Do not send payments</Label>
                              <p id="disable-payments-description" className="text-xs text-muted-foreground">
                                Payments will not be sent through the system
                              </p>
                            </div>
                          </div>
                        </RadioGroup>

                        {owner.enablePayments && (
                          <div className="space-y-4">
                            <RadioGroup 
                              className="flex justify-center gap-4 max-w-3xl mx-auto" 
                              value={owner.paymentMethod}
                              disabled
                            >
                              <div className="relative flex w-[300px] items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring opacity-50">
                                <RadioGroupItem
                                  value="email"
                                  id="payment-email-review"
                                />
                                <div className="flex grow items-start gap-3">
                                  <Mail className="shrink-0 size-8" />
                                  <div className="grid grow gap-2">
                                    <Label htmlFor="payment-email-review">Email</Label>
                                  </div>
                                </div>
                              </div>

                              <div className="relative flex w-[300px] items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring opacity-50">
                                <RadioGroupItem
                                  value="mail_check"
                                  id="payment-check-review"
                                />
                                <div className="flex grow items-start gap-3">
                                  <Mailbox className="shrink-0 size-8" />
                                  <div className="grid grow gap-2">
                                    <Label htmlFor="payment-check-review">Mail Check</Label>
                                  </div>
                                </div>
                              </div>
                            </RadioGroup>

                            {owner.paymentMethod === 'email' && (
                              <div className="grid gap-2 max-w-3xl mx-auto">
                                <Label htmlFor="billingEmail">Billing Email</Label>
                                <div className="relative">
                                  <Input
                                    id="billingEmail"
                                    type="email"
                                    className="h-[42px] ps-9 bg-muted"
                                    value={owner.billingEmail}
                                    disabled
                                  />
                                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
                                    <Mail size={16} strokeWidth={2} aria-hidden="true" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : step === 'additional' ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold">Additional Information</p>
                    <p className="text-sm text-gray-600">Please provide any additional details</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <DateField 
                        value={owner.dateOfBirth ? new CalendarDate(
                          owner.dateOfBirth.getFullYear(),
                          owner.dateOfBirth.getMonth() + 1,
                          owner.dateOfBirth.getDate()
                        ) : null}
                        onChange={(date) => setOwner({...owner, dateOfBirth: date ? 
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
              ((step === 'personal' && owner.firstName && owner.lastName) || 
               (step === 'contact' && owner.email && !emailError && owner.contactEmail && !contactEmailError) ||
               (step === 'address' && owner.street && owner.city && owner.province && owner.postalCode && owner.country) ||
               (step === 'agreement' && owner.agreementStartDate && owner.agreementEndDate) ||
               (step === 'payment' && (!owner.enablePayments || (owner.paymentMethod && (owner.paymentMethod === 'mail_check' || (owner.paymentMethod === 'email' && owner.billingEmail && !billingEmailError))))) ||
               step === 'intro' ||
               step === 'summary')
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={step === 'summary' ? handleSubmit : handleNext}
            disabled={
              step !== 'summary' && (
                (step === 'personal' && (!owner.firstName || !owner.lastName)) ||
                (step === 'contact' && (!owner.email || !!emailError || !owner.contactEmail || !!contactEmailError)) ||
                (step === 'address' && (!owner.street || !owner.city || !owner.province || !owner.postalCode || !owner.country)) ||
                (step === 'agreement' && (!owner.agreementStartDate || !owner.agreementEndDate)) ||
                (step === 'payment' && owner.enablePayments && (!owner.paymentMethod || (owner.paymentMethod === 'email' && (!owner.billingEmail || !!billingEmailError))))
              )
            }
          >
            {step === 'summary' ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}