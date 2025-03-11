'use client';

import * as React from "react";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { 
  Printer,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CheckSettings {
  checkType: 'voucher' | 'standard';
  heightAdjustment: number;
}

export default function PrintChecksSettingsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [settings, setSettings] = useState<CheckSettings>({
    checkType: 'voucher',
    heightAdjustment: 0
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch('/api/accounting/print-checks/settings', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/login');
            return;
          }
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch settings');
        }
        
        const data = await response.json();
        if (data) {
          setSettings({
            checkType: data.checkType || 'voucher',
            heightAdjustment: data.heightAdjustment || 0
          });
        }
      } catch (error) {
        console.error('Error fetching print check settings:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch settings');
      }
    };

    fetchSettings();
  }, [supabase, router]);

  const handleSettingsChange = (newSettings: Partial<CheckSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/accounting/print-checks/settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Print check settings updated successfully');
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error updating print check settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-6">
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-2">
            <Link
              href="/accounting/print-checks"
              className="group inline-flex items-center justify-start gap-2 px-4 py-2 hover:bg-muted rounded-lg"
            >
              <ArrowLeft
                className="-ms-1 me-2 opacity-60 transition-transform group-hover:-translate-x-0.5"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Back to Print Checks
            </Link>
            <div className="border-b border-border mb-4" />
            <div
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg text-sm w-full text-left transition-colors",
                "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              )}
            >
              <Printer className="w-5 h-5 text-green-600" />
              Check Setup
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-12">
              <div id="section-Check Setup" className="space-y-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Printer className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Check Setup</h2>
                      <p className="text-sm text-muted-foreground">Configure check printing settings and layout</p>
                    </div>
                  </div>
                  <Separator className="mt-6" />
                </div>

                <div className="space-y-8">
                  {/* Warning Message */}
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    We recommend printing a test using a regular sheet of white paper to see if the text lines up so you don&apos;t waste any real checks.
                  </div>

                  {/* Check Type Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Select a Check</h3>
                    <p className="text-sm text-muted-foreground">Which check are you using?</p>
                    <RadioGroup
                      value={settings.checkType}
                      onValueChange={(value: 'voucher' | 'standard') => 
                        handleSettingsChange({ checkType: value })
                      }
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="voucher"
                          id="voucher"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="voucher"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Printer className="mb-3 h-6 w-6" />
                          Voucher (1 Per Page)
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="standard"
                          id="standard"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="standard"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Printer className="mb-3 h-6 w-6" />
                          Standard (3 Per Page)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Adjustment Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Adjustment Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      You can only make adjustments for the height. Enter a number usually from 1-100. The higher the number, the more the check will move down the page
                    </p>
                    <div className="max-w-xs">
                      <Label htmlFor="heightAdjustment">Height Adjustment</Label>
                      <Input
                        id="heightAdjustment"
                        type="number"
                        min={0}
                        max={100}
                        value={settings.heightAdjustment}
                        onChange={(e) => 
                          handleSettingsChange({ 
                            heightAdjustment: parseInt(e.target.value) || 0 
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Print Test Instructions */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Printer className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Print a New Test</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Put the test page you just printed on top of a real check. Hold it up to the light to see if it lines up. If adjustments are needed, click the &quot;Make Adjustments&quot; page on the left.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={!hasChanges}
                  className="bg-rose-500 hover:bg-rose-600 text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 