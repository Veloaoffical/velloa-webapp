'use client';

import { useState, useId } from "react"
import { Button as ButtonUI } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
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
import { Checkbox } from "@/components/ui/checkbox"
import {CalendarIcon, Printer, FileSpreadsheet, SlidersHorizontal, X, RefreshCw, ChevronLeftIcon, ChevronRightIcon, Plus, HandCoins, ArrowUp } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { RangeCalendar } from "@/components/ui/calendar-rac"
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac"
import { Button, DateRangePicker, Dialog, Group, Popover } from "react-aria-components"
import { parseDate, type CalendarDate } from "@internationalized/date"
import React from "react"
import AccountCombobox from "@/components/AccountCombobox"
import VendorCombobox from "@/components/VendorCombobox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination"

interface Property {
  id: string
  name: string
}

interface Person {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  role: string
  unit_id: string | null
  units?: {
    unit_name: string
    properties: {
      name: string
    }
  } | null
  company: string | null
}

interface Vendor extends Person {
  role: 'vendor'
}

interface Transaction {
  id: string
  transaction_type: string
  property: string
  start_date: string
  memo: {
    type: string
    content: string
    root?: {
      type: string
      format: string
      indent: number
      version: number
      children: Array<{
        type: string
        format: string
        indent: number
        version: number
        children: never[]
        direction: string | null
        textStyle: string
        textFormat: number
      }>
      direction: string | null
    }
  } | null
  data: {
    total_amount: number
    payment_method?: string
    lines?: Array<{
      category: string
      unit?: string
      description: string
      debit_amount: number
      credit_amount: number
      reference?: string
    }>
    status?: string
    unit_id?: string
    lease_id?: string
  }
  created_at: string
  created_by: string
  reference?: string
  payee?: string
}

interface Account {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_balance: number
  start_balance: number
  accounting_start_date: string
  owner_id?: string
  property_balance?: Array<{
    property_id: string
    property_name: string
    balance: number
    start_balance: number
    accounting_start_date: string
  }>
  active_account: boolean
  sub_accounts?: Array<{
    id: string
    account_name: string
    account_subtype: string
    account_balance: number
  }>
}

interface DepositsContentProps {
  leaseId?: string;
  initialDeposits?: Transaction[];
  initialAccounts?: Account[];
  initialProperties?: Property[];
}

