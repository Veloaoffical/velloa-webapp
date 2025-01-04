"use client"

import * as React from "react"
import { Button } from "@/components/ui/button";
import { Bed, Bath, Ruler, DollarSign, Trash2 } from "lucide-react";

interface SettingButtonProps {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

const SettingButton = ({ icon, label, description, onClick, variant = 'default' }: SettingButtonProps) => (
  <button
    onClick={onClick}
    className={`relative flex w-full items-center gap-3 rounded-lg border border-input p-4 shadow-sm shadow-black/5 hover:border-ring transition-colors bg-white ${
      variant === 'danger' ? 'hover:border-red-500' : ''
    }`}
  >
    <div className={`shrink-0 w-10 h-10 rounded-lg ${
      variant === 'danger' ? 'bg-red-100' : 'bg-green-100'
    } flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <div className="flex items-center gap-1">
        <span className={`font-medium ${variant === 'danger' ? 'text-red-600' : ''}`}>{label}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  </button>
)

interface UnitSettingsProps {
  unitId: string;
}

export function UnitSettings({ unitId }: UnitSettingsProps) {
  const [showBeds, setShowBeds] = React.useState(false)
  const [showBaths, setShowBaths] = React.useState(false)
  const [showSize, setShowSize] = React.useState(false)
  const [showRent, setShowRent] = React.useState(false)
  const [showDelete, setShowDelete] = React.useState(false)

  const settings = [
    {
      icon: <Bed className="w-5 h-5 text-green-600" />,
      label: "Beds",
      description: "Update the number of beds in this unit.",
      onClick: () => setShowBeds(true)
    },
    {
      icon: <Bath className="w-5 h-5 text-green-600" />,
      label: "Baths",
      description: "Update the number of bathrooms in this unit.",
      onClick: () => setShowBaths(true)
    },
    {
      icon: <Ruler className="w-5 h-5 text-green-600" />,
      label: "Size",
      description: "Update the size of this unit.",
      onClick: () => setShowSize(true)
    },
    {
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      label: "Rent",
      description: "Update the rent for this unit.",
      onClick: () => setShowRent(true)
    },
    {
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
      label: "Delete Unit",
      description: "Permanently delete this unit and all its data.",
      onClick: () => setShowDelete(true),
      variant: 'danger' as const
    }
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
            onClick={setting.onClick}
            variant={setting.variant}
          />
        ))}
      </div>

      {/* TODO: Add dialog components for each setting */}
    </div>
  )
} 