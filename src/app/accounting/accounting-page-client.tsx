'use client';

import { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { XAxis, Legend, Area, AreaChart, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  DollarSign, Receipt, FileText, CircleDollarSign,
  CreditCard,
  ChevronDown, Wallet, ArrowLeftRight,
  Banknote,
  HandCoins,
} from "lucide-react";
import { JournalEntryDialog } from "./components/JournalEntryDialog";
import { BankTransferDialog } from "./components/BankTransferDialog";
import { PostChargeDialog } from "./components/PostChargeDialog";
import { ExpenseDialog } from "./components/ExpenseDialog";
import { CheckDialog } from "./components/CheckDialog";
import { BankDepositDialog } from "./components/BankDepositDialog";
import { ReceivePaymentDialog } from "./components/ReceivePaymentDialog";
import { VendorBillDialog } from "./components/VendorBillDialog";
import { IssueCreditDialog } from "./components/IssueCreditDialog";
import { IssueRefundDialog } from "./components/IssueRefundDialog";
import { AddVendorCreditDialog } from "./components/AddVendorCreditDialog";

// Define interface for financial data locally to avoid circular imports
interface FinancialData {
  totalExpenses: number;
  totalRevenue: number;
  netIncome: number;
  outstanding: number;
  transactions: {
    date: string;
    amount: number;
    type: 'expense' | 'revenue';
  }[];
}

// Helper function to determine the number of months to display based on actual transaction data
const determineMonthsToShow = (transactions: FinancialData['transactions'] = []) => {
  if (!transactions || transactions.length === 0) return 3; // Default to 3 months if no data

  // Get the earliest and latest transaction dates
  const dates = transactions.map(t => new Date(t.date));
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Calculate the difference in months
  const monthsDiff = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
                    (latestDate.getMonth() - earliestDate.getMonth()) + 1;

  // Return either 3 or 6 months based on the actual data span
  if (monthsDiff <= 3) return 3;
  return Math.min(6, monthsDiff); // Cap at 6 months
}

// Generate chart data based on the number of months we can show
const generateProfitLossData = (totalRevenue: number, totalExpenses: number, netIncome: number, transactions: FinancialData['transactions'] = []) => {
  const monthsToShow = determineMonthsToShow(transactions);
  const now = new Date();
  const data = [];
  
  // Get the latest transaction date to use as reference point
  const latestTransactionDate = transactions && transactions.length > 0 
    ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
    : now;
  
  // Generate data for each month
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthDate = new Date(latestTransactionDate);
    monthDate.setMonth(latestTransactionDate.getMonth() - i);
    
    // Format month name (e.g., "Jan", "Feb")
    const monthName = monthDate.toLocaleString('en-US', { month: 'short' });
    
    if (!transactions || transactions.length === 0) {
      // If no transactions at all, show zeros for all months
      data.push({
        month: monthName,
        revenue: 0,
        costs: 0,
        netIncome: 0
      });
      continue;
    }
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === monthDate.getMonth() && 
             tDate.getFullYear() === monthDate.getFullYear();
    });

    // Calculate actual values for this month
    const monthRevenue = monthTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthCosts = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthNetIncome = monthRevenue - monthCosts;
    
    data.push({
      month: monthName,
      revenue: monthRevenue,
      costs: monthCosts,
      netIncome: monthNetIncome
    });
  }
  
  return data;
};

const generateMonthlyTrendsData = (totalRevenue: number, totalExpenses: number, transactions: FinancialData['transactions'] = []) => {
  const monthsToShow = determineMonthsToShow(transactions);
  const now = new Date();
  const data = [];
  
  // Get the latest transaction date to use as reference point
  const latestTransactionDate = transactions && transactions.length > 0 
    ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
    : now;
  
  // Generate data for each month
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthDate = new Date(latestTransactionDate);
    monthDate.setMonth(latestTransactionDate.getMonth() - i);
    
    // Format month name (e.g., "Jan", "Feb")
    const monthName = monthDate.toLocaleString('en-US', { month: 'short' });
    
    if (!transactions || transactions.length === 0) {
      // If no transactions at all, show zeros for all months
      data.push({
        month: monthName,
        income: 0,
        expenses: 0
      });
      continue;
    }
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === monthDate.getMonth() && 
             tDate.getFullYear() === monthDate.getFullYear();
    });

    // Calculate actual values for this month
    const monthIncome = monthTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    data.push({
      month: monthName,
      income: monthIncome,
      expenses: monthExpenses
    });
  }
  
  return data;
};

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
} satisfies ChartConfig;

const monthlyTrendsConfig = {
  income: {
    label: 'Income',
    color: 'hsl(217, 91%, 60%)', // blue-600
  },
  expenses: {
    label: 'Expenses',
    color: 'hsl(0, 84%, 60%)', // red-600
  }
} satisfies ChartConfig;

// AnimatedNumber component for displaying animated financial figures
interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: AnimatedNumberProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => 
    Math.round(latest).toLocaleString('en-US')
  );

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration: 1.5,
        ease: "easeOut"
      });
      return controls.stop;
    }
  }, [isInView, value, motionValue]);

  return (
    <motion.span ref={ref} className="text-2xl font-semibold">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}

interface AccountingPageClientProps {
  initialFinancialData?: FinancialData; // Make it optional for initial render
}

