'use client';

import * as React from "react";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Users,
  MessageSquare,
  DollarSign,
  Bell,
  ClipboardList,
  CircleDollarSign,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { LateFeeContent } from "../../../components/settingscomponents/LateFee";
import { ManagementFeeContent } from "../../../components/settingscomponents/ManagementFees";

interface LateFee {
  type: string;
  amount: number;
  frequency: string;
  gracePeriod?: number;
  revenueAccount: string;
  description?: string;
}

interface ManagementFee {
  type: string;
  amount: number;
  frequency?: string;
  expenseCategory?: string;
  revenueAccount?: string;
  description?: string;
}

interface MinimumFee {
  enabled: boolean;
  amount: number;
  expenseCategory?: string;
}

interface PayoutCategory {
  id: string;
  account_name: string;
}

interface LateFeeSettings {
  lateFees: LateFee[];
  maxDailyFeesEnabled: boolean;
  maxMonthlyFeesEnabled: boolean;
  minBalanceEnabled: boolean;
  applyToMostRecentEnabled: boolean;
  applyToSpecificEnabled: boolean;
  maxDailyAmount: string;
  maxMonthlyAmount: string;
  minBalanceAmount: string;
  selectedChargeTypes: string;
}

const settings = [
  {
    icon: <Users className="w-5 h-5 text-green-600" />,
    label: "Tenant Portal",
    description: "Configure tenant portal access and features",
  },
  {
    icon: <Users className="w-5 h-5 text-green-600" />,
    label: "Owner Portal",
    description: "Manage owner portal settings and access",
  },
  {
    icon: <Bell className="w-5 h-5 text-green-600" />,
    label: "Rent & Payment Notifications",
    description: "Set up automated rent reminders and notifications",
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-green-600" />,
    label: "Payment Instructions",
    description: "Configure payment methods and instructions",
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-green-600" />,
    label: "Tenant Requests",
    description: "Customize tenant maintenance request settings",
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-green-600" />,
    label: "Owner Requests",
    description: "Set up owner communication preferences",
  },
  {
    icon: <CircleDollarSign className="w-5 h-5 text-green-600" />,
    label: "Late Fees",
    description: "Configure late fee policies and calculations",
  },
  {
    icon: <DollarSign className="w-5 h-5 text-green-600" />,
    label: "Management Fees",
    description: "Set up property management fee structures",
  },
  {
    icon: <DollarSign className="w-5 h-5 text-green-600" />,
    label: "Payment Allocation",
    description: "Configure payment distribution rules",
  },
];

