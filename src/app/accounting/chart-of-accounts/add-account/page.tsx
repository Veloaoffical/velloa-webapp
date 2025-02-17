'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Lock, Info, Signature, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import CalendarInput from "@/components/calendarwithmonthsinput";

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";

type StepType = 'intro' | 'account_info' | 'opening_balance' | 'lease_options' | 'check_printing' | 'summary';

// Add the cn utility function at the top of the file
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface AccountForm {
  name: string;
  type: string;
  subtype: string;
  number: string;
  description: string;
  opening_balance: number;
  opening_balance_date: Date | undefined;
  lease_integration: boolean;
  auto_post_rent: boolean;
  auto_post_fees: boolean;
  check_printing_enabled: boolean;
  check_template: string;
  check_starting_number: number;
  is_active: boolean;
  is_sub_account: boolean;
  parent_account_id?: string;
  parent_account_name?: string;
  next_check_number?: string;
  transit_number?: string;
  institution_number?: string;
  account_number?: string;
}

interface PropertyBalance {
  property_id: string;
  property_name: string;
  balance: number;
}

interface AccountData {
  id: string;
  account_type: string;
  account_name: string;
  is_sub_account?: boolean;
  parent_account?: string;
}

export default function AddAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepType>('intro');
  const [account, setAccount] = useState<AccountForm>({
    name: '',
    type: '',
    subtype: '',
    number: '',
    description: '',
    opening_balance: 0,
    opening_balance_date: undefined,
    lease_integration: false,
    auto_post_rent: false,
    auto_post_fees: false,
    check_printing_enabled: false,
    check_template: '',
    check_starting_number: 1000,
    is_active: true,
    is_sub_account: false,
    parent_account_id: '',
    parent_account_name: '',
    next_check_number: '',
    transit_number: '',
    institution_number: '',
    account_number: ''
  });
  const [parentAccounts, setParentAccounts] = useState<Array<{id: string; name: string; type: string}>>([]);
  const [isLoadingParentAccounts, setIsLoadingParentAccounts] = useState(false);
  const [properties, setProperties] = useState<Array<{id: string; name: string; address: string}>>([]);
  const [propertyBalances, setPropertyBalances] = useState<PropertyBalance[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<{id: string; name: string} | null>(null);
  const [newPropertyBalance, setNewPropertyBalance] = useState<string>('');
  const [accountTypeOpen, setAccountTypeOpen] = useState<boolean>(false);
  const [subtypeOpen, setSubtypeOpen] = useState<boolean>(false);

  const getSubtypeOptions = (type: string) => {
    switch (type) {
      case 'Asset':
        return [
          'Accounts Receivable',
          'Other Current Assets',
          'Bank',
          'Fixed Assets',
          'Other Assets'
        ];
      case 'Liability':
        return [
          'Accounts Payable',
          'Credit Card',
          'Other Current Liabilities',
          'Long Term Liabilities'
        ];
      case 'Equity':
        return ['Equity'];
      case 'Revenue':
        return [
          'Income',
          'Other Income'
        ];
      case 'Expense':
        return [
          'Expense',
          'Other Expense',
          'Cost of Goods Sold'
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async () => {
    try {
      // Add the first row's data to propertyBalances if it exists
      let allPropertyBalances = [...propertyBalances];
      if (selectedProperty && newPropertyBalance) {
        const balance = parseFloat(newPropertyBalance);
        if (!isNaN(balance)) {
          allPropertyBalances = [...propertyBalances, {
            property_id: selectedProperty.id,
            property_name: selectedProperty.name,
            balance: balance
          }];
        }
      }

      // Log the data being sent
      console.log('Submitting account data:', {
        account,
        propertyBalances: allPropertyBalances,
        totalBalance: getTotalPropertyBalances()
      });

      // Validate property balances match total
      if (account.type === 'Asset' && Math.abs(getTotalPropertyBalances() - account.opening_balance) > 0.01) {
        toast.error('Property balances must equal the total account balance');
        return;
      }

      const dataToSend = {
        ...account,
        propertyBalances: allPropertyBalances.map(pb => ({
          property_id: pb.property_id,
          property_name: pb.property_name,
          balance: parseFloat(pb.balance.toString())
        }))
      };

      console.log('Sending data to API:', JSON.stringify(dataToSend, null, 2));

      const response = await fetch('/api/accounting/chart-of-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create account');
      }

      toast.success('Account has been created successfully', {
        description: 'You will be redirected to the chart of accounts'
      });
      
      setTimeout(() => {
        router.push('/accounting/chart-of-accounts');
      }, 2000);

    } catch (error) {
      console.error('Error creating account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
    }
  };

  const isAccountInfoComplete = () => {
    const requiredFieldsValid = 
           account.type.trim() !== '' && 
      account.subtype.trim() !== '' && 
      account.name.trim() !== '';

    // If sub-account is enabled, also require parent account selection
    if (account.is_sub_account) {
      return requiredFieldsValid && account.parent_account_id !== '';
    }

    return requiredFieldsValid;
  };

  const isOpeningBalanceComplete = () => {
    return account.opening_balance_date !== undefined;
  };

  const isLeaseOptionsComplete = () => {
    return true; // All fields are optional
  };

  const isCheckPrintingComplete = () => {
    if (!account.check_printing_enabled) return true;
    return account.check_template !== '' && account.check_starting_number > 0;
  };

  const canAccessStep = (stepName: StepType) => {
    const stepOrder = ['intro', 'account_info', 'opening_balance', 'lease_options', 'check_printing', 'summary'];
    const currentStepIndex = stepOrder.indexOf(step);
    const targetStepIndex = stepOrder.indexOf(stepName);

    // For Revenue and Expense accounts, show opening_balance as locked
    if (account.type === 'Revenue' || account.type === 'Expense') {
      if (stepName === 'opening_balance') {
        return false;
      }

      const modifiedStepOrder = ['intro', 'account_info', 'lease_options', 'check_printing', 'summary'];
      const modifiedCurrentIndex = modifiedStepOrder.indexOf(step as 'intro' | 'account_info' | 'lease_options' | 'check_printing' | 'summary');
      const modifiedTargetIndex = modifiedStepOrder.indexOf(stepName as 'intro' | 'account_info' | 'lease_options' | 'check_printing' | 'summary');

      // If step is not in modified order, it's not accessible
      if (modifiedCurrentIndex === -1 || modifiedTargetIndex === -1) {
        return false;
      }

      // Can always access previous steps
      if (modifiedTargetIndex <= modifiedCurrentIndex) return true;

      // Only validate the current step when trying to move forward
      if (modifiedTargetIndex === modifiedCurrentIndex + 1) {
        switch (step) {
          case 'account_info':
            return isAccountInfoComplete();
          case 'lease_options':
            return isLeaseOptionsComplete();
          case 'check_printing':
            return isCheckPrintingComplete();
          default:
            return true;
        }
      }

      // Check all steps up to the target
      for (let i = 1; i < modifiedTargetIndex; i++) {
        switch (modifiedStepOrder[i]) {
          case 'account_info':
            if (!isAccountInfoComplete()) return false;
            break;
          case 'lease_options':
            if (!isLeaseOptionsComplete()) return false;
            break;
          case 'check_printing':
            if (!isCheckPrintingComplete()) return false;
            break;
        }
      }

      return true;
    }

    // Original logic for other account types
    // Can always access previous steps
    if (targetStepIndex <= currentStepIndex) return true;

    // Only validate the current step when trying to move forward
    if (targetStepIndex === currentStepIndex + 1) {
      switch (step) {
        case 'account_info':
          return isAccountInfoComplete();
        case 'opening_balance':
          return isOpeningBalanceComplete();
        case 'lease_options':
          return isLeaseOptionsComplete();
        case 'check_printing':
          return isCheckPrintingComplete();
        default:
          return true;
      }
    }

    // If trying to access a step further than the next one, check all previous steps
    if (targetStepIndex > currentStepIndex + 1) {
      // Check all steps up to the target
      for (let i = 1; i < targetStepIndex; i++) {
        switch (stepOrder[i]) {
          case 'account_info':
            if (!isAccountInfoComplete()) return false;
            break;
          case 'opening_balance':
            if (!isOpeningBalanceComplete()) return false;
            break;
          case 'lease_options':
            if (!isLeaseOptionsComplete()) return false;
            break;
          case 'check_printing':
            if (!isCheckPrintingComplete()) return false;
            break;
        }
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 'account_info' && !isAccountInfoComplete()) {
      toast.error('Please complete the account information');
      return;
    }

    if (step === 'opening_balance' && !isOpeningBalanceComplete() && account.type !== 'Revenue' && account.type !== 'Expense') {
      toast.error('Please complete the opening balance information');
      return;
    }

    if (step === 'lease_options' && !isLeaseOptionsComplete()) {
      toast.error('Please complete the lease options');
      return;
    }

    if (step === 'check_printing' && !isCheckPrintingComplete()) {
      toast.error('Please complete the check printing settings');
      return;
    }

    const stepOrder = ['intro', 'account_info', 'opening_balance', 'lease_options', 'check_printing', 'summary'];
    const currentIndex = stepOrder.indexOf(step);
    
    // Skip opening balance for Revenue and Expense accounts
    if (account.type === 'Revenue' || account.type === 'Expense') {
      if (step === 'account_info') {
        setStep('lease_options');
        return;
      }
    }
    
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1] as StepType);
    } else {
      handleSubmit();
    }
  };

  // Fetch parent accounts when sub-account is enabled
  useEffect(() => {
    const fetchParentAccounts = async () => {
      if (!account.is_sub_account) return;
      
      try {
        setIsLoadingParentAccounts(true);
        console.log('Fetching parent accounts...');
        const response = await fetch('/api/accounting/chart-of-accounts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch parent accounts');
        }
        
        const data = await response.json();
        console.log('Received accounts data:', data);
        
        // Filter accounts based on the selected type and exclude sub-accounts
        const filteredAccounts = data.filter((acc: AccountData) => {
          const isSubAccount = acc.is_sub_account || acc.parent_account;
          const typeMatches = !account.type || acc.account_type === account.type;
          console.log('Account:', acc, 'Type matches:', typeMatches, 'Is not sub-account:', !isSubAccount);
          return typeMatches && !isSubAccount;
        }).map((acc: AccountData) => ({
          id: acc.id,
          name: acc.account_name,
          type: acc.account_type
        }));
        
        console.log('Filtered accounts:', filteredAccounts);
        setParentAccounts(filteredAccounts);
      } catch (error) {
        console.error('Error fetching parent accounts:', error);
        toast.error('Failed to load parent accounts');
      } finally {
        setIsLoadingParentAccounts(false);
      }
    };

    fetchParentAccounts();
  }, [account.is_sub_account, account.type]);

  // Add this useEffect to fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      if (account.type === 'Asset') {
        try {
          setIsLoadingProperties(true);
          const response = await fetch('/api/property');
          if (!response.ok) {
            throw new Error('Failed to fetch properties');
          }
          const data = await response.json();
          setProperties(data);
        } catch (error) {
          console.error('Error fetching properties:', error);
          toast.error('Failed to load properties');
        } finally {
          setIsLoadingProperties(false);
        }
      }
    };

    fetchProperties();
  }, [account.type]);

  // Update getTotalPropertyBalances to use the correct field
  const getTotalPropertyBalances = () => {
    const existingTotal = propertyBalances.reduce((sum, p) => sum + (p.balance || 0), 0);
    const pendingBalance = selectedProperty && newPropertyBalance ? parseFloat(newPropertyBalance) || 0 : 0;
    return existingTotal + pendingBalance;
  };

  // Update handleAddProperty to properly handle the array
  const handleAddProperty = () => {
    if (selectedProperty && newPropertyBalance) {
      console.log('Adding new property:', { selectedProperty, balance: newPropertyBalance });
      const balance = parseFloat(newPropertyBalance);
      if (!isNaN(balance)) {
        const newPropertyBalance = {
          property_id: selectedProperty.id,
          property_name: selectedProperty.name,
          balance: balance
        };
        console.log('New property balance to add:', newPropertyBalance);
        
        setPropertyBalances(prev => {
          const updated = [...prev, newPropertyBalance];
          console.log('Updated property balances:', updated);
          return updated;
        });
        
        setSelectedProperty(null);
        setNewPropertyBalance('');
      }
    }
  };

  // Update handlePropertyBalanceChange to ensure proper state updates
  const handlePropertyBalanceChange = (propertyId: string, propertyName: string, balance: number) => {
    console.log('Updating property balance:', { propertyId, propertyName, balance });
    setPropertyBalances(prev => {
      const existing = prev.find(p => p.property_id === propertyId);
      if (existing) {
        const updated = prev.map(p => 
          p.property_id === propertyId 
            ? { ...p, balance } 
            : p
        );
        console.log('Updated property balances:', updated);
        return updated;
      }
      
      const updated = [...prev, { 
        property_id: propertyId, 
        property_name: propertyName, 
        balance 
      }];
      console.log('Added new property balance:', updated);
      return updated;
    });
  };

  // Add this function to handle deleting properties
  const handleDeleteProperty = (propertyId: string) => {
    console.log('Deleting property:', propertyId);
    setPropertyBalances(prev => {
      const updated = prev.filter(p => p.property_id !== propertyId);
      console.log('Property balances after delete:', updated);
      return updated;
    });
  };

  return (
    <div className="mx-auto p-6">
      <Card className="bg-card rounded-xl p-6 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Add an Account</h1>
        </div>

        <div className="flex gap-6 flex-grow overflow-hidden">
          {/* Left Column - Steps */}
          <div className="w-72 shrink-0 border-r pr-6">
            <div className="space-y-2 sticky top-6">
              {(() => {
                const stepOrder = ['intro', 'account_info', 'opening_balance', 'lease_options', 'check_printing', 'summary'];
                return (
                  <Stepper value={stepOrder.indexOf(step) + 1} orientation="vertical">
                    {[
                      { step: 'intro', title: 'Intro' },
                      { step: 'account_info', title: 'Account Info' },
                      { step: 'opening_balance', title: 'Opening Balance' },
                      { step: 'lease_options', title: 'Lease Options' },
                      { step: 'check_printing', title: 'Check Printing' },
                      { step: 'summary', title: 'Summary' }
                    ].map(({ step: stepName, title }, index) => {
                      const isAccessible = canAccessStep(stepName as StepType);
                      const isActive = step === stepName;
                const currentStepIndex = stepOrder.indexOf(step);
                      const thisStepIndex = index;
                const isCompleted = thisStepIndex < currentStepIndex;

                return (
                        <StepperItem
                          key={stepName}
                          step={index + 1}
                      className={cn(
                            "relative items-start [&:not(:last-child)]:flex-1",
                            !isAccessible ? "opacity-50" : ""
                      )}
                        >
                          <StepperTrigger 
                            className="items-start pb-12 last:pb-0 w-full"
                      onClick={() => {
                        if (isAccessible) {
                          setStep(stepName as StepType);
                        } else {
                          toast.error('Please complete the current step first');
                        }
                      }}
                            disabled={!isAccessible}
                          >
                            <StepperIndicator className={cn(
                              isActive ? "border-primary text-primary" : "",
                              isCompleted ? "border-primary bg-primary text-background" : "",
                              !isAccessible ? "border-muted-foreground/30 text-muted-foreground/30" : ""
                            )}>
                              {isCompleted ? <Lock className="h-3 w-3" /> : !isAccessible ? <Lock className="h-3 w-3" /> : thisStepIndex + 1}
                            </StepperIndicator>
                            <div className="mt-0.5 px-2 text-left">
                              <StepperTitle className={cn(
                                isActive ? "text-primary" : "",
                                !isAccessible ? "text-muted-foreground/50" : "",
                                isCompleted ? "text-primary" : ""
                              )}>{title}</StepperTitle>
                      </div>
                          </StepperTrigger>
                          {stepName !== 'summary' && (
                            <StepperSeparator className={cn(
                              "absolute inset-y-0 left-3 top-[calc(1.5rem+0.125rem)] -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)]",
                              isCompleted ? "bg-primary" : ""
                            )} />
                          )}
                        </StepperItem>
                );
              })}
                  </Stepper>
                );
              })()}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="flex-grow overflow-y-auto pr-6 pb-20">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-6"
              >
                {step === 'intro' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">Getting Started</h2>
                      <p className="text-gray-600">
                        Let&apos;s set up your new account in the chart of accounts.
                      </p>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="max-w-2xl w-full mx-auto">
                        <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-3">Required Information</h3>
                          <p className="mb-4">
                            The following information will be needed to create your account:
                          </p>
                          <ul className="list-disc list-inside space-y-2">
                            <li>Account Name and Type</li>
                            <li>Account Number</li>
                            <li>Opening Balance (if any)</li>
                            <li>Lease Integration Options</li>
                            <li>Check Printing Settings</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 'account_info' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Account Information</h2>
                      <p className="text-gray-600">Enter the basic information for your new account.</p>
                    </div>

                    <div className="flex items-start justify-center">
                      <div className="max-w-md w-full mt-8">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-center">What type of account would you like to create?</p>

                            <div className="grid gap-3">
                              <div className="grid gap-1.5">
                                <Label htmlFor="type">Account Type <span className="text-red-500">*</span></Label>
                                <Popover open={accountTypeOpen} onOpenChange={setAccountTypeOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={accountTypeOpen}
                                      className="w-full justify-between h-[42px]"
                                    >
                                      {account.type || "Select account type..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                      <CommandInput placeholder="Search account type..." />
                                      <CommandEmpty>No account type found.</CommandEmpty>
                                      <CommandGroup>
                                        {["Asset", "Liability", "Equity", "Revenue", "Expense"].map((type) => (
                                          <CommandItem
                                            key={type}
                                            onSelect={() => {
                                              setAccount({...account, type, subtype: ''});
                                              setAccountTypeOpen(false);
                                            }}
                                          >
                                            <div className="flex items-center gap-2">
                                              <Check 
                                                className={cn(
                                                  "h-4 w-4",
                                                  account.type === type ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <span>{type}</span>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {account.type && (
                                <AnimatePresence mode="sync">
                                  <motion.div 
                                    key="subtype-selection"
                                    initial={{ opacity: 0, height: 0, y: -10 }}
                                    animate={{ opacity: 1, height: "auto", y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    transition={{ 
                                      duration: 0.2,
                                      ease: "easeOut",
                                      height: {
                                        duration: 0.2
                                      }
                                    }}
                                    className="grid gap-1.5 overflow-hidden"
                                  >
                                    <Label htmlFor="subtype">Account Subtype <span className="text-red-500">*</span></Label>
                                    <Popover open={subtypeOpen} onOpenChange={setSubtypeOpen}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={subtypeOpen}
                                          className="w-full justify-between h-[42px]"
                                        >
                                          {account.subtype ? `${account.type} (${account.subtype})` : "Select subtype..."}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                          <CommandInput placeholder="Search subtype..." />
                                          <CommandEmpty>No subtype found.</CommandEmpty>
                                          <CommandGroup>
                                            {getSubtypeOptions(account.type).map((subtype) => (
                                              <CommandItem
                                                key={subtype}
                                                onSelect={() => {
                                                  setAccount({...account, subtype});
                                                  setSubtypeOpen(false);
                                                }}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Check 
                                                    className={cn(
                                                      "h-4 w-4",
                                                      account.subtype === subtype ? "opacity-100" : "opacity-0"
                                                    )}
                                                  />
                                                  <span>{subtype}</span>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  </motion.div>
                                </AnimatePresence>
                              )}
                            </div>
                          </div>

                          <AnimatePresence mode="sync">
                            {account.type && account.subtype && (
                              <motion.div
                                key="account-details"
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                transition={{ 
                                  duration: 0.2,
                                  ease: "easeOut",
                                  height: {
                                    duration: 0.2
                                  }
                                }}
                                className="mt-8"
                              >
                                <div className="space-y-4">
                                  <Separator className="my-4" />
                                  <h2 className="text-lg font-bold text-center">Account Details</h2>
                                  <p className="text-center">Enter the account name and additional details</p>

                                  <motion.div 
                                    className="space-y-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ 
                                      delay: 0.2,
                                      duration: 0.3,
                                      ease: "easeOut"
                                    }}
                                  >
                                    {/* Account Name */}
                                    <div className="grid gap-1.5">
                                      <Label htmlFor="name">Account Name <span className="text-red-500">*</span></Label>
                                      <Input
                                        id="name"
                                        placeholder="Enter account name"
                                        value={account.name}
                                        onChange={(e) => setAccount({...account, name: e.target.value})}
                                        className="h-[42px] bg-background"
                                      />
                                    </div>

                                    {/* Description */}
                                    <div className="grid gap-1.5">
                                      <Label htmlFor="description">Description</Label>
                                      <Input
                                        id="description"
                                        placeholder="Enter account description (optional)"
                                        value={account.description}
                                        onChange={(e) => setAccount({...account, description: e.target.value})}
                                        className="h-[42px] bg-background"
                                      />
                                    </div>

                                    {/* Account Status Switches */}
                                    <motion.div 
                                      className="space-y-4 pt-2"
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ 
                                        delay: 0.3,
                                        duration: 0.3,
                                        ease: "easeOut"
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <Switch
                                          checked={account.is_active}
                                          onCheckedChange={(checked) => setAccount({...account, is_active: checked})}
                                        />
                                        <div className="space-y-0.5 flex-1 ml-4">
                                          <Label>Active Account</Label>
                                          <p className="text-sm text-muted-foreground">
                                            Inactive accounts are hidden from reports and transactions
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <Separator />
                                      
                                      <div className="flex items-center justify-between">
                                        <Switch
                                          checked={account.is_sub_account}
                                          onCheckedChange={(checked) => {
                                            setAccount({
                                              ...account, 
                                              is_sub_account: checked,
                                              parent_account_id: checked ? account.parent_account_id : '',
                                              parent_account_name: checked ? account.parent_account_name : ''
                                            });
                                          }}
                                        />
                                        <div className="space-y-0.5 flex-1 ml-4">
                                          <Label>Sub-account</Label>
                                          <p className="text-sm text-muted-foreground">
                                            This account will be nested under another account
                                          </p>
                                        </div>
                                      </div>

                                      {/* Parent Account Selection */}
                                      <AnimatePresence>
                                        {account.is_sub_account && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="pt-8 pb-24"
                                          >
                                            <div className="grid gap-1.5 pb-12">
                                              <Label htmlFor="parent_account">Parent Account <span className="text-red-500">*</span></Label>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full justify-between h-[42px]"
                                                    disabled={isLoadingParentAccounts}
                                                  >
                                                    {isLoadingParentAccounts ? (
                                                      "Loading accounts..."
                                                    ) : account.parent_account_name || "Select parent account..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                  <Command>
                                                    <CommandInput placeholder="Search accounts..." />
                                                    <CommandEmpty>No account found.</CommandEmpty>
                                                    <CommandGroup>
                                                      {parentAccounts.map((parentAccount) => (
                                                        <CommandItem
                                                          key={parentAccount.id}
                                                          onSelect={() => {
                                                            setAccount({
                                                              ...account,
                                                              parent_account_id: parentAccount.id,
                                                              parent_account_name: parentAccount.name
                                                            });
                                                          }}
                                                        >
                                                          <div className="flex items-center gap-2">
                                                            <Check 
                                                              className={cn(
                                                                "h-4 w-4",
                                                                account.parent_account_id === parentAccount.id ? "opacity-100" : "opacity-0"
                                                              )}
                                                            />
                                                            <div className="flex flex-col">
                                                              <span className="font-medium">{parentAccount.name}</span>
                                                              <span className="text-sm text-muted-foreground">
                                                                ({parentAccount.type})
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </CommandItem>
                                                      ))}
                                                    </CommandGroup>
                                                  </Command>
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>
                                  </motion.div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 'opening_balance' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Opening Balance</h2>
                      <p className="text-gray-600">Let&apos;s set up the opening balance for your account.</p>
                    </div>

                    <div className="space-y-4 px-80">
                      <h3 className="text-lg font-medium">When do you want to start tracking your finances for this account?</h3>
                      <p className="text-sm text-muted-foreground">
                            Your accounting start date is important, because this will be the date that you begin tracking transactions for this account in Velloa. Everything before this date will be summarized in the opening balance that you enter for this account. <a href="#" className="text-primary hover:underline">Learn more</a>
                      </p>
                    </div>

                    <div className="max-w-md mx-auto w-full mt-6">
                      <div className="space-y-6">
                        <div>
                          {/* Accounting Start Date */}
                          <div className="grid gap-1.5">
                            <Label htmlFor="opening_balance_date">
                              Accounting Start Date <span className="text-red-500">*</span>
                            </Label>
                            <CalendarInput
                              value={account.opening_balance_date}
                              onChange={(date) => setAccount({...account, opening_balance_date: date})}
                              placeholder="Select start date"
                              className="w-full"
                            />
                          </div>
                        </div>

                        <AnimatePresence mode="sync">
                          {account.opening_balance_date && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Separator className="my-6" />
                              <div className="grid gap-1.5">
                                <Label htmlFor="opening_balance">
                                  What was your total account balance on {new Date(account.opening_balance_date).toLocaleDateString()}? <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    id="opening_balance"
                                    type="number"
                                    step="0.01"
                                    placeholder="Account Balance"
                                    className="h-[42px] bg-background pl-7"
                                    value={account.opening_balance || ''}
                                    onChange={(e) => setAccount({...account, opening_balance: parseFloat(e.target.value) || 0})}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <AnimatePresence mode="sync">
                          {account.type === 'Asset' && account.opening_balance > 0 && account.opening_balance_date && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ delay: 0.1, duration: 0.2 }}
                              className="w-[calc(100%+12rem)] -ml-24"
                            >
                              <Separator className="my-6" />
                              <div className="space-y-4 pb-24">
                                <h3 className="text-lg font-medium">Now we need to know the balance by property</h3>
                                <p className="text-sm text-muted-foreground">
                                  Please add the balance per property below. The total per property must be equal to the total Account Balance. This should include the total amount for each property, including deposits and reserves. <a href="#" className="text-primary hover:underline">Learn more</a>
                                </p>

                                {/* Property Balance Input */}
                                <div className="space-y-4">
                                  {/* First row */}
                                  <div className="grid grid-cols-[1.5fr,1.5fr,42px] gap-4">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className="w-full justify-between h-[42px]"
                                          disabled={isLoadingProperties}
                                        >
                                          {isLoadingProperties ? (
                                            "Loading properties..."
                                          ) : selectedProperty ? (
                                            <span className="truncate">{selectedProperty.name}</span>
                                          ) : (
                                            <span className="truncate text-muted-foreground">Property</span>
                                          )}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                          <CommandInput placeholder="Search properties..." />
                                          <CommandEmpty>No property found.</CommandEmpty>
                                          <CommandGroup>
                                            {properties
                                              .filter(property => !propertyBalances.some(pb => pb.property_id === property.id))
                                              .map((property) => (
                                                <CommandItem
                                                  key={property.id}
                                                  onSelect={() => {
                                                    setSelectedProperty({
                                                      id: property.id,
                                                      name: property.name
                                                    });
                                                  }}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      selectedProperty?.id === property.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                  />
                                                  <div className="flex flex-col">
                                                    <span>{property.name}</span>
                                                    <span className="text-sm text-muted-foreground">{property.address}</span>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                          </CommandGroup>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>

                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                      <Input
                                        type="number"
                                        step="0"
                                        placeholder="Enter balance"
                                        className="h-[42px] bg-background pl-7"
                                        value={newPropertyBalance}
                                        onChange={(e) => setNewPropertyBalance(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && selectedProperty && newPropertyBalance) {
                                            handleAddProperty();
                                          }
                                        }}
                                        disabled={!selectedProperty}
                                      />
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-[42px] w-[42px] text-muted-foreground/30"
                                      disabled
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Existing property balances */}
                                  {propertyBalances.map((propertyBalance) => (
                                    <div key={propertyBalance.property_id} className="grid grid-cols-[1.5fr,1.5fr,42px] gap-4">
                                      <Button
                                        variant="outline"
                                        className="w-full justify-between h-[42px] cursor-default"
                                        disabled
                                      >
                                        <span className="truncate">{propertyBalance.property_name}</span>
                                      </Button>

                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                          type="number"
                                          step="0"
                                          placeholder="Enter balance"
                                          className="h-[42px] bg-background pl-7"
                                          value={propertyBalance.balance}
                                          onChange={(e) => {
                                            const newBalance = parseFloat(e.target.value) || 0;
                                            handlePropertyBalanceChange(
                                              propertyBalance.property_id,
                                              propertyBalance.property_name,
                                              newBalance
                                            );
                                          }}
                                        />
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-[42px] w-[42px] text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteProperty(propertyBalance.property_id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}

                                  <Button
                                    variant="link"
                                    className="h-9 px-0 text-[hsl(var(--success))]"
                                    onClick={handleAddProperty}
                                    disabled={!selectedProperty || !newPropertyBalance}
                                  >
                                    + Add Another Property
                                  </Button>
                                </div>

                                {/* Summary */}
                                <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Total Account Balance:</span>
                                    <span>${account.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Sum of Property Balances:</span>
                                    <span>${getTotalPropertyBalances().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className={cn(
                                    "flex justify-between text-sm font-medium pt-2 border-t border-border",
                                    Math.abs(account.opening_balance - getTotalPropertyBalances()) < 0.01 
                                      ? "text-[hsl(var(--success))]" 
                                      : "text-destructive"
                                  )}>
                                    <span>Difference:</span>
                                    <span>${(account.opening_balance - getTotalPropertyBalances()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                ) : step === 'lease_options' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Lease Options</h2>
                      <p className="text-gray-600">Configure how this account interacts with leases.</p>
                    </div>

                    <div className="max-w-xl mx-auto w-full space-y-6">
                      {/* Lease Charges Switch */}
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={account.lease_integration}
                          onCheckedChange={(checked) => setAccount({...account, lease_integration: checked})}
                        />
                        <div className="space-y-0.5 flex-1 ml-4">
                          <Label>Use this account for Lease Charges</Label>
                          <p className="text-sm text-muted-foreground">
                            This will allow you to select this account when creating a new lease charge, credit, or refund.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Lease Deposits Switch */}
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={account.auto_post_rent}
                          onCheckedChange={(checked) => setAccount({...account, auto_post_rent: checked})}
                        />
                        <div className="space-y-0.5 flex-1 ml-4">
                          <Label>Use this account for Lease Deposits</Label>
                          <p className="text-sm text-muted-foreground">
                            This will allow you to select this account when creating a new lease deposit charge.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Statement Memo Switch */}
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={account.auto_post_fees}
                          onCheckedChange={(checked) => setAccount({...account, auto_post_fees: checked})}
                        />
                        <div className="space-y-0.5 flex-1 ml-4">
                          <Label>Set a default lease statement memo</Label>
                          <p className="text-sm text-muted-foreground">
                            This will allow you to select this account when creating a new lease deposit charge.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 'check_printing' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Check Printing</h2>
                      <p className="text-gray-600">You can print checks with Velloa for transactions such as expenses, owner distributions and bill payments. <a href="#" className="text-primary hover:underline">Learn more</a></p>
                    </div>

                    <div className="max-w-xl mx-auto w-full space-y-6">
                      {/* Check Printing Switch */}
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={account.check_printing_enabled}
                          onCheckedChange={(checked) => setAccount({...account, check_printing_enabled: checked})}
                        />
                        <div className="space-y-0.5 flex-1 ml-4">
                          <Label>Include Transit, Institution and Account numbers when printing on the check</Label>
                          <p className="text-sm text-muted-foreground">
                            This will be used with your Transit, Institution and Account numbers already printed on the checks. If not, toggle this off.
                          </p>
                        </div>
                      </div>

                      <AnimatePresence>
                        {account.check_printing_enabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6 pt-4 pb-24"
                          >
                            <Separator />
                            
                            {/* Transit and Institution Numbers */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-1.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="transit_number">Transit Number</Label>
                                  <div className="group relative">
                                    <div className="flex h-4 w-4 items-center justify-center">
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="absolute bottom-full left-1/2 mb-2 hidden w-72 -translate-x-1/2 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md group-hover:block">
                                      <p>A 5-digit code that identifies your specific bank branch. Found at the bottom of your check.</p>
                                      <p className="mt-1 text-muted-foreground">Example: 12345</p>
                                    </div>
                                  </div>
                                </div>
                                <Input
                                  id="transit_number"
                                  placeholder="Enter transit number"
                                  className="h-[42px] bg-background"
                                  pattern="[0-9]{5}"
                                  maxLength={5}
                                  value={account.transit_number}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 5) {
                                      setAccount({ ...account, transit_number: value });
                                    }
                                  }}
                                  title="Transit number must be exactly 5 digits"
                                />
                              </div>
                              <div className="grid gap-1.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="institution_number">Institution Number</Label>
                                  <div className="group relative">
                                    <div className="flex h-4 w-4 items-center justify-center">
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="absolute bottom-full left-1/2 mb-2 hidden w-72 -translate-x-1/2 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md group-hover:block">
                                      <p>A 3-digit code that identifies your bank. Common examples:</p>
                                      <ul className="mt-1 space-y-1 text-muted-foreground">
                                        <li>RBC (003)</li>
                                        <li>TD (004)</li>
                                        <li>CIBC (010)</li>
                                        <li>ScotiaBank (002)</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                <Input
                                  id="institution_number"
                                  placeholder="Enter institution number"
                                  className="h-[42px] bg-background"
                                  pattern="[0-9]{3}"
                                  maxLength={3}
                                  value={account.institution_number}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 3) {
                                      setAccount({ ...account, institution_number: value });
                                    }
                                  }}
                                  title="Institution number must be exactly 3 digits"
                                />
                              </div>
                            </div>

                            {/* Account Number and Next Check Number */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-1.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="account_number">Account Number</Label>
                                  <div className="group relative">
                                    <div className="flex h-4 w-4 items-center justify-center">
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="absolute bottom-full left-1/2 mb-2 hidden w-72 -translate-x-1/2 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md group-hover:block">
                                      <p>Your bank account number, typically 7-12 digits. Found at the bottom of your check after the institution number.</p>
                                      <p className="mt-1 text-muted-foreground">Example: 1234567</p>
                                    </div>
                                  </div>
                                </div>
                                <Input
                                  id="account_number"
                                  placeholder="Enter account number"
                                  className="h-[42px] bg-background"
                                  pattern="[0-9]{7,12}"
                                  maxLength={12}
                                  value={account.account_number}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 12) {
                                      setAccount({ ...account, account_number: value });
                                    }
                                  }}
                                  title="Account number must be between 7 and 12 digits"
                                />
                              </div>
                              <div className="grid gap-1.5">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor="next_check_number">Next Check Number</Label>
                                  <div className="group relative">
                                    <div className="flex h-4 w-4 items-center justify-center">
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="absolute bottom-full left-1/2 mb-2 hidden w-72 -translate-x-1/2 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md group-hover:block">
                                      <p>The number of the next check in your checkbook. Must be 3 digits.</p>
                                      <p className="mt-1 text-muted-foreground">Example: 001</p>
                                    </div>
                                  </div>
                                </div>
                                <Input
                                  id="next_check_number"
                                  placeholder="Enter next check number"
                                  className="h-[42px] bg-background"
                                  pattern="[0-9]{3}"
                                  maxLength={3}
                                  value={account.next_check_number}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 3) {
                                      setAccount({ ...account, next_check_number: value });
                                    }
                                  }}
                                  title="Next check number must be exactly 3 digits"
                                />
                              </div>
                            </div>

                            {/* Account Owner Name */}
                            <div className="grid gap-1.5">
                              <div className="flex items-center gap-2">
                                <Label htmlFor="account_owner_name">Account Owner Name</Label>
                                <div className="group relative">
                                  <div className="flex h-4 w-4 items-center justify-center">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="absolute bottom-full left-1/2 mb-2 hidden w-72 -translate-x-1/2 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md group-hover:block">
                                    <p>The name of the individual or business that owns this bank account. This will appear on printed checks.</p>
                                  </div>
                                </div>
                              </div>
                              <Input
                                id="account_owner_name"
                                placeholder="Enter account owner name"
                                className="h-[42px] bg-background"
                              />
                            </div>

                            {/* Bank Account Contact Info */}
                            <div className="grid gap-1.5">
                              <Label htmlFor="bank_contact_info">Bank Account Contact Info</Label>
                              <Textarea
                                id="bank_contact_info"
                                placeholder="Enter bank account contact info"
                                className="h-[84px] bg-background resize-none"
                              />
                            </div>

                            {/* Preview Section */}
                            <div className="mt-6 p-6 border rounded-lg bg-background">
                              <div className="space-y-4">
                                <p className="text-sm font-medium">Check Preview</p>
                                <div className="relative border-2 border-[#2B3A4A]/10 rounded-lg bg-white shadow-sm aspect-[2.5/1] p-8">
                                  <div className="absolute top-3 left-3 right-3 bottom-3 border border-[#2B3A4A]/10 pointer-events-none" />
                                  <div className="absolute top-6 right-8 flex flex-col items-end gap-4">
                                    <span className="text-sm font-medium">
                                      {account.next_check_number 
                                        ? String(Number(account.next_check_number) - 1).padStart(3, '0')
                                        : '000'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">DATE</span>
                                      <div className="w-32 border-b border-[#2B3A4A]/20" />
                                    </div>
                                  </div>
                                  
                                  <div className="mt-12 space-y-4">
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex items-start gap-2">
                                          <span className="text-sm whitespace-nowrap">PAY TO THE<br/>ORDER OF</span>
                                          <div className="flex-1 mt-3">
                                            <div className="w-full border-b border-[#2B3A4A]/20" />
                                          </div>
                                          <span className="text-lg px-2 mt-1">$</span>
                                          <div className="w-32 h-8 border border-[#2B3A4A]/20 rounded-sm" />
                                        </div>
                                      </div>
                                      <div>
                                        <div className="w-full border-b border-[#2B3A4A]/20" />
                                        <div className="flex justify-end items-center mt-1">
                                          <span className="text-sm">DOLLARS</span>
                                          <Lock className="h-4 w-4 ml-2 text-muted-foreground/50" />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">MEMO</span>
                                        <div className="w-48">
                                          <div className="w-full border-b border-[#2B3A4A]/20" />
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-48 border-b border-[#2B3A4A]/20" />
                                        <Signature className="h-4 w-4 text-muted-foreground/50" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="absolute bottom-4 w-full left-0">
                                    <div className="relative flex items-center font-mono text-sm tracking-[0.2em] text-[#2B3A4A] pl-8 mt-24">
                                      <span className="group relative">
                                        <span>⑈{account.next_check_number?.padStart(3, '0') || '001'}⑈</span>
                                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block whitespace-nowrap">
                                          Check #
                                        </div>
                                      </span>
                                      <span className="group relative">
                                        <span>⑆{account.transit_number?.padStart(5, '0') || '12345'}⑉</span>
                                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block whitespace-nowrap">
                                          Transit #
                                        </div>
                                      </span>
                                      <span className="group relative">
                                        <span>{account.institution_number?.padStart(3, '0') || '000'}⑆</span>
                                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block whitespace-nowrap">
                                          Institution #
                                        </div>
                                      </span>
                                      <span className="group relative">
                                        <span>{account.account_number?.padStart(7, '0') || '1234567'}⑈</span>
                                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block whitespace-nowrap">
                                          Account #
                                        </div>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Your Account Summary</h2>
                      <p className="text-gray-600">Review all information before creating the account.</p>
                    </div>

                    <div className="flex items-start justify-center flex-grow">
                      <div className="w-full max-w-[600px] overflow-y-auto">
                        <div className="grid divide-y border rounded-lg bg-card">
                          {/* Account Type */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Account Type</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('account_info')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">{account.type} ({account.subtype})</p>
                          </div>

                          {/* Account Name */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Account Name</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('account_info')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">{account.name}</p>
                          </div>

                          {/* Description */}
                          {account.description && (
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-muted-foreground text-sm">Description</Label>
                                <Button
                                  variant="link"
                                  className="h-auto p-0 text-primary hover:text-primary/90"
                                  onClick={() => setStep('account_info')}
                                >
                                  Edit
                                </Button>
                              </div>
                              <p className="mt-1">{account.description}</p>
                            </div>
                          )}

                          {/* Sub-account */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Sub-account</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('account_info')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">
                              {account.is_sub_account ? `Sub-account of ${account.parent_account_name}` : 'Not a sub-account'}
                            </p>
                          </div>

                          {/* Opening Balance */}
                          {account.type !== 'Revenue' && account.type !== 'Expense' && (
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-muted-foreground text-sm">Opening Balance</Label>
                                <Button
                                  variant="link"
                                  className="h-auto p-0 text-primary hover:text-primary/90"
                                  onClick={() => setStep('opening_balance')}
                                >
                                  Edit
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="mt-1">${account.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-sm text-muted-foreground">
                                  as of {account.opening_balance_date?.toLocaleDateString()}
                                </p>
                                {account.type === 'Asset' && propertyBalances.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm font-medium">Property Balances:</p>
                                    {propertyBalances.map((pb) => (
                                      <div key={pb.property_id} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{pb.property_name}</span>
                                        <span>${pb.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Lease Integration */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Lease Integration</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('lease_options')}
                              >
                                Edit
                              </Button>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <Check className={cn("h-4 w-4", account.lease_integration ? "text-[hsl(var(--success))]" : "text-muted-foreground/30")} />
                                <span className="text-sm">Use for Lease Charges</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className={cn("h-4 w-4", account.auto_post_rent ? "text-[hsl(var(--success))]" : "text-muted-foreground/30")} />
                                <span className="text-sm">Use for Lease Deposits</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Check className={cn("h-4 w-4", account.auto_post_fees ? "text-[hsl(var(--success))]" : "text-muted-foreground/30")} />
                                <span className="text-sm">Set Default Statement Memo</span>
                              </div>
                            </div>
                          </div>

                          {/* Check Printing */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Check Printing</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('check_printing')}
                              >
                                Edit
                              </Button>
                            </div>
                            {account.check_printing_enabled ? (
                              <div className="mt-2 space-y-2">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <span className="text-muted-foreground">Transit Number:</span>
                                  <span>{account.transit_number}</span>
                                  <span className="text-muted-foreground">Institution Number:</span>
                                  <span>{account.institution_number}</span>
                                  <span className="text-muted-foreground">Account Number:</span>
                                  <span>{account.account_number}</span>
                                  <span className="text-muted-foreground">Next Check Number:</span>
                                  <span>{account.next_check_number}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1">Check printing not enabled</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-card rounded-b-xl">
          <div className="flex justify-end gap-4 pr-6">
            <Button
              variant="outline"
              onClick={() => {
                if (step === 'intro') {
                  router.back();
                } else {
                  const stepOrder = ['intro', 'account_info', 'opening_balance', 'lease_options', 'check_printing', 'summary'];
                  const currentIndex = stepOrder.indexOf(step);
                  if (currentIndex > 0) {
                    // For Revenue and Expense accounts, skip opening_balance when going backwards
                    if (account.type === 'Revenue' || account.type === 'Expense') {
                      const prevStep = stepOrder[currentIndex - 1];
                      if (prevStep === 'opening_balance') {
                        setStep('account_info');
                      } else {
                    setStep(stepOrder[currentIndex - 1] as StepType);
                      }
                    } else {
                      setStep(stepOrder[currentIndex - 1] as StepType);
                    }
                  }
                }
              }}
            >
              {step === 'intro' ? 'Cancel' : 'Previous'}
            </Button>
            <Button onClick={handleNextStep}>
              {step === 'summary' ? 'Create Account' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 