'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from 'next/image';

interface PersonDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  company_id: string;
  property_id: string;
  unit_id: string | null;
  role: string;
  unit?: {
    unit_number: string;
    property_name?: string;
  } | null;
  status: string | null;
  assignee_id: string | null;
  lead_source: string | null;
  payments_settings?: {
    enabled: boolean;
    method?: 'email' | 'mail_check';
    billing_email?: string;
  };
  address_info?: {
    primary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
    secondary?: {
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    } | null;
  };
}

interface PaymentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personDetails: PersonDetails;
}

export function PaymentSettingsDialog({ open, onOpenChange, personDetails }: PaymentSettingsDialogProps) {
  const [paymentSettings, setPaymentSettings] = React.useState({
    enabled: personDetails.payments_settings?.enabled || false,
    method: personDetails.payments_settings?.method,
    billingEmail: personDetails.payments_settings?.billing_email || ''
  });
  const [billingEmailError, setBillingEmailError] = React.useState('');

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/people/${personDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payments_settings: {
            enabled: paymentSettings.enabled,
            method: paymentSettings.enabled ? paymentSettings.method : undefined,
            billing_email: paymentSettings.enabled && paymentSettings.method === 'email' ? paymentSettings.billingEmail : undefined
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payment settings');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating payment settings:', error);
      // TODO: Show error toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 sticky top-0 z-50 bg-background border-b">
          <DialogTitle>Payment Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 overflow-y-auto flex-1 p-6">
          <RadioGroup 
            className="gap-4 w-full" 
            value={paymentSettings.enabled ? 'enabled' : 'disabled'}
            onValueChange={(value) => {
              setPaymentSettings({
                ...paymentSettings,
                enabled: value === 'enabled',
                method: value === 'enabled' ? paymentSettings.method : undefined,
                billingEmail: value === 'enabled' ? paymentSettings.billingEmail : ''
              });
            }}
          >
            {/* Enable Payments */}
            <label htmlFor="enable-payments" className="flex items-start gap-2 rounded-lg border border-input p-4 hover:border-green-600 has-[[data-state=checked]]:border-green-600 cursor-pointer">
              <RadioGroupItem
                value="enabled"
                id="enable-payments"
                className="mt-1"
              />
              <div className="grid gap-1">
                <div className="text-base font-medium">Enable send payments for this {personDetails.role}</div>
                <div className="text-sm text-muted-foreground">
                  Allow sending payments to this {personDetails.role} through the system.
                </div>
              </div>
            </label>

            {/* Disable Payments */}
            <label htmlFor="disable-payments" className="flex items-start gap-2 rounded-lg border border-input p-4 hover:border-green-600 has-[[data-state=checked]]:border-green-600 cursor-pointer">
              <RadioGroupItem
                value="disabled"
                id="disable-payments"
                className="mt-1"
              />
              <div className="grid gap-1">
                <div className="text-base font-medium">Do not send payments</div>
                <div className="text-sm text-muted-foreground">
                  Payments will not be sent through the system
                </div>
              </div>
            </label>
          </RadioGroup>

          {paymentSettings.enabled && (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-medium mb-4">Payment Sending Method</h4>
                <RadioGroup 
                  className="grid grid-cols-2 gap-4" 
                  value={paymentSettings.method}
                  onValueChange={(value: 'email' | 'mail_check') => setPaymentSettings({...paymentSettings, method: value})}
                >
                  {/* Email payment method */}
                  <label htmlFor="payment-email" className="flex items-start gap-2 rounded-lg border border-input p-4 hover:border-green-600 has-[[data-state=checked]]:border-green-600 cursor-pointer">
                    <RadioGroupItem
                      value="email"
                      id="payment-email"
                      className="mt-1"
                    />
                    <div className="grid gap-1">
                      <div className="text-base font-medium">
                        Email <span className="text-xs font-normal text-green-600">(Recommended)</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        An email will be sent to the {personDetails.role}, asking them how they prefer to get paid.
                      </div>
                    </div>
                  </label>

                  {/* Mail check payment method */}
                  <label htmlFor="payment-check" className="flex items-start gap-2 rounded-lg border border-input p-4 hover:border-green-600 has-[[data-state=checked]]:border-green-600 cursor-pointer">
                    <RadioGroupItem
                      value="mail_check"
                      id="payment-check"
                      className="mt-1"
                    />
                    <div className="grid gap-1">
                      <div className="text-base font-medium">Mail Check</div>
                      <div className="text-sm text-muted-foreground">
                        A check will be printed and mailed on your behalf to the address above
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {paymentSettings.method === 'email' && (
                <>
                  <div className="bg-[#F5FBF8] rounded-lg p-6 border border-[#DAFAE8]">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-base font-medium">Email</h5>
                        <div className="text-sm text-muted-foreground mt-1">
                          An email will be sent to the {personDetails.role}, asking them how they prefer to get paid.
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          This is the preferred payment method, as it requires the user to authenticate their bank account, and gives them control if they ever need to make any changes etc.
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">They can choose between:</div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Image
                              src="/assests/Interac_logo.png"
                              alt="Interac"
                              width={30}
                              height={30}
                              className="shrink-0 mt-0.5 object-contain"
                            />
                            <div>
                              <div className="text-sm font-medium">Direct Deposit</div>
                              <div className="text-sm text-muted-foreground">Have the funds deposited directly to their bank account via Interac e-Transfer</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-medium mb-4">Email Settings</h4>
                    <div className="grid gap-2">
                      <Label htmlFor="billingEmail">Billing Email <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input
                          id="billingEmail"
                          type="email"
                          className={cn(
                            "h-[42px] ps-9",
                            { "border-red-500 focus-visible:ring-red-500": billingEmailError.length > 0 }
                          )}
                          placeholder="Enter billing email address"
                          value={paymentSettings.billingEmail}
                          onChange={(e) => {
                            const email = e.target.value;
                            setPaymentSettings({...paymentSettings, billingEmail: email});
                            
                            // Email validation
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!email) {
                              setBillingEmailError('Billing email is required');
                            } else if (!emailRegex.test(email)) {
                              setBillingEmailError('Please enter a valid email address');
                            } else {
                              setBillingEmailError('');
                            }
                          }}
                          required
                        />
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
                          <Mail size={16} strokeWidth={2} aria-hidden="true" />
                        </div>
                      </div>
                      {billingEmailError && (
                        <div className="text-sm text-red-500">{billingEmailError}</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {paymentSettings.method === 'mail_check' && (
                <>
                  <div className="bg-[#F5FBF8] rounded-lg p-6 border border-[#DAFAE8]">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-base font-medium">Mail Check</h5>
                        <div className="text-sm text-muted-foreground mt-1">
                          A check will be printed and mailed on your behalf to the address above
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Please Note:</div>
                        <div className="text-sm text-muted-foreground">
                          The preferred payment sending method is email as it would allow the recipient to input and verify this information.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-medium mb-4">Mailing Address</h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="street">Street Address <span className="text-red-500">*</span></Label>
                        <Input
                          id="street"
                          placeholder="Enter street address"
                          className="h-[42px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                          <Input
                            id="city"
                            placeholder="Enter city"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="province">Province <span className="text-red-500">*</span></Label>
                          <Input
                            id="province"
                            placeholder="Enter province"
                            className="h-[42px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">Postal Code <span className="text-red-500">*</span></Label>
                          <Input
                            id="postalCode"
                            placeholder="Enter postal code"
                            className="h-[42px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                          <Input
                            id="country"
                            placeholder="Enter country"
                            className="h-[42px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sticky bottom-0 z-50 bg-background border-t py-2 px-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 