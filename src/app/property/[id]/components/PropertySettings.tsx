"use client"

import * as React from "react"
import { 
  Users,
  MessageSquare,
  DollarSign,
  Wrench,
  Camera,
  Bell,
  HandCoins,
  ClipboardList,
  BookUser,
  KeyRound,
  CircleDollarSign,
  PiggyBank,
  Landmark,
  Dog,
  HousePlug,
  Building,
  Info,
} from "lucide-react"
import GeneralInfo from "@/app/property/[id]/components/settings/general-info/page"
import PropertyType from "@/app/property/[id]/components/settings/property-type/page"
import Amenities from "@/app/property/[id]/components/settings/amenities/page"
import PetPolicy from "@/app/property/[id]/components/settings/pet-policy/page"
import BankAccount from "@/app/property/[id]/components/settings/bank-account/page"
import Photos from "@/app/property/[id]/components/settings/photos/page"

interface SettingButtonProps {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}

const SettingButton = ({ icon, label, description, onClick }: SettingButtonProps) => (
  <button
    onClick={onClick}
    className="relative flex w-full items-center gap-3 rounded-lg border border-input p-4 shadow-sm shadow-black/5 hover:border-ring transition-colors bg-white"
  >
    <div className="shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  </button>
)

export function PropertySettings() {
  const [showGeneralInfo, setShowGeneralInfo] = React.useState(false)
  const [showPropertyType, setShowPropertyType] = React.useState(false)
  const [showAmenities, setShowAmenities] = React.useState(false)
  const [showPetPolicy, setShowPetPolicy] = React.useState(false)
  const [showBankAccount, setShowBankAccount] = React.useState(false)
  const [showPhotos, setShowPhotos] = React.useState(false)
  const settings = [
    {
      icon: <Info className="w-5 h-5 text-green-600" />,
      label: "General Information",
      description: "Update the general information for this property.",
      onClick: () => setShowGeneralInfo(true)
    },
    {
      icon: <Camera className="w-5 h-5 text-green-600" />,
      label: "Photos",
      description: "Update the photos for this property.",
      onClick: () => setShowPhotos(true)
    },
    {
      icon: <Building className="w-5 h-5 text-green-600" />,
      label: "Property Type",
      description: "Update the property type for this property.",
      onClick: () => setShowPropertyType(true)
    },
    {
      icon: <HousePlug className="w-5 h-5 text-green-600" />,
      label: "Amenities",
      description: "Update the amenities for this property.",
      onClick: () => setShowAmenities(true)
    },
    {
      icon: <Dog className="w-5 h-5 text-green-600" />,
      label: "Pet Policy",
      description: "Update the pet policy for this property.",
      onClick: () => setShowPetPolicy(true)
    },
    {
      icon: <Users className="w-5 h-5 text-green-600" />,
      label: "Owners",
      description: "Update the owners for this property."
    },
    {
      icon: <Landmark className="w-5 h-5 text-green-600" />,
      label: "Bank Accounts",
      description: "Update the bank accounts for this property.",
      onClick: () => setShowBankAccount(true)
    },
    {
      icon: <PiggyBank className="w-5 h-5 text-green-600" />,
      label: "Reserve Funds",
      description: "Update the reserve funds for this property."
    },
    {
      icon: <CircleDollarSign className="w-5 h-5 text-green-600" />,
      label: "Late Fees",
      description: "Update the late fees for this property."
    },
    {
      icon: <KeyRound className="w-5 h-5 text-green-600" />,
      label: "Tenant Portal",
      description: "Update the tenant portal for this property."
    },
    {
      icon: <Bell className="w-5 h-5 text-green-600" />,
      label: "Notifications",
      description: "Update the rent & payment notifications."
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-green-600" />,
      label: "Tenant Requests",
      description: "Update the tenant requests for this property."
    },
    {
      icon: <BookUser className="w-5 h-5 text-green-600" />,
      label: "Rental Applications",
      description: "Update the rental applications for this property."
    },
    {
      icon: <ClipboardList className="w-5 h-5 text-green-600" />,
      label: "Payment Instructions",
      description: "Update the payment instructions for this property."
    },
    {
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      label: "Management Fees",
      description: "Update the management fees for this property."
    },
    {
      icon: <HandCoins className="w-5 h-5 text-green-600" />,
      label: "Payment Allocation",
      description: "Update the payment allocation for this property."
    },
    {
      icon: <Wrench className="w-5 h-5 text-green-600" />,
      label: "Custom Allocations",
      description: "Update the custom allocations for this property."
    },
  ]

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {settings.map((setting, index) => (
          <SettingButton
            key={index}
            icon={setting.icon}
            label={setting.label}
            description={setting.description}
            onClick={setting.onClick || (() => console.log(`Clicked ${setting.label}`))}
          />
        ))}
      </div>

      <GeneralInfo open={showGeneralInfo} onOpenChange={setShowGeneralInfo} />
      <PropertyType open={showPropertyType} onOpenChange={setShowPropertyType} />
      <Amenities open={showAmenities} onOpenChange={setShowAmenities} />
      <PetPolicy open={showPetPolicy} onOpenChange={setShowPetPolicy} />
      <BankAccount open={showBankAccount} onOpenChange={setShowBankAccount} />
      <Photos open={showPhotos} onOpenChange={setShowPhotos} />
    </div>
  )
} 