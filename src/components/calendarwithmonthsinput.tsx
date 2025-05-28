"use client"

import { useState, useImperativeHandle, forwardRef, useEffect, useRef } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parse } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import type { CaptionProps } from "react-day-picker"
import { cn } from "@/lib/utils"

interface CalendarInputProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  minDate?: Date
}

const LazyLoadYearSelect = ({ 
  value, 
  onValueChange, 
  disabled 
}: { 
  value: string,
  onValueChange: (value: string) => void,
  disabled?: boolean 
}) => {
  const currentYear = parseInt(value)
  const initialYearRange = 10
  
  // Start with range around the current year
  const [yearRange, setYearRange] = useState({
    min: Math.max(1900, currentYear - initialYearRange),
    max: Math.min(2100, currentYear + initialYearRange)
  })
  
  const [loading, setLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Generate the years array based on the current range
  const years = Array.from(
    { length: yearRange.max - yearRange.min + 1 },
    (_, i) => (yearRange.min + i).toString()
  )
  
  // Setup scroll listener
  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    
    // Define scroll handler inside the effect to access latest state values
    const scrollHandler = () => {
      if (loading) return
      
      const { scrollTop, scrollHeight, clientHeight } = content
      
      // More aggressive bottom detection - consider being near the bottom
      const atOrNearBottom = scrollTop + clientHeight >= scrollHeight - 50
      const atOrNearTop = scrollTop <= 20
      
      console.log("Scroll position:", {
        scrollTop,
        clientHeight,
        scrollHeight,
        remaining: scrollHeight - (scrollTop + clientHeight),
        atOrNearBottom
      })
      
      if (atOrNearBottom && yearRange.max < 2100) {
        console.log("LOADING MORE YEARS AT BOTTOM", yearRange.max)
        setLoading(true)
        
        // Add more years at the bottom
        setTimeout(() => {
          setYearRange(prev => ({
            ...prev,
            max: Math.min(2100, prev.max + 20) // Load more years at once (20 instead of 10)
          }))
          setLoading(false)
        }, 100)
      } else if (atOrNearTop && yearRange.min > 1900) {
        console.log("Loading more years at top", yearRange.min)
        setLoading(true)
        
        // Add more years at the top
        setTimeout(() => {
          setYearRange(prev => ({
            ...prev,
            min: Math.max(1900, prev.min - 10)
          }))
          setLoading(false)
          
          // After loading more items at the top, adjust scroll position
          if (content) {
            content.scrollTop = 40
          }
        }, 100)
      }
    }
    
    // Call handler on mount to check initial position
    setTimeout(() => {
      if (!loading) scrollHandler()
    }, 200)
    
    content.addEventListener('scroll', scrollHandler)
    
    return () => {
      content.removeEventListener('scroll', scrollHandler)
    }
  }, [yearRange.min, yearRange.max, loading])
  
  // Scroll to the current year when first opened
  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    
    // Wait for the DOM to update
    setTimeout(() => {
      const currentYearElement = content.querySelector(`[data-value="${currentYear}"]`)
      if (currentYearElement) {
        const yearElement = currentYearElement as HTMLElement
        yearElement.scrollIntoView({ block: 'center' })
      }
    }, 50)
  }, [currentYear])
  
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-[90px]">
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div 
          ref={contentRef}
          className="max-h-[200px] overflow-auto relative"
          style={{ scrollBehavior: 'smooth' }}
        >
          {loading && yearRange.min > 1900 && (
            <div className="sticky top-0 flex justify-center py-1 bg-background z-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {years.map(year => (
            <SelectItem 
              key={year} 
              value={year}
              data-value={year}
            >
              {year}
            </SelectItem>
          ))}
          
          <div className="sticky bottom-0 flex justify-center py-1 bg-background z-10">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              yearRange.max < 2100 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setYearRange(prev => ({
                        ...prev,
                        max: Math.min(2100, prev.max + 30)
                      }));
                      setLoading(false);
                    }, 100);
                  }}
                >
                  Load more years
                </Button>
              )
            )}
          </div>
        </div>
      </SelectContent>
    </Select>
  )
}

const CalendarInput = forwardRef<{ hasDateSelected: () => boolean }, CalendarInputProps>(
  ({ value, onChange, className, disabled, placeholder, minDate }, ref) => {
    const [date, setDate] = useState<Date | undefined>(value)
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(
      value && value instanceof Date && !isNaN(value.getTime()) ? format(value, "yyyy/MM/dd") : ""
    )
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
      if (selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime())) {
        setDate(selectedDate)
        setInputValue(format(selectedDate, "yyyy/MM/dd"))
        setError(undefined)
        onChange?.(selectedDate)
        setIsOpen(false)
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
            placeholder={isFocused ? "YYYY/MM/DD" : placeholder || "Enter date"}
            className={cn("pr-10", error && "border-red-500 focus-visible:ring-red-500")}
            disabled={disabled}
          />
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 px-3 py-2 hover:bg-transparent"
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
                fromDate={minDate}
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
                          if (date && date instanceof Date && !isNaN(date.getTime())) {
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
                      <LazyLoadYearSelect
                        value={displayMonth.getFullYear().toString()}
                        onValueChange={(value) => {
                          const newYear = Number.parseInt(value)
                          const newDisplayMonth = new Date(displayMonth)
                          newDisplayMonth.setFullYear(newYear)
                          setDisplayMonth(newDisplayMonth)
                          if (date && date instanceof Date && !isNaN(date.getTime())) {
                            const newDate = new Date(date)
                            newDate.setFullYear(newYear)
                            setDate(newDate)
                            setInputValue(format(newDate, "yyyy/MM/dd"))
                            onChange?.(newDate)
                          }
                        }}
                        disabled={disabled}
                      />
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

