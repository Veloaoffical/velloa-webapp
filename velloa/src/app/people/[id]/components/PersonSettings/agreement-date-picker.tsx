"use client";

import { cn } from "@/lib/utils";
import { CalendarDate, parseDate } from "@internationalized/date";
import { CalendarIcon } from "lucide-react";
import { RangeValue } from "@react-types/shared";
import {
  Button,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Popover,
  RangeCalendar,
} from "react-aria-components";

interface AgreementDatePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  className?: string;
}

export function AgreementDatePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  className,
}: AgreementDatePickerProps) {
  // Convert ISO date strings to CalendarDate objects
  const value: RangeValue<CalendarDate> | null = (startValue && endValue)
    ? {
        start: parseDate(startValue),
        end: parseDate(endValue)
      }
    : null;

  const handleChange = (value: RangeValue<CalendarDate> | null) => {
    if (value?.start) {
      const date = value.start.toString();
      onStartChange(date);
    } else {
      onStartChange('');
    }
    if (value?.end) {
      const date = value.end.toString();
      onEndChange(date);
    } else {
      onEndChange('');
    }
  };
  
  return (
    <DateRangePicker 
      value={value}
      onChange={handleChange}
      className={cn("space-y-2", className)}
    >
      <div className="flex justify-center">
        <Group className="inline-flex h-[42px] w-full max-w-md items-center overflow-hidden whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 pe-9 text-sm shadow-sm shadow-black/5 data-[focus-within]:border-ring data-[disabled]:opacity-50 data-[focus-within]:outline-none data-[focus-within]:ring-[3px] data-[focus-within]:ring-ring/20">
          <DateInput slot="start">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0 data-[disabled]:cursor-not-allowed data-[focused]:bg-accent data-[invalid]:data-[focused]:bg-destructive data-[type=literal]:px-0 data-[focused]:data-[placeholder]:text-foreground data-[focused]:text-foreground data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive data-[placeholder]:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 data-[disabled]:opacity-50"
              />
            )}
          </DateInput>
          <span aria-hidden="true" className="px-2 text-muted-foreground/70">
            -
          </span>
          <DateInput slot="end">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="inline rounded p-0.5 text-foreground caret-transparent outline outline-0 data-[disabled]:cursor-not-allowed data-[focused]:bg-accent data-[invalid]:data-[focused]:bg-destructive data-[type=literal]:px-0 data-[focused]:data-[placeholder]:text-foreground data-[focused]:text-foreground data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive data-[placeholder]:text-muted-foreground/70 data-[type=literal]:text-muted-foreground/70 data-[disabled]:opacity-50"
              />
            )}
          </DateInput>
        </Group>
        <Button 
          slot="trigger"
          className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70"
        >
          <CalendarIcon size={16} strokeWidth={2} />
        </Button>
      </div>
      <Popover className="w-auto p-3">
        <Dialog>
          <RangeCalendar 
            value={value}
            onChange={handleChange}
          />
        </Dialog>
      </Popover>
    </DateRangePicker>
  );
} 