export default function DepositsContent({ 
  leaseId,
  initialDeposits = [], 
  initialAccounts = [], 
  initialProperties = []
}: DepositsContentProps = {}) {
  const [selectedDeposits, setSelectedDeposits] = useState<Set<string>>(new Set())
  const [deposits] = useState<Transaction[]>(initialDeposits.filter(t => t.data?.lease_id === leaseId))
  const [isLoadingDeposits] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [accounts] = useState<Account[]>(initialAccounts)
  const [beginningBalance] = useState<number>(0)
  const [isLoadingAccounts] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [properties] = useState<Property[]>(initialProperties)

  const [people] = useState<Person[]>([])
  const [isLoadingPeople] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<string>('all')
  const [payees] = useState<Map<string, Person>>(new Map())
  const tableId = useId()
  const currentDateTime = new Date()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const [selectedPeriod, setSelectedPeriod] = useState('all-time')
  const [dateRange, setDateRange] = useState(getDateRangeForPeriod('all-time'))

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      setDateRange(getDateRangeForPeriod(period))
    }
  }

  const toggleDeposit = (id: string) => {
    const newSelected = new Set(selectedDeposits)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDeposits(newSelected)
  }

  const downloadFileSpreadsheet = () => {
    // Create CSV content
    const headers = ['Date', 'Type', 'Account', 'Property', 'Lease', 'Name', 'Memo', 'Amount', 'Updated By', 'Updated At']
    const csvContent = [
      headers.join(','),
      ...deposits.map(t => [
        t.start_date,
        t.transaction_type,
        t.data.lines?.[0]?.category ? (
          accounts.find(a => 
            a.id === t.data.lines![0].category || 
            a.sub_accounts?.some(sa => sa.id === t.data.lines![0].category)
          )?.account_name || t.data.lines[0].category
        ) : 'N/A',
        t.property,
        t.reference,
        t.payee,
        t.memo?.content || 'N/A',
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(t.data.total_amount || 0),
        t.created_by,
        t.created_at
      ].join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `deposits_${format(currentDateTime, "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate totals
  const totalAmount = deposits.reduce((sum, deposit) => {
    if (!deposit || !deposit.data) {
      return sum; // Skip this deposit if it or its data is undefined
    }
    
    const account = accounts.find(a => 
      a.id === deposit.data.lines?.[0]?.category || 
      a.sub_accounts?.some(sa => sa.id === deposit.data.lines?.[0]?.category)
    )
    
    // For bank accounts (asset accounts), debits add and credits subtract
    const isBankAccount = account?.account_type?.toLowerCase() === 'asset' && 
                         account?.account_subtype?.toLowerCase() === 'bank'

    if (isBankAccount && deposit.data.lines) {
      // For bank accounts:
      // Sum all debit amounts and subtract all credit amounts for the selected account
      return sum + deposit.data.lines.reduce((lineSum, line) => {
        // Check if this line is for the selected account or its sub-accounts
        const isSelectedAccount = selectedAccount === 'all' || 
          line.category === selectedAccount ||
          accounts.find(a => a.id === selectedAccount)?.sub_accounts?.some(sa => sa.id === line.category)

        if (isSelectedAccount) {
          return lineSum + (line.debit_amount || 0) - (line.credit_amount || 0)
        }
        return lineSum
      }, 0)
    } else {
      // For other accounts, use the total amount as is
      return sum + (deposit.data.total_amount || 0)
    }
  }, 0)

  // Calculate running balance including beginning balance
  const calculateRunningBalance = (deposit: Transaction, index: number) => {
    if (!deposit || !deposit.data) {
      return beginningBalance; // Return beginning balance if deposit or its data is undefined
    }
    
    const depositsUpToIndex = deposits.slice(0, index + 1)
    const account = accounts.find(a => 
      a.id === deposit.data.lines?.[0]?.category || 
      a.sub_accounts?.some(sa => sa.id === deposit.data.lines?.[0]?.category)
    )
    
    // For bank accounts (asset accounts), debits add and credits subtract
    const isBankAccount = account?.account_type?.toLowerCase() === 'asset' && 
                         account?.account_subtype?.toLowerCase() === 'bank'

    const runningTotal = depositsUpToIndex.reduce((sum, t) => {
      if (!t || !t.data) {
        return sum; // Skip this deposit if it or its data is undefined
      }
      
      if (isBankAccount && t.data.lines) {
        // For bank accounts:
        // Add all debit amounts and subtract all credit amounts for the selected account
        return sum + t.data.lines.reduce((lineSum, line) => {
          // Check if this line is for the selected account or its sub-accounts
          const isSelectedAccount = selectedAccount === 'all' || 
            line.category === selectedAccount ||
            accounts.find(a => a.id === selectedAccount)?.sub_accounts?.some(sa => sa.id === line.category)

          if (isSelectedAccount) {
            return lineSum + (line.debit_amount || 0) - (line.credit_amount || 0)
          }
          return lineSum
        }, 0)
      } else {
        // For other accounts:
        // Use the total amount as is
        return sum + (t.data.total_amount || 0)
      }
    }, beginningBalance)

    return runningTotal
  }

  // Calculate pagination values
  const totalPages = Math.ceil(deposits.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentDeposits = deposits.slice(indexOfFirstItem, indexOfLastItem)
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const totalDepositAmount = deposits.reduce((sum, deposit) => sum + (deposit.data?.total_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  ${totalDepositAmount.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Deposits</div>
              </div>
              <div className="text-primary">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {deposits.length}
                </div>
                <div className="text-sm text-muted-foreground">Number of Deposits</div>
              </div>
              <div className="text-muted-foreground">
                <CalendarIcon className="h-6 w-6" />
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
                  // Handle new deposit
                  console.log('New deposit')
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Deposit
              </ButtonUI>
              <ButtonUI 
                className="flex-1 text-sm rounded-lg" 
                variant="outline"
                onClick={() => {
                  // Handle partial return
                  console.log('Partial return')
                }}
              >
                <HandCoins className="h-4 w-4 mr-2" />
                Partial Return
              </ButtonUI>
              <ButtonUI 
                className="flex-1 text-sm rounded-lg" 
                variant="outline"
                onClick={() => {
                  // Handle full return
                  console.log('Full return')
                }}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Full Return
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
                    <SelectItem value="property">Property</SelectItem>
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
                          disabled={isLoadingDeposits}
                        >
                          <RefreshCw className={cn("h-4 w-4", isLoadingDeposits && "animate-spin")} />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh page</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ButtonUI variant="ghost" size="icon" onClick={downloadFileSpreadsheet} className={cn(dateInputStyle, "w-9 h-9 p-0")}>
                          <FileSpreadsheet className="h-4 w-4" />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export to spreadsheet</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ButtonUI variant="ghost" size="icon" className={cn(dateInputStyle, "w-9 h-9 p-0")}>
                          <Printer className="h-4 w-4" />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Print report</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200 fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out-0">
                  <AccountCombobox
                    accounts={accounts}
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                    isLoading={isLoadingAccounts}
                    className={cn(dateInputStyle, "text-sm h-9")}
                  />
                  
                  <VendorCombobox
                    vendors={people.filter((p): p is Vendor => p.role === 'vendor')}
                    value={selectedVendor}
                    onValueChange={setSelectedVendor}
                    isLoading={isLoadingPeople}
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
          <div className="space-y-2 overflow-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap">
                    <Checkbox 
                      id={tableId}
                      checked={selectedDeposits.size === currentDeposits.length && currentDeposits.length > 0}
                      onCheckedChange={() => {
                        if (selectedDeposits.size === currentDeposits.length && currentDeposits.length > 0) {
                          // Deselect all current page items
                          const newSelected = new Set(selectedDeposits)
                          currentDeposits.forEach(t => newSelected.delete(t.id))
                          setSelectedDeposits(newSelected)
                        } else {
                          // Select all current page items
                          const newSelected = new Set(selectedDeposits)
                          currentDeposits.forEach(t => newSelected.add(t.id))
                          setSelectedDeposits(newSelected)
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Account</TableHead>
                  <TableHead className="whitespace-nowrap">Property</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Memo</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Running Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDeposits ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Fetching deposits...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm text-muted-foreground">No deposits found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDeposits.map((deposit, index) => (
                    <TableRow key={deposit.id} className="has-[[data-state=checked]]:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <Checkbox 
                          id={`table-checkbox-${deposit.id}`}
                          checked={selectedDeposits.has(deposit.id)}
                          onCheckedChange={() => toggleDeposit(deposit.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {deposit.start_date ? format(new Date(deposit.start_date), 'MM/dd/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{deposit.transaction_type || 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {selectedAccount !== 'all' ? (
                          accounts.find(a => a.id === selectedAccount)?.account_name || 'N/A'
                        ) : (
                          deposit.data?.lines?.[0]?.category ? (
                            accounts.find(a => 
                              a.id === deposit.data.lines![0].category || 
                              a.sub_accounts?.some(sa => sa.id === deposit.data.lines![0].category)
                            )?.account_name || deposit.data.lines[0].category
                          ) : 'N/A'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {properties.find(p => p.id === deposit.property)?.name || deposit.property || 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {deposit.payee ? (
                          payees.get(deposit.payee) ? (
                            payees.get(deposit.payee)?.company ? (
                              `${[payees.get(deposit.payee)?.first_name, payees.get(deposit.payee)?.last_name]
                                .filter(Boolean)
                                .join(' ')} | ${payees.get(deposit.payee)?.company}`
                            ) : (
                              [payees.get(deposit.payee)?.first_name, payees.get(deposit.payee)?.last_name]
                                .filter(Boolean)
                                .join(' ')
                            )
                          ) : 'Loading...'
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {deposit.memo?.root?.children?.[0]?.children?.length === 0 ? '-' : deposit.memo?.content || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format((() => {
                          if (!deposit.data) return 0;
                          
                          const account = accounts.find(a => 
                            a.id === deposit.data.lines?.[0]?.category || 
                            a.sub_accounts?.some(sa => sa.id === deposit.data.lines?.[0]?.category)
                          )
                          
                          const isBankAccount = account?.account_type?.toLowerCase() === 'asset' && 
                                             account?.account_subtype?.toLowerCase() === 'bank'

                          if (isBankAccount && deposit.data.lines) {
                            // For bank accounts, calculate based on the selected account
                            return deposit.data.lines.reduce((sum, line) => {
                              // Check if this line is for the selected account or its sub-accounts
                              const isSelectedAccount = selectedAccount === 'all' || 
                                line.category === selectedAccount ||
                                accounts.find(a => a.id === selectedAccount)?.sub_accounts?.some(sa => sa.id === line.category)

                              if (isSelectedAccount) {
                                return sum + (line.debit_amount || 0) - (line.credit_amount || 0)
                              }
                              return sum
                            }, 0)
                          } else {
                            // For other accounts, use total amount
                            return deposit.data.total_amount || 0
                          }
                        })())}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(calculateRunningBalance(deposit, indexOfFirstItem + index))}
                      </TableCell>
                    </TableRow>
                  ))
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
            {deposits.length > 0 && (
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
  )
} 