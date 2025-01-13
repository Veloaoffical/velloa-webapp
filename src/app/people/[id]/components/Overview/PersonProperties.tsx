import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Building } from "lucide-react";

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
  }[];
}

interface PersonPropertiesProps {
  properties: PropertyDetails[] | null;
  isLoading?: boolean;
}

export function PersonProperties({ properties, isLoading = false }: PersonPropertiesProps) {
  const router = useRouter();

  if (isLoading || (!properties && properties !== null)) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
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
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold mb-4">Properties</h2>
        {properties && properties.length > 0 ? (
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
                      src={property.property_images[0]?.fileUrl || '/placeholder-property.jpg'}
                      alt={property.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
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
            <p className="text-gray-500">No properties linked</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 