"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Droplets, Flame, Fan, Waves, Car, Building2, Warehouse, Home, Bed, Bath, Ruler, ImageIcon, Star, Trash, Zap, Wifi, Tv, Square, MoreHorizontal, Columns, Trees, Flower2, Building, Utensils, Wind, Thermometer, Sun, Users, ParkingSquare, Phone, Shield, Microwave, Refrigerator, Droplet, WashingMachine, AirVent, FlameKindling, SunSnow, Fence, TreeDeciduous, Ratio, Globe, Sparkles, Eye, UserPlus, ClipboardList, Save, Info } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { SharePopover } from "@/components/share-popover"
import { Skeleton } from "@/components/ui/skeleton"
import ZillowLogo from '@/components/svgs/ZillowLogo'
import HotPadsLogo from '@/components/svgs/HotpadsLogo'
import ZumperLogo from '@/components/svgs/ZumperLogo'
import ZoloLogo from '@/components/svgs/ZoloLogo'
import TruliaLogo from '@/components/svgs/TruliaLogo'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

interface UnitListingDetailsProps {
  unitId: string
}

interface UnitDetails {
  unit_name: string
  beds: number
  baths: number
  size: number
  market_rent: number
}

interface APIPhoto {
  id: string
  fileUrl: string
  fileName: string
  createdAt: string
  favorite?: boolean
  isFavorite?: boolean
}

interface Photo {
  id: string
  fileUrl: string
  fileName: string
  createdAt: string
}

interface ListingDetails {
  listing_description: string
  property_title: string
  status: string
  favorite_photo: string | null
  available_date?: Date | null
  included_in_rent: {
    water: boolean
    sewage: boolean
    garbage: boolean
    electricity: boolean
    gas: boolean
    internet: boolean
    cable: boolean
    sat_tv: boolean
    hot_water: boolean
  }
  interior_appliances: {
    dishwasher: boolean
    washer: boolean
    dryer: boolean
    freezer: boolean
    microwave: boolean
    range_oven: boolean
    ac: boolean
    ceiling_fan: boolean
    refrigerator: boolean
    fireplace: boolean
    intercom: boolean
    security_system: boolean
  }
  heating: {
    central: boolean
    forced_air: boolean
    heat_pump: boolean
    radiant: boolean
    electric: boolean
    geothermal: boolean
    solar: boolean
    ductless_mini_split: boolean
    natural_gas: boolean
    other: boolean
  }
  cooling: {
    central: boolean
    evaporative: boolean
    geothermal: boolean
    heat_pump: boolean
    wall: boolean
    solar: boolean
    ceiling_fans: boolean
    ductless_mini_split: boolean
    other: boolean
  }
  laundry: {
    in_unit: boolean
    shared: boolean
  }
  parking: {
    carport: boolean
    garage_attached: boolean
    garage_detached: boolean
    off_street: boolean
  }
  exterior: {
    deck: boolean
    courtyard: boolean
    fenced_yard: boolean
    garden: boolean
    lawn: boolean
    pool: boolean
    patio: boolean
    balcony: boolean
  }
}

