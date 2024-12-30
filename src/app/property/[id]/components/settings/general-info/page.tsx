"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCharacterLimit } from "@/hooks/use-character-limit"

interface GeneralInfoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface GeneralInfoForm {
  name: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  description: string
}

export default function GeneralInfo({ open, onOpenChange }: GeneralInfoProps) {
  const params = useParams()
  const propertyId = params.id as string
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
    async function fetchPropertyData() {
      try {
        setIsLoading(true)
        console.log("Starting to fetch property data for ID:", propertyId)
        
        const response = await fetch(`/api/property/${propertyId}/propertySettings`)
        console.log("Response received:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          console.error("Error response:", {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          })
          throw new Error(errorData?.error || "Failed to fetch property data")
        }

        const data = await response.json()
        console.log("Successfully received property data:", data)
        
        if (!data) {
          console.error("No data received from API")
          throw new Error("No data received from API")
        }

        setFormData({
          name: data.name || "",
          address_line_1: data.address_line_1 || "",
          address_line_2: data.address_line_2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          description: ""
        })
        setDescription(data.description || "")
      } catch (error) {
        console.error("Error in fetchPropertyData:", error instanceof Error ? error.message : "Unknown error")
        toast.error(error instanceof Error ? error.message : "Failed to load property information")
      } finally {
        setIsLoading(false)
      }
    }

    if (propertyId) {
      fetchPropertyData()
    }
  }, [propertyId, setDescription])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      console.log("Updating property data for ID:", propertyId)
      const updateData = {
        ...formData,
        description
      }
      console.log("Update data:", updateData)
      const response = await fetch(`/api/property/${propertyId}/propertySettings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      
      console.log("Response status:", response.status)
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error("Error response:", {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        })
        throw new Error(errorData?.error || "Failed to update property")
      }
      
      const data = await response.json()
      console.log("Update response:", data)
      
      toast.success("Property information updated successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update property information")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>General Information</DialogTitle>
        </DialogHeader>
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
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 