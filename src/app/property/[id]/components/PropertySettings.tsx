"use client"

import * as React from "react"
import Link from "next/link"
import { 
  MessageSquare,
  Camera,
  Bell,
  BookUser,
  KeyRound,
  CircleDollarSign,
  Building,
  Info,
  Phone,
} from "lucide-react"
import { ContactInfoDialog } from "./ContactInfoDialog"

interface SettingLinkProps {
  icon: React.ReactNode
  label: string
  description: string
  href: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

const SettingLink = ({ icon, label, description, href, onClick }: SettingLinkProps) => (
  <Link
    href={href}
    className="relative flex w-full items-center gap-3 rounded-lg border border-input p-4 shadow-sm shadow-black/5 hover:border-ring transition-colors bg-card"
    onClick={onClick}
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
  const [contactDialogOpen, setContactDialogOpen] = React.useState(false);

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
      id: 'contact-info',
      icon: <Phone className="w-5 h-5 text-green-600" />,
      label: "Contact Info",
      description: "Update the contact information for this property."
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
    }
  ]

  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {settings.map((setting) => (
          <div key={setting.id}>
            <SettingLink
              icon={setting.icon}
              label={setting.label}
              description={setting.description}
              href={`/property/${params.id}/settings?section=${setting.id}`}
              onClick={setting.id === 'contact-info' ? (e) => {
                e.preventDefault();
                setContactDialogOpen(true);
              } : undefined}
            />
          </div>
        ))}
      </div>
      <ContactInfoDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} propertyId={params.id} />
    </div>
  )
} 