export default function PropertySettingsPage() {
  const [activeSection, setActiveSection] = useState("Tenant Portal");
  const [isClient, setIsClient] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMgmtFeesEnabled, setIsMgmtFeesEnabled] = useState(false);
  const [lateFees, setLateFees] = useState<LateFee[]>([]);
  const [managementFees, setManagementFees] = useState<ManagementFee[]>([]);
  const [minimumFee, setMinimumFee] = useState<MinimumFee>({ enabled: false, amount: 0 });
  const [payoutCategories, setPayoutCategories] = useState<PayoutCategory[]>([]);
  const [maxDailyFeesEnabled, setMaxDailyFeesEnabled] = useState(false);
  const [maxMonthlyFeesEnabled, setMaxMonthlyFeesEnabled] = useState(false);
  const [minBalanceEnabled, setMinBalanceEnabled] = useState(false);
  const [applyToMostRecentEnabled, setApplyToMostRecentEnabled] = useState(false);
  const [applyToSpecificEnabled, setApplyToSpecificEnabled] = useState(false);
  const [maxDailyAmount, setMaxDailyAmount] = useState("");
  const [maxMonthlyAmount, setMaxMonthlyAmount] = useState("");
  const [minBalanceAmount, setMinBalanceAmount] = useState("");
  const [selectedChargeTypes, setSelectedChargeTypes] = useState("");

  useEffect(() => {
    setIsClient(true);
    // Fetch initial enabled state and settings
    const fetchSettings = async () => {
      try {
        // Fetch late fee settings
        const lateFeesResponse = await fetch('/api/company/settings/late-fees');
        if (!lateFeesResponse.ok) throw new Error('Failed to fetch late fee settings');
        const lateFeesData = await lateFeesResponse.json();
        
        // Update late fee state values with fetched data
        setIsEnabled(lateFeesData.isEnabled || false);
        setLateFees(lateFeesData.lateFees || []);
        setMaxDailyFeesEnabled(lateFeesData.maxDailyFeesEnabled || false);
        setMaxMonthlyFeesEnabled(lateFeesData.maxMonthlyFeesEnabled || false);
        setMinBalanceEnabled(lateFeesData.minBalanceEnabled || false);
        setApplyToMostRecentEnabled(lateFeesData.applyToMostRecentEnabled || false);
        setApplyToSpecificEnabled(lateFeesData.applyToSpecificEnabled || false);
        setMaxDailyAmount(lateFeesData.maxDailyAmount || "");
        setMaxMonthlyAmount(lateFeesData.maxMonthlyAmount || "");
        setMinBalanceAmount(lateFeesData.minBalanceAmount || "");
        setSelectedChargeTypes(lateFeesData.selectedChargeTypes || "");

        // Fetch management fee settings
        const mgmtFeesResponse = await fetch('/api/company/settings/management-fees');
        if (!mgmtFeesResponse.ok) throw new Error('Failed to fetch management fee settings');
        const mgmtFeesData = await mgmtFeesResponse.json();
        
        // Update management fee state values with fetched data
        setIsMgmtFeesEnabled(mgmtFeesData.isEnabled || false);
        setManagementFees(mgmtFeesData.managementFees || []);
        setMinimumFee(mgmtFeesData.minimumFee || { enabled: false, amount: 0 });
        setPayoutCategories(mgmtFeesData.payoutCategories || []);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to fetch settings');
      }
    };
    fetchSettings();
  }, []);

  const handleToggleEnabled = async (enabled: boolean) => {
    setIsEnabled(enabled);
    try {
      const response = await fetch('/api/company/settings/late-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled: enabled,
          lateFees,
          maxDailyFeesEnabled,
          maxMonthlyFeesEnabled,
          minBalanceEnabled,
          applyToMostRecentEnabled,
          applyToSpecificEnabled,
          maxDailyAmount,
          maxMonthlyAmount,
          minBalanceAmount,
          selectedChargeTypes
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      toast.success('Late fee settings updated successfully');
    } catch (error) {
      console.error('Error updating late fee settings:', error);
      toast.error('Failed to update late fee settings');
      setIsEnabled(!enabled); // Revert on error
    }
  };

  const handleLateFeeSettingsChange = async (newSettings: Partial<LateFeeSettings>) => {
    try {
      // Update local state with new settings
      Object.entries(newSettings).forEach(([key, value]) => {
        switch(key) {
          case 'lateFees':
            setLateFees(value as LateFee[]);
            break;
          case 'maxDailyFeesEnabled':
            setMaxDailyFeesEnabled(value as boolean);
            break;
          case 'maxMonthlyFeesEnabled':
            setMaxMonthlyFeesEnabled(value as boolean);
            break;
          case 'minBalanceEnabled':
            setMinBalanceEnabled(value as boolean);
            break;
          case 'applyToMostRecentEnabled':
            setApplyToMostRecentEnabled(value as boolean);
            break;
          case 'applyToSpecificEnabled':
            setApplyToSpecificEnabled(value as boolean);
            break;
          case 'maxDailyAmount':
            setMaxDailyAmount(value as string);
            break;
          case 'maxMonthlyAmount':
            setMaxMonthlyAmount(value as string);
            break;
          case 'minBalanceAmount':
            setMinBalanceAmount(value as string);
            break;
          case 'selectedChargeTypes':
            setSelectedChargeTypes(value as string);
            break;
        }
      });

      // Save to backend
      const response = await fetch('/api/company/settings/late-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled,
          ...newSettings
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      toast.success('Late fee settings updated successfully');
    } catch (error) {
      console.error('Error updating late fee settings:', error);
      toast.error('Failed to update late fee settings');
    }
  };

  const handleToggleMgmtFeesEnabled = async (enabled: boolean) => {
    setIsMgmtFeesEnabled(enabled);
    try {
      const response = await fetch('/api/company/settings/management-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled: enabled,
          managementFees,
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      toast.success('Management fee settings updated successfully');
    } catch (error) {
      console.error('Error updating management fee settings:', error);
      toast.error('Failed to update management fee settings');
      setIsMgmtFeesEnabled(!enabled); // Revert on error
    }
  };

  const handleManagementFeeSettingsChange = async (newSettings: Partial<{
    managementFees: ManagementFee[];
    minimumFee?: MinimumFee;
    payoutCategories?: PayoutCategory[];
  }>) => {
    try {
      // Update local state with new settings
      if (newSettings.managementFees) {
        setManagementFees(newSettings.managementFees);
      }
      if (newSettings.minimumFee) {
        setMinimumFee(newSettings.minimumFee);
      }
      if (newSettings.payoutCategories) {
        setPayoutCategories(newSettings.payoutCategories);
      }

      // Save to backend
      const response = await fetch('/api/company/settings/management-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled: isMgmtFeesEnabled,
          ...newSettings
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      toast.success('Management fee settings updated successfully');
    } catch (error) {
      console.error('Error updating management fee settings:', error);
      toast.error('Failed to update management fee settings');
    }
  };

  const scrollToSection = (label: string) => {
    setActiveSection(label);
    const element = document.getElementById(`section-${label}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6">
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-2">
            <Link
              href="/settings"
              className="group inline-flex items-center justify-start gap-2 px-4 py-2 hover:bg-muted rounded-lg"
            >
              <ArrowLeft
                className="-ms-1 me-2 opacity-60 transition-transform group-hover:-translate-x-0.5"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Back to Settings
            </Link>
            <div className="border-b border-border mb-4" />
            {settings.map((setting) => (
              <button
                key={setting.label}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg text-sm w-full text-left transition-colors",
                  activeSection === setting.label && isClient
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] hover:opacity-80"
                )}
                onClick={() => scrollToSection(setting.label)}
              >
                {setting.icon}
                {setting.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-12">
              {settings.map((setting) => (
                <div id={`section-${setting.label}`} key={setting.label} className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {setting.icon}
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold">{setting.label}</h2>
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        </div>
                      </div>
                      {setting.label === "Late Fees" && (
                        <Switch 
                          checked={isEnabled}
                          onCheckedChange={handleToggleEnabled}
                        />
                      )}
                      {setting.label === "Management Fees" && (
                        <Switch 
                          checked={isMgmtFeesEnabled}
                          onCheckedChange={handleToggleMgmtFeesEnabled}
                        />
                      )}
                    </div>
                    {(setting.label === "Late Fees" || setting.label === "Management Fees") && <Separator className="mt-6" />}
                  </div>

                  {setting.label === "Late Fees" ? (
                    <div className={cn(!isEnabled && "opacity-50 pointer-events-none")}>
                      <LateFeeContent 
                        isEnabled={isEnabled}
                        lateFees={lateFees}
                        maxDailyFeesEnabled={maxDailyFeesEnabled}
                        maxMonthlyFeesEnabled={maxMonthlyFeesEnabled}
                        minBalanceEnabled={minBalanceEnabled}
                        applyToMostRecentEnabled={applyToMostRecentEnabled}
                        applyToSpecificEnabled={applyToSpecificEnabled}
                        maxDailyAmount={maxDailyAmount}
                        maxMonthlyAmount={maxMonthlyAmount}
                        minBalanceAmount={minBalanceAmount}
                        selectedChargeTypes={selectedChargeTypes}
                        onSettingsChange={handleLateFeeSettingsChange}
                      />
                    </div>
                  ) : setting.label === "Management Fees" ? (
                    <div className={cn(!isMgmtFeesEnabled && "opacity-50 pointer-events-none")}>
                      <ManagementFeeContent 
                        isEnabled={isMgmtFeesEnabled}
                        managementFees={managementFees}
                        minimumFee={minimumFee}
                        payoutCategories={payoutCategories}
                        onSettingsChange={handleManagementFeeSettingsChange}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Form content for {setting.label} will go here...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}