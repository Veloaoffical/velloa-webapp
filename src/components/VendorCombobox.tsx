"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckIcon, ChevronDownIcon, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface Vendor {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
}

interface VendorComboboxProps {
  vendors: Vendor[]
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  className?: string
  showAllOption?: boolean
}

export default function VendorCombobox({ 
  vendors, 
  value, 
  onValueChange, 
  isLoading,
  className,
  showAllOption = true
}: VendorComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredVendors = vendors.filter(vendor => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      (vendor.first_name?.toLowerCase().includes(searchLower) || false) ||
      (vendor.last_name?.toLowerCase().includes(searchLower) || false) ||
      (vendor.company?.toLowerCase().includes(searchLower) || false)
    )
  })

  const getVendorDisplayName = (vendor: Vendor) => {
    const fullName = [vendor.first_name, vendor.last_name].filter(Boolean).join(" ")
    if (fullName && vendor.company) {
      return `${fullName} - ${vendor.company}`
    }
    return fullName || vendor.company || "Unnamed Vendor"
  }

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
              {getVendorDisplayName(vendors.find(v => v.id === value) || { id: '', first_name: null, last_name: null, company: null })}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading vendors..." : "Select vendor"}
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
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {filteredVendors.length === 0 ? (
              <div className="py-6 text-center text-sm">No vendors found.</div>
            ) : (
              <div className="overflow-hidden p-1 text-foreground">
                {showAllOption && (
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onValueChange('all')
                      setOpen(false)
                    }}
                  >
                    All Vendors
                    {value === 'all' && <CheckIcon size={16} className="ml-auto" />}
                  </div>
                )}
                {showAllOption && <Separator className="my-1" />}
                {!isLoading && filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onValueChange(vendor.id)
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col">
                      <span>
                        {[vendor.first_name, vendor.last_name].filter(Boolean).join(" ") || "Unnamed Vendor"}
                      </span>
                      {vendor.company && (
                        <span className="text-xs text-muted-foreground">
                          {vendor.company}
                        </span>
                      )}
                    </div>
                    {value === vendor.id && <CheckIcon size={16} className="ml-auto" />}
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