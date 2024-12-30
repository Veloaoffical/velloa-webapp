"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
import { Baby, Dumbbell, GlassWater } from "lucide-react"

interface AmenitiesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function Amenities({ open, onOpenChange }: AmenitiesProps) {
  const params = useParams()
  const supabase = createClientComponentClient()
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  // Fetch amenities when component mounts
  React.useEffect(() => {
    fetchAmenities()
  }, [])

  const fetchAmenities = async () => {
    try {
      const { data: settings, error } = await supabase
        .from("property_settings")
        .select("value")
        .eq("property_id", params.id)
        .single()

      if (error) throw error

      if (settings?.value) {
        // Handle double stringified JSON
        let parsedValue = settings.value
        if (typeof parsedValue === 'string') {
          parsedValue = JSON.parse(parsedValue)
          // Check if it's still a string (double stringified)
          if (typeof parsedValue === 'string') {
            parsedValue = JSON.parse(parsedValue)
          }
        }

        setSelectedAmenities(parsedValue.amenities || [])
      }
    } catch (error) {
      console.error('Failed to fetch amenities:', error)
      toast.error('Failed to load amenities')
    }
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // First get existing settings
      const { data: existingSettings, error: fetchError } = await supabase
        .from("property_settings")
        .select("value")
        .eq("property_id", params.id)
        .single()

      if (fetchError) throw fetchError

      // Parse existing settings
      let currentSettings = existingSettings?.value || {}
      if (typeof currentSettings === 'string') {
        currentSettings = JSON.parse(currentSettings)
        // Check if it's still a string (double stringified)
        if (typeof currentSettings === 'string') {
          currentSettings = JSON.parse(currentSettings)
        }
      }

      // Update settings with new amenities
      const newSettings = {
        ...currentSettings,
        amenities: selectedAmenities
      }

      // Update settings - stringify only once
      const { error: updateError } = await supabase
        .from("property_settings")
        .update({
          value: JSON.stringify(newSettings)
        })
        .eq('property_id', params.id)

      if (updateError) throw updateError

      toast.success('Amenities updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save amenities:', error)
      toast.error('Failed to save amenities')
    } finally {
      setIsLoading(false)
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 z-50 bg-white pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Property Amenities</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {amenitiesList.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => toggleAmenity(id)}
                  className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                    selectedAmenities.includes(id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="opacity-60" size={24} />
                  <p className="text-xs font-medium">{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 bg-white pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 