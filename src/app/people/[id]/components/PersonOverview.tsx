'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, CircleUserRound, FileText, ClipboardList, FileSignature, ContactRound, DollarSign, List, Umbrella, UmbrellaOff, ChevronRight, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import { PersonDetails, AssigneeDetails, PropertyDetails, UnitDetails, VendorServiceAddress, WorkOrder } from '../page';


interface PersonOverviewProps {
  personDetails: PersonDetails;
  setActiveTab?: (value: string) => void;
  assigneeDetails: AssigneeDetails | null;
  properties: PropertyDetails[] | null;
  unitDetails: UnitDetails | null;
  serviceAddress: VendorServiceAddress | null;
  onAddNote?: () => void;
  outstandingBalance: number;
  workOrders: WorkOrder[];
}

function formatPhoneNumber(phone: string) {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < 10) return phone;

  if (cleaned.length === 10) {
     return `(${cleaned.slice(0, 3)})-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)})-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  }
  return phone;
}

export function PersonOverview({
    personDetails,
    setActiveTab,
    assigneeDetails,
    properties,
    unitDetails,
    serviceAddress,
    onAddNote,
    outstandingBalance,
    workOrders
}: PersonOverviewProps) {
  const router = useRouter();

  const handleNewTask = () => {
    router.push(`/tasks/add-task?person_id=${personDetails.id}&person_role=${personDetails.role}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getActiveTasksCount = () => {
    return workOrders.filter(task => 
      task.active_status === 'active' || 
      (!task.active_status && task.task_status && !isTaskCompleted(task.task_status))
    ).length;
  };

  const isTaskCompleted = (taskStatus?: Record<string, { date: string | null; value: boolean | null }>) => {
    if (!taskStatus) return false;
    
    const completionStatuses = ['Completed', 'Job Complete', 'Request-canceled'];
    return completionStatuses.some(status => 
      taskStatus[status]?.value === true
    );
  };

  const formatCategoriesDisplay = (categories: string[] | undefined) => {
    if (!categories || categories.length === 0) return { text: 'Not Set', hasMore: false, count: 0 };
    if (categories.length === 1) return { text: categories[0], hasMore: false, count: 0 };
    return { text: categories[0], hasMore: true, count: categories.length - 1 };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">What would you like to do next?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {personDetails.role === 'prospect' && (
              <>
                <Button
                  className="w-full gap-2"
                  onClick={() => setActiveTab?.("rental-application")}
                >
                  <FileText className="w-4 h-4" />
                  View Rental Application
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={handleNewTask}
                >
                  <ClipboardList className="w-4 h-4" />
                  New Task
                </Button>
                <Button className="w-full gap-2">
                  <FileSignature className="w-4 h-4" />
                  New Lease
                </Button>
              </>
            )}
            {personDetails.role === 'owner' ? (
              <>
                <Button className="w-full gap-2">
                  <FileSignature className="w-4 h-4" />
                  New Contribution
                </Button>
                <Button className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  New Distribution
                </Button>
                <Button className="w-full gap-2">
                  <ClipboardList className="w-4 h-4" />
                  New Owner Request
                </Button>
              </>
            ) : personDetails.role === 'vendor' ? (
              <>
                <Button className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  New Work Order
                </Button>
                <Button className="w-full gap-2">
                  <ClipboardList className="w-4 h-4" />
                  New Bill
                </Button>
                <Button 
                  className="w-full gap-2"
                  onClick={onAddNote}
                >
                  <FileSignature className="w-4 h-4" />
                  New Note
                </Button>
              </>
            ) : personDetails.role === 'tenant' ? (
              <>
                <Button 
                  className="w-full gap-2"
                  onClick={onAddNote}
                >
                  <FileSignature className="w-4 h-4" />
                  Add New Note
                </Button>
                <Button
                  className="w-full gap-2"
                  onClick={handleNewTask}
                >
                  <ClipboardList className="w-4 h-4" />
                  Add New Task
                </Button>
                <Button className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  Add New Bill
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {personDetails.role === 'vendor' ? (
              (() => {
                const isInsuranceActive = personDetails.insurance && 
                  new Date() <= new Date(personDetails.insurance.expiration_date);
                return isInsuranceActive ? (
                  <Umbrella className="h-6 w-6 mb-2 text-green-600" />
                ) : (
                  <UmbrellaOff className="h-6 w-6 mb-2 text-red-500" />
                );
              })()
            ) : personDetails.role === 'tenant' ? (
              <ContactRound className={`h-6 w-6 mb-2 ${personDetails.lease_contract?.tenant_portal_enabled ? 'text-green-600' : 'text-red-500'}`} />
            ) : (
              <Umbrella className={`h-6 w-6 mb-2 ${personDetails.role === 'prospect' ? 'text-blue-600' : 'text-muted-foreground'}`} />
            )}
            <p className="text-sm text-muted-foreground">
              {personDetails.role === 'vendor' ? 'Insurance Status' : personDetails.role === 'tenant' ? 'Portal Status' : 'Role'}
            </p>
            <p className="font-medium capitalize">
              {personDetails.role === 'vendor'
                ? (personDetails.insurance
                    ? (new Date() <= new Date(personDetails.insurance.expiration_date)
                        ? 'Active'
                        : 'Expired')
                    : 'Not Set')
                : personDetails.role === 'tenant'
                  ? (personDetails.lease_contract?.tenant_portal_enabled ? 'Active' : 'Inactive')
                  : personDetails.role
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {personDetails.role === 'tenant' ? (
              (() => {
                const isInsuranceRequired = personDetails.lease_contract?.renters_insurance_required;
                return isInsuranceRequired ? (
                  <Umbrella className="h-6 w-6 mb-2 text-green-600" />
                ) : (
                  <UmbrellaOff className="h-6 w-6 mb-2 text-muted-foreground" />
                );
              })()
            ) : (
              <List className="h-6 w-6 mb-2 text-blue-600" />
            )}
            <p className="text-sm text-muted-foreground">
              {personDetails.role === 'vendor' ? 'Categories' : personDetails.role === 'tenant' ? 'Lease Status' : 'Status'}
            </p>
            {personDetails.role === 'vendor' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-medium capitalize cursor-help relative inline-block">
                      {(() => {
                        const categoryDisplay = formatCategoriesDisplay(personDetails.services?.categories);
                        return (
                          <>
                            <span className={categoryDisplay.hasMore ? "pr-6" : ""}>{categoryDisplay.text}</span>
                            {categoryDisplay.hasMore && (
                              <Badge variant="secondary" className="absolute -top-1 -right-0 w-4 h-4 p-0 text-[10px] rounded-full flex items-center justify-center">
                                +{categoryDisplay.count}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      {personDetails.services?.categories?.length ? (
                        <ul className="space-y-1">
                          {personDetails.services.categories.map((category, index) => (
                            <li key={index} className="text-sm">
                              • {category}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm">No categories set</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : personDetails.role === 'tenant' ? (
              <p className="font-medium capitalize">
                {(() => {
                  if (!personDetails.lease_contract) {
                    return 'No Lease';
                  }
                  
                  const today = new Date();
                  const startDate = personDetails.lease_contract.start_date ? new Date(personDetails.lease_contract.start_date) : null;
                  const endDate = personDetails.lease_contract.end_date ? new Date(personDetails.lease_contract.end_date) : null;
                  
                  if (endDate && today > endDate) {
                    return 'Expired';
                  }
                  
                  if (startDate && today < startDate) {
                    return 'Not Started';
                  }
                  
                  return 'Active';
                })()}
              </p>
            ) : (
              <p className="font-medium capitalize">
                {personDetails.status || 'Not Set'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
             {personDetails.role === 'tenant' ? (
               (() => {
                 const isInsuranceActive = personDetails.insurance && 
                   new Date() <= new Date(personDetails.insurance.expiration_date);
                 return isInsuranceActive ? (
                   <Umbrella className="h-6 w-6 mb-2 text-green-600" />
                 ) : personDetails.insurance ? (
                   <UmbrellaOff className="h-6 w-6 mb-2 text-red-500" />
                 ) : (
                   <UmbrellaOff className="h-6 w-6 mb-2 text-muted-foreground" />
                 );
               })()
             ) : (
               <FileText className={`h-6 w-6 mb-2 ${ 
                personDetails.role === 'owner'
                  ? (personDetails.agreement_start && personDetails.agreement_end
                    ? (new Date() >= new Date(personDetails.agreement_start) && new Date() <= new Date(personDetails.agreement_end) ? 'text-green-600' : 'text-red-500')
                    : 'text-muted-foreground')
                  : personDetails.role === 'vendor'
                    ? (personDetails.services?.classifications?.length ? 'text-green-600' : 'text-muted-foreground')
                    : (personDetails.lead_source 
                      ? 'text-green-600' 
                      : 'text-muted-foreground')
              }`} />
             )}
            <p className="text-sm text-muted-foreground">
              {personDetails.role === 'owner' ? 'Agreement Status' : personDetails.role === 'vendor' ? 'Classification' : personDetails.role === 'tenant' ? 'Renter Insurance' : 'Lead Source'}
            </p>
            <p className="font-medium capitalize">
              {personDetails.role === 'owner' 
                ? (personDetails.agreement_start && personDetails.agreement_end
                    ? (new Date() >= new Date(personDetails.agreement_start) && 
                       new Date() <= new Date(personDetails.agreement_end)
                        ? 'Active'
                        : new Date() < new Date(personDetails.agreement_start)
                          ? 'Pending'
                          : 'Expired')
                    : 'Not Set')
                : personDetails.role === 'vendor'
                  ? (personDetails.services?.classifications?.[0] || 'Not Set')
                  : personDetails.role === 'tenant'
                    ? (personDetails.lease_contract?.renters_insurance_required ? 'Required' : 'Not Required')
                    : (personDetails.lead_source || 'Not Set')
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {personDetails.role === 'vendor' && (
              <>
                <ContactRound className="h-6 w-6 mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="font-medium">{getActiveTasksCount()}</p> 
              </>
            )}
            {personDetails.role !== 'owner' && personDetails.role !== 'vendor' && (
              <>
                <ContactRound className={`h-6 w-6 mb-2 ${personDetails.role === 'tenant' ? 'text-blue-600' : (assigneeDetails ? 'text-green-600' : 'text-yellow-500')}`} />
                <p className="text-sm text-muted-foreground">
                  {personDetails.role === 'tenant' ? 'Active Tasks' : 'Assigned To'}
                </p>
                <p className="font-medium">
                  {personDetails.role === 'tenant' 
                    ? getActiveTasksCount()
                    : (assigneeDetails ? `${assigneeDetails.first_name} ${assigneeDetails.last_name}` : "Not Assigned")
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            {personDetails.role === 'vendor' && (
              <>
                <DollarSign className={`h-6 w-6 mb-2 ${outstandingBalance > 0 ? 'text-red-500' : 'text-green-600'}`} />
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p 
                  className="font-medium cursor-pointer hover:text-primary transition-colors"
                  title="Click to refresh balance"
                >
                  {formatCurrency(outstandingBalance)}
                </p>
              </>
            )}
            {personDetails.role === 'owner' && (
              <>
                <DollarSign className={`h-6 w-6 mb-2 ${outstandingBalance > 0 ? 'text-red-500' : 'text-green-600'}`} />
                <p className="text-sm text-muted-foreground">Account Balance</p>
                <p 
                  className="font-medium cursor-pointer hover:text-primary transition-colors"
                  title="Click to refresh balance"
                >
                  {formatCurrency(outstandingBalance)}
                </p>
              </>
            )}
            {personDetails.role === 'tenant' && (
              <>
                <DollarSign className="h-6 w-6 mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">
                  {(() => {
                    // Get rent from lease contract
                    if (personDetails.lease_contract?.rent_amount) {
                      const rentAmount = Number(personDetails.lease_contract.rent_amount);
                      return formatCurrency(rentAmount);
                    }
                    return 'Not Set';
                  })()}
                </p>
              </>
            )}
            {personDetails.role === 'prospect' && (
              <>
                <DollarSign className="h-6 w-6 mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">Application Fee</p>
                <p className="font-medium">Paid</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CircleUserRound className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{`${personDetails.first_name} ${personDetails.last_name}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {personDetails.role === 'vendor' 
                      ? (personDetails.company || 'No company set')
                      : personDetails.role
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{personDetails.email}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{formatPhoneNumber(personDetails.phone)}</p>
                  <p className="text-sm text-muted-foreground">Phone</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">
              {(() => {
                switch (personDetails.role) {
                  case 'tenant':
                    return 'Tenant Details';
                  case 'vendor':
                    return 'Vendor Details';
                  case 'owner':
                    return 'Owner Details';
                  case 'prospect':
                    return 'Prospect Details';
                  default:
                    return 'Account Details';
                }
              })()}
            </h2>
            <div className="space-y-4">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
                onClick={() => {
                  // Get property ID based on role
                  let propertyId = null;
                  if (personDetails.role === 'prospect' && unitDetails?.property_id) {
                    propertyId = unitDetails.property_id;
                  } else if (personDetails.role === 'owner' && properties && properties.length > 0) {
                    propertyId = properties[0].id;
                  } else if (personDetails.role === 'vendor' && properties && properties.length > 0) {
                    propertyId = properties[0].id;
                  } else if (personDetails.role === 'tenant' && personDetails.lease_contract?.property?.id) {
                    propertyId = personDetails.lease_contract.property.id;
                  }
                  
                  if (propertyId) {
                    router.push(`/properties/${propertyId}`);
                  }
                }}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {(() => {
                      // For prospects, show unit property
                      if (personDetails.role === 'prospect' && unitDetails?.property) {
                        const propertyName = unitDetails.property.name;
                        const unitName = unitDetails.unit_name;
                        return `${propertyName}${unitName ? ` - Unit: ${unitName}` : ''}`;
                      }
                      // For owners, show first property if available
                      if (personDetails.role === 'owner' && properties && properties.length > 0) {
                        const property = properties[0];
                        return properties.length === 1 
                          ? property.name
                          : `${property.name} (+${properties.length - 1} more)`;
                      }
                      // For vendors, show service properties
                      if (personDetails.role === 'vendor') {
                        if (serviceAddress?.type === 'all') {
                          return 'All Properties';
                        } else if (properties && properties.length > 0) {
                          const property = properties[0];
                          return properties.length === 1 
                            ? property.name
                            : `${property.name} (+${properties.length - 1} more)`;
                        }
                      }
                      // For tenants, show property from lease contract
                      if (personDetails.role === 'tenant') {
                        const propertyName = personDetails.lease_contract?.property?.name || 'Property Name Not Found';
                        const unitName = personDetails.lease_contract?.unit?.unit_name;
                        return `${propertyName}${unitName ? ` -  ${unitName}` : ''}`;
                      }
                      return 'No Property Assigned';
                    })()}
                  </p>
                  <p className="text-sm text-muted-foreground">Property & Unit</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div 
                className={`flex items-center gap-3 ${personDetails.role === 'tenant' ? 'cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors' : ''}`}
                onClick={() => {
                  if (personDetails.role === 'tenant') {
                    router.push('/leases');
                  }
                }}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CircleUserRound className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">
                    {personDetails.role === 'tenant' ? 'Lease Agreement' : personDetails.role}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {personDetails.role === 'tenant' ? 'Lease Agreement' : 'Role'}
                  </p>
                </div>
                {personDetails.role === 'tenant' && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    
    </div>
  );
} 