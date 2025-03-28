"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Search } from "lucide-react"

interface Property {
  id: string
  title: string
  address: string
  city: string
  province: string
  postalCode: string
  image: string
  availability: string
}

interface PropertiesPageProps {
  onNext: () => void
  onPrevious: () => void
}

export default function PropertiesPage({ onNext, onPrevious }: PropertiesPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])

  // Sample properties data
  const properties: Property[] = [
    {
      id: "1",
      title: "64 Tawes trail - Unit 64",
      address: "64 Tawes Trail",
      city: "King City",
      province: "ON",
      postalCode: "L7B1B4",
      image: "/placeholder.svg?height=200&width=400",
      availability: "Available 3/18/2025",
    },
    {
      id: "2",
      title: "128 Oakwood Avenue - Unit 3B",
      address: "128 Oakwood Avenue",
      city: "Toronto",
      province: "ON",
      postalCode: "M6E2V4",
      image: "/placeholder.svg?height=200&width=400",
      availability: "Available 4/1/2025",
    },
    {
      id: "3",
      title: "75 Riverside Drive - Unit 1201",
      address: "75 Riverside Drive",
      city: "Ottawa",
      province: "ON",
      postalCode: "K1S5K2",
      image: "/placeholder.svg?height=200&width=400",
      availability: "Available 5/15/2025",
    },
  ]

  const togglePropertySelection = (propertyId: string) => {
    if (selectedProperties.includes(propertyId)) {
      setSelectedProperties(selectedProperties.filter((id) => id !== propertyId))
    } else {
      setSelectedProperties([...selectedProperties, propertyId])
    }
  }

  const clearSelection = () => {
    setSelectedProperties([])
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="dark">
      <h1 className="mb-6 text-2xl font-bold">Select Properties</h1>
      <p className="mb-6 text-muted-foreground">
        Choose one or more properties that the prospect is interested in, or skip this step.
      </p>

      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="pl-9 bg-background/10 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedProperties.length === 0
              ? "You haven't selected any property yet"
              : `${selectedProperties.length} ${selectedProperties.length === 1 ? "property" : "properties"} selected`}
          </span>
          {selectedProperties.length > 0 && (
            <Button variant="link" className="text-primary p-0 h-auto" onClick={clearSelection}>
              Clear selection
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className={`relative cursor-pointer rounded-lg border border-border bg-background/5 overflow-hidden transition-all ${
              selectedProperties.includes(property.id) ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => togglePropertySelection(property.id)}
          >
            {selectedProperties.includes(property.id) && (
              <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={property.image || "/placeholder.svg"}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="mb-1 font-medium">{property.title}</h3>
              <p className="text-sm text-muted-foreground">
                {property.address}
                <br />
                {property.city}, {property.province} {property.postalCode}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{property.availability}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>{selectedProperties.length > 0 ? "Next" : "Skip"}</Button>
      </div>
    </div>
  )
}

