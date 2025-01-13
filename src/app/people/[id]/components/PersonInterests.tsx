import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

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

interface PersonInterestsProps {
  unitDetails: UnitDetails | null;
  isLoading?: boolean;
}

export function PersonInterests({ unitDetails, isLoading = false }: PersonInterestsProps) {
  const router = useRouter();

  if (isLoading || (!unitDetails && unitDetails !== null)) {
    return (
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
    );
  }

  return (
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
  );
} 