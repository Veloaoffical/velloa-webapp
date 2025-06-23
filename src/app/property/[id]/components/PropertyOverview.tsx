'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Users, StickyNote, Building2, Key, Users2, Settings2, Plus } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

interface PropertyPhoto {
  id: string;
  url?: string;
  createdAt?: string;
  fileName: string;
  fileUrl: string;
  favorite?: boolean;
  size?: number;
  uploadDate?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  isVideo?: boolean;
  fileType?: string;
  companyId?: string;
  isFavorite?: boolean;
}

interface PropertySetting {
  id: string;
  type: string;
  value: string | null;
  property_type?: {
    propertyType: string;
    propertyKind: string;
  };
  status?: boolean;
  amenities?: string[];
  pet_policy?: Record<string, unknown>;
  owners?: Record<string, unknown>;
  bank_accounts?: Record<string, unknown>;
}

interface PropertyDetails {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
  property_settings: PropertySetting[];
  units: { id: number }[] | null;
  created_at: string;
  company_id: number;
}

interface Owner {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  ownership_percentage?: number;
  first_name?: string;
  last_name?: string;
  company?: string;
}

interface PropertyOverviewProps {
  propertyDetails: PropertyDetails;
  photos: PropertyPhoto[];
  owners: Owner[];
}

export function PropertyOverview({ propertyDetails, photos, owners }: PropertyOverviewProps) {
  // Extract property type and status from settings
  const propertySetting = propertyDetails.property_settings?.find(setting => setting.type === 'property_settings');
  const rawPropertyType = propertySetting?.property_type?.propertyType || 'N/A';
  const rawPropertyKind = propertySetting?.property_type?.propertyKind || 'N/A';
  const propertyType = rawPropertyType !== 'N/A' ? rawPropertyType.charAt(0).toUpperCase() + rawPropertyType.slice(1).toLowerCase() : 'N/A';
  const propertyKind = rawPropertyKind !== 'N/A' ? rawPropertyKind.charAt(0).toUpperCase() + rawPropertyKind.slice(1).toLowerCase() : 'N/A';
  const propertyStatus = propertySetting?.status ? 'Active' : 'Inactive';

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Button className="w-full gap-2">
              <ClipboardList className="w-4 h-4" />
              New Task
            </Button>
            <Button className="w-full gap-2">
              <Users className="w-4 h-4" />
              View Rental Application
            </Button>
            <Button className="w-full gap-2">
              <StickyNote className="w-4 h-4" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">Property Type</p>
              <p className="font-medium">{propertyType}</p>
            </div>
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">Property Kind</p>
              <p className="font-medium">{propertyKind}</p>
            </div>
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">Active Units</p>
              <p className="font-medium">{propertyDetails.units?.length || 0}</p>
            </div>
            <Key className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">Pending Applications</p>
              <p className="font-medium">0</p>
            </div>
            <Users2 className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{propertyStatus}</p>
            </div>
            <Settings2 className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Photos and Owners Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photos Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-2">
              {photos.length === 0 ? (
                <>
                  {/* Skeleton main image */}
                  <div className="relative h-[300px] rounded-lg overflow-hidden bg-muted" />
                  
                  {/* Skeleton side images */}
                  <div className="hidden md:flex flex-col gap-2">
                    <div className="relative h-[146px] rounded-lg overflow-hidden bg-muted" />
                    <div className="relative h-[146px] rounded-lg overflow-hidden bg-muted" />
                  </div>
                </>
              ) : (
                <>
                  {/* Main image */}
                  <div className="relative h-[300px] rounded-lg overflow-hidden group/photos">
                    {photos[0] ? (
                      <Image
                        src={photos.find(photo => photo.favorite || photo.isFavorite)?.fileUrl || 
                             photos[0]?.fileUrl}
                        alt="Main property view"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 66vw"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>

                  {/* Side images container */}
                  <div className="hidden md:flex flex-col gap-2">
                    {/* Top right image */}
                    <div className="relative h-[146px] rounded-lg overflow-hidden group/photos">
                      {photos[1] ? (
                        <Image
                          src={photos[1].fileUrl}
                          alt="Property view 2"
                          fill
                          className="object-cover"
                          sizes="33vw"
                          loading="lazy"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>

                    {/* Bottom right image */}
                    <div className="relative h-[146px] rounded-lg overflow-hidden group/photos">
                      {photos[2] ? (
                        <>
                          <Image
                            src={photos[2].fileUrl}
                            alt="Property view 3"
                            fill
                            className="object-cover group-hover/photos:opacity-75 transition-opacity"
                            sizes="33vw"
                            loading="lazy"
                            unoptimized
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/photos:opacity-100 transition-opacity">
                            <Button variant="secondary" size="sm" className="gap-2">
                              <ClipboardList className="w-4 h-4" />
                              See all photos ({photos.length})
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Owner Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {owners.length === 0 ? (
            // Show empty state cards when no owners
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No Owner</p>
                  <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
                    <Link href="/people/add-owner">
                      <Plus className="h-4 w-4" />
                      Add Owner
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            // Show actual owners and fill remaining slots
            <>
              {owners.slice(0, 4).map((owner) => (
                <Card key={owner?.id || Math.random()}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    {/* Avatar Circle */}
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <span className="text-sm font-medium">
                        {owner?.first_name && owner?.last_name 
                          ? `${owner.first_name[0]}${owner.last_name[0]}`.toUpperCase()
                          : '??'}
                      </span>
                    </div>
                    
                    {/* Name */}
                    <h3 className="text-sm font-medium mb-1">
                      {owner?.first_name && owner?.last_name 
                        ? `${owner.first_name} ${owner.last_name}`
                        : owner?.name || 'Unnamed Owner'}
                    </h3>
                    
                    {/* Company */}
                    {owner?.company && (
                      <p className="text-xs text-muted-foreground mb-1">{owner.company}</p>
                    )}
                    
                    {/* Ownership Percentage */}
                    <p className="text-xs text-muted-foreground">
                      {owner?.ownership_percentage || 0}% Ownership
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {/* Fill remaining slots with empty cards */}
              {Array.from({ length: Math.max(0, 4 - owners.length) }).map((_, index) => (
                <Card key={`empty-${index}`}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No Owner</p>
                    <Button variant="outline" size="sm" className="mt-2 gap-2" asChild>
                      <Link href="/people/add-owner">
                        <Plus className="h-4 w-4" />
                        Add Owner
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}