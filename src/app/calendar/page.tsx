"use client"

import { useState } from "react"
import { EventCalendar, CalendarEvent } from "@/components/event-calendar"
import { Card, CardContent } from "@/components/ui/card"
import React from "react"
import { generateId } from "@/lib/utils/generate-id"

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const handleEventAdd = (newEvent: CalendarEvent) => {
    const eventWithId = { ...newEvent, id: generateId() }
    setEvents((prevEvents) => [...prevEvents, eventWithId])
  }

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    )
  }

  const handleEventDelete = (eventId: string) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))
  }

  return (
    <main className="flex flex-col p-6 h-screen">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-6 h-full overflow-auto">
          <EventCalendar
            events={events}
            onEventAdd={handleEventAdd}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            initialView="month"
          />
        </CardContent>
      </Card>
    </main>
  )
}
  