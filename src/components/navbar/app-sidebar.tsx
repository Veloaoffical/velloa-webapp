"use client"

import * as React from "react"
import {
 ScrollText,
  Users,
  Landmark,
  ChartArea,
  MapPinHouse,
  PencilRuler,
  ListTodo,
  LayoutTemplate,
  Calendar,
} from "lucide-react"

import { NavMain } from "@/components/navbar/nav-main"
import { NavUser } from "@/components/navbar/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarProvider,
} from "@/components/ui/sidebar"

// Updated sample data
const data = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: LayoutTemplate
    },
    {
        title: "Calendar",
        url: "/calendar",
        icon: Calendar
      },
    {
      title: "Property",
      url: "/property",
      icon: MapPinHouse
    },
    {
      title: "Leasing",
      url: "/leasing",
      icon: ScrollText
    },
    {
      title: "People",
      url: "/people",
      icon: Users
    },
    {
      title: "Tools",
      url: "/tools",
      icon: PencilRuler
    },
    {
      title: "Tasks & Maintenance",
      url: "/tasks",
      icon: ListTodo
    },
    {
      title: "Accounting",
      url: "/accounting",
      icon: Landmark
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: ChartArea
    }
  ]
}

// Add type for user data
interface UserData {
  fullName: string;
  email: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userData, setUserData] = React.useState<UserData>({
    fullName: '',
    email: ''
  });

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
  }, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={{
            name: userData.fullName,
            email: userData.email,
            avatar: '/avatars/default.jpg' // You might want to update this based on your needs
          }} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  )
}
