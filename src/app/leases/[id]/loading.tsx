import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, User, DollarSign, Building2, Wallet, FileSignature, ClipboardList, StickyNote, FolderOpen, Settings } from "lucide-react";
import Link from 'next/link';

export default function Loading() {
  return (
    <div className="h-screen flex flex-col animate-pulse">
      <Tabs defaultValue="overview" className="flex flex-col h-full">
        {/* Top section with white background */}
        <div className="bg-card flex-shrink-0">
          <div className="flex flex-col p-6 pb-6">
            <Link href="/leases" className="mb-12">
              <Button variant="ghost" className="group w-fit gap-2 opacity-50 pointer-events-none">
                <ArrowLeftIcon
                  className="-ms-1 opacity-60 transition-transform group-hover:-translate-x-0.5"
                  size={16}
                  aria-hidden="true"
                />
                Back to Leases
              </Button>
            </Link>
            <div className="space-y-1">
              <Skeleton className="h-8 w-1/2 md:w-1/3" /> {/* Lease Title */}
              <div className="text-primary space-y-1">
                <Skeleton className="h-5 w-1/3 md:w-1/4" />    {/* Property Info */}
                <Skeleton className="h-5 w-1/4 md:w-1/5" />    {/* Unit Info */}
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
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <User className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="tenant"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <User className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tenant
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <DollarSign className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger
                    value="rent"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <Building2 className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Rent
                  </TabsTrigger>
                  <TabsTrigger
                    value="deposits"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <Wallet className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Deposits
                  </TabsTrigger>
                  <TabsTrigger
                    value="signatures"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <FileSignature className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Signatures
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <ClipboardList className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Tasks
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <StickyNote className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
                  >
                    <FolderOpen className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} />
                    Files
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent opacity-50 pointer-events-none"
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
          <div className="p-6 space-y-6">
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

        {/* Quick Stats Skeleton (5 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" /> {/* Label */}
                  <Skeleton className="h-5 w-16" />      {/* Value */}
                </div>
                <Skeleton className="h-6 w-6 rounded-sm" /> {/* Icon */}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Stats Skeleton (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* First Column - Outstanding Balance and Lease Details */}
          <div className="space-y-4">
            {/* Outstanding Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </CardHeader>
              <hr className="border-border" />
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <Skeleton className="h-9 w-16 mb-1" /> {/* Amount */}
                  <Skeleton className="h-4 w-20" />      {/* Label */}
                </div>
              </CardContent>
            </Card>

            {/* Lease Details Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </CardHeader>
              <hr className="border-border" />
              <CardContent className="p-6">
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Column - Linked Units and Number of Tenants */}
          <div className="space-y-4">
            {/* Linked Units Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardHeader>
              <hr className="border-border" />
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <Skeleton className="h-9 w-8 mb-1" />  {/* Number */}
                  <Skeleton className="h-4 w-12" />      {/* Label */}
                </div>
              </CardContent>
            </Card>

            {/* Number of Tenants Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </CardHeader>
              <hr className="border-border" />
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center text-center h-[76px]">
                  <Skeleton className="h-9 w-8 mb-1" />  {/* Number */}
                  <Skeleton className="h-4 w-16" />      {/* Label */}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Column - Insurance Policy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <hr className="border-border" />
            <CardContent className="p-6">
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
} 