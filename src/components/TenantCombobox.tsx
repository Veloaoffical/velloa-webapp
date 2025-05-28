"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CheckIcon, ChevronDownIcon, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface Tenant {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
}

interface TenantComboboxProps {
  tenants: Tenant[]
  value: string
  onValueChange: (value: string) => void
  isLoading?: boolean
  className?: string
}

export default function TenantCombobox({ 
  tenants, 
  value, 
  onValueChange, 
  isLoading,
  className 
}: TenantComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredTenants = tenants.filter(tenant => {
    if (!search) return true
    
    const searchLower = search.toLowerCase()
    return (
      (tenant.first_name?.toLowerCase().includes(searchLower) || false) ||
      (tenant.last_name?.toLowerCase().includes(searchLower) || false) ||
      (tenant.email?.toLowerCase().includes(searchLower) || false) ||
      (tenant.phone?.includes(searchLower) || false)
    )
  })

  const getTenantDisplayName = (tenant: Tenant) => {
    return [tenant.first_name, tenant.last_name].filter(Boolean).join(" ") || "Unnamed Tenant"
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
          {value ? (
            <span className="truncate">
              {getTenantDisplayName(tenants.find(t => t.id === value) || { id: '', first_name: null, last_name: null, email: null, phone: null })}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading tenants..." : "Select tenant"}
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
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {filteredTenants.length === 0 ? (
              <div className="py-6 text-center text-sm">No tenants found.</div>
            ) : (
              <div className="overflow-hidden p-1 text-foreground">
                {!isLoading && filteredTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onValueChange(tenant.id)
                      setOpen(false)
                    }}
                  >
                    {getTenantDisplayName(tenant)}
                    {value === tenant.id && <CheckIcon size={16} className="ml-auto" />}
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