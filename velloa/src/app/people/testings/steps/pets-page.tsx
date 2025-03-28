"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Ban, Cat, Plus, Upload } from "lucide-react"

interface PetForm {
  id: number
  type: string
  breed: string
  weight: string
  sex: string
  age: string
  photo: string | null
}

interface PetsPageProps {
  onNext: () => void
  onPrevious: () => void
}

export default function PetsPage({ onNext, onPrevious }: PetsPageProps) {
  const [hasPets, setHasPets] = useState<boolean | null>(null)
  const [petForms, setPetForms] = useState<PetForm[]>([
    {
      id: 1,
      type: "",
      breed: "",
      weight: "",
      sex: "",
      age: "",
      photo: null,
    },
  ])

  const addPetForm = () => {
    const newId = petForms.length > 0 ? Math.max(...petForms.map((form) => form.id)) + 1 : 1
    setPetForms([
      ...petForms,
      {
        id: newId,
        type: "",
        breed: "",
        weight: "",
        sex: "",
        age: "",
        photo: null,
      },
    ])
  }

  const updatePetForm = (id: number, field: string, value: string) => {
    setPetForms(petForms.map((form) => (form.id === id ? { ...form, [field]: value } : form)))
  }

  const renderPetForms = () => {
    if (hasPets !== true) return null

    return (
      <div className="mt-6 space-y-6">
        {petForms.map((pet, index) => (
          <Card key={pet.id} className="border-border bg-background/5">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-medium">Pet {index + 1}</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`type-${pet.id}`} className="flex items-center">
                    Type <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Input
                    id={`type-${pet.id}`}
                    placeholder="Enter pet type (e.g., Dog, Cat)"
                    value={pet.type}
                    onChange={(e) => updatePetForm(pet.id, "type", e.target.value)}
                    className="bg-background/10 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`breed-${pet.id}`} className="flex items-center">
                    Breed <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Input
                    id={`breed-${pet.id}`}
                    placeholder="Enter pet breed"
                    value={pet.breed}
                    onChange={(e) => updatePetForm(pet.id, "breed", e.target.value)}
                    className="bg-background/10 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`weight-${pet.id}`} className="flex items-center">
                    Weight (lbs) <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Input
                    id={`weight-${pet.id}`}
                    placeholder="Enter pet weight"
                    value={pet.weight}
                    onChange={(e) => updatePetForm(pet.id, "weight", e.target.value)}
                    className="bg-background/10 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`sex-${pet.id}`} className="flex items-center">
                    Sex <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Select value={pet.sex} onValueChange={(value) => updatePetForm(pet.id, "sex", value)}>
                    <SelectTrigger id={`sex-${pet.id}`} className="bg-background/10 border-border">
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
                  <Label htmlFor={`age-${pet.id}`} className="flex items-center">
                    Age <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Input
                    id={`age-${pet.id}`}
                    placeholder="Enter pet age"
                    value={pet.age}
                    onChange={(e) => updatePetForm(pet.id, "age", e.target.value)}
                    className="bg-background/10 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Pet Photo <span className="ml-1 text-destructive">*</span>
                  </Label>
                  <Button variant="outline" className="gap-2 w-full md:w-auto bg-background/10 border-border">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="gap-1 mt-4 bg-background/10 border-border" onClick={addPetForm}>
          <Plus className="h-4 w-4" />
          Add Pet
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pets</h1>
      <p className="mb-6 text-muted-foreground">Do you have any pets that will be living with you?</p>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <button
          onClick={() => setHasPets(true)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasPets === true && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Cat className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Yes, I have pets</h3>
          <p className="text-sm text-muted-foreground">Select this if you have any pets that will be living with you</p>
        </button>

        <button
          onClick={() => setHasPets(false)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasPets === false && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Ban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">No pets</h3>
          <p className="text-sm text-muted-foreground">Select this if you don&apos;t have any pets</p>
        </button>
      </div>

      {renderPetForms()}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={hasPets === null || (hasPets === true && petForms.some((pet) => !pet.type || !pet.breed))}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

