"use client"

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
  TableFooter,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"

interface Account {
  id: string
  account_name: string
  account_type: string
  account_subtype: string
  active_account: boolean
  check_printing_enabled: boolean
  transit_number?: string
  institution_number?: string
  account_number?: string
  next_check_number?: string
}

interface CheckPayment {
  id: string
  payee: string
  amount: number
  date: string
  status: 'pending' | 'printed' | 'voided'
  memo?: string
  account_id: string
  check_number?: string
  property?: string
}

export default function PrintChecksPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedChecks, setSelectedChecks] = useState<string[]>([])
  const [checkPayments, setCheckPayments] = useState<CheckPayment[]>([])
  const currentDateTime = new Date()
  
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
  const [accounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')

  // Fetch check payments when filters change
  const fetchCheckPayments = async () => {
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

      if (selectedProperty && selectedProperty !== 'all') {
        params.append('property_id', selectedProperty)
      }

      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/accounting/checks?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch check payments')
      const data = await response.json()
      setCheckPayments(data)
    } catch (error) {
      console.error('Error fetching check payments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts and when filters change
  useEffect(() => {
    fetchCheckPayments()
  }, [selectedAccount, dateRange, selectedProperty, selectedStatus])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    if (period !== 'custom') {
      setDateRange(getDateRangeForPeriod(period))
    }
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
        <h1 className="text-xl font-semibold">Print Checks</h1>
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

                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.filter(a => a.check_printing_enabled).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="printed">Printed</SelectItem>
                    <SelectItem value="voided">Voided</SelectItem>
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
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Memo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(10)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5}>Total</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : checkPayments.length === 0 ? (
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
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Memo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No checks found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[30px]">
                      <Checkbox
                        checked={selectedChecks.length === checkPayments.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedChecks(checkPayments.map(p => p.id))
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
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Memo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedChecks.includes(payment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedChecks([...selectedChecks, payment.id])
                            } else {
                              setSelectedChecks(selectedChecks.filter(id => id !== payment.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{format(new Date(payment.date), "MM/dd/yyyy")}</TableCell>
                      <TableCell>{payment.check_number || '-'}</TableCell>
                      <TableCell>Check</TableCell>
                      <TableCell>{payment.payee}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.memo || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5}>Total</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(checkPayments.reduce((sum, p) => sum + p.amount, 0))}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
            <p className="text-center text-sm text-muted-foreground">
              {format(currentDateTime, "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 