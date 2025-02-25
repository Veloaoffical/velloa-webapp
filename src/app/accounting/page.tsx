"use client"

import Link from "next/link"
import { XAxis, Legend, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  DollarSign, Receipt, FileText, CircleDollarSign, ArrowUpRight,
  ArrowRightLeft, FileSpreadsheet, Printer, CreditCard, Clock, Calculator, BanknoteIcon, FileCheck,
  ChevronDown, Wallet, ArrowLeftRight,
  Banknote,
  HandCoins,
  ChartPie
} from "lucide-react"
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { JournalEntryDialog } from "./components/JournalEntryDialog"
import { BankTransferDialog } from "./components/BankTransferDialog"
import { PostChargeDialog } from "./components/PostChargeDialog"
import { ExpenseDialog } from "./components/ExpenseDialog"
import { CheckDialog } from "./components/CheckDialog"
import { BankDepositDialog } from "./components/BankDepositDialog"
import { ReceivePaymentDialog } from "./components/ReceivePaymentDialog"

const profitLossData = [
  { month: "Jan", revenue: 4500, costs: 3000, netIncome: 1500 },
  { month: "Feb", revenue: 5000, costs: 3200, netIncome: 1800 },
  { month: "Mar", revenue: 4800, costs: 3100, netIncome: 1700 },
  { month: "Apr", revenue: 5200, costs: 3500, netIncome: 1700 },
  { month: "May", revenue: 5000, costs: 3400, netIncome: 1600 },
  { month: "Jun", revenue: 5500, costs: 3600, netIncome: 1900 }
]

const profitLossConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(142, 76%, 36%)', // green-600
  },
  costs: {
    label: 'Costs',
    color: 'hsl(0, 84%, 60%)', // red-600
  },
  netIncome: {
    label: 'Net Income',
    color: 'hsl(217, 91%, 60%)', // blue-600
  }
} satisfies ChartConfig

const monthlyTrendsData = [
  { month: "Jan", income: 2500, expenses: 1800 },
  { month: "Feb", income: 3000, expenses: 2200 },
  { month: "Mar", income: 2800, expenses: 2000 },
  { month: "Apr", income: 3200, expenses: 2400 },
  { month: "May", income: 3000, expenses: 2200 },
  { month: "Jun", income: 3500, expenses: 2600 }
]

const monthlyTrendsConfig = {
  income: {
    label: 'Income',
    color: 'hsl(217, 91%, 60%)', // blue-600
  },
  expenses: {
    label: 'Expenses',
    color: 'hsl(0, 84%, 60%)', // red-600
  }
} satisfies ChartConfig

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: AnimatedNumberProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) => 
    Math.round(latest).toLocaleString('en-US')
  )

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 1.5,
        ease: "easeOut"
      })
      return controls.stop
    }
  }, [isInView, value, motionValue])

  return (
    <motion.span ref={ref} className="text-2xl font-semibold">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}

