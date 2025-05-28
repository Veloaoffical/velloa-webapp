'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Lock, Building, DoorClosed, CircleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import Image from "next/image";
import { Checkbox } from '@/components/ui/checkbox';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { PhoneNumberInput } from "@/components/ui/phone-input";
import type { Value } from "react-phone-number-input";
import { useId } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { ChevronDownIcon, CheckIcon, PlusIcon } from "lucide-react";
import CalendarInput from "@/components/calendarwithmonthsinput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
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
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

const vendorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  company: z.string().min(1, 'Company is required'),
  notes: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  primaryAddress: z.string().min(1, 'Primary address is required'),
  primaryAddress2: z.string().optional(),
  secondaryAddress: z.string().optional(),
  secondaryAddress2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  notify: z.boolean().optional(),
  permissionToEnter: z.boolean().optional(),
  notify_assignee: z.enum(["none", "sms", "email", "both"]).optional(),
  secondaryCity: z.string().optional(),
  secondaryState: z.string().optional(),
  secondaryPostalCode: z.string().optional(),
  secondaryCountry: z.string().optional(),
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  coverage: z.string().optional(),
  insuranceStart: z.string().optional(),
  insuranceEnd: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.insuranceProvider && data.insuranceProvider.trim() !== "") {
    if (!data.policyNumber || data.policyNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Policy number is required when insurance provider is specified.",
        path: ["policyNumber"],
      });
    }
    if (!data.coverage || data.coverage.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Coverage details are required when insurance provider is specified.",
        path: ["coverage"],
      });
    }
    if (!data.insuranceStart || data.insuranceStart.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Insurance start date is required when insurance provider is specified.",
        path: ["insuranceStart"],
      });
    }
    if (!data.insuranceEnd || data.insuranceEnd.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Insurance end date is required when insurance provider is specified.",
        path: ["insuranceEnd"],
      });
    }
  }
});

type VendorFormType = z.infer<typeof vendorSchema>;

// Add a type for the property object returned from /api/property
interface PropertyOption {
  id: string;
  name: string;
  address?: string;
}

