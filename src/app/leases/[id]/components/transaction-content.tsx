import { useState, useId, useEffect, useCallback } from "react"
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
import {CalendarIcon, Printer, FileSpreadsheet, SlidersHorizontal, X, RefreshCw, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
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
  address: string
  city: string
  state: string
  zip: string
  active: boolean
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

interface TransactionContentProps {
  leaseId?: string;
}

export default function TransactionContent({ leaseId }: TransactionContentProps = {}) {
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
  const [selectedProperty] = useState<string>('all')
  const [selectedUnit, setSelectedUnit] = useState<string>('all')
  const [selectedLease, setSelectedLease] = useState<string>(leaseId || 'all')
  const [people, setPeople] = useState<Person[]>([])
  const [isLoadingPeople, setIsLoadingPeople] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<string>('all')
  const [accountOwner, setAccountOwner] = useState<Person | null>(null)
  const [payees, setPayees] = useState<Map<string, Person>>(new Map())
  const tableId = useId()
  const currentDateTime = new Date()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Fixed value since we removed the dropdown
  
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
      }
    }

    fetchProperties()
  }, [])

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        // Don't set isLoadingTransactions here as we're not loading transactions
        const response = await fetch('/api/accounting/lease-contracts')
        if (!response.ok) {
          throw new Error('Failed to fetch leases')
        }
        // We're not using this data, so no need to store it
        // const data = await response.json()
      } catch (error) {
        console.error('Error fetching leases:', error)
      }
    }

    fetchLeases()
  }, [])

  // Fetch units when property is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (selectedProperty === 'all') {
        // Don't reset transactions here
        setSelectedUnit('all') // Reset unit selection when property is deselected
        return
      }

      try {
        // Don't set isLoadingTransactions here as we're not loading transactions
        const response = await fetch(`/api/property/${selectedProperty}/units`)
        if (!response.ok) {
          throw new Error('Failed to fetch units')
        }
        // We're not using this data, so no need to store it
        // const data = await response.json()
        setSelectedUnit('all') // Reset unit selection when property changes
      } catch (error) {
        console.error('Error fetching units:', error)
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
    fetchTransactions();
  }, [selectedAccount, dateRange, selectedProperty, selectedUnit, selectedLease, selectedVendor, accounts]);

  // Separate fetchTransactions function that can be called manually
  const fetchTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const params = new URLSearchParams();
      
      if (selectedAccount && selectedAccount !== 'all') {
        params.append('account_id', selectedAccount);
        // Also include sub-accounts if any
        const selectedAccountData = accounts.find(a => a.id === selectedAccount);
        if (selectedAccountData?.sub_accounts?.length) {
          selectedAccountData.sub_accounts.forEach(sa => {
            params.append('sub_account_ids[]', sa.id);
          });
        }

        // If this is a bank account, also include credit account transactions
        if (selectedAccountData?.account_type?.toLowerCase() === 'asset' && 
            selectedAccountData?.account_subtype?.toLowerCase() === 'bank') {
          // Get all credit accounts
          const creditAccountIds = accounts
            .filter(a => a.account_type?.toLowerCase() === 'credit')
            .map(a => a.id);
          
          // Add credit account IDs to params
          creditAccountIds.forEach(id => {
            params.append('related_account_ids[]', id);
          });
        }
      }
      
      if (dateRange?.start) {
        params.append('start_date', dateRange.start.toString());
      }
      
      if (dateRange?.end) {
        params.append('end_date', dateRange.end.toString());
      }

      if (selectedProperty && selectedProperty !== 'all') {
        params.append('property_id', selectedProperty);
      }

      if (selectedUnit && selectedUnit !== 'all') {
        params.append('unit_id', selectedUnit);
      }

      if (selectedLease && selectedLease !== 'all') {
        params.append('lease_id', selectedLease);
      }

      if (selectedVendor && selectedVendor !== 'all') {
        params.append('vendor_id', selectedVendor);
      }

      console.log('Fetching transactions with params:', params.toString());
      
      // Add a timeout to handle network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(`/api/accounting/transactions?${params.toString()}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch transactions: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.length} transactions`);
        setTransactions(data);
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('Request timed out after 30 seconds');
          throw new Error('Request timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // You could add a toast notification here if you have a toast system
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTransactions(newSelected)
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
    if (!transaction || !transaction.data) {
      return sum; // Skip this transaction if it or its data is undefined
    }
    
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
    if (!transaction || !transaction.data) {
      return beginningBalance; // Return beginning balance if transaction or its data is undefined
    }
    
    const transactionsUpToIndex = transactions.slice(0, index + 1)
    const account = accounts.find(a => 
      a.id === transaction.data.lines?.[0]?.category || 
      a.sub_accounts?.some(sa => sa.id === transaction.data.lines?.[0]?.category)
    )
    
    // For bank accounts (asset accounts), debits add and credits subtract
    const isBankAccount = account?.account_type?.toLowerCase() === 'asset' && 
                         account?.account_subtype?.toLowerCase() === 'bank'

    const runningTotal = transactionsUpToIndex.reduce((sum, t) => {
      if (!t || !t.data) {
        return sum; // Skip this transaction if it or its data is undefined
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
  const totalPages = Math.ceil(transactions.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem)
  
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
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedAccount, dateRange, selectedProperty, selectedUnit, selectedLease, selectedVendor])

  return (
    <div>


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
                          onClick={() => fetchTransactions()} 
                          className={cn(dateInputStyle, "w-9 h-9 p-0")}
                          disabled={isLoadingTransactions}
                        >
                          <RefreshCw className={cn("h-4 w-4", isLoadingTransactions && "animate-spin")} />
                        </ButtonUI>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh transactions</p>
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
                      checked={selectedTransactions.size === currentTransactions.length && currentTransactions.length > 0}
                      onCheckedChange={() => {
                        if (selectedTransactions.size === currentTransactions.length && currentTransactions.length > 0) {
                          // Deselect all current page items
                          const newSelected = new Set(selectedTransactions)
                          currentTransactions.forEach(t => newSelected.delete(t.id))
                          setSelectedTransactions(newSelected)
                        } else {
                          // Select all current page items
                          const newSelected = new Set(selectedTransactions)
                          currentTransactions.forEach(t => newSelected.add(t.id))
                          setSelectedTransactions(newSelected)
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
                {/* Beginning Balance Row */}
                <TableRow>
                  <TableCell className="whitespace-nowrap">
                    <Checkbox checked={false} disabled />
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
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
                  <TableCell className="whitespace-nowrap">Opening Balance</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {selectedAccount !== 'all' ? (
                      accounts.find(a => a.id === selectedAccount)?.account_name || 'N/A'
                    ) : 'All Accounts'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {selectedProperty !== 'all' ? (
                      properties.find(p => p.id === selectedProperty)?.name || 'N/A'
                    ) : 'All Properties'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {accountOwner ? (
                      accountOwner.company || [accountOwner.first_name, accountOwner.last_name].filter(Boolean).join(' ') || 'N/A'
                    ) : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">-</TableCell>
                  <TableCell className="text-right whitespace-nowrap">-</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(beginningBalance)}
                  </TableCell>
                </TableRow>

                {isLoadingTransactions ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Fetching transactions...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm text-muted-foreground">No transactions found</p>
                        <ButtonUI variant="outline" size="sm" onClick={fetchTransactions} className="mt-2">
                          Refresh
                        </ButtonUI>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((transaction, index) => (
                    <TableRow key={transaction.id} className="has-[[data-state=checked]]:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <Checkbox 
                          id={`table-checkbox-${transaction.id}`}
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={() => toggleTransaction(transaction.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {transaction.start_date ? format(new Date(transaction.start_date), 'MM/dd/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{transaction.transaction_type || 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {selectedAccount !== 'all' ? (
                          accounts.find(a => a.id === selectedAccount)?.account_name || 'N/A'
                        ) : (
                          transaction.data?.lines?.[0]?.category ? (
                            accounts.find(a => 
                              a.id === transaction.data.lines![0].category || 
                              a.sub_accounts?.some(sa => sa.id === transaction.data.lines![0].category)
                            )?.account_name || transaction.data.lines[0].category
                          ) : 'N/A'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {properties.find(p => p.id === transaction.property)?.name || transaction.property || 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
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
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.memo?.root?.children?.[0]?.children?.length === 0 ? '-' : transaction.memo?.content || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format((() => {
                          if (!transaction.data) return 0;
                          
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
                      <TableCell className="text-right whitespace-nowrap">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(calculateRunningBalance(transaction, indexOfFirstItem + index))}
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
            {transactions.length > 0 && (
              <div className="flex items-center justify-between space-x-1 py-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    {accountingMethod === 'cash' ? 'Cash' : 'Accrual'} Basis • {format(currentDateTime, "MMM d, yyyy h:mm a")}
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