"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, CalendarIcon, Printer, FileSpreadsheet, SlidersHorizontal, X } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"

interface Account {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  active_account: boolean
  sub_account: boolean
  account_balance: string
  start_balance: string
  property_balance: Array<{
    property_id: string
    property_name: string
    balance: number
    start_balance: number
  }>
}

interface Transaction {
  id: string
  transaction_type: string
  property: string
  start_date: string
  memo: {
    type: string
    content: string
  } | null
  data: {
    reference: string
    total_amount: number
    lines?: Array<{
      category: string
      unit: string
      description: string
      debit_amount: number
      credit_amount: number
    }>
    source_account_id?: string
    receiving_account_id?: string
  }
  created_at: string
  created_by: string
}

interface Property {
  id: string
  name: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  zip: string
}

export default function TransactionDetailsReport() {
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [realTransactions, setRealTransactions] = useState<Transaction[]>([])
  const [properties, setProperties] = useState<{ [key: string]: Property }>({})
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const currentDateTime = new Date()
  
  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'journal_entry':
        return 'Journal Entry'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }
  }

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
      default:
        return {
          start: parseDate(format(subDays(currentDateTime, 7), "yyyy-MM-dd")),
          end: parseDate(format(currentDateTime, "yyyy-MM-dd"))
        }
    }
  }

  const [selectedPeriod, setSelectedPeriod] = useState('last-7-days')
  const [dateRange, setDateRange] = useState(getDateRangeForPeriod('last-7-days'))
  const [selectedAccountingMethod, setSelectedAccountingMethod] = useState<string>('cash')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [selectedLease, setSelectedLease] = useState<string>('')
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('')
  const [selectedOwner, setSelectedOwner] = useState<string>('')
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [selectedBeginningBalance, setSelectedBeginningBalance] = useState<string>('')
  const [beginningBalance, setBeginningBalance] = useState<number>(0)

  // Calculate beginning balance from accounts
  const calculateBeginningBalance = useCallback((accountsToCalculate: Account[]) => {
    console.log('Calculating beginning balance from accounts:', accountsToCalculate)
    
    let bankTotal = 0
    let equityTotal = 0
    
    if (selectedProperty && selectedProperty !== 'all') {
      // For property-specific view:
      // 1. Sum property-specific bank balances
      accountsToCalculate.forEach(account => {
        if (!account.active_account) {
          console.log(`Skipping inactive account: ${account.account_name}`)
          return
        }

        if (account.account_type.toLowerCase() === 'asset' && account.account_subtype.toLowerCase() === 'bank') {
          const propertyBalance = account.property_balance?.find(pb => pb.property_id === selectedProperty)?.start_balance || 0
          console.log(`Bank balance for ${account.account_name} (Property: ${selectedProperty}): ${propertyBalance}`)
          bankTotal += propertyBalance
        }
      })

      // 2. Always add ALL equity account balances (not property-specific)
      accountsToCalculate.forEach(account => {
        if (!account.active_account) return

        if (account.account_type.toLowerCase() === 'equity') {
          const balance = Number(account.start_balance || 0)
          console.log(`Adding full equity account balance: ${account.account_name}: ${balance}`)
          equityTotal += balance
        }
      })
    } else {
      // For all properties view, use standard calculation
      accountsToCalculate.forEach(account => {
        if (!account.active_account) {
          console.log(`Skipping inactive account: ${account.account_name}`)
          return
        }

        if (account.account_type.toLowerCase() === 'asset' && account.account_subtype.toLowerCase() === 'bank') {
          const balance = Number(account.start_balance || 0)
          console.log(`Adding bank account balance: ${balance}`)
          bankTotal += balance
        } else if (account.account_type.toLowerCase() === 'equity') {
          const balance = Number(account.start_balance || 0)
          console.log(`Adding equity account balance: ${balance}`)
          equityTotal += balance
        }
      })
    }

    console.log('Total bank balance:', bankTotal)
    console.log('Total equity:', equityTotal)
    const finalBalance = bankTotal + equityTotal
    console.log('Final beginning balance:', finalBalance)
    return finalBalance
  }, [selectedProperty])

  // Fetch chart of accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounting/chart-of-accounts')
        if (!response.ok) throw new Error('Failed to fetch accounts')
        const data = await response.json()
        console.log('Fetched accounts:', data)
        setAccounts(data)
        const calculatedBalance = calculateBeginningBalance(data)
        console.log('Setting beginning balance to:', calculatedBalance)
        setBeginningBalance(calculatedBalance)
      } catch (error) {
        console.error('Error fetching accounts:', error)
      }
    }
    fetchAccounts()
  }, [calculateBeginningBalance])

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setPropertiesLoading(true)
        const response = await fetch('/api/property')
        if (!response.ok) throw new Error('Failed to fetch properties')
        const data = await response.json()
        const propertiesMap = data.reduce((acc: { [key: string]: Property }, property: Property) => {
          acc[property.id] = property
          return acc
        }, {})
        setProperties(propertiesMap)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setPropertiesLoading(false)
      }
    }
    fetchProperties()
  }, [])

  // Recalculate beginning balance when property filter changes
  useEffect(() => {
    if (accounts.length > 0) {
      const calculatedBalance = calculateBeginningBalance(accounts)
      console.log('Recalculating beginning balance after property change:', calculatedBalance)
      setBeginningBalance(calculatedBalance)
    }
  }, [selectedProperty, accounts, calculateBeginningBalance])

  // Fetch transactions when filters change
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        
        if (selectedAccount && selectedAccount !== 'all') {
          params.append('account_id', selectedAccount)
        }
        
        if (dateRange.start) {
          params.append('start_date', dateRange.start.toString())
        }
        
        if (dateRange.end) {
          params.append('end_date', dateRange.end.toString())
        }

        params.append('accounting_method', selectedAccountingMethod)

        if (selectedProperty && selectedProperty !== 'all') {
          params.append('property_id', selectedProperty)
        }

        if (selectedUnit && selectedUnit !== 'all') {
          params.append('unit_id', selectedUnit)
        }

        if (selectedLease && selectedLease !== 'all') {
          params.append('lease_id', selectedLease)
        }

        if (selectedPortfolio && selectedPortfolio !== 'all') {
          params.append('portfolio_id', selectedPortfolio)
        }

        if (selectedOwner && selectedOwner !== 'all') {
          params.append('owner_id', selectedOwner)
        }

        if (selectedVendor && selectedVendor !== 'all') {
          params.append('vendor_id', selectedVendor)
        }

        if (selectedTenant && selectedTenant !== 'all') {
          params.append('tenant_id', selectedTenant)
        }

        if (selectedPaymentMethod && selectedPaymentMethod !== 'all') {
          params.append('payment_method', selectedPaymentMethod)
        }

        if (selectedBeginningBalance && selectedBeginningBalance !== 'all') {
          params.append('beginning_balance', selectedBeginningBalance)
        }

        const response = await fetch(`/api/accounting/transactions?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch transactions')
        const data = await response.json()
        setRealTransactions(data)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [
    selectedAccount,
    dateRange,
    selectedAccountingMethod,
    selectedProperty,
    selectedUnit,
    selectedLease,
    selectedPortfolio,
    selectedOwner,
    selectedVendor,
    selectedTenant,
    selectedPaymentMethod,
    selectedBeginningBalance
  ])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      setDateRange(getDateRangeForPeriod(period))
    }
  }

  const downloadFileSpreadsheet = () => {
    // Create CSV content
    const headers = ['Date', 'Type', 'Account', 'Property', 'Name', 'Memo', 'Amount', 'Running Balance']
    let runningBalance = 0
    const csvContent = [
      headers.join(','),
      ...realTransactions.map(t => {
        runningBalance += t.data.total_amount
        return [
          format(new Date(t.start_date), "MM/dd/yyyy"),
          t.transaction_type,
          accounts.find(a => 
            t.data.lines?.some(l => l.category === a.id) ||
            t.data.source_account_id === a.id ||
            t.data.receiving_account_id === a.id
          )?.account_name || 'Unknown Account',
          t.property,
          t.data.lines?.[0]?.description || '-',
          t.memo?.content || '-',
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(t.data.total_amount),
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(runningBalance)
        ].join(',')
      })
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transaction_details_${format(currentDateTime, "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <ButtonUI variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </ButtonUI>
        </Link>
        <h1 className="text-xl font-semibold">Transaction Details Report</h1>
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
                    <SelectItem value="accountingMethod">Accounting Method</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedAccountingMethod}
                  onValueChange={setSelectedAccountingMethod}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Accounting Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="accrual">Accrual</SelectItem>
                  </SelectContent>
                </Select>

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

                <div className="flex-1" />
                
                <div className="flex gap-2">
                  <ButtonUI variant="ghost" size="icon" onClick={downloadFileSpreadsheet} className={cn(dateInputStyle, "w-9 h-9 p-0")}>
                    <FileSpreadsheet className="h-4 w-4" />
                  </ButtonUI>
                  <ButtonUI variant="ghost" size="icon" className={cn(dateInputStyle, "w-9 h-9 p-0")}>
                    <Printer className="h-4 w-4" />
                  </ButtonUI>
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-6 gap-4 animate-in slide-in-from-top-2 duration-200 fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out-0">
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedProperty}
                    onValueChange={setSelectedProperty}
                    disabled={propertiesLoading}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      {propertiesLoading ? (
                        <Skeleton className="h-4 w-[120px]" />
                      ) : (
                        <SelectValue placeholder="Property" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {Object.values(properties).map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedUnit}
                    onValueChange={setSelectedUnit}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedLease}
                    onValueChange={setSelectedLease}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Lease" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leases</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedPortfolio}
                    onValueChange={setSelectedPortfolio}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Portfolios</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedOwner}
                    onValueChange={setSelectedOwner}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Owners</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedVendor}
                    onValueChange={setSelectedVendor}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedTenant}
                    onValueChange={setSelectedTenant}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Methods</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="ach">ACH</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedBeginningBalance}
                    onValueChange={setSelectedBeginningBalance}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Beginning Balance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Balances</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="zero">Zero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="border-b"></div>
          </div>

          {/* Table */}
          <div className="space-y-2">
            {loading ? (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(18)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6}>Total</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : realTransactions.length === 0 ? (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No transactions found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Beginning Balance Row */}
                  <TableRow>
                    <TableCell className="font-medium">
                      {format(new Date(dateRange.start.toString()), "MM/dd/yyyy")}
                    </TableCell>
                    <TableCell>Beginning Balance</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(beginningBalance)}
                    </TableCell>
                  </TableRow>
                  {/* Existing Transaction Rows */}
                  {realTransactions.map((transaction, index) => {
                    // Calculate running balance including beginning balance
                    const runningBalance = beginningBalance + realTransactions
                      .slice(0, index + 1)
                      .reduce((sum, t) => {
                        if (t.data.lines) {
                          return sum + t.data.lines.reduce((lineSum, line) => {
                            return lineSum + (line.debit_amount || 0) - (line.credit_amount || 0)
                          }, 0)
                        }
                        return sum + (t.data.total_amount || 0)
                      }, 0)

                    return transaction.data.lines?.map((line, lineIndex) => (
                      <TableRow 
                        key={`${transaction.id}-${lineIndex}`}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(transaction.start_date), "MM/dd/yyyy")}
                        </TableCell>
                        <TableCell>{formatTransactionType(transaction.transaction_type)}</TableCell>
                        <TableCell>
                          {accounts.find(a => line.category === a.id)?.account_name || 'Unknown Account'}
                        </TableCell>
                        <TableCell>{properties[transaction.property]?.name || transaction.property}</TableCell>
                        <TableCell>{line.description || '-'}</TableCell>
                        <TableCell>{transaction.memo?.content || '-'}</TableCell>
                        <TableCell className="text-right">
                          {line.debit_amount > 0 ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(line.debit_amount) : line.credit_amount > 0 ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            signDisplay: 'auto'
                          }).format(-line.credit_amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(runningBalance)}
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{format(new Date(transaction.start_date), "MM/dd/yyyy")}</TableCell>
                        <TableCell>{formatTransactionType(transaction.transaction_type)}</TableCell>
                        <TableCell>
                          {accounts.find(a => 
                            transaction.data.source_account_id === a.id ||
                            transaction.data.receiving_account_id === a.id
                          )?.account_name || 'Unknown Account'}
                        </TableCell>
                        <TableCell>{properties[transaction.property]?.name || transaction.property}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{transaction.memo?.content || '-'}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(transaction.data.total_amount)}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(runningBalance)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6}>Total</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'auto'
                    }).format(realTransactions.reduce((sum, t) => {
                      return sum + (t.data.lines?.reduce((s, line) => {
                        const debitAmount = line.debit_amount || 0
                        const creditAmount = line.credit_amount || 0
                        return s + debitAmount - creditAmount
                      }, 0) || 0)
                    }, 0))}</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
            <p className="text-center text-sm text-muted-foreground">
              {selectedAccountingMethod === 'cash' ? 'Cash' : 'Accrual'} • {format(currentDateTime, "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 