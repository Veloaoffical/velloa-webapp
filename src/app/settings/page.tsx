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
  KeyRound,
  Users,
  CreditCard,
  Tags,
  FolderKanban,
  Building,
  MessageSquare,
  ClipboardList,
  Briefcase,
} from "lucide-react"
import { LucideIcon } from "lucide-react"
import { CompanyInfoForm } from "./companySettings/components/CompanyInfoForm"

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
  const [companyInfoOpen, setCompanyInfoOpen] = useState(false)

  const handlePersonalIconClick = () => {
    const newCount = personalIconClicks + 1
    setPersonalIconClicks(newCount)
    if (newCount === 15) {
      toast("Hey Shayla")
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
          description: "Manage your personal details and contact",
          href: "/settings/personal?section=Personal Information"
        },
        { 
          name: "Login & Password", 
          icon: KeyRound,
          description: "Update your login credentials and security",
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
          description: "Update your company details and business",
          href: "/settings/companySettings?section=Company Info"
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
          name: "Listings", 
          icon: Home,
          description: "Customize your property listing preferences",
          href: "/settings/companySettings?section=Listings"
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
          name: "Tenant Requests", 
          icon: MessageSquare,
          description: "Customize tenant maintenance request",
          href: "/settings/propertysettings?section=Tenant Requests"
        },
        { 
          name: "Rental Application", 
          icon: ClipboardList,
          description: "Customize rental application forms",
          href: "/settings/rentalapplication"
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
                item.name === "Company Info" ? (
                  <button
                    key={item.name}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => setCompanyInfoOpen(true)}
                  >
                    <Card className="p-4 hover:bg-accent cursor-pointer transition-colors min-h-[50px]">
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
                  </button>
                ) : (
                  <Link 
                    key={item.name}
                    href={item.href || "#"}
                    className="block"
                  >
                    <Card className="p-4 hover:bg-accent cursor-pointer transition-colors min-h-[50px]">
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
                )
              ))}
            </div>
          </div>
        ))}
      </div>
      <CompanyInfoForm open={companyInfoOpen} onOpenChange={setCompanyInfoOpen} />
    </div>
  )
} 