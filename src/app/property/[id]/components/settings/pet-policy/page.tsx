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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Ban, Check, Dog, Cat, Bird, Fish, HelpCircle } from "lucide-react"

interface PetPolicyProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PetPolicyForm {
  petsAllowed: boolean
  allowedPets: string[]
  description: string
}

export default function PetPolicy({ open, onOpenChange }: PetPolicyProps) {
  const params = useParams()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<PetPolicyForm>({
    petsAllowed: false,
    allowedPets: [],
    description: ""
  })

  // Fetch pet policy when component mounts
  React.useEffect(() => {
    const fetchPetPolicy = async () => {
      try {
        const { data: settings, error } = await supabase
          .from("property_settings")
          .select("value")
          .eq("property_id", params.id)
          .single()

        if (error) throw error

        if (settings?.value) {
          let parsedValue = settings.value
          if (typeof parsedValue === 'string') {
            parsedValue = JSON.parse(parsedValue)
            if (typeof parsedValue === 'string') {
              parsedValue = JSON.parse(parsedValue)
            }
          }

          if (parsedValue.petPolicy) {
            setFormData({
              petsAllowed: parsedValue.petPolicy.petsAllowed || false,
              allowedPets: parsedValue.petPolicy.allowedPets || [],
              description: parsedValue.petPolicy.description || ""
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch pet policy:', error)
        toast.error('Failed to load pet policy')
      }
    }

    if (params.id) {
      fetchPetPolicy()
    }
  }, [params.id, supabase])

  const togglePetsAllowed = (allowed: boolean) => {
    setFormData(prev => ({
      ...prev,
      petsAllowed: allowed,
      allowedPets: allowed ? prev.allowedPets : []
    }))
  }

  const togglePetType = (type: string) => {
    if (!formData.petsAllowed) return

    setFormData(prev => ({
      ...prev,
      allowedPets: prev.allowedPets.includes(type)
        ? prev.allowedPets.filter(t => t !== type)
        : [...prev.allowedPets, type]
    }))
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
        if (typeof currentSettings === 'string') {
          currentSettings = JSON.parse(currentSettings)
        }
      }

      // Update settings with new pet policy
      const newSettings = {
        ...currentSettings,
        petPolicy: {
          petsAllowed: formData.petsAllowed,
          allowedPets: formData.allowedPets,
          description: formData.description
        }
      }

      // Update settings
      const { error: updateError } = await supabase
        .from("property_settings")
        .update({
          value: JSON.stringify(newSettings)
        })
        .eq('property_id', params.id)

      if (updateError) throw updateError

      toast.success('Pet policy updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save pet policy:', error)
      toast.error('Failed to save pet policy')
    } finally {
      setIsLoading(false)
    }
  }

  const petTypes = [
    { id: 'dog', label: 'Dogs', icon: Dog },
    { id: 'cat', label: 'Cats', icon: Cat },
    { id: 'bird', label: 'Birds', icon: Bird },
    { id: 'fish', label: 'Fish', icon: Fish },
    { id: 'other', label: 'Other', icon: HelpCircle },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pet Policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <p className="text-center text-gray-600 mb-4">
              Set your pet policy for this property
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => togglePetsAllowed(true)}
                className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                  formData.petsAllowed
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={isLoading}
              >
                <Check className="w-8 h-8 opacity-60" />
                <p className="text-sm font-medium">Pets Allowed</p>
              </button>

              <button
                onClick={() => togglePetsAllowed(false)}
                className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-6 text-center shadow-sm transition-colors ${
                  !formData.petsAllowed
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={isLoading}
              >
                <Ban className="w-8 h-8 opacity-60" />
                <p className="text-sm font-medium">No Pets Allowed</p>
              </button>
            </div>
          </div>

          {formData.petsAllowed && (
            <>
              <div>
                <Label className="mb-4 block">Allowed Pet Types</Label>
                {formData.allowedPets.length === 0 && (
                  <p className="text-center text-sm text-red-500 mb-4">
                    Please select at least one type of pet that is allowed
                  </p>
                )}
                <div className="grid grid-cols-5 gap-4">
                  {petTypes.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => togglePetType(id)}
                      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border px-6 py-4 text-center shadow-sm transition-colors ${
                        formData.allowedPets.includes(id)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      disabled={isLoading}
                    >
                      <Icon className="w-6 h-6 opacity-60" />
                      <p className="text-xs font-medium">{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Pet Policy Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your pet policy, including any restrictions, fees, or special requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={isLoading}
                  rows={4}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || (formData.petsAllowed && formData.allowedPets.length === 0)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 