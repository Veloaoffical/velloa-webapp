"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface IntroPageProps {
  onNext: () => void
}

export default function IntroPage({ onNext }: IntroPageProps) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Getting Started</h1>
      <p className="mb-6 text-muted-foreground">Let&apos;s set up a new prospect in your system.</p>

      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg font-medium text-primary">Adding a new prospect</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          <div className="relative w-[300px] h-[300px]">
            <Image
              src="/assets/figures/adding-prospect.png"
              alt="Adding Prospect Illustration"
              layout="fill"
              objectFit="contain"
            />
          </div>
         
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

