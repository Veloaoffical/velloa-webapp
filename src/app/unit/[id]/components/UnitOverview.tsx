'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Users, StickyNote, Home, Bed, Bath, CircleDollarSign } from "lucide-react";
import Image from 'next/image';

interface UnitPhoto {
  id: string;
  fileUrl: string;
  fileName: string;
  favorite?: boolean;
  isFavorite?: boolean;
}

interface UnitDetails {
  id: string;
  unit_name: string;
  tenant: string;
  beds: number;
  baths: number;
  market_rent: number;
  size: number;
  status: "available" | "occupied" | "vacant";
  property_id: string;
  created_at: string;
}

interface UnitOverviewProps {
  unitDetails: UnitDetails;
  photos: UnitPhoto[];
}

export function UnitOverview({ unitDetails, photos }: UnitOverviewProps) {
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
              Add Tenant
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
            <Bed className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Beds</p>
            <p className="font-medium">{unitDetails.beds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Bath className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Baths</p>
            <p className="font-medium">{unitDetails.baths}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Home className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Size</p>
            <p className="font-medium">{unitDetails.size} sq ft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <CircleDollarSign className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Market Rent</p>
            <p className="font-medium">
              ${Number(unitDetails.market_rent).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}/Month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Photos and Unit Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photos Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-2">
              {photos.length === 0 ? (
                <>
                  {/* Empty state main image */}
                  <div className="relative h-[300px] rounded-lg overflow-hidden bg-muted" />
                  
                  {/* Empty state side images */}
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
                        src={photos.find(photo => photo.favorite || photo.isFavorite)?.fileUrl || photos[0].fileUrl}
                        alt="Main unit view"
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
                          alt="Unit view 2"
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
                            alt="Unit view 3"
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

        {/* Unit Details */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Tenant Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{unitDetails.size} sq ft</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  unitDetails.status === "occupied" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {unitDetails.status.charAt(0).toUpperCase() + unitDetails.status.slice(1)}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Tenant</p>
                <p className="font-medium">{unitDetails.tenant || 'No tenant'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{new Date(unitDetails.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 