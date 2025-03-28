"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface IntroPageProps {
  onNext: () => void
}

export default function IntroPage({ onNext }: IntroPageProps) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Getting Started</h1>
      <p className="mb-6 text-muted-foreground">Let's set up a new prospect in your system.</p>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-medium text-primary">Required Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-4 text-sm text-muted-foreground">Only three fields are mandatory to create a prospect:</p>
          <ul className="mb-6 space-y-2 pl-5">
            {["First Name", "Last Name", "Email Address"].map((field) => (
              <li key={field} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {field}
              </li>
            ))}
          </ul>
          <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
            Once created, the prospect will receive an email to complete their profile with additional information.
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={onNext}>Next</Button>
        </CardFooter>
      </Card>
    </>
  )
}

