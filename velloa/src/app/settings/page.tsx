"use client"

import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useState } from "react"
import Link from "next/link"
import {
  User,
  Building2,
  ListTodo,
  Home,
  Receipt,
  KeyRound,
  Users,
  CreditCard,
  FileText,
  Wallet,
  CalendarClock,
  Tags,
  FolderKanban,
  Building,
  MessageSquare,
  Bell,
  DollarSign,
  ClipboardList,
  PieChart,
  Globe,
  Briefcase,
  CircleDollarSign,
} from "lucide-react"
import { LucideIcon } from "lucide-react"

interface SettingItem {
  name: string;
  icon: LucideIcon;
  description: string;
  href?: string;
}

interface SettingCategory {
  title: string;
  icon: LucideIcon;
  items: SettingItem[];
}

export default function SettingsPage() {
  const [personalIconClicks, setPersonalIconClicks] = useState(0)

  const handlePersonalIconClick = () => {
    const newCount = personalIconClicks + 1
    setPersonalIconClicks(newCount)
    if (newCount === 15) {
      toast("Hey princess, I just want to say I love you so much and I'm so happy to be with you and I'm so happy I met you, your more then anything i could ever ask for")
      setPersonalIconClicks(0)
    }
  }

  const settingsCategories: SettingCategory[] = [
    {
      title: "Personal",
      icon: User,
      items: [
        { 
          name: "Personal Information", 
          icon: User,
          description: "Manage your personal details and contact information",
          href: "/settings/personal?section=Personal Information"
        },
        { 
          name: "Login & Password", 
          icon: KeyRound,
          description: "Update your login credentials and security settings",
          href: "/settings/personal?section=Login & Password"
        },
      ],
    },
    {
      title: "Company",
      icon: Building2,
      items: [
        { 
          name: "Company Info", 
          icon: Building,
          description: "Update your company details and business information",
          href: "/settings/companySettings?section=Company Info"
        },
        { 
          name: "Region & Currency", 
          icon: Globe,
          description: "Set your location preferences and currency format",
          href: "/settings/companySettings?section=Region & Currency"
        },
        { 
          name: "Default Account", 
          icon: Wallet,
          description: "Configure your primary account settings",
          href: "/settings/companySettings?section=Default Account"
        },
        { 
          name: "Users", 
          icon: Users,
          description: "Manage user accounts and permissions",
          href: "/settings/companySettings?section=Users"
        },
        { 
          name: "User Roles", 
          icon: Briefcase,
          description: "Define and customize user role permissions",
          href: "/settings/companySettings?section=User Roles"
        },
        { 
          name: "Subscription", 
          icon: CreditCard,
          description: "View and manage your subscription plan",
          href: "/settings/companySettings?section=Subscription"
        },
        { 
          name: "QuickBooks Sync", 
          icon: Receipt,
          description: "Configure QuickBooks integration settings",
          href: "/settings/companySettings?section=QuickBooks Sync"
        },
        { 
          name: "Listings", 
          icon: Home,
          description: "Customize your property listing preferences",
          href: "/settings/companySettings?section=Listings"
        },
        { 
          name: "Send Payments", 
          icon: CircleDollarSign,
          description: "Set up payment methods and preferences",
          href: "/settings/companySettings?section=Send Payments"
        },
        { 
          name: "Company Start Date", 
          icon: CalendarClock,
          description: "Set your company's fiscal year and important dates",
          href: "/settings/companySettings?section=Company Start Date"
        },
      ],
    },
    {
      title: "Related Lists",
      icon: ListTodo,
      items: [
        { 
          name: "Portfolios", 
          icon: FolderKanban,
          description: "Organize and manage property portfolios",
          href: "/settings/related-lists?section=Portfolios"
        },
        { 
          name: "Note Tags", 
          icon: Tags,
          description: "Customize tags for organizing notes",
          href: "/settings/related-lists?section=Note Tags"
        },
        { 
          name: "File Tags", 
          icon: Tags,
          description: "Manage tags for document organization",
          href: "/settings/related-lists?section=File Tags"
        },
        { 
          name: "Vendor Classification", 
          icon: Building2,
          description: "Define vendor categories and types",
          href: "/settings/related-lists?section=Vendor Classification"
        },
        { 
          name: "Lead Sources", 
          icon: Users,
          description: "Track and manage lead generation sources",
          href: "/settings/related-lists?section=Lead Sources"
        },
      ],
    },
    {
      title: "Property Settings",
      icon: Home,
      items: [
        { 
          name: "Tenant Portal", 
          icon: Users,
          description: "Configure tenant portal access and features",
          href: "/settings/propertysettings?section=Tenant Portal"
        },
        { 
          name: "Owner Portal", 
          icon: Users,
          description: "Manage owner portal settings and access",
          href: "/settings/propertysettings?section=Owner Portal"
        },
        { 
          name: "Rent & Payment Notifications", 
          icon: Bell,
          description: "Set up automated rent reminders and notifications",
          href: "/settings/propertysettings?section=Rent & Payment Notifications"
        },
        { 
          name: "Payment Instructions", 
          icon: FileText,
          description: "Configure payment methods and instructions",
          href: "/settings/propertysettings?section=Payment Instructions"
        },
        { 
          name: "Tenant Requests", 
          icon: MessageSquare,
          description: "Customize tenant maintenance request settings",
          href: "/settings/propertysettings?section=Tenant Requests"
        },
        { 
          name: "Owner Requests", 
          icon: MessageSquare,
          description: "Set up owner communication preferences",
          href: "/settings/propertysettings?section=Owner Requests"
        },
        { 
          name: "Late Fees", 
          icon: DollarSign,
          description: "Configure late fee policies and calculations",
          href: "/settings/propertysettings?section=Late Fees"
        },
        { 
          name: "Rental Application", 
          icon: ClipboardList,
          description: "Customize rental application forms and process",
          href: "/settings/rentalapplication"
        },
        { 
          name: "Management Fees", 
          icon: Receipt,
          description: "Set up property management fee structures",
          href: "/settings/propertysettings?section=Management Fees"
        },
        { 
          name: "Payment Allocation", 
          icon: Wallet,
          description: "Configure payment distribution rules",
          href: "/settings/propertysettings?section=Payment Allocation"
        },
      ],
    },
    {
      title: "Accounting Settings",
      icon: Receipt,
      items: [
        { 
          name: "Expense Categories", 
          icon: PieChart,
          description: "Manage and customize expense categories",
          href: "/settings/accounting?section=Expense Categories"
        },
      ],
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-4xl font-semibold mb-6">Settings</h1>

      <div className="space-y-8">
        {settingsCategories.map((category) => (
          <div key={category.title} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  onClick={category.title === "Personal" ? handlePersonalIconClick : undefined}
                  className={category.title === "Personal" ? "cursor-pointer" : undefined}
                >
                  <category.icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">{category.title}</h2>
              </div>
              <Separator className="w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {category.items.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href || "#"}
                  className="block"
                >
                  <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium leading-none mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 