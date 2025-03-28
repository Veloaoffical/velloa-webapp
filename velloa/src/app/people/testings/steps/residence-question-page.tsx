"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Home } from "lucide-react"

interface ResidenceQuestionPageProps {
  hasRentalHistory: boolean | null
  onRentalHistorySelection: (hasHistory: boolean) => void
  onNext: () => void
  onPrevious: () => void
}

export default function ResidenceQuestionPage({
  hasRentalHistory,
  onRentalHistorySelection,
  onNext,
  onPrevious,
}: ResidenceQuestionPageProps) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Current Residence</h1>
      <p className="mb-6 text-muted-foreground">Do you have any rental history?</p>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => onRentalHistorySelection(true)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasRentalHistory === true && "border-primary bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Yes, I have rental history</h3>
          <p className="text-sm text-muted-foreground">Select this if you have rented before</p>
        </button>

        <button
          onClick={() => onRentalHistorySelection(false)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasRentalHistory === false && "border-primary bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">No, this is my first residence</h3>
          <p className="text-sm text-muted-foreground">Select this if you have never rented before</p>
        </button>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={hasRentalHistory === null}>
          Next
        </Button>
      </div>
    </>
  )
}

