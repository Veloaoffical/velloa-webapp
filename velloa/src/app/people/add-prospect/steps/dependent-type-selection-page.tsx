"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { User, UserRound } from "lucide-react"

export type DependentType = "adult" | "dependent" | null

interface DependentTypeSelectionPageProps {
  selectedType: DependentType
  onTypeSelection: (type: DependentType) => void
  onNext: () => void
  onPrevious: () => void
}

export default function DependentTypeSelectionPage({
  selectedType,
  onTypeSelection,
  onNext,
  onPrevious,
}: DependentTypeSelectionPageProps) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Add Occupant</h1>
      <p className="mb-6 text-muted-foreground">What type of occupant would you like to add?</p>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => onTypeSelection("adult")}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            selectedType === "adult" && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Adult</h3>
          <p className="text-sm text-muted-foreground">
            Spouse, roommate, partner, or other adult who will live with you
          </p>
        </button>

        <button
          onClick={() => onTypeSelection("dependent")}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            selectedType === "dependent" && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <UserRound className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Dependent</h3>
          <p className="text-sm text-muted-foreground">Child, minor, or senior dependent who will live with you</p>
        </button>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={selectedType === null}>
          Next
        </Button>
      </div>
    </>
  )
}

