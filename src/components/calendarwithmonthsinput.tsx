"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { CaptionProps } from "react-day-picker"
import { cn } from "@/lib/utils"

interface CalendarInputProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
}

const CalendarInput = forwardRef<{ hasDateSelected: () => boolean }, CalendarInputProps>(
  ({ value, onChange, className, disabled }, ref) => {
    const [date, setDate] = useState<Date | undefined>(value)
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value ? format(value, "yyyy/MM/dd") : "")
    const [isFocused, setIsFocused] = useState(false)
    const [displayMonth, setDisplayMonth] = useState<Date>(value || new Date())
    const [error, setError] = useState<string | undefined>()

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      setInputValue(newValue)

      try {
        if (!/^\d{4}\/\d{2}\/\d{2}$/.test(newValue)) {
          setError("Please use format: YYYY/MM/DD")
          setDate(undefined)
          onChange?.(undefined)
          return
        }

        const parsedDate = parse(newValue, "yyyy/MM/dd", new Date())

        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate)
          onChange?.(parsedDate)
          setError(undefined)
        } else {
          setError("Invalid date format")
          setDate(undefined)
          onChange?.(undefined)
        }
      } catch {
        setError("Please use format: YYYY/MM/DD")
        setDate(undefined)
        onChange?.(undefined)
      }
    }

    const handleDateSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
        setDate(selectedDate)
        setInputValue(format(selectedDate, "yyyy/MM/dd"))
        setError(undefined)
        onChange?.(selectedDate)
      } else {
        setDate(undefined)
        setInputValue("")
        setError(undefined)
        onChange?.(undefined)
      }
    }

    const hasDateSelected = () => {
      return !!date && /^\d{4}\/\d{2}\/\d{2}$/.test(inputValue)
    }

    useImperativeHandle(ref, () => ({
      hasDateSelected,
    }))

    return (
      <div className={className}>
        <div className="relative">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "YYYY/MM/DD" : "Enter date"}
            className={cn("pr-10 bg-background h-[42px]", error && "border-red-500 focus-visible:ring-red-500")}
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
                          const newMonth = Number.parseInt(value)
                          const newDisplayMonth = new Date(displayMonth)
                          newDisplayMonth.setMonth(newMonth)
                          setDisplayMonth(newDisplayMonth)
                          if (date) {
                            const newDate = new Date(date)
                            newDate.setMonth(newMonth)
                            setDate(newDate)
                            setInputValue(format(newDate, "yyyy/MM/dd"))
                            onChange?.(newDate)
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue>{format(displayMonth, "MMMM")}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {format(new Date(displayMonth.getFullYear(), i, 1), "MMMM")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={displayMonth.getFullYear().toString()}
                        onValueChange={(value) => {
                          const newYear = Number.parseInt(value)
                          const newDisplayMonth = new Date(displayMonth)
                          newDisplayMonth.setFullYear(newYear)
                          setDisplayMonth(newDisplayMonth)
                          if (date) {
                            const newDate = new Date(date)
                            newDate.setFullYear(newYear)
                            setDate(newDate)
                            setInputValue(format(newDate, "yyyy/MM/dd"))
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
            </PopoverContent>
          </Popover>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
        </div>
      </div>
    )
  },
)

CalendarInput.displayName = "CalendarInput"

export default CalendarInput

