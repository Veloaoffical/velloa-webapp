'use client';

import { useState, useEffect } from 'react';
import { Lock, Building2, Building, User, Users, Layers, Receipt, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ChevronDownIcon,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BillDateRangePicker } from "../../../components/BillDateRangePicker";
import { parseDate } from "@internationalized/date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StepType = 'intro' | 'bills' | 'allocation' | 'payments' | 'summary';

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

interface AccountData {
  id: string;
  account_type: string;
  account_name: string;
  is_sub_account?: boolean;
  parent_account?: string;
}

interface BillPaymentForm {
  bills: {
    scope?: 'all' | 'specific' | null;
    billScope?: 'all' | 'specific' | null;
    vendors?: string[];
    selectedBills?: string[];
    startDate?: Date | null;
    endDate?: Date | null;
    list: Array<{
      id: string;
      vendor: string;
      amount: number;
      due_date: Date;
      selected: boolean;
    }>;
  };
  allocation: {
    type: 'equal' | 'custom' | 'percentage';
    scope?: 'all' | 'specific' | null;
    properties: Array<{
      id: string;
      name: string;
      amount: number;
      percentage: number;
      autoPayment?: boolean;
    }>;
  };
  payment: {
    method: 'check' | 'ach' | 'wire';
    account_id: string;
    scheduled_date: Date;
  };
}

interface VendorData {
  id: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  company?: string;
}

interface ChargeLine {
  property_id: string;
  amount: number;
  category: string;
  reference: number;
  description?: string;
  unit_id?: string;
}

interface Charge {
  id: string;
  payee_id: string;
  amount_remaining: {
    lines: ChargeLine[];
    total_amount: number;
    accounts_receivable_id?: string;
  };
}

interface PropertyBalance {
  property_id: string;
  property_name: string;
  balance: number;
}

