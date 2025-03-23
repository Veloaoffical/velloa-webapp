"use client";

import { cn } from "@/lib/utils";
import { RangeCalendar } from "@/components/ui/calendar-rac";
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac";
import { CalendarIcon } from "lucide-react";
import { Button, DateRangePicker, Dialog, Group, Label, Popover } from "react-aria-components";
import { DateRange } from "react-day-picker";
import { CalendarDate } from "@internationalized/date";
import { RangeValue } from "@react-types/shared";

interface ResidenceDateRangePickerProps {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  label?: string;
  className?: string;
}

export function ResidenceDateRangePicker({ 
  value, 
  onChange, 
  label = "Length of Stay",
  className 
}: ResidenceDateRangePickerProps) {
  // Convert DateRange from react-day-picker to react-aria format
  const ariaValue = value ? {
    start: value.from ? new CalendarDate(
      value.from.getFullYear(),
      value.from.getMonth() + 1,
      value.from.getDate()
    ) : undefined,
    end: value.to ? new CalendarDate(
      value.to.getFullYear(),
      value.to.getMonth() + 1,
      value.to.getDate()
    ) : undefined
  } : undefined;

  // Handle changes from react-aria and convert back to react-day-picker format
  const handleChange = (newValue: RangeValue<CalendarDate> | null) => {
    if (!newValue || (!newValue.start && !newValue.end)) {
      onChange(undefined);
      return;
    }

    const newDateRange: Partial<DateRange> = {};
    
    if (newValue.start) {
      newDateRange.from = new Date(
        newValue.start.year,
        newValue.start.month - 1,
        newValue.start.day
      );
    }
    
    if (newValue.end) {
      newDateRange.to = new Date(
        newValue.end.year,
        newValue.end.month - 1,
        newValue.end.day
      );
    }
    
    onChange(newDateRange as DateRange);
  };

  return (
    <DateRangePicker  
      className= {cn("*:not-first:mt-2", className)}
      value={ariaValue?.start && ariaValue?.end ? { start: ariaValue.start, end: ariaValue.end } : undefined}
      onChange={handleChange}
    >
      {label && <Label className="text-foreground text-sm font-medium">{label}</Label>}
      <div className="flex h-[42px]">
        <Group className={cn(dateInputStyle, "pe-9", "h-[42px]")}>
          <DateInput slot="start" unstyled className="h-full" />
          <span aria-hidden="true" className="text-muted-foreground/70 px-2 flex items-center h-full">
            -
          </span>
          <DateInput slot="end" unstyled className="h-full" />
        </Group>
        <Button className="text-muted-foreground/80 hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none data-focus-visible:ring-[3px] h-[42px]">
          <CalendarIcon size={16} />
        </Button>
      </div>
      <Popover
        className="bg-background text-popover-foreground data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 z-50 rounded-md border shadow-lg outline-hidden"
        offset={4}
      >
        <Dialog className="max-h-[inherit] overflow-auto p-2">
          <RangeCalendar />
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
} 