"use client"

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Button, Group, Input, NumberField } from "react-aria-components"

export default function AmountInput({ value, onChange, defaultValue = 0.00, width }: { value: number | string, onChange: (val: string | number) => void, defaultValue?: number, width?: number }) {
  return (
    <NumberField
    aria-label="Amount"

      value={value === '' ? defaultValue : Number(value)}
      onChange={val => onChange(val === null || val === undefined ? '' : val)}
      formatOptions={{
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }}
    >
      <div className="*:not-first:mt-2">
        <Group 
          style={{ width: width ? `${width}px` : undefined }}
          className="border-input outline-none relative inline-flex h-9 items-center overflow-hidden rounded-md border text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] data-disabled:opacity-50">
          <Input className="bg-background text-foreground flex-1 px-3 py-2 tabular-nums" />
          <div className="flex h-[calc(100%+2px)] flex-col">
            <Button
              slot="increment"
              className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronUpIcon size={12} aria-hidden="true" />
            </Button>
            <Button
              slot="decrement"
              className="border-input bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground -me-px -mt-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDownIcon size={12} aria-hidden="true" />
            </Button>
          </div>
        </Group>
      </div>
    </NumberField>
  )
}
