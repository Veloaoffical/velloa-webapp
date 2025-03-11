"use client"

import { useState, useId, useEffect, useCallback } from "react"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import React from "react"
import LeaseCombobox from "@/components/LeaseCombobox"
import PropertyCombobox from "@/components/PropertyCombobox"
import UnitCombobox from "@/components/UnitCombobox"
import AccountCombobox from "@/components/AccountCombobox"
import OwnerCombobox from "@/components/OwnerCombobox"
import VendorCombobox from "@/components/VendorCombobox"
import TenantCombobox from "@/components/TenantCombobox"

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  active: boolean
}

interface Unit {
  id: string
  unit_number: string
  property_id: string
}

interface Lease {
  id: string
  tenant_name: string
  unit_name: string
  property_name: string
  tenant: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    name?: string
  } | null
  property: {
    name: string
    address: string
  }
  unit: {
    unit_number: string
  }
  start_date: string
  end_date: string
  rent_amount: string
  lease_term: string
  deposit_amount: string
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

interface Owner extends Person {
  role: 'owner'
}

interface Vendor extends Person {
  role: 'vendor'
}

interface Tenant extends Person {
  role: 'tenant'
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
      unit: string
      description: string
      debit_amount: number
      credit_amount: number
    }>
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

export default function TransactionsListReport() {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [accountingMethod, setAccountingMethod] = useState('cash')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [beginningBalance, setBeginningBalance] = useState<number>(0)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [leases, setLeases] = useState<Lease[]>([])
  const [isLoadingLeases, setIsLoadingLeases] = useState(true)
  const [selectedLease, setSelectedLease] = useState<string>('all')
  const [people, setPeople] = useState<Person[]>([])
  const [isLoadingPeople, setIsLoadingPeople] = useState(true)
  const [selectedOwner, setSelectedOwner] = useState<string>('all')
  const [selectedVendor, setSelectedVendor] = useState<string>('all')
  const [selectedTenant, setSelectedTenant] = useState<string>('all')
  const [accountOwner, setAccountOwner] = useState<Person | null>(null)
  const [payees, setPayees] = useState<Map<string, Person>>(new Map())
  const tableId = useId()
  const currentDateTime = new Date()
  
  // Calculate beginning balance from accounts
  const calculateBeginningBalance = useCallback((accountsToCalculate: Account[]) => {
    if (!selectedAccount || selectedAccount === 'all') {
      return 0
    }

    const account = accountsToCalculate.find(a => a.id === selectedAccount)
    if (!account) return 0

    if (selectedProperty && selectedProperty !== 'all') {
      // For property-specific view, use property balance
      const propertyBalance = account.property_balance?.find(pb => pb.property_id === selectedProperty)
      if (!propertyBalance) return 0
      return propertyBalance.start_balance || 0
    }

    // For all properties view, use account start balance
    return account.start_balance || 0
  }, [selectedAccount, selectedProperty])

  // Fetch chart of accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounting/chart-of-accounts')
        if (!response.ok) throw new Error('Failed to fetch accounts')
        const data = await response.json()
        setAccounts(data)
        const calculatedBalance = calculateBeginningBalance(data)
        setBeginningBalance(calculatedBalance)
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [calculateBeginningBalance])

  // Recalculate beginning balance when account or property filter changes
  useEffect(() => {
    if (accounts.length > 0) {
      const calculatedBalance = calculateBeginningBalance(accounts)
      setBeginningBalance(calculatedBalance)
    }
  }, [selectedAccount, selectedProperty, accounts, calculateBeginningBalance])

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/property')
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }
        const data = await response.json()
        setProperties(data)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setIsLoadingProperties(false)
      }
    }

    fetchProperties()
  }, [])

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        setIsLoadingLeases(true)
        const response = await fetch('/api/accounting/lease-contracts')
        if (!response.ok) {
          throw new Error('Failed to fetch leases')
        }
        const data = await response.json()
        setLeases(data)
      } catch (error) {
        console.error('Error fetching leases:', error)
      } finally {
        setIsLoadingLeases(false)
      }
    }

    fetchLeases()
  }, [])

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

  // Update lease options when property or unit changes
  useEffect(() => {
    // Reset lease selection when property or unit changes
    setSelectedLease('all')
  }, [selectedProperty, selectedUnit])

  // Fetch people data
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setIsLoadingPeople(true)
        const response = await fetch('/api/people/all')
        if (!response.ok) {
          throw new Error('Failed to fetch people')
        }
        const data = await response.json()
        setPeople(data)
      } catch (error) {
        console.error('Error fetching people:', error)
      } finally {
        setIsLoadingPeople(false)
      }
    }

    fetchPeople()
  }, [])

  // Fetch account owner when account changes
  useEffect(() => {
    const fetchAccountOwner = async () => {
      if (!selectedAccount || selectedAccount === 'all') {
        setAccountOwner(null)
        return
      }

      const account = accounts.find(a => a.id === selectedAccount)
      if (!account?.owner_id) {
        setAccountOwner(null)
        return
      }

      try {
        const response = await fetch(`/api/people/${account.owner_id}`)
        if (!response.ok) throw new Error('Failed to fetch account owner')
        const data = await response.json()
        setAccountOwner(data)
      } catch (error) {
        console.error('Error fetching account owner:', error)
        setAccountOwner(null)
      }
    }

    fetchAccountOwner()
  }, [selectedAccount, accounts])

  // Fetch payee details for transactions
  useEffect(() => {
    const fetchPayeeDetails = async () => {
      const uniquePayeeIds = new Set(
        transactions
          .map(t => t.payee)
          .filter((id): id is string => id !== undefined && id !== null)
      )
      const newPayees = new Map<string, Person>()
      
      for (const payeeId of uniquePayeeIds) {
        if (!payees.has(payeeId)) {
          try {
            const response = await fetch(`/api/people/${payeeId}`)
            if (response.ok) {
              const data = await response.json()
              newPayees.set(payeeId, data)
            }
          } catch (error) {
            console.error(`Error fetching payee ${payeeId}:`, error)
          }
        }
      }
      
      if (newPayees.size > 0) {
        setPayees(new Map([...payees, ...newPayees]))
      }
    }

    if (transactions.length > 0) {
      fetchPayeeDetails()
    }
  }, [transactions])

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

  // Fetch transactions when filters change
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoadingTransactions(true)
        const params = new URLSearchParams()
        
        if (selectedAccount && selectedAccount !== 'all') {
          params.append('account_id', selectedAccount)
          // Also include sub-accounts if any
          const selectedAccountData = accounts.find(a => a.id === selectedAccount)
          if (selectedAccountData?.sub_accounts?.length) {
            selectedAccountData.sub_accounts.forEach(sa => {
              params.append('sub_account_ids[]', sa.id)
            })
          }

          // If this is a bank account, also include credit account transactions
          if (selectedAccountData?.account_type?.toLowerCase() === 'asset' && 
              selectedAccountData?.account_subtype?.toLowerCase() === 'bank') {
            // Get all credit accounts
            const creditAccountIds = accounts
              .filter(a => a.account_type?.toLowerCase() === 'credit')
              .map(a => a.id)
            
            // Add credit account IDs to params
            creditAccountIds.forEach(id => {
              params.append('related_account_ids[]', id)
            })
          }
        }
        
        if (dateRange?.start) {
          params.append('start_date', dateRange.start.toString())
        }
        
        if (dateRange?.end) {
          params.append('end_date', dateRange.end.toString())
        }

        if (selectedProperty && selectedProperty !== 'all') {
          params.append('property_id', selectedProperty)
        }

        if (selectedUnit && selectedUnit !== 'all') {
          params.append('unit_id', selectedUnit)
        }

        if (selectedLease && selectedLease !== 'all') {
          params.append('lease_id', selectedLease)
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

        const response = await fetch(`/api/accounting/transactions?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch transactions')
        const data = await response.json()
        setTransactions(data)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [selectedAccount, dateRange, selectedProperty, selectedUnit, selectedLease, selectedOwner, selectedVendor, selectedTenant, accounts])

  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTransactions(newSelected)
  }

  const toggleAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)))
    }
  }

  const downloadFileSpreadsheet = () => {
    // Create CSV content
    const headers = ['Date', 'Type', 'Account', 'Property', 'Lease', 'Name', 'Memo', 'Amount', 'Updated By', 'Updated At']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
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
    link.setAttribute('download', `transactions_${format(currentDateTime, "yyyy-MM-dd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate totals
  const totalAmount = transactions.reduce((sum, transaction) => {
    const account = accounts.find(a => 
      a.id === transaction.data.lines?.[0]?.category || 
      a.sub_accounts?.some(sa => sa.id === transaction.data.lines?.[0]?.category)
    )
    
    // For bank accounts (asset accounts), debits add and credits subtract
    const isBankAccount = account?.account_type?.toLowerCase() === 'asset' && 
                         account?.account_subtype?.toLowerCase() === 'bank'

    if (isBankAccount && transaction.data.lines) {
      // For bank accounts:
      // Sum all debit amounts and subtract all credit amounts for the selected account
      return sum + transaction.data.lines.reduce((lineSum, line) => {
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
      return sum + (transaction.data.total_amount || 0)
    }
  }, 0)

  // Calculate running balance including beginning balance
  const calculateRunningBalance = (transaction: Transaction, index: number) => {
    const transactionsUpToIndex = transactions.slice(0, index + 1)
    const account = accounts.find(a => 
      a.id === transaction.data.lines?.[0]?.category || 
      a.sub_accounts?.some(sa => sa.id === transaction.data.lines?.[0]?.category)
    )
    
    // For bank accounts (asset accounts), debits add and credits subtract
    const isBankAccount = account?.account_type?.toLowerCase() === 'asset' && 
                         account?.account_subtype?.toLowerCase() === 'bank'

    const runningTotal = transactionsUpToIndex.reduce((sum, t) => {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/accounting/reports">
          <ButtonUI variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </ButtonUI>
        </Link>
        <h1 className="text-xl font-semibold">Transactions List Report</h1>
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

                <Select
                  value={accountingMethod}
                  onValueChange={setAccountingMethod}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Accounting Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash basis</SelectItem>
                    <SelectItem value="accrual">Accrual basis</SelectItem>
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
                  <AccountCombobox
                    accounts={accounts}
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                    isLoading={isLoadingAccounts}
                    className={cn(dateInputStyle, "text-sm h-9")}
                  />

                  <PropertyCombobox
                    properties={properties}
                    value={selectedProperty}
                    onValueChange={setSelectedProperty}
                    isLoading={isLoadingProperties}
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

                  <LeaseCombobox
                    leases={leases}
                    value={selectedLease}
                    onValueChange={setSelectedLease}
                    isLoading={isLoadingLeases}
                    selectedProperty={selectedProperty}
                    selectedUnit={selectedUnit}
                    properties={properties}
                    units={units}
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

                  <OwnerCombobox
                    owners={people.filter((p): p is Owner => p.role === 'owner')}
                    value={selectedOwner}
                    onValueChange={setSelectedOwner}
                    isLoading={isLoadingPeople}
                    className={cn(dateInputStyle, "text-sm h-9")}
                  />

                  <VendorCombobox
                    vendors={people.filter((p): p is Vendor => p.role === 'vendor')}
                    value={selectedVendor}
                    onValueChange={setSelectedVendor}
                    isLoading={isLoadingPeople}
                    className={cn(dateInputStyle, "text-sm h-9")}
                  />

                  <TenantCombobox
                    tenants={people.filter((p): p is Tenant => p.role === 'tenant')}
                    value={selectedTenant}
                    onValueChange={setSelectedTenant}
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
          <div className="space-y-2">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <Checkbox 
                      id={tableId}
                      checked={selectedTransactions.size === transactions.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
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
                  <TableCell>
                    <Checkbox checked={false} disabled />
                  </TableCell>
                  <TableCell className="font-medium">
                    {selectedAccount !== 'all' ? (
                      selectedProperty !== 'all' ? (
                        // Show property-specific accounting start date
                        format(new Date(accounts.find(a => a.id === selectedAccount)?.property_balance?.find(pb => pb.property_id === selectedProperty)?.accounting_start_date || '1970-01-01'), 'MM/dd/yyyy')
                      ) : (
                        // Show account's accounting start date
                        format(new Date(accounts.find(a => a.id === selectedAccount)?.accounting_start_date || '1970-01-01'), 'MM/dd/yyyy')
                      )
                    ) : 'All Time'}
                  </TableCell>
                  <TableCell>Opening Balance</TableCell>
                  <TableCell>
                    {selectedAccount !== 'all' ? (
                      accounts.find(a => a.id === selectedAccount)?.account_name || 'N/A'
                    ) : 'All Accounts'}
                  </TableCell>
                  <TableCell>
                    {selectedProperty !== 'all' ? (
                      properties.find(p => p.id === selectedProperty)?.name || 'N/A'
                    ) : 'All Properties'}
                  </TableCell>
                  <TableCell>
                    {accountOwner ? (
                      accountOwner.company || [accountOwner.first_name, accountOwner.last_name].filter(Boolean).join(' ') || 'N/A'
                    ) : '-'}
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(beginningBalance)}
                  </TableCell>
                </TableRow>

                {isLoadingTransactions ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction, index) => (
                    <TableRow key={transaction.id} className="has-[[data-state=checked]]:bg-muted/50">
                      <TableCell>
                        <Checkbox 
                          id={`table-checkbox-${transaction.id}`}
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={() => toggleTransaction(transaction.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{format(new Date(transaction.start_date), 'MM/dd/yyyy')}</TableCell>
                      <TableCell>{transaction.transaction_type}</TableCell>
                      <TableCell>
                        {selectedAccount !== 'all' ? (
                          accounts.find(a => a.id === selectedAccount)?.account_name || 'N/A'
                        ) : (
                          transaction.data.lines?.[0]?.category ? (
                            accounts.find(a => 
                              a.id === transaction.data.lines![0].category || 
                              a.sub_accounts?.some(sa => sa.id === transaction.data.lines![0].category)
                            )?.account_name || transaction.data.lines[0].category
                          ) : 'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {properties.find(p => p.id === transaction.property)?.name || transaction.property}
                      </TableCell>
                      <TableCell>
                        {transaction.payee ? (
                          payees.get(transaction.payee) ? (
                            payees.get(transaction.payee)?.company ? (
                              `${[payees.get(transaction.payee)?.first_name, payees.get(transaction.payee)?.last_name]
                                .filter(Boolean)
                                .join(' ')} | ${payees.get(transaction.payee)?.company}`
                            ) : (
                              [payees.get(transaction.payee)?.first_name, payees.get(transaction.payee)?.last_name]
                                .filter(Boolean)
                                .join(' ')
                            )
                          ) : 'Loading...'
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {transaction.memo?.root?.children?.[0]?.children?.length === 0 ? '-' : transaction.memo?.content || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format((() => {
                          const account = accounts.find(a => 
                            a.id === transaction.data.lines?.[0]?.category || 
                            a.sub_accounts?.some(sa => sa.id === transaction.data.lines?.[0]?.category)
                          )
                          
                          const isBankAccount = account?.account_type?.toLowerCase() === 'asset' && 
                                             account?.account_subtype?.toLowerCase() === 'bank'

                          if (isBankAccount && transaction.data.lines) {
                            // For bank accounts, calculate based on the selected account
                            return transaction.data.lines.reduce((sum, line) => {
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
                            return transaction.data.total_amount || 0
                          }
                        })())}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(calculateRunningBalance(transaction, index))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter className="bg-muted">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>Total</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(beginningBalance + totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                   
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <p className="text-center text-sm text-muted-foreground">
              {accountingMethod === 'cash' ? 'Cash' : 'Accrual'} Basis • {format(currentDateTime, "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 