"use client"

import { useState } from "react"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import CalendarWithTimeInput from "@/components/calendarwithtimeinput"
import { Card, CardContent } from "@/components/ui/card"
import React from "react"
import { generateId } from "@/lib/utils/generate-id"

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  description?: string
}

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [view, setView] = useState<"month" | "week" | "day" | "year">("month")
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    description: "",
    allDay: false,
    start: new Date(date),
    end: new Date(date)
  })

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.start && newEvent.end) {
      const event: CalendarEvent = {
        id: generateId(),
        title: newEvent.title,
        description: newEvent.description || "",
        start: newEvent.start,
        end: newEvent.end,
        allDay: newEvent.allDay
      }
      setEvents([...events, event])
      setShowEventDialog(false)
      setNewEvent({
        title: "",
        description: "",
        allDay: false,
        start: new Date(date),
        end: new Date(date)
      })
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    console.log("Event clicked:", event)
  }

  return (
    <main className="flex flex-col h-screen p-6">


      <Card className="flex-1">
        <CardContent className="p-6 h-full">
          <CustomCalendar
            mode={view}
            selectedDate={date}
            onDateSelect={setDate}
            events={events}
            onEventClick={handleEventClick}
            onViewChange={setView}
            className="h-full"
          />
        </CardContent>
      </Card>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Start Date & Time</Label>
              <CalendarWithTimeInput
                value={newEvent.start}
                onChange={(date) => date && setNewEvent({ ...newEvent, start: date })}
              />
            </div>
            <div className="grid gap-2">
              <Label>End Date & Time</Label>
              <CalendarWithTimeInput
                value={newEvent.end}
                onChange={(date) => date && setNewEvent({ ...newEvent, end: date })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
  