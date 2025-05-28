"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Search } from "lucide-react"
import Image from "next/image"

// Interfaces matching the ones in add-prospect page
interface PropertyAddress {
  address_line_1?: string
  city?: string
  state?: string
  zip?: string
  street?: string
  province?: string
  postal_code?: string
  country?: string
}

interface ImageData {
  id: string
  url?: string
  fileUrl?: string
  image_url?: string
  file_name?: string
  fileName?: string
  createdAt?: string
  favorite?: boolean
  isFavorite?: boolean
}

interface Property {
  id: string
  name: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  zip: string
}

interface Unit {
  unit_name: string
  beds: number | null
  baths: number | null
  size: number | null
  created_at: string
  market_rent: number | null
  status: string
  available_date: string | null
  property_id: string
  unit_id: string
  unit_images: ImageData[]
  properties: Property
}

interface UnitListing {
  listingid: string
  created_at: string
  property_title: string | null
  listing_description: string | null
  amenities: Record<string, unknown> | null
  available_date: string | null
  status: string | null
  unitid: string | null
  propertyId: string | null
  views: number | null
  leads: number | null
  beds: number | null
  baths: number | null
  images: ImageData[] | null
  type: string | null
  size_sqft: number | null
  applications_filled: number | null
  property_address: PropertyAddress | null
  unit_title: string | null
  price: number | null
  units?: Unit // Optional reference to joined units table
}

interface PropertiesPageProps {
  onNext: () => void
  onPrevious: () => void
  initialSelectedProperties?: string[] // Add optional prop for initial state
}

