'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  request_type: string | null;
  task_type: string | null;
  tenant: string | null;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
  assignee?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
  role: string;
}

interface Property {
  id: string;
  name: string;
  address?: string;
  units?: {
    id: string;
    unit_name: string;
  }[];
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
}

export function LocationDialog({ open, onOpenChange, taskDetails }: LocationDialogProps) {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = React.useState<string>(taskDetails.property_id || '');
  const [selectedUnit, setSelectedUnit] = React.useState<string>(taskDetails.unit_id || '');
  const [propertiesOpen, setPropertiesOpen] = React.useState(false);
  const [unitsOpen, setUnitsOpen] = React.useState(false);

  // Fetch properties on mount
  React.useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) throw new Error('Failed to fetch properties');
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties');
      }
    };

    fetchProperties();
  }, []);

  const selectedPropertyData = properties.find(p => p.id === selectedProperty);
  const units = selectedPropertyData?.units || [];

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskDetails.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_id: selectedUnit
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update task');
      }

      toast.success('Task updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Location</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label>Property</Label>
            <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={propertiesOpen}
                  className="w-full h-[42px] mt-2 justify-between"
                >
                  {selectedProperty ? (
                    properties.find((property) => property.id === selectedProperty)?.name
                  ) : (
                    "Select property"
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
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
                            setSelectedProperty(currentValue === selectedProperty ? "" : currentValue);
                            setSelectedUnit("");
                            setPropertiesOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProperty === property.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{property.name}</span>
                            {property.address && (
                              <span className="text-xs text-muted-foreground">{property.address}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedProperty && (
            <div>
              <Label>Unit</Label>
              <Popover open={unitsOpen} onOpenChange={setUnitsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={unitsOpen}
                    className="w-full h-[42px] mt-2 justify-between"
                  >
                    {selectedUnit ? (
                      units.find((unit) => unit.id === selectedUnit)?.unit_name
                    ) : (
                      "Select unit"
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search units..." />
                    <CommandList>
                      <CommandEmpty>No units found.</CommandEmpty>
                      <CommandGroup>
                        {units.map((unit) => (
                          <CommandItem
                            key={unit.id}
                            value={unit.id}
                            onSelect={(currentValue) => {
                              setSelectedUnit(currentValue === selectedUnit ? "" : currentValue);
                              setUnitsOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUnit === unit.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {unit.unit_name}
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