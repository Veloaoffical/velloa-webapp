"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CarFront, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"

// Define vehicle form interface
interface VehicleForm {
  id: number
  make: string
  model: string
  year: string
  licensePlate: string
  isExpanded: boolean
}

interface VehiclesDetailsPageProps {
  vehicleForms: VehicleForm[]
  onVehicleFormChange: (id: number, field: string, value: string) => void
  onToggleVehicleForm: (id: number) => void
  onRemoveVehicleForm: (id: number) => void
  onAddVehicleForm: () => void
  onNext: () => void
  onPrevious: () => void
}

export default function VehiclesDetailsPage({
  vehicleForms,
  onVehicleFormChange,
  onToggleVehicleForm,
  onRemoveVehicleForm,
  onAddVehicleForm,
  onNext,
  onPrevious,
}: VehiclesDetailsPageProps) {
  // Render a single vehicle form
  const renderVehicleForm = (form: VehicleForm, index: number) => {
    if (!form.isExpanded) {
      // Collapsed view for vehicles
      return (
        <div key={form.id} className="mb-2">
          <button
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/5 p-4 text-left transition-colors hover:bg-muted/10"
            onClick={() => onToggleVehicleForm(form.id)}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              <span className="font-medium">
                Vehicle {index + 1}: {form.make || "Vehicle"} {form.model ? `${form.model}` : ""}{" "}
                {form.year ? `(${form.year})` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveVehicleForm(form.id)
                }}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      )
    }

    return (
      <div key={form.id} className="mb-4">
        <div className="flex w-full items-center justify-between rounded-t-lg border border-b-0 border-border bg-muted/5 p-4">
          <div className="flex items-center gap-2">
            <CarFront className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Vehicle {index + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onRemoveVehicleForm(form.id)}
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onToggleVehicleForm(form.id)}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="sr-only">Collapse</span>
            </Button>
          </div>
        </div>

        {/* Vehicle Information Section */}
        <div className="rounded-b-lg border-x border-b border-border bg-muted/5 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`make-${form.id}`} className="flex items-center">
                Make <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`make-${form.id}`}
                placeholder="Enter vehicle make (e.g., Toyota, Honda)"
                value={form.make}
                onChange={(e) => onVehicleFormChange(form.id, "make", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`model-${form.id}`} className="flex items-center">
                Model <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`model-${form.id}`}
                placeholder="Enter vehicle model"
                value={form.model}
                onChange={(e) => onVehicleFormChange(form.id, "model", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`year-${form.id}`} className="flex items-center">
                Year <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`year-${form.id}`}
                placeholder="Enter vehicle year"
                value={form.year}
                onChange={(e) => onVehicleFormChange(form.id, "year", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`licensePlate-${form.id}`} className="flex items-center">
                License Plate <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`licensePlate-${form.id}`}
                placeholder="Enter license plate number"
                value={form.licensePlate}
                onChange={(e) => onVehicleFormChange(form.id, "licensePlate", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Vehicle Details</h1>
      <p className="mb-6 text-muted-foreground">Enter information about your vehicles.</p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-0">{vehicleForms.map((form, index) => renderVehicleForm(form, index))}</CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1" type="button" onClick={onAddVehicleForm}>
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
            <Button onClick={onNext}>Next</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

