"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Ban, Dog } from "lucide-react"

interface PetsQuestionPageProps {
  hasPets: boolean | null
  onPetsSelection: (hasPets: boolean) => void
  onNext: () => void
  onPrevious: () => void
}

export default function PetsQuestionPage({ hasPets, onPetsSelection, onNext, onPrevious }: PetsQuestionPageProps) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pets</h1>
      <p className="mb-6 text-muted-foreground">Do you have any pets that will be living with you?</p>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => onPetsSelection(true)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasPets === true && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Dog className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Yes, I have pets</h3>
          <p className="text-sm text-muted-foreground">Select this if you have any pets that will be living with you</p>
        </button>

        <button
          onClick={() => onPetsSelection(false)}
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

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={hasPets === null}>
          Next
        </Button>
      </div>
    </div>
  )
}

