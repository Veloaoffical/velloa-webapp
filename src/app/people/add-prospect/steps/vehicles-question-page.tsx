"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Ban, CarFront } from "lucide-react"

interface VehiclesQuestionPageProps {
  hasVehicles: boolean | null
  onVehiclesSelection: (hasVehicles: boolean) => void
  onNext: () => void
  onPrevious: () => void
}

export default function VehiclesQuestionPage({
  hasVehicles,
  onVehiclesSelection,
  onNext,
  onPrevious,
}: VehiclesQuestionPageProps) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Vehicles</h1>
      <p className="mb-6 text-muted-foreground">Do you have any vehicles that will be parked at the property?</p>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => onVehiclesSelection(true)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasVehicles === true && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <CarFront className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Yes, I have vehicles</h3>
          <p className="text-sm text-muted-foreground">
            Select this if you have any vehicles that will be parked at the property
          </p>
        </button>

        <button
          onClick={() => onVehiclesSelection(false)}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-border p-8 text-center transition-all hover:border-primary/50 hover:bg-muted/30",
            hasVehicles === false && "border-primary border-2 bg-primary/5",
          )}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Ban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">No vehicles</h3>
          <p className="text-sm text-muted-foreground">Select this if you don&apos;t have any vehicles</p>
        </button>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={hasVehicles === null}>
          Next
        </Button>
      </div>
    </div>
  )
}

