"use client"

import * as React from "react"
import Link from "next/link"
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

interface SettingLinkProps {
  icon: React.ReactNode
  label: string
  description: string
  href: string
}

const SettingLink = ({ icon, label, description, href }: SettingLinkProps) => (
  <Link
    href={href}
    className="relative flex w-full items-center gap-3 rounded-lg border border-input p-4 shadow-sm shadow-black/5 hover:border-ring transition-colors bg-card"
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
  </Link>
)

interface PropertySettingsProps {
  params: {
    id: string
  }
}

export function PropertySettings({ params }: PropertySettingsProps) {
  const settings = [
    {
      id: 'general-info',
      icon: <Info className="w-5 h-5 text-green-600" />,
      label: "General Information",
      description: "Update the general information for this property."
    },
    {
      id: 'photos',
      icon: <Camera className="w-5 h-5 text-green-600" />,
      label: "Photos",
      description: "Update the photos for this property."
    },
    {
      id: 'property-type',
      icon: <Building className="w-5 h-5 text-green-600" />,
      label: "Property Type",
      description: "Update the property type for this property."
    },
    {
      id: 'amenities',
      icon: <HousePlug className="w-5 h-5 text-green-600" />,
      label: "Amenities",
      description: "Update the amenities for this property."
    },
    {
      id: 'pet-policy',
      icon: <Dog className="w-5 h-5 text-green-600" />,
      label: "Pet Policy",
      description: "Update the pet policy for this property."
    },
    {
      id: 'owners',
      icon: <Users className="w-5 h-5 text-green-600" />,
      label: "Owners",
      description: "Update the owners for this property."
    },
    {
      id: 'bank-accounts',
      icon: <Landmark className="w-5 h-5 text-green-600" />,
      label: "Bank Accounts",
      description: "Update the bank accounts for this property."
    },
    {
      id: 'reserve-funds',
      icon: <PiggyBank className="w-5 h-5 text-green-600" />,
      label: "Reserve Funds",
      description: "Update the reserve funds for this property."
    },
    {
      id: 'late-fees',
      icon: <CircleDollarSign className="w-5 h-5 text-green-600" />,
      label: "Late Fees",
      description: "Update the late fees for this property."
    },
    {
      id: 'tenant-portal',
      icon: <KeyRound className="w-5 h-5 text-green-600" />,
      label: "Tenant Portal",
      description: "Update the tenant portal for this property."
    },
    {
      id: 'notifications',
      icon: <Bell className="w-5 h-5 text-green-600" />,
      label: "Notifications",
      description: "Update the rent & payment notifications."
    },
    {
      id: 'tenant-requests',
      icon: <MessageSquare className="w-5 h-5 text-green-600" />,
      label: "Tenant Requests",
      description: "Update the tenant requests for this property."
    },
    {
      id: 'rental-applications',
      icon: <BookUser className="w-5 h-5 text-green-600" />,
      label: "Rental Applications",
      description: "Update the rental applications for this property."
    },
    {
      id: 'payment-instructions',
      icon: <ClipboardList className="w-5 h-5 text-green-600" />,
      label: "Payment Instructions",
      description: "Update the payment instructions for this property."
    },
    {
      id: 'management-fees',
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      label: "Management Fees",
      description: "Update the management fees for this property."
    },
    {
      id: 'payment-allocation',
      icon: <HandCoins className="w-5 h-5 text-green-600" />,
      label: "Payment Allocation",
      description: "Update the payment allocation for this property."
    },
    {
      id: 'custom-allocations',
      icon: <Wrench className="w-5 h-5 text-green-600" />,
      label: "Custom Allocations",
      description: "Update the custom allocations for this property."
    },
  ]

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {settings.map((setting) => (
          <SettingLink
            key={setting.id}
            icon={setting.icon}
            label={setting.label}
            description={setting.description}
            href={`/property/${params.id}/settings?section=${setting.id}`}
          />
        ))}
      </div>
    </div>
  )
} 