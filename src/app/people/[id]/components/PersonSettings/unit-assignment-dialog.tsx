'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, Building2, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PersonDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string;
  unit_id: string | null;
  role: string;
  unit?: {
    unit_number: string;
    property_name?: string;
  } | null;
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
}

interface UnitAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

interface Property {
  id: string;
  name: string;
  address?: string;
}

export function UnitAssignmentDialog({ open, onOpenChange, personDetails }: UnitAssignmentDialogProps) {
  const [propertiesOpen, setPropertiesOpen] = React.useState(false);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [selectedProperties, setSelectedProperties] = React.useState<string[]>([]);
  const [propertiesAccess, setPropertiesAccess] = React.useState<'all' | 'specific'>('all');

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchCurrentAssignments = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}/properties`);
      if (!response.ok) {
        throw new Error('Failed to fetch current property assignments');
      }
      const data = await response.json();
      if (data.length === 0) {
        setPropertiesAccess('all');
      } else {
        setPropertiesAccess('specific');
        setSelectedProperties(data.map((assignment: { property_id: string }) => assignment.property_id));
      }
    } catch (error) {
      console.error('Error fetching current assignments:', error);
    }
  }, [personDetails.id]);

  // Fetch properties and current assignments when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchProperties();
      fetchCurrentAssignments();
    }
  }, [open, fetchCurrentAssignments]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedProperties: propertiesAccess === 'all' ? [] : selectedProperties,
          propertiesAccess,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      // TODO: Show error toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Unit Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <RadioGroup
            value={propertiesAccess}
            onValueChange={(value: 'all' | 'specific') => setPropertiesAccess(value)}
            className="grid gap-4"
          >
            {/* Radio card #1 */}
            <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
              <RadioGroupItem
                value="all"
                id="properties-all"
                aria-describedby="properties-all-description"
                className="order-1 after:absolute after:inset-0"
              />
              <div className="flex grow items-center gap-3">
                <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                  <div className="flex items-center justify-center w-8 h-8">
                    <Building2 className="size-5 text-[#16B364]" strokeWidth={2} />
                  </div>
                </div>
                <div className="grid grow gap-2">
                  <Label htmlFor="properties-all">This vendor can work on all properties</Label>
                  <div id="properties-all-description" className="text-xs text-muted-foreground">
                    The vendor will have access to work on all properties in your portfolio.
                  </div>
                </div>
              </div>
            </div>

            {/* Radio card #2 */}
            <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
              <RadioGroupItem
                value="specific"
                id="properties-specific"
                aria-describedby="properties-specific-description"
                className="order-1 after:absolute after:inset-0"
              />
              <div className="flex grow items-center gap-3">
                <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                  <div className="flex items-center justify-center w-8 h-8">
                    <Building className="size-5 text-[#16B364]" strokeWidth={2} />
                  </div>
                </div>
                <div className="grid grow gap-2">
                  <Label htmlFor="properties-specific">This vendor can work only on specific properties</Label>
                  <div id="properties-specific-description" className="text-xs text-muted-foreground">
                    You can select which properties this vendor is allowed to work on.
                  </div>
                </div>
              </div>
            </div>
          </RadioGroup>

          {/* Property Selector */}
          {propertiesAccess === 'specific' && (
            <div className="w-full mt-6 space-y-2">
              <Label htmlFor="property-select">Select Properties</Label>
              <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="property-select"
                    variant="outline"
                    role="combobox"
                    aria-expanded={propertiesOpen}
                    className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                  >
                    <span className={cn("truncate", !selectedProperties.length && "text-muted-foreground")}>
                      {selectedProperties.length
                        ? `${selectedProperties.length} properties selected`
                        : "Select properties"}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className="shrink-0 text-muted-foreground/80"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search properties..." />
                    <CommandList>
                      <CommandEmpty>No properties found.</CommandEmpty>
                      <CommandGroup>
                        {properties.map((property) => (
                          <CommandItem
                            key={property.id}
                            value={property.id}
                            onSelect={(currentValue) => {
                              setSelectedProperties(prev => {
                                const newSelection = prev.includes(currentValue)
                                  ? prev.filter(id => id !== currentValue)
                                  : [...prev, currentValue];
                                return newSelection;
                              });
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{property.name}</span>
                              {property.address && (
                                <span className="text-xs text-muted-foreground">{property.address}</span>
                              )}
                            </div>
                            {selectedProperties.includes(property.id) && (
                              <Check size={16} strokeWidth={2} className="ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#16B364] hover:bg-[#16B364]/90">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 