// Inline GoogleMapsAutocomplete component with custom dropdown
function GoogleMapsAutocomplete({ 
  onPlaceSelected, 
  className, 
  placeholder = "Enter address",
  initialValue = "" 
}: { 
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void, 
  className?: string, 
  placeholder?: string,
  initialValue?: string 
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [query, setQuery] = useState(initialValue);
  const [selectedAddress, setSelectedAddress] = useState(initialValue);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update query if initialValue changes
  useEffect(() => {
    if (initialValue && initialValue !== query) {
      setQuery(initialValue);
      setSelectedAddress(initialValue);
    }
  }, [initialValue, query]);

  // Initialize services
  useEffect(() => {
    if (!places) return;
    
    setAutocompleteService(new places.AutocompleteService());
    
    // PlacesService requires a DOM element to initialize
    const placesServiceDiv = document.createElement('div');
    setPlacesService(new places.PlacesService(placesServiceDiv));
  }, [places]);

  // Handle input changes and fetch predictions
  useEffect(() => {
    if (!autocompleteService || !query.trim()) {
      setPredictions([]);
      return;
    }

    // Don't search if the query exactly matches the selected address (prevents searching when filling from selection)
    if (query === selectedAddress && selectedAddress !== '') {
      return;
    }

    const fetchPredictions = async () => {
      try {
        const response = await autocompleteService.getPlacePredictions({
          input: query,
          componentRestrictions: { country: ['us', 'ca'] }, // Limit to US and Canada - adjust as needed
          types: ['address'], // Limit to addresses only
        });
        setPredictions(response.predictions);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching predictions:', error);
        setPredictions([]);
      }
    };

    // Debounce requests to avoid too many API calls
    const timer = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timer);
  }, [query, autocompleteService, selectedAddress]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle place selection
  const handleSelectPlace = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;

    try {
      placesService.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['geometry', 'name', 'formatted_address', 'address_components']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            // Extract street address (only street number + route)
            let streetAddress = '';
            
            if (place.address_components) {
              // Extract street number and route
              const streetNumber = place.address_components.find(comp => 
                comp.types.includes('street_number')
              )?.long_name || '';
              
              const route = place.address_components.find(comp => 
                comp.types.includes('route')
              )?.long_name || '';
              
              // Combine street number and route
              if (streetNumber && route) {
                streetAddress = `${streetNumber} ${route}`;
              } else if (route) {
                streetAddress = route;
              }
            }
            
            // Use formatted address as fallback if street address couldn't be extracted
            if (!streetAddress && place.formatted_address) {
              streetAddress = place.formatted_address;
            }
            
            // Set input value to the street address or description
            const finalAddress = streetAddress || prediction.description;
            setQuery(finalAddress);
            setSelectedAddress(finalAddress); // Store the selected address
            
            // Pass the full place object to the parent component
            onPlaceSelected(place);
            setShowDropdown(false);
          }
        }
      );
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck="false"
        onFocus={() => query.trim() && predictions.length > 0 && setShowDropdown(true)}
        onBlur={() => {
          // Small delay to allow click events on dropdown items to fire first
          setTimeout(() => {
            // If query is empty but we have a selected address, restore it
            if (!query.trim() && selectedAddress) {
              setQuery(selectedAddress);
            }
          }, 100);
        }}
      />
      
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background rounded-md border border-border shadow-md">
          <Command className="rounded-lg border-0">
            <CommandList>
              {predictions.map((prediction) => (
                <CommandItem
                  key={prediction.place_id}
                  onSelect={() => handleSelectPlace(prediction)}
                  className="cursor-pointer"
                >
                  <span>{prediction.description}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

export default function AddTaskPage() {
  const router = useRouter();
  type StepType = 'Intro' | 'Details' | 'Contact' | 'Address' | 'Service' | 'Insurance' | 'Properties' | 'Summary';
  const [step, setStep] = useState<StepType>('Intro');
  const [completedSteps, setCompletedSteps] = useState<Set<StepType>>(new Set());
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [showSecondaryAddress, setShowSecondaryAddress] = useState(false);
  const [showAddressAlert, setShowAddressAlert] = useState(false);
  const [showInsuranceAlert, setShowInsuranceAlert] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Add state to force re-render of address components when needed
  const [primaryAddressKey, setPrimaryAddressKey] = useState(0);
  const [secondaryAddressKey, setSecondaryAddressKey] = useState(0);

  const form = useForm<VendorFormType>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      company: '',
      notes: '',
      email: '',
      phone: '',
      primaryAddress: '',
      primaryAddress2: '',
      secondaryAddress: '',
      secondaryAddress2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      category: '',
      secondaryCity: '',
      secondaryState: '',
      secondaryPostalCode: '',
      secondaryCountry: '',
      insuranceProvider: '',
      policyNumber: '',
      coverage: '',
      insuranceStart: '',
      insuranceEnd: '',
    },
  });
  
  // Force re-render of address components when step changes to Address
  useEffect(() => {
    if (step === 'Address') {
      setPrimaryAddressKey(prev => prev + 1);
      setSecondaryAddressKey(prev => prev + 1);
    }
  }, [step]);

  // Helper: step order
  const getStepOrder = (): StepType[] => ['Intro', 'Details', 'Contact', 'Address', 'Service', 'Insurance', 'Properties', 'Summary'];

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

    // Define fields for each step that require validation before proceeding
    const fieldsToValidateForStep: Partial<Record<StepType, (keyof VendorFormType)[]>> = {
      Details: ['firstName', 'lastName', 'company'],
      Contact: ['email'], 
      Address: ['primaryAddress', 'city', 'state', 'postalCode', 'country'],
      Service: ['category'],
      Insurance: ['insuranceProvider', 'policyNumber', 'coverage', 'insuranceStart', 'insuranceEnd'],
      // Properties step has custom logic in its button's disabled state
    };

    // Address step: show alert if primaryAddress is empty
    if (step === "Address" && !options?.skipAddressValidationOverride) {
      const primaryAddress = form.getValues("primaryAddress");
      console.log('Address validation - primaryAddress value:', primaryAddress);
      if (!primaryAddress || primaryAddress.trim() === "") {
        setShowAddressAlert(true);
        return; // Stop here, don't proceed
      }
    }
    
    // For debugging
    if (step === "Address") {
      const values = form.getValues();
      console.log('Address form values before validation:', {
        primaryAddress: values.primaryAddress,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country
      });
    }

    // Insurance step: show alert if insuranceProvider is empty (and not already skipping)
    if (step === "Insurance" && !options?.skipInsuranceValidationOverride) {
      const insuranceProvider = form.getValues("insuranceProvider");
      if (!insuranceProvider || insuranceProvider.trim() === "") {
        // If provider is empty, offer to skip.
        // If other insurance fields were filled, the skip action will clear them.
        setShowInsuranceAlert(true);
        return; // Stop here, don't proceed
      }
    }

    // Only validate address fields if not skipping
    let validationPassed = true;
    const fieldsForCurrentStep = fieldsToValidateForStep[step];
    if (fieldsForCurrentStep && fieldsForCurrentStep.length > 0) {
      let shouldBypassValidationForThisStep = false;
      if (step === "Address" && options?.skipAddressValidationOverride) {
        shouldBypassValidationForThisStep = true;
      }
      if (step === "Insurance" && options?.skipInsuranceValidationOverride) {
        // If user chose to skip insurance (implies provider was empty and they confirmed),
        // we bypass this step's specific client-side validation.
        shouldBypassValidationForThisStep = true;
      }

      if (!shouldBypassValidationForThisStep) {
        validationPassed = await form.trigger(fieldsForCurrentStep);
      }
    }

    if (!validationPassed) {
      toast.error("Please correct the errors on the page before proceeding.");
      return; // Stop if validation failed
    }

    // If validation passed or no specific validation needed for this step's "Next" button
    if (currentIndex < stepOrder.length - 1) {
      markStepCompleted(step);
      setStep(stepOrder[currentIndex + 1]);
    } else {
      // This case would be if "Next" is clicked on the last step (e.g. Summary).
      // However, the Summary step uses a dedicated submit button.
      // If this path is reached, it implies a final submission attempt.
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

  const secondaryAddressCheckboxId = useId();

  // Helper to clear all secondary address fields
  const clearSecondaryAddressFields = () => {
    form.setValue('secondaryAddress', '');
    form.setValue('secondaryCity', '');
    form.setValue('secondaryState', '');
    form.setValue('secondaryPostalCode', '');
    form.setValue('secondaryCountry', '');
  };

  const handleSubmit = async (data: VendorFormType) => {
    console.log("Submit button clicked, form data:", data);
    setSubmitting(true);
    try {
      // Map form data to backend schema
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        about_you: data.notes,
        services: {
          categories: [data.category], // or multiple if your UI allows
          classifications: selectedClassification ? [selectedClassification] : []
        },
        address_info: {
          primary: {
            street: data.primaryAddress,
            city: data.city,
            province: data.state,
            postalCode: data.postalCode,
            country: data.country
          },
          secondary: showSecondaryAddress ? {
            street: data.secondaryAddress,
            city: data.secondaryCity,
            province: data.secondaryState,
            postalCode: data.secondaryPostalCode,
            country: data.secondaryCountry
          } : null
        },
        properties_access: {
          type: propertyAccess,
          property_ids: propertyAccess === "specific" ? specificProperties : undefined
        },
        insurance: data.insuranceProvider
          ? {
              provider: data.insuranceProvider,
              policy_number: data.policyNumber,
              coverage: data.coverage,
              effective_date: data.insuranceStart,
              expiration_date: data.insuranceEnd
            }
          : {}
      };

      const response = await fetch('/api/people/vendor/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create vendor');
      }

      toast.success('Vendor created successfully');
      router.push('/people'); // redirect to /people
    } catch (error) {
      console.error('Error creating vendor:', error);
      toast.error('Failed to create vendor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderIntroForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Getting Started</h1>
      <p className="mb-6 text-muted-foreground">Let&apos;s set up a new vendor in your system.</p>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-medium text-primary">Adding a new vendor</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="relative w-[300px] h-[300px]">
            <Image
              src="/assets/figures/new-vendor.png"
              alt="Adding Vendor Illustration"
              sizes="(max-width: 768px) 100vw, 300px"
              style={{ objectFit: "contain" }}
              fill
            />
          </div>
         
          <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
            Once created, the vendor will be added to the vendor list and assigned to the selected assignee.
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={() => handleNext()}>Next</Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderDetailsForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Details</h1>
      <p className="mb-6 text-muted-foreground">Enter the vendor&apos;s personal information.</p>
      
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Middle name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes about this vendor (optional)" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      
      <div className="flex w-full justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
        <Button onClick={() => handleNext()} type="button">Next</Button>
      </div>
    </div>
  );

  const renderContactForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Contact</h1>
      <p className="mb-6 text-muted-foreground">Enter the vendor&apos;s contact information.</p>
      
      <Form {...form}>
        <form className="space-y-6">
          <div className="max-w-md mx-auto space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <PhoneNumberInput
                      placeholder="Phone number"
                      value={value as Value}
                      onChange={onChange}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
      
      <div className="flex w-full justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
        <Button onClick={() => handleNext()} type="button">Next</Button>
      </div>
    </div>
  );

  const renderAddressForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Address</h1>
      <p className="mb-6 text-muted-foreground">Enter the vendor&apos;s address information.</p>
      
      <Form {...form}>
        <form className="space-y-6">
          <div className="border rounded-md p-6 space-y-4 w-full">
            <h3 className="text-lg font-semibold">Primary address</h3>
            <FormField
              control={form.control}
              name="primaryAddress"
              render={() => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <GoogleMapsAutocomplete
                      key={primaryAddressKey}
                      initialValue={form.getValues("primaryAddress")}
                      onPlaceSelected={(place) => {
                        // Extract street address (only street number + route)
                        let streetAddress = '';
                        let city = '';
                        let state = '';
                        let postalCode = '';
                        let country = '';
                        
                        if (place.address_components) {
                          // Extract street number and route
                          const streetNumber = place.address_components.find(comp => 
                            comp.types.includes('street_number')
                          )?.long_name || '';
                          
                          const route = place.address_components.find(comp => 
                            comp.types.includes('route')
                          )?.long_name || '';
                          
                          // Combine street number and route
                          if (streetNumber && route) {
                            streetAddress = `${streetNumber} ${route}`;
                          } else if (route) {
                            streetAddress = route;
                          }
                          
                          // Extract other address components
                          for (const comp of place.address_components) {
                            if (comp.types.includes('locality')) city = comp.long_name;
                            if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                            if (comp.types.includes('postal_code')) postalCode = comp.long_name;
                            if (comp.types.includes('country')) country = comp.long_name;
                          }
                        }
                        
                        // Use formatted address as fallback if street address couldn't be extracted
                        if (!streetAddress && place.formatted_address) {
                          streetAddress = place.formatted_address;
                        }
                        
                        console.log('Setting primary address values:', {
                          streetAddress,
                          city,
                          state,
                          postalCode,
                          country
                        });
                        
                        // Set form values and trigger form validation
                        form.setValue('primaryAddress', streetAddress, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        form.setValue('city', city, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        form.setValue('state', state, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        form.setValue('postalCode', postalCode, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        form.setValue('country', country, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryAddress2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
                  <FormControl>
                    <Input
                      
                      placeholder="Apartment, suite, etc. (optional)"
                      autoComplete="address-line2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City" 
                        autoComplete="address-level2"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="State/Province" 
                        autoComplete="address-level1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Postal code" 
                        autoComplete="postal-code"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Country" 
                        autoComplete="country-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
        <div className="flex items-center gap-2 mt-4">
          <Checkbox
            id={secondaryAddressCheckboxId}
            checked={showSecondaryAddress}
            onCheckedChange={(checked) => {
              setShowSecondaryAddress(checked === true);
              if (!checked) {
                clearSecondaryAddressFields();
              }
            }}
          />
          <Label htmlFor={secondaryAddressCheckboxId}
            className="text-base font-medium"
          >
            Secondary address
          </Label>
        </div>
        {showSecondaryAddress && (
          <form className="space-y-6 mt-6">
            <div className="border rounded-md p-6 space-y-4 w-full">
              <h3 className="text-lg font-semibold">Secondary address</h3>
              <FormField
                control={form.control}
                name="secondaryAddress"
                render={() => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <GoogleMapsAutocomplete
                        key={secondaryAddressKey}
                        initialValue={form.getValues("secondaryAddress")}
                        onPlaceSelected={(place) => {
                          // Extract street address (only street number + route)
                          let streetAddress = '';
                          let city = '';
                          let state = '';
                          let postalCode = '';
                          let country = '';
                          
                          if (place.address_components) {
                            // Extract street number and route
                            const streetNumber = place.address_components.find(comp => 
                              comp.types.includes('street_number')
                            )?.long_name || '';
                            
                            const route = place.address_components.find(comp => 
                              comp.types.includes('route')
                            )?.long_name || '';
                            
                            // Combine street number and route
                            if (streetNumber && route) {
                              streetAddress = `${streetNumber} ${route}`;
                            } else if (route) {
                              streetAddress = route;
                            }
                            
                            // Extract other address components
                            for (const comp of place.address_components) {
                              if (comp.types.includes('locality')) city = comp.long_name;
                              if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                              if (comp.types.includes('postal_code')) postalCode = comp.long_name;
                              if (comp.types.includes('country')) country = comp.long_name;
                            }
                          }
                          
                          // Use formatted address as fallback if street address couldn't be extracted
                          if (!streetAddress && place.formatted_address) {
                            streetAddress = place.formatted_address;
                          }
                          
                          console.log('Setting secondary address values:', {
                            streetAddress,
                            city,
                            state,
                            postalCode,
                            country
                          });
                          
                          // Set form values and trigger form validation
                          form.setValue('secondaryAddress', streetAddress, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                          form.setValue('secondaryCity', city, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                          form.setValue('secondaryState', state, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                          form.setValue('secondaryPostalCode', postalCode, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                          form.setValue('secondaryCountry', country, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryAddress2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apartment, suite, etc. (optional)"
                        autoComplete="address-line2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="secondaryCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City"
                          autoComplete="address-level2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="State/Province"
                          autoComplete="address-level1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="secondaryPostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Postal code"
                          autoComplete="postal-code"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Country"
                          autoComplete="country-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        )}
      </Form>
      
      <div className="flex w-full justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
        <Button onClick={() => handleNext()} type="button">Next</Button>
      </div>
    </div>
  );

  const serviceSelectId = useId();
  const [serviceSelectOpen, setServiceSelectOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<{ value: string; label: string }[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<{ value: string; label: string }[]>([]);

  const [vendorClassifications, setVendorClassifications] = useState<{ value: string; label: string; type: 'default' | 'custom' }[]>([]);
  const [classificationSelectOpen, setClassificationSelectOpen] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [addingClassification, setAddingClassification] = useState(false);
  const [newClassification, setNewClassification] = useState('');
  const classificationSelectId = useId();

  const propertiesRadioId = useId();
  const [propertyAccess, setPropertyAccess] = useState<'all' | 'specific' | ''>('');
  const [specificProperties, setSpecificProperties] = useState<string[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/company/settings/vendor-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: '' }), // empty category to just fetch
        credentials: 'include'
      });
      const data = await res.json();
      if (data.vendor_categories) {
        setCustomCategories(
          (data.vendor_categories.custom || []).map((cat: string) => ({
            value: cat.toLowerCase().replace(/\s+/g, '_'),
            label: cat
          }))
        );
        setDefaultCategories(
          (data.vendor_categories.default || []).map((cat: string) => ({
            value: cat.toLowerCase().replace(/\s+/g, '_'),
            label: cat.charAt(0).toUpperCase() + cat.slice(1)
          }))
        );
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchClassifications = async () => {
      try {
        // To fetch all, send empty classification (like categories)
        const res = await fetch('/api/company/settings/vendor-classification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classification: '' }),
          credentials: 'include',
        });
        const data = await res.json();
        if (data.vendor_classifications) {
          const { custom = [], default: defaults = [] } = data.vendor_classifications;
          setVendorClassifications([
            ...defaults.map((c: string) => ({ value: c.toLowerCase().replace(/\s+/g, '_'), label: c.charAt(0).toUpperCase() + c.slice(1), type: 'default' })),
            ...custom.map((c: string) => ({ value: c.toLowerCase().replace(/\s+/g, '_'), label: c, type: 'custom' })),
          ]);
        }
      } catch {
        toast.error('Failed to fetch vendor classifications');
      }
    };
    fetchClassifications();
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const res = await fetch('/api/property');
        if (!res.ok) throw new Error('Failed to fetch properties');
        const data: PropertyOption[] = await res.json();
        setPropertyOptions(
          data.map((p) => ({
            value: p.id,
            label: p.name + (p.address ? ` — ${p.address}` : ''),
          }))
        );
      } catch {
        setPropertyOptions([]);
      } finally {
        setLoadingProperties(false);
      }
    };
    fetchProperties();
  }, []);

  const handleAddClassification = async (classificationValue?: string) => {
    const valueToAdd = (typeof classificationValue === 'string' ? classificationValue : newClassification).trim();
    if (!valueToAdd) return;
    setAddingClassification(true);
    try {
      const res = await fetch('/api/company/settings/vendor-classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification: valueToAdd }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.vendor_classifications) {
        const { custom = [], default: defaults = [] } = data.vendor_classifications;
        setVendorClassifications([
          ...defaults.map((c: string) => ({ value: c.toLowerCase().replace(/\s+/g, '_'), label: c.charAt(0).toUpperCase() + c.slice(1), type: 'default' })),
          ...custom.map((c: string) => ({ value: c.toLowerCase().replace(/\s+/g, '_'), label: c, type: 'custom' })),
        ]);
        setNewClassification('');
        toast.success('Classification added');
      } else {
        toast.error(data.error || 'Failed to add classification');
      }
    } catch {
      toast.error('Failed to add classification');
    } finally {
      setAddingClassification(false);
    }
  };

  const renderServiceForm = () => {
    const value = form.watch("category");
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Service</h1>
        <p className="mb-6 text-muted-foreground">Select the vendor category for this service.</p>
        <div className="flex justify-center mb-4">
          <div className="text-base font-medium">What category of service does this vendor provide?</div>
        </div>
        <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
          {/* Vendor Category Popover (now first) */}
          <div className="w-full">
            <Label htmlFor={serviceSelectId}>Vendor Category</Label>
            <Popover open={serviceSelectOpen} onOpenChange={setServiceSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={serviceSelectId}
                  variant="outline"
                  role="combobox"
                  aria-expanded={serviceSelectOpen}
                  className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
                >
                  <span className={cn("truncate", !value && "text-muted-foreground")}> 
                    {value
                      ? [...defaultCategories, ...customCategories].find(
                          (cat) => cat.value === value
                        )?.label
                      : "Select category"}
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className="text-muted-foreground/80 shrink-0"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Find category" />
                  <CommandList>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup heading="Default Categories">
                      {defaultCategories.map((cat) => (
                        <CommandItem
                          key={cat.value}
                          value={cat.value}
                          onSelect={(currentValue) => {
                            form.setValue("category", currentValue);
                            setServiceSelectOpen(false);
                          }}
                        >
                          {cat.label}
                          {value === cat.value && (
                            <CheckIcon size={16} className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Custom Categories">
                      {customCategories.length === 0 ? (
                        <div className="px-2 py-1 text-muted-foreground text-sm">No custom categories</div>
                      ) : (
                        customCategories.map((cat) => (
                          <CommandItem
                            key={cat.value}
                            value={cat.value}
                            onSelect={(currentValue) => {
                              form.setValue("category", currentValue);
                              setServiceSelectOpen(false);
                            }}
                          >
                            {cat.label}
                            {value === cat.value && (
                              <CheckIcon size={16} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-normal mt-2"
                      >
                        <PlusIcon
                          size={16}
                          className="-ms-2 opacity-60"
                          aria-hidden="true"
                        />
                        New vendor category
                      </Button>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {/* Vendor Classifications Popover (now second) */}
          <div className="w-full">
            <div className="flex justify-center mb-4">
              <div className="text-base font-medium">What classification does this vendor fall under?</div>
            </div>
            <Label htmlFor={classificationSelectId}>Vendor Classifications</Label>
            <Popover open={classificationSelectOpen} onOpenChange={setClassificationSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={classificationSelectId}
                  variant="outline"
                  role="combobox"
                  aria-expanded={classificationSelectOpen}
                  className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
                >
                  <span className={cn("truncate", !selectedClassification && "text-muted-foreground")}>{
                    selectedClassification
                      ? vendorClassifications.find((c) => c.value === selectedClassification)?.label
                      : 'Select classification'
                  }</span>
                  <ChevronDownIcon
                    size={16}
                    className="text-muted-foreground/80 shrink-0"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Find classification" />
                  <CommandList>
                    <CommandEmpty>No classification found.</CommandEmpty>
                    <CommandGroup heading="Default Classifications">
                      {vendorClassifications.filter(c => c.type === 'default').map((cls) => (
                        <CommandItem
                          key={cls.value}
                          value={cls.value}
                          onSelect={() => {
                            setSelectedClassification(cls.value);
                            setClassificationSelectOpen(false);
                          }}
                        >
                          {cls.label}
                          {selectedClassification === cls.value && (
                            <CheckIcon size={16} className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Custom Classifications">
                      {vendorClassifications.filter(c => c.type === 'custom').length === 0 ? (
                        <div className="px-2 py-1 text-muted-foreground text-sm">No custom classifications</div>
                      ) : (
                        vendorClassifications.filter(c => c.type === 'custom').map((cls) => (
                          <CommandItem
                            key={cls.value}
                            value={cls.value}
                            onSelect={() => {
                              setSelectedClassification(cls.value);
                              setClassificationSelectOpen(false);
                            }}
                          >
                            {cls.label}
                            {selectedClassification === cls.value && (
                              <CheckIcon size={16} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-normal mt-2"
                        onClick={async (e) => {
                          e.preventDefault();
                          const value = window.prompt('Enter new vendor classification');
                          if (value && value.trim()) {
                            setNewClassification(value);
                            await handleAddClassification(value);
                          }
                        }}
                        disabled={addingClassification}
                      >
                        <PlusIcon
                          size={16}
                          className="-ms-2 opacity-60"
                          aria-hidden="true"
                        />
                        New vendor classification
                      </Button>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex w-full justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
          <Button onClick={() => handleNext()} type="button">Next</Button>
        </div>
      </div>
    );
  };

  const renderInsuranceForm = () => (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Insurance</h1>
      <p className="mb-6 text-muted-foreground">Fill in the insurance information for this step.</p>
      <Form {...form}>
        <form className="space-y-8 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Provider name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Policy number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage</FormLabel>
                    <FormControl>
                      <Input placeholder="Coverage details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Start Date</FormLabel>
                      <FormControl>
                        <CalendarInput
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date: Date | undefined) => field.onChange(date ? date : undefined)}
                          className="w-full"
                          placeholder="Select start date"
                          disabled={field.disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="insuranceEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance End Date</FormLabel>
                      <FormControl>
                        <CalendarInput
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date: Date | undefined) => field.onChange(date ? date : undefined)}
                          className="w-full"
                          placeholder="Select end date"
                          disabled={field.disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
      <div className="flex w-full justify-between mt-8">
        <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
        <Button onClick={() => handleNext()} type="button">Next</Button>
      </div>
    </div>
  );

  const renderPropertiesForm = () => {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Properties</h1>
        <p className="mb-6 text-muted-foreground">Specify which properties this vendor can work on.</p>
        <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
          <RadioGroup
            className="gap-2 w-full"
            value={propertyAccess}
            onValueChange={v => setPropertyAccess(v as 'all' | 'specific' | '')}
          >
            {/* Radio card #1: All properties */}
            <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
              <RadioGroupItem
                value="all"
                id={`${propertiesRadioId}-1`}
                aria-describedby={`${propertiesRadioId}-1-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="flex grow items-start gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--success-light))]">
                  <Building className="text-[hsl(var(--primary))]" size={24} />
                </div>
                <div className="grid grow gap-2">
                  <Label htmlFor={`${propertiesRadioId}-1`}>
                    This vendor can work on all my properties
                  </Label>
                  <p
                    id={`${propertiesRadioId}-1-description`}
                    className="text-muted-foreground text-xs"
                  >
                    The vendor will be available for every property you manage.
                  </p>
                </div>
              </div>
            </div>
            {/* Radio card #2: Specific properties */}
            <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
              <RadioGroupItem
                value="specific"
                id={`${propertiesRadioId}-2`}
                aria-describedby={`${propertiesRadioId}-2-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="flex grow items-start gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--success-light))]">
                  <DoorClosed className="text-[hsl(var(--primary))]" size={24} />
                </div>
                <div className="grid grow gap-2">
                  <Label htmlFor={`${propertiesRadioId}-2`}>
                    This vendor can work on specific properties
                    <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
                      {" "}(Custom)
                    </span>
                  </Label>
                  <p
                    id={`${propertiesRadioId}-2-description`}
                    className="text-muted-foreground text-xs"
                  >
                    Select which properties this vendor can work on.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
          {propertyAccess === 'specific' && (
            <div className="w-full mt-4">
              <Label>Select specific properties</Label>
              <MultiSelect
                options={propertyOptions}
                selected={specificProperties}
                onChange={setSpecificProperties}
                placeholder={loadingProperties ? "Loading properties..." : "Select properties"}
              />
              <p
                className="text-muted-foreground mt-2 text-xs"
                role="region"
                aria-live="polite"
              >
                {loadingProperties ? "Loading property list..." : "Select one or more properties for this vendor."}
              </p>
            </div>
          )}
        </div>
        <div className="flex w-full justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} type="button">Previous</Button>
          <Button
            onClick={() => handleNext()}
            type="button"
            disabled={
              !propertyAccess ||
              (propertyAccess === 'specific' && specificProperties.length === 0)
            }
          >
            Next
          </Button>
        </div>
      </div>
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
              // Clear all insurance fields upon skipping
              form.setValue('insuranceProvider', '');
              form.setValue('policyNumber', '');
              form.setValue('coverage', '');
              form.setValue('insuranceStart', '');
              form.setValue('insuranceEnd', '');
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
          <h2 className="mb-6 text-xl font-semibold tracking-tight">Add a Vendor</h2>
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
              {step === 'Details' && renderDetailsForm()}
              {step === 'Contact' && renderContactForm()}
              {step === 'Address' && renderAddressForm()}
              {step === 'Service' && renderServiceForm()}
              {step === 'Insurance' && renderInsuranceForm()}
              {step === 'Properties' && renderPropertiesForm()}
              {step === 'Summary' && renderSummaryForm()}
            </div>
          </div>
        </div>
      </div>
    </APIProvider>
  );
} 