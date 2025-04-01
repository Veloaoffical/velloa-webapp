import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building } from "lucide-react";

import type { PropertyDetails, VendorServiceAddress } from '../../page';

interface VendorPropertiesProps {
  serviceAddress: VendorServiceAddress | null;
  properties: PropertyDetails[] | null;
}

export function VendorProperties({ serviceAddress, properties }: VendorPropertiesProps) {
  const router = useRouter();

  const getFavoriteImage = (images?: PropertyDetails['property_images']) => {
    if (!images || images.length === 0) return null;
    
    // First try to find the listing favorite image
    const listingFavorite = images.find(img => img.listing_favorite_image);
    if (listingFavorite) return listingFavorite.fileUrl;
    
    // Then try to find a regular favorite image
    const favorite = images.find(img => img.favorite || img.isFavorite);
    if (favorite) return favorite.fileUrl;
    
    // If no favorites found, return the first image
    return images[0].fileUrl;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold mb-4">Service Addresses</h2>
        {serviceAddress?.type === 'all' ? (
          <div className="rounded-lg border overflow-hidden flex flex-col">
            <div className="p-4 flex items-center justify-center bg-green-50">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="p-4 text-center">
              <h3 className="font-medium text-sm">All Properties</h3>
              <p className="text-xs text-gray-500 mt-1">Vendor has access to all properties</p>
            </div>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {properties.map((property) => (
              <div 
                key={property.id}
                className="rounded-lg border overflow-hidden flex flex-col cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
                onClick={() => router.push(`/property/${property.id}`)}
              >
                <div className="relative w-full h-28">
                  {property.property_images && property.property_images.length > 0 ? (
                    <Image
                      src={getFavoriteImage(property.property_images) || '/placeholder-property.jpg'}
                      alt={property.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-2 flex flex-col">
                  <h3 className="font-medium text-sm">{property.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{property.address_line_1}</p>
                  <p className="text-xs text-gray-500">{property.city}, {property.state} {property.zip}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No service addresses assigned</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 