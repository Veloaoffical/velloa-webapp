'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface DefaultAccountsFormProps {
  onSave: (data: DefaultAccountsData) => Promise<void>;
  initialData?: DefaultAccountsData;
}

interface DefaultAccountsData {
  // Bank accounts
  operatingBankAccount: string;
  trustBankAccount: string;
  clearingAccount: string;
  // Income accounts
  rentalIncome: string;
  applicationFee: string;
  lateFees: string;
  convenienceFeeIncome: string;
  // Liability accounts
  securityDeposit: string;
  // Expense accounts
  managementFees: string;
  // Equity accounts
  ownerContribution: string;
  ownerDistribution: string;
}

export function DefaultAccountsForm({ onSave, initialData }: DefaultAccountsFormProps) {
  const [formData, setFormData] = React.useState<DefaultAccountsData>(
    initialData || {
      operatingBankAccount: '',
      trustBankAccount: '',
      clearingAccount: '',
      rentalIncome: '',
      applicationFee: '',
      lateFees: '',
      convenienceFeeIncome: '',
      securityDeposit: '',
      managementFees: '',
      ownerContribution: '',
      ownerDistribution: '',
    }
  );

  const handleSave = async () => {
    try {
      await onSave(formData);
      toast.success('Default accounts updated successfully');
    } catch (err) {
      console.error('Error saving default accounts:', err);
      toast.error('Failed to update default accounts');
    }
  };

  // Mock account options - replace with actual account data from your system
  const accountOptions = [
    { value: 'operating-account-1', label: 'Operating Account 1' },
    { value: 'operating-account-2', label: 'Operating Account 2' },
    { value: 'transfer-clearing', label: 'Transfer Clearing Account' },
    { value: 'rent', label: 'Rent' },
    { value: 'application-fees', label: 'Application Fees' },
    { value: 'late-fees', label: 'Late Fees' },
    { value: 'convenience-fees', label: 'Convenience Fees' },
    { value: 'security-deposit', label: 'Security Deposit' },
    { value: 'management-fees', label: 'Management Fees' },
    { value: 'owner-contribution', label: 'Owner Contribution' },
    { value: 'owner-distribution', label: 'Owner Distribution' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-muted-foreground text-sm">
          These accounts will be used by default for certain financial transactions that take place in DoorLoop.
        </div>
        <Separator className="mt-6" />
      </div>

      {/* Bank Accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[hsl(var(--primary))]">Bank</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Operating Bank Account</label>
            <Select
              value={formData.operatingBankAccount}
              onValueChange={(value) => setFormData(prev => ({ ...prev, operatingBankAccount: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Trust Bank Account</label>
            <Select
              value={formData.trustBankAccount}
              onValueChange={(value) => setFormData(prev => ({ ...prev, trustBankAccount: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Clearing Account</label>
            <Select
              value={formData.clearingAccount}
              onValueChange={(value) => setFormData(prev => ({ ...prev, clearingAccount: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Income Accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[hsl(var(--primary))]">Income</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rental Income</label>
            <Select
              value={formData.rentalIncome}
              onValueChange={(value) => setFormData(prev => ({ ...prev, rentalIncome: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Application Fee</label>
            <Select
              value={formData.applicationFee}
              onValueChange={(value) => setFormData(prev => ({ ...prev, applicationFee: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Late Fees</label>
            <Select
              value={formData.lateFees}
              onValueChange={(value) => setFormData(prev => ({ ...prev, lateFees: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Convenience Fee Income</label>
            <Select
              value={formData.convenienceFeeIncome}
              onValueChange={(value) => setFormData(prev => ({ ...prev, convenienceFeeIncome: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Liability Accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[hsl(var(--primary))]">Liability</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Security Deposit</label>
            <Select
              value={formData.securityDeposit}
              onValueChange={(value) => setFormData(prev => ({ ...prev, securityDeposit: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Expense Accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[hsl(var(--primary))]">Expense</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Management Fees</label>
            <Select
              value={formData.managementFees}
              onValueChange={(value) => setFormData(prev => ({ ...prev, managementFees: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Equity Accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[hsl(var(--primary))]">Equity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Owner Contribution</label>
            <Select
              value={formData.ownerContribution}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ownerContribution: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Owner Distribution</label>
            <Select
              value={formData.ownerDistribution}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ownerDistribution: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
      <Separator />
    </div>
  );
} 