export default function AccountingPageClient({ initialFinancialData }: AccountingPageClientProps) {
  // Dialog states
  const [showJournalEntryDialog, setShowJournalEntryDialog] = useState(false);
  const [showBankTransferDialog, setShowBankTransferDialog] = useState(false);
  const [showPostChargeDialog, setShowPostChargeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [showBankDepositDialog, setShowBankDepositDialog] = useState(false);
  const [showReceivePaymentDialog, setShowReceivePaymentDialog] = useState(false);
  const [showBillsDialog, setShowBillsDialog] = useState(false);
  const [showIssueCreditDialog, setShowIssueCreditDialog] = useState(false);
  const [showIssueRefundDialog, setShowIssueRefundDialog] = useState(false);
  const [showAddVendorCreditDialog, setShowAddVendorCreditDialog] = useState(false);
  
  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Destructure with defaults, will be populated when initialFinancialData arrives
  const { 
    totalExpenses = 0, 
    totalRevenue = 0, 
    netIncome = 0, 
    outstanding = 0, 
    transactions = [] 
  } = initialFinancialData || {};
  
  // Chart data generation will run when transactions are available
  // It's okay for them to be empty initially if transactions is empty
  const profitLossData = generateProfitLossData(totalRevenue, totalExpenses, netIncome, transactions);
  const monthlyTrendsData = generateMonthlyTrendsData(totalRevenue, totalExpenses, transactions);
  const monthsDisplayed = determineMonthsToShow(transactions);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">Manage your financial records and transactions.</p>
        </div>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
              <DropdownMenuItem onClick={() => {
                setShowPostChargeDialog(true);
                setDropdownOpen(false);
              }}>
                <Banknote className="w-4 h-4 me-2 opacity-60" />
                Post Charge
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowReceivePaymentDialog(true);
                setDropdownOpen(false);
              }}>
                <HandCoins className="w-4 h-4 me-2 opacity-60" />
                Receive Payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowIssueCreditDialog(true);
                setDropdownOpen(false);
              }}>
                <CreditCard className="w-4 h-4 me-2 opacity-60" />
                Issue Credit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowIssueRefundDialog(true);
                setDropdownOpen(false);
              }}>
                <ArrowLeftRight className="w-4 h-4 me-2 opacity-60" />
                Give Refund
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDropdownOpen(false)}>
                <Wallet className="w-4 h-4 me-2 opacity-60" />
                Withhold Deposit
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Vendor Transactions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => {
                setShowBillsDialog(true);
                setDropdownOpen(false);
              }}>
                <FileText className="w-4 h-4 me-2 opacity-60" />
                Create Bill
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/accounting/pay-bills" className="flex items-center" onClick={() => setDropdownOpen(false)}>
                  <DollarSign className="w-4 h-4 me-2 opacity-60" />
                  Pay Bills
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowAddVendorCreditDialog(true);
                setDropdownOpen(false);
              }}>
                <CreditCard className="w-4 h-4 me-2 opacity-60" />
                Add Credit
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Other Transactions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => {
                setShowJournalEntryDialog(true);
                setDropdownOpen(false);
              }}>
                <FileText className="w-4 h-4 me-2 opacity-60" />
                Journal Entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowBankTransferDialog(true);
                setDropdownOpen(false);
              }}>
                <ArrowLeftRight className="w-4 h-4 me-2 opacity-60" />
                Bank Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowBankDepositDialog(true);
                setDropdownOpen(false);
              }}>
                <Wallet className="w-4 h-4 me-2 opacity-60" />
                Bank Deposit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowExpenseDialog(true);
                setDropdownOpen(false);
              }}>
                <Receipt className="w-4 h-4 me-2 opacity-60" />
                Expense
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setShowCheckDialog(true);
                setDropdownOpen(false);
              }}>
                <CreditCard className="w-4 h-4 me-2 opacity-60" />
                Check
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Charts and Stats Section - these will be filled when data arrives */}
      {/* The loading skeleton in page.tsx will handle the empty state for these */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-12 gap-4">
            {/* Revenue/Cost Chart */}
            <Card className="col-span-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Revenue & Costs</CardTitle>
                    <CardDescription>Last {monthsDisplayed} months</CardDescription>
                  </div>
                  <Button variant="ghost" className="text-xs text-primary hover:underline">
                    View details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={profitLossConfig}>
                  <AreaChart
                    width={500}
                    height={200}
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
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Monthly Trends Chart */}
            <Card className="col-span-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Monthly Trends</CardTitle>
                    <CardDescription>Last {monthsDisplayed} months</CardDescription>
                  </div>
                  <Button variant="ghost" className="text-xs text-primary hover:underline">
                    View details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={monthlyTrendsConfig}>
                  <AreaChart
                    width={500}
                    height={200}
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
                      <AnimatedNumber value={totalRevenue} prefix="$" />
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
                      <AnimatedNumber value={totalExpenses} prefix="$" />
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
                      <AnimatedNumber value={netIncome} prefix="$" />
                      <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
                      <AnimatedNumber value={outstanding} prefix="$" />
                      <p className="text-xs text-muted-foreground mt-1">To collect</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
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
      <VendorBillDialog
        open={showBillsDialog}
        onOpenChange={setShowBillsDialog}
      />
      <IssueCreditDialog
        open={showIssueCreditDialog}
        onOpenChange={setShowIssueCreditDialog}
      />
      <IssueRefundDialog
        open={showIssueRefundDialog}
        onOpenChange={setShowIssueRefundDialog}
      />
      <AddVendorCreditDialog
        open={showAddVendorCreditDialog}
        onOpenChange={setShowAddVendorCreditDialog}
      />
    </>
  );
} 