'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, ClipboardList, StickyNote, FolderOpen, Settings, Building2, FileSignature, DollarSign, Wallet, ArrowLeftIcon } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';
import { OverviewContent } from './lease-overview-content';
import { TenantContent } from './lease-tenant-content';
import TransactionContent from './lease-transaction-content';
import { LeaseRentContent } from './lease-rent-content';
import DepositsContent from './lease-deposits-content';
import SignaturesContent from './lease-signatures-content';
import LeaseTaskContent from './lease-task-content';
import { LeaseNotes, ProcessedNote } from './lease-notes';
import { LeaseFiles } from './lease-files';

// Local type definitions
interface Property {
  id: string;
  name: string;
}

interface Unit {
  unit_id: string;
  unit_name: string;
}

interface TenantInfo {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface AllTenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  unit?: {
    unit_number: string;
    property_name: string;
  };
}

interface Person {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  unit_id: string | null;
  units?: {
    unit_name: string;
    properties: {
      name: string;
    };
  } | null;
  company: string | null;
}

interface Transaction {
  id: string;
  transaction_type: string;
  property: string;
  start_date: string;
  memo: {
    type: string;
    content: string;
    root?: {
      type: string;
      format: string;
      indent: number;
      version: number;
      children: Array<{
        type: string;
        format: string;
        indent: number;
        version: number;
        children: never[];
        direction: string | null;
        textStyle: string;
        textFormat: number;
      }>;
      direction: string | null;
    };
  } | null;
  data: {
    total_amount: number;
    payment_method?: string;
    lines?: Array<{
      category: string;
      unit: string;
      description: string;
      debit_amount: number;
      credit_amount: number;
    }>;
  };
  created_at: string;
  created_by: string;
  reference?: string;
  payee?: string;
}

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  account_balance: number;
  start_balance: number;
  accounting_start_date: string;
  owner_id?: string;
  property_balance?: Array<{
    property_id: string;
    property_name: string;
    balance: number;
    start_balance: number;
    accounting_start_date: string;
  }>;
  active_account: boolean;
  sub_accounts?: Array<{
    id: string;
    account_name: string;
    account_subtype: string;
    account_balance: number;
  }>;
}

// Types for charges data structure
interface ChargeAmount {
  lines: Array<{
    amount: number;
    line_id: string;
    category_id: string;
    description: string;
  }>;
  total_amount: number;
  accounts_receivable_id?: string;
}

interface Charge {
  id: string;
  charge_type: string;
  charge_amount: ChargeAmount;
  status: string;
  due_date: string;
  lease_id: string | null;
  people_id: string | null;
  created_at: string;
  start_date?: string;
  bill_date?: string;
  frequency?: string;
  memo?: Record<string, unknown> | null;
  reference?: string;
}

// Work Order interface (matching the one from people page)
interface WorkOrder {
  id: string;
  subject: string;
  description: string;
  task_status?: Record<string, { date: string | null; value: boolean | null }>;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignees: string | null;
  created_by: string;
  nano_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  request_type: string | null;
  task_type: string | null;
  tenant: string | null;
  property?: {
    name: string;
  } | null;
  unit?: {
    unit_name: string;
  } | null;
  assignee?: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
    };
  } | null;
  role: string;
  vendor_id: string | null;
  vendor?: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  } | null;
  active_status: string;
}

interface LeaseFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface LeaseDetails {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: string | null;
  lease_type: string | null;
  deposit_amount: string | null;
  tenant_portal_status: string | null;
  rollover_to_month_to_month: boolean | null;
  payment_frequency: string | null;
  first_rent_due_day: number | null;
  insurance: {
    start_date: string;
    expiration_date: string;
    policy_number: string;
    provider: string;
    coverage_amount: number;
  } | null;
  property: Property | null;
  unit: Unit | null;
  tenant: TenantInfo | null;
  allTenants: AllTenant[];
  // Transaction-related data
  transactions: Transaction[];
  accounts: Account[];
  properties: Property[];
  people: Person[];
  // Charges data
  charges: Charge[];
  // Deposits data
  deposits: Transaction[];
  // Work orders data
  workOrders: WorkOrder[];
  // Notes data
  notes: ProcessedNote[];
  // Files data
  files: LeaseFile[];
}

// Type adapter for component compatibility
interface ComponentTenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

// Function to adapt TenantInfo to ComponentTenant format
const adaptTenant = (tenant: TenantInfo | null): ComponentTenant | null => {
  if (!tenant) return null;
  
  return {
    id: tenant.id,
    first_name: tenant.first_name,
    last_name: tenant.last_name,
    email: tenant.email || '', // Provide empty string as fallback
    phone: tenant.phone || '', // Provide empty string as fallback
  };
};

interface LeaseDetailsClientProps {
  leaseDetails: LeaseDetails;
}

