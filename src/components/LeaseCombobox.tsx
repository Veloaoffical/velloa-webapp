"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckIcon, ChevronDownIcon, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
interface Lease {
  id: string
  tenant_name: string
  unit_name: string
  property_name: string
  property: {
    name: string
  }
  unit: {
    unit_number: string
  }
}

interface LeaseComboboxProps {
  leases: Lease[]
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  selectedProperty?: string
  selectedUnit?: string
  properties?: Array<{ id: string; name: string }>
  units?: Array<{ id: string; unit_number: string }>
  className?: string
}

export default function LeaseCombobox({ 
  leases, 
  value, 
  onValueChange, 
  isLoading,
  selectedProperty,
  selectedUnit,
  properties,
  units,
  className 
}: LeaseComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredLeases = leases.filter(lease => {
    const matchesFilter = 
      (selectedProperty === 'all' || lease.property.name === properties?.find(p => p.id === selectedProperty)?.name) &&
      (selectedUnit === 'all' || lease.unit.unit_number === units?.find(u => u.id === selectedUnit)?.unit_number)
    
    if (!search) return matchesFilter
    
    return matchesFilter && (
      lease.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      lease.property_name.toLowerCase().includes(search.toLowerCase()) ||
      lease.unit_name.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background hover:bg-background",
            className
          )}
        >
          {value && value !== 'all' ? (
            <span className="truncate">
              {leases.find(l => l.id === value)?.tenant_name || 'All Leases'}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading leases..." : "Select lease"}
            </span>
          )}
          <ChevronDownIcon size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popper-anchor-width)] p-0" align="start">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search leases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {filteredLeases.length === 0 ? (
              <div className="py-6 text-center text-sm">No leases found.</div>
            ) : (
              <div className="overflow-hidden p-1 text-foreground">
                <div
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onValueChange('all')
                    setOpen(false)
                  }}
                >
                  All Leases
                  {value === 'all' && <CheckIcon size={16} className="ml-auto" />}
                </div>
                <Separator className="my-1" />
                {!isLoading && filteredLeases.map((lease) => (
                  <div
                    key={lease.id}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onValueChange(lease.id)
                      setOpen(false)
                    }}
                  >
                    {lease.tenant_name} - {lease.property_name} ({lease.unit_name})
                    {value === lease.id && <CheckIcon size={16} className="ml-auto" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 