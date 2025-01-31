"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCharacterLimit } from "@/hooks/use-character-limit"
import {
  RiBasketballLine,
  RiBuildingLine,
  RiVipCrownLine,
  RiCustomerService2Line,
  RiHeartPulseLine,
  RiHomeGearLine,
  RiWalkLine,
  RiTShirt2Line,
  RiSettings5Line,
  RiHotelBedLine,
  RiWifiLine,
  RiTimeLine,
  RiTranslate2,
  RiCarWashingLine,
  RiHome8Line,
  RiParkingBoxLine,
  RiGroupLine,
  RiHotelLine,
  RiCommunityLine,
  RiWaterFlashLine,
  RiGamepadLine,
  RiHomeOfficeLine,
  RiHomeSmile2Line,
  RiStore3Line,
  RiShipLine,
  RiBuilding4Line,
  RiDoorLockLine,
  RiDoorClosedLine,
  RiBook2Line,
  RiRestaurant2Line,
  RiShieldUserLine,
  RiInboxArchiveLine,
  RiTreeLine,
  RiRecycleLine,
  RiLeafLine,
  RiSunLine,
} from "@remixicon/react"
import { Baby, GlassWater, Building2, Home, Store, Building, Archive, HelpCircle, Building as Building4, Home as HomeSmile, X, CircleCheck, Ban, Dog, Dumbbell, Cat, Rabbit, UploadCloud, ImageIcon, Users } from "lucide-react"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useDropzone } from "react-dropzone"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown } from "lucide-react"

interface GeneralInfoForm {
  name: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  description: string
}

interface PropertyTypeForm {
  category: string
  type: string
}

interface PropertyPhoto {
  id: string
  fileUrl: string
  fileName: string
  isFavorite: boolean
}

interface PetPolicy {
  petsAllowed: boolean | null
  allowedPets: string[]
  description: string
}

interface Owner {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  role?: string
  ownership_percentage?: number
  unit?: {
    unit_number: string
    property_name: string
  }
  company?: string
}

const amenitiesList = [
  { id: 'basketball', icon: RiBasketballLine, label: 'Basketball Court' },
  { id: 'business', icon: RiBuildingLine, label: 'Business Center' },
  { id: 'club', icon: RiVipCrownLine, label: 'Club Discount' },
  { id: 'concierge', icon: RiCustomerService2Line, label: 'Concierge' },
  { id: 'fitness', icon: RiHeartPulseLine, label: 'Fitness Center' },
  { id: 'furnished', icon: RiHomeGearLine, label: 'Furnished Available' },
  { id: 'trails', icon: RiWalkLine, label: 'Jogging/Walking Trails' },
  { id: 'laundry', icon: RiTShirt2Line, label: 'Laundry' },
  { id: 'maintenance', icon: RiSettings5Line, label: 'On-Site Maintenance' },
  { id: 'pet-rent', icon: RiHotelBedLine, label: 'Pet-Rent Required' },
  { id: 'high-speed', icon: RiWifiLine, label: 'High Speed' },
  { id: '24-hours', icon: RiTimeLine, label: 'Availability 24 Hours' },
  { id: 'bilingual', icon: RiTranslate2, label: 'Bilingual' },
  { id: 'car-wash', icon: RiCarWashingLine, label: 'Car Wash Area' },
  { id: 'club-house', icon: RiHome8Line, label: 'Club House' },
  { id: 'parking', icon: RiParkingBoxLine, label: 'Parking' },
  { id: 'group-exercise', icon: RiGroupLine, label: 'Group Exercise' },
  { id: 'housekeeping', icon: RiHotelLine, label: 'Housekeeping' },
  { id: 'on-site-management', icon: RiCommunityLine, label: 'On-Site Management' },
  { id: 'pool', icon: RiWaterFlashLine, label: 'Pool' },
  { id: 'gaming', icon: RiGamepadLine, label: 'Gaming Stations' },
  { id: 'multi-use-room', icon: RiHomeOfficeLine, label: 'Multi-Use Room' },
  { id: 'short-term-lease', icon: RiHomeSmile2Line, label: 'Short Term Lease' },
  { id: 'storage-space', icon: RiStore3Line, label: 'Storage Space' },
  { id: 'access-wells', icon: GlassWater, label: 'Access Wells' },
  { id: 'boat-docks', icon: RiShipLine, label: 'Boat Docks' },
  { id: 'child-care', icon: Baby, label: 'Child Care' },
  { id: 'conference-room', icon: RiBuilding4Line, label: 'Conference Room' },
  { id: 'door-attendant', icon: RiDoorLockLine, label: 'Door Attendant' },
  { id: 'free-weights', icon: Dumbbell, label: 'Free Weights' },
  { id: 'gate', icon: RiDoorClosedLine, label: 'Gate' },
  { id: 'guest-room', icon: RiHotelBedLine, label: 'Guest Room' },
  { id: 'house-sitting', icon: Baby, label: 'House Sitting' },
  { id: 'lake-access', icon: RiWaterFlashLine, label: 'Lake Access' },
  { id: 'lake-front', icon: RiWaterFlashLine, label: 'Lake Front' },
  { id: 'library', icon: RiBook2Line, label: 'Library' },
  { id: 'meal-service', icon: RiRestaurant2Line, label: 'Meal Service' },
  { id: 'night-patrol', icon: RiShieldUserLine, label: 'Night Patrol' },
  { id: 'package-receiving', icon: RiInboxArchiveLine, label: 'Package Receiving' },
  { id: 'play-ground', icon: RiTreeLine, label: 'Play Ground' },
  { id: 'recycling', icon: RiRecycleLine, label: 'Recycling' },
  { id: 'smoke-free', icon: RiLeafLine, label: 'Smoke Free' },
  { id: 'sundeck', icon: RiSunLine, label: 'Sundeck' },
]

