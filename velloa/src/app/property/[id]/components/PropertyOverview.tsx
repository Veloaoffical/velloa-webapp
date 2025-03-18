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
  // Extract property type and category from settings
  const propertyType = propertyDetails.property_settings?.find(setting => setting.type === 'propertyType')?.value || 'N/A';
  const propertyCategory = propertyDetails.property_settings?.find(setting => setting.type === 'category')?.value || 'N/A';

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Building2 className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Property Type</p>
            <p className="font-medium">{propertyCategory === 'residential' ? propertyType : `${propertyCategory} - ${propertyType}`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Key className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Active Units</p>
            <p className="font-medium">{propertyDetails.units?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Users2 className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Pending Applications</p>
            <p className="font-medium">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Settings2 className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">N/A</p>
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

        {/* Owners Card */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-medium">Owners</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/people/add-owner" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Owner
                </Link>
              </Button>
            </div>
            {owners.length === 0 ? (
              <p className="p-4 text-muted-foreground">No owners found</p>
            ) : (
              <div className="p-4">
                <div className="max-w-[200px]">
                  {owners.map((owner) => (
                    <div key={owner?.id || Math.random()} className="flex flex-col items-center p-4 border rounded-lg mb-2">
                      {/* Avatar Circle */}
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                        <span className="text-sm font-medium">
                          {owner?.first_name && owner?.last_name 
                            ? `${owner.first_name[0]}${owner.last_name[0]}`.toUpperCase()
                            : '??'}
                        </span>
                      </div>
                      
                      {/* Name */}
                      <h3 className="text-sm font-medium">
                        {owner?.first_name && owner?.last_name 
                          ? `${owner.first_name} ${owner.last_name}`
                          : owner?.name || 'Unnamed Owner'}
                      </h3>
                      
                      {/* Company */}
                      {owner?.company && (
                        <p className="text-xs text-muted-foreground">{owner.company}</p>
                      )}
                      
                      {/* Email */}
                      {owner?.email && (
                        <p className="text-xs text-muted-foreground">{owner.email}</p>
                      )}
                      
                      {/* Ownership Percentage */}
                      <p className="text-xs text-muted-foreground">
                        {owner?.ownership_percentage || 0}% Ownership
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}