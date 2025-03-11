"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckIcon, ChevronDownIcon, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  active: boolean
}

interface PropertyComboboxProps {
  properties: Property[]
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  className?: string
  showAllOption?: boolean
}

export default function PropertyCombobox({ 
  properties, 
  value, 
  onValueChange, 
  isLoading,
  className,
  showAllOption = true
}: PropertyComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredProperties = properties.filter(property => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      property.name.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.state.toLowerCase().includes(searchLower) ||
      property.zip.toLowerCase().includes(searchLower)
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
              {properties.find(p => p.id === value)?.name || 'All Properties'}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading properties..." : "Select property"}
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
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {filteredProperties.length === 0 ? (
              <div className="py-6 text-center text-sm">No properties found.</div>
            ) : (
              <div className="overflow-hidden p-1 text-foreground">
                {showAllOption && (
                  <>
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        onValueChange('all')
                        setOpen(false)
                      }}
                    >
                      All Properties
                      {value === 'all' && <CheckIcon size={16} className="ml-auto" />}
                    </div>
                    <Separator className="my-1" />
                  </>
                )}
                
                {!isLoading && filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onValueChange(property.id)
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{property.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {property.address}, {property.city}, {property.state} {property.zip} 
                      </span>
                    </div>
                    {value === property.id && <CheckIcon size={16} className="ml-auto" />}
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