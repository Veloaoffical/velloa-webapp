"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Check, ChevronLast } from "lucide-react"

interface SummaryPageProps {
  steps: {
    id: number
    name: string
    completed: boolean
    skipped: boolean
  }[]
  onPrevious: () => void
  onSubmit: () => void
}

export default function SummaryPage({ steps, onPrevious, onSubmit }: SummaryPageProps) {
  const [agreePayment, setAgreePayment] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeAccuracy, setAgreeAccuracy] = useState(false)

  return (
    <div className="dark">
      <h1 className="mb-6 text-2xl font-bold">Summary</h1>
      <p className="mb-6 text-muted-foreground">
        Please review your application and confirm the agreements below before submitting.
      </p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5 mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-4">Application Status</h2>
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between rounded-lg bg-muted/20 p-4 border border-border"
              >
                <span className="font-medium">{step.name}</span>
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted/50">
                  {step.skipped ? (
                    <ChevronLast className="h-4 w-4 text-amber-500" />
                  ) : step.completed ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5 mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium mb-4">Agreements</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="payment-agreement"
                checked={agreePayment}
                onCheckedChange={(checked) => setAgreePayment(checked === true)}
                className="mt-1"
              />
              <div>
                <Label htmlFor="payment-agreement" className="font-medium">
                  Payment Agreement
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I agree to pay the rent and fees as outlined in the lease agreement.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms-agreement"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                className="mt-1"
              />
              <div>
                <Label htmlFor="terms-agreement" className="font-medium">
                  Terms of Service
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I agree to Velloa's terms of service and privacy policy.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="accuracy-agreement"
                checked={agreeAccuracy}
                onCheckedChange={(checked) => setAgreeAccuracy(checked === true)}
                className="mt-1"
              />
              <div>
                <Label htmlFor="accuracy-agreement" className="font-medium">
                  Information Accuracy
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I confirm that all information provided in this application is accurate and complete.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onSubmit} disabled={!agreePayment || !agreeTerms || !agreeAccuracy}>
          Submit Application
        </Button>
      </div>
    </div>
  )
}

