"use client"

import React, { useMemo, useState, useId } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button as ButtonUI } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, FileSpreadsheet, Printer, RefreshCw, SlidersHorizontal, X, ChevronLeftIcon, ChevronRightIcon, Plus, DollarSign, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { RangeCalendar } from "@/components/ui/calendar-rac";
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac";
import { Button, DateRangePicker, Dialog, Group, Popover } from "react-aria-components";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { cn } from "@/lib/utils";
import { format, parseISO, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';


// Types for charges data structure
interface ChargeAmount {
  lines: Array<{
    amount: number;
    line_id: string;
    category_id: string;
    description: string;
  }>;
  total_amount: number;
  accounts_receivable_id?: string;
}

interface Charge {
  id: string;
  charge_type: string;
  charge_amount: ChargeAmount;
  status: string;
  due_date: string;
  lease_id: string | null;
  people_id: string | null;
  created_at: string;
  start_date?: string;
  bill_date?: string;
  frequency?: string;
  memo?: Record<string, unknown> | null;
  reference?: string;
}

interface Account {
  id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
}

interface Person {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  company?: string | null;
}



interface LeaseDetails {
  id: string;
  rent_amount: string | null;
  payment_frequency: string | null;
  first_rent_due_day: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface LeaseRentContentProps {
  leaseDetails: LeaseDetails;
  charges: Charge[];
  accounts: Account[];
  people: Person[];
}

export function LeaseRentContent({ 
  leaseDetails, 
  charges, 
  accounts, 
  people 
}: LeaseRentContentProps) {
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [beginningBalance] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const tableId = useId();
  
  const currentDateTime = new Date();

  // Date range functions
  const getDateRangeForPeriod = (period: string) => {
    switch (period) {
      case 'day':
        return {
          start: parseDate(format(currentDateTime, "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      case 'last-7-days':
        return {
          start: parseDate(format(subDays(currentDateTime, 7), "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      case 'last-30-days':
        return {
          start: parseDate(format(subDays(currentDateTime, 30), "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      case 'month':
        return {
          start: parseDate(format(startOfMonth(currentDateTime), "yyyy-MM-dd")),
          end: parseDate(format(endOfMonth(currentDateTime), "yyyy-MM-dd"))
        }
      case 'year':
        return {
          start: parseDate(format(startOfYear(currentDateTime), "yyyy-MM-dd")),
          end: parseDate(format(endOfYear(currentDateTime), "yyyy-MM-dd"))
        }
      case 'all-time':
        return {
          start: parseDate("1970-01-01"),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      default:
        return {
          start: parseDate("1970-01-01"),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
    }
  }

  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [dateRange, setDateRange] = useState(getDateRangeForPeriod('all-time'));

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      setDateRange(getDateRangeForPeriod(period));
    }
  }

  const toggleCharge = (id: string) => {
    const newSelected = new Set(selectedCharges)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCharges(newSelected)
  }

  // Find rental income account ID
  const rentalIncomeAccount = accounts.find(
    account => account.account_name === 'Rental Income' || 
               account.account_subtype === 'Income' ||
               account.account_name.toLowerCase().includes('rent')
  );

  // Filter charges to only include rent-related ones for this lease
  const filteredCharges = useMemo(() => {
    return charges.filter(charge => {
      // Must be associated with this lease
      if (charge.lease_id !== leaseDetails.id) return false;
      
      // Must be a charge type (not bill, expense, etc.)
      if (charge.charge_type !== 'charge') return false;

      // Date range filter
      if (dateRange && dateRange.start && dateRange.end) {
        const chargeDateStr = charge.due_date || charge.created_at;
        if (!chargeDateStr) return false;
        try {
            const chargeDate = parseDate(chargeDateStr.split('T')[0]);
            if (chargeDate.compare(dateRange.start) < 0 || chargeDate.compare(dateRange.end) > 0) {
                return false;
            }
        } catch (e) {
            console.error("Error parsing charge date:", e);
            return false;
        }
      }
      
      // Check if any line item is rent-related
      const hasRentLine = charge.charge_amount?.lines?.some(line => {
        // Check if category matches rental income account
        if (rentalIncomeAccount && line.category_id === rentalIncomeAccount.id) return true;
        
        // Check description for rent-related keywords
        const description = line.description?.toLowerCase() || '';
        return description.includes('rent') || 
               description.includes('rental') ||
               description.includes('monthly payment');
      });
      
      return hasRentLine;
    });
  }, [charges, leaseDetails.id, rentalIncomeAccount, dateRange]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredCharges.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCharges = filteredCharges.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination functions
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const downloadFileSpreadsheet = () => {
    const headers = ['Date', 'Type', 'Account', 'Tenant', 'Status', 'Reference', 'Amount', 'Updated At'];
    const csvContent = [
      headers.join(','),
      ...filteredCharges.map((charge: Charge) => {
        const person = people.find(p => p.id === charge.people_id);
        const personName = person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : 'Unknown';
        const rentalAccount = accounts.find(a => 
          charge.charge_amount?.lines?.some((line: { category_id: string }) => line.category_id === a.id)
        );
        
        return [
          format(parseISO(charge.due_date || charge.created_at), 'MM/dd/yyyy'),
          'Rent Charge',
          rentalAccount?.account_name || 'Rental Income',
          personName,
          charge.status,
          charge.reference || '',
          charge.charge_amount?.total_amount || 0,
          charge.created_at
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rent-charges-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: 'default' as const, label: 'Paid' },
      unpaid: { variant: 'destructive' as const, label: 'Unpaid' },
      pending: { variant: 'secondary' as const, label: 'Pending' },
      overdue: { variant: 'destructive' as const, label: 'Overdue' },
      partial: { variant: 'secondary' as const, label: 'Partial' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculate totals
  const totalAmount = filteredCharges.reduce((sum, charge) => sum + (charge.charge_amount?.total_amount || 0), 0);

  // Calculate running balance including beginning balance
  const calculateRunningBalance = (charge: Charge, index: number) => {
    const chargesUpToIndex = filteredCharges.slice(0, index + 1);
    const runningTotal = chargesUpToIndex.reduce((sum, c) => {
      return sum + (c.charge_amount?.total_amount || 0);
    }, beginningBalance);

    return runningTotal;
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    // Amount Due - sum of all unpaid charges that are due
    const amountDue = filteredCharges
      .filter(charge => 
        charge.status === 'unpaid' || charge.status === 'overdue'
      )
      .reduce((sum, charge) => sum + (charge.charge_amount?.total_amount || 0), 0);
    
    // Next Charge Amount - next upcoming charge based on lease details
    const nextChargeAmount = parseFloat(leaseDetails.rent_amount || '0');
    
    // Missed Payments - count of overdue charges
    const missedPayments = filteredCharges
      .filter(charge => charge.status === 'overdue')
      .length;
    
    return {
      amountDue,
      nextChargeAmount,
      missedPayments
    };
  }, [filteredCharges, leaseDetails.rent_amount]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(summaryMetrics.amountDue)}
                </div>
                <div className="text-sm text-muted-foreground">Amount Due</div>
              </div>
              <div className="text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(summaryMetrics.nextChargeAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Next Charge Amount</div>
              </div>
              <div className="text-muted-foreground">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center h-full p-6">
            <div className="flex gap-2 w-full">
              <ButtonUI 
                className="flex-1 text-sm rounded-lg" 
                variant="outline"
                onClick={() => {
                  // Handle new charge
                  console.log('New charge')
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Charge
              </ButtonUI>
              <ButtonUI 
                className="flex-1 text-sm rounded-lg" 
                variant="outline"
                onClick={() => {
                  // Handle print charges
                  window.print()
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Charges
              </ButtonUI>
              <ButtonUI 
                className="flex-1 text-sm rounded-lg" 
                variant="outline"
                onClick={downloadFileSpreadsheet}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export
              </ButtonUI>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Filters */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select 
                  value={selectedPeriod}
                  onValueChange={handlePeriodChange}
                >
                  <SelectTrigger className={cn(dateInputStyle, "w-[180px]")}>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                    <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                <DateRangePicker 
                  className="flex items-center gap-2"
                  value={dateRange}
                  onChange={(newRange) => {
                    if (newRange?.start && newRange?.end) {
                      setDateRange(newRange as { start: CalendarDate; end: CalendarDate })
                      setSelectedPeriod('custom')
                    }
                  }}
                >
                  <div className="flex">
                    <Group className={cn(dateInputStyle, "pe-9")}>
                      <DateInput slot="start" unstyled />
                      <span aria-hidden="true" className="px-2 text-muted-foreground/70">
                        -
                      </span>
                      <DateInput slot="end" unstyled />
                    </Group>
                    <Button className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70">
                      <CalendarIcon size={16} strokeWidth={2} />
                    </Button>
                  </div>
                  <Popover
                    className="z-50 rounded-lg border border-border bg-background text-popover-foreground shadow-lg shadow-black/5 outline-none data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2"
                    offset={4}
                  >
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                      <RangeCalendar 
                        value={dateRange} 
                        onChange={(newRange) => {
                          if (newRange?.start && newRange?.end) {
                            setDateRange(newRange as { start: CalendarDate; end: CalendarDate })
                            setSelectedPeriod('custom')
                          }
                        }}
                      />
                    </Dialog>
                  </Popover>
                </DateRangePicker>

                <Select>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ButtonUI 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(dateInputStyle, "w-9 h-9 p-0", showFilters && "bg-muted")}
                      >
                        {showFilters ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <SlidersHorizontal className="h-4 w-4" />
                        )}
                      </ButtonUI>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showFilters ? 'Hide filters' : 'Show filters'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex-1" />
                
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ButtonUI 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.location.reload()} 
                          className={cn(dateInputStyle, "w-9 h-9 p-0")}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh page</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200 fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out-0">
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Accounts</SelectLabel>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts.filter(a => a.account_name.toLowerCase().includes('rent') || a.account_subtype === 'Income').map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tenants</SelectLabel>
                        <SelectItem value="all">All Tenants</SelectItem>
                        {people.filter(p => p.role === 'tenant').map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {`${tenant.first_name || ''} ${tenant.last_name || ''}`.trim()}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Status</SelectLabel>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border-b"></div>
          </div>

          {/* Table */}
          <div className="space-y-2 overflow-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">
                    <Checkbox 
                      id={tableId}
                      checked={selectedCharges.size === currentCharges.length && currentCharges.length > 0}
                      onCheckedChange={() => {
                        if (selectedCharges.size === currentCharges.length && currentCharges.length > 0) {
                          // Deselect all current page items
                          const newSelected = new Set(selectedCharges)
                          currentCharges.forEach(t => newSelected.delete(t.id))
                          setSelectedCharges(newSelected)
                        } else {
                          // Select all current page items
                          const newSelected = new Set(selectedCharges)
                          currentCharges.forEach(t => newSelected.add(t.id))
                          setSelectedCharges(newSelected)
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Account</TableHead>
                  <TableHead className="whitespace-nowrap">Tenant</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Reference</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm text-muted-foreground">No rent charges found for this lease.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentCharges.map((charge: Charge, index) => {
                    const person = people.find(p => p.id === charge.people_id);
                    const personName = person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : 'Unknown';
                    const rentalAccount = accounts.find(a => 
                      charge.charge_amount?.lines?.some((line: { category_id: string }) => line.category_id === a.id)
                    );
                    
                    return (
                      <TableRow key={charge.id} className="has-[[data-state=checked]]:bg-muted/50">
                        <TableCell className="whitespace-nowrap">
                          <Checkbox 
                            id={`table-checkbox-${charge.id}`}
                            checked={selectedCharges.has(charge.id)}
                            onCheckedChange={() => toggleCharge(charge.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(parseISO(charge.due_date || charge.created_at), 'MM/dd/yyyy')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">Rent Charge</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {rentalAccount?.account_name || 'Rental Income'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{personName}</TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(charge.status)}</TableCell>
                        <TableCell className="whitespace-nowrap">{charge.reference || '-'}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(charge.charge_amount?.total_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(calculateRunningBalance(charge, indexOfFirstItem + index))}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableFooter className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="whitespace-nowrap">Total</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(beginningBalance + totalAmount)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                   
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            
            {/* Pagination */}
            {filteredCharges.length > 0 && (
              <div className="flex items-center justify-between space-x-1 py-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    {format(currentDateTime, "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="ml-auto">
                  <Pagination>
                    <PaginationContent className="gap-3">
                      <PaginationItem>
                        <PaginationLink
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                          onClick={prevPage}
                          aria-label="Go to previous page"
                          aria-disabled={currentPage === 1 ? true : undefined}
                          role={currentPage === 1 ? "link" : undefined}
                        >
                          <ChevronLeftIcon size={16} aria-hidden="true" />
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <p className="text-muted-foreground text-sm" aria-live="polite">
                          Page <span className="text-foreground">{currentPage}</span> of{" "}
                          <span className="text-foreground">{totalPages}</span>
                        </p>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                          onClick={nextPage}
                          aria-label="Go to next page"
                          aria-disabled={currentPage === totalPages ? true : undefined}
                          role={currentPage === totalPages ? "link" : undefined}
                        >
                          <ChevronRightIcon size={16} aria-hidden="true" />
                        </PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}