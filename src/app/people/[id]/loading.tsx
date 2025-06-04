import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Mimics the top section of PersonDetailsClient (bg-card flex-shrink-0) */}
      <div className="flex-shrink-0">
        {/* Mimics the inner div with p-6 pb-[53px] */}
        <div className="p-6 pb-[53px]">
          {/* Back to People Link Skeleton */}
          <Skeleton className="h-6 w-32 mb-12" />

          {/* Person Name and Company Skeleton */}
          <Skeleton className="h-8 w-1/2 md:w-1/3 mb-2" /> {/* Person Name */}
          <Skeleton className="h-5 w-1/3 md:w-1/4" />    {/* Company */}
        </div>

        {/* Tabs Skeleton Wrapper (mimics border-b-2 div) */}
        <div className="border-b-2 border-border">
          {/* Mimics div with px-6 flex gap-2 py-1 for TabsList */}
          <div className="px-6 flex gap-2 py-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-t-md" /> // Tab item
            ))}
          </div>
        </div>
      </div>

      {/* Mimics the main content area (p-6 space-y-8) */}
      <div className="p-6 space-y-8">
        {/* Quick Actions Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-1/3 mb-1" /> {/* "Quick Actions" title */}
            <Skeleton className="h-4 w-1/2 mb-4" /> {/* Subtitle text */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Status Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Skeleton className="h-8 w-8 mb-2 rounded-full" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-5 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact and Account Details Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="w-full">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="w-full">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 