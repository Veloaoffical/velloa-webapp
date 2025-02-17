import { Suspense } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, ArrowUpRight, ShieldCheck, ShieldX, User } from 'lucide-react';
import Link from 'next/link';
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from '@/utils/supabase/server';

interface Property {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip: string;
}

interface Unit {
  unit_id: string;
  unit_name: string;
}

interface TenantInfo {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  unit?: {
    unit_number: string;
    property_name: string;
  };
}

interface Lease {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: string | null;
  lease_term: string | null;
  deposit_amount: string | null;
  property: Property | null;
  unit: Unit | null;
  tenant_id: string | null;
  tenant: TenantInfo | null;
}

async function getLeases(): Promise<Lease[]> {
  const supabase = await createClient();

  try {
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    // Get the company membership
    const { data: companyMember, error: companyError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (companyError || !companyMember) {
      console.error('Company error:', companyError);
      throw new Error('Failed to get company');
    }

    console.log('Fetching leases for company:', companyMember.company_id);

    // Fetch leases with related data
    const { data: leases, error: leasesError } = await supabase
      .from('lease_contracts')
      .select(`
        id,
        created_at,
        start_date,
        end_date,
        rent_amount,
        lease_term,
        deposit_amount,
        property_id,
        unit_id,
        tenant_id
      `)
      .eq('company_id', companyMember.company_id)
      .order('created_at', { ascending: false });

    if (leasesError) {
      console.error('Error fetching leases:', {
        error: leasesError,
        message: leasesError.message,
        details: leasesError.details,
        hint: leasesError.hint,
        code: leasesError.code
      });
      throw new Error(`Failed to fetch leases: ${leasesError.message}`);
    }

    // Fetch properties and units data separately
    const propertyIds = leases?.map(lease => lease.property_id).filter(Boolean) || [];
    const unitIds = leases?.map(lease => lease.unit_id).filter(Boolean) || [];

    // Extract tenant IDs from the tenant_id objects
    const tenantIds = leases
      ?.map(lease => {
        if (lease.tenant_id) {
          // tenant_id is already an object (JSONB from database)
          return lease.tenant_id[0]?.id;
        }
        return null;
      })
      .filter(Boolean) || [];

    // Fetch properties, units, and tenants in parallel
    const [propertiesResponse, unitsResponse, tenantsResponse] = await Promise.all([
      // Fetch properties
      propertyIds.length > 0 ? supabase
        .from('properties')
        .select('id, name, address_line_1, address_line_2, city, state, zip')
        .in('id', propertyIds) : Promise.resolve({ data: [] }),

      // Fetch units
      unitIds.length > 0 ? supabase
        .from('units')
        .select('unit_id, unit_name')
        .in('unit_id', unitIds) : Promise.resolve({ data: [] }),

      // Fetch tenants directly from people table
      tenantIds.length > 0 ? supabase
        .from('people')
        .select('id, first_name, last_name, role')
        .in('id', tenantIds)
        .eq('role', 'tenant') : Promise.resolve({ data: [] })
    ]);

    // Create lookup maps for properties, units, and tenants
    const propertiesMap = new Map(propertiesResponse.data?.map(p => [p.id, p]));
    const unitsMap = new Map(unitsResponse.data?.map(u => [u.unit_id, u]));
    const tenantsMap = new Map((tenantsResponse.data || []).map(t => [t.id, {
      id: t.id,
      first_name: t.first_name,
      last_name: t.last_name,
      role: t.role
    } as TenantInfo]));

    // Combine the data
    const combinedLeases = leases?.map(lease => {
      let tenant = null;
      if (lease.tenant_id) {
        // tenant_id is already an object (JSONB from database)
        const tenantId = lease.tenant_id[0]?.id;
        if (tenantId) {
          tenant = tenantsMap.get(tenantId) || {
            id: tenantId,
            first_name: lease.tenant_id[0]?.name?.split(' ')[0] || '',
            last_name: lease.tenant_id[0]?.name?.split(' ').slice(1).join(' ') || '',
            role: 'tenant'
          };
        }
      }

      return {
        ...lease,
        property: lease.property_id ? propertiesMap.get(lease.property_id) || null : null,
        unit: lease.unit_id ? unitsMap.get(lease.unit_id) || null : null,
        tenant
      };
    }) || [];

    console.log('Successfully fetched leases:', {
      count: combinedLeases.length,
      leases: combinedLeases
    });

    return combinedLeases;
  } catch (error) {
    console.error('Unexpected error in getLeases:', error);
    throw error;
  }
}

function LeaseTable({ leases }: { leases: Lease[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Tenant</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Rent</TableHead>
          <TableHead>Deposit Balance</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leases.map((lease) => {
          const propertyText = lease.property?.name || 'Unknown Property';
          const unitText = lease.unit?.unit_name ? ` - Unit ${lease.unit.unit_name}` : '';

          return (
            <TableRow key={lease.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                    <div className="flex items-center justify-center w-8 h-8">
                      <User className="size-5 text-[#16B364]" strokeWidth={2} />
                    </div>
                  </div>
                  <span className="font-bold">
                    {lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'No Tenant'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {propertyText}{unitText}
                </span>
              </TableCell>
              <TableCell>{lease.start_date ? format(new Date(lease.start_date), "MMM d, yyyy") : 'N/A'}</TableCell>
              <TableCell>{lease.end_date ? format(new Date(lease.end_date), "MMM d, yyyy") : 'N/A'}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(parseFloat(lease.rent_amount || '0'))}
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(parseFloat(lease.deposit_amount || '0'))}
              </TableCell>
              <TableCell>
                <Link href={`/leases/${lease.id}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default async function LeasesPage() {
  const leases = await getLeases();

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
              />
            </div>
            <Link href="/people/add-lease">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Lease
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="active" className="flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Active
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center">
                <ShieldX className="mr-2 h-4 w-4" />
                Inactive
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <Suspense fallback={<div>Loading...</div>}>
                <LeaseTable leases={leases} />
              </Suspense>
            </TabsContent>
            <TabsContent value="inactive">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Deposit Balance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Will show inactive leases when we have the data */}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4">
            <Pagination className="justify-end">
              <PaginationContent className="gap-3">
                <PaginationItem>
                  <PaginationLink
                    className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    href="#/page/0"
                    aria-label="Go to previous page"
                    aria-disabled={true}
                  >
                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    Page <span className="text-foreground">1</span> of{" "}
                    <span className="text-foreground">1</span>
                  </p>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    href="#/page/2"
                    aria-label="Go to next page"
                    aria-disabled={true}
                  >
                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </Card>
    </div>
  );
}
