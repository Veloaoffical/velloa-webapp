'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, CircleUserRound, FileText, ClipboardList, FileSignature, ContactRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonProperties } from "./Overview/PersonProperties";
import { PersonInterests } from "./Overview/PersonInterests";
import { VendorProperties } from "./Overview/VendorProperties";

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
  agreement_start: string | null;
  agreement_end: string | null;
  portal_status: boolean;
  service_address?: string | {
    type: 'all' | 'specific';
    property_ids?: string[];
  };
  insurance?: {
    coverage: string;
    provider: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
  };
  services?: {
    categories: string[];
    classifications: string[];
  };
}

interface VendorServiceAddress {
  type: 'all' | 'specific';
  property_ids?: string[];
}

interface PropertyDetails {
  id: string;
  name: string;
  address_line_1: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
  property_images?: {
    id: string;
    fileUrl: string;
    fileName: string;
    createdAt: string;
    favorite: boolean;
    isFavorite: boolean;
    listing_favorite_image: boolean;
  }[];
}

interface AssigneeDetails {
  id: string;
  first_name: string;
  last_name: string;
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
  const [isLoadingAssignee, setIsLoadingAssignee] = useState(true);
  const [isLoadingProperties, setIsLoadingProperties] = useState(personDetails.role === 'owner' || personDetails.role === 'vendor');
  const [isLoadingUnit, setIsLoadingUnit] = useState(personDetails.role === 'prospect' && !!personDetails.unit_id);
  const [assigneeDetails, setAssigneeDetails] = useState<AssigneeDetails | null>(null);
  const [properties, setProperties] = useState<PropertyDetails[] | null>(null);
  const [unitDetails, setUnitDetails] = useState<UnitDetails | null>(null);
  const [serviceAddress, setServiceAddress] = useState<VendorServiceAddress | null>(null);

  // Fetch assignee details
  useEffect(() => {
    let mounted = true;

    const fetchAssigneeData = async () => {
      if (!personDetails.assignee_id) {
        setIsLoadingAssignee(false);
        return;
      }

      try {
        const assigneeResponse = await fetch(`/api/people/${personDetails.assignee_id}`);
        if (!assigneeResponse.ok) {
          const errorData = await assigneeResponse.json();
          console.error('Assignee fetch failed:', {
            status: assigneeResponse.status,
            statusText: assigneeResponse.statusText,
            error: errorData
          });
          throw new Error(`Failed to fetch assignee details: ${assigneeResponse.status} ${assigneeResponse.statusText}`);
        }
        const assigneeData = await assigneeResponse.json();
        
        if (mounted) {
          setAssigneeDetails(assigneeData);
        }
      } catch (err) {
        console.error('Error fetching assignee:', err);
      } finally {
        if (mounted) {
          setIsLoadingAssignee(false);
        }
      }
    };

    fetchAssigneeData();
    return () => {
      mounted = false;
    };
  }, [personDetails.assignee_id]);

  // Fetch properties for owners and vendors
  useEffect(() => {
    let mounted = true;

    const fetchProperties = async () => {
      if (personDetails.role !== 'owner' && personDetails.role !== 'vendor') {
        setIsLoadingProperties(false);
        return;
      }

      try {
        const propertiesResponse = await fetch(`/api/people/${personDetails.id}/properties`);
        if (!propertiesResponse.ok) throw new Error('Failed to fetch properties');
        const propertiesData = await propertiesResponse.json();

        // For vendors, we need to fetch the full property details for each property ID
        if (personDetails.role === 'vendor') {
          // Parse service_address from person details
          const serviceAddressData = personDetails.service_address ? 
            (typeof personDetails.service_address === 'string' ? 
              JSON.parse(personDetails.service_address) : 
              personDetails.service_address) : 
            { type: 'specific', property_ids: [] };
          
          setServiceAddress(serviceAddressData);

          // If type is 'all' or no property_ids, don't fetch property details
          if (serviceAddressData.type === 'all' || !serviceAddressData.property_ids?.length) {
            if (mounted) {
              setProperties(null);
              setIsLoadingProperties(false);
            }
            return;
          }

          // Fetch details for each property
          const propertyDetailsPromises = serviceAddressData.property_ids.map(async (id: string) => {
            const response = await fetch(`/api/property/${id}/propertySettings`);
            if (!response.ok) return null;
            const propertyData = await response.json();

            // Fetch images for the property
            try {
              const photosResponse = await fetch(`/api/property/${id}/photos`);
              if (!photosResponse.ok) throw new Error('Failed to fetch property photos');
              const photosData = await photosResponse.json();
              return { ...propertyData, property_images: photosData };
            } catch (err) {
              console.error(`Error fetching photos for property ${id}:`, err);
              return propertyData;
            }
          });

          const propertyDetails = (await Promise.all(propertyDetailsPromises)).filter(Boolean);
          if (mounted) {
            setProperties(propertyDetails);
          }
        } else {
          // For owners, fetch images for each property
          const propertiesWithImages = await Promise.all(
            propertiesData.map(async (property: PropertyDetails) => {
              try {
                const photosResponse = await fetch(`/api/property/${property.id}/photos`);
                if (!photosResponse.ok) throw new Error('Failed to fetch property photos');
                const photosData = await photosResponse.json();
                return { ...property, property_images: photosData };
              } catch (err) {
                console.error(`Error fetching photos for property ${property.id}:`, err);
                return property;
              }
            })
          );

          if (mounted) {
            setProperties(propertiesWithImages);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        if (mounted) {
          setIsLoadingProperties(false);
        }
      }
    };

    fetchProperties();
    return () => {
      mounted = false;
    };
  }, [personDetails.id, personDetails.role, personDetails.service_address]);

  // Fetch unit details for prospects
  useEffect(() => {
    let mounted = true;

    const fetchUnitData = async () => {
      if (personDetails.role !== 'prospect' || !personDetails.unit_id) {
        setIsLoadingUnit(false);
        return;
      }

      try {
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
      } catch (err) {
        console.error('Error fetching unit data:', err);
      } finally {
        if (mounted) {
          setIsLoadingUnit(false);
        }
      }
    };

    fetchUnitData();
    return () => {
      mounted = false;
    };
  }, [personDetails.unit_id, personDetails.role]);

  if (isLoadingAssignee) {
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

        {/* Contact Information Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {personDetails.role === 'prospect' && (
              <Button className="w-full gap-2">
                <FileText className="w-4 h-4" />
                View Rental Application
              </Button>
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
                <Button className="w-full gap-2">
                  <ClipboardList className="w-4 h-4" />
                  New Task
                </Button>
                <Button className="w-full gap-2">
                  <FileSignature className="w-4 h-4" />
                  New Note
                </Button>
              </>
            ) : personDetails.role === 'prospect' && (
              <>
                <Button className="w-full gap-2">
                  <ClipboardList className="w-4 h-4" />
                  New Task
                </Button>
                <Button className="w-full gap-2">
                  <FileSignature className="w-4 h-4" />
                  New Lease
                </Button>
              </>
            )}
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
                  ? 'text-green-600' 
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

        {personDetails.role === 'owner' ? (
          <PersonProperties properties={properties} isLoading={isLoadingProperties} />
        ) : personDetails.role === 'vendor' ? (
          <VendorProperties 
            serviceAddress={serviceAddress}
            properties={properties}
            isLoading={isLoadingProperties}
          />
        ) : personDetails.role === 'prospect' ? (
          <PersonInterests unitDetails={unitDetails} isLoading={isLoadingUnit} />
        ) : null}
      </div>
    </div>
  );
} 