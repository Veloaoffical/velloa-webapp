'use client';

import * as React from "react";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Users,
  DollarSign,
  ArrowLeft,
  Globe,
  CreditCard,
  Shield,
  FileText,
  Building2,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DefaultAccountsForm } from "./components/DefaultAccountsForm";

interface QuickBooksSettings {
  isConnected: boolean;
  autoSync: boolean;
  syncFrequency: string;
  lastSyncDate?: string;
  accountMappings: {
    [key: string]: string;
  };
}

interface DefaultAccountsData {
  operatingBankAccount: string;
  trustBankAccount: string;
  clearingAccount: string;
  rentalIncome: string;
  applicationFee: string;
  lateFees: string;
  convenienceFeeIncome: string;
  securityDeposit: string;
  managementFees: string;
  ownerContribution: string;
  ownerDistribution: string;
}

const settings = [
  {
    icon: <Users className="w-5 h-5 text-green-600" />,
    label: "Company Info",
    description: "Update your company details and business information",
  },
  {
    icon: <Globe className="w-5 h-5 text-green-600" />,
    label: "Region & Currency",
    description: "Set your location preferences and currency format",
  },
  {
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    label: "Default Account",
    description: "Configure your primary account settings",
  },
  {
    icon: <Users className="w-5 h-5 text-green-600" />,
    label: "Users",
    description: "Manage user accounts and permissions",
  },
  {
    icon: <Shield className="w-5 h-5 text-green-600" />,
    label: "User Roles",
    description: "Define and customize user role permissions",
  },
  {
    icon: <CreditCard className="w-5 h-5 text-green-600" />,
    label: "Subscription",
    description: "View and manage your subscription plan",
  },
  {
    icon: <FileText className="w-5 h-5 text-green-600" />,
    label: "QuickBooks Sync",
    description: "Configure QuickBooks integration settings",
  },
  {
    icon: <Building2 className="w-5 h-5 text-green-600" />,
    label: "Listings",
    description: "Customize your property listing preferences",
  },
  {
    icon: <DollarSign className="w-5 h-5 text-green-600" />,
    label: "Send Payments",
    description: "Set up payment methods and preferences",
  },
  {
    icon: <Calendar className="w-5 h-5 text-green-600" />,
    label: "Company Start Date",
    description: "Set your company's fiscal year and important dates",
  },
];

export default function CompanySettingsPage() {
  const [activeSection, setActiveSection] = useState("Company Info");
  const [isClient, setIsClient] = useState(false);
  const [qbEnabled, setQbEnabled] = useState(false);
  const [qbSettings, setQbSettings] = useState<QuickBooksSettings>({
    isConnected: false,
    autoSync: false,
    syncFrequency: 'daily',
    accountMappings: {}
  });
  const [defaultAccounts, setDefaultAccounts] = useState<DefaultAccountsData | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
    // Fetch initial QuickBooks settings
    const fetchSettings = async () => {
      try {
        const [qbResponse, defaultAccountsResponse] = await Promise.all([
          fetch('/api/company/settings/quickbooks'),
          fetch('/api/company/settings/default-accounts')
        ]);

        if (!qbResponse.ok) throw new Error('Failed to fetch QuickBooks settings');
        if (!defaultAccountsResponse.ok) throw new Error('Failed to fetch default accounts settings');

        const qbData = await qbResponse.json();
        const defaultAccountsData = await defaultAccountsResponse.json();
        
        setQbEnabled(qbData.isEnabled || false);
        setQbSettings(qbData.settings || {
          isConnected: false,
          autoSync: false,
          syncFrequency: 'daily',
          accountMappings: {}
        });
        setDefaultAccounts(defaultAccountsData);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to fetch settings');
      }
    };
    fetchSettings();
  }, []);

  const handleToggleEnabled = async (enabled: boolean) => {
    setQbEnabled(enabled);
    try {
      const response = await fetch('/api/company/settings/quickbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled: enabled,
          settings: qbSettings
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      toast.success('QuickBooks settings updated successfully');
    } catch (error) {
      console.error('Error updating QuickBooks settings:', error);
      toast.error('Failed to update QuickBooks settings');
      setQbEnabled(!enabled); // Revert on error
    }
  };

  const handleQuickBooksSettingsChange = async (newSettings: Partial<QuickBooksSettings>) => {
    try {
      const updatedSettings = { ...qbSettings, ...newSettings };
      setQbSettings(updatedSettings);

      const response = await fetch('/api/company/settings/quickbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isEnabled: qbEnabled,
          settings: updatedSettings
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      toast.success('QuickBooks settings updated successfully');
    } catch (error) {
      console.error('Error updating QuickBooks settings:', error);
      toast.error('Failed to update QuickBooks settings');
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
                      {setting.label === "QuickBooks Sync" && (
                        <Switch 
                          checked={qbEnabled}
                          onCheckedChange={handleToggleEnabled}
                        />
                      )}
                    </div>
                    {setting.label === "QuickBooks Sync" && <Separator className="mt-6" />}
                  </div>

                  {setting.label === "QuickBooks Sync" ? (
                    <div className={cn(!qbEnabled && "opacity-50 pointer-events-none")}>
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Connection Status</h3>
                          {qbSettings.isConnected ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span>Connected to QuickBooks</span>
                            </div>
                          ) : (
                            <Button onClick={() => handleQuickBooksSettingsChange({ isConnected: true })}>
                              Connect to QuickBooks
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Sync Settings</h3>
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={qbSettings.autoSync}
                              onCheckedChange={(checked) => handleQuickBooksSettingsChange({ autoSync: checked })}
                            />
                            <span>Enable automatic synchronization</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <Select
                              value={qbSettings.syncFrequency}
                              onValueChange={(value) => handleQuickBooksSettingsChange({ syncFrequency: value })}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                              </SelectContent>
                            </Select>
                            <span>Sync frequency</span>
                          </div>
                        </div>

                        {qbSettings.lastSyncDate && (
                          <div className="text-sm text-muted-foreground">
                            Last synced: {new Date(qbSettings.lastSyncDate).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : setting.label === "Default Account" ? (
                    <div>
                      <DefaultAccountsForm 
                        initialData={defaultAccounts}
                        onSave={async (data) => {
                          const response = await fetch('/api/company/settings/default-accounts', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data)
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to save default accounts');
                          }
                          setDefaultAccounts(data);
                        }}
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