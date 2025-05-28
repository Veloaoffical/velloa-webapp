"use client"

import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button as ButtonUI } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { ArrowLeft, CalendarIcon, SlidersHorizontal, X, Settings } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

interface TransactionData {
  lines: {
    unit: string
    category: string
    description: string
    debit_amount: number
    credit_amount: number
  }[]
  total_amount: number
  payment_method: string
  memo?: string
  check_number?: string
}

interface PayeeDetails {
  id: string
  full_name: string
  company_name?: string
}

interface RawTransaction {
  id: string
  created_at: string
  transaction_type: string | null
  property: string | null
  nano: string | null
  payee: string | null
  start_date: string | null
  due_date: string | null
  repeat_infinite: boolean | null
  data: TransactionData
  frequency: string | null
  created_by: string | null
  company: string | null
  memo: Record<string, unknown> | null
  frequency_type: string | null
  reference: string | null
}

interface Transaction extends RawTransaction {
  payeeDetails?: PayeeDetails
}

interface ChartOfAccount {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  account_description?: string
  account_balance: number
  active_account: boolean
  sub_account?: boolean
  parent_account?: string
}

interface PrintChecksClientProps {
  initialAccounts: ChartOfAccount[]
  initialTransactions: Transaction[]
}

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

export function PrintChecksClient({ initialAccounts, initialTransactions }: PrintChecksClientProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedChecks, setSelectedChecks] = useState<string[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(initialAccounts)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const currentDateTime = new Date()
  const router = useRouter()
  
  // Fetch chart of accounts - used when refreshing data
  const fetchChartOfAccounts = async () => {
    try {
      setAccountsLoading(true)
      const response = await fetch('/api/accounting/chart-of-accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch chart of accounts')
      }
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error fetching chart of accounts:', error)
      setAccounts([])
    } finally {
      setAccountsLoading(false)
    }
  }

  // Refresh accounts data when needed
  useEffect(() => {
    // Only fetch if we don't have initial accounts
    if (initialAccounts.length === 0) {
      fetchChartOfAccounts()
    }
  }, [initialAccounts.length])

  // Define a type for our date range that can handle null values
  type CustomDateRange = {
    start: CalendarDate | null;
    end: CalendarDate | null;
  };

  const getDateRangeForPeriod = (period: string): CustomDateRange => {
    switch (period) {
      case 'all-time':
        return {
          start: null,
          end: null
        }
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
      case 'last-month': {
        // Get the first and last day of the previous month
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        
        return {
          start: parseDate(format(lastMonth, "yyyy-MM-dd")),
          end: parseDate(format(lastDayOfLastMonth, "yyyy-MM-dd"))
        }
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

  const [selectedPeriod, setSelectedPeriod] = useState('last-month')
  const [dateRange, setDateRange] = useState<CustomDateRange>(getDateRangeForPeriod('last-month'))
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('all')

  // Fetch transactions when filters change
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedAccount && selectedAccount !== 'all') {
        params.append('data->lines->category', selectedAccount)
      }
      
      if (dateRange.start) {
        params.append('start_date', dateRange.start.toString())
      }
      
      if (dateRange.end) {
        params.append('end_date', dateRange.end.toString())
      }

      if (selectedProperty && selectedProperty !== 'all') {
        params.append('property_id', selectedProperty)
      }

      if (selectedTransactionType && selectedTransactionType !== 'all') {
        params.append('transaction_type', selectedTransactionType)
      }

      // Add payment method filter
      params.append('data->payment_method', 'check_inapp')

      const response = await fetch(`/api/accounting/transactions?${params.toString()}`)
      if (!response.ok) {
        console.error('API Response not OK:', response.status, response.statusText)
        throw new Error('Failed to fetch transactions')
      }
      
      const rawData = await response.json()
      
      try {
        // Handle both data.data and direct data array formats
        const data = rawData.data || rawData
        
        if (!Array.isArray(data)) {
          console.error('Data is not an array:', data)
          throw new Error('Invalid data format')
        }

        const parsedData: Transaction[] = data.map((item: RawTransaction) => ({
          ...item,
          data: {
            ...item.data,
            payment_method: item.data?.payment_method || 'unknown'
          }
        }))
        
        const checkTransactions = parsedData.filter((transaction: Transaction) => {
          const paymentMethod = transaction?.data?.payment_method
          return paymentMethod === 'check_inapp'
        })

        // Fetch payee details for filtered transactions
        const transactionsWithPayees = await fetchPayeeDetails(checkTransactions)
        
        setTransactions(transactionsWithPayees)
      } catch (error) {
        console.error('Error parsing transaction data:', error)
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts and when filters change
  useEffect(() => {
    fetchTransactions()
  }, [selectedAccount, dateRange, selectedProperty, selectedTransactionType])

  // Fetch payee details for a list of transactions
  const fetchPayeeDetails = async (transactions: Transaction[]): Promise<Transaction[]> => {
    try {
      // Get unique payee IDs
      const payeeIds = [...new Set(transactions.filter(t => t.payee).map(t => t.payee))]
      
      if (payeeIds.length === 0) return transactions

      // Create a map to store payee details
      const payeeMap = new Map<string, PayeeDetails>()

      // Fetch from each role-based endpoint
      const endpoints = [
        '/api/people/owner/search',
        '/api/people/vendor/search',
        '/api/people/tenants/search'
      ]

      // Fetch from all endpoints in parallel
      const responses = await Promise.all(endpoints.map(endpoint => fetch(endpoint)))
      const results = await Promise.all(responses.map(r => r.json()))

      // Combine all results
      const allPeople = results.flat()

      // Create a map of payee details
      allPeople.forEach(person => {
        if (payeeIds.includes(person.id)) {
          payeeMap.set(person.id, {
            id: person.id,
            full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
            company_name: person.company
          })
        }
      })

      // Add payee details to transactions
      return transactions.map(transaction => ({
        ...transaction,
        payeeDetails: transaction.payee ? payeeMap.get(transaction.payee) : undefined
      }))
    } catch (error) {
      console.error('Error fetching payee details:', error)
      return transactions
    }
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      setDateRange(getDateRangeForPeriod(period))
    }
  }

  // Format transaction type helper
  const formatTransactionType = (type: string | null): string => {
    if (!type) return 'Check'
    switch (type.toLowerCase()) {
      case 'expense':
        return 'Expense'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/accounting">
          <ButtonUI variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </ButtonUI>
        </Link>
        <h1 className="text-xl font-semibold">Print Checks</h1>
      </div>

      {/* Main Card with Table */}
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
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                <DateRangePicker 
                  className="flex items-center gap-2"
                  value={selectedPeriod === 'all-time' ? null : (dateRange.start && dateRange.end ? {
                    start: dateRange.start,
                    end: dateRange.end
                  } : undefined)}
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
                        value={selectedPeriod === 'all-time' ? null : (dateRange.start && dateRange.end ? {
                          start: dateRange.start,
                          end: dateRange.end
                        } : undefined)}
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

                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder={accountsLoading ? "Loading..." : "Account"}>
                      {selectedAccount && accounts.reduce((name, account) => {
                        if (account.id === selectedAccount) {
                          return account.account_name;
                        }
                        return name;
                      }, "")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Accounts</SelectItem>
                    {Object.entries(
                      accounts.reduce((acc, account) => {
                        if (!account.sub_account) {
                          if (!acc[account.account_type]) {
                            acc[account.account_type] = [];
                          }
                          // Add main account with its sub-accounts
                          const subAccounts = accounts.filter(a => 
                            a.sub_account && a.parent_account === account.id
                          );
                          acc[account.account_type].push({
                            ...account,
                            subAccounts
                          });
                        }
                        return acc;
                      }, {} as Record<string, (ChartOfAccount & { subAccounts: ChartOfAccount[] })[]>)
                    ).map(([type, mainAccounts]) => (
                      <SelectGroup key={type}>
                        <SelectLabel>{type}</SelectLabel>
                        {mainAccounts.map((mainAccount) => (
                          <React.Fragment key={mainAccount.id}>
                            <SelectItem value={mainAccount.id}>
                              <div className="flex flex-col">
                                <span>{mainAccount.account_name}</span>
                                <span className="text-xs text-muted-foreground">{mainAccount.account_subtype}</span>
                              </div>
                            </SelectItem>
                            {mainAccount.subAccounts.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="pl-4 text-xs">
                                  {mainAccount.account_name} Sub-accounts
                                </SelectLabel>
                                {mainAccount.subAccounts.map((subAccount) => (
                                  <SelectItem 
                                    key={subAccount.id} 
                                    value={subAccount.id}
                                    className="pl-6"
                                  >
                                    <div className="flex flex-col">
                                      <span>{subAccount.account_name}</span>
                                      <span className="text-xs text-muted-foreground">{subAccount.account_subtype}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </React.Fragment>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedTransactionType}
                  onValueChange={setSelectedTransactionType}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="bill">Bill</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
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

                <ButtonUI
                  variant="ghost"
                  size="icon"
                  className={cn(dateInputStyle, "w-9 h-9 p-0")}
                  onClick={() => router.push('/accounting/print-checks/settings')}
                >
                  <Settings className="h-4 w-4" />
                </ButtonUI>
              </div>

              {showFilters && (
                <div className="grid grid-cols-6 gap-4 animate-in slide-in-from-top-2 duration-200 fade-in-0 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2 data-[state=closed]:fade-out-0">
                  <Select
                    value={selectedProperty}
                    onValueChange={setSelectedProperty}
                  >
                    <SelectTrigger className={cn(dateInputStyle, "text-sm h-9")}>
                      <SelectValue placeholder="Property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {/* Add property options here */}
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
                    <TableHead className="w-[30px]">
                      <Checkbox
                        checked={false}
                        disabled
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Memo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LoadingRow colSpan={8} />
                </TableBody>
              </Table>
            ) : transactions.length === 0 ? (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[30px]">
                      <Checkbox
                        checked={false}
                        disabled
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Memo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No checks found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[30px]">
                        <Checkbox
                          checked={selectedChecks.length === transactions.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedChecks(transactions.map(t => t.id))
                            } else {
                              setSelectedChecks([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Payee</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Memo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      // Safely format the date from start_date
                      let formattedDate = '-'
                      try {
                        if (transaction.start_date) {
                          // Parse the timestampz
                          const date = new Date(transaction.start_date)
                          if (!isNaN(date.getTime())) {
                            formattedDate = format(date, "MM/dd/yyyy")
                          }
                        }
                      } catch (error) {
                        console.error('Error formatting date:', error)
                      }

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedChecks.includes(transaction.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedChecks([...selectedChecks, transaction.id])
                                } else {
                                  setSelectedChecks(selectedChecks.filter(id => id !== transaction.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>{formattedDate}</TableCell>
                          <TableCell>{transaction.data.check_number || '-'}</TableCell>
                          <TableCell>{formatTransactionType(transaction.transaction_type)}</TableCell>
                          <TableCell>
                            {transaction.payeeDetails ? (
                              <div>
                                <div className="font-medium">{transaction.payeeDetails.full_name}</div>
                                {transaction.payeeDetails.company_name && (
                                  <div className="text-sm text-muted-foreground">{transaction.payeeDetails.company_name}</div>
                                )}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{transaction.data.lines[0]?.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(transaction.data.total_amount)}
                          </TableCell>
                          <TableCell>{transaction.data.memo || '-'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </>
            )}
            <p className="text-center text-sm text-muted-foreground">
              {format(currentDateTime, "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-sm text-muted-foreground">Account Balance</div>
              <div className="text-lg font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(selectedAccount && selectedAccount !== 'all' 
                  ? accounts.find(a => a.id === selectedAccount)?.account_balance || 0
                  : 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Checks Selected</div>
              <div className="text-lg font-medium">{selectedChecks.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Selected Total</div>
              <div className="text-lg font-medium">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(transactions
                  .filter(t => selectedChecks.includes(t.id))
                  .reduce((sum, t) => sum + (t.data.total_amount || 0), 0)
                )}
              </div>
            </div>
          </div>
          <ButtonUI 
            variant="default"
            disabled={selectedChecks.length === 0}
            onClick={() => router.push(`/accounting/print-checks/check-preview?checks=${selectedChecks.join(',')}`)}
          >
            Print Selected Checks
          </ButtonUI>
        </CardContent>
      </Card>
    </div>
  )
} 