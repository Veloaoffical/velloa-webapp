"use client"

import { useState, useId } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { RangeCalendar } from "@/components/ui/calendar-rac"
import { DateInput, dateInputStyle } from "@/components/ui/datefield-rac"
import { Button, DateRangePicker, Dialog, Group, Label, Popover } from "react-aria-components"

// Mock data for demonstration
const transactions = [
  {
    id: 1,
    date: "2/14/2024",
    type: "Deposit",
    account: "Operating Account 2",
    property: "500 Northwest 15th S",
    name: "",
    description: "February Rent Payment",
    memo: "Automatically created",
    runningBalance: "$1,000.00",
    amount: "$1,000.00"
  },
  {
    id: 2,
    date: "2/16/2024",
    type: "Deposit",
    account: "Operating Account 2",
    property: "698 Northwest 1st Ave",
    name: "",
    description: "Security Deposit",
    memo: "Automatically created",
    runningBalance: "$11,000.00",
    amount: "$10,000.00"
  },
  {
    id: 3,
    date: "2/16/2024",
    type: "Deposit",
    account: "Bank E (Contra Accts)",
    property: "1900 North Bayshore",
    name: "",
    description: "Monthly Parking Fee",
    memo: "Automatically created",
    runningBalance: "$13,000.00",
    amount: "$2,000.00"
  },
  // Add more mock data as needed
]

export default function TransactionsListReport() {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set())
  const tableId = useId()
  const currentDateTime = new Date()

  const toggleTransaction = (id: number) => {
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

  // Calculate totals
  const totalAmount = transactions.reduce((sum, transaction) => {
    const amount = parseFloat(transaction.amount.replace('$', '').replace(',', ''))
    return sum + amount
  }, 0)

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
          <div className="flex items-center gap-4 border-b pb-4">
            <Select defaultValue="all-time">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Date Range</Label>
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
                  <RangeCalendar />
                </Dialog>
              </Popover>
            </DateRangePicker>

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="property">Property</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="deposit">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="charge">Charge</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="space-y-2">
            <Table>
              <TableHeader>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Memo</TableHead>
                  <TableHead className="text-right">Running Balance</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="has-[[data-state=checked]]:bg-muted/50">
                    <TableCell>
                      <Checkbox 
                        id={`table-checkbox-${transaction.id}`}
                        checked={selectedTransactions.has(transaction.id)}
                        onCheckedChange={() => toggleTransaction(transaction.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{transaction.date}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.account}</TableCell>
                    <TableCell>{transaction.property}</TableCell>
                    <TableCell>{transaction.name}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.memo}</TableCell>
                    <TableCell className="text-right">{transaction.runningBalance}</TableCell>
                    <TableCell className="text-right">{transaction.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-transparent">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9}>Total</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(totalAmount)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <p className="text-center text-sm text-muted-foreground">
              Cash Basis • {format(currentDateTime, "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 