'use client';

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "../../TaskDetailsClient";

// Define the shape of the data returned by the vendor API
interface Vendor {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  // Add other relevant fields if needed for display
}

// Define the shape of the data returned by the company members API
export interface Assignee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  // email is not included in this API response
}

// Define the shape of the data returned by the tenant API
interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  // Add other relevant fields if needed for display (e.g., unit_name)
}

// Define the shape of the data to be saved
interface PeopleSaveData {
  vendorId?: string | null;
  assignee?: Assignee | null; // Changed from assigneeId: string
  tenantId?: string | null; // Add tenantId
}

interface PeopleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: Task; // Contains current selections like taskDetails.vendor_id
  onSave: (data: PeopleSaveData) => Promise<void>; // Use PeopleSaveData
  role: Task['role']; // Add the role prop
}

export function PeopleModal({
  open,
  onOpenChange,
  taskDetails,
  onSave,
  role, // Destructure the role prop
}: PeopleModalProps) {
  // State for selections
  const [selectedVendor, setSelectedVendor] = React.useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = React.useState<string | null>(null); // Add state for selected tenant
  const [selectedAssignee, setSelectedAssignee] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // State for vendor data fetching
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = React.useState(false);
  const [vendorError, setVendorError] = React.useState<string | null>(null);

  // State for tenant data fetching
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = React.useState(false);
  const [tenantError, setTenantError] = React.useState<string | null>(null);

  // State for assignee data fetching
  const [assignees, setAssignees] = React.useState<Assignee[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = React.useState(false);
  const [assigneeError, setAssigneeError] = React.useState<string | null>(null);

  // Fetch vendors and assignees when the modal opens
  React.useEffect(() => {
    if (open) {
      // Reset previous states
      setIsLoadingVendors(true);
      setVendorError(null);
      setVendors([]);
      setIsLoadingAssignees(true);
      setAssigneeError(null);
      setAssignees([]);
      setIsLoadingTenants(true); // Initialize tenant loading state
      setTenantError(null);      // Initialize tenant error state
      setTenants([]);            // Initialize tenants array

      // Set initial selections from taskDetails based on role
      if (role === 'tenant_request') {
        setSelectedTenant(taskDetails.tenant_id || null);
      } else {
        setSelectedVendor(taskDetails.vendor_id || null);
      }
      setSelectedAssignee(taskDetails.assignee?.id || null);

      // Fetch Vendors or Tenants based on role
      if (role === 'tenant_request') {
        fetch('/api/people/tenants') // Corrected API endpoint
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch tenants');
            return response.json();
          })
          .then((data: Tenant[]) => setTenants(data))
          .catch(error => {
            console.error("Error fetching tenants:", error);
            setTenantError(error.message || 'Could not load tenants.');
          })
          .finally(() => setIsLoadingTenants(false));
      } else {
        // Fetch Vendors (existing logic)
        fetch('/api/people/vendor/search')
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch vendors');
            return response.json();
          })
          .then((data: Vendor[]) => setVendors(data))
          .catch(error => {
            console.error("Error fetching vendors:", error);
            setVendorError(error.message || 'Could not load vendors.');
          })
          .finally(() => setIsLoadingVendors(false));
      }

      // Fetch Assignees
      fetch('/api/company/members')
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch assignees');
          return response.json();
        })
        .then((data: Assignee[]) => setAssignees(data))
        .catch(error => {
          console.error("Error fetching assignees:", error);
          setAssigneeError(error.message || 'Could not load assignees.');
        })
        .finally(() => setIsLoadingAssignees(false));
    } else {
      // Optionally reset state when closing if desired
      // setSelectedVendor(null);
      // setSelectedAssignee(null);
      // setVendors([]);
      // setAssignees([]);
      // setSelectedTenant(null); // Reset selected tenant on close
      // setTenants([]); // Reset tenants on close
    }
  }, [open, taskDetails.vendor_id, taskDetails.assignee?.id, taskDetails.tenant_id, role]); // Add role and tenant_id to dependencies

  const handleSaveClick = async () => {
    setIsSaving(true);
    const selectedAssigneeObject = assignees.find(a => a.id === selectedAssignee) || null;

    const dataToSave: PeopleSaveData = {
      assignee: selectedAssigneeObject,
    };

    if (role === 'tenant_request') {
      dataToSave.tenantId = selectedTenant;
    } else {
      dataToSave.vendorId = selectedVendor;
    }

    try {
      await onSave(dataToSave);
      onOpenChange(false); // Close modal on successful save
    } catch (error) {
      console.error("Failed to save people settings:", error);
      // Optionally show an error message to the user
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Manage People</DialogTitle>
          <DialogDescription>
            Assign vendors or internal team members to this task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Vendor Dropdown or Tenant Dropdown based on role */}
          {role === 'tenant_request' ? (
            // Tenant Dropdown
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tenant">
                Tenant
              </Label>
              <Select
                value={selectedTenant || ''}
                onValueChange={setSelectedTenant}
                disabled={isLoadingTenants || !!tenantError}
              >
                <SelectTrigger id="tenant" className="col-span-3">
                  <SelectValue placeholder={isLoadingTenants ? "Loading..." : tenantError || "Select a tenant"} />
                </SelectTrigger>
                <SelectContent>
                  {tenantError ? (
                    <SelectItem value="error" disabled>{tenantError}</SelectItem>
                  ) : isLoadingTenants ? (
                    <SelectItem value="loading" disabled>Loading tenants...</SelectItem>
                  ) : tenants.length === 0 ? (
                     <SelectItem value="no-tenants" disabled>No tenants found</SelectItem>
                  ) : (
                    <>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {`${tenant.first_name} ${tenant.last_name}`}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            // Vendor Dropdown (existing logic)
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendor">
                Vendor
              </Label>
              <Select
                value={selectedVendor || ''}
                onValueChange={setSelectedVendor}
                disabled={isLoadingVendors || !!vendorError}
              >
                <SelectTrigger id="vendor" className="col-span-3">
                  <SelectValue placeholder={isLoadingVendors ? "Loading..." : vendorError || "Select a vendor"} />
                </SelectTrigger>
                <SelectContent>
                  {vendorError ? (
                    <SelectItem value="error" disabled>{vendorError}</SelectItem>
                  ) : isLoadingVendors ? (
                    <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                  ) : vendors.length === 0 ? (
                     <SelectItem value="no-vendors" disabled>No vendors found</SelectItem>
                  ) : (
                    <>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.company || `${vendor.first_name} ${vendor.last_name}`}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignee Dropdown */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="assignee">
              Assignee
            </Label>
            <Select
              value={selectedAssignee || ''}
              onValueChange={setSelectedAssignee}
              disabled={isLoadingAssignees || !!assigneeError}
            >
              <SelectTrigger id="assignee" className="col-span-3">
                <SelectValue placeholder={isLoadingAssignees ? "Loading..." : assigneeError || "Select an assignee"} />
              </SelectTrigger>
              <SelectContent>
                 {assigneeError ? (
                  <SelectItem value="error" disabled>{assigneeError}</SelectItem>
                ) : isLoadingAssignees ? (
                  <SelectItem value="loading" disabled>Loading assignees...</SelectItem>
                ) : assignees.length === 0 ? (
                  <SelectItem value="no-assignees" disabled>No assignees found</SelectItem>
                ) : (
                  <>
                    {assignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {assignee.first_name || assignee.last_name 
                          ? `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim()
                          : '[No Name]'}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveClick} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 