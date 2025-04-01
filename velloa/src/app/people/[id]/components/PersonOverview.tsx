'use client';

// Remove useState and useEffect imports as they are no longer needed for data fetching
// import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, CircleUserRound, FileText, ClipboardList, FileSignature, ContactRound } from "lucide-react";
import { Button } from "@/components/ui/button";
// Remove Skeleton import
// import { Skeleton } from "@/components/ui/skeleton";
import { PersonProperties } from "./Overview/PersonProperties";
import { PersonInterests } from "./Overview/PersonInterests";
import { VendorProperties } from "./Overview/VendorProperties";
import { useRouter } from 'next/navigation';

// Import types from page.tsx
import type {
    PersonDetails,
    AssigneeDetails,
    PropertyDetails,
    UnitDetails,
    VendorServiceAddress
} from '../page'; // Adjust path if necessary

// Use imported types in the props interface
interface PersonOverviewProps {
  personDetails: PersonDetails;
  setActiveTab?: (value: string) => void;
  assigneeDetails: AssigneeDetails | null;
  properties: PropertyDetails[] | null;
  unitDetails: UnitDetails | null;
  serviceAddress: VendorServiceAddress | null;
}

function formatPhoneNumber(phone: string) {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if we have enough digits
  if (cleaned.length < 10) return phone;

  // Format as +0 (000)-000-0000
  // Ensure formatting handles cases like US numbers (10 digits) vs international
  if (cleaned.length === 10) {
     return `(${cleaned.slice(0, 3)})-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  if (cleaned.length === 11) { // Assuming +1 for US/Canada
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  }
  // Fallback for other lengths or formats
  return phone;
}

export function PersonOverview({
    personDetails,
    setActiveTab,
    assigneeDetails,
    properties,
    unitDetails,
    serviceAddress
}: PersonOverviewProps) {
  const router = useRouter();

  // Removed data fetching logic...

  const handleNewTask = () => {
    router.push(`/tasks/add-task?person_id=${personDetails.id}&person_role=${personDetails.role}`);
  };

  // Removed loading skeleton...

  // Use props directly in the component body
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {personDetails.role === 'prospect' && (
              <>
                <Button
                  className="w-full gap-2"
                  onClick={() => setActiveTab?.("rental-application")}
                >
                  <FileText className="w-4 h-4" />
                  View Rental Application
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={handleNewTask}
                >
                  <ClipboardList className="w-4 h-4" />
                  New Task
                </Button>
                <Button className="w-full gap-2">
                  <FileSignature className="w-4 h-4" />
                  New Lease
                </Button>
              </>
            )}
            {personDetails.role === 'owner' ? (
              <>
                <Button className="w-full gap-2">
                  <FileSignature className="w-4 h-4" />
                  New Contribution
                </Button>
                <Button className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  New Distribution
                </Button>
                <Button className="w-full gap-2">
                  <ClipboardList className="w-4 h-4" />
                  New Owner Request
                </Button>
              </>
            ) : personDetails.role === 'vendor' ? (
              <>
                <Button className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  New Work Order
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={handleNewTask}
                >
                  <ClipboardList className="w-4 h-4" />
                  New Task
                </Button>
                <Button className="w-full gap-2">
                  <FileSignature className="w-4 h-4" />
                  New Note
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats - Use props directly */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <CircleUserRound className={`h-6 w-6 mb-2 ${personDetails.role === 'prospect' ? 'text-blue-600' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium capitalize">
              {personDetails.role}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Mail className="h-6 w-6 mb-2 text-blue-600" />
            <p className="text-sm text-muted-foreground">{personDetails.role === 'vendor' ? 'Insurance Status' : 'Status'}</p>
            <p className="font-medium capitalize">
              {personDetails.role === 'vendor'
                ? (personDetails.insurance
                    ? (new Date() <= new Date(personDetails.insurance.expiration_date)
                        ? 'Active'
                        : 'Expired')
                    : 'Not Set')
                : (personDetails.status || 'Not Set')
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
             <FileText className={`h-6 w-6 mb-2 ${ 
              personDetails.role === 'owner'
                ? (personDetails.agreement_start && personDetails.agreement_end
                  ? (new Date() >= new Date(personDetails.agreement_start) && new Date() <= new Date(personDetails.agreement_end) ? 'text-green-600' : 'text-red-500')
                  : 'text-muted-foreground')
                : personDetails.role === 'vendor'
                  ? (personDetails.services?.classifications?.length ? 'text-green-600' : 'text-muted-foreground')
                  : (personDetails.lead_source 
                    ? 'text-green-600' 
                    : 'text-muted-foreground')
            }`} />
            <p className="text-sm text-muted-foreground">
              {personDetails.role === 'owner' ? 'Agreement Status' : personDetails.role === 'vendor' ? 'Classification' : 'Lead Source'}
            </p>
            <p className="font-medium capitalize">
              {personDetails.role === 'owner' 
                ? (personDetails.agreement_start && personDetails.agreement_end
                    ? (new Date() >= new Date(personDetails.agreement_start) && 
                       new Date() <= new Date(personDetails.agreement_end)
                        ? 'Active'
                        : new Date() < new Date(personDetails.agreement_start)
                          ? 'Pending'
                          : 'Expired')
                    : 'Not Set')
                : personDetails.role === 'vendor'
                  ? (personDetails.services?.classifications?.[0] || 'Not Set')
                  : (personDetails.lead_source || 'Not Set')
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {personDetails.role === 'owner' && (
              <>
                <ContactRound className={`h-6 w-6 mb-2 ${personDetails.portal_status ? 'text-green-600' : 'text-red-500'}`} />
                <p className="text-sm text-muted-foreground">Owner Portal</p>
                <p className="font-medium">
                  {personDetails.portal_status ? 'Active' : 'Inactive'}
                </p>
              </>
            )}
            {personDetails.role === 'vendor' && (
              <>
                <ContactRound className="h-6 w-6 mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="font-medium">0</p> 
              </>
            )}
            {personDetails.role !== 'owner' && personDetails.role !== 'vendor' && (
              <>
                 <ContactRound className={`h-6 w-6 mb-2 ${assigneeDetails ? 'text-green-600' : 'text-yellow-500'}`} />
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">
                  {assigneeDetails ? `${assigneeDetails.first_name} ${assigneeDetails.last_name}` : "Not Assigned"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information */} 
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CircleUserRound className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{`${personDetails.first_name} ${personDetails.last_name}`}</p>
                  <p className="text-sm text-muted-foreground capitalize">{personDetails.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{personDetails.email}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{formatPhoneNumber(personDetails.phone)}</p>
                  <p className="text-sm text-muted-foreground">Phone</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render sub-components with props */} 
        {personDetails.role === 'owner' ? (
          <PersonProperties properties={properties} />
        ) : personDetails.role === 'vendor' ? (
          <VendorProperties 
            serviceAddress={serviceAddress}
            properties={properties} 
          />
        ) : personDetails.role === 'prospect' ? (
          <PersonInterests unitDetails={unitDetails} />
        ) : null}
      </div>
    </div>
  );
} 