"use client"

import { useState, useImperativeHandle, forwardRef, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parse, set } from "date-fns"
import { CalendarIcon, Clock } from 'lucide-react'
import { CaptionProps } from "react-day-picker"
import { cn } from "@/lib/utils"

interface CalendarWithTimeInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
}

const CalendarWithTimeInput = forwardRef<{ hasTimeSelected: () => boolean }, CalendarWithTimeInputProps>(({ value, onChange, className, disabled }, ref) => {
  const [isClient, setIsClient] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())
  const [error, setError] = useState<string | undefined>()
  const [timeSelected, setTimeSelected] = useState(false)

  // Handle hydration and initial value
  useEffect(() => {
    setIsClient(true)
    if (value) {
      setDate(value)
      setInputValue(format(value, "yyyy/MM/dd hh:mm a"))
      setDisplayMonth(value)
      setTimeSelected(true)
    }
  }, [value])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setInputValue(newValue)
    
    try {
      // Check if the input matches our exact format
      if (!/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2} (AM|PM|am|pm)$/.test(newValue)) {
        setError("Please use format: YYYY/MM/DD hh:mm AM/PM")
        setTimeSelected(false)
        setDate(undefined)
        onChange?.(undefined)
        return;
      }

      // Try to parse the date with the expected format
      const parsedDate = parse(newValue, "yyyy/MM/dd hh:mm a", new Date())
      
      // Check if the date is valid
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate)
        setTimeSelected(true)
        onChange?.(parsedDate)
        setError(undefined)
      } else {
        setError("Invalid date format")
        setTimeSelected(false)
        setDate(undefined)
        onChange?.(undefined)
      }
    } catch {
      // If parsing fails, don't update the date
      setError("Please use format: YYYY/MM/DD hh:mm AM/PM")
      setTimeSelected(false)
      setDate(undefined)
      onChange?.(undefined)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const currentTime = date && timeSelected ? format(date, "hh:mm a") : "12:00 AM"
      const [timeStr, period] = currentTime.split(" ")
      const [hours, minutes] = timeStr.split(":")
      
      const newDate = set(selectedDate, {
        hours: period.toUpperCase() === "PM" && hours !== "12" 
          ? Number.parseInt(hours) + 12 
          : period.toUpperCase() === "AM" && hours === "12"
          ? 0
          : Number.parseInt(hours),
        minutes: Number.parseInt(minutes),
      })
      
      setDate(newDate)
      setTimeSelected(true)
      setInputValue(format(newDate, "yyyy/MM/dd hh:mm a"))
      setError(undefined)
      onChange?.(newDate)
    } else {
      setDate(undefined)
      setInputValue("")
      setTimeSelected(false)
      setError(undefined)
      onChange?.(undefined)
    }
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = event.target.value
    if (date && timeValue) {
      const [hours, minutes] = timeValue.split(":")
      const currentPeriod = format(date, "a")
      
      let newDate = set(date, {
        hours: Number.parseInt(hours),
        minutes: Number.parseInt(minutes),
      })

      // Adjust for AM/PM
      if (currentPeriod === "PM" && hours !== "12") {
        newDate = set(newDate, { hours: Number.parseInt(hours) + 12 })
      } else if (currentPeriod === "AM" && hours === "12") {
        newDate = set(newDate, { hours: 0 })
      }

      setDate(newDate)
      setTimeSelected(true)
      setInputValue(format(newDate, "yyyy/MM/dd hh:mm a"))
      setError(undefined)
      onChange?.(newDate)
    }
  }

  const hasTimeSelected = () => {
    return timeSelected && !!date && /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2} (AM|PM|am|pm)$/.test(inputValue);
  };

  useImperativeHandle(ref, () => ({
    hasTimeSelected
  }));

  if (!isClient) {
    return (
      <div className={className}>
        <div className="relative">
          <Input
            type="text"
            value=""
            disabled
            className="pr-10 bg-background h-[42px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? "YYYY/MM/DD hh:mm AM/PM" : "Enter date and time"}
          className={cn(
            "pr-10 bg-background h-[42px]",
            error && "border-red-500 focus-visible:ring-red-500 "
          )}
          disabled={disabled}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-[42px] px-3 py-2 hover:bg-transparent"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Open calendar</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3">
              <Calendar 
                mode="single" 
                selected={date} 
                onSelect={handleDateSelect}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                initialFocus
                disabled={disabled}
                components={{
                  Caption: ({ displayMonth }: CaptionProps) => (
                    <div className="flex justify-between items-center px-2 py-1">
                      <Select
                        value={displayMonth.getMonth().toString()}
                        onValueChange={(value) => {
                          const newMonth = parseInt(value)
                          const newDisplayMonth = new Date(displayMonth)
                          newDisplayMonth.setMonth(newMonth)
                          setDisplayMonth(newDisplayMonth)
                          if (date) {
                            const newDate = new Date(date)
                            newDate.setMonth(newMonth)
                            setDate(newDate)
                            setInputValue(format(newDate, "yyyy/MM/dd hh:mm a"))
                            onChange?.(newDate)
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue>{format(displayMonth, 'MMMM')}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {format(new Date(displayMonth.getFullYear(), i, 1), 'MMMM')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={displayMonth.getFullYear().toString()}
                        onValueChange={(value) => {
                          const newYear = parseInt(value)
                          const newDisplayMonth = new Date(displayMonth)
                          newDisplayMonth.setFullYear(newYear)
                          setDisplayMonth(newDisplayMonth)
                          if (date) {
                            const newDate = new Date(date)
                            newDate.setFullYear(newYear)
                            setDate(newDate)
                            setInputValue(format(newDate, "yyyy/MM/dd hh:mm a"))
                            onChange?.(newDate)
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-[90px]">
                          <SelectValue>{displayMonth.getFullYear()}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 201 }, (_, i) => (
                            <SelectItem key={i} value={(1900 + i).toString()}>
                              {1900 + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ),
                }}
              />
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center gap-3">
                  <Label htmlFor="time-input" className="text-xs">
                    Enter time
                  </Label>
                  <div className="relative grow">
                    <Input
                      id="time-input"
                      type="time"
                      value={date ? format(date, "HH:mm") : ""}
                      onChange={handleTimeChange}
                      className="peer appearance-none ps-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      disabled={disabled}
                    />
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                      <Clock size={16} strokeWidth={2} aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {error && (
          <div className="text-xs text-red-500 mt-1">{error}</div>
        )}
      </div>
    </div>
  );
})

CalendarWithTimeInput.displayName = "CalendarWithTimeInput"

export default CalendarWithTimeInput
