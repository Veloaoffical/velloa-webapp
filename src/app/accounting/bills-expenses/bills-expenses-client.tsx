/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useId, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CalendarIcon, FileSpreadsheet, Printer, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { RangeCalendar } from "@/components/ui/calendar-rac"
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac"
import { Button as AriaButton, DateRangePicker, Dialog, Group, Popover } from "react-aria-components"
import { parseDate, type CalendarDate } from "@internationalized/date"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AccountCombobox from "@/components/AccountCombobox"
import PropertyCombobox from "@/components/PropertyCombobox"
import UnitCombobox from "@/components/UnitCombobox"
import VendorCombobox from "@/components/VendorCombobox"
import { BillsExpensesClientProps, Unit } from "./types"

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-4">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading...</span>
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  )
}

export function BillsExpensesClient({
  initialAccounts,
  initialProperties,
  initialPeople,
  initialCharges
}: BillsExpensesClientProps) {
  // State setup
  const [charges, setCharges] = useState(initialCharges)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set())
  const [isLoadingCharges, setIsLoadingCharges] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [selectedVendor, setSelectedVendor] = useState<string>('all')
  const [accounts, setAccounts] = useState(initialAccounts)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  
  const tableId = useId()
  const currentDateTime = new Date()
  
  // Date range state
  const [selectedPeriod, setSelectedPeriod] = useState('all-time')
  const [dateRange, setDateRange] = useState(getDateRangeForPeriod('all-time'))

  // Fetch accounts when component mounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoadingAccounts(true)
        const response = await fetch('/api/accounting/categories')
        if (!response.ok) throw new Error('Failed to fetch accounts')
        const data = await response.json()
        setAccounts(data)
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [])

  // Reset selected account when type changes if it doesn't match the new type
  useEffect(() => {
    if (selectedAccount === 'all') return
    
    const currentAccount = initialAccounts.find(account => account.id === selectedAccount)
    if (!currentAccount) return
  }, [selectedType, selectedAccount, initialAccounts])

  // Fetch units when property is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (selectedProperty === 'all') {
        setUnits([])
        setSelectedUnit('all') // Reset unit selection when property is deselected
        return
      }

      try {
        setIsLoadingUnits(true)
        const response = await fetch(`/api/property/${selectedProperty}/units`)
        if (!response.ok) {
          throw new Error('Failed to fetch units')
        }
        const data = await response.json()
        setUnits(data)
        setSelectedUnit('all') // Reset unit selection when property changes
      } catch (error) {
        console.error('Error fetching units:', error)
        setUnits([])
      } finally {
        setIsLoadingUnits(false)
      }
    }

    fetchUnits()
  }, [selectedProperty])

  // Fetch charges when filters change
  useEffect(() => {
    const fetchCharges = async () => {
      try {
        setIsLoadingCharges(true)
        const params = new URLSearchParams()
        
        // Filter for bills and expenses using charge_type parameter
        if (selectedType !== 'all') {
          params.append('charge_type', selectedType.toLowerCase())
        } else {
          // If no specific type is selected, include both bills and expenses
          params.append('charge_type', 'bill,expense')
        }
        
        if (selectedAccount && selectedAccount !== 'all') {
          params.append('account_id', selectedAccount)
          // Also include sub-accounts if any
          const selectedAccountData = initialAccounts.find(a => a.id === selectedAccount)
          if (selectedAccountData?.sub_accounts?.length) {
            selectedAccountData.sub_accounts.forEach(sa => {
              params.append('sub_account_ids[]', sa.id)
            })
          }
        }

        if (dateRange?.start) {
          // Convert CalendarDate to YYYY-MM-DD format
          params.append('start_date', dateRange.start.toString().split('T')[0])
        }
        
        if (dateRange?.end) {
          // Convert CalendarDate to YYYY-MM-DD format
          params.append('end_date', dateRange.end.toString().split('T')[0])
        }

        if (selectedProperty && selectedProperty !== 'all') {
          params.append('property_id', selectedProperty)
        }

        if (selectedUnit && selectedUnit !== 'all') {
          params.append('unit_id', selectedUnit)
        }

        if (selectedVendor && selectedVendor !== 'all') {
          params.append('vendor_id', selectedVendor)
        }

        const response = await fetch(`/api/accounting/charges?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch charges: ${response.statusText}`)
        }
        const data = await response.json()
        setCharges(data)
      } catch (error) {
        console.error('Error fetching charges:', error)
      } finally {
        setIsLoadingCharges(false)
      }
    }

    fetchCharges()
  }, [
    selectedAccount, 
    dateRange, 
    selectedProperty, 
    selectedUnit, 
    selectedVendor, 
    selectedType,
    initialAccounts
  ])

  function getDateRangeForPeriod(period: string) {
    const currentDateTime = new Date()
    
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
          // Using a far past date for start (Jan 1, 1970)
          start: parseDate("1970-01-01"),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
      default:
        return {
          start: parseDate(format(subDays(currentDateTime, 7), "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
    }
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      setDateRange(getDateRangeForPeriod(period))
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

  const toggleAll = () => {
    if (selectedCharges.size === charges.length) {
      setSelectedCharges(new Set())
    } else {
      setSelectedCharges(new Set(charges.map(c => c.id)))
    }
  }

  const downloadFileSpreadsheet = () => {
    // Create CSV content
    const headers = ['Date', 'Type', 'Account', 'Property', 'Reference', 'Amount']
    const csvContent = [
      headers.join(','),
      ...charges.map(c => [
        format(new Date(c.due_date), 'yyyy-MM-dd'),
        c.charge_type,
        c.charge_amount.lines?.[0]?.category_id || 'N/A',
        initialProperties.find(p => p.id === c.property_id)?.name || c.property_id,
        c.reference || 'N/A',
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(c.charge_amount.total_amount || 0)
      ].join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `charges_${format(currentDateTime, "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  return (
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
                  <AriaButton className="z-10 -me-px -ms-9 flex w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-ring/70">
                    <CalendarIcon size={16} strokeWidth={2} />
                  </AriaButton>
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
                  <SelectItem value="property">Property</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bill">Bill</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>

              <Button 
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
              </Button>

              <div className="flex-1" />
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={downloadFileSpreadsheet} 
                  className={cn(dateInputStyle, "w-9 h-9 p-0")}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className={cn(dateInputStyle, "w-9 h-9 p-0")}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-6 gap-4 animate-in slide-in-from-top-2 duration-200 fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out-0">
                <AccountCombobox
                  accounts={accounts.filter(account => {
                    const accountType = account.account_type.toLowerCase();
                    const isIncomeOrExpense = accountType.includes('income') || 
                      accountType.includes('revenue') ||
                      accountType.includes('expense');
                    return isIncomeOrExpense;
                  }) as any}
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                  isLoading={isLoadingAccounts}
                  className={cn(dateInputStyle, "text-sm h-9")}
                />

                <PropertyCombobox
                  properties={initialProperties as any}
                  value={selectedProperty}
                  onValueChange={setSelectedProperty}
                  isLoading={false}
                  className={cn(dateInputStyle, "text-sm h-9")}
                />

                <UnitCombobox
                  units={units}
                  value={selectedUnit}
                  onValueChange={setSelectedUnit}
                  isLoading={isLoadingUnits}
                  selectedProperty={selectedProperty}
                  className={cn(dateInputStyle, "text-sm h-9")}
                />

                <Select>
                  <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                    <SelectValue placeholder="Portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Portfolios</SelectItem>
                  </SelectContent>
                </Select>

                <VendorCombobox
                  vendors={initialPeople.filter(p => p.role === 'vendor') as any}
                  value={selectedVendor}
                  onValueChange={setSelectedVendor}
                  isLoading={false}
                  className={cn(dateInputStyle, "text-sm h-9")}
                />

                <Select>
                  <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>In App</SelectLabel>
                      <SelectItem value="velloa-pay">Velloa Pay</SelectItem>
                      <SelectItem value="check-in-app">Check</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>External</SelectLabel>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="ach">Bank Transfer (ACH/EFT)</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="money-order">Money Order</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border-b"></div>
        </div>

        {/* Table */}
        <div className="space-y-2">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <Checkbox 
                    id={tableId}
                    checked={selectedCharges.size === charges.length && charges.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Open Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCharges ? (
                <LoadingRow colSpan={9} />
              ) : charges.filter(charge => {
                  // First filter by type if specified
                  const typeMatch = selectedType === 'all' 
                    ? ['bill', 'expense'].includes(charge.charge_type.toLowerCase())
                    : charge.charge_type.toLowerCase() === selectedType.toLowerCase();
                  
                  // Then filter by account if specified
                  const accountMatch = selectedAccount === 'all' || (
                    charge.charge_amount?.lines?.some(line => 
                      line.category_id === selectedAccount || 
                      line.category === selectedAccount
                    )
                  );

                  // Filter by vendor if specified
                  const vendorMatch = selectedVendor === 'all' || charge.people_id === selectedVendor;
                  
                  return typeMatch && accountMatch && vendorMatch;
                }).length === 0 ? (
                <EmptyRow colSpan={9} message="No charges found" />
              ) : (
                charges
                  .filter(charge => {
                    // First filter by type if specified
                    const typeMatch = selectedType === 'all' 
                      ? ['bill', 'expense'].includes(charge.charge_type.toLowerCase())
                      : charge.charge_type.toLowerCase() === selectedType.toLowerCase();
                    
                    // Then filter by account if specified
                    const accountMatch = selectedAccount === 'all' || (
                      charge.charge_amount?.lines?.some(line => 
                        line.category_id === selectedAccount || 
                        line.category === selectedAccount
                      )
                    );

                    // Filter by vendor if specified
                    const vendorMatch = selectedVendor === 'all' || charge.people_id === selectedVendor;
                    
                    return typeMatch && accountMatch && vendorMatch;
                  })
                  .map((charge) => (
                    <TableRow key={charge.id} className="has-[[data-state=checked]]:bg-muted/50">
                      <TableCell>
                        <Checkbox 
                          id={`table-checkbox-${charge.id}`}
                          checked={selectedCharges.has(charge.id)}
                          onCheckedChange={() => toggleCharge(charge.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{format(new Date(charge.created_at), 'MM/dd/yyyy')}</TableCell>
                      <TableCell>{format(new Date(charge.due_date), 'MM/dd/yyyy')}</TableCell>
                      <TableCell>{charge.charge_type}</TableCell>
                      <TableCell>
                        {charge.amount_remaining?.lines?.[0]?.category_info ? (
                          charge.amount_remaining.lines[0].category_info.account_name
                        ) : charge.charge_amount?.lines?.[0]?.category_info ? (
                          charge.charge_amount.lines[0].category_info.account_name
                        ) : charge.charge_amount?.lines?.[0]?.category_id ? (
                          initialAccounts.find(a => 
                            a.id === charge.charge_amount.lines![0].category_id || 
                            a.sub_accounts?.some(sa => sa.id === charge.charge_amount.lines![0].category_id)
                          )?.account_name || charge.charge_amount.lines[0].category_id
                        ) : charge.charge_amount?.lines?.[0]?.category ? (
                          initialAccounts.find(a => 
                            a.id === charge.charge_amount.lines![0].category || 
                            a.sub_accounts?.some(sa => sa.id === charge.charge_amount.lines![0].category)
                          )?.account_name || charge.charge_amount.lines[0].category
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {initialProperties.find(p => p.id === charge.property_id)?.name || charge.property_id}
                      </TableCell>
                      <TableCell>
                        {charge.people_id ? (
                          initialPeople.find(p => p.id === charge.people_id) ? (
                            <>
                              {[
                                initialPeople.find(p => p.id === charge.people_id)?.first_name, 
                                initialPeople.find(p => p.id === charge.people_id)?.last_name
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              {initialPeople.find(p => p.id === charge.people_id)?.company && (
                                <div className="text-sm text-muted-foreground">
                                  {initialPeople.find(p => p.id === charge.people_id)?.company}
                                </div>
                              )}
                            </>
                          ) : 'N/A'
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(charge.charge_amount.total_amount || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(
                          typeof charge.amount_remaining === 'object' && charge.amount_remaining !== null
                            ? charge.amount_remaining.total_amount || 0
                            : 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <p className="text-center text-sm text-muted-foreground">
            {format(currentDateTime, "MMM d, yyyy h:mm a")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 