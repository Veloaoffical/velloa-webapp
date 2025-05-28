'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

interface PersonDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string;
  unit_id: string | null;
  role: string;
  unit?: {
    unit_number: string;
    property_name?: string;
  } | null;
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
  address_info?: {
    primary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
    secondary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    } | null;
  };
}

interface AddressInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

// Google Maps Autocomplete component
function GoogleMapsAutocomplete({ 
  onPlaceSelected, 
  onManualChange,
  className, 
  placeholder = "Enter address",
  initialValue = "" 
}: { 
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void, 
  onManualChange?: (value: string) => void,
  className?: string, 
  placeholder?: string,
  initialValue?: string 
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [query, setQuery] = React.useState(initialValue);
  const [selectedAddress, setSelectedAddress] = React.useState(initialValue);
  const [predictions, setPredictions] = React.useState<google.maps.places.AutocompletePrediction[]>([]);
  const [autocompleteService, setAutocompleteService] = React.useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = React.useState<google.maps.places.PlacesService | null>(null);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Update query if initialValue changes
  React.useEffect(() => {
    if (initialValue !== query) {
      setQuery(initialValue);
      setSelectedAddress(initialValue);
    }
  }, [initialValue, query]);

  // Initialize services
  React.useEffect(() => {
    if (!places) return;
    
    setAutocompleteService(new places.AutocompleteService());
    
    // PlacesService requires a DOM element to initialize
    const placesServiceDiv = document.createElement('div');
    setPlacesService(new places.PlacesService(placesServiceDiv));
  }, [places]);

  // Handle input changes and fetch predictions
  React.useEffect(() => {
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
  React.useEffect(() => {
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
        onChange={(e) => {
          setQuery(e.target.value);
          onManualChange?.(e.target.value);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="new-password"
        autoCorrect="off"
        spellCheck="false"
        onFocus={() => query.trim() && predictions.length > 0 && setShowDropdown(true)}
        onBlur={() => {
          // Small delay to allow click events on dropdown items to fire first
          setTimeout(() => {
            setShowDropdown(false);
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

function AddressInformationDialogContent({ open, onOpenChange, personDetails }: AddressInformationDialogProps) {
  const [addressInfo, setAddressInfo] = React.useState({
    primary: {
      street: personDetails.address_info?.primary?.street || '',
      city: personDetails.address_info?.primary?.city || '',
      province: personDetails.address_info?.primary?.province || '',
      postalCode: personDetails.address_info?.primary?.postalCode || '',
      country: personDetails.address_info?.primary?.country || ''
    },
    secondary: personDetails.address_info?.secondary ? {
      street: personDetails.address_info.secondary.street || '',
      city: personDetails.address_info.secondary.city || '',
      province: personDetails.address_info.secondary.province || '',
      postalCode: personDetails.address_info.secondary.postalCode || '',
      country: personDetails.address_info.secondary.country || ''
    } : null
  });
  const [hasSecondaryAddress, setHasSecondaryAddress] = React.useState(!!personDetails.address_info?.secondary);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastProps, setToastProps] = React.useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }>({ title: "", description: "" });
  const [primaryAddressKey, setPrimaryAddressKey] = React.useState(0);
  const [secondaryAddressKey, setSecondaryAddressKey] = React.useState(0);

  const router = useRouter();

  // Force re-render of address components when dialog opens
  React.useEffect(() => {
    if (open) {
      setPrimaryAddressKey(prev => prev + 1);
      setSecondaryAddressKey(prev => prev + 1);
    }
  }, [open]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address_info: {
            primary: addressInfo.primary,
            secondary: hasSecondaryAddress ? addressInfo.secondary : null
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update address information');
      }

      setToastProps({
        title: "Success",
        description: "Address information updated successfully",
      });
      setShowToast(true);

      // Auto-dismiss toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      // Refresh the page to show updated data
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating address information:', error);
      setToastProps({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update address information',
        variant: "destructive",
      });
      setShowToast(true);

      // Auto-dismiss error toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Address Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Primary Address</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="street">Street Address</Label>
                  <GoogleMapsAutocomplete
                    key={primaryAddressKey}
                    initialValue={addressInfo.primary.street}
                    onManualChange={(value) => {
                      // Update only the street address when manually typing
                      setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, street: value }
                      }));
                    }}
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
                      
                      // Update address info
                      setAddressInfo(prev => ({
                        ...prev,
                        primary: {
                          street: streetAddress,
                          city: city,
                          province: state,
                          postalCode: postalCode,
                          country: country
                        }
                      }));
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={addressInfo.primary.city}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, city: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="province">Province/State</Label>
                    <Input
                      id="province"
                      value={addressInfo.primary.province}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, province: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={addressInfo.primary.postalCode}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, postalCode: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={addressInfo.primary.country}
                      onChange={(e) => setAddressInfo(prev => ({
                        ...prev,
                        primary: { ...prev.primary, country: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasSecondaryAddress"
                checked={hasSecondaryAddress}
                onCheckedChange={(checked) => {
                  setHasSecondaryAddress(checked === true);
                  if (checked && !addressInfo.secondary) {
                    setAddressInfo(prev => ({
                      ...prev,
                      secondary: {
                        street: '',
                        city: '',
                        province: '',
                        postalCode: '',
                        country: ''
                      }
                    }));
                  }
                }}
              />
              <Label htmlFor="hasSecondaryAddress">Add Secondary Address</Label>
            </div>

            {hasSecondaryAddress && addressInfo.secondary && (
              <div>
                <h3 className="text-sm font-medium mb-2">Secondary Address</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="secondary-street">Street Address</Label>
                    <GoogleMapsAutocomplete
                      key={secondaryAddressKey}
                      initialValue={addressInfo.secondary.street}
                      onManualChange={(value) => {
                        // Update only the street address when manually typing
                        setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            street: value
                          } : null
                        }));
                      }}
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
                        
                        // Update secondary address info
                        setAddressInfo(prev => ({
                          ...prev,
                          secondary: {
                            street: streetAddress,
                            city: city,
                            province: state,
                            postalCode: postalCode,
                            country: country
                          }
                        }));
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-city">City</Label>
                      <Input
                        id="secondary-city"
                        value={addressInfo.secondary.city}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            city: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-province">Province/State</Label>
                      <Input
                        id="secondary-province"
                        value={addressInfo.secondary.province}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            province: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-postalCode">Postal Code</Label>
                      <Input
                        id="secondary-postalCode"
                        value={addressInfo.secondary.postalCode}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            postalCode: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="secondary-country">Country</Label>
                      <Input
                        id="secondary-country"
                        value={addressInfo.secondary.country}
                        onChange={(e) => setAddressInfo(prev => ({
                          ...prev,
                          secondary: prev.secondary ? {
                            ...prev.secondary,
                            country: e.target.value
                          } : null
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-[#16B364] hover:bg-[#16B364]/90"
          >
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Toast */}
      <ToastProvider duration={toastProps.variant === "destructive" ? 5000 : 3000}>
        {showToast && (
          <Toast 
            variant={toastProps.variant} 
            onOpenChange={setShowToast}
            open={showToast}
          >
            <div className="grid gap-1">
              <ToastTitle>{toastProps.title}</ToastTitle>
              <ToastDescription>
                {toastProps.description}
              </ToastDescription>
            </div>
            <ToastClose />
          </Toast>
        )}
        <ToastViewport className="fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-auto sm:right-4 sm:top-4 sm:flex-col md:max-w-[420px]" />
      </ToastProvider>
    </Dialog>
  );
}

export function AddressInformationDialog(props: AddressInformationDialogProps) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <AddressInformationDialogContent {...props} />
    </APIProvider>
  );
} 