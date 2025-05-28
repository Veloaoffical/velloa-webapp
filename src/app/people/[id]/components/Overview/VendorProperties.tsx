import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Building } from "lucide-react";

import type { PropertyDetails, VendorServiceAddress } from '../../page';

interface VendorPropertiesProps {
  serviceAddress: VendorServiceAddress | null;
  properties: PropertyDetails[] | null;
}

export function VendorProperties({ serviceAddress, properties }: VendorPropertiesProps) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold mb-4">Service Addresses</h2>
        {serviceAddress?.type === 'all' ? (
          <div className="rounded-lg border p-4 flex items-center gap-3 bg-primary/5 border-primary/20">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">All Properties</h3>
              <p className="text-sm text-muted-foreground">Vendor has access to all properties</p>
            </div>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="space-y-2">
            {properties.map((property) => (
              <div 
                key={property.id}
                className="rounded-lg border p-3 flex items-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => router.push(`/property/${property.id}`)}
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{property.name}</h3>
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