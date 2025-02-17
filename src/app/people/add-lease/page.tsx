'use client';

import { useState, useEffect } from 'react';
import { Check, DollarSign, ChevronsUpDown, CalendarClock, CalendarDays, Plus, Search, User, Mail, Phone, X, CircleCheck, Ban, MessageSquareMore, ShieldAlert, Settings2, CalendarRange, Info, Building2, Home, Upload, FileText, Lock, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import CalendarWithMonthsInput  from "@/components/calendarwithmonthsinput";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,

  TableRow,
} from "@/components/ui/table";
import { generateCustomId } from "@/lib/utils/generate-id";
import { LateFeeContent } from "@/components/settingscomponents/LateFee";

interface DepositCharge {
  id: string;
  type: string;
  description: string;
  amount: string;
}

interface LeaseForm {
  // Tenant Information
  tenants: Array<{
    id: string;
    name: string;
  }>;
  
  // Property Information
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_number: string;
  
  // Lease Terms
  start_date: Date | undefined;
  end_date: Date | undefined;
  first_rent_due_date: Date | undefined;  // Add this new field
  rent_amount: string;
  security_deposit: number;
  lease_type: 'fixed' | 'month-to-month' | undefined;
  payment_frequency: 'monthly' | 'quarterly' | 'annually';
  payment_day: number;
  
  // Additional Terms
  utilities_included: string[];
  pet_policy: {
    allowed: boolean;
    deposit: number;
    monthly_fee: number;
  };
  parking_included: boolean;
  parking_fee: number;
  
  // Documents
  lease_document: File | null;
  additional_documents: File[];
  
  // Notes
  notes: string;
  
  // New fields
  rollover_to_month_to_month: boolean;
  tenant_portal: boolean;
  renters_insurance: boolean;
  additional_charges: Array<{
    id: string;
    type: string;
    description: string;
    amount: string;
  }>;
  late_fees: {
    enabled: boolean | null;
    policy_type: 'property' | 'custom';
    amount: number;
    type: 'fixed' | 'percentage';
    grace_period_days: number;
  };
  deposit_charges: Array<DepositCharge>;  // Add this new field
  document_status?: 'signed' | 'not_signed';
  document_action?: 'draft' | 'esign';
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Unit {
  id: string;
  unit_name: string;
  beds: number;
  baths: number;
  marketRent: number;
  size: string;
  status: string;
}

interface Person {
  id: string;
  name: string;
  role: 'tenant' | 'prospect' | 'owner' | 'vendor';
  email: string;
  phone: string;
  status: 'accepted' | 'pending' | 'declined';
}

interface PropertyLateFeeSettings {
  isEnabled: boolean;
  lateFees: Array<{
    type: string;
    amount: number;
    frequency: string;
    gracePeriod?: number;
    revenueAccount: string;
    description?: string;
  }>;
  maxDailyFeesEnabled: boolean;
  maxMonthlyFeesEnabled: boolean;
  minBalanceEnabled: boolean;
  applyToMostRecentEnabled: boolean;
  applyToSpecificEnabled: boolean;
  maxDailyAmount: string;
  maxMonthlyAmount: string;
  minBalanceAmount: string;
  selectedChargeTypes: string;
  useCompanyPolicy: boolean;
}

type StepType = 'intro' | 'property_details' | 'tenant' | 'rent' | 'security_deposit' | 'late_fees' | 'documents' | 'summary';
type PaymentFrequency = 'monthly' | 'quarterly' | 'annually';

// Add the cn utility function at the top of the file
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AddLeasePage() {
  const router = useRouter();
  const [step, setStep] = useState<StepType>('intro');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showAdvancedDepositOptions, setShowAdvancedDepositOptions] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [propertyLateFeeSettings, setPropertyLateFeeSettings] = useState<PropertyLateFeeSettings | null>(null);
  const [isLoadingLateFees, setIsLoadingLateFees] = useState(false);
  const [lease, setLease] = useState<LeaseForm>({
    tenants: [],
    property_id: '',
    property_name: '',
    unit_id: '',
    unit_number: '',
    start_date: undefined,
    end_date: undefined,
    first_rent_due_date: undefined,  // Add this new field
    rent_amount: '',
    security_deposit: 0,
    lease_type: undefined,
    payment_frequency: 'monthly',
    payment_day: 1,
    utilities_included: [],
    pet_policy: {
      allowed: false,
      deposit: 0,
      monthly_fee: 0
    },
    parking_included: false,
    parking_fee: 0,
    lease_document: null,
    additional_documents: [],
    notes: '',
    rollover_to_month_to_month: false,
    tenant_portal: false,
    renters_insurance: false,
    additional_charges: [],
    late_fees: {
      enabled: null,
      policy_type: 'property',
      amount: 0,
      type: 'fixed',
      grace_period_days: 0
    },
    deposit_charges: [{  // Initialize with one default deposit charge
      id: generateCustomId(12),
      type: '',
      description: '',
      amount: ''
    }],
    document_status: 'not_signed',
    document_action: 'draft',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRentIncreaseDialog, setShowRentIncreaseDialog] = useState(false);
  const [rentIncrease, setRentIncrease] = useState<{
    type: 'dollar' | 'percentage';
    amount: string;
    date: Date | undefined;
  }>({
    type: 'dollar',
    amount: '',
    date: undefined
  });
  const [showSecurityDeposit, setShowSecurityDeposit] = useState<boolean | null>(null);



  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/property');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Property fetch error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched properties:', data); // Debug log
        
