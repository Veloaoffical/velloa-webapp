"use client"

import * as React from "react"
import {
  PencilRuler,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Landmark,
  DoorClosed,
  Users,
  Home,
  FilePenLine,
} from "lucide-react"
import Image from "next/image"
import { NavUser } from "@/components/navbar/nav-user"
import { NavMain } from "@/components/navbar/nav-main"
import { NavSecondary } from "@/components/navbar/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

interface UserData {
  fullName: string;
  email: string;
}

interface CompanySettings {
  company_name: string;
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Properties",
      url: "/property",
      icon: DoorClosed,
    },
    {
      title: "Leases",
      url: "/leases",
      icon: FilePenLine,
    },
    {
      title: "People",
      url: "/people",
      icon: Users,
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: PencilRuler,
    },
    {
      title: "Accounting",
      url: "/accounting",
      icon: Landmark,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userData, setUserData] = React.useState<UserData>({
    fullName: '',
    email: ''
  });
  const [companySettings,] = React.useState<CompanySettings>({
    company_name: 'Velloa'
  });
  const pathname = usePathname();
  const navMain = data.navMain.map(item => ({
    ...item,
    isActive: pathname === item.url
  }));

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    // Try to fetch company settings, but don't break if it fails
  }, []);

  return (
    <Sidebar
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#00AA4B] text-sidebar-[#00AA4B]">
                  <Image src="/FF_VELLOA_iso_white.ico" alt="Velloa" width={26} height={26} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{companySettings.company_name}</span>
                  <span className="truncate text-xs">PM</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: userData.fullName,
          email: userData.email,
          avatar: '/avatars/default.jpg'
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
