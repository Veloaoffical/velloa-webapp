"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import { 
  Calculator,
  FileText,
  MessageSquare,
  Building2,
  Receipt,
  Users,
  Upload,
} from "lucide-react"

const tools = [
  { 
    name: "Rent Calculator", 
    icon: Calculator,
    description: "Calculate rent, deposits, and fees",
    href: "/tools/rent-calculator"
  },
  { 
    name: "Property Setup Wizard", 
    icon: Building2,
    description: "Guided setup for new properties",
    href: "/tools/property-setup"
  },
  { 
    name: "Tenant Screening", 
    icon: Users,
    description: "Screen potential tenants",
    href: "/tools/tenant-screening"
  },
  { 
    name: "Document Templates", 
    icon: FileText,
    description: "Create and manage document and lease templates",
    href: "/tools/document-templates"
  },
  { 
    name: "Communication Templates", 
    icon: MessageSquare,
    description: "Manage email and SMS templates",
    href: "/tools/communication-templates"
  },
  { 
    name: "Invoice Generator", 
    icon: Receipt,
    description: "Create and customize invoices",
    href: "/tools/invoice-generator"
  },
  { 
    name: "Bulk Import", 
    icon: Upload,
    description: "Import properties, tenants, and transactions",
    href: "/tools/bulk-import"
  },
];

export default function ToolsPage() {
  return (
    <div className="p-6">
      <h1 className="text-4xl font-semibold mb-6">Tools</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link 
            key={tool.name}
            href={tool.href}
          >
            <Card 
              className="p-4 hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <tool.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium leading-none mb-1">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
