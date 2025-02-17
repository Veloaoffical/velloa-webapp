"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon, Star } from "lucide-react"
import {
  FileText,
  Clock,
  CircleDollarSign,
  Receipt,
  CalendarClock,
  UserCheck,
  UserMinus,
  UserPlus,
  PawPrint,
  Car,
  UserCog,
  Share2,
  ClipboardList,
  FileCheck,
  FileX,
  Building,
  AlertCircle,
  Shield,
  MoveRight,
  MoveLeft,
  Hammer,
  HardDrive,
  Users,
  CalendarDays,
  MessageSquare,
  CheckCircle2,
  ListTodo,
  AlertOctagon,
  Wrench,
  ArrowUpCircle,
  User2,
  Users2,
  Home,
  Wallet2,
  BarChart,
  FileBarChart,
  ArrowLeftRight,
  FileSpreadsheet,
  Repeat,
  ScrollText,
  Building2,
  Banknote,
  FileBarChart2,
  LayoutList,
  TrendingUp,
  ArrowRightLeft,
  Wallet,
  DollarSign,
  Bed,
} from "lucide-react"

interface Report {
  title: string
  description: string
  icon: LucideIcon
  id: string
}

interface ReportSectionProps {
  title: string
  reports: Report[]
}

export default function ReportsPage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    const savedFavorites = localStorage.getItem('reportFavorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('reportFavorites', JSON.stringify(Array.from(favorites)))
  }, [favorites])

  const toggleFavorite = (reportId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(reportId)) {
        newFavorites.delete(reportId)
      } else {
        newFavorites.add(reportId)
      }
      return newFavorites
    })
  }

  const createReportId = (section: string, title: string) => {
    return `${section}-${title}`.toLowerCase().replace(/\s+/g, '-')
  }

  const businessOverviewReports: Report[] = [
    {
      title: "Balance Sheet",
      description: "View your complete balance sheet",
      icon: FileSpreadsheet,
      id: createReportId("business-overview", "Balance Sheet"),
    },
    {
      title: "Balance Sheet by Month",
      description: "Monthly breakdown of your balance sheet",
      icon: FileSpreadsheet,
      id: createReportId("business-overview", "Balance Sheet by Month"),
    },
    {
      title: "Balance Sheet by Property",
      description: "Property-wise view of balance sheet",
      icon: Building2,
      id: createReportId("business-overview", "Balance Sheet by Property"),
    },
    {
      title: "Balance Sheet by Quarter",
      description: "Quarterly view of balance sheet",
      icon: FileSpreadsheet,
      id: createReportId("business-overview", "Balance Sheet by Quarter"),
    },
    {
      title: "Balance Sheet by Year",
      description: "Yearly view of balance sheet",
      icon: FileSpreadsheet,
      id: createReportId("business-overview", "Balance Sheet by Year"),
    },
    {
      title: "Cash Flow Statement",
      description: "View your cash flow statement",
      icon: ArrowRightLeft,
      id: createReportId("business-overview", "Cash Flow Statement"),
    },
    {
      title: "Cash Flow Statement by Month",
      description: "Monthly breakdown of cash flow",
      icon: ArrowRightLeft,
      id: createReportId("business-overview", "Cash Flow Statement by Month"),
    },
    {
      title: "Cash Flow Statement by Property",
      description: "Property-wise view of cash flow",
      icon: Building2,
      id: createReportId("business-overview", "Cash Flow Statement by Property"),
    },
    {
      title: "Management Fees Report",
      description: "View management fees breakdown",
      icon: Receipt,
      id: createReportId("business-overview", "Management Fees Report"),
    },
    {
      title: "Owner Statement",
      description: "View owner statements",
      icon: Wallet,
      id: createReportId("business-overview", "Owner Statement"),
    },
    {
      title: "Profit and Loss",
      description: "View profit and loss statement",
      icon: TrendingUp,
      id: createReportId("business-overview", "Profit and Loss"),
    },
    {
      title: "Profit and Loss by Month",
      description: "Monthly breakdown of profit and loss",
      icon: TrendingUp,
      id: createReportId("business-overview", "Profit and Loss by Month"),
    },
    {
      title: "Profit and Loss by Property",
      description: "Property-wise view of profit and loss",
      icon: Building2,
      id: createReportId("business-overview", "Profit and Loss by Property"),
    },
    {
      title: "Profit and Loss by Quarter",
      description: "Quarterly view of profit and loss",
      icon: TrendingUp,
      id: createReportId("business-overview", "Profit and Loss by Quarter"),
    },
    {
      title: "Profit and Loss by Year",
      description: "Yearly view of profit and loss",
      icon: TrendingUp,
      id: createReportId("business-overview", "Profit and Loss by Year"),
    },
    {
      title: "Property Reserve Funds",
      description: "View property reserve funds",
      icon: Building2,
      id: createReportId("business-overview", "Property Reserve Funds"),
    },
    {
      title: "Rent Roll",
      description: "View complete rent roll",
      icon: DollarSign,
      id: createReportId("business-overview", "Rent Roll"),
    },
    {
      title: "Rent Roll Summary by Beds/Baths",
      description: "Rent roll summary by unit type",
      icon: Bed,
      id: createReportId("business-overview", "Rent Roll Summary by Beds/Baths"),
    },
    {
      title: "Rent Roll Summary by Property",
      description: "Property-wise rent roll summary",
      icon: Building2,
      id: createReportId("business-overview", "Rent Roll Summary by Property"),
    },
  ]

  const generalReports: Report[] = [
    {
      title: "Recurring Expenses",
      description: "View and manage recurring expenses",
      icon: Repeat,
      id: createReportId("general", "Recurring Expenses"),
    },
    {
      title: "Recurring Vendor Bills",
      description: "Track recurring bills from vendors",
      icon: Receipt,
      id: createReportId("general", "Recurring Vendor Bills"),
    },
    {
      title: "Account Register",
      description: "View detailed account transactions",
      icon: ScrollText,
      id: createReportId("general", "Account Register"),
    },
    {
      title: "Bank Balance By Property",
      description: "View bank balances for each property",
      icon: Building2,
      id: createReportId("general", "Bank Balance By Property"),
    },
    {
      title: "Deposit Transactions",
      description: "Track all deposit transactions",
      icon: Banknote,
      id: createReportId("general", "Deposit Transactions"),
    },
    {
      title: "ePay Transactions",
      description: "View electronic payment transactions",
      icon: FileBarChart2,
      id: createReportId("general", "ePay Transactions"),
    },
    {
      title: "Expense Transactions",
      description: "View all expense transactions",
      icon: Receipt,
      id: createReportId("general", "Expense Transactions"),
    },
    {
      title: "General Ledger",
      description: "Complete record of all financial transactions",
      icon: ScrollText,
      id: createReportId("general", "General Ledger"),
    },
    {
      title: "Property Bank Accounts",
      description: "View property-specific bank accounts",
      icon: Building2,
      id: createReportId("general", "Property Bank Accounts"),
    },
    {
      title: "Recurring Transactions Summary",
      description: "Overview of all recurring transactions",
      icon: Repeat,
      id: createReportId("general", "Recurring Transactions Summary"),
    },
    {
      title: "Refund Transactions",
      description: "Track all refund transactions",
      icon: ArrowLeftRight,
      id: createReportId("general", "Refund Transactions"),
    },
    {
      title: "Transactions List by Type",
      description: "View transactions organized by type",
      icon: LayoutList,
      id: createReportId("general", "Transactions List by Type"),
    },
    {
      title: "Transaction Details",
      description: "Detailed view of individual transactions",
      icon: FileText,
      id: createReportId("general", "Transaction Details"),
    },
    {
      title: "Transactions List",
      description: "Complete list of all transactions",
      icon: LayoutList,
      id: createReportId("general", "Transactions List"),
    },
    {
      title: "Trial Balance",
      description: "View trial balance report",
      icon: FileBarChart,
      id: createReportId("general", "Trial Balance"),
    },
    {
      title: "Undeposited Funds",
      description: "Track funds not yet deposited",
      icon: Banknote,
      id: createReportId("general", "Undeposited Funds"),
    },
  ]

  const whoOwesYouReports: Report[] = [
    {
      title: "Reversed Payment",
      description: "View and manage reversed payments",
      icon: ArrowLeftRight,
      id: createReportId("who-owes-you", "Reversed Payment"),
    },
    {
      title: "A/R Aging Detail",
      description: "Detailed view of accounts receivable aging",
      icon: Clock,
      id: createReportId("who-owes-you", "A/R Aging Detail"),
    },
    {
      title: "A/R Aging Detail by Account",
      description: "Account-wise breakdown of receivables aging",
      icon: FileSpreadsheet,
      id: createReportId("who-owes-you", "A/R Aging Detail by Account"),
    },
    {
      title: "A/R Aging Summary",
      description: "Summary of accounts receivable aging",
      icon: CircleDollarSign,
      id: createReportId("who-owes-you", "A/R Aging Summary"),
    },
    {
      title: "Recurring Payments (Auto-Pay)",
      description: "View and manage recurring auto-payments",
      icon: CalendarClock,
      id: createReportId("who-owes-you", "Recurring Payments (Auto-Pay)"),
    },
    {
      title: "Recurring Rent Transactions",
      description: "View recurring rent payment schedules",
      icon: CalendarClock,
      id: createReportId("who-owes-you", "Recurring Rent Transactions"),
    },
  ]

  const whatYouOweReports: Report[] = [
    {
      title: "A/P Aging Detail",
      description: "Detailed view of accounts payable aging",
      icon: Clock,
      id: createReportId("what-you-owe", "A/P Aging Detail"),
    },
    {
      title: "A/P Aging Detail by Account",
      description: "Account-wise breakdown of payables aging",
      icon: FileSpreadsheet,
      id: createReportId("what-you-owe", "A/P Aging Detail by Account"),
    },
    {
      title: "A/P Aging Summary",
      description: "Summary of accounts payable aging",
      icon: CircleDollarSign,
      id: createReportId("what-you-owe", "A/P Aging Summary"),
    },
    {
      title: "Bill Payments List",
      description: "List of all bill payments",
      icon: Receipt,
      id: createReportId("what-you-owe", "Bill Payments List"),
    },
    {
      title: "Unpaid Bills",
      description: "View all unpaid bills",
      icon: Receipt,
      id: createReportId("what-you-owe", "Unpaid Bills"),
    },
  ]

  const tenantReports: Report[] = [
    {
      title: "Current Tenants",
      description: "List of all current tenants",
      icon: UserCheck,
      id: createReportId("tenants", "Current Tenants"),
    },
    {
      title: "Future Tenants",
      description: "List of upcoming tenants",
      icon: UserPlus,
      id: createReportId("tenants", "Future Tenants"),
    },
    {
      title: "Previous Tenants",
      description: "List of past tenants",
      icon: UserMinus,
      id: createReportId("tenants", "Previous Tenants"),
    },
    {
      title: "Tenant Pets Report",
      description: "Information about tenant pets",
      icon: PawPrint,
      id: createReportId("tenants", "Tenant Pets Report"),
    },
    {
      title: "Tenant Vehicles Report",
      description: "Information about tenant vehicles",
      icon: Car,
      id: createReportId("tenants", "Tenant Vehicles Report"),
    },
  ]

  const prospectReports: Report[] = [
    {
      title: "Active Prospects",
      description: "View all active rental prospects",
      icon: UserCheck,
      id: createReportId("prospects", "Active Prospects"),
    },
    {
      title: "Lost Prospects",
      description: "View prospects that didn't convert",
      icon: UserMinus,
      id: createReportId("prospects", "Lost Prospects"),
    },
    {
      title: "Moved-In Prospects",
      description: "View prospects that became tenants",
      icon: UserPlus,
      id: createReportId("prospects", "Moved-In Prospects"),
    },
    {
      title: "Prospects by Leasing Agent",
      description: "View prospects grouped by leasing agent",
      icon: UserCog,
      id: createReportId("prospects", "Prospects by Leasing Agent"),
    },
    {
      title: "Prospects by Source",
      description: "View prospects grouped by lead source",
      icon: Share2,
      id: createReportId("prospects", "Prospects by Source"),
    },
    {
      title: "Rental Applications Report",
      description: "View all rental applications",
      icon: ClipboardList,
      id: createReportId("prospects", "Rental Applications Report"),
    },
  ]

  const leasingReports: Report[] = [
    {
      title: "Activated Draft Leases",
      description: "View all activated lease drafts",
      icon: FileCheck,
      id: createReportId("leasing", "Activated Draft Leases"),
    },
    {
      title: "Canceled Draft Leases",
      description: "View all canceled lease drafts",
      icon: FileX,
      id: createReportId("leasing", "Canceled Draft Leases"),
    },
    {
      title: "Draft Leases by Property",
      description: "View lease drafts grouped by property",
      icon: Building,
      id: createReportId("leasing", "Draft Leases by Property"),
    },
    {
      title: "Draft Leases by Status",
      description: "View lease drafts by their current status",
      icon: AlertCircle,
      id: createReportId("leasing", "Draft Leases by Status"),
    },
    {
      title: "Lease Account Statements Report",
      description: "View lease account statements",
      icon: FileText,
      id: createReportId("leasing", "Lease Account Statements Report"),
    },
    {
      title: "Insurance Details Report",
      description: "View tenant insurance details",
      icon: Shield,
      id: createReportId("leasing", "Insurance Details Report"),
    },
    {
      title: "Insurance Summary Report",
      description: "Summary of all tenant insurance",
      icon: Shield,
      id: createReportId("leasing", "Insurance Summary Report"),
    },
    {
      title: "Lease Late Fees Report",
      description: "View late fees for all leases",
      icon: Receipt,
      id: createReportId("leasing", "Lease Late Fees Report"),
    },
    {
      title: "Renewal Status by Property",
      description: "View lease renewal status by property",
      icon: Building,
      id: createReportId("leasing", "Renewal Status by Property"),
    },
    {
      title: "Upcoming Move-Ins",
      description: "View upcoming tenant move-ins",
      icon: MoveRight,
      id: createReportId("leasing", "Upcoming Move-Ins"),
    },
    {
      title: "Upcoming Move-Outs",
      description: "View upcoming tenant move-outs",
      icon: MoveLeft,
      id: createReportId("leasing", "Upcoming Move-Outs"),
    },
  ]

  const vendorReports: Report[] = [
    {
      title: "Recurring Work Orders",
      description: "View all recurring maintenance orders",
      icon: CalendarClock,
      id: createReportId("vendors", "Recurring Work Orders"),
    },
    {
      title: "All Work Orders by Vendor",
      description: "View work orders grouped by vendor",
      icon: Hammer,
      id: createReportId("vendors", "All Work Orders by Vendor"),
    },
    {
      title: "Open Work Orders by Vendor",
      description: "View pending work orders by vendor",
      icon: ClipboardList,
      id: createReportId("vendors", "Open Work Orders by Vendor"),
    },
    {
      title: "Vendor Ledger",
      description: "View vendor transaction history",
      icon: FileText,
      id: createReportId("vendors", "Vendor Ledger"),
    },
    {
      title: "1099-NEC",
      description: "Generate 1099-NEC forms for vendors",
      icon: HardDrive,
      id: createReportId("vendors", "1099-NEC"),
    },
    {
      title: "Vendors by Insurance Status",
      description: "View vendors grouped by insurance status",
      icon: Shield,
      id: createReportId("vendors", "Vendors by Insurance Status"),
    },
    {
      title: "Vendors Directory",
      description: "Complete directory of all vendors",
      icon: Users,
      id: createReportId("vendors", "Vendors Directory"),
    },
  ]

  const taskReports: Report[] = [
    {
      title: "Recurring Tasks",
      description: "View all recurring maintenance and administrative tasks",
      icon: CalendarDays,
      id: createReportId("tasks", "Recurring Tasks"),
    },
    {
      title: "Tenant Requests",
      description: "View all tenant maintenance and service requests",
      icon: MessageSquare,
      id: createReportId("tasks", "Tenant Requests"),
    },
    {
      title: "Completed Tasks",
      description: "View all completed tasks and requests",
      icon: CheckCircle2,
      id: createReportId("tasks", "Completed Tasks"),
    },
    {
      title: "Open Tasks",
      description: "View all pending and in-progress tasks",
      icon: ListTodo,
      id: createReportId("tasks", "Open Tasks"),
    },
    {
      title: "Overdue Tasks",
      description: "View all overdue and delayed tasks",
      icon: AlertOctagon,
      id: createReportId("tasks", "Overdue Tasks"),
    },
    {
      title: "Tasks by Priority",
      description: "View tasks organized by priority level",
      icon: ArrowUpCircle,
      id: createReportId("tasks", "Tasks by Priority"),
    },
    {
      title: "Tasks by Property",
      description: "View tasks grouped by property",
      icon: Building,
      id: createReportId("tasks", "Tasks by Property"),
    },
    {
      title: "Tasks by Status",
      description: "View tasks organized by current status",
      icon: AlertCircle,
      id: createReportId("tasks", "Tasks by Status"),
    },
    {
      title: "Work Order",
      description: "View and manage work orders",
      icon: Wrench,
      id: createReportId("tasks", "Work Order"),
    },
  ]

  const ownerReports: Report[] = [
    {
      title: "Owner Directory",
      description: "Complete directory of all property owners",
      icon: Users2,
      id: createReportId("owners", "Owner Directory"),
    },
    {
      title: "Owner Properties",
      description: "View properties by owner",
      icon: Home,
      id: createReportId("owners", "Owner Properties"),
    },
    {
      title: "Owner Statements",
      description: "View owner financial statements",
      icon: FileBarChart,
      id: createReportId("owners", "Owner Statements"),
    },
    {
      title: "Owner Balances",
      description: "View current owner account balances",
      icon: Wallet2,
      id: createReportId("owners", "Owner Balances"),
    },
    {
      title: "Owner Performance",
      description: "Analyze financial performance by owner",
      icon: BarChart,
      id: createReportId("owners", "Owner Performance"),
    },
    {
      title: "Owner Contacts",
      description: "View owner contact information",
      icon: User2,
      id: createReportId("owners", "Owner Contacts"),
    },
  ]

  const ReportSection = ({ title, reports }: ReportSectionProps) => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="h-px bg-border mt-2" />
      </div>
      {reports.length === 0 && title === "Favorites" ? (
        <div className="text-center py-12 bg-muted/10 rounded-lg flex flex-col items-center gap-3">
          <Star className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">No favorites set. Click the star icon on any report to add it to your favorites.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {reports.map((report, index) => (
            <Link 
              key={index}
              href={`/accounting/reports/${report.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      {<report.icon className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium leading-none mb-1">{report.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => toggleFavorite(report.id, e)}
                        >
                          <Star 
                            className={`h-4 w-4 ${
                              favorites.has(report.id) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )

  const getFavoriteReports = (): Report[] => {
    const allReports = [
      ...businessOverviewReports,
      ...generalReports,
      ...whoOwesYouReports,
      ...whatYouOweReports,
      ...tenantReports,
      ...prospectReports,
      ...leasingReports,
      ...vendorReports,
      ...taskReports,
      ...ownerReports,
    ]
    return allReports.filter(report => favorites.has(report.id))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and view detailed financial reports and analytics
        </p>
      </div>

      <div className="space-y-8">
        <ReportSection title="Favorites" reports={getFavoriteReports()} />
        <ReportSection title="Business Overview" reports={businessOverviewReports} />
        <ReportSection title="General Reports" reports={generalReports} />
        <ReportSection title="Who Owes You" reports={whoOwesYouReports} />
        <ReportSection title="What You Owe" reports={whatYouOweReports} />
        <ReportSection title="Tenants" reports={tenantReports} />
        <ReportSection title="Prospects" reports={prospectReports} />
        <ReportSection title="Leasing" reports={leasingReports} />
        <ReportSection title="Vendors" reports={vendorReports} />
        <ReportSection title="Tasks" reports={taskReports} />
        <ReportSection title="Owners" reports={ownerReports} />
      </div>
    </div>
  )
} 