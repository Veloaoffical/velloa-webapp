"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Mock data for demonstration
const transactions = [
  {
    id: 1,
    date: "2/14/2024",
    type: "Deposit",
    account: "Operating Account 2",
    property: "500 Northwest 15th S",
    lease: "(Prorated Rent) John",
    name: "",
    memo: "Automatically created",
    amount: "$1,000.00"
  },
  {
    id: 2,
    date: "2/16/2024",
    type: "Deposit",
    account: "Operating Account 2",
    property: "698 Northwest 1st Ave",
    lease: "(Random Charge) D.",
    name: "",
    memo: "Automatically created",
    amount: "$10,000.00"
  },
  {
    id: 3,
    date: "2/16/2024",
    type: "Deposit",
    account: "Bank E (Contra Accts)",
    property: "1900 North Bayshore",
    lease: "Leslie Knope",
    name: "",
    memo: "Automatically created",
    amount: "$2,000.00"
  },
  // Add more mock data as needed
]

export default function TransactionsListReport() {
  const [date, setDate] = useState<Date>()
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set())

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/accounting/reports">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Transactions List Report</h1>
      </div>

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

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">From</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">To</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedTransactions.size === transactions.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Lease</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Memo</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTransactions.has(transaction.id)}
                    onCheckedChange={() => toggleTransaction(transaction.id)}
                  />
                </TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.type}</TableCell>
                <TableCell>{transaction.account}</TableCell>
                <TableCell>{transaction.property}</TableCell>
                <TableCell>{transaction.lease}</TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell>{transaction.memo}</TableCell>
                <TableCell className="text-right">{transaction.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 