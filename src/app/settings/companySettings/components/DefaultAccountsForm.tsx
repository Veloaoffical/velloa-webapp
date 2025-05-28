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
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  sub_accounts?: {
    id: string;
    account_name: string;
    account_subtype: string;
  }[];
}

interface DefaultAccountsFormProps {
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
  // Metadata
  updated_at?: string;
  created_at?: string;
}

function LoadingSkeleton() {
  const renderAccountSection = (title: string, numberOfSelects: number) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-[hsl(var(--primary))]">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: numberOfSelects }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Separator className="mt-6" />
      {renderAccountSection("Bank", 3)}
      {renderAccountSection("Income", 4)}
      {renderAccountSection("Liability", 1)}
      {renderAccountSection("Expense", 1)}
      {renderAccountSection("Equity", 2)}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Separator />
    </div>
  );
}

export function DefaultAccountsForm({ initialData }: DefaultAccountsFormProps) {
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

  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const [accountsResponse, settingsResponse] = await Promise.all([
          fetch('/api/accounting/categories'),
          fetch('/api/company/settings/default-accounts')
        ]);

        if (!accountsResponse.ok) throw new Error('Failed to fetch accounts');
        if (!settingsResponse.ok) throw new Error('Failed to fetch settings');

        const accountsData = await accountsResponse.json();
        const settingsData = await settingsResponse.json();
        
        console.log('Fetched accounts:', accountsData);
        console.log('Fetched settings:', settingsData);
        
        setAccounts(accountsData);
        if (settingsData) {
          setFormData(settingsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/company/settings/default-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Default accounts updated successfully');
    } catch (err) {
      console.error('Error saving default accounts:', err);
      toast.error('Failed to update default accounts');
    }
  };

  const filterAccountsByType = (type: string, subtype?: string, isBank?: boolean) => {
    const options: { value: string; label: string }[] = [];
    
    accounts.forEach(account => {
      // Debug log
      console.log(`Checking account:`, {
        name: account.account_name,
        type: account.account_type,
        subtype: account.account_subtype,
        expectedType: type
      });

      // Special handling for bank accounts
      const isMatch = isBank 
        ? account.account_type === 'Asset' && account.account_subtype === 'Bank'
        : account.account_type.toLowerCase() === type.toLowerCase() && 
          (!subtype || account.account_subtype?.toLowerCase() === subtype.toLowerCase());

      if (isMatch) {
        // Add main account
        options.push({
          value: account.id,
          label: `${account.account_name}${account.account_subtype ? ` (${account.account_subtype})` : ''}`
        });
        
        // Add sub-accounts if they exist
        if (account.sub_accounts) {
          account.sub_accounts.forEach(sub => {
            if (isBank || !subtype || sub.account_subtype?.toLowerCase() === subtype.toLowerCase()) {
              options.push({
                value: sub.id,
                label: `${account.account_name} - ${sub.account_name}${sub.account_subtype ? ` (${sub.account_subtype})` : ''}`
              });
            }
          });
        }
      }
    });
    
    console.log(`Filtered ${type} accounts:`, options); // Debug log
    return options;
  };

  const bankAccounts = filterAccountsByType('Bank', undefined, true);
  const incomeAccounts = filterAccountsByType('Revenue');
  const liabilityAccounts = filterAccountsByType('Liability');
  const expenseAccounts = filterAccountsByType('Expense');
  const equityAccounts = filterAccountsByType('Equity');

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>

        <Separator className="mt-6" />
      </div>

      {/* Bank Accounts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[hsl(var(--primary))]">Bank</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Operating Bank Account</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[350px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Operating Bank Account</p>
                      <p className="text-xs text-muted-foreground">
                        When tenants make online payments for their lease charges, the funds are deposited into the default Operating Account. If you prefer each property to have its own designated bank account, you&apos;ll need to enable property-specific bank accounts.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.operatingBankAccount}
              onValueChange={(value) => setFormData(prev => ({ ...prev, operatingBankAccount: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Trust Bank Account</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[350px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Trust Bank Account</p>
                      <p className="text-xs text-muted-foreground">
                        When recording manual payments on a tenant&apos;s lease, this account can be used as the second bank deposit option. If you prefer each property to have its own escrow account, property-specific bank accounts must be enabled.
                      </p>
                      <ul className="text-xs text-muted-foreground mt-2 list-disc pl-4 space-y-1">
                        <li>This account is primarily used for lease deposit payments, as many states require security deposits to be held in a separate bank account.</li>
                        <li>However, it can be used for other purposes if needed.</li>
                      </ul>
                      <div className="mt-2 text-xs text-red-500 border-l-2 border-red-500 pl-3">
                        <p><span className="font-medium">Please note:</span> The Trust/Escrow Account will never receive online payments directly, even if the payment is intended for a security deposit.</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.trustBankAccount}
              onValueChange={(value) => setFormData(prev => ({ ...prev, trustBankAccount: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Clearing Account</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[350px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Clearing Account</p>
                      <p className="text-xs text-muted-foreground">
                        A clearing account is a temporary holding account for transactions before they are assigned to their final accounts. It is recommended to leave this account unchanged.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.clearingAccount}
              onValueChange={(value) => setFormData(prev => ({ ...prev, clearingAccount: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((option) => (
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Rental Income</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Rental Income</p>
                      <p className="text-xs text-muted-foreground">
                      This is the default account for rent charges and the only one that automatically triggers lease late fees.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.rentalIncome}
              onValueChange={(value) => setFormData(prev => ({ ...prev, rentalIncome: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {incomeAccounts.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Application Fee</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Application Fee</p>
                      <p className="text-xs text-muted-foreground">
                      Revenue from online rental application payments is recorded in this account.                     
                    </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.applicationFee}
              onValueChange={(value) => setFormData(prev => ({ ...prev, applicationFee: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {incomeAccounts.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Late Fees</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Late Fees</p>
                      <p className="text-xs text-muted-foreground">
                      This account is selected by default when setting up late fee schedules for your company and properties.                      
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.lateFees}
              onValueChange={(value) => setFormData(prev => ({ ...prev, lateFees: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {incomeAccounts.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Convenience Fee Income</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Convenience Fee Income</p>
                      <p className="text-xs text-muted-foreground">
                      The default account for collecting convenience fees.                      
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.convenienceFeeIncome}
              onValueChange={(value) => setFormData(prev => ({ ...prev, convenienceFeeIncome: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {incomeAccounts.map((option) => (
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Security Deposit</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Security Deposit</p>
                      <p className="text-xs text-muted-foreground">
                        This liability account is used to track security deposits received from tenants. These funds are held in trust until the lease ends and the deposit is either returned or applied to damages.
                      </p>
                      <div className="mt-2 text-xs text-red-500 border-l-2 border-red-500 pl-3">
                        <p><span className="font-medium">Please note:</span> This is for informational purposes only.</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.securityDeposit}
              onValueChange={(value) => setFormData(prev => ({ ...prev, securityDeposit: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {liabilityAccounts.map((option) => (
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Management Fees</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Management Fees</p>
                      <p className="text-xs text-muted-foreground">
                        This expense account tracks property management fees charged by your company. These fees are typically calculated as a percentage of rent collected or as fixed amounts.
                      </p>
                      <div className="mt-2 text-xs text-red-500 border-l-2 border-red-500 pl-3">
                        <p><span className="font-medium">Please note:</span> This is for informational purposes only.</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.managementFees}
              onValueChange={(value) => setFormData(prev => ({ ...prev, managementFees: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {expenseAccounts.map((option) => (
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Owner Contribution</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Owner Contribution</p>
                      <p className="text-xs text-muted-foreground">
                        This equity account tracks funds contributed by property owners. It&apos;s used when owners invest additional money into their properties for maintenance, improvements, or other expenses.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.ownerContribution}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ownerContribution: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {equityAccounts.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Owner Distribution</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="max-w-[450px] py-3 shadow-none" side="top">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[13px] font-medium">Owner Distribution</p>
                      <p className="text-xs text-muted-foreground">
                        This equity account tracks distributions made to property owners. It records the withdrawal of profits or excess funds that are paid out to property owners.
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 px-2" 
                      variant="outline"
                      onClick={() => window.open('https://www.support.velloa.ca', '_blank')}
                    >
                      Learn more
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select
              value={formData.ownerDistribution}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ownerDistribution: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {equityAccounts.map((option) => (
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