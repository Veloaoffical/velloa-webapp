"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Building2, Link2 } from "lucide-react"
import Link from "next/link"

interface BankAccountProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface BankAccountForm {
  useDefaultAccount: boolean
  defaultAccountName?: string
  operatingAccount?: string
  escrowAccount?: string
}

export default function BankAccount({ open, onOpenChange }: BankAccountProps) {
  const params = useParams()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<BankAccountForm>({
    useDefaultAccount: true,
    defaultAccountName: ""
  })

  // Fetch bank account settings when component mounts
  React.useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        const { data: settings, error } = await supabase
          .from("property_settings")
          .select("value")
          .eq("property_id", params.id)
          .single()

        if (error) throw error

        if (settings?.value) {
          let parsedValue = settings.value
          if (typeof parsedValue === 'string') {
            parsedValue = JSON.parse(parsedValue)
            if (typeof parsedValue === 'string') {
              parsedValue = JSON.parse(parsedValue)
            }
          }

          if (parsedValue.bankAccount) {
            setFormData({
              useDefaultAccount: parsedValue.bankAccount.useDefaultAccount ?? true,
              defaultAccountName: parsedValue.bankAccount.defaultAccountName || "",
              operatingAccount: parsedValue.bankAccount.operatingAccount || "",
              escrowAccount: parsedValue.bankAccount.escrowAccount || ""
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch bank account settings:', error)
        toast.error('Failed to load bank account settings')
      }
    }

    if (params.id) {
      fetchBankAccount()
    }
  }, [params.id, supabase])

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // First get existing settings
      const { data: existingSettings, error: fetchError } = await supabase
        .from("property_settings")
        .select("value")
        .eq("property_id", params.id)
        .single()

      if (fetchError) throw fetchError

      // Parse existing settings
      let currentSettings = existingSettings?.value || {}
      if (typeof currentSettings === 'string') {
        currentSettings = JSON.parse(currentSettings)
        if (typeof currentSettings === 'string') {
          currentSettings = JSON.parse(currentSettings)
        }
      }

      // Update settings with new bank account settings
      const newSettings = {
        ...currentSettings,
        bankAccount: {
          useDefaultAccount: formData.useDefaultAccount,
          defaultAccountName: formData.defaultAccountName,
          operatingAccount: formData.operatingAccount,
          escrowAccount: formData.escrowAccount
        }
      }

      // Update settings
      const { error: updateError } = await supabase
        .from("property_settings")
        .update({
          value: JSON.stringify(newSettings)
        })
        .eq('property_id', params.id)

      if (updateError) throw updateError

      toast.success('Bank account settings updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save bank account settings:', error)
      toast.error('Failed to save bank account settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="sticky top-0 z-50 bg-white pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Bank Account</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            <RadioGroup 
              className="gap-4" 
              value={formData.useDefaultAccount ? "default" : "custom"}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                useDefaultAccount: value === "default"
              }))}
              disabled={isLoading}
            >
              <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                <RadioGroupItem
                  value="default"
                  id="bank-default"
                  aria-describedby="bank-default-description"
                  className="order-1 after:absolute after:inset-0"
                />
                <div className="grid grow gap-2">
                  <Label htmlFor="bank-default">
                    Use company default bank account
                  </Label>
                  <p id="bank-default-description" className="text-xs text-muted-foreground">
                    Use the default bank account settings configured for your company.
                  </p>
                </div>
              </div>

              <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                <RadioGroupItem
                  value="custom"
                  id="bank-custom"
                  aria-describedby="bank-custom-description"
                  className="order-1 after:absolute after:inset-0"
                />
                <div className="grid grow gap-2">
                  <Label htmlFor="bank-custom">
                    Specify custom bank account
                  </Label>
                  <p id="bank-custom-description" className="text-xs text-muted-foreground">
                    Configure a different bank account specifically for this property.
                  </p>
                </div>
              </div>
            </RadioGroup>

            {formData.useDefaultAccount && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/10">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formData.defaultAccountName || "Default Account"}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default Account</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <p>Your company&apos;s default bank account can be modified at any time through your</p>
                  <Link 
                    href="/settings/company" 
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Company Settings
                    <Link2 className="w-3 h-3" />
                  </Link>
                  <p>.</p>
                </div>
              </div>
            )}

            {!formData.useDefaultAccount && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Which account should we use as the operating bank account?</Label>
                  <Select
                    value={formData.operatingAccount}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      operatingAccount: value
                    }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account1">Account 1</SelectItem>
                      <SelectItem value="account2">Account 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Which account should we use as the escrow bank account for lease deposits?</Label>
                    <p className="text-sm text-muted-foreground mt-1">(Can be the same as the operating bank account)</p>
                  </div>
                  <Select
                    value={formData.escrowAccount}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      escrowAccount: value
                    }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account1">Account 1</SelectItem>
                      <SelectItem value="account2">Account 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 bg-white pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 