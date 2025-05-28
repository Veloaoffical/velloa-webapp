"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckIcon, ChevronDownIcon, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface Owner {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
}

interface OwnerComboboxProps {
  owners: Owner[]
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  className?: string
}

export default function OwnerCombobox({ 
  owners, 
  value, 
  onValueChange, 
  isLoading,
  className 
}: OwnerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOwners = owners.filter(owner => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      (owner.first_name?.toLowerCase().includes(searchLower) || false) ||
      (owner.last_name?.toLowerCase().includes(searchLower) || false) ||
      (owner.company?.toLowerCase().includes(searchLower) || false)
    )
  })

  const getOwnerDisplayName = (owner: Owner) => {
    if (owner.company) {
      return owner.company
    }
    return [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "Unnamed Owner"
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
              {getOwnerDisplayName(owners.find(o => o.id === value) || { id: '', first_name: null, last_name: null, company: null })}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading owners..." : "Select owner"}
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
              placeholder="Search owners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {filteredOwners.length === 0 ? (
              <div className="py-6 text-center text-sm">No owners found.</div>
            ) : (
              <div className="overflow-hidden p-1 text-foreground">
                <div
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    onValueChange('all')
                    setOpen(false)
                  }}
                >
                  All Owners
                  {value === 'all' && <CheckIcon size={16} className="ml-auto" />}
                </div>
                <Separator className="my-1" />
                {!isLoading && filteredOwners.map((owner) => (
                  <div
                    key={owner.id}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onValueChange(owner.id)
                      setOpen(false)
                    }}
                  >
                    {getOwnerDisplayName(owner)}
                    {value === owner.id && <CheckIcon size={16} className="ml-auto" />}
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