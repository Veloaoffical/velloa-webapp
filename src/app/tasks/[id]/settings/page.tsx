'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { use } from 'react';
import { 
  Info, 
  ClipboardList, 
  Calendar as CalendarIcon, 
  Building2, 
  Users,
  AlarmClockMinus,
  AlarmClock,
  AlarmClockCheck,
  ChevronDown,
  Check,
  Archive,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CalendarWithMonthsInput from "@/components/calendarwithmonthsinput";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import CalendarWithTimeInput from "@/components/calendarwithtimeinput";
import { taskSettingsApi } from "@/app/api/tasks/settings/route";
import Link from 'next/link';

interface TaskBasicInfo {
  subject: string | null;
  description: string | null;
}

interface TaskProperties {
  status: string;
  priority: string;
}

interface Property {
  id: string;
  name: string;
  address?: string;
}

interface Unit {
  id: string;
  unit_name: string;
}

interface TaskScheduling {
  taskType: 'one_time' | 'recurring';
  dueDate: Date | null;
  frequency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  repeatInfinite?: boolean;
}

interface CompanyMember {
  id: string;
  first_name: string;
  last_name: string;
  company?: string;
}

interface Location {
  property_id: string | null;
  unit_id: string | null;
}

interface Assignees {
  assignees: string | null;
  notify_assignee: boolean;
  vendor_id: string | null;
  notify_vendor: boolean;
}

interface TaskData {
  role: string;
  owner_id: string | null;
  basicInfo: {
    subject: string | null;
    description: string | null;
  };
  taskProperties: {
    status: string;
    priority: string;
  };
  scheduling: TaskScheduling;
  location: Location;
  assignees: Assignees;
}

const settings = [
  {
    id: 'basic-info',
    icon: <Info className="w-5 h-5" />,
    label: "Basic Information",
    description: "Update the task title and description.",
  },
  {
    id: 'properties',
    icon: <ClipboardList className="w-5 h-5" />,
    label: "Task Properties",
    description: "Update status, priority, and other task properties.",
  },
  {
    id: 'scheduling',
    icon: <CalendarIcon className="w-5 h-5" />,
    label: "Scheduling",
    description: "Set due dates and scheduling preferences.",
  },
  {
    id: 'location',
    icon: <Building2 className="w-5 h-5" />,
    label: "Location",
    description: "Update property and unit assignment.",
  },
  {
    id: 'assignees',
    icon: <Users className="w-5 h-5" />,
    label: "People",
    description: "Manage task assignees/people and notifications.",
  },
  {
    id: 'delete',
    icon: <Archive className="w-5 h-5" />,
    label: "Archive Task",
    description: "Archive this task and hide it from the main task list.",
    isDelete: true
  }
];

export default function TaskSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'basic-info';
  const [basicInfo, setBasicInfo] = useState<TaskBasicInfo>({ subject: '', description: '' });
  const [taskProperties, setTaskProperties] = useState<TaskProperties>({ status: '', priority: '' });
  const [scheduling, setScheduling] = useState<TaskScheduling>({ 
    taskType: 'one_time',
    dueDate: null,
    startDate: null,
    endDate: null,
    frequency: undefined,
    repeatInfinite: false
  });
  const [loading, setLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [propertyList, setPropertyList] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [location, setLocation] = useState<Location>({
    property_id: null,
    unit_id: null
  });
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [assignees, setAssignees] = useState<Assignees>({
    assignees: null,
    notify_assignee: false,
    vendor_id: null,
    notify_vendor: false
  });
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [vendors, setVendors] = useState<CompanyMember[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [taskRole, setTaskRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(section);
  const [isClient, setIsClient] = useState(false);

  // Add hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch task data
  const fetchTaskData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const data = await taskSettingsApi.fetchTaskData(id) as TaskData;
      console.log('Task data received in settings page:', {
        id: id,
        role: data.role,
        owner_id: data.owner_id,
        property_id: data.location.property_id,
        unit_id: data.location.unit_id
      });
      
      if (data) {
        setTaskRole(data.role);
        setBasicInfo(data.basicInfo);
        setTaskProperties(data.taskProperties);
        setScheduling(data.scheduling);
        setLocation(data.location);
        setAssignees(data.assignees);

        // After we have the task data and role, fetch properties
        try {
          if (data.role === 'owner_request') {
            // For owner requests, get the owner_id from the maintenance request
            const ownerId = data.owner_id;
            console.log('Owner request detected, using owner_id:', ownerId);
            
            if (!ownerId) {
              console.log('No owner ID found for owner request');
              setPropertyList([]);
              return;
            }

            const ownerPropertiesResponse = await fetch(`/api/people/${ownerId}/properties`);
            if (!ownerPropertiesResponse.ok) {
              console.error('Failed to fetch owner properties:', await ownerPropertiesResponse.text());
              throw new Error('Failed to fetch owner properties');
            }
            const ownerProperties = await ownerPropertiesResponse.json();
            console.log('Owner properties response:', ownerProperties);
            
            // If data is an array of property_ids, fetch full property details
            if (ownerProperties.length > 0) {
              console.log('Found property IDs, fetching details for each property');
              const propertyPromises = ownerProperties.map(async ({ property_id }: { property_id: string }) => {
                console.log('Fetching details for property:', property_id);
                const propertyResponse = await fetch(`/api/property/${property_id}/propertySettings`);
                if (!propertyResponse.ok) {
                  console.error('Failed to fetch property details:', property_id, await propertyResponse.text());
                  return null;
                }
                const propertyData = await propertyResponse.json();
                console.log('Property details received:', propertyData);
                return {
                  id: propertyData.id,
                  name: propertyData.name,
                  address: [
                    propertyData.address_line_1,
                    propertyData.address_line_2,
                    [propertyData.city, propertyData.state, propertyData.zip].filter(Boolean).join(', ')
                  ].filter(Boolean).join(', ')
                };
              });
              
              const propertyDetails = (await Promise.all(propertyPromises)).filter(Boolean);
              console.log('All property details fetched:', propertyDetails);

              // Sort the properties to put the selected property first
              if (data.location.property_id) {
                const sortedProperties = propertyDetails.sort((a, b) => {
                  if (a.id === data.location.property_id) return -1;
                  if (b.id === data.location.property_id) return 1;
                  return 0;
                });
                setPropertyList(sortedProperties);
              } else {
                setPropertyList(propertyDetails);
              }
            } else {
              console.log('No properties found for owner');
              setPropertyList([]);
            }
          } else {
            console.log('Not an owner request, fetching all company properties');
            const response = await fetch('/api/property');
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Failed to fetch properties:', errorText);
              throw new Error('Failed to fetch properties');
            }
            const data = await response.json();
            console.log('All company properties:', data);
            setPropertyList(data);
          }
        } catch (error) {
          console.error('Error fetching properties:', error);
          setPropertyList([]);
        }

        if (data.location.property_id) {
          const unitsData = await taskSettingsApi.fetchUnits(data.location.property_id);
          setUnits(unitsData);
        }
      }
    } finally {
      setIsDataLoading(false);
    }
  }, [id]);

  // Fetch company members
  const fetchCompanyMembers = useCallback(async () => {
    const data = await taskSettingsApi.fetchCompanyMembers();
    setCompanyMembers(data);
  }, []);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    const data = await taskSettingsApi.fetchVendors();
    setVendors(data);
  }, []);

  // Fetch all data on mount
  useEffect(() => {
    if (id) {
      fetchTaskData();
      fetchCompanyMembers();
      fetchVendors();
    }
  }, [id, fetchTaskData, fetchCompanyMembers, fetchVendors]);

  // Handle basic info update
  const handleBasicInfoUpdate = async () => {
    setLoading(true);
    const success = await taskSettingsApi.updateBasicInfo(id, basicInfo);
    if (success) {
      await fetchTaskData();
    }
    setLoading(false);
  };

  // Handle properties update
  const handlePropertiesUpdate = async () => {
    setLoading(true);
    const success = await taskSettingsApi.updateProperties(id, taskProperties);
    if (success) {
      await fetchTaskData();
    }
    setLoading(false);
  };

  // Handle scheduling update
  const handleSchedulingUpdate = async () => {
    setLoading(true);
    const success = await taskSettingsApi.updateScheduling(id, scheduling);
    if (success) {
      await fetchTaskData();
    }
    setLoading(false);
  };

  // Handle location update
  const handleLocationUpdate = async () => {
    setLoading(true);
    const success = await taskSettingsApi.updateLocation(id, location);
    if (success) {
      await fetchTaskData();
    }
    setLoading(false);
  };

  // Handle assignees update
  const handleAssigneesUpdate = async () => {
    setLoading(true);
    const success = await taskSettingsApi.updateAssignees(id, assignees);
    if (success) {
      await fetchTaskData();
    }
    setLoading(false);
  };

  // Handle archive task
  const handleArchiveTask = async () => {
    setLoading(true);
    const success = await taskSettingsApi.archiveTask(id);
    if (success) {
      router.push('/tasks');
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <AlarmClockMinus className="h-4 w-4" />;
      case 'in_progress':
        return <AlarmClock className="h-4 w-4" />;
      case 'complete':
        return <AlarmClockCheck className="h-4 w-4" />;
      default:
        return <AlarmClockMinus className="h-4 w-4" />;
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return "text-[hsl(var(--high-light-foreground))]";
      case 'medium':
        return "text-[hsl(var(--medium-light-foreground))]";
      case 'low':
        return "text-[hsl(var(--low-light-foreground))]";
      default:
        return "";
    }
  };

  // Ensure consistent initial render between server and client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add scroll-based section highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            setActiveSection(sectionId);
          }
        });
      },
      {
        root: document.querySelector('.overflow-y-auto'),
        threshold: [0.1, 0.5, 0.8],
        rootMargin: '-100px 0px -60% 0px'
      }
    );

    // Only observe elements if we're mounted
    if (isClient && !isDataLoading) {
      settings.forEach((setting) => {
        const element = document.getElementById(setting.id);
        if (element) {
          observer.observe(element);
        }
      });
    }
      
    return () => {
      if (isClient) {
        settings.forEach((setting) => {
          const element = document.getElementById(setting.id);
          if (element) {
            observer.unobserve(element);
          }
        });
      }
    };
  }, [id, isClient, isDataLoading]);

  // Separate effect for initial section scroll
  useEffect(() => {
    if (isClient && section && !isDataLoading) {
      const element = document.getElementById(section);
      const container = document.querySelector('.overflow-y-auto');
      if (element && container) {
        const headerOffset = 100;
        const elementPosition = element.offsetTop;
        container.scrollTo({
          top: elementPosition - headerOffset,
          behavior: 'smooth'
        });
      }
    }
  }, [section, isClient, isDataLoading]);

  const renderBasicInfoForm = () => (
    <div className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={basicInfo.subject || ''}
          onChange={(e) => setBasicInfo(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Enter task title"
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={basicInfo.description || ''}
          onChange={(e) => setBasicInfo(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter task description"
          className="min-h-[150px] bg-background"
        />
      </div>
      <div className="flex justify-end">
        <Button 
          onClick={handleBasicInfoUpdate}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      <div className="border-t border-border mt-12" />
    </div>
  );

  const renderPropertiesForm = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={taskProperties.status}
            onValueChange={(value) => setTaskProperties(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger id="status" className="w-full bg-background">
              <SelectValue placeholder="Select a status">
                {taskProperties.status && (
                  <div className="flex items-center gap-2">
                    {getStatusIcon(taskProperties.status)}
                    <span>
                      {taskProperties.status === 'not_started' ? 'Not Started' :
                       taskProperties.status === 'in_progress' ? 'In Progress' :
                       taskProperties.status === 'complete' ? 'Complete' : 'Select a status'}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">
                <div className="flex items-center gap-2">
                  <AlarmClockMinus className="h-4 w-4" />
                  <span>Not Started</span>
                </div>
              </SelectItem>
              <SelectItem value="in_progress">
                <div className="flex items-center gap-2">
                  <AlarmClock className="h-4 w-4" />
                  <span>In Progress</span>
                </div>
              </SelectItem>
              <SelectItem value="complete">
                <div className="flex items-center gap-2">
                  <AlarmClockCheck className="h-4 w-4" />
                  <span>Complete</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={taskProperties.priority}
            onValueChange={(value) => setTaskProperties(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger id="priority" className="w-full bg-background">
              <SelectValue placeholder="Select a priority">
                {taskProperties.priority && (
                  <span className={getPriorityClass(taskProperties.priority)}>
                    {taskProperties.priority.charAt(0).toUpperCase() + taskProperties.priority.slice(1)}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <span className="text-[hsl(var(--low-light-foreground))]">Low</span>
              </SelectItem>
              <SelectItem value="medium">
                <span className="text-[hsl(var(--medium-light-foreground))]">Medium</span>
              </SelectItem>
              <SelectItem value="high">
                <span className="text-[hsl(var(--high-light-foreground))]">High</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handlePropertiesUpdate}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      <div className="border-t border-border mt-12" />
    </div>
  );

  const renderSchedulingForm = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Task Type</Label>
          <div className="flex gap-4">
            <div
              onClick={() => setScheduling(prev => {
                if (prev.taskType === 'one_time') return prev;
                return {
                  ...prev,
                  taskType: 'one_time',
                  dueDate: prev.dueDate,
                  frequency: undefined,
                  startDate: null,
                  endDate: null,
                  repeatInfinite: false
                };
              })}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-1",
                scheduling.taskType === 'one_time'
                  ? "border-[hsl(var(--success-light-foreground))] bg-[hsl(var(--success-light))]"
                  : "border-border hover:border-[hsl(var(--success-light))] hover:border-opacity-50"
              )}
            >
              <div className={cn(
                "font-medium mb-1",
                scheduling.taskType === 'one_time' && "text-green-600"
              )}>One-time Task</div>
              <div className="text-sm text-muted-foreground">Create a single task</div>
            </div>
            <div
              onClick={() => setScheduling(prev => {
                if (prev.taskType === 'recurring') return prev;
                return {
                  ...prev,
                  taskType: 'recurring',
                  dueDate: null,
                  frequency: undefined,
                  startDate: null,
                  endDate: null,
                  repeatInfinite: false
                };
              })}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-1",
                scheduling.taskType === 'recurring'
                  ? "border-[hsl(var(--success-light-foreground))] bg-[hsl(var(--success-light))]"
                  : "border-border hover:border-[hsl(var(--success-light))] hover:border-opacity-50"
              )}
            >
              <div className={cn(
                "font-medium mb-1",
                scheduling.taskType === 'recurring' && "text-green-600"
              )}>Recurring Task</div>
              <div className="text-sm text-muted-foreground">Schedule repeating tasks</div>
            </div>
          </div>
        </div>

        {scheduling.taskType === 'recurring' ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2">
                <Label>Frequency</Label>
              </div>
              <div className="inline-flex h-9 items-center rounded-md border border-input bg-background p-0.5 text-muted-foreground w-fit">
                {[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly', label: 'Yearly' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setScheduling(prev => ({ ...prev, frequency: item.value }))}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                      scheduling.frequency === item.value 
                        ? "bg-green-600 text-white hover:bg-green-500" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <CalendarWithMonthsInput
                  value={scheduling.startDate || undefined}
                  onChange={(date: Date | undefined) => setScheduling(prev => ({ 
                    ...prev, 
                    startDate: date || null 
                  }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="repeatInfinite"
                      checked={scheduling.repeatInfinite}
                      onCheckedChange={(checked) => setScheduling(prev => ({ 
                        ...prev, 
                        repeatInfinite: checked,
                        endDate: checked ? null : prev.endDate
                      }))}
                    />
                    <Label htmlFor="repeatInfinite" className="text-sm font-medium">
                      Repeat Forever
                    </Label>
                  </div>
                </div>
                <CalendarWithMonthsInput
                  value={scheduling.endDate || undefined}
                  onChange={(date: Date | undefined) => setScheduling(prev => ({ 
                    ...prev, 
                    endDate: date || null 
                  }))}
                  className="w-full"
                  disabled={scheduling.repeatInfinite}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="w-full">
              <CalendarWithTimeInput
                value={scheduling.dueDate || undefined}
                onChange={(date: Date | undefined) => {
                  console.log('New date selected:', date);
                  setScheduling(prev => ({
                    ...prev,
                    dueDate: date || null
                  }));
                }}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSchedulingUpdate}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      <div className="border-t border-border mt-12" />
    </div>
  );

  const renderLocationForm = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Property</Label>
          <Select
            value={location.property_id || ''}
            onValueChange={(value) => {
              setLocation(prev => ({
                ...prev,
                property_id: value,
                unit_id: null // Reset unit when property changes
              }));
              if (value) {
                fetchVendors();
              } else {
                setUnits([]);
              }
            }}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue>
                {location.property_id ? propertyList.find(p => p.id === location.property_id)?.name : "Select a property"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {propertyList.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{property.name}</span>
                    {property.address && (
                      <span className="text-xs text-muted-foreground">{property.address}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {location.property_id && (
          <div className="space-y-2">
            <Label>Unit (Optional)</Label>
            <Select
              value={location.unit_id || ''}
              onValueChange={(value) => setLocation(prev => ({ ...prev, unit_id: value }))}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {units.length === 0 ? (
                  <div className="relative flex items-center justify-center py-6 text-sm text-muted-foreground">
                    No units available
                  </div>
                ) : (
                  units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleLocationUpdate}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      <div className="border-t border-border mt-12" />
    </div>
  );

  const renderAssigneesForm = () => {
    const getAssigneeName = (memberId: string | null) => {
      if (!memberId) return "Select assignee";
      const member = companyMembers.find((m) => m.id === memberId);
      if (!member) return "Select assignee";
      return `${member.first_name} ${member.last_name}`;
    };

    const getVendorName = (vendorId: string | null) => {
      if (!vendorId) return "Select vendor";
      const vendor = vendors.find((v) => v.id === vendorId);
      if (!vendor) return "Select vendor";
      return vendor.company || `${vendor.first_name} ${vendor.last_name}`;
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assignee</Label>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assigneeOpen}
                  className="w-full h-[42px] justify-between bg-background px-3 font-normal"
                >
                  <span className={cn("truncate", !assignees.assignees && "text-muted-foreground")}>
                    {getAssigneeName(assignees.assignees)}
                  </span>
                  <ChevronDown
                    className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command className="w-full">
                  <CommandInput placeholder="Search assignee..." />
                  <CommandList>
                    <CommandEmpty>No assignee found.</CommandEmpty>
                    <CommandGroup>
                      {companyMembers.map((member) => (
                        <CommandItem
                          key={member.id}
                          value={`${member.first_name} ${member.last_name}`}
                          onSelect={() => {
                            const newAssigneeId = assignees.assignees === member.id ? null : member.id;
                            setAssignees(prev => ({ 
                              ...prev, 
                              assignees: newAssigneeId,
                              notify_assignee: newAssigneeId ? true : false // Reset notification when unselecting
                            }));
                            setAssigneeOpen(false);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{member.first_name} {member.last_name}</span>
                            {assignees.assignees === member.id && (
                              <Check className="ml-2 h-4 w-4" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {assignees.assignees && (
            <div className="flex items-center space-x-2">
              <Switch
                id="notify-assignee"
                checked={assignees.notify_assignee}
                onCheckedChange={(checked) => setAssignees(prev => ({ ...prev, notify_assignee: checked }))}
              />
              <Label htmlFor="notify-assignee">Notify assignee</Label>
            </div>
          )}

          {taskRole === 'work_order' && (
            <>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={vendorOpen}
                      className="w-full h-[42px] justify-between bg-background px-3 font-normal"
                    >
                      <span className={cn("truncate", !assignees.vendor_id && "text-muted-foreground")}>
                        {getVendorName(assignees.vendor_id)}
                      </span>
                      <ChevronDown
                        className="ml-2 h-4 w-4 shrink-0 opacity-50"
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command className="w-full">
                      <CommandInput placeholder="Search vendor..." />
                      <CommandList>
                        <CommandEmpty>No vendor found.</CommandEmpty>
                        <CommandGroup>
                          {vendors.map((vendor) => (
                            <CommandItem
                              key={vendor.id}
                              value={vendor.company || `${vendor.first_name} ${vendor.last_name}`}
                              onSelect={() => {
                                const newVendorId = assignees.vendor_id === vendor.id ? null : vendor.id;
                                setAssignees(prev => ({ 
                                  ...prev, 
                                  vendor_id: newVendorId,
                                  notify_vendor: newVendorId ? true : false // Reset notification when unselecting
                                }));
                                setVendorOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{vendor.company || `${vendor.first_name} ${vendor.last_name}`}</span>
                                {assignees.vendor_id === vendor.id && (
                                  <Check className="ml-2 h-4 w-4" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {assignees.vendor_id && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify-vendor"
                    checked={assignees.notify_vendor}
                    onCheckedChange={(checked) => setAssignees(prev => ({ ...prev, notify_vendor: checked }))}
                  />
                  <Label htmlFor="notify-vendor">Notify vendor</Label>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleAssigneesUpdate}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        <div className="border-t border-border mt-12" />
      </div>
    );
  };

  // Add renderDeleteForm function
  const renderDeleteForm = () => (
    <div className="space-y-6">
      <div className="pt-12">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-[hsl(var(--error))] text-white hover:bg-[hsl(var(--error))] hover:opacity-90"
            >
              Archive Task
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This task will be archived and hidden from the main task list. You can still access it through the task filters.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchiveTask}
                className="bg-[hsl(var(--error))] text-white hover:bg-[hsl(var(--error))] hover:opacity-90"
                disabled={loading}
              >
                {loading ? 'Archiving...' : 'Archive Task'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="border-t border-border mt-12" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] p-6">
      {!isClient || isDataLoading ? (
        <Card className="h-full overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar Skeleton */}
            <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-2">
              <div className="h-10 bg-muted animate-pulse rounded-lg" />
              <div className="border-b border-border mb-4" />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-5 h-5 rounded-md bg-muted animate-pulse" />
                  <div className="h-5 bg-muted animate-pulse rounded-md flex-1" />
                </div>
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 overflow-y-auto p-6">
              {[1, 2, 3].map((section) => (
                <div key={section} className="mb-12 last:mb-0">
                  <div className="flex items-start gap-4 mb-6 pt-12">
                    <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1">
                      <div className="h-8 bg-muted animate-pulse rounded-md w-1/4 mb-2" />
                      <div className="h-4 bg-muted animate-pulse rounded-md w-2/3" />
                    </div>
                  </div>
                  <div className="pl-12 space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded-md" />
                    <div className="h-32 bg-muted animate-pulse rounded-md" />
                    <div className="flex justify-end">
                      <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
                    </div>
                  </div>
                  <div className="border-t border-border mt-12" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="h-full overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-2">
              <Link
                href={`/tasks/${id}`}
                className="group inline-flex items-center justify-start gap-2 px-4 py-2 hover:bg-muted rounded-lg"
              >
                <ArrowLeft
                  className="-ms-1 me-2 opacity-60 transition-transform group-hover:-translate-x-0.5"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Back to Task
              </Link>
              <div className="border-b border-border mb-4" />
              {settings.map((setting) => (
                <Link
                  key={setting.id}
                  href={`/tasks/${id}/settings?section=${setting.id}`}
                  scroll={false}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg text-sm w-full text-left transition-colors",
                    activeSection === setting.id && isClient
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] hover:opacity-80",
                    setting.isDelete && "text-[hsl(var(--error))]"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(setting.id);
                    const container = document.querySelector('.overflow-y-auto');
                    if (element && container) {
                      const headerOffset = 100;
                      const elementPosition = element.offsetTop;
                      container.scrollTo({
                        top: elementPosition - headerOffset,
                        behavior: 'smooth'
                      });
                      setActiveSection(setting.id);
                      window.history.replaceState(null, '', `/tasks/${id}/settings?section=${setting.id}`);
                    }
                  }}
                >
                  {setting.icon}
                  {setting.label}
                </Link>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {settings.map((setting) => (
                <section
                  key={setting.id}
                  id={setting.id}
                  className={cn(
                    "mb-12 last:mb-0",
                    !isClient && "opacity-0"
                  )}
                >
                  <div className="flex items-start gap-4 mb-6 pt-12">
                    <div className={cn(
                      "shrink-0 rounded-lg p-2 flex items-center justify-center",
                      setting.isDelete ? 'bg-[hsl(var(--error-light))]' : 'bg-[hsl(var(--success-light))]'
                    )}>
                      {setting.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold mb-1">{setting.label}</h2>
                      <p className="text-muted-foreground">{setting.description}</p>
                    </div>
                  </div>

                  {/* Content for each section */}
                  <div className="pl-12">
                    {setting.id === 'basic-info' ? (
                      renderBasicInfoForm()
                    ) : setting.id === 'properties' ? (
                      renderPropertiesForm()
                    ) : setting.id === 'scheduling' ? (
                      renderSchedulingForm()
                    ) : setting.id === 'location' ? (
                      renderLocationForm()
                    ) : setting.id === 'assignees' ? (
                      renderAssigneesForm()
                    ) : setting.id === 'delete' ? (
                      renderDeleteForm()
                    ) : (
                      <div className="text-muted-foreground">
                        Form content for {setting.label} will go here...
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 
