'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskTableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="flex items-center gap-2 font-semibold text-foreground">
              <Skeleton className="h-5 w-16" />
            </TableHead>
            <TableHead className="font-semibold text-foreground"><Skeleton className="h-5 w-12" /></TableHead>
            <TableHead className="font-semibold text-foreground"><Skeleton className="h-5 w-24" /></TableHead>
            {/* Assuming worst case (work_order tab) for skeleton columns */}
            <TableHead className="font-semibold text-foreground"><Skeleton className="h-5 w-24" /></TableHead>
            <TableHead className="font-semibold text-foreground"><Skeleton className="h-5 w-20" /></TableHead>
            <TableHead className="font-semibold text-foreground"><Skeleton className="h-5 w-32" /></TableHead>
            <TableHead className="font-semibold text-foreground"><Skeleton className="h-5 w-20" /></TableHead>
            <TableHead className="font-semibold text-foreground"><Skeleton className="h-5 w-5" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              {/* Assuming worst case (work_order tab) for skeleton columns */}
              <TableCell><Skeleton className="h-5 w-28" /></TableCell> 
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-5 w-5" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Optional: Add skeleton for pagination if needed */}
      {/* <div className="flex justify-end mt-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div> */}
    </div>
  );
} 