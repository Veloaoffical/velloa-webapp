'use client';

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

interface RentIncrease {
  type: string;
  amount: number;
  date: string;
}

interface LateFeeCustom {
  amount: number;
  type: string;
  grace_period_days: number;
}

interface AdditionalCharge {
  amount: number;
  description: string;
  due_date?: string;
}

type Lease = {
  id: string;
  created_at: string;
  updated_at: string | null;
  property_id: string | null;
  unit_id: string | null;
  lease_term: string | null;
  start_date: string | null;
  end_date: string | null;
  rollover: boolean | null;
  tenant_id: string[] | null; // Array of tenant IDs
  tenant_portal: boolean | null;
  renter_insurance: boolean | null;
  rent_due: string | null;
  frequency: string | null;
  rent_amount: string | null;
  rent_advanced: boolean | null;
  rent_advanced_amount: AdditionalCharge[] | null;
  schedule_rent_increase: boolean | null;
  schedule_rent_increase_amount: RentIncrease | null;
  deposit: boolean | null;
  deposit_amount: string | null;
  deposit_advance: boolean | null;
  deposit_advance_amount: AdditionalCharge[] | null;
  late_fees: boolean | null;
  late_fees_type: string | null;
  late_fees_custom: LateFeeCustom | null;
  company_id: string | null;
  created_by: string | null;
  // Join fields
  property?: {
    name: string;
    address: string;
  };
  unit?: {
    unit_number: string;
  };
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export const columns: ColumnDef<Lease>[] = [
  {
    accessorKey: "property.name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.property?.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "property.address",
    header: "Address",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="text-sm">{row.original.property?.address}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
    cell: ({ row }) => row.original.start_date ? format(new Date(row.original.start_date), "MMM d, yyyy") : "N/A",
  },
  {
    accessorKey: "end_date",
    header: "End Date",
    cell: ({ row }) => row.original.end_date ? format(new Date(row.original.end_date), "MMM d, yyyy") : "N/A",
  },
  {
    accessorKey: "rent_amount",
    header: "Rent",
    cell: ({ row }) => row.original.rent_amount ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(row.original.rent_amount)) : "N/A",
  },
  {
    accessorKey: "deposit_amount",
    header: "Deposit Balance",
    cell: ({ row }) => row.original.deposit_amount ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(row.original.deposit_amount)) : "N/A",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Link href={`/leases/${row.original.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
]; 