export default function AccountingPage() {
  const [showJournalEntryDialog, setShowJournalEntryDialog] = useState(false)
  const [showBankTransferDialog, setShowBankTransferDialog] = useState(false)
  const [showPostChargeDialog, setShowPostChargeDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showCheckDialog, setShowCheckDialog] = useState(false)
  const [showBankDepositDialog, setShowBankDepositDialog] = useState(false)
  const [showReceivePaymentDialog, setShowReceivePaymentDialog] = useState(false)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">Manage your financial records and transactions.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <DollarSign className="w-4 h-4" />
              New Transaction
              <ChevronDown className="w-4 h-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
            <DropdownMenuLabel>Tenant Transactions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setShowPostChargeDialog(true)}>
                <Banknote className="w-4 h-4 me-2 opacity-60" />
                Post Charge
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReceivePaymentDialog(true)}>
                <HandCoins className="w-4 h-4 me-2 opacity-60" />
                Receive Payment
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="w-4 h-4 me-2 opacity-60" />
                Issue Credit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowLeftRight className="w-4 h-4 me-2 opacity-60" />
                Give Refund
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wallet className="w-4 h-4 me-2 opacity-60" />
                Withhold Deposit
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Vendor Transactions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 me-2 opacity-60" />
                Create Bill
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DollarSign className="w-4 h-4 me-2 opacity-60" />
                Pay Bills
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="w-4 h-4 me-2 opacity-60" />
                Add Credit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Receipt className="w-4 h-4 me-2 opacity-60" />
                Management Fees
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Owner Transactions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Banknote className="w-4 h-4 me-2 opacity-60" />
                Owner Contribution
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ChartPie className="w-4 h-4 me-2 opacity-60" />
                Owner Distribution
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Other Transactions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setShowJournalEntryDialog(true)}>
                <FileText className="w-4 h-4 me-2 opacity-60" />
                Journal Entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBankTransferDialog(true)}>
                <ArrowLeftRight className="w-4 h-4 me-2 opacity-60" />
                Bank Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBankDepositDialog(true)}>
                <Wallet className="w-4 h-4 me-2 opacity-60" />
                Bank Deposit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowExpenseDialog(true)}>
                <Receipt className="w-4 h-4 me-2 opacity-60" />
                Expense
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCheckDialog(true)}>
                <CreditCard className="w-4 h-4 me-2 opacity-60" />
                Check
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Charts and Stats Section */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1200px]">
          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-4">
            {/* Revenue/Cost Chart */}
            <Card className="col-span-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Revenue & Costs</CardTitle>
                    <CardDescription>Monthly financial overview</CardDescription>
                  </div>
                  <Button variant="ghost" className="text-xs text-primary hover:underline">
                    View details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={profitLossConfig}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={profitLossData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={11}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        fill="var(--color-revenue)"
                        fillOpacity={0.4}
                      />
                      <Area
                        type="monotone"
                        dataKey="costs"
                        stroke="var(--color-costs)"
                        fill="var(--color-costs)"
                        fillOpacity={0.4}
                      />
                      <Area
                        type="monotone"
                        dataKey="netIncome"
                        stroke="var(--color-netIncome)"
                        fill="var(--color-netIncome)"
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Monthly Trends Chart */}
            <Card className="col-span-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Monthly Trends</CardTitle>
                    <CardDescription>Income vs Expenses</CardDescription>
                  </div>
                  <Button variant="ghost" className="text-xs text-primary hover:underline">
                    View details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={monthlyTrendsConfig}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={monthlyTrendsData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        fontSize={11}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="var(--color-income)"
                        fill="var(--color-income)"
                        fillOpacity={0.4}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="var(--color-expenses)"
                        fill="var(--color-expenses)"
                        fillOpacity={0.4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Quick Stats 2x2 Grid */}
            <div className="col-span-4 grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </div>
                    <div className="mt-1">
                      <AnimatedNumber value={30000} prefix="$" />
                      <div className="flex items-center mt-1">
                        <ArrowUpRight className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">+12% from last month</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                    </div>
                    <div className="mt-1">
                      <AnimatedNumber value={19800} prefix="$" />
                      <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <CircleDollarSign className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-muted-foreground">Net Income</p>
                    </div>
                    <div className="mt-1">
                      <AnimatedNumber value={10200} prefix="$" />
                      <p className="text-xs text-muted-foreground mt-1">This month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                    </div>
                    <div className="mt-1">
                      <AnimatedNumber value={5400} prefix="$" />
                      <p className="text-xs text-muted-foreground mt-1">To collect</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/accounting/chart-of-accounts">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Chart of Accounts</h3>
                  <p className="text-sm text-muted-foreground">View and manage account charts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Incoming Payments</h3>
                <p className="text-sm text-muted-foreground">Manage incoming payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <BanknoteIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Outgoing Payments</h3>
                <p className="text-sm text-muted-foreground">Manage outgoing payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Transactions</h3>
                <p className="text-sm text-muted-foreground">View and manage transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Reconciliation</h3>
                <p className="text-sm text-muted-foreground">Reconcile your accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Link href="/reports">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Reports</h3>
                  <p className="text-sm text-muted-foreground">View and generate reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Budgeting</h3>
                <p className="text-sm text-muted-foreground">Manage your budgets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <CircleDollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Recurring Transactions</h3>
                <p className="text-sm text-muted-foreground">Manage recurring payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/accounting/print-checks">
          <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Printer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">Print Checks</h3>
                  <p className="text-sm text-muted-foreground">Print and manage checks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Bills & Expenses</h3>
                <p className="text-sm text-muted-foreground">Manage bills and expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Open Bills</h3>
                <p className="text-sm text-muted-foreground">View and manage open bills</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium leading-none mb-1">Charge Payments</h3>
                <p className="text-sm text-muted-foreground">Manage charge payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <JournalEntryDialog
        open={showJournalEntryDialog}
        onOpenChange={setShowJournalEntryDialog}
      />
      <BankTransferDialog
        open={showBankTransferDialog}
        onOpenChange={setShowBankTransferDialog}
      />
      <PostChargeDialog 
        open={showPostChargeDialog}
        onOpenChange={setShowPostChargeDialog}
      />
      <ExpenseDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
      />
      <CheckDialog
        open={showCheckDialog}
        onOpenChange={setShowCheckDialog}
      />
      <BankDepositDialog
        open={showBankDepositDialog}
        onOpenChange={setShowBankDepositDialog}
      />
      <ReceivePaymentDialog
        open={showReceivePaymentDialog}
        onOpenChange={setShowReceivePaymentDialog}
      />
    </div>
  )
} 