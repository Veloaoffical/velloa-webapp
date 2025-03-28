"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Ban, Users } from "lucide-react"

interface DependentsQuestionPageProps {
  hasDependents: boolean | null
  onDependentsSelection: (hasDependents: boolean) => void
  onNext: () => void
  onPrevious: () => void
}

export default function DependentsQuestionPage({
  hasDependents,
  onDependentsSelection,
  onNext,
  onPrevious,
}: DependentsQuestionPageProps) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dependents & Occupants</h1>
      <p className="mb-6 text-muted-foreground">Will anyone else be living with you at the property?</p>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => onDependentsSelection(true)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasDependents === true && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Yes, others will live with me</h3>
          <p className="text-sm text-muted-foreground">
            Select this if you will have other adults or dependents living with you
          </p>
        </button>

        <button
          onClick={() => onDependentsSelection(false)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasDependents === false && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Ban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">No, just me</h3>
          <p className="text-sm text-muted-foreground">Select this if you will be the only occupant</p>
        </button>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={hasDependents === null}>
          Next
        </Button>
      </div>
    </div>
  )
}

