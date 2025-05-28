import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building } from "lucide-react";

import type { UnitDetails } from '../../page';

interface PersonInterestsProps {
  unitDetails: UnitDetails | null;
}

export function PersonInterests({ unitDetails }: PersonInterestsProps) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold mb-4">Interests</h2>
        {unitDetails ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div 
              className="rounded-lg border overflow-hidden flex flex-col cursor-pointer hover:border-primary hover:bg-accent transition-all"
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
                    <Building className="h-8 w-8 text-gray-400" />
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
            <p className="text-gray-500">No unit interests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 