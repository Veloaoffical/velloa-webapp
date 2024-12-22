"use client"

import { type LucideIcon } from "lucide-react"
import Image from "next/image"
import Link from 'next/link'

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,

} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <div className="flex items-center gap-2 mb-4">
        <Image
          src="/VELLOAICON.png"
          alt="Logo"
          width={55}
          height={55}
          className="block"
        />
        <span className="text-4xl --font-poppins font-black tracking-wide [data-collapsed]:hidden">
          Velloa
        </span>
      </div>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <Link 
                href={item.url} 
                className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:bg-accent hover:text-accent-foreground"
              >
                {item.icon && (
                  <item.icon className="mr-2 h-8 w-8 group-[[data-collapsed=true]]:mr-0" />
                )}
                <span className="group-[[data-collapsed=true]]:hidden">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
