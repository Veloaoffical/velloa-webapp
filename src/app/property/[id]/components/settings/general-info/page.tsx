"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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
  country: string
  description: string
}

export default function GeneralInfo({ open, onOpenChange }: GeneralInfoProps) {
  const params = useParams()
  const propertyId = params.id as string
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<GeneralInfoForm>({
    name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    description: ""
  })

  React.useEffect(() => {
    async function fetchPropertyData() {
      if (!open) return
      
      try {
        setIsLoading(true)
        console.log("Fetching property data for ID:", propertyId)
        const response = await fetch(`/api/property/${propertyId}/generalinfo`)
        console.log("Response status:", response.status)
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error("Failed to fetch property data")
        }
        const data = await response.json()
        console.log("Received data:", data)
        setFormData({
          name: data.name || "",
          address_line_1: data.address_line_1 || "",
          address_line_2: data.address_line_2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          country: data.country || "",
          description: data.description || "",
        })
      } catch (error) {
        console.error("Fetch error:", error)
        toast({
          title: "Error",
          description: "Failed to load property information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyData()
  }, [open, propertyId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      console.log("Updating property data for ID:", propertyId)
      console.log("Update data:", formData)
      const response = await fetch(`/api/property/${propertyId}/generalinfo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      console.log("Response status:", response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error("Failed to update property")
      }
      
      const data = await response.json()
      console.log("Update response:", data)
      
      toast({
        title: "Success",
        description: "Property information updated successfully",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: "Failed to update property information",
        variant: "destructive",
      })
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
            <Label htmlFor="address_line_2">Apartment, suite, etc.</Label>
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
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={4}
            />
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