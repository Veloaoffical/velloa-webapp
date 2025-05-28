'use client';

import * as React from "react";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Users,
  DollarSign,
  ArrowLeft,
  CreditCard,
  Shield,
  FileText,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const settings = [
  {
    icon: <Users className="w-5 h-5 text-green-600" />,
    label: "Company Info",
    description: "Update your company details and business information",
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
];

export default function CompanySettingsPage() {
  const [activeSection, setActiveSection] = useState("Company Info");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Default accounts fetching is currently disabled
  }, []);

  const scrollToSection = (label: string) => {
    setActiveSection(label);
    const element = document.getElementById(`section-${label}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredSettings = settings.filter(setting =>
    setting.label !== "Default Account" &&
    setting.label !== "QuickBooks Sync" &&
    setting.label !== "Send Payments"
  );

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
            {filteredSettings.map((setting) => (
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
              {filteredSettings.map((setting) => (
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
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Form content for {setting.label} will go here...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 