export function LeaseDetailsClient({ leaseDetails }: LeaseDetailsClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState<ProcessedNote[]>(leaseDetails.notes);

  // Adapt tenant data for components
  const adaptedTenant = adaptTenant(leaseDetails.tenant);

  // Function to add a new note to the state
  const addNoteToState = (newNote: ProcessedNote) => {
    setNotes(prevNotes => [newNote, ...prevNotes]);
  };

  return (
    <div className="h-screen flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href="/leases" className="mb-12">
            <Button variant="ghost" className="group w-fit gap-2">
            <ArrowLeftIcon
                  className="-ms-1 opacity-60 transition-transform group-hover:-translate-x-0.5"
                  size={16}
                  aria-hidden="true"
                />                Back to Leases
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">
                {leaseDetails.tenant 
                  ? `${leaseDetails.tenant.first_name} ${leaseDetails.tenant.last_name}`
                  : 'No Tenant'}
              </h1>
              <div className="text-primary">
                <p>{leaseDetails.property?.name || 'No Property'}</p>
                {leaseDetails.unit?.unit_name && (
                  <p>Unit {leaseDetails.unit.unit_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs navigation */}
          <div className="border-b-2 border-border">
            <ScrollArea>
              <TabsList className="mb-0 h-auto rounded-none bg-transparent py-1 text-foreground">
                <div className="px-6 flex gap-2">
                  <TabsTrigger
                    value="overview"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <User className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="tenant"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <User className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tenant
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <DollarSign className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger
                    value="rent"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Building2 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Rent
                  </TabsTrigger>
                  <TabsTrigger
                    value="deposits"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Wallet className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Deposits
                  </TabsTrigger>
                  <TabsTrigger
                    value="signatures"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FileSignature className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Signatures
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <ClipboardList className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <StickyNote className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FolderOpen className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Files
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <Settings className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Settings
                  </TabsTrigger>
                </div>
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            <TabsContent value="overview" className="m-0">
              <OverviewContent 
                leaseDetails={{
                  tenant: adaptedTenant,
                  start_date: leaseDetails.start_date,
                  end_date: leaseDetails.end_date,
                  rent_amount: leaseDetails.rent_amount,
                  lease_type: leaseDetails.lease_type,
                  deposit_amount: leaseDetails.deposit_amount,
                  tenant_portal_status: leaseDetails.tenant_portal_status,
                  rollover_to_month_to_month: leaseDetails.rollover_to_month_to_month,
                  payment_frequency: leaseDetails.payment_frequency,
                  first_rent_due_day: leaseDetails.first_rent_due_day,
                  insurance: leaseDetails.insurance,
                  unit_id: leaseDetails.unit?.unit_id,
                  property: leaseDetails.property,
                  unit: leaseDetails.unit,
                }}
              />
            </TabsContent>
            <TabsContent value="tenant" className="m-0">
              <TenantContent 
                tenant={adaptedTenant} 
                start_date={leaseDetails.start_date}
                allTenants={leaseDetails.allTenants}
              />
            </TabsContent>
            <TabsContent value="transactions" className="m-0">
              <TransactionContent 
                leaseId={leaseDetails.id}
                initialTransactions={leaseDetails.transactions}
                initialAccounts={leaseDetails.accounts}
                initialProperties={leaseDetails.properties}
                initialPeople={leaseDetails.people}
              />    
            </TabsContent>
            <TabsContent value="rent" className="m-0">
              <LeaseRentContent 
                leaseDetails={{
                  id: leaseDetails.id,
                  rent_amount: leaseDetails.rent_amount,
                  payment_frequency: leaseDetails.payment_frequency,
                  first_rent_due_day: leaseDetails.first_rent_due_day,
                  start_date: leaseDetails.start_date,
                  end_date: leaseDetails.end_date,
                }}
                charges={leaseDetails.charges}
                accounts={leaseDetails.accounts}
                people={leaseDetails.people}
              />
            </TabsContent>
            <TabsContent value="deposits" className="m-0">
              <DepositsContent 
                leaseId={leaseDetails.id}
                initialDeposits={leaseDetails.deposits}
                initialAccounts={leaseDetails.accounts}
                initialProperties={leaseDetails.properties}
              />
            </TabsContent>
            <TabsContent value="signatures" className="m-0">
              <SignaturesContent 
                leaseId={leaseDetails.id}
                initialSignatures={[]}
                initialProperties={leaseDetails.properties}
                initialPeople={leaseDetails.people}
              />
            </TabsContent>
            <TabsContent value="tasks" className="m-0">
              <LeaseTaskContent 
                initialTasks={leaseDetails.workOrders}
              />
            </TabsContent>
            <TabsContent value="notes" className="m-0">
              <LeaseNotes 
                leaseId={leaseDetails.id}
                notes={notes}
                addNoteToState={addNoteToState}
              />
            </TabsContent>
            <TabsContent value="files" className="m-0">
              <LeaseFiles 
                leaseId={leaseDetails.id}
                initialFiles={leaseDetails.files}
              />
            </TabsContent>
            <TabsContent value="settings" className="m-0">
              <div>Settings content coming soon</div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
} 