interface UploadingFile {
  file: File
  progress: number
  error?: string
}

interface FormElement extends HTMLDivElement {
  __showAddOwnerDialog?: (show: boolean) => void;
  __showUploadDialog?: (show: boolean) => void;
}

export function GeneralInfoForm() {
  const paramsPromise = useParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const maxDescriptionLength = 1000
  const {
    value: description,
    characterCount,
    handleChange: handleDescriptionChange,
    maxLength: limit,
    setValue: setDescription
  } = useCharacterLimit({ maxLength: maxDescriptionLength })
  const [formData, setFormData] = React.useState<GeneralInfoForm>({
    name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    zip: "",
    description: ""
  })

  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const params = await paramsPromise
        const response = await fetch(`/api/property/${params.id}/propertySettings`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch property data")
        }

        const data = await response.json()
        setFormData({
          name: data.name || "",
          address_line_1: data.address_line_1 || "",
          address_line_2: data.address_line_2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          description: data.description || ""
        })
        setDescription(data.description || "")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load property data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [paramsPromise, setDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const params = await paramsPromise
      const response = await fetch(`/api/property/${params.id}/propertySettings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address_line_1: formData.address_line_1,
          address_line_2: formData.address_line_2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          description
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update property")
      }

      toast.success("Property information updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update property information")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Property Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line_1">Street Address</Label>
        <Input
          id="address_line_1"
          value={formData.address_line_1}
          onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line_2">Street Address Line 2</Label>
        <Input
          id="address_line_2"
          value={formData.address_line_2}
          onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Province/State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="zip">Postal/Zip Code</Label>
        <Input
          id="zip"
          value={formData.zip}
          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          disabled={isLoading}
          rows={4}
          maxLength={maxDescriptionLength}
          aria-describedby="description-character-count"
        />
        <p
          id="description-character-count"
          className="text-right text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <span className="tabular-nums">{limit - characterCount}</span> characters left
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}

export function PropertyTypeForm() {
  const paramsPromise = useParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<PropertyTypeForm>({
    category: "",
    type: ""
  })

  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const params = await paramsPromise
        const response = await fetch(`/api/property/${params.id}/propertySettings`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch property type")
        }

        const data = await response.json()
        setFormData({
          category: data.category || "",
          type: data.type || ""
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load property type")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [paramsPromise])

  const handleCategorySelect = (category: string) => {
    setFormData({ ...formData, category, type: "" })
  }

  const handleTypeSelect = (selectedType: string) => {
    setFormData({ ...formData, type: selectedType })
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const params = await paramsPromise
      const response = await fetch(`/api/property/${params.id}/propertySettings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          category: formData.category
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update property type")
      }

      toast.success("Property type updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update property type")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600 mb-4">
          Which kind of property do you manage?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleCategorySelect("residential")}
            className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
              formData.category === "residential"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            disabled={isLoading}
          >
            <Home className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">Residential</p>
          </button>

          <button
            type="button"
            onClick={() => handleCategorySelect("commercial")}
            className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
              formData.category === "commercial"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            disabled={isLoading}
          >
            <Building2 className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">Commercial</p>
          </button>
        </div>
      </div>

      {formData.category && (
        <div>
          <p className="text-gray-600 mb-4">
            Which type best describes your property?
          </p>
          <div className="grid grid-cols-4 gap-4">
            {formData.category === "residential" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleTypeSelect("house")}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                    formData.type === "house"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Home className="w-8 h-8 opacity-60" />
                  <p className="text-sm font-medium">House</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect("apartment")}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                    formData.type === "apartment"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Building4 className="w-8 h-8 opacity-60" />
                  <p className="text-sm font-medium">Apartment</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect("townhouse")}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                    formData.type === "townhouse"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <HomeSmile className="w-8 h-8 opacity-60" />
                  <p className="text-sm font-medium">Townhouse</p>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleTypeSelect("office")}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                    formData.type === "office"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Building className="w-8 h-8 opacity-60" />
                  <p className="text-sm font-medium">Office</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect("retail")}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                    formData.type === "retail"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Store className="w-8 h-8 opacity-60" />
                  <p className="text-sm font-medium">Retail</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect("industrial")}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                    formData.type === "industrial"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Building2 className="w-8 h-8 opacity-60" />
                  <p className="text-sm font-medium">Industrial</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect("storage")}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                    formData.type === "storage"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isLoading}
                >
                  <Archive className="w-8 h-8 opacity-60" />
                  <p className="text-sm font-medium">Storage</p>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleTypeSelect("other")}
              className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                formData.type === "other"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              disabled={isLoading}
            >
              <HelpCircle className="w-8 h-8 opacity-60" />
              <p className="text-sm font-medium">Other</p>
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!formData.category || !formData.type || isLoading}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export function PhotosForm() {
  const paramsPromise = useParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [photos, setPhotos] = React.useState<PropertyPhoto[]>([])
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [uploadingFiles, setUploadingFiles] = React.useState<UploadingFile[]>([])

  // Expose the setShowUploadDialog function
  React.useEffect(() => {
    const formElement = document.querySelector('[data-photos-form]') as FormElement;
    if (formElement) {
      formElement.__showUploadDialog = setShowUploadDialog;
    }
  }, []);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const params = await paramsPromise
        if (typeof params.id === 'string') {
          const response = await fetch(`/api/property/${params.id}/photos`)
          
          if (!response.ok) {
            throw new Error("Failed to fetch photos")
          }

          const data = await response.json()
          setPhotos(data || [])
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load photos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [paramsPromise])

  const handleDelete = async (photoId: string) => {
    try {
      setIsLoading(true)
      const params = await paramsPromise
      const response = await fetch(`/api/property/${params.id}/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete photo')
      }

      setPhotos(prev => prev.filter(photo => photo.id !== photoId))
      toast.success("Photo deleted successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete photo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetFavorite = async (photoId: string) => {
    try {
      setIsLoading(true)
      const params = await paramsPromise
      const photo = photos.find(p => p.id === photoId)
      if (!photo) return

      const response = await fetch(`/api/property/${params.id}/photos/${photoId}/favorite`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favorite: !photo.isFavorite
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update photo')
      }

      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, isFavorite: !photo.isFavorite } : photo
      ))
      toast.success("Photo updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update photo")
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true)
    // Initialize uploading files state
    setUploadingFiles(acceptedFiles.map(file => ({
      file,
      progress: 0
    })))
    
    try {
      const params = await paramsPromise
      
      // Upload files in parallel
      await Promise.all(acceptedFiles.map(async (file, index) => {
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
          })

          // Update progress to 50% after base64 conversion
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 50 } : f
          ))

          // Send to API
          const response = await fetch(`/api/property/${params.id}/photos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileName: file.name,
              fileType: file.type
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.details || error.error || error.message || 'Failed to upload file')
          }

          // Fetch all photos again to ensure we have the latest data
          const photosResponse = await fetch(`/api/property/${params.id}/photos`)
          if (photosResponse.ok) {
            const updatedPhotos = await photosResponse.json()
            setPhotos(updatedPhotos)
          }

          // Update progress to 100% after successful upload
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 100 } : f
          ))
        } catch (err) {
          // Update file state with error
          setUploadingFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, error: err instanceof Error ? err.message : 'Upload failed' } : f
          ))
          throw err
        }
      }))

      // Clear uploading files after a delay to show completion
      setTimeout(() => {
        setUploadingFiles([])
        setShowUploadDialog(false)
        toast.success('Photos uploaded successfully')
      }, 1000)
    } catch (err) {
      console.error('Error uploading photos:', err)
      toast.error('Some photos failed to upload')
    }
  }, [paramsPromise])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 10
  })

  return (
    <div className="space-y-6" data-photos-form>
      <div className="h-px bg-border" />

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative h-64 w-full overflow-hidden rounded-lg border">
              {photo.fileUrl ? (
                <Image
                  src={photo.fileUrl}
                  alt={photo.fileName}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleSetFavorite(photo.id)}
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={photo.isFavorite ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDelete(photo.id)}
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {photo.isFavorite && (
                <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-2 w-2 text-primary-foreground"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          No photos uploaded yet
        </p>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive ? 'Drop the files here...' : 'Drag and drop up to 10 photos here, or click to select files'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: JPEG, PNG, WebP
              </p>
            </div>

            {uploadingFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                {uploadingFiles.map((file, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">{file.file.name}</span>
                      <span>{file.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          file.error ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    {file.error && (
                      <p className="text-xs text-red-500">{file.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadDialog(false)
              setUploadingFiles([])
            }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AmenitiesForm() {
  const paramsPromise = useParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>([])

  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const params = await paramsPromise
        const response = await fetch(`/api/property/${params.id}/propertySettings`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch amenities")
        }

        const data = await response.json()
        setSelectedAmenities(data.amenities || [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load amenities")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [paramsPromise])

  const toggleAmenity = (amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity]
    setSelectedAmenities(newAmenities)
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const params = await paramsPromise
      const response = await fetch(`/api/property/${params.id}/propertySettings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenities: selectedAmenities
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update amenities")
      }

      toast.success("Amenities saved successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update amenities")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {amenitiesList.map((amenity) => {
          const Icon = amenity.icon
          return (
            <button
              key={amenity.id}
              onClick={() => toggleAmenity(amenity.id)}
              className={cn(
                "relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors",
                selectedAmenities.includes(amenity.id)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              disabled={isLoading}
            >
              <Icon className="w-6 h-6 opacity-60" />
              <p className="text-xs font-medium">{amenity.label}</p>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export function PetPolicyForm() {
  const paramsPromise = useParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [petPolicy, setPetPolicy] = React.useState<PetPolicy>({
    petsAllowed: null,
    allowedPets: [],
    description: ""
  })

  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const params = await paramsPromise
        const response = await fetch(`/api/property/${params.id}/propertySettings`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch pet policy")
        }

        const data = await response.json()
        setPetPolicy({
          petsAllowed: data.pet_policy?.petsAllowed ?? null,
          allowedPets: data.pet_policy?.allowedPets || [],
          description: data.pet_policy?.description || ""
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load pet policy")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [paramsPromise])

  const togglePetType = (petType: string) => {
    const newAllowedPets = petPolicy.allowedPets.includes(petType)
      ? petPolicy.allowedPets.filter(p => p !== petType)
      : [...petPolicy.allowedPets, petType]
    setPetPolicy(prev => ({ ...prev, allowedPets: newAllowedPets }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      const params = await paramsPromise
      const response = await fetch(`/api/property/${params.id}/propertySettings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_policy: {
            petsAllowed: petPolicy.petsAllowed,
            allowedPets: petPolicy.allowedPets,
            description: petPolicy.description
          }
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update pet policy")
      }

      toast.success("Pet policy saved successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update pet policy")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPetPolicy(prev => ({ ...prev, petsAllowed: true }))}
            className={cn(
              "relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors",
              petPolicy.petsAllowed === true
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
            disabled={isLoading}
          >
            <CircleCheck className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">Pets Allowed</p>
          </button>
          <button
            onClick={() => setPetPolicy(prev => ({ ...prev, petsAllowed: false }))}
            className={cn(
              "relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors",
              petPolicy.petsAllowed === false
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
            disabled={isLoading}
          >
            <Ban className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">No Pets Allowed</p>
          </button>
        </div>

        {petPolicy.petsAllowed && (
          <>
            <div className="space-y-4">
              <Label>Allowed Pet Types</Label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => togglePetType('dog')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                    petPolicy.allowedPets.includes('dog')
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  disabled={isLoading}
                >
                  <Dog className="w-6 h-6" />
                  <span className="text-sm">Dogs</span>
                </button>

                <button
                  onClick={() => togglePetType('cat')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                    petPolicy.allowedPets.includes('cat')
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  disabled={isLoading}
                >
                  <Cat className="w-6 h-6" />
                  <span className="text-sm">Cats</span>
                </button>

                <button
                  onClick={() => togglePetType('other')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                    petPolicy.allowedPets.includes('other')
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  disabled={isLoading}
                >
                  <Rabbit className="w-6 h-6" />
                  <span className="text-sm">Other Pets</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Pet Policy Description</Label>
              <Textarea
                id="description"
                value={petPolicy.description}
                onChange={(e) => setPetPolicy(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter any additional details about your pet policy..."
                rows={4}
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading || petPolicy.petsAllowed === null}
        >
          Save Changes
        </Button>
      </div>
    </div>
  )
}

interface AddOwnerFormProps {
  onSuccess: (owner: Owner) => void
  existingOwners: Owner[]
}

function AddOwnerForm({ onSuccess, existingOwners }: AddOwnerFormProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Owner[]>([]);
  const [initialOwners, setInitialOwners] = React.useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = React.useState<Owner | null>(null);
  const [ownershipPercentage, setOwnershipPercentage] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchOwners = async () => {
      try {
        console.log('Fetching owners...');
        const response = await fetch('/api/people/owner/search', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Owners API response status:', response.status);
        
        if (response.status === 401) {
          console.error('Authentication error - redirecting to login');
          window.location.href = '/login';
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(`Failed to fetch owners: ${response.status} - ${errorData.error || ''} ${errorData.details || ''}`);
        }
        
        const data = await response.json();
        console.log('Owners data received:', data);
        
        // Filter out existing owners from both initial and search results
        const filteredOwners = (data || []).filter(
          (owner: Owner) => !existingOwners.some(existing => existing.id === owner.id)
        );
        
        setInitialOwners(filteredOwners);
        setSearchResults(filteredOwners);
      } catch (error) {
        console.error('Error fetching owners:', error);
        toast.error('Failed to load owners. Please try refreshing the page.');
      }
    };

    fetchOwners();
  }, [existingOwners]); // Add existingOwners to dependency array

  // Update search results when existingOwners changes
  React.useEffect(() => {
    const filteredOwners = initialOwners.filter(
      owner => !existingOwners.some(existing => existing.id === owner.id)
    );
    setSearchResults(filteredOwners);
  }, [existingOwners, initialOwners]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      const filteredInitialOwners = initialOwners.filter(
        owner => !existingOwners.some(existing => existing.id === owner.id)
      );
      setSearchResults(filteredInitialOwners);
      return;
    }

    const filtered = initialOwners
      .filter(owner => 
        !existingOwners.some(existing => existing.id === owner.id) &&
        (owner.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        owner.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        (owner.unit?.property_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (owner.unit?.unit_number || '').toLowerCase().includes(query.toLowerCase()))
      );
    setSearchResults(filtered);
  };

  const handleSubmit = async () => {
    if (!selectedOwner) return;

    const ownerToAdd = {
      id: selectedOwner.id,
      first_name: selectedOwner.first_name,
      last_name: selectedOwner.last_name,
      email: selectedOwner.email,
      ownership_percentage: ownershipPercentage
    };

    onSuccess(ownerToAdd);
    setSelectedOwner(null);
    setOwnershipPercentage(0);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={id}>Search Owner</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
            >
              <span className={cn("truncate", !selectedOwner && "text-muted-foreground")}>
                {selectedOwner
                  ? `${selectedOwner.first_name} ${selectedOwner.last_name}`
                  : "Select owner"}
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
              <CommandInput 
                placeholder="Search owner..." 
                value={searchQuery}
                onValueChange={(value) => {
                  handleSearch(value);
                }}
              />
              <CommandList>
                <CommandEmpty>No owners found.</CommandEmpty>
                <CommandGroup>
                  {searchResults.map((owner) => (
                    <CommandItem
                      key={`${owner.id}-${owner.email}`}
                      value={`${owner.id}-${owner.email}`}
                      onSelect={() => {
                        setSelectedOwner(owner);
                        setOpen(false);
                      }}
                    >
                      <div>
                        <p>
                          {owner.first_name} {owner.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{owner.email}</p>
                      </div>
                      {selectedOwner?.id === owner.id && (
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

      {selectedOwner && (
        <div className="space-y-2">
          <Label>Ownership Percentage</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={ownershipPercentage}
              onChange={(e) => setOwnershipPercentage(Number(e.target.value))}
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedOwner}
        >
          Add Owner
        </Button>
      </div>
    </div>
  );
}

export function OwnersForm() {
  const params = useParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [owners, setOwners] = React.useState<Owner[]>([]);
  const [showAddOwnerDialog, setShowAddOwnerDialog] = React.useState(false);

  // Expose the setShowAddOwnerDialog function
  React.useEffect(() => {
    const formElement = document.querySelector('[data-owners-form]') as FormElement;
    if (formElement) {
      formElement.__showAddOwnerDialog = setShowAddOwnerDialog;
    }
  }, []);

  const fetchOwnerDetails = React.useCallback(async () => {
    try {
      const response = await fetch('/api/people/owner/search', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch owner details");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching owner details:', error);
      toast.error('Failed to load owner details');
      return [];
    }
  }, []);

  const fetchOwners = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [propertyResponse, ownerDetails] = await Promise.all([
        fetch(`/api/property/${params.id}/propertySettings`),
        fetchOwnerDetails(),
      ]);
      
      if (!propertyResponse.ok) {
        throw new Error("Failed to fetch property data");
      }

      const data = await propertyResponse.json();
      const savedOwners = data.owners || [];
      
      // Merge saved owners with their details
      const ownersWithDetails = savedOwners.map((savedOwner: Owner) => {
        const details = ownerDetails.find((o: Owner) => o.id === savedOwner.id);
        return {
          ...savedOwner,
          first_name: details?.first_name || savedOwner.first_name,
          last_name: details?.last_name || savedOwner.last_name,
          email: details?.email || savedOwner.email,
          company: details?.company || savedOwner.company,
        };
      });

      setOwners(ownersWithDetails);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load owners data");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, fetchOwnerDetails]);

  React.useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/property/${params.id}/propertySettings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owners
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update owners");
      }

      toast.success("Owners updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update owners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOwner = (owner: Owner) => {
    // Remove any existing owner with the same ID first
    const filteredOwners = owners.filter(existingOwner => existingOwner.id !== owner.id);
    // Add the new owner
    setOwners([...filteredOwners, owner]);
    setShowAddOwnerDialog(false);
  };

  const handleRemoveOwner = (ownerId: string) => {
    setOwners(prev => prev.filter(owner => owner.id !== ownerId));
  };

  const totalPercentage = owners.reduce((sum, owner) => sum + (owner.ownership_percentage || 0), 0);
  const canSave = owners.length === 0 || totalPercentage === 100;

  return (
    <div className="space-y-6" data-owners-form>
      <div>
        {!canSave && owners.length > 0 && (
          <p className="text-sm text-red-500">
            Total ownership must equal 100%
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : owners.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No owners added yet</p>
          <p className="text-sm">Click the button above to add property owners</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {owners.map((owner) => (
            <div
              key={owner.id}
              className="aspect-square flex flex-col items-center p-3 border rounded-lg hover:border-primary/50 transition-colors relative group"
            >
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                onClick={() => handleRemoveOwner(owner.id)}
              >
                <X className="w-3 h-3" />
              </Button>

              <div className="flex flex-col items-center space-y-2 flex-1 justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold line-clamp-1 text-base">
                    {owner.first_name} {owner.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{owner.email}</p>
                  {owner.company && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {owner.company}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Ownership %</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-semibold">{owner.ownership_percentage || ''}</span>
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!canSave || isLoading}
        >
          Save Changes
        </Button>
      </div>

      <Dialog open={showAddOwnerDialog} onOpenChange={setShowAddOwnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Property Owner</DialogTitle>
          </DialogHeader>
          <AddOwnerForm
            existingOwners={owners}
            onSuccess={(owner) => {
              handleAddOwner(owner);
              toast.success("Owner added successfully");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 