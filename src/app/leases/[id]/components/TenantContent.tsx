import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, User, DoorOpen, CalendarClock, Plus, Mail, Phone, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import CalendarWithMonthsInput from "@/components/calendarwithmonthsinput";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  unit?: {
    unit_number: string;
    property_name: string;
  };
}

interface TenantContentProps {
  tenant: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  start_date: string | null;
}

export function TenantContent({ tenant, start_date }: TenantContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(undefined);
  const [inviteToPortal, setInviteToPortal] = useState(true);
  const [sendWelcomeMessage, setSendWelcomeMessage] = useState(false);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tenantsPerPage = 6;
  const shouldShowTenant = start_date && new Date() >= new Date(start_date);

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid North American number (10 digits with optional country code)
    const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      const countryCode = match[1] ? '+1 ' : '';
      return `${countryCode}(${match[2]})-${match[3]}-${match[4]}`;
    }
    
    // Return original if not matching expected format
    return phone;
  };

  useEffect(() => {
    const fetchTenants = async () => {
      if (!isDialogOpen) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/people/tenants');
        if (!response.ok) {
          throw new Error('Failed to fetch tenants');
        }
        const data = await response.json();
        setAllTenants(data);
        setFilteredTenants(data);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setAllTenants([]);
        setFilteredTenants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [isDialogOpen]);

  const handleSearch = (searchValue: string) => {
    const lowercasedSearch = searchValue.toLowerCase();
    const filtered = allTenants.filter(t => 
      t.first_name.toLowerCase().includes(lowercasedSearch) || 
      t.last_name.toLowerCase().includes(lowercasedSearch)
    );
    setFilteredTenants(filtered);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredTenants.length / tenantsPerPage);
  const startIndex = (currentPage - 1) * tenantsPerPage;
  const endIndex = startIndex + tenantsPerPage;
  const currentTenants = filteredTenants.slice(startIndex, endIndex);

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setMoveInDate(new Date()); // Set default date to today
  };

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setSelectedTenant(null);
        }
      }}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Which tenant is moving in?</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {!selectedTenant ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="relative w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter tenants..."
                      className="pl-8"
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <Button size="sm" variant="default" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Tenant
                  </Button>
                </div>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Name</TableHead>
                          <TableHead>Contact Info</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentTenants.length > 0 ? (
                          currentTenants.map((t) => (
                            <TableRow key={t.id} className="cursor-pointer hover:bg-accent" onClick={() => handleTenantSelect(t)}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                                    <div className="flex items-center justify-center w-8 h-8">
                                      <User className="size-5 text-[hsl(var(--success))]" />
                                    </div>
                                  </div>
                                  <span className="font-medium">{t.first_name} {t.last_name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  {t.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">
                                        {t.email}
                                      </span>
                                    </div>
                                  )}
                                  {t.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">
                                        {formatPhoneNumber(t.phone)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                  {t.role}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              <span className="text-muted-foreground">No tenants found</span>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(endIndex, filteredTenants.length)} of {filteredTenants.length}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-4 justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-[180px] shrink-0"
                  >
                    <div className="flex flex-col items-center p-6 bg-card rounded-lg border border-[hsl(var(--success-light))] hover:border-[hsl(var(--success))] transition-colors cursor-pointer h-[160px] justify-center group relative">
                      <button 
                        onClick={() => setSelectedTenant(null)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div className="relative h-16 w-16 rounded-full overflow-hidden border border-[hsl(var(--success-light))] mb-3">
                        <div className="absolute inset-0 bg-[hsl(var(--success-light))] flex items-center justify-center">
                          <User className="h-8 w-8 text-[hsl(var(--success))]" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-center truncate w-full text-foreground">
                        {selectedTenant.first_name} {selectedTenant.last_name}
                      </p>
                    </div>
                  </motion.div>

                  <div 
                    className="w-[180px] h-[160px] border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-[hsl(var(--success))] transition-colors flex flex-col items-center justify-center shrink-0 bg-card"
                    onClick={() => setSelectedTenant(null)}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-background border border-border">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Add Tenant</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="max-w-md mx-auto">
                    <div className="space-y-2">
                      <Label>Move-in date</Label>
                      <CalendarWithMonthsInput
                        value={moveInDate}
                        onChange={(date: Date | undefined) => setMoveInDate(date)}
                        placeholder="Select move-in date"
                        className="h-[42px]"
                      />
                    </div>

                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="invite-portal">Invite to the tenant portal</Label>
                        <Switch
                          id="invite-portal"
                          checked={inviteToPortal}
                          onCheckedChange={setInviteToPortal}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="welcome-message">Send a welcome message to your tenants</Label>
                        <Switch
                          id="welcome-message"
                          checked={sendWelcomeMessage}
                          onCheckedChange={setSendWelcomeMessage}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full border rounded-lg p-4 border-dashed mt-6">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        accept=".jpg,.png,.mp4,.doc,.docx,.pdf,.xlsx,.xls"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex items-center gap-2 cursor-pointer hover:text-foreground"
                      >
                        <span>Drag files or</span>
                        <span className="text-primary">Click here</span>
                        <span>to upload</span>
                      </label>
                    </div>
                    <div className="text-xs text-center text-muted-foreground mt-2">
                      jpg, png, mp4, doc, docx, pdf, xlsx, xls, no larger than 50 MB.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                className="pl-8"
              />
            </div>
            <Button size="sm" className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <DoorOpen className="h-4 w-4" />
              Move in Tenant
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Tenant</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Tenant Portal</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant && shouldShowTenant ? (
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 bg-[hsl(var(--success-light))] rounded-lg p-2">
                        <div className="flex items-center justify-center w-8 h-8">
                          <User className="size-5 text-[hsl(var(--success))]" />
                        </div>
                      </div>
                      <span className="font-medium">
                        {tenant.first_name} {tenant.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {tenant.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {tenant.email}
                          </span>
                        </div>
                      )}
                      {tenant.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatPhoneNumber(tenant.phone)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">$0.00</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" />
                      <span className="text-sm">Active</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        More
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {!tenant ? (
                      <span className="text-muted-foreground">No tenants assigned to this lease</span>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <CalendarClock className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">Tenant&apos;s move-in date hasn&apos;t arrived yet</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 