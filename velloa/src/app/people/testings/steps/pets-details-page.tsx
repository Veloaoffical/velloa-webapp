"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, Dog, Minus, Plus, Trash, Upload } from "lucide-react"
import { toast } from "sonner"

// Define pet form interface
interface PetForm {
  id: number
  type: string
  breed: string
  weight: string
  sex: string
  age: string
  photo: File | null
  photoPreview: string | null
  isExpanded: boolean
}

interface PetsDetailsPageProps {
  petForms: PetForm[]
  onPetFormChange: (id: number, field: string, value: unknown) => void
  onTogglePetForm: (id: number) => void
  onRemovePetForm: (id: number) => void
  onAddPetForm: () => void
  onNext: () => void
  onPrevious: () => void
}

// Validation function for a single pet
const validatePet = (form: PetForm): string[] => {
  const missingFields: string[] = [];
  if (!form.type) missingFields.push("Type");
  if (!form.breed) missingFields.push("Breed");
  if (!form.weight) missingFields.push("Weight");
  if (!form.sex) missingFields.push("Sex");
  if (!form.age) missingFields.push("Age");
  if (!form.photo) missingFields.push("Pet Photo");
  return missingFields;
};

export default function PetsDetailsPage({
  petForms,
  onPetFormChange,
  onTogglePetForm,
  onRemovePetForm,
  onAddPetForm,
  onNext,
  onPrevious,
}: PetsDetailsPageProps) {

  // Handler for adding a new pet with validation
  const handleAddPetClick = () => {
    if (petForms.length > 0) {
      const lastPet = petForms[petForms.length - 1];
      const missingFields = validatePet(lastPet);
      if (missingFields.length > 0) {
        toast.error("Missing Pet Information", {
          description: `Please fill out the following fields for the current pet before adding another: ${missingFields.join(", ")}.`
        });
        return; // Stop if validation fails
      }
    }
    onAddPetForm(); // Proceed if validation passes
  };

  // Handler for the Next button with validation
  const handleNextClick = () => {
    if (petForms.length === 0) {
      toast.error("Missing Pet Information", {
        description: "Please add at least one pet or go back to indicate you have no pets."
      });
      return; // Stop if no pets are added
    }

    const lastPet = petForms[petForms.length - 1];
    const missingFields = validatePet(lastPet);
    if (missingFields.length > 0) {
      toast.error("Missing Pet Information", {
        description: `Please fill out the following fields for the last pet before proceeding: ${missingFields.join(", ")}.`
      });
      return; // Stop if validation fails
    }

    onNext(); // Proceed if validation passes
  };

  // Render a single pet form
  const renderPetForm = (form: PetForm, index: number) => {
    if (!form.isExpanded) {
      // Collapsed view for pets
      return (
        <div key={form.id} className="mb-2">
          <div
            className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/5 p-4 text-left transition-colors hover:bg-muted/10 cursor-pointer"
            onClick={() => onTogglePetForm(form.id)}
          >
            <div className="flex items-center gap-2">
              <Dog className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                Pet {index + 1}: {form.type || "Pet"} {form.breed ? `- ${form.breed}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemovePetForm(form.id)
                }}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={form.id} className="mb-4">
        <div className="flex w-full items-center justify-between rounded-t-lg border border-b-0 border-border bg-muted/5 p-4">
          <div className="flex items-center gap-2">
            <Dog className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Pet {index + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onRemovePetForm(form.id)}
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => onTogglePetForm(form.id)}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="sr-only">Collapse</span>
            </Button>
          </div>
        </div>

        {/* Pet Information Section */}
        <div className="border-x border-b border-border bg-muted/5 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`type-${form.id}`} className="flex items-center">
                Type <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`type-${form.id}`}
                placeholder="Enter pet type (e.g., Dog, Cat)"
                value={form.type}
                onChange={(e) => onPetFormChange(form.id, "type", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`breed-${form.id}`} className="flex items-center">
                Breed <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`breed-${form.id}`}
                placeholder="Enter pet breed"
                value={form.breed}
                onChange={(e) => onPetFormChange(form.id, "breed", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`weight-${form.id}`} className="flex items-center">
                Weight (lbs) <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`weight-${form.id}`}
                placeholder="Enter pet weight"
                value={form.weight}
                onChange={(e) => onPetFormChange(form.id, "weight", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`sex-${form.id}`} className="flex items-center">
                Sex <span className="ml-1 text-destructive">*</span>
              </Label>
              <Select value={form.sex} onValueChange={(value) => onPetFormChange(form.id, "sex", value)}>
                <SelectTrigger id={`sex-${form.id}`} className="bg-background/10 border-border">
                  <SelectValue placeholder="Select Sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`age-${form.id}`} className="flex items-center">
                Age <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id={`age-${form.id}`}
                placeholder="Enter pet age"
                value={form.age}
                onChange={(e) => onPetFormChange(form.id, "age", e.target.value)}
                className="bg-background/10 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">
                Pet Photo <span className="ml-1 text-destructive">*</span>
              </Label>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  id={`pet-photo-${form.id}`}
                  className="sr-only"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      onPetFormChange(form.id, "photo", file)
                    }
                  }}
                />

                {form.photo ? (
                  <div className="flex items-center justify-between rounded-md border border-border bg-background/10 px-3 h-10">
                    <span className="text-sm truncate">{form.photo.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        onPetFormChange(form.id, "photo", null)
                      }}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="gap-2 w-full md:w-auto bg-background/10 border-border"
                    onClick={() => document.getElementById(`pet-photo-${form.id}`)?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                )}

                <p className="text-xs text-muted-foreground">Upload a clear photo of your pet (JPG, PNG)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pet Details</h1>
      <p className="mb-6 text-muted-foreground">Enter information about your pets.</p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-6">
          {petForms.length > 0 ? (
             petForms.map((form, index) => renderPetForm(form, index))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No pets added yet.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1" type="button" onClick={handleAddPetClick}>
              <Plus className="h-4 w-4" />
              Add Pet
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
            <Button onClick={handleNextClick}>Next</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

