"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface LeadStatusPageProps {
  onNext: () => void
  onPrevious: () => void
}

export default function LeadStatusPage({ onNext, onPrevious }: LeadStatusPageProps) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Lead Status</h1>
      <p className="mb-6 text-muted-foreground">Set the lead status and assign the prospect to a team member.</p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lead-status">Lead Status</Label>
            <Select>
              <SelectTrigger id="lead-status" className="border-primary/70">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed-won">Closed Won</SelectItem>
                <SelectItem value="closed-lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-source">Lead Source</Label>
            <Select>
              <SelectTrigger id="lead-source">
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
                <SelectItem value="email">Email Campaign</SelectItem>
                <SelectItem value="phone">Phone Inquiry</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-medium">Lead Medium</Label>
            <Select>
              <SelectTrigger id="lead-medium">
                <SelectValue placeholder="Select Medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="mail">Mail</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="john-doe">John Doe</SelectItem>
                <SelectItem value="jane-smith">Jane Smith</SelectItem>
                <SelectItem value="alex-johnson">Alex Johnson</SelectItem>
                <SelectItem value="sarah-williams">Sarah Williams</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={onNext}>Next</Button>
        </CardFooter>
      </Card>
    </>
  )
}

