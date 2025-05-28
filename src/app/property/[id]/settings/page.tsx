'use client';

import * as React from "react";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { 
  MessageSquare,
  Camera,
  Bell,
  BookUser,
  KeyRound,
  CircleDollarSign,
  Building,
  Info,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { GeneralInfoForm, PropertyTypeForm, PhotosForm, LateFeeForm } from "../components/settings/SettingsForms";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface FormElement extends HTMLDivElement {
  __showAddOwnerDialog?: (show: boolean) => void;
  __showUploadDialog?: (show: boolean) => void;
}

const settings = [
  {
    id: 'general-info',
    icon: <Info className="w-5 h-5 text-green-600" />,
    label: "General Information",
    description: "Update the general information for this property.",
    component: GeneralInfoForm
  },
  {
    id: 'photos',
    icon: <Camera className="w-5 h-5 text-green-600" />,
    label: "Photos",
    description: "Update the photos for this property.",
    component: PhotosForm
  },
  {
    id: 'property-type',
    icon: <Building className="w-5 h-5 text-green-600" />,
    label: "Property Type",
    description: "Update the property type for this property.",
    component: PropertyTypeForm
  },
  {
    id: 'late-fees',
    icon: <CircleDollarSign className="w-5 h-5 text-green-600" />,
    label: "Late Fees",
    description: "Update the late fees for this property.",
    component: LateFeeForm
  },
  {
    id: 'tenant-portal',
    icon: <KeyRound className="w-5 h-5 text-green-600" />,
    label: "Tenant Portal",
    description: "Update the tenant portal for this property.",
    component: () => (
      <div className="text-muted-foreground">
        Form content for Tenant Portal will go here...
      </div>
    )
  },
  {
    id: 'notifications',
    icon: <Bell className="w-5 h-5 text-green-600" />,
    label: "Notifications",
    description: "Update the rent & payment notifications.",
    component: () => (
      <div className="text-muted-foreground">
        Form content for Notifications will go here...
      </div>
    )
  },
  {
    id: 'tenant-requests',
    icon: <MessageSquare className="w-5 h-5 text-green-600" />,
    label: "Tenant Requests",
    description: "Update the tenant requests for this property.",
    component: () => (
      <div className="text-muted-foreground">
        Form content for Tenant Requests will go here...
      </div>
    )
  },
  {
    id: 'rental-applications',
    icon: <BookUser className="w-5 h-5 text-green-600" />,
    label: "Rental Applications",
    description: "Update the rental applications for this property.",
    component: () => (
      <div className="text-muted-foreground">
        Form content for Rental Applications will go here...
      </div>
    )
  }
];

export default function PropertySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'general-info';
  const [activeSection, setActiveSection] = useState(section);
  const [isClient, setIsClient] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [lateFeesEnabled, setLateFeesEnabled] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchLateFeeSettings();
  }, []);

  const fetchLateFeeSettings = async () => {
    try {
      setIsDataLoading(true);
      const response = await fetch(`/api/property/${id}/late-fees`);
      if (!response.ok) {
        throw new Error("Failed to fetch late fee settings");
      }
      const data = await response.json();
      setLateFeesEnabled(data.late_fees?.isEnabled || false);
    } catch (error) {
      console.error("Error fetching late fee settings:", error);
      toast.error("Failed to load late fee settings");
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleLateFeeToggle = async (checked: boolean) => {
    try {
      setLateFeesEnabled(checked);
      const response = await fetch(`/api/property/${id}/late-fees`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          late_fees: {
            isEnabled: checked,
            lateFees: [],
            maxDailyFeesEnabled: false,
            maxMonthlyFeesEnabled: false,
            minBalanceEnabled: false,
            applyToMostRecentEnabled: false,
            applyToSpecificEnabled: false,
            maxDailyAmount: "",
            maxMonthlyAmount: "",
            minBalanceAmount: "",
            selectedChargeTypes: "",
            useCompanyPolicy: true
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update late fee settings");
      }

      toast.success("Late fee settings updated successfully");
    } catch (error) {
      console.error("Error updating late fee settings:", error);
      toast.error("Failed to update late fee settings");
      setLateFeesEnabled(!checked); // Revert on error
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6">
      {!isClient || isDataLoading ? (
        <Card className="h-full overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar Skeleton */}
            <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-2">
              <div className="h-10 bg-muted animate-pulse rounded-lg" />
              <div className="border-b border-border mb-4" />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-5 h-5 rounded-md bg-muted animate-pulse" />
                  <div className="h-5 bg-muted animate-pulse rounded-md flex-1" />
                </div>
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 overflow-y-auto p-6">
              {[1, 2, 3].map((section) => (
                <div key={section} className="mb-12 last:mb-0">
                  <div className="flex items-start gap-4 mb-6 pt-12">
                    <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1">
                      <div className="h-8 bg-muted animate-pulse rounded-md w-1/4 mb-2" />
                      <div className="h-4 bg-muted animate-pulse rounded-md w-2/3" />
                    </div>
                  </div>
                  <div className="pl-12 space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded-md" />
                    <div className="h-32 bg-muted animate-pulse rounded-md" />
                    <div className="flex justify-end">
                      <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
                    </div>
                  </div>
                  <div className="border-t border-border mt-12" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="h-full overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-2">
              <Link
                href={`/property/${id}`}
                className="group inline-flex items-center justify-start gap-2 px-4 py-2 hover:bg-muted rounded-lg"
              >
                <ArrowLeft
                  className="-ms-1 me-2 opacity-60 transition-transform group-hover:-translate-x-0.5"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Back to Property
              </Link>
              <div className="border-b border-border mb-4" />
              {settings.map((setting) => (
                <Link
                  key={setting.id}
                  href={`/property/${id}/settings?section=${setting.id}`}
                  scroll={false}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg text-sm w-full text-left transition-colors",
                    activeSection === setting.id && isClient
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] hover:opacity-80"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(setting.id);
                    const container = document.querySelector('.overflow-y-auto');
                    if (element && container) {
                      const headerOffset = 100;
                      const elementPosition = element.offsetTop;
                      container.scrollTo({
                        top: elementPosition - headerOffset,
                        behavior: 'smooth'
                      });
                      setActiveSection(setting.id);
                      window.history.replaceState(null, '', `/property/${id}/settings?section=${setting.id}`);
                    }
                  }}
                >
                  {setting.icon}
                  {setting.label}
                </Link>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {settings.map((setting) => {
                if (!setting.component) return null;
                const Component = setting.component;

                return (
                  <div key={setting.id} id={setting.id} className="mb-12 last:mb-0">
                    <div className="flex items-start justify-between gap-4 mb-6 pt-12">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          {setting.icon}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold mb-1">{setting.label}</h2>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                          {setting.id === 'late-fees' && <Separator className="w-[calc(100%+8rem)] -mx-16 mt-4" />}
                        </div>
                      </div>
                      {setting.id === 'owners' && (
                        <Button
                          onClick={() => {
                            const ownersComponent = document.querySelector('[data-owners-form]') as FormElement;
                            if (ownersComponent?.__showAddOwnerDialog) {
                              ownersComponent.__showAddOwnerDialog(true);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Owner
                        </Button>
                      )}
                      {setting.id === 'photos' && (
                        <Button
                          onClick={() => {
                            const photosComponent = document.querySelector('[data-photos-form]') as FormElement;
                            if (photosComponent?.__showUploadDialog) {
                              photosComponent.__showUploadDialog(true);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Photos
                        </Button>
                      )}
                      {setting.id === 'late-fees' && (
                        <Switch
                          checked={lateFeesEnabled}
                          onCheckedChange={handleLateFeeToggle}
                          disabled={isDataLoading}
                        />
                      )}
                    </div>
                    <div className="pl-12">
                      <Component enabled={setting.id === 'late-fees' ? lateFeesEnabled : true} />
                    </div>
                    <div className="border-t border-border mt-12" />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 
