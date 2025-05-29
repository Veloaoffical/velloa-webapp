'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, ClipboardList, StickyNote, FolderOpen, Settings, Building2, FileSignature, DollarSign, Wallet } from "lucide-react";
import Link from 'next/link';
import { useState } from 'react';
import { OverviewContent } from './components/OverviewContent';
import { TenantContent } from './components/TenantContent';
import { Property, Unit, TenantInfo as Tenant } from '../types';
import TransactionContent from './components/transaction-content';

interface LeaseDetails {
  id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  rent_amount: string | null;
  lease_type: string | null;
  deposit_amount: string | null;
  property: Property | null;
  unit: Unit | null;
  tenant: Tenant | null;
}

// Type adapter for component compatibility
interface ComponentTenant {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

// Function to adapt TenantInfo to ComponentTenant format
const adaptTenant = (tenant: Tenant | null): ComponentTenant | null => {
  if (!tenant) return null;
  
  return {
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

  // Adapt tenant data for components
  const adaptedTenant = adaptTenant(leaseDetails.tenant);

  return (
    <div className="h-screen flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href="/leases" className="mb-12">
              <Button variant="outline" size="sm" className="gap-2 w-fit">
                <ArrowLeft className="w-4 h-4" />
                Back
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
                    value="sign-requests"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent"
                  >
                    <FileSignature className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Sign Requests
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
              />
            </TabsContent>
            <TabsContent value="transactions" className="m-0">
              <TransactionContent leaseId={leaseDetails.id} />    
            </TabsContent>
            <TabsContent value="rent" className="m-0">
              <div>Rent content coming soon</div>
            </TabsContent>
            <TabsContent value="deposits" className="m-0">
              <div>Deposits content coming soon</div>
            </TabsContent>
            <TabsContent value="sign-requests" className="m-0">
              <div>Sign Requests content coming soon</div>
            </TabsContent>
            <TabsContent value="tasks" className="m-0">
              <div>Tasks content coming soon</div>
            </TabsContent>
            <TabsContent value="notes" className="m-0">
              <div>Notes content coming soon</div>
            </TabsContent>
            <TabsContent value="files" className="m-0">
              <div>Files content coming soon</div>
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