'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, CircleUserRound, FileText, ClipboardList, FileSignature, ContactRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

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
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
}

interface UnitDetails {
  id: string;
  unit_name: string;
  beds: number;
  baths: number;
  market_rent: number;
  size: number;
  status: string;
  property_id: string;
  created_at: string;
  property?: {
    name: string;
    address_line_1: string;
    city: string;
    state: string;
    zip: string;
  };
  unit_images?: {
    id: string;
    fileUrl: string;
    fileName: string;
    createdAt: string;
    favorite: boolean;
    isFavorite: boolean;
  }[];
}

interface AssigneeDetails {
  id: string;
  first_name: string;
  last_name: string;
}

interface PersonOverviewProps {
  personDetails: PersonDetails;
}

function formatPhoneNumber(phone: string) {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if we have enough digits
  if (cleaned.length < 10) return phone;
  
  // Format as +0 (000)-000-0000
  return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
}

export function PersonOverview({ personDetails }: PersonOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [unitDetails, setUnitDetails] = useState<UnitDetails | null>(null);
  const [assigneeDetails, setAssigneeDetails] = useState<AssigneeDetails | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        // Fetch unit details if exists
        if (personDetails.unit_id) {
          const unitResponse = await fetch(`/api/unit/${personDetails.unit_id}`);
          if (!unitResponse.ok) throw new Error('Failed to fetch unit details');
          const unitData = await unitResponse.json();

          const propertyResponse = await fetch(`/api/property/${unitData.property_id}/propertySettings`);
          if (!propertyResponse.ok) throw new Error('Failed to fetch property details');
          const propertyData = await propertyResponse.json();

          const photosResponse = await fetch(`/api/unit/${personDetails.unit_id}/photos`);
          if (!photosResponse.ok) throw new Error('Failed to fetch unit photos');
          const photosData = await photosResponse.json();

          if (mounted) {
            setUnitDetails({
              ...unitData,
              property: {
                name: propertyData.name,
                address_line_1: propertyData.address_line_1,
                city: propertyData.city,
                state: propertyData.state,
                zip: propertyData.zip,
              },
              unit_images: photosData,
            });
          }
        }

        // Fetch assignee details if exists
        if (personDetails.assignee_id) {
          const assigneeResponse = await fetch(`/api/people/${personDetails.assignee_id}`);
          if (!assigneeResponse.ok) throw new Error('Failed to fetch assignee details');
          const assigneeData = await assigneeResponse.json();
          
          if (mounted) {
            setAssigneeDetails(assigneeData);
          }
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [personDetails.unit_id, personDetails.assignee_id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Quick Actions Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Skeleton className="h-6 w-6 mb-2 rounded-full" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Information Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interests Skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg border overflow-hidden">
                    <Skeleton className="w-full h-28" />
                    <div className="p-2">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-4/5 mb-1" />
                      <Skeleton className="h-3 w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Button className="w-full gap-2">
              <FileText className="w-4 h-4" />
              View Rental Application
            </Button>
            <Button className="w-full gap-2">
              <ClipboardList className="w-4 h-4" />
              New Task
            </Button>
            <Button className="w-full gap-2">
              <FileSignature className="w-4 h-4" />
              New Lease
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
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
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">
              {personDetails.status || 'Not Set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <FileText className={`h-6 w-6 mb-2 ${personDetails.lead_source ? 'text-green-600' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground">Lead Source</p>
            <p className="font-medium capitalize">
              {personDetails.lead_source || 'Not Set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <ContactRound className={`h-6 w-6 mb-2 ${assigneeDetails ? 'text-green-600' : 'text-yellow-500'}`} />
            <p className="text-sm text-muted-foreground">Assigned To</p>
            <p className="font-medium">
              {assigneeDetails ? `${assigneeDetails.first_name} ${assigneeDetails.last_name}` : "Not Assigned"}
            </p>
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

        {/* Interests */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Interests</h2>
            {unitDetails ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div 
                  className="rounded-lg border overflow-hidden flex flex-col cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
                  onClick={() => router.push(`/unit/${unitDetails.id}`)}
                >
                  <div className="relative w-full h-28">
                    {unitDetails.unit_images && unitDetails.unit_images.length > 0 ? (
                      <Image
                        src={unitDetails.unit_images[0]?.fileUrl || '/placeholder-property.jpg'}
                        alt={`Unit ${unitDetails.unit_name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col">
                    <h3 className="font-medium text-sm">
                      {unitDetails.property?.name ? `${unitDetails.property.name} - Unit ${unitDetails.unit_name}` : `Unit ${unitDetails.unit_name}`}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{unitDetails.property?.address_line_1}</p>
                    <p className="text-xs text-gray-500">{unitDetails.property?.city}, {unitDetails.property?.state} {unitDetails.property?.zip}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed rounded-lg">
                <p className="text-gray-500">No unit assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 