export default function PropertiesPage({ onNext, onPrevious, initialSelectedProperties = [] }: PropertiesPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProperties, setSelectedProperties] = useState<string[]>(initialSelectedProperties)
  const [listings, setListings] = useState<UnitListing[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(true)
  const [listingsError, setListingsError] = useState<string | null>(null)
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false)

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoadingListings(true)
        setListingsError(null)
        
        const response = await fetch('/api/unit-listings/published')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        setListings(data)
      } catch (error) {
        console.error('Detailed Error:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
        setListingsError(
          error instanceof Error 
            ? error.message 
            : 'Failed to load available properties. Please try again later.'
        )
      } finally {
        setIsLoadingListings(false)
      }
    }

    fetchListings()
  }, [])

  const togglePropertySelection = (propertyId: string) => {
    console.log('[togglePropertySelection] Toggling property ID:', propertyId);
    console.log('[togglePropertySelection] State BEFORE:', selectedProperties); // Log state before update

    let newSelectedProperties;
    if (selectedProperties.includes(propertyId)) {
      newSelectedProperties = selectedProperties.filter((id) => id !== propertyId);
      console.log('[togglePropertySelection] Removing ID. New state will be:', newSelectedProperties);
    } else {
      newSelectedProperties = [...selectedProperties, propertyId];
      console.log('[togglePropertySelection] Adding ID. New state will be:', newSelectedProperties);
    }
    setSelectedProperties(newSelectedProperties);
    
    // Also update localStorage immediately with each selection change
    const saveData = { listing: true, listing_id: newSelectedProperties };
    console.log('[togglePropertySelection] Saving to localStorage with listing_id:', saveData.listing_id);
    localStorage.setItem('prospectSelectedProperties', JSON.stringify(saveData));
    
    // Manual verification to confirm data is correctly stored
    const verifyData = localStorage.getItem('prospectSelectedProperties');
    console.log('[togglePropertySelection] Verification - localStorage contains:', verifyData);
  }

  // Add a useEffect to monitor changes to selectedProperties
  useEffect(() => {
    console.log('[useEffect selectedProperties] Current state:', selectedProperties);
  }, [selectedProperties]);

  const clearSelection = () => {
    setSelectedProperties([]);
    // Update localStorage when clearing
    const saveData = { listing: true, listing_id: [] };
    console.log('[clearSelection] Clearing selection in localStorage');
    localStorage.setItem('prospectSelectedProperties', JSON.stringify(saveData));
  }

  const filteredListings = listings.filter(
    (listing) => {
      const propertyName = listing.units?.properties?.name || listing.property_title || ''
      const unitName = listing.units?.unit_name || listing.unit_title || ''
      const address = listing.property_address?.address_line_1 || 
                      listing.property_address?.street || 
                      listing.units?.properties?.address_line_1 || ''
      const city = listing.property_address?.city || 
                   listing.units?.properties?.city || ''
      
      const searchTerms = [propertyName, unitName, address, city].join(' ').toLowerCase()
      return searchTerms.includes(searchQuery.toLowerCase())
    }
  )

  const renderListing = (listing: UnitListing) => {
    // Find the image URL to use from the images array in the listing
    let imageUrl = '/placeholder.svg?height=200&width=400' // Default placeholder
    
    if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
      // Try multiple possible property names for the URL
      const firstImage = listing.images[0]
      imageUrl = firstImage.url || 
                firstImage.fileUrl || 
                firstImage.image_url || 
                '/placeholder.svg?height=200&width=400'
    }
    
    // Try to get unit and property info either from joined unit or from listing directly
    const unitName = listing.units?.unit_name || listing.unit_title || 'Unknown Unit'
    const propertyName = listing.units?.properties?.name || listing.property_title || 'Unknown Property'
    
    // Get property address from either joined property or direct listing data
    const propertyAddress: PropertyAddress = listing.property_address || {
      address_line_1: listing.units?.properties?.address_line_1 || '',
      city: listing.units?.properties?.city || '',
      state: listing.units?.properties?.state || '',
      zip: listing.units?.properties?.zip || ''
    }
    
    const listingId = listing.listingid
    console.log(`[renderListing] Preparing card. Listing ID used: ${listingId}`);

    const availability = listing.available_date
      ? `Available ${new Date(listing.available_date).toLocaleDateString()}`
      : "Available Soon"

    return (
      <div
        key={listingId}
        className={`relative cursor-pointer rounded-lg border border-border bg-background/5 overflow-hidden transition-all ${
          selectedProperties.includes(listingId) ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => {
          console.log(`[onClick] Card clicked! Passing listingId to toggle: ${listingId}`);
          togglePropertySelection(listingId);
        }}
      >
        {selectedProperties.includes(listingId) && (
          <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
        <div className="aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={propertyName}
            className="h-full w-full object-cover"
            width={400}
            height={200}
            priority={false}
          />
        </div>
        <div className="p-4">
          <h3 className="mb-1 font-medium">{propertyName} - {unitName}</h3>
          <p className="text-sm text-muted-foreground">
            {propertyAddress.address_line_1 || propertyAddress.street || ''}
            <br />
            {propertyAddress.city || ''}, {propertyAddress.state || propertyAddress.province || ''} {propertyAddress.zip || propertyAddress.postal_code || ''}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{availability}</span>
          </div>
        </div>
      </div>
    )
  }

  const handleNext = () => {
    console.log('[handleNext] Current selectedProperties:', selectedProperties);
    if (selectedProperties.length === 0) {
      setShowSkipConfirmation(true);
    } else {
      // Store selected properties in localStorage in the new format
      const saveData = { listing: true, listing_id: selectedProperties };
      console.log('[PropertiesPage] Saving to localStorage:', saveData);
      console.log('[PropertiesPage] Save data listing_id values:', saveData.listing_id);
      localStorage.setItem('prospectSelectedProperties', JSON.stringify(saveData));
      
      // Verify data is correctly saved
      const verifyData = localStorage.getItem('prospectSelectedProperties');
      console.log('[PropertiesPage] Verification - localStorage now contains:', verifyData);
      
      onNext();
    }
  };

  const handleSkip = () => {
    setShowSkipConfirmation(false);
    // Clear selected properties and store { listing: false }
    setSelectedProperties([]);
    const saveData = { listing: false };
    console.log('[PropertiesPage] Saving skipped state to localStorage:', saveData);
    localStorage.setItem('prospectSelectedProperties', JSON.stringify(saveData));
    onNext();
  };

  const cancelSkip = () => {
    setShowSkipConfirmation(false)
  }

  // Load saved properties on component mount
  useEffect(() => {
    const savedDataString = localStorage.getItem('prospectSelectedProperties');
    if (savedDataString) {
      try {
        const savedData = JSON.parse(savedDataString);
        console.log('[useEffect Load] Loaded data from localStorage:', savedData);
        if (savedData && savedData.listing === true && Array.isArray(savedData.listing_id)) {
          console.log('[useEffect Load] Setting selected properties from loaded data:', savedData.listing_id);
          setSelectedProperties(savedData.listing_id);
        } else if (savedData && savedData.listing === false) {
          console.log('[useEffect Load] Setting selected properties to empty array (skipped state).');
          setSelectedProperties([]);
        } else {
          console.warn('[useEffect Load] Unexpected data format in localStorage, defaulting to empty selection.');
          setSelectedProperties([]);
        }
      } catch (error) {
        console.error('Error parsing saved properties from localStorage:', error);
        setSelectedProperties([]); // Default to empty on error
      }
    } else {
      console.log('[useEffect Load] No data found in localStorage for prospectSelectedProperties, using initial props.');
      // Initialize with initialSelectedProperties prop if no local storage data
      setSelectedProperties(initialSelectedProperties);
    }
    // Dependency array: Run only once on mount unless initialSelectedProperties changes
    // Note: If initialSelectedProperties could change *after* mount and should override localStorage,
    // this logic might need adjustment. Typically, localStorage should persist over initial props.
  }, [initialSelectedProperties]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Select Properties</h1>
      <p className="mb-6 text-muted-foreground">
        Choose one or more properties that the prospect is interested in, or skip this step.
      </p>

      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="pl-9 bg-background/10 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedProperties.length === 0
              ? "You haven't selected any property yet"
              : `${selectedProperties.length} ${selectedProperties.length === 1 ? "property" : "properties"} selected`}
          </span>
          {selectedProperties.length > 0 && (
            <Button variant="link" className="text-primary p-0 h-auto" onClick={clearSelection}>
              Clear selection
            </Button>
          )}
        </div>
      </div>

      {isLoadingListings ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="rounded-lg border border-border bg-background/5 overflow-hidden">
              <div className="aspect-video w-full bg-gray-800 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
                <div className="h-3 bg-gray-700 rounded animate-pulse w-full" />
              </div>
            </div>
          ))}
        </div>
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
                  if (!response.ok) {
                    throw new Error(
                      data.error || 
                      `HTTP error! status: ${response.status}, message: ${data.details || 'Unknown error'}`
                    );
                  }
                  return data;
                })
                .then(data => {
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
      ) : filteredListings.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-gray-500">No properties available at this time.</p>
          <p className="text-sm text-gray-400 mt-2">You can proceed without selecting a property.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => renderListing(listing))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleNext}>{selectedProperties.length > 0 ? "Next" : "Skip"}</Button>
      </div>

      {/* Skip confirmation dialog */}
      {showSkipConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-2">Confirm Skip</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to proceed without selecting any properties? You can come back to this step later.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelSkip}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleSkip}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