        if (!data || data.length === 0) {
          toast.warning('No properties found. Please add a property first.');
        } else {
          setProperties(data);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Failed to load properties. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const fetchUnits = async (propertyId: string) => {
    try {
      setIsLoadingUnits(true);
      const response = await fetch(`/api/property/${propertyId}/units`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Units fetch error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch units: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched units:', data);
      
      if (!data || data.length === 0) {
        toast.warning('No units found for this property.');
      }
      setUnits(data);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units. Please try again.');
    } finally {
      setIsLoadingUnits(false);
    }
  };

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setIsLoadingPeople(true);
        console.log('Fetching people...');
        
        const response = await fetch('/api/people');
        console.log('People API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('People fetch error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData.details || `Failed to fetch people: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Successfully fetched people:', {
          count: data?.length || 0,
          sampleData: data?.slice(0, 2)
        });
        
        setPeople(data);
      } catch (error) {
        console.error('Error in fetchPeople:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load people');
      } finally {
        setIsLoadingPeople(false);
      }
    };

    fetchPeople();
  }, []);

  const filteredPeople = people.filter(person => 
    (person.role === 'tenant' || (person.role === 'prospect' && person.status === 'accepted')) &&
    (person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     person.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async () => {
    try {
      // Validate document status and action
      if (!lease.document_status) {
        toast.error('Please select a document status');
        return;
      }

      if (lease.document_status === 'not_signed' && !lease.document_action) {
        toast.error('Please select what you would like to do with the documents');
        return;
      }

      // For signed documents, ensure files are uploaded
      if (lease.document_status === 'signed' && lease.additional_documents.length === 0) {
        toast.error('Please upload the signed lease documents');
        return;
      }

      const response = await fetch('/api/leases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...lease,
          rentIncrease: rentIncrease.type ? rentIncrease : null,
          showSecurityDeposit,
          document_status: lease.document_status,
          document_action: lease.document_action
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create lease');
      }

      toast.success('Lease has been created successfully', {
        description: 'You will be redirected to the leases page'
      });
      
      setTimeout(() => {
        router.push('/leases');
      }, 2000);

    } catch (error) {
      console.error('Error creating lease:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create lease. Please try again.');
    }
  };

  const addCharge = () => {
    const id = generateCustomId(12);
    setLease({
      ...lease,
      additional_charges: [
        ...lease.additional_charges,
        {
          id,
          type: '',
          description: '',
          amount: ''
        }
      ]
    });
  };

  const removeCharge = (id: string) => {
    // Don't remove if it's the last charge
    if (lease.additional_charges.length <= 1) return;
    
    setLease({
      ...lease,
      additional_charges: lease.additional_charges.filter(charge => charge.id !== id)
    });
  };

  const updateCharge = (id: string, field: 'type' | 'description' | 'amount', value: string) => {
    setLease({
      ...lease,
      additional_charges: lease.additional_charges.map(charge => 
        charge.id === id ? { ...charge, [field]: value } : charge
      )
    });
  };

  const handleAdvancedOptions = (isDeposit: boolean) => {
    if (isDeposit) {
      setShowAdvancedDepositOptions(!showAdvancedDepositOptions);
      // Don't add a new charge since we already have one by default
    } else {
      setShowAdvancedOptions(!showAdvancedOptions);
      if (!showAdvancedOptions && lease.additional_charges.length === 0) {
        setLease(prev => ({
          ...prev,
          additional_charges: [{
            id: generateCustomId(12),
            type: '',
            description: '',
            amount: ''
          }]
        }));
      }
    }
  };

  const renderTenantForm = () => (
    <div className="space-y-8 w-full max-w-[1200px] mx-auto">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Lease Tenants</h3>
          <p className="text-sm text-muted-foreground">Who are the tenants?</p>
        </div>
        
        <div className="w-full">
          <div className="flex items-start gap-4 justify-center">
            {lease.tenants.map((tenant, index) => (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-[180px] shrink-0"
              >
                <div className="flex flex-col items-center p-6 bg-card rounded-lg border border-[hsl(var(--success-light))] hover:border-[hsl(var(--success))] transition-colors cursor-pointer h-[160px] justify-center group relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLease({
                        ...lease,
                        tenants: lease.tenants.filter((_, i) => i !== index)
                      });
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="relative h-16 w-16 rounded-full overflow-hidden border border-[hsl(var(--success-light))] mb-3">
                    <div className="absolute inset-0 bg-[hsl(var(--success-light))] flex items-center justify-center">
                      <User className="h-8 w-8 text-[hsl(var(--success))]" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-center truncate w-full text-foreground">{tenant.name}</p>
                </div>
              </motion.div>
            ))}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <div className="w-[180px] h-[160px] border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-[hsl(var(--success))] transition-colors flex flex-col items-center justify-center shrink-0 bg-card">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 rounded-full bg-background border border-border">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Add Tenant</span>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1], // custom ease curve
                  }}
                  className="p-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <DialogHeader>
                      <DialogTitle>Select Tenant</DialogTitle>
                      <DialogDescription>
                        Choose from approved prospects or existing tenants.
                      </DialogDescription>
                    </DialogHeader>
                  </motion.div>
                  
                  <div className="space-y-4 mt-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                      className="relative"
                    >
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.35,
                        duration: 0.4,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      className="rounded-md border overflow-hidden"
                    >
                      <Table>
                        <motion.thead
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45, duration: 0.3 }}
                        >
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </motion.thead>
                        <TableBody>
                          {isLoadingPeople ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.5 }}
                                >
                                  Loading people...
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          ) : filteredPeople.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.5 }}
                                >
                                  No matching people found
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredPeople.map((person, index) => (
                              <motion.tr
                                key={person.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: 0.5 + (index * 0.1),
                                  duration: 0.3,
                                  ease: [0.16, 1, 0.3, 1]
                                }}
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => {
                                  // Check if tenant is already added
                                  if (lease.tenants.some(t => t.id === person.id)) {
                                    toast.error('This tenant is already added to the lease');
                                    return;
                                  }
                                  setLease({
                                    ...lease,
                                    tenants: [...lease.tenants, { id: person.id, name: person.name }]
                                  });
                                  setDialogOpen(false);
                                }}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                                      <div className="flex items-center justify-center w-8 h-8">
                                        <User className="size-5 text-[#16B364]" strokeWidth={2} />
                                      </div>
                                    </div>
                                    <span className="font-medium">{person.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span>{person.email || "Not specified"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="h-4 w-4" />
                                      <span>{person.phone ? formatPhoneNumber(person.phone) : "Not specified"}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                    person.role === 'tenant' 
                                      ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                      : "bg-purple-50 text-purple-700 ring-purple-600/20"
                                  )}>
                                    {person.role === 'tenant' ? 'Tenant' : 'Prospect'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                    person.status === 'accepted'
                                      ? "bg-green-50 text-green-700 ring-green-600/20"
                                      : person.status === 'pending'
                                      ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                                      : person.status === 'declined'
                                      ? "bg-red-50 text-red-700 ring-red-600/20"
                                      : "bg-gray-50 text-gray-700 ring-gray-600/20"
                                  )}>
                                    {person.status ? person.status.charAt(0).toUpperCase() + person.status.slice(1) : 'Not Set'}
                                  </span>
                                </TableCell>
                              </motion.tr>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </motion.div>
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          </div>

          {lease.tenants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4 max-w-xl mx-auto"
            >
              <Separator className="my-8" />
              
              <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                <Switch
                  checked={lease.tenant_portal}
                  onCheckedChange={(checked) => setLease({ ...lease, tenant_portal: checked })}
                  className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-2 rtl:[&_span]:data-[state=checked]:-translate-x-2"
                />
                <div className="flex grow items-start gap-3">
                  <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                    <div className="flex items-center justify-center w-8 h-8">
                      <MessageSquareMore className="size-5 text-[hsl(var(--success))]" />
                    </div>
                  </div>
                  <div className="grid grow gap-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Tenant Portal{" "}
                    
                      </Label>
                      {lease.tenant_portal && (
                        <span className="text-xs font-medium text-[hsl(var(--success))]">
                          Sending Invite
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      If turned on, tenants will receive an invitation by email to access their online portal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                <Switch
                  checked={lease.renters_insurance}
                  onCheckedChange={(checked) => setLease({ ...lease, renters_insurance: checked })}
                  className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-2 rtl:[&_span]:data-[state=checked]:-translate-x-2"
                />
                <div className="flex grow items-start gap-3">
                  <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                    <div className="flex items-center justify-center w-8 h-8">
                      <ShieldAlert className="size-5 text-[hsl(var(--success))]" />
                    </div>
                  </div>
                  <div className="grid grow gap-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        Renters Insurance{" "}
                       
                      </Label>
                      {lease.renters_insurance && (
                        <span className="text-xs font-medium text-[hsl(var(--success))]">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      If turned on, we will require the tenant to purchase renters insurance to protect your property and provide proof of coverage.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if we have enough digits
    if (cleaned.length < 10) return phone;
    
    // Format as +0 (000)-000-0000
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  };

  const renderPropertyForm = () => {
    const selectedProperty = properties.find(p => p.id === lease.property_id);
    
    return (
    <div className="space-y-4">
      <div className="space-y-2">
              <p className="text-center">Select the property this lease is for?</p>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="property">Property <span className="text-red-500">*</span></Label>
            <Popover open={propertyOpen} onOpenChange={setPropertyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between h-[42px]"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading properties..." : selectedProperty ? selectedProperty.name : "Select property..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search property..." />
                  <CommandEmpty>No property found.</CommandEmpty>
                  <CommandGroup>
                    {properties.map((property) => (
                      <CommandItem
                        key={property.id}
                        onSelect={() => handlePropertySelect(property.id, property.name)}
                      >
                        <div className="flex items-center gap-2">
                          <Check 
                            className={cn(
                              "h-4 w-4",
                              lease.property_id === property.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{property.name}</span>
                            <span className="text-sm text-muted-foreground">{property.address}</span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedProperty && (
            <AnimatePresence mode="sync">
              <motion.div 
                key="unit-selection"
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
                <Label htmlFor="unit">Unit <span className="text-red-500">*</span></Label>
                <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-[42px]"
                      disabled={isLoadingUnits}
                    >
                      {isLoadingUnits ? "Loading units..." : lease.unit_number ? lease.unit_number : "Select unit..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0">
                    <Command>
                      <CommandInput placeholder="Search unit..." />
                      <CommandEmpty>No unit found.</CommandEmpty>
                      <CommandGroup>
                        {units.map((unit) => (
                          <CommandItem
                            key={unit.id}
                            onSelect={() => {
                              setLease({
                                ...lease,
                                unit_id: unit.id === lease.unit_id ? '' : unit.id,
                                unit_number: unit.id === lease.unit_id ? '' : unit.unit_name
                              });
                              setUnitOpen(false);
                            }}
                            className="flex items-center gap-2 py-3"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Check 
                                className={cn(
                                  "h-4 w-4",
                                  lease.unit_id === unit.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{unit.unit_name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {unit.beds} bed • {unit.baths} bath • {unit.size} • ${unit.marketRent}/month
                                </span>
                              </div>
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
        {lease.unit_id && (
          <motion.div
            key="lease-type-selection"
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
              <h2 className="text-lg font-bold text-center">Lease Terms</h2>
              <p className="text-center">What is the term of this lease?</p>
              <RadioGroup 
                className="grid grid-cols-2 gap-4" 
                value={lease.lease_type || ""}
                onValueChange={(value: 'fixed' | 'month-to-month') => {
                  // Clear end date when switching to month-to-month
                  if (value === 'month-to-month') {
                    setLease({...lease, lease_type: value, end_date: undefined, rollover_to_month_to_month: false});
                  } else {
                    setLease({...lease, lease_type: value});
                  }
                }}
              >
                {/* Fixed Term Radio Card */}
                <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                  <RadioGroupItem 
                    value="fixed" 
                    id="lease-fixed" 
                    className="sr-only after:absolute after:inset-0" 
                  />
                  <CalendarClock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Fixed Term</p>
                    <p className="text-xs text-muted-foreground">Set a specific start and end date for the lease</p>
                  </div>
                </label>

                {/* Month-to-Month Radio Card */}
                <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                  <RadioGroupItem 
                    value="month-to-month" 
                    id="lease-month" 
                    className="sr-only after:absolute after:inset-0" 
                  />
                  <CalendarDays className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Month-to-Month</p>
                    <p className="text-xs text-muted-foreground">Automatically renews each month until terminated</p>
                  </div>
                </label>
              </RadioGroup>

              {/* Date Selection Fields */}
              <AnimatePresence mode="sync">
                {lease.lease_type && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 pt-4"
                  >
                    <div className={cn(
                      "grid gap-4",
                      lease.lease_type === 'fixed' ? "grid-cols-2" : "grid-cols-1"
                    )}>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="start_date">Start Date <span className="text-red-500">*</span></Label>
                        <CalendarWithMonthsInput
                          value={lease.start_date}
                          onChange={(date) => setLease({...lease, start_date: date})}
                          placeholder="Select start date"
                          className="h-[42px]"
                        />
                      </motion.div>
                      
                      {lease.lease_type === 'fixed' && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2, duration: 0.2 }}
                          className="space-y-2"
                        >
                          <Label htmlFor="end_date">End Date <span className="text-red-500">*</span></Label>
                          <CalendarWithMonthsInput
                            value={lease.end_date}
                            onChange={(date) => setLease({...lease, end_date: date})}
                            placeholder="Select end date"
                            disabled={!lease.start_date}
                            minDate={lease.start_date || undefined}
                            className="h-[42px]"
                          />
                        </motion.div>
                      )}
                    </div>
                    
                    {lease.lease_type === 'fixed' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.2 }}
                        className="flex items-center space-x-2"
                      >
                        <Switch
                          id="rollover"
                          checked={lease.rollover_to_month_to_month}
                          onCheckedChange={(checked) => setLease({...lease, rollover_to_month_to_month: checked})}
                        />
                        <Label htmlFor="rollover" className="text-sm">
                          Rollover to &quot;Month to Month&quot; at the end of the term
                        </Label>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )};

  const renderTermsForm = () => (
    <div className="w-full max-w-[1200px] mx-auto space-y-8 overflow-visible">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8"
      >
        {lease.start_date && lease.start_date < new Date() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full"
          >
            <div className="flex gap-3">
              <div className="shrink-0">
                <Info className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-800">
                  It looks like you are adding a lease that has already started. We recommend charging rent in Velloa on the 1st of the following month.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-col items-center justify-center gap-2 w-full"
        >
          <Label className="text-base">When is the first rent due?</Label>
          <div className="grid gap-1.5 w-full max-w-md">
            <CalendarWithMonthsInput
              value={lease.first_rent_due_date}
              onChange={(date) => setLease({...lease, first_rent_due_date: date})}
              placeholder="Select first rent due date"
              className="h-[42px]"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-col items-center justify-center gap-2 w-full"
        >
          <Label className="text-base">How often do you charge rent?</Label>
          <div className="grid gap-1.5 w-full max-w-md">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between h-[42px]"
                >
                  {lease.payment_frequency.charAt(0).toUpperCase() + lease.payment_frequency.slice(1)}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search frequency..." />
                  <CommandEmpty>No frequency found.</CommandEmpty>
                  <CommandGroup>
                    {['monthly', 'quarterly', 'annually'].map((frequency) => (
                      <CommandItem
                        key={frequency}
                        onSelect={() => {
                          setLease({...lease, payment_frequency: frequency as PaymentFrequency});
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            lease.payment_frequency === frequency ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex flex-col items-center justify-center gap-2 w-full"
        >
          {!showAdvancedOptions ? (
            <>
              <Label className="text-base">What is the rent amount?</Label>
              <div className="relative w-full max-w-md mx-auto">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  id="rent_amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                  value={lease.rent_amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setLease({...lease, rent_amount: value});
                    }
                  }}
                  className="pl-8 w-full h-[42px]"
                />
              </div>

              
            </>
          ) : (
            <motion.div 
              initial={{ width: "400px" }}
              animate={{ width: "900px" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[900px] overflow-visible"
            >
              <div className="grid grid-cols-[2fr,2fr,1fr] gap-4 mb-2">
                <motion.div
                  initial={{ x: -800, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="col-span-2 grid grid-cols-2 gap-4"
                >
                  <Label className="text-sm text-muted-foreground">Additional Charges</Label>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                </motion.div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                </div>
              </div>
              <div className="pr-2 space-y-3">
                {lease.additional_charges.map((charge, index) => (
                  <div key={charge.id}>
                    <motion.div 
                      initial={{ x: -800, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05), ease: [0.16, 1, 0.3, 1] }}
                      className="grid grid-cols-[2fr,2fr,1fr] gap-4 items-center"
                    >
                      <div className="col-span-2 grid grid-cols-2 gap-4">
                        <Input
                          placeholder="e.g. Pet Deposit"
                          value={charge.type}
                          onChange={(e) => updateCharge(charge.id, 'type', e.target.value)}
                          className="h-[42px] w-full"
                        />
                        <Input
                          placeholder="e.g. One-time pet deposit"
                          value={charge.description}
                          onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                          className="h-[42px] w-full"
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={charge.amount}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) {
                                updateCharge(charge.id, 'amount', value);
                              }
                            }}
                            className="pl-8 h-[42px] w-full"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCharge(charge.id)}
                          className="shrink-0"
                          disabled={lease.additional_charges.length === 1}
                        >
                          <X className={cn(
                            "h-4 w-4",
                            lease.additional_charges.length === 1 ? "text-muted-foreground/40" : ""
                          )} />
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex justify-start mt-4"
              >
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={addCharge}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add another charge
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex flex-col items-center justify-center gap-2 w-full"
        >
          <div className="w-full max-w-md space-y-4 pb-16">
            <Button 
              variant={showAdvancedOptions ? "secondary" : "default"} 
              className={cn(
                "w-full h-[42px] max-w-md mx-auto",
                showAdvancedOptions ? "bg-foreground hover:bg-foreground/90 text-background" : ""
              )}
              onClick={() => handleAdvancedOptions(false)}
            >
              <Settings2 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
              {showAdvancedOptions ? "Hide advanced options" : "Show advanced options"}
            </Button>

            <Separator className="my-2" />

            <Button 
              variant="secondary" 
              className="w-full h-[42px]"
              onClick={() => setShowRentIncreaseDialog(!showRentIncreaseDialog)}
            >
              <CalendarRange className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
              Schedule Rent Increase
            </Button>

            {showRentIncreaseDialog && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-visible"
              >
                <div className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label>When would you like to increase the rent?</Label>
                    <CalendarWithMonthsInput
                      value={rentIncrease.date}
                      onChange={(date) => setRentIncrease({...rentIncrease, date: date || undefined})}
                      className="h-[42px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Increase Type</Label>
                    <RadioGroup
                      value={rentIncrease.type}
                      onValueChange={(value: 'dollar' | 'percentage') => 
                        setRentIncrease({...rentIncrease, type: value, amount: ''})}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dollar" id="dollar" />
                        <Label htmlFor="dollar">Dollar Amount</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage">Percentage</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid gap-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      {rentIncrease.type === 'dollar' && (
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                      )}
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder={rentIncrease.type === 'dollar' ? '0.00' : '0'}
                        value={rentIncrease.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            setRentIncrease({...rentIncrease, amount: value});
                          }
                        }}
                        className={cn(
                          "h-[42px]",
                          rentIncrease.type === 'dollar' ? "pl-8" : "pl-3"
                        )}
                      />
                      {rentIncrease.type === 'percentage' && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

  const renderDepositForm = () => (
    <div className="w-full max-w-[1200px] mx-auto space-y-8">
      <div className="space-y-4 w-full">
        <div className="flex flex-col items-center justify-center w-full">
          <RadioGroup 
            className="grid grid-cols-2 gap-4 max-w-md w-full" 
            value={showSecurityDeposit === null ? undefined : showSecurityDeposit ? "yes" : "no"}
            onValueChange={(value) => {
              setShowSecurityDeposit(value === "yes");
              if (value === "yes") {
                // Keep existing deposit charges if they exist, otherwise initialize with one
                setLease(prev => ({
                  ...prev,
                  security_deposit: 0,
                  deposit_charges: prev.deposit_charges.length ? prev.deposit_charges : [{
                    id: generateCustomId(12),
                    type: '',
                    description: '',
                    amount: ''
                  }]
                }));
              } else {
                setLease(prev => ({
                  ...prev,
                  security_deposit: 0,
                  deposit_charges: []
                }));
              }
            }}
          >
            <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-12 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem 
                value="yes" 
                id="deposit-yes" 
                className="sr-only after:absolute after:inset-0" 
              />
              <CircleCheck className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Yes</p>
                <p className="text-xs text-muted-foreground">Require deposit</p>
              </div>
            </label>

            <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-12 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem 
                value="no" 
                id="deposit-no" 
                className="sr-only after:absolute after:inset-0" 
              />
              <Ban className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">No</p>
                <p className="text-xs text-muted-foreground">No deposit</p>
              </div>
            </label>
          </RadioGroup>

          {/* Show message when no selection is made */}
          
          {/* Show deposit form when selection is made */}
          <AnimatePresence mode="sync">
            {showSecurityDeposit === true && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full mt-8"
              >
                {!showAdvancedDepositOptions ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="flex flex-col items-center justify-center gap-2 w-full"
                  >
                    <Label className="text-sm text-muted-foreground">What is the security deposit amount?</Label>
                    <div className="relative w-full max-w-md mx-auto">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input 
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={lease.security_deposit === 0 ? "" : lease.security_deposit.toString()}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            setLease({
                              ...lease,
                              security_deposit: value === "" ? 0 : parseFloat(value)
                            });
                          }
                        }}
                        className="pl-8 w-full h-[42px]"
                      />
                    </div>

                    <div className="mt-8 w-full max-w-md">
                      <Button 
                        variant="default"
                        className="w-full h-[42px]"
                        onClick={() => handleAdvancedOptions(true)}
                      >
                        <Settings2 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                        Show advanced options
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <motion.div 
                      initial={{ width: "400px" }}
                      animate={{ width: "900px" }}
                      exit={{ width: "400px" }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full max-w-[900px] overflow-visible mx-auto"
                    >
                      <div className="grid grid-cols-[2fr,2fr,1fr] gap-4 mb-2">
                        <motion.div
                          initial={{ x: -800, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -800, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="col-span-2 grid grid-cols-2 gap-4"
                        >
                          <Label className="text-sm text-muted-foreground">Deposit Type</Label>
                          <Label className="text-sm text-muted-foreground">Description</Label>
                        </motion.div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Amount</Label>
                        </div>
                      </div>

                      <div className="pr-2 space-y-3">
                        {lease.deposit_charges.map((charge, index) => (
                          <motion.div 
                            key={charge.id}
                            initial={{ x: -800, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 + (index * 0.05), ease: [0.16, 1, 0.3, 1] }}
                            className="grid grid-cols-[2fr,2fr,1fr] gap-4 items-center"
                          >
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                              <Input
                                placeholder="e.g. Pet Deposit"
                                value={charge.type}
                                onChange={(e) => updateDepositCharge(charge.id, 'type', e.target.value)}
                                className="h-[42px] w-full"
                              />
                              <Input
                                placeholder="e.g. Refundable pet deposit"
                                value={charge.description}
                                onChange={(e) => updateDepositCharge(charge.id, 'description', e.target.value)}
                                className="h-[42px] w-full"
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <div className="relative flex-1">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={charge.amount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*\.?\d*$/.test(value)) {
                                      updateDepositCharge(charge.id, 'amount', value);
                                    }
                                  }}
                                  className="pl-8 h-[42px]"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDepositCharge(charge.id)}
                                className="shrink-0"
                                disabled={lease.deposit_charges.length === 1}
                              >
                                <X className={cn(
                                  "h-4 w-4",
                                  lease.deposit_charges.length === 1 ? "text-muted-foreground/40" : ""
                                )} />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="flex justify-start mt-4"
                      >
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs h-auto p-0 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={addDepositCharge}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add another deposit
                        </Button>
                      </motion.div>
                    </motion.div>

                    <div className="max-w-md mx-auto">
                      <Button 
                        variant="secondary"
                        className="w-full h-[42px] bg-foreground hover:bg-foreground/90 text-background"
                        onClick={() => handleAdvancedOptions(true)}
                      >
                        <Settings2 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                        Hide additional deposits
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderLateFeeForm = () => (
    <div className="w-full max-w-[1200px] mx-auto space-y-8">
      <div className="space-y-4 w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full"
        >
          <div className="flex gap-3">
            <div className="shrink-0">
              <Info className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-800">
                Please ensure your late fee policy matches the terms listed in your actual lease agreement and complies with your province/local laws regarding late fees.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center w-full">
          <RadioGroup 
            className="grid grid-cols-2 gap-4 max-w-md w-full" 
            value={lease.late_fees.enabled === true ? "yes" : lease.late_fees.enabled === false ? "no" : undefined}
            onValueChange={(value) => {
              setLease({
                ...lease,
                late_fees: {
                  ...lease.late_fees,
                  enabled: value === "yes",
                  amount: value === "yes" ? (lease.late_fees.amount || 1) : 0
                }
              });
            }}
          >
            <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-12 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem 
                value="yes" 
                id="late-fees-yes" 
                className="sr-only after:absolute after:inset-0" 
              />
              <CircleCheck className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Yes</p>
                <p className="text-xs text-muted-foreground">Charge late fees</p>
              </div>
            </label>

            <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-12 py-6 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
              <RadioGroupItem 
                value="no" 
                id="late-fees-no" 
                className="sr-only after:absolute after:inset-0" 
              />
              <Ban className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">No</p>
                <p className="text-xs text-muted-foreground">No late fees</p>
              </div>
            </label>
          </RadioGroup>

          <AnimatePresence mode="sync">
            {lease.late_fees.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-xl mt-8"
              >
                <RadioGroup 
                  className="space-y-4" 
                  value={lease.late_fees.policy_type}
                  onValueChange={(value: 'property' | 'custom') => {
                    setLease({
                      ...lease,
                      late_fees: {
                        ...lease.late_fees,
                        policy_type: value
                      }
                    });
                  }}
                >
                  {/* Property Policy Card */}
                  <label 
                    htmlFor="policy-property"
                    className="relative block cursor-pointer"
                  >
                    <div className="relative flex items-center gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                      <RadioGroupItem
                        value="property"
                        id="policy-property"
                        className="mt-0"
                      />
                      <div className="flex grow items-center gap-3">
                        <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                          <div className="flex items-center justify-center w-8 h-8">
                            <Building2 className="size-5 text-[hsl(var(--success))]" />
                          </div>
                        </div>
                        <div className="grid grow gap-2">
                          <span className="font-medium">
                            Use Property Late Fees Policy
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Apply the standard late fees policy configured for this property
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Custom Policy Card */}
                  <label 
                    htmlFor="policy-custom"
                    className="relative block cursor-pointer"
                  >
                    <div className="relative flex items-center gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                      <RadioGroupItem
                        value="custom"
                        id="policy-custom"
                        className="mt-0"
                      />
                      <div className="flex grow items-center gap-3">
                        <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                          <div className="flex items-center justify-center w-8 h-8">
                            <Settings2 className="size-5 text-[hsl(var(--success))]" />
                          </div>
                        </div>
                        <div className="grid grow gap-2">
                          <span className="font-medium">
                            Specify Custom Late Fees Policy
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Set up a custom late fees policy specific to this lease agreement
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </RadioGroup>

                {/* Property Info Card - Only show when property policy is selected */}
                <AnimatePresence mode="sync">
                  {lease.late_fees.policy_type === 'property' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="rounded-lg border border-input bg-card p-4 shadow-sm mt-4">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                            <div className="flex items-center justify-center w-8 h-8">
                              <Home className="size-5 text-[hsl(var(--success))]" />
                            </div>
                          </div>
                          <Label className="text-base font-medium">{lease.property_name || "No property selected"}</Label>
                          {lease.property_name && (
                            <div className="ml-auto flex items-center">
                              {isLoadingLateFees ? (
                                <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1">
                                  <span className="text-xs font-medium text-muted-foreground">Loading...</span>
                                </div>
                              ) : propertyLateFeeSettings?.isEnabled ? (
                                <div className="flex items-center gap-2 rounded-md bg-[hsl(var(--success-light))] px-2 py-1">
                                  <span className="text-xs font-medium text-[hsl(var(--success))]">Policy Activated</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 rounded-md bg-red-50 px-2 py-1">
                                  <span className="text-xs font-medium text-red-600">No Active Policy</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Settings Link */}
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                        <p>You can update or change your property late fees in property settings</p>
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-primary hover:text-primary/90"
                          onClick={() => router.push(`/property/${lease.property_id}/settings?section=late-fees`)}
                        >
                          Property Settings
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Custom Policy Form */}
                <AnimatePresence mode="sync">
                  {lease.late_fees.policy_type === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 mt-6 -mx-[calc((1200px-100%)/2)] px-6 w-[1200px] pb-12"
                    >
                      <LateFeeContent
                        isEnabled={true}
                        lateFees={propertyLateFeeSettings?.lateFees || []}
                        maxDailyFeesEnabled={propertyLateFeeSettings?.maxDailyFeesEnabled || false}
                        maxMonthlyFeesEnabled={propertyLateFeeSettings?.maxMonthlyFeesEnabled || false}
                        minBalanceEnabled={propertyLateFeeSettings?.minBalanceEnabled || false}
                        applyToMostRecentEnabled={propertyLateFeeSettings?.applyToMostRecentEnabled || false}
                        applyToSpecificEnabled={propertyLateFeeSettings?.applyToSpecificEnabled || false}
                        maxDailyAmount={propertyLateFeeSettings?.maxDailyAmount || ""}
                        maxMonthlyAmount={propertyLateFeeSettings?.maxMonthlyAmount || ""}
                        minBalanceAmount={propertyLateFeeSettings?.minBalanceAmount || ""}
                        selectedChargeTypes={propertyLateFeeSettings?.selectedChargeTypes || ""}
                        onSettingsChange={async (settings) => {
                          setLease(prevLease => ({
                            ...prevLease,
                            late_fees: {
                              ...prevLease.late_fees,
                              enabled: true,
                              policy_type: 'custom',
                              // Maintain the required properties while updating with new settings
                              amount: settings.lateFees?.[0]?.amount || prevLease.late_fees.amount,
                              type: (settings.lateFees?.[0]?.type === 'Fixed' ? 'fixed' : 'percentage') as 'fixed' | 'percentage',
                              grace_period_days: settings.lateFees?.[0]?.gracePeriod || prevLease.late_fees.grace_period_days
                            }
                          }));
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const fetchPropertyLateFees = async (propertyId: string) => {
    try {
      setIsLoadingLateFees(true);
      const response = await fetch(`/api/property/${propertyId}/late-fees`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Late fees fetch error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch late fees: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched late fees:', data);
      
      setPropertyLateFeeSettings(data.late_fees || {
        isEnabled: false,
        lateFees: [],
        maxDailyFeesEnabled: false,
        maxMonthlyFeesEnabled: false,
        minBalanceEnabled: false,
        applyToMostRecentEnabled: false,
        applyToSpecificEnabled: false,
        maxDailyAmount: "",
        maxMonthlyAmount: "",
        minBalanceAmount: "",
        selectedChargeTypes: "",
        useCompanyPolicy: true
      });
    } catch (error) {
      console.error('Error fetching late fees:', error);
      toast.error('Failed to load late fee settings. Please try again.');
    } finally {
      setIsLoadingLateFees(false);
    }
  };

  // Modify the property selection handler to fetch late fees
  const handlePropertySelect = async (propertyId: string, propertyName: string) => {
    // Clear previous unit selection when changing property
    setLease({
      ...lease,
      property_id: propertyId === lease.property_id ? '' : propertyId,
      property_name: propertyId === lease.property_id ? '' : propertyName,
      unit_id: '',
      unit_number: ''
    });
    
    if (propertyId !== lease.property_id) {
      fetchUnits(propertyId);
      fetchPropertyLateFees(propertyId);
    }
    setPropertyOpen(false);
  };

  const renderDocumentsForm = () => (
    <div className="w-full max-w-[1200px] mx-auto space-y-8">
      <div className="space-y-4 w-full">
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-xl">
            {/* Document Status Selection */}
            <div className="space-y-4 mb-8">
              <Label className="text-base">Document Status</Label>
              <RadioGroup 
                className="grid grid-cols-2 gap-4" 
                value={lease.document_status}
                onValueChange={(value: 'signed' | 'not_signed') => 
                  setLease(prev => ({ ...prev, document_status: value }))
                }
              >
                <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                  <RadioGroupItem 
                    value="signed" 
                    id="doc-signed" 
                    className="sr-only after:absolute after:inset-0" 
                  />
                  <CircleCheck className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Signed</p>
                    <p className="text-xs text-muted-foreground">Documents are already signed</p>
                  </div>
                </label>

                <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                  <RadioGroupItem 
                    value="not_signed" 
                    id="doc-not-signed" 
                    className="sr-only after:absolute after:inset-0" 
                  />
                  <Lock className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Not Signed</p>
                    <p className="text-xs text-muted-foreground">Documents need signatures</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Action Selection - Only show when Not Signed is selected */}
            {lease.document_status === 'not_signed' && (
              <div className="space-y-4 mb-8">
                <Label className="text-base">What would you like to do?</Label>
                <RadioGroup 
                  className="grid grid-cols-2 gap-4" 
                  value={lease.document_action}
                  onValueChange={(value: 'draft' | 'esign') => 
                    setLease(prev => ({ ...prev, document_action: value }))
                  }
                >
                  <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                    <RadioGroupItem 
                      value="draft" 
                      id="action-draft" 
                      className="sr-only after:absolute after:inset-0" 
                    />
                    <FileText className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Save as Draft</p>
                      <p className="text-xs text-muted-foreground">Save lease for later</p>
                    </div>
                  </label>

                  <label className="relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-input px-6 py-4 text-center shadow-sm shadow-black/5 outline-offset-2 transition-colors has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring/70">
                    <RadioGroupItem 
                      value="esign" 
                      id="action-esign" 
                      className="sr-only after:absolute after:inset-0" 
                    />
                    <PenTool className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Send for eSignature</p>
                      <p className="text-xs text-muted-foreground">Get documents signed electronically</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            )}

            {/* Lease Document Upload - Only show when Signed is selected */}
            {lease.document_status === 'signed' && (
              <div className="space-y-4">
                <Label className="text-base">Upload Signed Documents</Label>
                <div className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setLease({
                          ...lease,
                          additional_documents: [...lease.additional_documents, ...Array.from(files)]
                        });
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center pt-3 pb-4">
                    <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2 mb-2">
                      <div className="flex items-center justify-center w-6 h-6">
                        <Upload className="size-4 text-[hsl(var(--success))]" />
                      </div>
                    </div>
                    <p className="mb-1 text-sm text-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX (MAX. 10MB)
                    </p>
                  </div>
                </div>

                {/* Show uploaded files */}
                {lease.additional_documents.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
                    <AnimatePresence mode="sync">
                      {lease.additional_documents.map((doc, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between p-3 border rounded-lg bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                              <FileText className="h-4 w-4 text-[hsl(var(--success))]" />
                            </div>
                            <div className="grid gap-1">
                              <p className="text-sm font-medium truncate max-w-[300px]">
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLease({
                                ...lease,
                                additional_documents: lease.additional_documents.filter((_, i) => i !== index)
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}           
          </div>
        </div>
      </div>
    </div>
  );

  const isPropertyDetailsComplete = () => {
    return lease.property_id && 
           lease.unit_id && 
           lease.lease_type && 
           lease.start_date && 
           (lease.lease_type === 'month-to-month' || lease.end_date);
  };

  const isTenantComplete = () => {
    return lease.tenants.length > 0;
  };

  const isRentComplete = () => {
    // Check if there's a valid rent amount or at least one valid advanced charge
    const hasValidRentAmount = lease.rent_amount !== '' && parseFloat(lease.rent_amount) > 0;
    const hasValidAdvancedCharge = showAdvancedOptions && 
      lease.additional_charges.some(charge => 
        charge.amount !== '' && 
        parseFloat(charge.amount) > 0 && 
        charge.type.trim() !== ''
      );

    return lease.first_rent_due_date !== undefined && 
           lease.payment_frequency !== undefined &&
           (hasValidRentAmount || hasValidAdvancedCharge);
  };

  const isSecurityDepositComplete = (showToast: boolean = false) => {
    // If nothing selected, step is incomplete
    if (showSecurityDeposit === null) {
      if (showToast) {
        toast.error('Please select whether a security deposit is required');
      }
      return false;
    }
    
    // If "No" is selected, step is complete
    if (!showSecurityDeposit) return true;

    // If "Yes" is selected, require either main deposit or at least one valid deposit charge
    const hasValidDepositAmount = lease.security_deposit > 0;
    const hasValidDepositCharge = showAdvancedDepositOptions && 
      lease.deposit_charges.some(charge => 
        charge.amount !== '' && 
        parseFloat(charge.amount) > 0 && 
        charge.type.trim() !== ''
      );

    const isComplete = hasValidDepositAmount || hasValidDepositCharge;
    
    if (!isComplete && showToast) {
      toast.error('Please enter either a security deposit amount or at least one valid deposit charge');
    }
    
    return isComplete;
  };

  const isLateFeeComplete = (showToast: boolean = false) => {
    if (lease.late_fees.enabled === null) {
      if (showToast) {
        toast.error('Please select whether to charge late fees');
      }
      return false;
    }
    
    if (lease.late_fees.enabled === false) return true;
    
    // Additional validation for when late fees are enabled
    if (lease.late_fees.enabled === true) {
      if (lease.late_fees.policy_type === 'custom' && lease.late_fees.amount <= 0) {
        if (showToast) {
          toast.error('Please specify a valid late fee amount');
        }
        return false;
      }
      return true;
    }
    
    return true;
  };

  const canAccessStep = (stepName: StepType) => {
    const stepOrder = ['intro', 'property_details', 'tenant', 'rent', 'security_deposit', 'late_fees', 'documents', 'summary'];
    const currentStepIndex = stepOrder.indexOf(step);
    const targetStepIndex = stepOrder.indexOf(stepName);

    // Can always access previous steps
    if (targetStepIndex <= currentStepIndex) return true;

    // Only validate the current step when trying to move forward
    if (targetStepIndex === currentStepIndex + 1) {
      switch (step) {
        case 'property_details':
          return isPropertyDetailsComplete();
        case 'tenant':
          return isTenantComplete();
        case 'rent':
          return isRentComplete();
        case 'security_deposit':
          return isSecurityDepositComplete(false); // Changed to false here
        case 'late_fees':
          return isLateFeeComplete(false); // Also changed this for consistency
        default:
          return true;
      }
    }

    // If trying to access a step further than the next one, check all previous steps
    if (targetStepIndex > currentStepIndex + 1) {
      // Check all steps up to the target
      for (let i = 1; i < targetStepIndex; i++) {
        switch (stepOrder[i]) {
          case 'property_details':
            if (!isPropertyDetailsComplete()) return false;
            break;
          case 'tenant':
            if (!isTenantComplete()) return false;
            break;
          case 'rent':
            if (!isRentComplete()) return false;
            break;
          case 'security_deposit':
            if (!isSecurityDepositComplete(false)) return false; // Changed to false here
            break;
          case 'late_fees':
            if (!isLateFeeComplete(false)) return false; // Also changed this for consistency
            break;
        }
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 'property_details') {
      // Validate property details
      if (!lease.property_id) {
        toast.error('Please select a property');
        return;
      }
      if (!lease.unit_id) {
        toast.error('Please select a unit');
        return;
      }
      if (!lease.lease_type) {
        toast.error('Please select a lease type');
        return;
      }
      if (!lease.start_date) {
        toast.error('Please select a start date');
        return;
      }
      if (lease.lease_type === 'fixed' && !lease.end_date) {
        toast.error('Please select an end date');
        return;
      }
    }

    if (step === 'tenant') {
      // Validate tenant selection
      if (!isTenantComplete()) {
        toast.error('Please select at least one tenant');
        return;
      }
    }

    if (step === 'rent') {
      if (!lease.first_rent_due_date) {
        toast.error('Please select when the first rent is due');
        return;
      }
      if (!lease.payment_frequency) {
        toast.error('Please select how often rent is charged');
        return;
      }

      const hasValidRentAmount = lease.rent_amount !== '' && parseFloat(lease.rent_amount) > 0;
      const hasValidAdvancedCharge = showAdvancedOptions && 
        lease.additional_charges.some(charge => 
          charge.amount !== '' && 
          parseFloat(charge.amount) > 0 && 
          charge.type.trim() !== ''
        );

      if (!hasValidRentAmount && !hasValidAdvancedCharge) {
        toast.error('Please enter either a valid rent amount or at least one valid additional charge');
        return;
      }
    }

    if (step === 'security_deposit' && !isSecurityDepositComplete(true)) {
      return;
    }

    if (step === 'late_fees' && !isLateFeeComplete(true)) {
      return;
    }

    const stepOrder = ['intro', 'property_details', 'tenant', 'rent', 'security_deposit', 'late_fees', 'documents', 'summary'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1] as StepType);
    } else {
      handleSubmit();
    }
  };

  const addDepositCharge = () => {
    const id = generateCustomId(12);
    setLease({
      ...lease,
      deposit_charges: [
        ...lease.deposit_charges,
        {
          id,
          type: '',
          description: '',
          amount: ''
        }
      ]
    });
  };

  const removeDepositCharge = (id: string) => {
    if (lease.deposit_charges.length <= 1) return;
    
    setLease({
      ...lease,
      deposit_charges: lease.deposit_charges.filter(charge => charge.id !== id)
    });
  };

  const updateDepositCharge = (id: string, field: 'type' | 'description' | 'amount', value: string) => {
    setLease({
      ...lease,
      deposit_charges: lease.deposit_charges.map(charge => 
        charge.id === id ? { ...charge, [field]: value } : charge
      )
    });
  };

  return (
    <div className="mx-auto p-6">
      <Card className="bg-card rounded-xl p-6 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Add a Lease</h1>
        </div>

        <div className="flex gap-6 flex-grow overflow-hidden">
          {/* Left Column - Steps */}
          <div className="w-72 shrink-0 border-r pr-6">
            <div className="space-y-2 sticky top-6">
              {['intro', 'property_details', 'tenant', 'rent', 'security_deposit', 'late_fees', 'documents', 'summary'].map((stepName, index) => {
                const displayNumber = index + 1;
                const stepOrder = ['intro', 'property_details', 'tenant', 'rent', 'security_deposit', 'late_fees', 'documents', 'summary'];
                const currentStepIndex = stepOrder.indexOf(step);
                const thisStepIndex = stepOrder.indexOf(stepName);
                const isCompleted = thisStepIndex < currentStepIndex;
                const isActive = step === stepName;
                const isLastStep = index === stepOrder.length - 1;
                const isAccessible = canAccessStep(stepName as StepType);

                return (
                  <div key={stepName} className="relative">
                    <div 
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-lg transition-colors",
                        isActive ? "bg-primary/10" : isAccessible ? "hover:bg-accent cursor-pointer" : "opacity-50 cursor-not-allowed bg-muted/50"
                      )}
                      onClick={() => {
                        if (isAccessible) {
                          setStep(stepName as StepType);
                        } else {
                          toast.error('Please complete property details first');
                        }
                      }}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 relative z-10",
                        isActive ? 'border-primary text-primary bg-card' :
                        isCompleted ? 'border-primary bg-primary text-background' :
                        !isAccessible ? 'border-muted-foreground/30 text-muted-foreground/30 bg-muted' :
                        'border-muted text-muted-foreground bg-card'
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4 text-background" />
                        ) : !isAccessible ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          displayNumber
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        isActive ? 'text-primary' : 
                        !isAccessible ? 'text-muted-foreground/50' :
                        isCompleted ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {stepName === 'property_details' ? 'Property Details' : 
                         stepName === 'security_deposit' ? 'Security Deposit' :
                         stepName === 'late_fees' ? 'Late Fees' :
                         stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                      </span>
                    </div>
                    {!isLastStep && (
                      <div className="absolute left-[1.55rem] top-[2.4rem] h-[2.25rem] w-0.5">
                        <div className="absolute inset-0 bg-muted rounded-full" />
                        <div className="absolute inset-0 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full w-full bg-primary rounded-full transition-transform duration-300 ease-in-out",
                              "after:absolute after:inset-0 after:bg-gradient-to-b after:from-transparent after:to-primary/20 after:animate-pulse"
                            )} 
                            style={{
                              transform: isCompleted ? 'translateY(0)' : 'translateY(-100%)'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                        Tell us about the tenant, property, and lease terms. Need help?
                      </p>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="max-w-2xl w-full mx-auto">
                        <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-3">Required Information</h3>
                          <p className="mb-4">
                            The following fields are mandatory to create a lease:
                          </p>
                          <ul className="list-disc list-inside space-y-2">
                            <li>Tenant</li>
                            <li>Property and Unit</li>
                            <li>Lease Terms (Start Date, End Date, Rent Amount)</li>
                            <li>Security Deposit</li>
                            <li>Lease Document</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : step === 'property_details' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Property Details</h2>
                      <p className="text-gray-600">Select the property and unit for this lease agreement.</p>
                    </div>

                    <div className="flex items-start justify-center">
                      <div className="max-w-md w-full mt-8">
                        {renderPropertyForm()}
                      </div>
                    </div>
                  </div>
                ) : step === 'tenant' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Tenant Information</h2>
                      <p className="text-gray-600">Select the tenant for this lease agreement.</p>
                    </div>

                    <div className="flex items-start justify-center">
                      <div className="max-w-md w-full mt-8">
                        {renderTenantForm()}
                      </div>
                    </div>
                  </div>
                ) : step === 'rent' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Rent & Charges</h2>
                      <p className="text-gray-600">Define the rent amount and any additional charges.</p>
                    </div>

                    <div className="flex items-start justify-center flex-grow">
                      <div className="w-full overflow-y-auto">
                        {renderTermsForm()}
                      </div>
                    </div>
                  </div>
                ) : step === 'security_deposit' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Security Deposit</h2>
                      <p className="text-gray-600">Are there any security deposit requirements?</p>
                    </div>

                    <div className="flex items-start justify-center flex-grow">
                      <div className="w-full overflow-y-auto">
                        {renderDepositForm()}
                      </div>
                    </div>
                  </div>
                ) : step === 'late_fees' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Late Fees</h2>
                      <p className="text-gray-600">Would you like to charge late fees for overdue rent?</p>
                    </div>

                    <div className="flex items-start justify-center flex-grow">
                      <div className="w-full overflow-y-auto">
                        {renderLateFeeForm()}
                      </div>
                    </div>
                  </div>
                ) : step === 'documents' ? (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Documents</h2>
                      <p className="text-gray-600">Upload the signed lease agreement and any additional documents.</p>
                    </div>

                    <div className="flex items-start justify-center flex-grow">
                      <div className="w-full overflow-y-auto">
                        {renderDocumentsForm()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[calc(100vh-15rem)] flex flex-col">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-2xl font-semibold">Your Lease Summary</h2>
                      <p className="text-gray-600">Review all information before creating the lease.</p>
                    </div>

                    <div className="flex items-start justify-center flex-grow">
                      <div className="w-full max-w-[600px] overflow-y-auto">
                        <div className="grid divide-y border rounded-lg bg-card">
                          {/* Property Name */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Property Name</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('property_details')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">{lease.property_name}</p>
                          </div>

                          {/* Unit Name */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Unit Name</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('property_details')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">{lease.unit_number}</p>
                          </div>

                          {/* Lease Terms */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Lease Terms</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('property_details')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">{lease.lease_type === 'fixed' ? 'Fixed Term' : 'Month-to-Month'}</p>
                          </div>

                          {/* Dates */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Dates</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('property_details')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">
                              {lease.start_date?.toLocaleDateString()} - {lease.end_date?.toLocaleDateString() || 'Ongoing'}
                            </p>
                          </div>

                          {/* Tenants */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Tenants</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('tenant')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">
                              {lease.tenants.map((tenant) => tenant.name).join(', ')}
                            </p>
                          </div>

                          {/* Rent Charges */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Rent Charges</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('rent')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">${parseFloat(lease.rent_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>

                          {/* Deposit */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Deposit</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('security_deposit')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">${lease.security_deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>

                          {/* Late Fees */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-muted-foreground text-sm">Late Fees</Label>
                              <Button
                                variant="link"
                                className="h-auto p-0 text-primary hover:text-primary/90"
                                onClick={() => setStep('late_fees')}
                              >
                                Edit
                              </Button>
                            </div>
                            <p className="mt-1">
                              {!lease.late_fees.enabled ? (
                                "No late fees"
                              ) : lease.late_fees.policy_type === 'property' ? (
                                propertyLateFeeSettings?.isEnabled ? (
                                  "Using property late fee policy"
                                ) : (
                                  "Property has no active late fee policy"
                                )
                              ) : (
                                `Custom late fee: ${lease.late_fees.type === 'fixed' ? '$' : ''}${lease.late_fees.amount || 0}${lease.late_fees.type === 'percentage' ? '%' : ''} after ${lease.late_fees.grace_period_days} days`
                              )}
                            </p>
                          </div>

                          {/* Additional Charges */}

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
                  const stepOrder = ['intro', 'property_details', 'tenant', 'rent', 'security_deposit', 'late_fees', 'documents', 'summary'];
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
              {step === 'summary' ? 'Create Lease' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 