export default function PayBillsPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepType>('intro');
  const [form, setForm] = useState<BillPaymentForm>({
    bills: {
      scope: 'all',
      billScope: 'all',
      vendors: [],
      selectedBills: [],
      startDate: null,
      endDate: null,
      list: []
    },
    allocation: {
      type: 'equal',
      scope: 'all',
      properties: []
    },
    payment: {
      method: 'check',
      account_id: '',
      scheduled_date: new Date()
    }
  });
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
  const [propertyBalances, setPropertyBalances] = useState<Map<string, number>>(new Map());
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<{id: string; name: string} | null>(null);
  const [newPropertyBalance, setNewPropertyBalance] = useState<string>('');
  
  // Add new state for dropdowns
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [vendorsOpen, setVendorsOpen] = useState(false);

  // Add state for filtered vendors
  const [filteredVendors, setFilteredVendors] = useState<VendorData[]>([]);

  // Update the vendor state type
  const [vendors, setVendors] = useState<VendorData[]>([]);

  // Add state to track if user has made selections
  const [userSelections, setUserSelections] = useState({
    allocationScope: false,
    billsScope: false,
    billsDateRange: false
  });

  // Add state to track which rows are visible
  const [visibleRows, setVisibleRows] = useState({
    properties: true,
    vendors: false,
    bills: false
  });

  const [charges, setCharges] = useState<Charge[]>([]);
  
  // Fetch charges when component mounts or when vendors are selected
  useEffect(() => {
    const fetchCharges = async () => {
      try {
        setIsLoadingBalances(true);
        const response = await fetch('/api/accounting/charges');
        if (!response.ok) {
          throw new Error('Failed to fetch charges');
        }
        const data = await response.json();
        setCharges(data);
        
        // Create a map to store total remaining amount per property
        const balancesByProperty = new Map<string, number>();
        
        // Sum up amounts for each property from all charges
        data.forEach((charge: Charge) => {
          if (charge.amount_remaining && charge.amount_remaining.lines) {
            charge.amount_remaining.lines.forEach((line: ChargeLine) => {
              if (line.property_id) {
                const currentBalance = balancesByProperty.get(line.property_id) || 0;
                balancesByProperty.set(line.property_id, currentBalance + line.amount);
              }
            });
          }
        });
        
        setPropertyBalances(balancesByProperty);
      } catch (error) {
        console.error('Error fetching charges:', error);
        toast.error('Failed to load property balances');
      } finally {
        setIsLoadingBalances(false);
      }
    };

    if (step === 'allocation') {
      fetchCharges();
    }
  }, [step]);

  // Update the transformation in useEffect
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/people/vendor/search');
        if (!response.ok) {
          throw new Error('Failed to fetch vendors');
        }
        const data = await response.json();
        // Keep the original vendor data structure
        setVendors(data);
        setFilteredVendors(data); // Initialize filtered vendors with all vendors
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast.error('Failed to load vendors');
      }
    };

    fetchVendors();
  }, []);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/property');
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties');
      }
    };

    fetchProperties();
  }, []);

  // Add effect to filter vendors based on selected properties
  useEffect(() => {
    const filterVendorsByProperties = async () => {
      // If no properties selected or scope is 'all', show all vendors
      if (form.allocation.scope === 'all' || form.allocation.properties.length === 0) {
        setFilteredVendors(vendors);
        return;
      }

      try {
        // Get the selected property IDs
        const selectedPropertyIds = form.allocation.properties.map(p => p.id);
        
        // Fetch vendors with service addresses for these properties
        const response = await fetch('/api/people/vendor/by-properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ propertyIds: selectedPropertyIds })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch vendors by properties');
        }

        const data = await response.json();
        setFilteredVendors(data);
      } catch (error) {
        console.error('Error filtering vendors by properties:', error);
        // Fallback to all vendors if there's an error
        setFilteredVendors(vendors);
      }
    };

    filterVendorsByProperties();
  }, [form.allocation.properties, form.allocation.scope, vendors]);

  const handleSubmit = async () => {
    try {
      // Convert propertyBalances Map to array of PropertyBalance objects
      const allPropertyBalances: PropertyBalance[] = Array.from(propertyBalances.entries()).map(([id, balance]) => ({
        property_id: id,
        property_name: properties.find(p => p.id === id)?.name || 'Unknown Property',
        balance: balance
      }));

      // Add the first row's data to propertyBalances if it exists
      if (selectedProperty && newPropertyBalance) {
        const balance = parseFloat(newPropertyBalance);
        if (!isNaN(balance)) {
          allPropertyBalances.push({
            property_id: selectedProperty.id,
            property_name: selectedProperty.name,
            balance: balance
          });
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

  const isBillsComplete = () => {
    // If user selected "All Bills", consider it complete
    if (form.bills.billScope === 'all') {
      return true;
    }
    
    // If user selected specific bills with a date range, consider it complete
    if (form.bills.billScope === 'specific' && form.bills.startDate && form.bills.endDate) {
      return true;
    }
    
    // Otherwise, check if any bills are selected
    return form.bills.list.some(bill => bill.selected);
  };

  const isAllocationComplete = () => {
    if (form.allocation.type === 'equal') return true;
    return form.allocation.properties.length > 0 && 
           form.allocation.properties.every(p => p.amount > 0 || p.percentage > 0);
  };

  const isPaymentsComplete = () => {
    return form.payment.account_id !== '' && form.payment.scheduled_date !== undefined;
  };

  const canAccessStep = (stepName: StepType) => {
    const stepOrder = ['intro', 'bills', 'allocation', 'payments', 'summary'];
    const currentStepIndex = stepOrder.indexOf(step);
    const targetStepIndex = stepOrder.indexOf(stepName);

    // Can always access previous steps
    if (targetStepIndex <= currentStepIndex) return true;

    // Only validate the current step when trying to move forward
    if (targetStepIndex === currentStepIndex + 1) {
      switch (step) {
        case 'bills':
          return isBillsComplete();
        case 'allocation':
          return isAllocationComplete();
        case 'payments':
          return isPaymentsComplete();
        default:
          return true;
      }
    }

    // Check all steps up to the target
    for (let i = 1; i < targetStepIndex; i++) {
      switch (stepOrder[i]) {
        case 'bills':
          if (!isBillsComplete()) return false;
          break;
        case 'allocation':
          if (!isAllocationComplete()) return false;
          break;
        case 'payments':
          if (!isPaymentsComplete()) return false;
          break;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 'bills' && !isBillsComplete()) {
      toast.error('Please select at least one bill to pay');
      return;
    }

    if (step === 'allocation' && !isAllocationComplete()) {
      toast.error('Please complete the allocation information');
      return;
    }

    if (step === 'payments' && !isPaymentsComplete()) {
      toast.error('Please complete the payment settings');
      return;
    }

    const stepOrder = ['intro', 'bills', 'allocation', 'payments', 'summary'];
    const currentIndex = stepOrder.indexOf(step);
    
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1] as StepType;
      setStep(nextStep);
      
      // Reset visible rows when moving to the bills step
      if (nextStep === 'bills') {
        setVisibleRows({
          properties: true,
          vendors: false,
          bills: false
        });
      }
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

  // Update getTotalPropertyBalances to handle Map correctly
  const getTotalPropertyBalances = () => {
    let existingTotal = 0;
    propertyBalances.forEach((value) => {
      existingTotal += value;
    });
    const pendingBalance = selectedProperty && newPropertyBalance ? parseFloat(newPropertyBalance) || 0 : 0;
    return existingTotal + pendingBalance;
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
                const stepOrder = ['intro', 'bills', 'allocation', 'payments', 'summary'];
                const currentStepIndex = stepOrder.indexOf(step);
                return (
                  <Stepper value={currentStepIndex + 1} orientation="vertical">
                    {[
                      { step: 'intro', title: 'Intro' },
                      { step: 'bills', title: 'Bills' },
                      { step: 'allocation', title: 'Allocation' },
                      { step: 'payments', title: 'Payments' },
                      { step: 'summary', title: 'Summary' }
                    ].map(({ step: stepName, title }, index) => {
                      const isAccessible = canAccessStep(stepName as StepType);
                      const isActive = step === stepName;
                      const isCompleted = index < currentStepIndex;

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
                              {isCompleted ? <Lock className="h-3 w-3" /> : !isAccessible ? <Lock className="h-3 w-3" /> : index + 1}
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
                      <h2 className="text-2xl font-semibold">Pay Bills</h2>
                      <p className="text-gray-600">
                        Let&apos;s help you pay your bills. We&apos;ll guide you through selecting bills, allocating costs to properties, and setting up payments.
                      </p>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="max-w-2xl w-full mx-auto">
                        <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-3">What you&apos;ll need:</h3>
                          <ul className="list-disc list-inside space-y-2">
                            <li>Bills to pay</li>
                            <li>Property allocation preferences</li>
                            <li>Payment method details</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 'bills' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Select Bills</h2>
                      <p className="text-gray-600">Choose which bills you want to pay and how to allocate them.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-16 pb-24">
                      {/* Property Allocation Selection */}
                      <AnimatePresence>
                        {visibleRows.properties && (
                          <motion.div 
                            className="max-w-md mx-auto space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="text-center">
                              <p className="text-center">Which properties should the bill be allocated to?</p>
                            </div>
                            
                            <RadioGroup
                              value={userSelections.allocationScope ? (form.allocation.scope || "") : ""}
                              onValueChange={(value: 'all' | 'specific') => {
                                setForm(prev => ({
                                  ...prev,
                                  allocation: {
                                    ...prev.allocation,
                                    scope: value,
                                    properties: value === 'all' ? [] : prev.allocation.properties
                                  }
                                }));
                                // Mark this selection as made by user
                                setUserSelections(prev => ({
                                  ...prev,
                                  allocationScope: true
                                }));
                                // Only show the next row if we have a valid selection
                                if (value === 'all' || (value === 'specific' && form.allocation.properties.length > 0)) {
                                  setVisibleRows(prev => ({
                                    ...prev,
                                    vendors: true
                                  }));
                                }
                              }}
                              className="grid grid-cols-2 gap-3"
                            >
                              {/* All Properties Radio Card */}
                              <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                                <RadioGroupItem 
                                  value="all" 
                                  id="properties-all" 
                                  className="sr-only after:absolute after:inset-0" 
                                />
                                <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                <div className="space-y-0.5 text-center">
                                  <p className="text-sm font-medium leading-none">All Properties</p>
                                  <p className="text-xs text-muted-foreground">Allocate to all properties</p>
                                </div>
                                {userSelections.allocationScope && form.allocation.scope === 'all' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </label>

                              {/* Specific Properties Radio Card */}
                              <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                                <RadioGroupItem 
                                  value="specific" 
                                  id="properties-specific" 
                                  className="sr-only after:absolute after:inset-0" 
                                />
                                <Building className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                <div className="space-y-0.5 text-center">
                                  <p className="text-sm font-medium leading-none">Select Properties</p>
                                  <p className="text-xs text-muted-foreground">Choose specific properties</p>
                                </div>
                                {userSelections.allocationScope && form.allocation.scope === 'specific' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </label>
                            </RadioGroup>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Properties Dropdown */}
                      {form.allocation.scope === 'specific' && (
                        <motion.div 
                          className="mt-4 max-w-md mx-auto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Label className="text-left block mb-2">Select Properties</Label>
                          <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={propertiesOpen}
                                className="w-full justify-between"
                              >
                                <span className="truncate">
                                  {form.allocation.properties.length > 0
                                    ? `${form.allocation.properties.length} properties selected`
                                    : "Select properties"}
                                </span>
                                <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                              <Command>
                                <CommandInput placeholder="Search properties..." />
                                <CommandList>
                                  <CommandEmpty>No properties found.</CommandEmpty>
                                  <CommandGroup>
                                    {properties.map((property) => (
                                      <CommandItem
                                        key={property.id}
                                        onSelect={() => {
                                          setForm(prev => {
                                            // Check if property is already selected
                                            const isSelected = prev.allocation.properties.some(p => p.id === property.id);
                                            
                                            const newProperties = isSelected
                                              // If already selected, remove it
                                              ? prev.allocation.properties.filter(p => p.id !== property.id)
                                              // If not selected, add it with autoPayment enabled by default
                                              : [...prev.allocation.properties, { 
                                                  id: property.id, 
                                                  name: property.name, 
                                                  amount: propertyBalances.get(property.id) || 0, 
                                                  percentage: 0,
                                                  autoPayment: true
                                                }];
                                            
                                            // Show vendors section if at least one property is selected
                                            if (newProperties.length > 0) {
                                              setVisibleRows(prev => ({
                                                ...prev,
                                                vendors: true
                                              }));
                                            } else {
                                              setVisibleRows(prev => ({
                                                ...prev,
                                                vendors: false,
                                                bills: false
                                              }));
                                            }
                                            
                                            return {
                                              ...prev,
                                              allocation: {
                                                ...prev.allocation,
                                                properties: newProperties
                                              }
                                            };
                                          });
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span>{property.name}</span>
                                          {property.address && (
                                            <span className="text-xs text-muted-foreground">{property.address}</span>
                                          )}
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            form.allocation.properties.some(p => p.id === property.id)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </motion.div>
                      )}

                      {/* Vendor Selection */}
                      <AnimatePresence>
                        {visibleRows.vendors && (
                          <motion.div 
                            className="max-w-md mx-auto space-y-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="text-center">
                              <p className="text-center">Which vendors do you want to pay bills for?</p>
                            </div>
                            
                            <RadioGroup
                              value={userSelections.billsScope ? (form.bills.scope || "") : ""}
                              onValueChange={(value: 'all' | 'specific') => {
                                setForm(prev => ({
                                  ...prev,
                                  bills: {
                                    ...prev.bills,
                                    scope: value,
                                    vendors: value === 'all' ? [] : prev.bills.vendors
                                  }
                                }));
                                // Mark this selection as made by user
                                setUserSelections(prev => ({
                                  ...prev,
                                  billsScope: true
                                }));
                                // Only show the next row if we have a valid selection
                                if (value === 'all' || (value === 'specific' && form.bills.vendors && form.bills.vendors.length > 0)) {
                                  setVisibleRows(prev => ({
                                    ...prev,
                                    bills: true
                                  }));
                                }
                              }}
                              className="grid grid-cols-2 gap-3"
                            >
                              {/* All Vendors Radio Card */}
                              <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                                <RadioGroupItem 
                                  value="all" 
                                  id="vendors-all" 
                                  className="sr-only after:absolute after:inset-0" 
                                />
                                <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                <div className="space-y-0.5 text-center">
                                  <p className="text-sm font-medium leading-none">All Vendors</p>
                                  <p className="text-xs text-muted-foreground">Bills from all vendors</p>
                                </div>
                                {userSelections.billsScope && form.bills.scope === 'all' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </label>

                              {/* Specific Vendors Radio Card */}
                              <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                                <RadioGroupItem 
                                  value="specific" 
                                  id="vendors-specific" 
                                  className="sr-only after:absolute after:inset-0" 
                                />
                                <User className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                <div className="space-y-0.5 text-center">
                                  <p className="text-sm font-medium leading-none">Select Vendors</p>
                                  <p className="text-xs text-muted-foreground">Choose specific vendors</p>
                                </div>
                                {userSelections.billsScope && form.bills.scope === 'specific' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </label>
                            </RadioGroup>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Vendors Dropdown */}
                      {visibleRows.vendors && form.bills.scope === 'specific' && (
                        <motion.div 
                          className="mt-4 max-w-md mx-auto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Label className="text-left block mb-2">Select Vendors</Label>
                          <Popover open={vendorsOpen} onOpenChange={setVendorsOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={vendorsOpen}
                                className="w-full justify-between"
                              >
                                <span className="truncate">
                                  {form.bills.vendors?.length
                                    ? `${form.bills.vendors.length} vendors selected`
                                    : "Select vendors"}
                                </span>
                                <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                              <Command>
                                <CommandInput placeholder="Search vendors..." />
                                <CommandList>
                                  <CommandEmpty>No vendors found.</CommandEmpty>
                                  <CommandGroup>
                                    {filteredVendors.map((vendor) => (
                                      <CommandItem
                                        key={vendor.id}
                                        value={vendor.id}
                                        onSelect={(currentValue) => {
                                          setForm(prev => {
                                            // If vendor is already selected, remove it
                                            const newVendors = prev.bills.vendors?.includes(currentValue)
                                              ? prev.bills.vendors.filter(id => id !== currentValue)
                                              : [...(prev.bills.vendors || []), currentValue];
                                            
                                            // Show bills section if at least one vendor is selected
                                            if (newVendors.length > 0) {
                                              setVisibleRows(prev => ({
                                                ...prev,
                                                bills: true
                                              }));
                                            } else {
                                              setVisibleRows(prev => ({
                                                ...prev,
                                                bills: false
                                              }));
                                            }
                                            
                                            return {
                                              ...prev,
                                              bills: {
                                                ...prev.bills,
                                                vendors: newVendors
                                              }
                                            };
                                          });
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            form.bills.vendors?.includes(vendor.id)
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{[vendor.first_name, vendor.middle_name, vendor.last_name].filter(Boolean).join(" ")}</span>
                                          {vendor.company && (
                                            <span className="text-xs text-muted-foreground">{vendor.company}</span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </motion.div>
                      )}

                      {/* Bill Selection */}
                      <AnimatePresence>
                        {visibleRows.bills && (
                          <motion.div 
                            className="max-w-md mx-auto space-y-4 mb-24"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="text-center">
                              <p className="text-center">Which bills do you want to pay?</p>
                            </div>
                            
                            <RadioGroup
                              value={userSelections.billsDateRange ? (form.bills.billScope || "") : ""}
                              onValueChange={(value: 'all' | 'specific') => {
                                setForm(prev => ({
                                  ...prev,
                                  bills: {
                                    ...prev.bills,
                                    billScope: value,
                                    selectedBills: value === 'all' ? [] : prev.bills.selectedBills
                                  }
                                }));
                                // Mark this selection as made by user
                                setUserSelections(prev => ({
                                  ...prev,
                                  billsDateRange: true
                                }));
                              }}
                              className="grid grid-cols-2 gap-3"
                            >
                              {/* All Bills Radio Card */}
                              <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                                <RadioGroupItem 
                                  value="all" 
                                  id="bills-all" 
                                  className="sr-only after:absolute after:inset-0" 
                                />
                                <Layers className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                <div className="space-y-0.5 text-center">
                                  <p className="text-sm font-medium leading-none">All Bills</p>
                                  <p className="text-xs text-muted-foreground">Pay all outstanding bills</p>
                                </div>
                                {userSelections.billsDateRange && form.bills.billScope === 'all' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </label>

                              {/* Specific Bills Radio Card */}
                              <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-3 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                                <RadioGroupItem 
                                  value="specific" 
                                  id="bills-specific" 
                                  className="sr-only after:absolute after:inset-0" 
                                />
                                <Receipt className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                <div className="space-y-0.5 text-center">
                                  <p className="text-sm font-medium leading-none">Select Bills</p>
                                  <p className="text-xs text-muted-foreground">Choose specific bills to pay</p>
                                </div>
                                {userSelections.billsDateRange && form.bills.billScope === 'specific' && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                                  >
                                    <Check className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </label>
                            </RadioGroup>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Date Range Picker for Bills */}
                      {visibleRows.bills && form.bills.billScope === 'specific' && (
                        <motion.div 
                          className="mt-4 max-w-md mx-auto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <BillDateRangePicker 
                            label="Select bill date range"
                            startDate={form.bills.startDate ? parseDate(form.bills.startDate.toISOString().split('T')[0]) : null}
                            endDate={form.bills.endDate ? parseDate(form.bills.endDate.toISOString().split('T')[0]) : null}
                            onChange={(start, end) => {
                              setForm(prev => ({
                                ...prev,
                                bills: {
                                  ...prev.bills,
                                  startDate: start ? new Date(start.toString()) : null,
                                  endDate: end ? new Date(end.toString()) : null
                                }
                              }));
                            }}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                ) : step === 'allocation' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Allocate Costs</h2>
                      <p className="text-gray-600">Specify how to split the costs between properties.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[40%]">Property</TableHead>
                            <TableHead className="text-right w-[15%]">Balance</TableHead>
                            <TableHead className="text-right w-[15%]">Payment Amount</TableHead>
                            <TableHead className="w-[30%]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Map through properties */}
                          {(form.allocation.scope === 'all' 
                            ? properties as Array<{id: string; name: string; address?: string}> 
                            : form.allocation.properties
                          ).map((property) => {
                            // Get the property ID
                            const propertyId = property.id;
                            
                            // Get balance from propertyBalances, filtered by selected vendors if any
                            const getFilteredBalance = () => {
                              if (form.bills.scope === 'all') {
                                return propertyBalances.get(propertyId) || 0;
                              }
                              
                              // If specific vendors are selected, only include charges for those vendors
                              if (form.bills.scope === 'specific' && form.bills.vendors && form.bills.vendors.length > 0) {
                                let filteredBalance = 0;
                                charges.forEach((charge) => {
                                  if (charge.amount_remaining && 
                                      charge.amount_remaining.lines && 
                                      charge.payee_id && 
                                      form.bills.vendors?.includes(charge.payee_id)) {
                                    charge.amount_remaining.lines.forEach((line: ChargeLine) => {
                                      if (line.property_id === propertyId) {
                                        filteredBalance += line.amount;
                                      }
                                    });
                                  }
                                });
                                return filteredBalance;
                              }
                              
                              return propertyBalances.get(propertyId) || 0;
                            };
                            
                            const balanceDue = getFilteredBalance();
                            
                            // Find the property in the allocation form or create a new one with autoPayment enabled
                            const allocationProperty = form.allocation.properties.find(p => p.id === propertyId) || {
                              id: propertyId,
                              name: property.name,
                              amount: balanceDue,
                              percentage: 0,
                              autoPayment: true
                            };
                            
                            // Get the payment amount
                            const paymentAmount = allocationProperty.amount;
                            
                            // Check if auto-payment is enabled (default to true)
                            const isAutoPayment = allocationProperty.autoPayment ?? true;
                            
                            // Get property name and address
                            const propertyName = property.name || 'Unknown Property';
                            
                            const propertyAddress = 'address' in property && property.address 
                              ? property.address 
                              : 'Miami, Florida, 33130';
                            
                            return (
                              <TableRow key={propertyId}>
                                <TableCell className="w-[40%]">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-muted/30 p-2 rounded-md">
                                      <Building2 className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm line-clamp-2">
                                        {propertyName}
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-2">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="line-clamp-2">{propertyAddress}</span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="text-right font-medium w-[15%]">
                                  {isLoadingBalances ? (
                                    <div className="animate-pulse bg-muted h-6 w-24 rounded ml-auto" />
                                  ) : (
                                    `$${balanceDue.toFixed(2)}`
                                  )}
                                </TableCell>
                                
                                <TableCell className="text-right w-[15%]">
                                  <div className="ml-auto w-24 p-2 text-right">
                                    ${(isAutoPayment ? balanceDue : paymentAmount).toFixed(2)}
                                  </div>
                                </TableCell>
                                
                                <TableCell className="w-[30%]">
                                  <div className="flex items-center gap-4 h-[52px]">
                                    <Switch
                                      checked={isAutoPayment}
                                      onCheckedChange={(checked: boolean) => {
                                        setForm(prev => {
                                          const exists = prev.allocation.properties.some(p => p.id === propertyId);
                                          
                                          if (exists) {
                                            return {
                                              ...prev,
                                              allocation: {
                                                ...prev.allocation,
                                                properties: prev.allocation.properties.map(p => 
                                                  p.id === propertyId 
                                                    ? { 
                                                        ...p, 
                                                        amount: balanceDue, // Always keep the balance as the amount
                                                        autoPayment: checked 
                                                      } 
                                                    : p
                                                )
                                              }
                                            };
                                          } else {
                                            return {
                                              ...prev,
                                              allocation: {
                                                ...prev.allocation,
                                                properties: [
                                                  ...prev.allocation.properties,
                                                  { 
                                                    id: propertyId, 
                                                    name: propertyName, 
                                                    amount: balanceDue, // Always keep the balance as the amount
                                                    percentage: 0,
                                                    autoPayment: checked
                                                  }
                                                ]
                                              }
                                            };
                                          }
                                        });
                                      }}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                    <div className="flex flex-col text-sm text-muted-foreground min-w-[120px]">
                                      <span className="leading-5">Automatically</span>
                                      <span className="leading-5">Apply Payments</span>
                                    </div>
                                    <div className="w-9 ml-auto">
                                      {!isAutoPayment && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => {
                                            // Add edit functionality here
                                            console.log(`Edit property: ${propertyId}`);
                                          }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : step === 'payments' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Payment Details</h2>
                      <p className="text-gray-600">Set up how you want to pay these bills.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {/* Payment details content will go here */}
                    </div>
                  </div>
                ) : (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Review & Confirm</h2>
                      <p className="text-gray-600">Review your bill payments before proceeding.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {/* Summary content will go here */}
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
                  const stepOrder = ['intro', 'bills', 'allocation', 'payments', 'summary'];
                  const currentIndex = stepOrder.indexOf(step);
                  if (currentIndex > 0) {
                    setStep(stepOrder[currentIndex - 1] as StepType);
                  }
                }
              }}
            >
              {step === 'intro' ? 'Cancel' : 'Previous'}
            </Button>
            <Button onClick={handleNextStep}>
              {step === 'summary' ? 'Process Payments' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 