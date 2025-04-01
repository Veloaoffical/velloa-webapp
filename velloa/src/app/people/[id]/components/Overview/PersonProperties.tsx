import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building } from "lucide-react";

// Import the correct type from page.tsx
import type { PropertyDetails } from '../../page'; // Adjust path as needed


// Remove isLoading from props
interface PersonPropertiesProps {
  properties: PropertyDetails[] | null;
  // isLoading?: boolean; 
}

// Remove isLoading from destructuring and default value
export function PersonProperties({ properties }: PersonPropertiesProps) {
  const router = useRouter();

  // Keep the main rendering logic
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
                  {/* Use optional chaining more safely and check image array length */}
                  {property.property_images && property.property_images.length > 0 ? (
                    <Image
                      src={property.property_images[0]?.fileUrl || '/placeholder-property.jpg'} // Keep placeholder
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