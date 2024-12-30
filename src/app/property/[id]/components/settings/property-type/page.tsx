"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Building2, Home, Store, Building, Archive, HelpCircle, Building as Building4, Home as HomeSmile } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PropertyTypeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PropertyTypeForm {
  category: string
  type: string
}

export default function PropertyType({ open, onOpenChange }: PropertyTypeProps) {
  const params = useParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<PropertyTypeForm>({
    category: "",
    type: ""
  })

  // Fetch current property type when component mounts
  React.useEffect(() => {
    if (params.id) {
      const fetchPropertyType = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/property/${params.id}/propertySettings`)
          const data = await response.json()

          if (!response.ok) throw new Error(data.error)

          setFormData({
            category: data.category || "",
            type: data.type || ""
          })
        } catch (error) {
          console.error("Error fetching property type:", error)
          toast.error("Failed to load property type")
        } finally {
          setIsLoading(false)
        }
      }

      fetchPropertyType()
    }
  }, [params.id])

  const handleCategorySelect = (category: string) => {
    setFormData({ ...formData, category, type: "" })
  }

  const handleTypeSelect = (selectedType: string) => {
    setFormData({ ...formData, type: selectedType })
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/property/${params.id}/propertySettings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          category: formData.category
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast.success("Property type updated successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save property type:", error)
      toast.error("Failed to save property type")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Property Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <p className="text-center text-gray-600 mb-4">
              Which kind of property do you manage?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
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
              <p className="text-center text-gray-600 mb-4">
                Which type best describes your property?
              </p>
              <div className="grid grid-cols-4 gap-4">
                {formData.category === "residential" ? (
                  <>
                    <button
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
            disabled={isLoading || !formData.category || !formData.type}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 