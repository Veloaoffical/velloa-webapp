'use client';

import { useState, useEffect } from 'react';
import { Check, DollarSign, ChevronsUpDown, CalendarClock, CalendarDays, Plus, Search, User, Mail, Phone, X,CircleCheck,Ban, MessageSquareMore, ShieldAlert, Settings2, CalendarRange, Info, Building2, Home } from "lucide-react";
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
    enabled: boolean;
    policy_type: 'property' | 'custom';
    amount: number;
    type: 'fixed' | 'percentage';
    grace_period_days: number;
  };
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

type StepType = 'intro' | 'property_details' | 'tenant' | 'rent' | 'security_deposit' | 'late_fees' | 'documents' | 'summary';
type PaymentFrequency = 'monthly' | 'quarterly' | 'annually';

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
  const [lease, setLease] = useState<LeaseForm>({
    tenants: [],
    property_id: '',
    property_name: '',
    unit_id: '',
    unit_number: '',
    start_date: undefined,
    end_date: undefined,
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
      enabled: false,
      policy_type: 'property',
      amount: 0,
      type: 'fixed',
      grace_period_days: 0
    },
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
      // TODO: Implement lease creation API call
      const response = await fetch('/api/leases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lease)
      });

      if (!response.ok) {
        throw new Error('Failed to create lease');
      }

      toast.success('Lease has been created successfully', {
        description: 'You will be redirected to the leases page'
      });
      
      setTimeout(() => {
        router.push('/leases');
      }, 2000);

    } catch (error) {
      console.error('Error creating lease:', error);
      toast.error('Failed to create lease. Please try again.');
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
      if (!showAdvancedDepositOptions && lease.additional_charges.length === 0) {
        // Add initial charge only when needed
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
    } else {
      setShowAdvancedOptions(!showAdvancedOptions);
      if (!showAdvancedOptions && lease.additional_charges.length === 0) {
        // Add initial charge only when needed
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
                        onSelect={() => {
                          // Clear previous unit selection when changing property
                          setLease({
                            ...lease,
                            property_id: property.id === lease.property_id ? '' : property.id,
                            property_name: property.id === lease.property_id ? '' : property.name,
                            unit_id: '',
                            unit_number: ''
                          });
                          if (property.id !== lease.property_id) {
                            fetchUnits(property.id);
                          }
                          setPropertyOpen(false);
                        }}
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
                  <PopoverContent className="w-full p-0">
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
                          >
                            <div className="flex items-center gap-2">
                              <Check 
                                className={cn(
                                  "h-4 w-4",
                                  lease.unit_id === unit.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{unit.unit_name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {unit.beds} bed • {unit.baths} bath • {unit.size}
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
              value={lease.start_date}
              onChange={(date) => setLease({...lease, start_date: date})}
              placeholder="Select start date"
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

              <div className="mt-8">
                <Label className="text-base">What is the security deposit?</Label>
                <div className="relative w-full max-w-md mx-auto mt-2">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="security_deposit"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    required
                    value={lease.security_deposit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setLease({...lease, security_deposit: parseFloat(value) || 0});
                      }
                    }}
                    className="pl-8 w-full h-[42px]"
                  />
                </div>
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
          <div className="w-full max-w-md space-y-4">
            <Button 
              variant={showAdvancedOptions ? "secondary" : "default"} 
              className={cn(
                "w-full h-[42px]",
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
                <div className="space-y-4 pt-4 pb-6">
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
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRentIncrease({
                          type: 'dollar',
                          amount: '',
                          date: undefined
                        });
                        setShowRentIncreaseDialog(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        // TODO: Handle rent increase scheduling
                        setShowRentIncreaseDialog(false);
                        toast.success('Rent increase scheduled');
                      }}
                      disabled={!rentIncrease.date || !rentIncrease.amount}
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );



  const renderLateFeeForm = () => (
    <div className="w-full max-w-[1200px] mx-auto space-y-8 flex flex-col items-center">
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
            defaultValue="no"
            value={lease.late_fees.enabled ? "yes" : "no"}
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
                className="w-full max-w-xl mt-8 space-y-6"
              >
                <RadioGroup 
                  className="gap-4" 
                  value={lease.late_fees.policy_type}
                  onValueChange={(value: 'property' | 'custom') => 
                    setLease({
                      ...lease,
                      late_fees: {
                        ...lease.late_fees,
                        policy_type: value
                      }
                    })}
                >
                  {/* Property Policy Card */}
                  <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                    <RadioGroupItem
                      value="property"
                      id="policy-property"
                      className="order-1 after:absolute after:inset-0"
                    />
                    <div className="flex grow items-start gap-3">
                      <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                        <div className="flex items-center justify-center w-8 h-8">
                          <Building2 className="size-5 text-[hsl(var(--success))]" />
                        </div>
                      </div>
                      <div className="grid grow gap-2">
                        <Label htmlFor="policy-property">
                          Use Property Late Fees Policy
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Apply the standard late fees policy configured for this property.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Policy Card */}
                  <div className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                    <RadioGroupItem
                      value="custom"
                      id="policy-custom"
                      className="order-1 after:absolute after:inset-0"
                    />
                    <div className="flex grow items-center gap-3">
                      <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                        <div className="flex items-center justify-center w-8 h-8">
                          <Settings2 className="size-5 text-[hsl(var(--success))]" />
                        </div>
                      </div>
                      <div className="grid grow gap-2">
                        <Label htmlFor="policy-custom">
                          Specify Custom Late Fees Policy
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Set up a custom late fees policy specific to this lease agreement.
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                {/* Property Info Card */}
                <div className="w-full rounded-lg border border-input bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                      <div className="flex items-center justify-center w-8 h-8">
                        <Home className="size-5 text-[hsl(var(--success))]" />
                      </div>
                    </div>
                    <Label className="text-base font-medium">{lease.property_name || "No property selected"}</Label>
                    {lease.property_name && (
                      <div className="ml-auto flex items-center">
                        <div className="flex items-center gap-2 rounded-md bg-[hsl(var(--success-light))] px-2 py-1">
                          <span className="text-xs font-medium text-[hsl(var(--success))]"> Policy Activated</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rest of the custom policy form */}
                <AnimatePresence mode="sync">
                  {lease.late_fees.policy_type === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 mt-6"
                    >
                      <div className="grid gap-2">
                        <Label>Late Fee Type</Label>
                        <RadioGroup
                          value={lease.late_fees.type}
                          onValueChange={(value: 'fixed' | 'percentage') => 
                            setLease({
                              ...lease,
                              late_fees: {
                                ...lease.late_fees,
                                type: value,
                                amount: 0
                              }
                            })}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed">Fixed Amount</Label>
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
                          {lease.late_fees.type === 'fixed' && (
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                          )}
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder={lease.late_fees.type === 'fixed' ? '0.00' : '0'}
                            value={lease.late_fees.amount || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) {
                                setLease({
                                  ...lease,
                                  late_fees: {
                                    ...lease.late_fees,
                                    amount: parseFloat(value) || 0
                                  }
                                });
                              }
                            }}
                            className={cn(
                              "h-[42px]",
                              lease.late_fees.type === 'fixed' ? "pl-8" : "pl-3"
                            )}
                          />
                          {lease.late_fees.type === 'percentage' && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              %
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Grace Period (Days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={lease.late_fees.grace_period_days}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 0) {
                              setLease({
                                ...lease,
                                late_fees: {
                                  ...lease.late_fees,
                                  grace_period_days: value
                                }
                              });
                            }
                          }}
                          className="h-[42px]"
                        />
                      </div>
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

                return (
                  <div key={stepName} className="relative">
                    <div 
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isActive ? "bg-primary/10" : "hover:bg-accent"
                      )}
                      onClick={() => setStep(stepName as StepType)}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 relative z-10",
                        isActive ? 'border-primary text-primary bg-card' :
                        isCompleted ? 'border-primary bg-primary text-background' :
                        'border-muted text-muted-foreground bg-card'
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4 text-background" />
                        ) : (
                          displayNumber
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        (isActive || isCompleted) ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {stepName === 'property_details' ? 'Property Details' : 
                         stepName === 'security_deposit' ? 'Security Deposit' :
                         stepName === 'late_fees' ? 'Late Fees' :
                         stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                      </span>
                    </div>
                    {!isLastStep && (
                      <div className="absolute left-[1.55rem] top-[2.4rem] h-[2.25rem] w-0.5">
                        {/* Background track */}
                        <div className="absolute inset-0 bg-muted rounded-full" />
                        {/* Animated fill */}
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
                        {renderLateFeeForm()}
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
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">Review & Submit</h2>
                      <p className="text-gray-600">Review all information before creating the lease.</p>
                    </div>
                    <div className="grid gap-8">
                      {/* TODO: Add summary sections */}
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
            <Button
              onClick={() => {
                const stepOrder = ['intro', 'property_details', 'tenant', 'rent', 'security_deposit', 'late_fees', 'documents', 'summary'];
                const currentIndex = stepOrder.indexOf(step);
                if (currentIndex < stepOrder.length - 1) {
                  setStep(stepOrder[currentIndex + 1] as StepType);
                } else {
                  handleSubmit();
                }
              }}
            >
              {step === 'summary' ? 'Create Lease' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
} 