import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleCheck, CircleX, User, Plus } from "lucide-react";

function LeaseTableSkeleton() {
  return (
    <>
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent border-0">
            <TableHead className="font-semibold text-foreground">Tenant</TableHead>
            <TableHead className="font-semibold text-foreground">Related To</TableHead>
            <TableHead className="font-semibold text-foreground">Start Date</TableHead>
            <TableHead className="font-semibold text-foreground">End Date</TableHead>
            <TableHead className="font-semibold text-foreground">Rent</TableHead>
            <TableHead className="font-semibold text-foreground">Deposit Balance</TableHead>
            <TableHead className="font-semibold text-foreground"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 7 }).map((_, index) => (
            <TableRow key={index} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                    <div className="flex items-center justify-center w-8 h-8">
                      <User className="size-5 text-[#16B364]" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="h-4 bg-muted animate-pulse rounded w-32 mb-1"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-16"></div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted animate-pulse rounded w-40"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-muted animate-pulse rounded w-4"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <div className="h-8 bg-muted animate-pulse rounded w-32"></div>
      </div>
    </>
  );
}

export default function Loading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold tracking-tight mb-6">Leases</h1>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-[300px]">
              <Input
                placeholder="Search leases..."
                className="w-full"
                disabled
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Lease
            </Button>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="active" className="flex items-center">
                <CircleCheck className="mr-2 h-4 w-4" />
                Active
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center">
                <CircleX className="mr-2 h-4 w-4" />
                Inactive
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <LeaseTableSkeleton />
            </TabsContent>
            <TabsContent value="inactive">
              <LeaseTableSkeleton />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
} 