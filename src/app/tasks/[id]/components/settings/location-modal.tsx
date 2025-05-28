'use client';

import * as React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import { type Task } from "../../TaskDetailsClient";
import { type LocationSaveData } from "../TaskSettings";
import { Switch } from "@/components/ui/switch";

// Define types for fetched data
interface Property {
  id: string;
  name: string;
  // Add other property fields if needed
}

interface Unit {
  unit_id: string; // Assuming API returns unit_id
  unit_name: string;
  property_id: string;
  // Add other unit fields if needed
}

interface LocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task;
  onSave: (data: LocationSaveData) => Promise<void>;
  role: Task['role']; // Add role prop
}

export function LocationModal({ 
  open, 
  onOpenChange, 
  taskDetails, 
  onSave, 
  role // Destructure role
}: LocationModalProps) {
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(taskDetails.property_id ?? null);
  const [selectedUnitId, setSelectedUnitId] = React.useState<string | null>(taskDetails.unit_id ?? null);
  const [permitEnter, setPermitEnter] = React.useState<boolean>(taskDetails.permit_enter ?? false);
  
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Fetch Properties when modal opens, only if not a tenant request
  React.useEffect(() => {
    if (open && role !== 'tenant_request') {
      const fetchProperties = async () => {
        setIsLoadingProperties(true);
        setFetchError(null);
        try {
          const response = await fetch('/api/property');
          if (!response.ok) throw new Error('Failed to fetch properties');
          const data = await response.json();
          setProperties(data);
          // Reset selected property/unit from taskDetails when properties load
          setSelectedPropertyId(taskDetails.property_id ?? null);
          setSelectedUnitId(taskDetails.unit_id ?? null);
        } catch (err) {
          console.error("Error fetching properties:", err);
          setFetchError(err instanceof Error ? err.message : "Failed to load properties.");
          toast.error(err instanceof Error ? err.message : "Failed to load properties.");
          setProperties([]); // Clear properties on error
        } finally {
          setIsLoadingProperties(false);
        }
      };
      fetchProperties();
    }
  }, [open, taskDetails.property_id, taskDetails.unit_id, role]); // Add role to dependencies

  // Fetch Units when selectedPropertyId changes, only if not a tenant request
  React.useEffect(() => {
    if (selectedPropertyId && role !== 'tenant_request') {
      const fetchUnits = async () => {
        setIsLoadingUnits(true);
        setFetchError(null); // Clear previous fetch errors
        setUnits([]); // Clear existing units
        try {
          const response = await fetch(`/api/property/${selectedPropertyId}/units`);
          if (!response.ok) throw new Error('Failed to fetch units');
          const data: Unit[] = await response.json();
          setUnits(data);
          // Remove the logic that sets selectedUnitId from here
        } catch (err) {
          console.error(`Error fetching units for property ${selectedPropertyId}:`, err);
          setFetchError(err instanceof Error ? err.message : "Failed to load units for this property.");
          toast.error(err instanceof Error ? err.message : "Failed to load units for this property.");
        } finally {
          setIsLoadingUnits(false);
        }
      };
      fetchUnits();
    } else {
      setUnits([]); // Clear units if no property is selected
      setSelectedUnitId(null); // Clear unit selection as well
    }
    // This effect now ONLY depends on the selected property ID and role
  }, [selectedPropertyId, role]); 

  // Set selected unit based on task details or reset when units/property change, only if not a tenant request
   React.useEffect(() => {
    // This effect runs when units load, taskDetails.unit_id changes, modal opens, or property changes
    if (open && units.length > 0 && selectedPropertyId && role !== 'tenant_request') {
       // Only try to set if we have units and a property selected
       if (taskDetails.unit_id && units.some(u => u.unit_id === taskDetails.unit_id)) {
          setSelectedUnitId(taskDetails.unit_id);
       } else {
          // If the task's unit isn't in the current list, or no task unit exists, ensure it's reset.
          // Avoid resetting if the user has manually selected a different unit already.
          // Check if current selectedUnitId is still valid within the new units list
          if (selectedUnitId && !units.some(u => u.unit_id === selectedUnitId)){
            setSelectedUnitId(null);
          } else if (!selectedUnitId && taskDetails.property_id === selectedPropertyId) {
            // If no unit is selected currently, and the property matches the task's original property,
            // attempt to set it from taskDetails if valid.
            if (taskDetails.unit_id && units.some(u => u.unit_id === taskDetails.unit_id)) {
               setSelectedUnitId(taskDetails.unit_id);
            } else {
               // Otherwise, ensure it's null
               setSelectedUnitId(null);
            }
          } else if (!taskDetails.unit_id && taskDetails.property_id === selectedPropertyId) {
            // If task details has no unit_id for this property, ensure selection is null
             setSelectedUnitId(null);
          }
          // If selectedUnitId is already set and valid within the new `units`, we don't reset it here,
          // allowing manual user selection to persist when units refetch for the same property.
       }
    } else if (!selectedPropertyId) {
        // Explicitly clear if no property is selected
        setSelectedUnitId(null);
    }
   }, [units, taskDetails.unit_id, open, selectedPropertyId, taskDetails.property_id, selectedUnitId, role]); // Add role to dependencies


  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // Use existing property/unit IDs if it's a tenant request
      const dataToSave: LocationSaveData = {
        propertyId: role === 'tenant_request' ? taskDetails.property_id : selectedPropertyId,
        unitId: role === 'tenant_request' ? taskDetails.unit_id : selectedUnitId,
        permit_enter: permitEnter
      };
      await onSave(dataToSave);
      toast.success("Task location updated successfully!");
      onOpenChange(false); // Close modal on successful save
    } catch (err) {
      console.error("Failed to save location:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setSaveError(errorMessage);
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePropertyChange = (value: string) => {
    setSelectedPropertyId(value);
    // Unit selection is reset automatically by the useEffect that fetches units
  };

  const handleUnitChange = (value: string) => {
    setSelectedUnitId(value);
  };

  // Reset saveError when modal closes
  React.useEffect(() => {
    if (!open) {
      setSaveError(null);
      setPermitEnter(taskDetails.permit_enter ?? false);
    }
  }, [open, taskDetails.permit_enter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Location</DialogTitle>
          <DialogDescription>
            Assign this task to a specific property and unit.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fetchError && !isLoadingProperties && role !== 'tenant_request' && (
            <p className="text-sm text-red-500 text-center col-span-4">Error: {fetchError}</p>
          )}
          {/* Conditionally render Property and Unit selection */} 
          {role !== 'tenant_request' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="property" className="text-right">
                  Property
                </Label>
                <Select 
                  value={selectedPropertyId ?? undefined} 
                  onValueChange={handlePropertyChange}
                  disabled={isSaving || isLoadingProperties}
                >
                  <SelectTrigger className="col-span-3">
                    {isLoadingProperties ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select a property" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length > 0 ? (
                       properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </SelectItem>
                      ))
                    ) : (
                       <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {isLoadingProperties ? 'Loading...' : 'No properties found'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">
                  Unit
                </Label>
                <Select 
                  value={selectedUnitId ?? undefined} 
                  onValueChange={handleUnitChange} 
                  disabled={!selectedPropertyId || isSaving || isLoadingUnits || isLoadingProperties}
                >
                  <SelectTrigger className="col-span-3">
                     {isLoadingUnits ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <SelectValue placeholder="Select a unit (optional)" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {units.length > 0 ? (
                      units.map((unit) => (
                        // Use unit.unit_id as the key and value based on the interface
                        <SelectItem key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {isLoadingUnits ? 'Loading...' : 
                         !selectedPropertyId ? 'Select a property first' : 'No units found'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {/* Always render Access Switch (or conditionally based on role if needed) */} 
          <div className={`grid grid-cols-4 items-center gap-4 ${role !== 'tenant_request' ? 'border-t pt-4' : ''}`}>  {/* Add border-t only if property/unit are shown */}
             <Label htmlFor="access-to-property-switch" className="text-right col-span-1">
               Access
             </Label>
             <div className="col-span-3 flex items-center justify-between">
               <p className="text-sm text-muted-foreground">
                 Allow access to the property for this work order
               </p>
               <Switch
                 id="access-to-property-switch"
                 checked={permitEnter}
                 onCheckedChange={setPermitEnter}
                 disabled={isSaving}
                 aria-label="Allow access to property"
               />
             </div>
           </div>
          {saveError && (
            <p className="text-sm text-red-500 text-center col-span-4">{saveError}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || isLoadingProperties || isLoadingUnits}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 