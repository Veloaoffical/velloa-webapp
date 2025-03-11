'use client';

import { useState, useId, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
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
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Property {
  id: string;
  name: string;
  address?: string;
}

interface TaskForm {
  title: string;
  description: string;
  priority: string;
  status: string;
  taskType: 'one-time' | 'recurring';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: Date;
  dueDate?: Date;
  assignedTo: string;
  property: string;
  unit: string;
  notify: boolean;
}

export default function AddTaskPage() {
  const id = useId();
  const router = useRouter();
  type StepType = 'intro' | 'details' | 'attachments' | 'summary';
  const [step, setStep] = useState<StepType>('intro');
  const [task, setTask] = useState<TaskForm>({
    title: '',
    description: '',
    priority: 'low',
    status: 'in_progress',
    taskType: 'one-time',
    assignedTo: '',
    property: '',
    unit: '',
    notify: false,
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [units, setUnits] = useState<{ id: string; unit_name: string; }[]>([]);

  // Add useEffect to fetch company members
  useEffect(() => {
    const fetchCompanyMembers = async () => {
      try {
        const response = await fetch('/api/company/members');
        if (!response.ok) {
          throw new Error('Failed to fetch company members');
        }
        const data = await response.json();
        setCompanyMembers(data);
      } catch (error) {
        console.error('Error fetching company members:', error);
      }
    };

    fetchCompanyMembers();
  }, []);

  // Add useEffect to fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/property', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]); // Set empty array on error
      }
    };

    fetchProperties();
  }, []);

  const handleSubmit = async () => {
    try {
      // Add validation for recurring tasks
      if (task.taskType === 'recurring') {
        if (!task.frequency) {
          toast.error('Please select a frequency for recurring task');
          return;
        }
        if (!task.startDate) {
          toast.error('Please select a start date for recurring task');
          return;
        }
        if (!task.dueDate) {
          toast.error('Please select an end date for recurring task');
          return;
        }
        // Validate that end date is after start date
        if (task.startDate && task.dueDate && task.startDate >= task.dueDate) {
          toast.error('End date must be after start date');
          return;
        }
      }

      const taskData = {
        subject: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        task_type: task.taskType,
        Recurring_frequency: task.taskType === 'recurring' ? task.frequency : null,
        start_date: task.startDate,
        due_date: task.dueDate,
        assignees: task.assignedTo || null,
        property_id: task.property || null,
        unit_id: task.unit || null,
        notify_assignee: task.notify,
        role: 'task'
      };

      const response = await fetch('/api/tasks/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      toast.success('Task created successfully');
      router.push('/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.');
    }
  };

  const renderIntroForm = () => (
    <div className="flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
      <div className="space-y-4 mb-8">
        <h2 className="text-3xl font-bold">Add a Task</h2>
        <div className="text-lg text-gray-600">
          Create a new task to track work, maintenance, or any other activities in your property management system.
        </div>
      </div>

      <div className="bg-[hsl(var(--success-light))] text-[hsl(var(--success-light-foreground))] border-[hsl(var(--success-light-border))] p-6 rounded-lg border text-left w-full">
        <h3 className="text-lg font-semibold mb-3">Required Information</h3>
        <div className="mb-4">
          The following fields are mandatory to create a task:
        </div>
        <ul className="list-disc list-inside space-y-2">
          <li>Title</li>
          <li>Priority Level</li>
        </ul>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Subject <span className="text-red-500">*</span></Label>
          <Input 
            id="title" 
            placeholder="Enter task subject"
            value={task.title}
            onChange={(e) => setTask({...task, title: e.target.value})}
            className="h-[42px] bg-background"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={task.description}
            onChange={(e) => setTask({...task, description: e.target.value})}
            placeholder="Add task description..."
            className="min-h-[150px] bg-background"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-lg font-medium">Task Type</Label>
          <RadioGroup
            className="flex gap-8"
            value={task.taskType}
            onValueChange={(value) => setTask({...task, taskType: value as 'one-time' | 'recurring'})}
          >
            <div className="flex items-start gap-2">
              <RadioGroupItem value="one-time" id={`${id}-one-time`} aria-describedby={`${id}-one-time-description`} />
              <div className="grid gap-1">
                <Label htmlFor={`${id}-one-time`}>
                  One-time Task{" "}
                  <span className="text-xs font-normal leading-[inherit] text-muted-foreground">
                    (Single occurrence)
                  </span>
                </Label>
                <div id={`${id}-one-time-description`} className="text-xs text-muted-foreground">
                  Create a task that needs to be completed once by a specific due date.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="recurring" id={`${id}-recurring`} aria-describedby={`${id}-recurring-description`} />
              <div className="grid gap-1">
                <Label htmlFor={`${id}-recurring`}>
                  Recurring Task{" "}
                  <span className="text-xs font-normal leading-[inherit] text-muted-foreground">
                    (Repeating schedule)
                  </span>
                </Label>
                <div id={`${id}-recurring-description`} className="text-xs text-muted-foreground">
                  Set up a task that repeats on a regular schedule with defined frequency.
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {task.taskType === 'recurring' && (
          <div className="grid gap-2">
            <Label>Frequency <span className="text-red-500">*</span></Label>
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
                  onClick={() => setTask({...task, frequency: item.value as 'daily' | 'weekly' | 'monthly' | 'yearly'})}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                    task.frequency === item.value 
                      ? "bg-green-600 text-white hover:bg-green-500" 
                      : "hover:bg-muted/50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {task.taskType === 'recurring' ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn(
                      "h-[42px] justify-between text-left font-normal w-full bg-background",
                      !task.startDate && "text-muted-foreground"
                    )}
                  >
                    <span>{task.startDate ? format(task.startDate, 'PPP') : "Select start date"}</span>
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={task.startDate}
                    onSelect={(date) => setTask({...task, startDate: date})}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">End Date <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "h-[42px] justify-between text-left font-normal w-full bg-background",
                      !task.dueDate && "text-muted-foreground"
                    )}
                  >
                    <span>{task.dueDate ? format(task.dueDate, 'PPP') : "Select end date"}</span>
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={task.dueDate}
                    onSelect={(date) => setTask({...task, dueDate: date})}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
              <Select
                value={task.status}
                onValueChange={(value) => setTask({...task, status: value})}
              >
                <SelectTrigger id="status" className="h-[42px] bg-background">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dueDate"
                      variant="outline"
                      className={cn(
                        "h-[42px] justify-between text-left font-normal w-full bg-background",
                        !task.dueDate && "text-muted-foreground"
                      )}
                    >
                      <span>{task.dueDate ? format(task.dueDate, 'PPP') : "Select due date"}</span>
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={task.dueDate}
                      onSelect={(date) => setTask({...task, dueDate: date})}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                <Select
                  value={task.status}
                  onValueChange={(value) => setTask({...task, status: value})}
                >
                  <SelectTrigger id="status" className="h-[42px] bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
                <Select
                  value={task.priority}
                  onValueChange={(value) => setTask({...task, priority: value})}
                >
                  <SelectTrigger id="priority" className="h-[42px] bg-background">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="assignedTo">Assignees</Label>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="assignedTo"
                  variant="outline"
                  role="combobox"
                  aria-expanded={assigneeOpen}
                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !task.assignedTo && "text-muted-foreground")}>
                    {task.assignedTo
                      ? companyMembers.find((member) => member.id === task.assignedTo)
                        ? `${companyMembers.find((member) => member.id === task.assignedTo)?.first_name} ${companyMembers.find((member) => member.id === task.assignedTo)?.last_name}`
                        : "Select assignee"
                      : "Select assignee"}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 text-muted-foreground/80"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search assignee..." />
                  <CommandList>
                    <CommandEmpty>No assignee found.</CommandEmpty>
                    <CommandGroup>
                      {companyMembers.map((member) => (
                        <CommandItem
                          key={member.id}
                          value={`${member.first_name} ${member.last_name}`}
                          onSelect={() => {
                            const newAssigneeId = task.assignedTo === member.id ? "" : member.id;
                            setTask({ ...task, assignedTo: newAssigneeId });
                            setAssigneeOpen(false);
                          }}
                        >
                          {member.first_name} {member.last_name}
                          {task.assignedTo === member.id && (
                            <Check size={16} strokeWidth={2} className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="property">Related To</Label>
            <Popover open={propertiesOpen} onOpenChange={setPropertiesOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="property"
                  variant="outline"
                  role="combobox"
                  aria-expanded={propertiesOpen}
                  className="w-full h-[42px] justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !task.property && "text-muted-foreground")}>
                    {task.property ? properties.find(p => p.id === task.property)?.name || "Select property" : "Select property"}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className="shrink-0 text-muted-foreground/80"
                    aria-hidden="true"
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search properties..." />
                  <CommandList>
                    <CommandEmpty>No properties found.</CommandEmpty>
                    <CommandGroup>
                      {properties.map((property) => (
                        <CommandItem
                          key={property.id}
                          value={property.id}
                          onSelect={(currentValue) => {
                            const newPropertyId = currentValue === task.property ? "" : currentValue;
                            setTask(prev => ({
                              ...prev,
                              property: newPropertyId,
                              unit: "" // Reset unit when property changes
                            }));
                            setPropertiesOpen(false);
                            
                            // Fetch units when property is selected
                            if (newPropertyId) {
                              fetch(`/api/property/${newPropertyId}/units`, {
                                method: 'GET',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                credentials: 'include'
                              })
                                .then(response => {
                                  if (!response.ok) throw new Error('Failed to fetch units');
                                  return response.json();
                                })
                                .then(data => {
                                  setUnits(data);
                                })
                                .catch(error => {
                                  console.error('Error fetching units:', error);
                                  setUnits([]);
                                });
                            } else {
                              setUnits([]); // Clear units when no property is selected
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <span>{property.name}</span>
                            {property.address && (
                              <span className="text-xs text-muted-foreground">{property.address}</span>
                            )}
                          </div>
                          {task.property === property.id && (
                            <Check size={16} strokeWidth={2} className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unit">Unit (Optional)</Label>
            <Select
              value={task.unit}
              onValueChange={(value) => setTask({...task, unit: value})}
              disabled={!task.property}
            >
              <SelectTrigger 
                id="unit" 
                className={cn(
                  "h-[42px] bg-background",
                  !task.property && "opacity-50 cursor-not-allowed"
                )}
              >
                <SelectValue placeholder="Select unit" />
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

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Notify Assignee(s)</Label>
            <div className="flex items-center gap-2 h-[42px]">
              <Switch 
                id={`${id}-notify`}
                checked={task.notify}
                onCheckedChange={(checked) => setTask({...task, notify: checked})}
                aria-label="Notify assignee and related"
              />
              <Label htmlFor={`${id}-notify`} className="text-sm font-medium">
                {task.notify ? "On" : "Off"}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignmentForm = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="text-xl font-semibold">Add Attachments</div>
        <div className="text-sm text-gray-600">Upload any relevant files or documents for this task</div>
      </div>

      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Drag & drop files here or click to browse</div>
            <div className="text-xs text-muted-foreground">
              Upload any files that are relevant to this task. Maximum file size: 10MB
            </div>
          </div>
          <Button variant="outline" size="sm">
            Choose Files
          </Button>
        </div>
      </div>

      <div className="border rounded-lg divide-y">
        {/* This will be populated with uploaded files */}
        <div className="p-4 text-center text-sm text-muted-foreground">
          No files uploaded yet
        </div>
      </div>
    </div>
  );

  const renderSummaryForm = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="text-xl font-semibold">Review Task Information</div>
        <div className="text-sm text-gray-600">Please review all the information before creating the task</div>
      </div>

      <div className="grid gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Task Details</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={task.title} className="h-[42px] bg-muted" disabled />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={task.description} className="bg-muted" disabled />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Input 
                value={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} 
                className="h-[42px] bg-muted" 
                disabled 
              />
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input 
                value={task.dueDate ? format(task.dueDate, 'PPP') : 'No due date'} 
                className="h-[42px] bg-muted" 
                disabled 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Assignment Details</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Assigned To</Label>
              <Input 
                value={task.assignedTo 
                  ? companyMembers.find(member => member.id === task.assignedTo)
                    ? `${companyMembers.find(member => member.id === task.assignedTo)?.first_name} ${companyMembers.find(member => member.id === task.assignedTo)?.last_name}`
                    : 'Unassigned'
                  : 'Unassigned'} 
                className="h-[42px] bg-muted" 
                disabled 
              />
            </div>
            <div className="grid gap-2">
              <Label>Property</Label>
              <Input 
                value={task.property 
                  ? properties.find(p => p.id === task.property)?.name || 'No property'
                  : 'No property'} 
                className="h-[42px] bg-muted" 
                disabled 
              />
            </div>
            {task.property && (
              <div className="grid gap-2">
                <Label>Unit</Label>
                <Input 
                  value={task.unit 
                    ? units.find(u => u.id === task.unit)?.unit_name || 'No unit'
                    : 'No unit'} 
                  className="h-[42px] bg-muted" 
                  disabled 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto p-6">
      <div className="bg-card rounded-xl p-16 min-h-[calc(100vh-3rem)] flex flex-col shadow-sm border">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-semibold">Add a Task</h1>
          </div>

          {/* Progress Steps */}
          <div className="w-full mx-auto mb-8">
            <div className="flex justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-[1px] bg-muted">
                <div className={cn(
                  "h-full bg-green-600 transition-all duration-300",
                  step === 'intro' ? 'w-[12%]' :
                  step === 'details' ? 'w-[38%]' :
                  step === 'attachments' ? 'w-[62%]' :
                  step === 'summary' ? 'w-[88%]' :
                  'w-full'
                )}/>
              </div>

              {/* Steps */}
              <div className="relative flex justify-between w-full">
                {['intro', 'details', 'attachments', 'summary'].map((stepName, index) => {
                  const displayNumber = index + 1;
                  const stepOrder = ['intro', 'details', 'attachments', 'summary'];
                  const currentStepIndex = stepOrder.indexOf(step);
                  const thisStepIndex = stepOrder.indexOf(stepName);
                  const isCompleted = thisStepIndex < currentStepIndex;
                  const isActive = step === stepName;

                  return (
                    <div key={stepName} className="relative flex flex-col items-center" style={{ width: 'calc(100% / 4)' }}>
                      <div className={cn(
                        "w-7 h-7 rounded-full border flex items-center justify-center bg-background text-xs font-medium",
                        isActive ? 'border-green-600 text-green-600' :
                        isCompleted ? 'border-green-600 bg-green-600' :
                        'border-muted text-muted-foreground'
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          displayNumber
                        )}
                      </div>
                      <span className={cn(
                        "mt-1 text-[10px] font-medium whitespace-nowrap",
                        (isActive || isCompleted) ? 'text-green-600' : 'text-muted-foreground'
                      )}>
                        {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1">
            {step === 'intro' && renderIntroForm()}
            {step === 'details' && renderDetailsForm()}
            {step === 'attachments' && renderAssignmentForm()}
            {step === 'summary' && renderSummaryForm()}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-auto pt-8">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'details') setStep('intro');
              if (step === 'attachments') setStep('details');
              if (step === 'summary') setStep('attachments');
            }}
            disabled={step === 'intro'}
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (step === 'intro') {
                setStep('details');
              } else if (step === 'details') {
                if (!task.title || !task.priority) {
                  toast.error('Please fill in all required fields');
                  return;
                }
                if (task.taskType === 'recurring' && !task.frequency) {
                  toast.error('Please select a frequency for recurring task');
                  return;
                }
                setStep('attachments');
              } else if (step === 'attachments') {
                setStep('summary');
              } else {
                handleSubmit();
              }
            }}
          >
            {step === 'summary' ? 'Create Task' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
} 