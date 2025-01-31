"use client"

import * as React from "react"
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isEqual, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, addMonths, getMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  description?: string
}

interface CustomCalendarProps {
  mode?: "month" | "week" | "day" | "year"
  events?: CalendarEvent[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onViewChange?: (view: "month" | "week" | "day" | "year") => void
  className?: string
}

export function CustomCalendar({
  mode = "month",
  events = [],
  selectedDate = new Date(),
  onDateSelect,
  onEventClick,
  onViewChange,
  className,
}: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selectedDate)
  const [currentMode, setCurrentMode] = React.useState(mode)
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    setCurrentDate(selectedDate)
  }, [selectedDate])

  React.useEffect(() => {
    setCurrentMode(mode)
  }, [mode])

  // Update current time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)

  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = addMonths(startOfMonth(currentDate), i - getMonth(currentDate))
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const startDate = startOfWeek(monthStart)
      const endDate = endOfWeek(monthEnd)
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      const weeks: Date[][] = []
      let week: Date[] = []

      days.forEach((day, i) => {
        week.push(day)
        if ((i + 1) % 7 === 0) {
          weeks.push(week)
          week = []
        }
      })

      const monthEvents = events.filter(event => 
        getMonth(event.start) === getMonth(monthDate) &&
        event.start.getFullYear() === monthDate.getFullYear()
      )

      const dayHeaders = [
        { key: 'sun', label: 'S' },
        { key: 'mon', label: 'M' },
        { key: 'tue', label: 'T' },
        { key: 'wed', label: 'W' },
        { key: 'thu', label: 'T' },
        { key: 'fri', label: 'F' },
        { key: 'sat', label: 'S' },
      ]

      return (
        <div key={i} className="p-2">
          <div 
            className="text-sm font-medium mb-1 text-primary cursor-pointer hover:text-primary/80"
            onClick={() => {
              setCurrentDate(monthDate)
              setCurrentMode("month")
              onViewChange?.("month")
            }}
          >
            {format(monthDate, "MMMM")}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {dayHeaders.map((day) => (
              <div
                key={`${i}-${day.key}`}
                className="h-6 text-[10px] font-medium text-muted-foreground flex items-center justify-center"
              >
                {day.label}
              </div>
            ))}
            {weeks.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((day: Date, dayIndex: number) => {
                  const hasEvents = monthEvents.some(event => 
                    isEqual(parseISO(format(event.start, 'yyyy-MM-dd')), parseISO(format(day, 'yyyy-MM-dd')))
                  )

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "h-6 relative flex items-center justify-center text-[11px] cursor-pointer hover:bg-accent/50 rounded-sm",
                        !isSameMonth(day, monthDate) && "text-muted-foreground/50",
                        isEqual(day, selectedDate) && "bg-accent text-accent-foreground",
                        isToday(day) && !isEqual(day, selectedDate) && "text-primary font-bold",
                        hasEvents && "font-semibold"
                      )}
                      onClick={() => {
                        onDateSelect?.(day)
                        setCurrentDate(day)
                        setCurrentMode("day")
                        onViewChange?.("day")
                      }}
                    >
                      {format(day, "d")}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )
    })

    return (
      <div className="h-full flex flex-col">
        <div className="text-3xl font-bold flex items-baseline gap-3 px-4">
          <span>{format(currentDate, "yyyy")}</span>
        </div>
        <ScrollArea className="flex-1 mt-4">
          <div className="grid grid-cols-4 gap-2 p-4">
            {months}
          </div>
        </ScrollArea>
      </div>
    )
  }

  const renderMonthView = () => {
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weeks: Date[][] = []
    let week: Date[] = []

    days.forEach((day, i) => {
      week.push(day)
      if ((i + 1) % 7 === 0) {
        weeks.push(week)
        week = []
      }
    })

    return (
      <div className="h-full flex flex-col">
        <div className="text-3xl font-bold flex items-baseline gap-3 shrink-0">
          <span>{format(currentDate, "MMMM")}</span>
          <span className="text-muted-foreground">{format(currentDate, "yyyy")}</span>
        </div>
        <div className="grid grid-cols-7 text-sm mt-6 shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-rows-5 mt-2 min-h-0">
          {weeks.slice(0, 5).map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 h-full">
              {week.map((day: Date, dayIndex: number) => {
                const dayEvents = events.filter(event => 
                  isEqual(parseISO(format(event.start, 'yyyy-MM-dd')), parseISO(format(day, 'yyyy-MM-dd')))
                )

                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "relative border-t hover:bg-accent/50 transition-colors h-full flex flex-col",
                      !isSameMonth(day, monthStart) && "text-muted-foreground/50 bg-muted/50",
                      isEqual(day, selectedDate) && isSameMonth(day, currentDate) && "bg-accent/50"
                    )}
                    onClick={() => {
                      onDateSelect?.(day)
                      setCurrentDate(day)
                    }}
                  >
                    <span className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-full m-2 shrink-0",
                      isToday(day) && "bg-primary text-primary-foreground",
                      isEqual(day, selectedDate) && isSameMonth(day, currentDate) && !isToday(day) && "text-primary font-bold"
                    )}>
                      {format(day, "d")}
                    </span>
                    <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs bg-blue-50 text-blue-700 rounded-sm px-1.5 py-0.5 truncate cursor-pointer border-l-2 border-blue-500 mb-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event)
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const timeLinePosition = (currentHour + currentMinute / 60) * 56 // 56px is our hour height

    // Get month display text
    const monthCounts = days.reduce((acc, day) => {
      const month = format(day, "MMMM")
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const dominantMonth = Object.entries(monthCounts).reduce((a, b) => 
      (a[1] > b[1] ? a : b)
    )[0]
    
    const monthDisplay = `${dominantMonth} ${format(days[0], "yyyy")}`

    return (
      <div className="space-y-4">
        <div className="text-3xl font-bold flex items-baseline gap-3">
          <span>{monthDisplay}</span>
        </div>
        <div className="flex flex-col h-[730px]">
          <div className="grid grid-cols-8 border-b">
            <div className="h-14 flex items-end pb-2">all-day</div>
            {days.map((day) => (
              <div
                key={day.toString()}
                className={cn(
                  "h-14 flex flex-col justify-end pb-2",
                  isEqual(day, selectedDate) && "text-primary"
                )}
              >
                <div className="text-muted-foreground text-sm">{format(day, "EEE")}</div>
                <div className={cn(
                  "inline-flex items-center justify-center",
                  isToday(day) && "bg-primary text-primary-foreground rounded-full w-6 h-6"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-8 relative">
              {timeSlots.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="h-14 text-sm text-muted-foreground p-2 text-right border-r relative">
                    {format(new Date().setHours(hour), "h a")}
                  </div>
                  {days.map((day) => {
                    const dayEvents = events.filter(event => 
                      isEqual(parseISO(format(event.start, 'yyyy-MM-dd')), parseISO(format(day, 'yyyy-MM-dd'))) &&
                      new Date(event.start).getHours() === hour
                    )

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="h-14 border-r border-b relative"
                      >
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="absolute inset-x-0 mx-1 bg-blue-50 text-blue-700 text-xs rounded-sm px-1.5 truncate cursor-pointer border-l-2 border-blue-500"
                            onClick={() => onEventClick?.(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
              {isToday(currentDate) && (
                <>
                  <div 
                    className="absolute left-0 right-0 flex items-center pointer-events-none"
                    style={{ top: `${timeLinePosition}px` }}
                  >
                    <div className="flex items-center pl-2">
                      <div className="w-16 h-6 rounded-full bg-primary flex items-center justify-center">
                        <div className="text-primary-foreground text-xs font-medium">{format(now, "h:mm a")}</div>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-primary" />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const timeLinePosition = (currentHour + currentMinute / 60) * 56 // 56px is our hour height

    return (
      <div className="space-y-4">
        <div className="text-3xl font-bold flex flex-col">
          <div className="flex items-baseline gap-3">
            <span>{format(currentDate, "MMMM d,")}</span>
            <span className="text-muted-foreground">{format(currentDate, "yyyy")}</span>
          </div>
          <div className="text-xl text-muted-foreground font-normal">
            {format(currentDate, "EEEE")}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_300px] gap-4">
          <div className="flex flex-col h-[700px]">
            <div className="h-14 border-b flex items-end pb-2 text-sm text-muted-foreground">
              all-day
            </div>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-[100px_1fr] relative">
                {timeSlots.map((hour) => {
                  const hourEvents = events.filter(event => 
                    isEqual(parseISO(format(event.start, 'yyyy-MM-dd')), parseISO(format(currentDate, 'yyyy-MM-dd'))) &&
                    new Date(event.start).getHours() === hour
                  )

                  return (
                    <React.Fragment key={hour}>
                      <div className="h-14 text-sm text-muted-foreground p-2 text-right border-r">
                        {hour === 12 ? "Noon" : format(new Date().setHours(hour), "h a")}
                      </div>
                      <div className="h-14 border-b relative">
                        {hourEvents.map((event) => (
                          <div
                            key={event.id}
                            className="absolute inset-x-0 mx-1 bg-blue-50 text-blue-700 text-xs rounded-sm px-1.5 truncate cursor-pointer border-l-2 border-blue-500"
                            onClick={() => onEventClick?.(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </React.Fragment>
                  )
                })}
                {isToday(currentDate) && (
                  <>
                    <div 
                      className="absolute left-0 right-0 flex items-center pointer-events-none"
                      style={{ top: `${timeLinePosition}px` }}
                    >
                      <div className="flex items-center pl-2">
                        <div className="w-16 h-6 rounded-full bg-primary flex items-center justify-center">
                          <div className="text-primary-foreground text-xs font-medium">{format(now, "h:mm a")}</div>
                        </div>
                      </div>
                      <div className="flex-1 h-px bg-primary" />
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              <div className="text-muted-foreground">S</div>
              <div className="text-muted-foreground">M</div>
              <div className="text-muted-foreground">T</div>
              <div className="text-muted-foreground">W</div>
              <div className="text-muted-foreground">T</div>
              <div className="text-muted-foreground">F</div>
              <div className="text-muted-foreground">S</div>
              {eachDayOfInterval({ start: startDate, end: endDate }).map((day) => (
                <div
                  key={day.toString()}
                  className={cn(
                    "p-1 cursor-pointer",
                    !isSameMonth(day, monthStart) && "text-muted-foreground/50",
                    isEqual(day, selectedDate) && isSameMonth(day, monthStart) && "bg-primary text-primary-foreground rounded-full",
                    isToday(day) && !isEqual(day, selectedDate) && isSameMonth(day, monthStart) && "font-bold"
                  )}
                  onClick={() => {
                    if (!isSameMonth(day, currentDate)) {
                      setCurrentDate(day)
                    }
                    onDateSelect?.(day)
                  }}
                >
                  {format(day, "d")}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-muted-foreground">
              No Event Selected
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handlePrevious = () => {
    switch (currentMode) {
      case "year":
        setCurrentDate((prev) => addDays(prev, -365))
        break
      case "month":
        setCurrentDate((prev) => addDays(prev, -30))
        break
      case "week":
        setCurrentDate((prev) => addDays(prev, -7))
        break
      case "day":
        setCurrentDate((prev) => addDays(prev, -1))
        break
    }
  }

  const handleNext = () => {
    switch (currentMode) {
      case "year":
        setCurrentDate((prev) => addDays(prev, 365))
        break
      case "month":
        setCurrentDate((prev) => addDays(prev, 30))
        break
      case "week":
        setCurrentDate((prev) => addDays(prev, 7))
        break
      case "day":
        setCurrentDate((prev) => addDays(prev, 1))
        break
    }
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="flex items-center justify-between px-4 shrink-0">
        <Tabs value={currentMode} onValueChange={(value) => {
          setCurrentMode(value as "month" | "week" | "day" | "year")
          onViewChange?.(value as "month" | "week" | "day" | "year")
        }}>
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="day" className="w-[100px]">Day</TabsTrigger>
            <TabsTrigger value="week" className="w-[100px]">Week</TabsTrigger>
            <TabsTrigger value="month" className="w-[100px]">Month</TabsTrigger>
            <TabsTrigger value="year" className="w-[100px]">Year</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center">
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-8 w-8 rounded-md hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="px-3 h-8 rounded-md font-medium hover:bg-background"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8 rounded-md hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-4">
        {currentMode === "year" && renderYearView()}
        {currentMode === "month" && renderMonthView()}
        {currentMode === "week" && renderWeekView()}
        {currentMode === "day" && renderDayView()}
      </div>
    </div>
  )
} 