export function UnitListingDetails({ unitId }: UnitListingDetailsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAmenitiesDialogOpen, setIsAmenitiesDialogOpen] = useState(false)
  const [tempDescription, setTempDescription] = useState("")
  const [tempPropertyTitle, setTempPropertyTitle] = useState("")
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [propertyId, setPropertyId] = useState<string>("")
  const [favoritePhoto, setFavoritePhoto] = useState<string | null>(null)
  const [unitDetails, setUnitDetails] = useState<UnitDetails>({
    unit_name: "",
    beds: 0,
    baths: 0,
    size: 0,
    market_rent: 0
  })
  const [listingDetails, setListingDetails] = useState<ListingDetails>({
    listing_description: "",
    property_title: "",
    status: "draft",
    favorite_photo: null,
    included_in_rent: {
      water: false,
      sewage: false,
      garbage: false,
      electricity: false,
      gas: false,
      internet: false,
      cable: false,
      sat_tv: false,
      hot_water: false
    },
    interior_appliances: {
      dishwasher: false,
      washer: false,
      dryer: false,
      freezer: false,
      microwave: false,
      range_oven: false,
      ac: false,
      ceiling_fan: false,
      refrigerator: false,
      fireplace: false,
      intercom: false,
      security_system: false
    },
    heating: {
      central: false,
      forced_air: false,
      heat_pump: false,
      radiant: false,
      electric: false,
      geothermal: false,
      solar: false,
      ductless_mini_split: false,
      natural_gas: false,
      other: false
    },
    cooling: {
      central: false,
      evaporative: false,
      geothermal: false,
      heat_pump: false,
      wall: false,
      solar: false,
      ceiling_fans: false,
      ductless_mini_split: false,
      other: false
    },
    laundry: {
      in_unit: false,
      shared: false
    },
    parking: {
      carport: false,
      garage_attached: false,
      garage_detached: false,
      off_street: false
    },
    exterior: {
      deck: false,
      courtyard: false,
      fenced_yard: false,
      garden: false,
      lawn: false,
      pool: false,
      patio: false,
      balcony: false
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined)
  const [confirmPublish, setConfirmPublish] = useState(false)

  useEffect(() => {
    const fetchUnitDetails = async () => {
      try {
        const response = await fetch(`/api/unit/${unitId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch unit details')
        }
        const data = await response.json()
        setPropertyId(data.property_id)
        setUnitDetails({
          unit_name: data.unit_name,
          beds: data.beds,
          baths: data.baths,
          size: data.size,
          market_rent: data.market_rent
        })
        setListingDetails(prev => ({
          ...prev,
          property_title: prev.property_title || data.unit_name
        }))
      } catch (error) {
        console.error('Error fetching unit details:', error)
      }
    }

    const fetchListingDetails = async () => {
      try {
        const response = await fetch(`/api/unit/${unitId}/listing-details`)
        if (!response.ok) {
          throw new Error('Failed to fetch listing details')
        }
        const data = await response.json()
        if (Object.keys(data).length > 0) {
          setListingDetails({
            listing_description: data.listing_description || "",
            property_title: data.property_title || unitDetails.unit_name,
            status: data.status || "draft",
            favorite_photo: data.favorite_photo || null,
            included_in_rent: data.included_in_rent || {
              water: false,
              sewage: false,
              garbage: false,
              electricity: false,
              gas: false,
              internet: false,
              cable: false,
              sat_tv: false,
              hot_water: false
            },
            interior_appliances: data.interior_appliances || {
              dishwasher: false,
              washer: false,
              dryer: false,
              freezer: false,
              microwave: false,
              range_oven: false,
              ac: false,
              ceiling_fan: false,
              refrigerator: false,
              fireplace: false,
              intercom: false,
              security_system: false
            },
            heating: data.heating || {
              central: false,
              forced_air: false,
              heat_pump: false,
              radiant: false,
              electric: false,
              geothermal: false,
              solar: false,
              ductless_mini_split: false,
              natural_gas: false,
              other: false
            },
            cooling: data.cooling || {
              central: false,
              evaporative: false,
              geothermal: false,
              heat_pump: false,
              wall: false,
              solar: false,
              ceiling_fans: false,
              ductless_mini_split: false,
              other: false
            },
            laundry: data.laundry || {
              in_unit: false,
              shared: false
            },
            parking: data.parking || {
              carport: false,
              garage_attached: false,
              garage_detached: false,
              off_street: false
            },
            exterior: data.exterior || {
              deck: false,
              courtyard: false,
              fenced_yard: false,
              garden: false,
              lawn: false,
              pool: false,
              patio: false,
              balcony: false
            }
          })
          setFavoritePhoto(data.favorite_photo || null)
        }
      } catch (error) {
        console.error('Error fetching listing details:', error)
      }
    }

    const fetchAllPhotos = async () => {
      try {
        const unitPhotosResponse = await fetch(`/api/unit/${unitId}/photos`)
        const unitPhotos = unitPhotosResponse.ok ? await unitPhotosResponse.json() : []

        let propertyPhotos: Photo[] = []
        if (propertyId) {
          const propertyPhotosResponse = await fetch(`/api/property/${propertyId}/photos`)
          propertyPhotos = propertyPhotosResponse.ok ? await propertyPhotosResponse.json() : []
        }

        const mapPhoto = (photo: APIPhoto): Photo => ({
          id: photo.id,
          fileUrl: photo.fileUrl,
          fileName: photo.fileName,
          createdAt: photo.createdAt
        })

        const allPhotos = [...unitPhotos.map(mapPhoto), ...propertyPhotos.map(mapPhoto)]
        const uniquePhotos = allPhotos.filter((photo, index, self) =>
          index === self.findIndex((p) => p.id === photo.id)
        )

        setPhotos(uniquePhotos)
      } catch (error) {
        console.error('Error fetching photos:', error)
      }
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchUnitDetails(),
          fetchListingDetails(),
          fetchAllPhotos()
        ])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [unitId, propertyId, unitDetails.unit_name])

  const handleOpenDialog = () => {
    setTempDescription(listingDetails.listing_description)
    setTempPropertyTitle(listingDetails.property_title || unitDetails.unit_name)
    setIsDialogOpen(true)
  }

  const handleSaveDialog = () => {
    setListingDetails({
      ...listingDetails,
      listing_description: tempDescription,
      property_title: tempPropertyTitle
    })
    setIsDialogOpen(false)
  }

  const handleSaveAsDraft = async () => {
    try {
      // First update the unit details
      const unitResponse = await fetch(`/api/unit/${unitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unit_name: unitDetails.unit_name,
          beds: unitDetails.beds,
          baths: unitDetails.baths,
          size: unitDetails.size,
          market_rent: unitDetails.market_rent
        }),
      })

      if (!unitResponse.ok) {
        const errorData = await unitResponse.json()
        throw new Error(errorData.error || 'Failed to update unit details')
      }

      // Then update the listing details
      const listingResponse = await fetch(`/api/unit/${unitId}/listing-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: listingDetails.listing_description,
          property_title: listingDetails.property_title,
          status: 'draft',
          favorite_photo: listingDetails.favorite_photo,
          included_in_rent: listingDetails.included_in_rent,
          interior_appliances: listingDetails.interior_appliances,
          heating: listingDetails.heating,
          cooling: listingDetails.cooling,
          laundry: listingDetails.laundry,
          parking: listingDetails.parking,
          exterior: listingDetails.exterior
        }),
      })

      if (!listingResponse.ok) {
        const errorData = await listingResponse.json()
        throw new Error(errorData.error || 'Failed to update listing details')
      }

      const updatedListingData = await listingResponse.json()
      
      // Update the local state with the response from the server
      setListingDetails(prev => ({
        ...prev,
        status: 'draft',
        listing_description: updatedListingData.description || prev.listing_description,
        property_title: updatedListingData.property_title || prev.property_title,
        favorite_photo: updatedListingData.favorite_photo || prev.favorite_photo,
        included_in_rent: updatedListingData.included_in_rent || prev.included_in_rent,
        interior_appliances: updatedListingData.interior_appliances || prev.interior_appliances,
        heating: updatedListingData.heating || prev.heating,
        cooling: updatedListingData.cooling || prev.cooling,
        laundry: updatedListingData.laundry || prev.laundry,
        parking: updatedListingData.parking || prev.parking,
        exterior: updatedListingData.exterior || prev.exterior
      }))

      // Fetch the latest listing details to ensure we have the most up-to-date data
      const refreshResponse = await fetch(`/api/unit/${unitId}/listing-details`)
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json()
        setListingDetails(prev => ({
          ...prev,
          included_in_rent: refreshedData.included_in_rent || prev.included_in_rent,
          interior_appliances: refreshedData.interior_appliances || prev.interior_appliances,
          heating: refreshedData.heating || prev.heating,
          cooling: refreshedData.cooling || prev.cooling,
          laundry: refreshedData.laundry || prev.laundry,
          parking: refreshedData.parking || prev.parking,
          exterior: refreshedData.exterior || prev.exterior
        }))
      }
    } catch (error) {
      console.error('Error updating listing details:', error)
      throw error
    }
  }

  const handleFavoritePhoto = async (photoId: string) => {
    try {
      // If clicking the currently favorited photo, unfavorite it
      const newFavorite = favoritePhoto === photoId ? null : photoId

      setFavoritePhoto(newFavorite)

      // Update listing details with new favorite
      const response = await fetch(`/api/unit/${unitId}/listing-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...listingDetails,
          favorite_photo: newFavorite
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite photo')
      }

      setListingDetails(prev => ({
        ...prev,
        favorite_photo: newFavorite
      }))
    } catch (error) {
      console.error('Error updating favorite photo:', error)
    }
  }

  const generateAIDescription = async () => {
    setIsGeneratingDescription(true)
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitDetails,
          listingDetails,
          photos
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate description')
      }

      const data = await response.json()
      setTempDescription(data.description)
    } catch (error) {
      console.error('Error generating description:', error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handlePublish = async () => {
    if (!publishDate || !confirmPublish) return

    try {
      // Format the date to ISO string for the API
      const formattedDate = publishDate.toISOString()

      const requestBody = {
        description: listingDetails.listing_description || "This is a property listing.",
        property_title: listingDetails.property_title,
        status: 'published',
        available_date: formattedDate,
        favorite_photo: listingDetails.favorite_photo,
        included_in_rent: listingDetails.included_in_rent,
        interior_appliances: listingDetails.interior_appliances,
        heating: listingDetails.heating,
        cooling: listingDetails.cooling,
        laundry: listingDetails.laundry,
        parking: listingDetails.parking,
        exterior: listingDetails.exterior
      }

      console.log('Sending request with body:', requestBody)

      // Update listing details with new status and date
      const response = await fetch(`/api/unit/${unitId}/listing-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      console.log('API Response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to publish listing')
      }

      // Update local state with the response data
      setListingDetails(prev => ({
        ...prev,
        status: 'published',
        available_date: publishDate,
        listing_description: responseData.data?.listing_description || prev.listing_description,
        property_title: responseData.data?.property_title || prev.property_title,
        favorite_photo: responseData.data?.favorite_photo || prev.favorite_photo,
        included_in_rent: responseData.data?.included_in_rent || prev.included_in_rent,
        interior_appliances: responseData.data?.interior_appliances || prev.interior_appliances,
        heating: responseData.data?.heating || prev.heating,
        cooling: responseData.data?.cooling || prev.cooling,
        laundry: responseData.data?.laundry || prev.laundry,
        parking: responseData.data?.parking || prev.parking,
        exterior: responseData.data?.exterior || prev.exterior
      }))
      
      setIsPublishDialogOpen(false)
      setPublishDate(undefined)
      setConfirmPublish(false)
    } catch (error) {
      console.error('Error publishing listing:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[1fr,500px] gap-6">
        {/* Main Content Loading State */}
        <div className="space-y-6">
          {/* Property Section Loading */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="mb-4">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-6 mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="grid grid-cols-[1fr,400px] gap-4">
                <Skeleton className="h-[250px] rounded-lg" />
                <Skeleton className="h-[250px] rounded-lg" />
              </div>
            </CardContent>
          </Card>

          {/* Listing Description Loading */}
          <Card>
            <CardContent className="p-6 min-h-[250px]">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
          </Card>

          {/* Photos Loading */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="relative">
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-video rounded-lg" />
                  ))}
                </div>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities Loading */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Loading State */}
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* Listing Platforms Loading */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-20" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Share Listing Loading */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <Skeleton className="h-4 w-64" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <Skeleton className="h-4 w-64" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Loading */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      {listingDetails.status === 'draft' && (
        <div className="rounded-lg border border-blue-500/50 px-4 py-3 text-blue-600 mb-6">
          <p className="text-sm">
            <Info
              className="-mt-0.5 me-3 inline-flex opacity-60"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Your listing is currently in draft mode and is not visible to renters. Click &apos;Publish&apos; to set the listing live.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,500px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Property Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Property</h2>
              </div>

              {/* Property Details */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{listingDetails.property_title || unitDetails.unit_name}</h3>
                <p className="text-sm text-green-600">Monthly payments | ${unitDetails.market_rent} | Available Today</p>
              </div>

              {/* Property Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>House</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  <span>{unitDetails.size} ft²</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  <span>{unitDetails.beds} beds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4" />
                  <span>{unitDetails.baths} baths</span>
                </div>
              </div>

              {/* Image and Stats Section */}
              <div className="grid grid-cols-[1fr,500px] gap-4">
                {/* Main Image */}
                <div className="relative w-full h-[250px] rounded-lg overflow-hidden bg-muted">
                  {photos.length > 0 ? (
                    <Image
                      src={photos[0].fileUrl}
                      alt={photos[0].fileName}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Leads and Applications Card */}
                <div className="border rounded-lg p-6 h-[250px] flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    <span>0 Views</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <span>0 leads</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                      <ClipboardList className="h-4 w-4 text-primary" />
                    </div>
                    <span>0 applications</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing Description */}
          <Card>
            <CardContent className="p-6 min-h-[250px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Listing details</h2>
                <Button variant="ghost" size="icon" onClick={handleOpenDialog}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{listingDetails.listing_description}</p>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit listing details</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div>
                      <label htmlFor="property-title" className="text-sm font-medium">Property Title</label>
                      <input
                        id="property-title"
                        type="text"
                        value={tempPropertyTitle}
                        onChange={(e) => setTempPropertyTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Enter property title..."
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <Textarea
                        id="description"
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        className="min-h-[200px] mb-2"
                        placeholder="Enter listing description..."
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={generateAIDescription}
                        disabled={isGeneratingDescription}
                      >
                        {isGeneratingDescription ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate AI Description
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveDialog}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Photos</h2>
                <Button variant="ghost" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Carousel
                  opts={{
                    align: "start",
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {photos.length > 0 ? (
                      photos.map((photo) => (
                        <CarouselItem key={photo.id} className="basis-1/3">
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={photo.fileUrl}
                              alt={photo.fileName}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                            <button
                              onClick={() => handleFavoritePhoto(photo.id)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                            >
                              <Star
                                className={`h-5 w-5 ${favoritePhoto === photo.id ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`}
                              />
                            </button>
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      Array.from({ length: 6 }).map((_, index) => (
                        <CarouselItem key={index} className="basis-1/3">
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            </div>
                          </div>
                        </CarouselItem>
                      ))
                    )}
                  </CarouselContent>
                  <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
                  <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
                </Carousel>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold">Amenities</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsAmenitiesDialogOpen(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                {/* Included in Rent */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Droplets className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Included in Rent</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(listingDetails.included_in_rent).map(([key, value]) => {
                      if (!value) return null;
                      const icons = {
                        water: Droplets,
                        sewage: Droplets,
                        garbage: Trash,
                        electricity: Zap,
                        gas: Flame,
                        internet: Wifi,
                        cable: Tv,
                        sat_tv: Tv,
                        hot_water: Droplet
                      };
                      const labels = {
                        water: "Water",
                        sewage: "Sewage",
                        garbage: "Garbage",
                        electricity: "Electricity",
                        gas: "Gas",
                        internet: "Internet",
                        cable: "Cable",
                        sat_tv: "Sat TV",
                        hot_water: "Hot water"
                      };
                      const Icon = icons[key as keyof typeof icons];
                      return (
                        <div key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                    {!Object.values(listingDetails.included_in_rent).some(Boolean) && (
                      <p className="text-sm text-muted-foreground italic">No items included in rent</p>
                    )}
                  </div>
                </div>

                {/* Interior & Appliances */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Home className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Interior & Appliances</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(listingDetails.interior_appliances).map(([key, value]) => {
                      if (!value) return null;
                      const icons = {
                        dishwasher: Utensils,
                        washer: WashingMachine,
                        dryer: WashingMachine,
                        freezer: Refrigerator,
                        microwave: Microwave,
                        range_oven: Flame,
                        ac: AirVent,
                        ceiling_fan: Fan,
                        refrigerator: Refrigerator,
                        fireplace: FlameKindling,
                        intercom: Phone,
                        security_system: Shield
                      };
                      const labels = {
                        dishwasher: "Dishwasher",
                        washer: "Washer",
                        dryer: "Dryer",
                        freezer: "Freezer",
                        microwave: "Microwave",
                        range_oven: "Range oven",
                        ac: "A/C",
                        ceiling_fan: "Ceiling fan",
                        refrigerator: "Refrigerator",
                        fireplace: "Fireplace",
                        intercom: "Intercom",
                        security_system: "Security system"
                      };
                      const Icon = icons[key as keyof typeof icons];
                      return (
                        <div key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                    {!Object.values(listingDetails.interior_appliances).some(Boolean) && (
                      <p className="text-sm text-muted-foreground italic">No interior amenities listed</p>
                    )}
                  </div>
                </div>

                {/* Heating */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Flame className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Heating</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(listingDetails.heating).map(([key, value]) => {
                      if (!value) return null;
                      const icons = {
                        central: SunSnow,
                        forced_air: SunSnow,
                        heat_pump: SunSnow,
                        radiant: Waves,
                        electric: Zap,
                        geothermal: Thermometer,
                        solar: Sun,
                        ductless_mini_split: Wind,
                        natural_gas: Flame,
                        other: MoreHorizontal
                      };
                      const labels = {
                        central: "Central",
                        forced_air: "Forced air",
                        heat_pump: "Heat Pump",
                        radiant: "Radiant",
                        electric: "Electric",
                        geothermal: "Geothermal",
                        solar: "Solar",
                        ductless_mini_split: "Ductless Mini-Split",
                        natural_gas: "Natural Gas",
                        other: "Other"
                      };
                      const Icon = icons[key as keyof typeof icons];
                      return (
                        <div key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                    {!Object.values(listingDetails.heating).some(Boolean) && (
                      <p className="text-sm text-muted-foreground italic">No heating systems listed</p>
                    )}
                  </div>
                </div>

                {/* Cooling */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Wind className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Cooling</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(listingDetails.cooling).map(([key, value]) => {
                      if (!value) return null;
                      const icons = {
                        central: SunSnow,
                        evaporative: Droplets,
                        geothermal: Thermometer,
                        heat_pump: SunSnow,
                        wall: Square,
                        solar: Sun,
                        ceiling_fans: Fan,
                        ductless_mini_split: Wind,
                        other: MoreHorizontal
                      };
                      const labels = {
                        central: "Central",
                        evaporative: "Evaporative",
                        geothermal: "Geothermal",
                        heat_pump: "Heat Pump",
                        wall: "Wall",
                        solar: "Solar",
                        ceiling_fans: "Ceiling Fans",
                        ductless_mini_split: "Ductless Mini-Split",
                        other: "Other"
                      };
                      const Icon = icons[key as keyof typeof icons];
                      return (
                        <div key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                    {!Object.values(listingDetails.cooling).some(Boolean) && (
                      <p className="text-sm text-muted-foreground italic">No cooling systems listed</p>
                    )}
                  </div>
                </div>

                {/* Laundry */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <WashingMachine className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Laundry</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(listingDetails.laundry).map(([key, value]) => {
                      if (!value) return null;
                      const icons = {
                        in_unit: Home,
                        shared: Users
                      };
                      const labels = {
                        in_unit: "In-unit",
                        shared: "Shared"
                      };
                      const Icon = icons[key as keyof typeof icons];
                      return (
                        <div key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                    {!Object.values(listingDetails.laundry).some(Boolean) && (
                      <p className="text-sm text-muted-foreground italic">No laundry facilities listed</p>
                    )}
                  </div>
                </div>

                {/* Parking */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Car className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Parking</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(listingDetails.parking).map(([key, value]) => {
                      if (!value) return null;
                      const icons = {
                        carport: Car,
                        garage_attached: Warehouse,
                        garage_detached: Building2,
                        off_street: ParkingSquare
                      };
                      const labels = {
                        carport: "Carport",
                        garage_attached: "Garage / Attached",
                        garage_detached: "Garage / Detached",
                        off_street: "Off-street"
                      };
                      const Icon = icons[key as keyof typeof icons];
                      return (
                        <div key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                    {!Object.values(listingDetails.parking).some(Boolean) && (
                      <p className="text-sm text-muted-foreground italic">No parking options listed</p>
                    )}
                  </div>
                </div>

                {/* Exterior */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <TreeDeciduous className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold">Exterior</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(listingDetails.exterior).map(([key, value]) => {
                      if (!value) return null;
                      const icons = {
                        deck: Columns,
                        courtyard: Trees,
                        fenced_yard: Fence,
                        garden: Flower2,
                        lawn: TreeDeciduous,
                        pool: Waves,
                        patio: Ratio,
                        balcony: Building
                      };
                      const labels = {
                        deck: "Deck",
                        courtyard: "Courtyard",
                        fenced_yard: "Fenced yard",
                        garden: "Garden",
                        lawn: "Lawn",
                        pool: "Pool",
                        patio: "Patio",
                        balcony: "Balcony"
                      };
                      const Icon = icons[key as keyof typeof icons];
                      return (
                        <div key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                    {!Object.values(listingDetails.exterior).some(Boolean) && (
                      <p className="text-sm text-muted-foreground italic">No exterior features listed</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities Dialog */}
          <Dialog open={isAmenitiesDialogOpen} onOpenChange={setIsAmenitiesDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader className="border-b p-2">
                <DialogTitle className="text-xl">Edit Amenities</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-10 p-6">
                  {/* Included in Rent */}
                  <div>
                    <h3 className="text-base font-bold mb-6">Included in Rent</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries({
                        water: { label: "Water", icon: Droplets },
                        sewage: { label: "Sewage", icon: Droplets },
                        garbage: { label: "Garbage", icon: Trash },
                        electricity: { label: "Electricity", icon: Zap },
                        gas: { label: "Gas", icon: Flame },
                        internet: { label: "Internet", icon: Wifi },
                        cable: { label: "Cable", icon: Tv },
                        sat_tv: { label: "Sat TV", icon: Tv },
                        hot_water: { label: "Hot water", icon: Droplet }
                      }).map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setListingDetails(prev => ({
                            ...prev,
                            included_in_rent: {
                              ...prev.included_in_rent,
                              [key]: !prev.included_in_rent[key as keyof typeof prev.included_in_rent]
                            }
                          }))}
                          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3 text-center hover:border-gray-300 ${
                            listingDetails.included_in_rent[key as keyof typeof listingDetails.included_in_rent]
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Interior & Appliances */}
                  <div>
                    <h3 className="text-base font-bold mb-6">Interior & Appliances</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries({
                        dishwasher: { label: "Dishwasher", icon: Utensils },
                        washer: { label: "Washer", icon: WashingMachine },
                        dryer: { label: "Dryer", icon: WashingMachine },
                        freezer: { label: "Freezer", icon: Refrigerator },
                        microwave: { label: "Microwave", icon: Microwave },
                        range_oven: { label: "Range oven", icon: Flame },
                        ac: { label: "A/C", icon: AirVent },
                        ceiling_fan: { label: "Ceiling fan", icon: Fan },
                        refrigerator: { label: "Refrigerator", icon: Refrigerator },
                        fireplace: { label: "Fireplace", icon: FlameKindling },
                        intercom: { label: "Intercom", icon: Phone },
                        security_system: { label: "Security system", icon: Shield }
                      }).map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setListingDetails(prev => ({
                            ...prev,
                            interior_appliances: {
                              ...prev.interior_appliances,
                              [key]: !prev.interior_appliances[key as keyof typeof prev.interior_appliances]
                            }
                          }))}
                          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3 text-center hover:border-gray-300 ${
                            listingDetails.interior_appliances[key as keyof typeof listingDetails.interior_appliances]
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Heating */}
                  <div>
                    <h3 className="text-base font-bold mb-6">Heating</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries({
                        central: { label: "Central", icon: SunSnow },
                        forced_air: { label: "Forced air", icon: SunSnow },
                        heat_pump: { label: "Heat Pump", icon: SunSnow },
                        radiant: { label: "Radiant", icon: Waves },
                        electric: { label: "Electric", icon: Zap },
                        geothermal: { label: "Geothermal", icon: Thermometer },
                        solar: { label: "Solar", icon: Sun },
                        ductless_mini_split: { label: "Ductless Mini-Split", icon: Wind },
                        natural_gas: { label: "Natural Gas", icon: Flame },
                        other: { label: "Other", icon: MoreHorizontal }
                      }).map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setListingDetails(prev => ({
                            ...prev,
                            heating: {
                              ...prev.heating,
                              [key]: !prev.heating[key as keyof typeof prev.heating]
                            }
                          }))}
                          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3 text-center hover:border-gray-300 ${
                            listingDetails.heating[key as keyof typeof listingDetails.heating]
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Cooling */}
                  <div>
                    <h3 className="text-base font-bold mb-6">Cooling</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries({
                        central: { label: "Central", icon: SunSnow },
                        evaporative: { label: "Evaporative", icon: Droplets },
                        geothermal: { label: "Geothermal", icon: Thermometer },
                        heat_pump: { label: "Heat Pump", icon: SunSnow },
                        wall: { label: "Wall", icon: Square },
                        solar: { label: "Solar", icon: Sun },
                        ceiling_fans: { label: "Ceiling Fans", icon: Fan },
                        ductless_mini_split: { label: "Ductless Mini-Split", icon: Wind },
                        other: { label: "Other", icon: MoreHorizontal }
                      }).map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setListingDetails(prev => ({
                            ...prev,
                            cooling: {
                              ...prev.cooling,
                              [key]: !prev.cooling[key as keyof typeof prev.cooling]
                            }
                          }))}
                          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3 text-center hover:border-gray-300 ${
                            listingDetails.cooling[key as keyof typeof listingDetails.cooling]
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Laundry */}
                  <div>
                    <h3 className="text-base font-bold mb-6">Laundry</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries({
                        in_unit: { label: "In-unit", icon: Home },
                        shared: { label: "Shared", icon: Users }
                      }).map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setListingDetails(prev => ({
                            ...prev,
                            laundry: {
                              ...prev.laundry,
                              [key]: !prev.laundry[key as keyof typeof prev.laundry]
                            }
                          }))}
                          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3 text-center hover:border-gray-300 ${
                            listingDetails.laundry[key as keyof typeof listingDetails.laundry]
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Parking */}
                  <div>
                    <h3 className="text-base font-bold mb-6">Parking</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries({
                        carport: { label: "Carport", icon: Car },
                        garage_attached: { label: "Garage / Attached", icon: Warehouse },
                        garage_detached: { label: "Garage / Detached", icon: Building2 },
                        off_street: { label: "Off-street", icon: ParkingSquare }
                      }).map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setListingDetails(prev => ({
                            ...prev,
                            parking: {
                              ...prev.parking,
                              [key]: !prev.parking[key as keyof typeof prev.parking]
                            }
                          }))}
                          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3 text-center hover:border-gray-300 ${
                            listingDetails.parking[key as keyof typeof listingDetails.parking]
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Exterior */}
                  <div>
                    <h3 className="text-base font-bold mb-6">Exterior</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries({
                        deck: { label: "Deck", icon: Columns },
                        courtyard: { label: "Courtyard", icon: Trees },
                        fenced_yard: { label: "Fenced yard", icon: Fence },
                        garden: { label: "Garden", icon: Flower2 },
                        lawn: { label: "Lawn", icon: TreeDeciduous },
                        pool: { label: "Pool", icon: Waves },
                        patio: { label: "Patio", icon: Ratio },
                        balcony: { label: "Balcony", icon: Building }
                      }).map(([key, { label, icon: Icon }]) => (
                        <button
                          key={key}
                          onClick={() => setListingDetails(prev => ({
                            ...prev,
                            exterior: {
                              ...prev.exterior,
                              [key]: !prev.exterior[key as keyof typeof prev.exterior]
                            }
                          }))}
                          className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-4 py-3 text-center hover:border-gray-300 ${
                            listingDetails.exterior[key as keyof typeof listingDetails.exterior]
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <p className="text-xs font-medium">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t p-4">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAmenitiesDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    // Just close the dialog - the state is already updated when clicking the buttons
                    setIsAmenitiesDialogOpen(false)
                  }}>
                    Add
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="w-full gap-2">
              <Trash className="h-4 w-4" />
              Remove
            </Button>
            <Button variant="outline" onClick={handleSaveAsDraft} className="w-full gap-2">
              <Save className="h-4 w-4" />
              Draft
            </Button>
            <Button className="w-full gap-2" onClick={() => setIsPublishDialogOpen(true)}>
              <Globe className="h-4 w-4" />
              Publish
            </Button>
          </div>

          {/* Publish Dialog */}
          <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Publish Listing</DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Date</label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !publishDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {publishDate ? format(publishDate, "PPP") : "Select available date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={publishDate}
                            onSelect={(date) => setPublishDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button 
                        variant="secondary" 
                        className="shrink-0"
                        onClick={() => setPublishDate(new Date())}
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox
                      id="confirm"
                      checked={confirmPublish}
                      onCheckedChange={(checked) => setConfirmPublish(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="confirm"
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      I confirm that I want to publish this listing and make it visible to renters
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!publishDate || !confirmPublish}
                  className="px-8"
                >
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Listing Platforms */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Listing Platforms</h2>
                <Button variant="outline" size="sm">Set up</Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Your listing is being listed on the following platforms. Click the links below to review details.</p>
              <div className="flex flex-wrap gap-4">
                <ZillowLogo width={80} height={24} />
                <TruliaLogo width={80} height={24} />
                <ZumperLogo width={80} height={24} />
                <ZoloLogo width={80} height={24} />
                <HotPadsLogo width={80} height={24} />
                <div className="flex items-center gap-2">
                  <Globe />
                  Website
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Listing */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Share listing</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm text-muted-foreground truncate">https://velloa.vercel.app/company/TM3HZhZTVy/3wEMCHOFw/listings/5hmngqo-EhK5dSYPFWnVA/nFhxZ9</span>
                  <SharePopover url="https://velloa.vercel.app/company/TM3HZhZTVy/3wEMCHOFw/listings/5hmngqo-EhK5dSYPFWnVA/nFhxZ9" />
                </div>
                <div className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm text-muted-foreground truncate">https://velloa.vercel.app/company/TM3HZhZTVy/3wEMCHOFw/listings/5hmngqo-EhK5dSYPFWnVA/nFhxZ9#screen=true</span>
                  <SharePopover url="https://velloa.vercel.app/company/TM3HZhZTVy/3wEMCHOFw/listings/5hmngqo-EhK5dSYPFWnVA/nFhxZ9#screen=true" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Contact</h2>
                <Button variant="ghost" size="icon">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  JM
                </div>
                <div>
                  <h3 className="font-medium">John Murphy</h3>
                  <p className="text-sm text-muted-foreground">armin12312@gmail.com</p>
                  <p className="text-sm text-muted-foreground">(416) 719-2928</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}