"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface LeadStatusPageProps {
  onNext: () => void
  onPrevious: () => void
  initialData?: {
    leadStatus?: string;
    leadSource?: string;
    leadMedium?: string;
    assigneeId?: string;
  }
}

export default function LeadStatusPage({ onNext, onPrevious, initialData = {} }: LeadStatusPageProps) {
  const [contact, setContact] = useState({
    leadStatus: initialData.leadStatus || '',
    leadSource: initialData.leadSource || '',
    leadMedium: initialData.leadMedium || '',
    assigneeId: initialData.assigneeId || '',
  })
  
  const [companyMembers, setCompanyMembers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])
  const [companySettings, setCompanySettings] = useState<{
    leadsource?: string[];
  }>({})
  
  const [showNewSourceDialog, setShowNewSourceDialog] = useState(false)
  const [newSourceValue, setNewSourceValue] = useState('')

  // Fetch company members
  useEffect(() => {
    const fetchCompanyMembers = async () => {
      try {
        const response = await fetch('/api/company/members')
        if (!response.ok) {
          throw new Error('Failed to fetch company members')
        }
        const data = await response.json()
        setCompanyMembers(data)
      } catch (error) {
        console.error('Error fetching company members:', error)
      }
    }

    fetchCompanyMembers()
  }, [])

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/company/settings')
        if (!response.ok) {
          throw new Error('Failed to fetch company settings')
        }
        const data = await response.json()
        setCompanySettings(data)
      } catch (error) {
        console.error('Error fetching company settings:', error)
      }
    }

    fetchCompanySettings()
  }, [])

  // Load saved lead status data on component mount
  useEffect(() => {
    const savedLeadStatus = localStorage.getItem('prospectLeadStatus');
    if (savedLeadStatus) {
      try {
        const parsedData = JSON.parse(savedLeadStatus);
        setContact(prev => ({
          ...prev,
          ...parsedData
        }));
      } catch (error) {
        console.error('Error parsing saved lead status:', error);
      }
    }
  }, []);

  // Handle adding a new lead source
  const handleAddNewSource = async () => {
    if (!newSourceValue.trim()) return
    
    try {
      const response = await fetch('/api/company/settings/lead-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: newSourceValue.trim() }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add new lead source')
      }
      
      setCompanySettings(prev => ({
        ...prev,
        leadsource: [...(prev.leadsource || []), newSourceValue.trim()]
      }))
      
      setContact({ ...contact, leadSource: newSourceValue.trim() })
      setShowNewSourceDialog(false)
      setNewSourceValue('')
    } catch (error) {
      console.error('Error adding new lead source:', error)
    }
  }

  // Save lead status data when navigating away
  const handleNext = () => {
    console.log('[LeadStatusPage] Saving to localStorage:', contact);
    localStorage.setItem('prospectLeadStatus', JSON.stringify(contact));
    
    // Verify that data was saved correctly
    const savedData = localStorage.getItem('prospectLeadStatus');
    console.log('[LeadStatusPage] Verification - Data saved to localStorage:', savedData);
    
    // Mark the step as completed
    onNext();
  }

  // Check if form has changed since initial data
  useEffect(() => {
    const hasChanged = 
      contact.leadStatus !== initialData.leadStatus ||
      contact.leadSource !== initialData.leadSource ||
      contact.leadMedium !== initialData.leadMedium ||
      contact.assigneeId !== initialData.assigneeId;
    
    if (hasChanged) {
      console.log('[LeadStatusPage] Form data changed, updating localStorage');
      localStorage.setItem('prospectLeadStatus', JSON.stringify(contact));
    }
  }, [contact, initialData]);

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Lead Status</h1>
      <p className="mb-6 text-muted-foreground">Set the lead status and assign the prospect to a team member.</p>

      <Card className="overflow-hidden border shadow-sm border-border bg-background/5">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lead-status">Lead Status</Label>
            <Select 
              value={contact.leadStatus}
              onValueChange={(value) => setContact({ ...contact, leadStatus: value })}
            >
              <SelectTrigger id="lead-status" className="border-primary/70">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed-won">Closed Won</SelectItem>
                <SelectItem value="closed-lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-source">Lead Source</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="lead-source"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !contact.leadSource && "text-muted-foreground")}>
                    {contact.leadSource || "Select Source"}
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
                  <CommandInput placeholder="Search source..." />
                  <CommandList>
                    <CommandEmpty>No source found.</CommandEmpty>
                    <CommandGroup>
                      {companySettings.leadsource?.map((source) => (
                        <CommandItem
                          key={source}
                          value={source}
                          onSelect={(currentValue) => {
                            setContact({ ...contact, leadSource: currentValue === contact.leadSource ? "" : currentValue });
                          }}
                        >
                          {source}
                          {contact.leadSource === source && (
                            <Check size={16} strokeWidth={2} className="ml-auto" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start font-normal"
                        onClick={() => setShowNewSourceDialog(true)}
                      >
                        <Plus
                          size={16}
                          strokeWidth={2}
                          className="-ms-2 me-2 opacity-60"
                          aria-hidden="true"
                        />
                        Add new source
                      </Button>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-medium">Lead Medium</Label>
            <Select
              value={contact.leadMedium}
              onValueChange={(value) => setContact({ ...contact, leadMedium: value })}
            >
              <SelectTrigger id="lead-medium">
                <SelectValue placeholder="Select Medium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="walk_in">Walk-in</SelectItem>
                <SelectItem value="online_form">Online Form</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="assignee"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
                >
                  <span className={cn("truncate", !contact.assigneeId && "text-muted-foreground")}>
                    {contact.assigneeId
                      ? companyMembers.find((member) => member.id === contact.assigneeId)
                        ? `${companyMembers.find((member) => member.id === contact.assigneeId)?.first_name} ${companyMembers.find((member) => member.id === contact.assigneeId)?.last_name}`
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
                            const newAssigneeId = contact.assigneeId === member.id ? "" : member.id;
                            setContact({ ...contact, assigneeId: newAssigneeId });
                          }}
                        >
                          {member.first_name} {member.last_name}
                          {contact.assigneeId === member.id && (
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
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={handleNext}>Next</Button>
        </CardFooter>
      </Card>

      {/* Dialog for adding new lead source */}
      <Dialog open={showNewSourceDialog} onOpenChange={setShowNewSourceDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Lead Source</DialogTitle>
            <DialogDescription>
              Create a new lead source for your prospects.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newLeadSource">Lead Source Name</Label>
              <Input
                id="newLeadSource"
                placeholder="Enter lead source name"
                value={newSourceValue}
                onChange={(e) => setNewSourceValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewSource}>
              Add Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

