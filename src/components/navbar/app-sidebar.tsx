"use client"

import * as React from "react"
import Image from "next/image"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Poppins } from 'next/font/google'
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
  Bell,
} from "lucide-react"

import { NavUser } from "@/components/navbar/nav-user"
import { SearchForm } from "@/components/ui/search-form"
import { NotificationDialog } from "@/components/notification-dialog"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

// Updated sample data without groups
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
      title: "Leases",
      url: "/leases",
      icon: ScrollText
    },
    {
      title: "People",
      url: "/people",
      icon: Users
    },
    {
      title: "Tasks & Maintenance",
      url: "/tasks",
      icon: ListTodo
    },
    {
      title: "Tools",
      url: "/tools",
      icon: PencilRuler
    },
    {
      title: "Accounting",
      url: "/accounting",
      icon: Landmark
    },
    {
      title: "Reports & Analytics",
      url: "/accounting/reports",
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
  const pathname = usePathname()
  const [userData, setUserData] = React.useState<UserData>({
    fullName: '',
    email: ''
  });
  const [showNotifications, setShowNotifications] = React.useState(false);

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
    <Sidebar 
      className="bg-background border-r" 
      collapsible="icon" 
      style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center px-2 py-2">
          <div className="w-full flex items-center group-data-[collapsible=icon]:justify-center justify-start">
            <div className="flex items-center gap-0">
              <Image
                src="/FF_VELLOA_green.png"
                alt="Logo"
                width={42}
                height={42}
                className="w-10 h-10 group-data-[collapsible=icon]:w-8 group-data-[collapsible-icon]:h-8 object-contain"
                priority
              />
              <span className={`text-xl font-bold tracking-wide text-foreground group-data-[collapsible=icon]:hidden ${poppins.className} translate-y-1.5`}>
                Velloa
              </span>
            </div>
          </div>
        </div>
        <hr className="border-t border-border mx-2 -mt-px" />
        <div className="group-data-[collapsible=icon]:hidden">
          <SearchForm className="mt-3 px-2" />
        </div>
        <div className="group-data-[collapsible=icon]:block group-data-[collapsible=icon]:h-[40px] hidden">
          {/* This empty div maintains spacing when search is hidden */}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group/menu-button font-light gap-3 h-9 rounded-lg hover:bg-accent/50 hover:text-accent-foreground data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-transparent [&>svg]:size-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:data-[active=true]:bg-gradient-to-r group-data-[collapsible=icon]:data-[active=true]:from-primary/20 group-data-[collapsible=icon]:data-[active=true]:via-primary/20 group-data-[collapsible=icon]:data-[active=true]:to-transparent"
                    data-active={pathname === item.url ? true : false}
                    tooltip={item.title}
                  >
                    <Link href={item.url} className="w-full flex items-center">
                      {item.icon && (
                        <item.icon
                          className="text-foreground/60 group-data-[active=true]/menu-button:text-primary group-data-[collapsible=icon]:mx-auto"
                          size={22}
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-foreground group-data-[active=true]/menu-button:text-primary group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setShowNotifications(true)}
                className="group/menu-button font-light gap-3 h-9 rounded-lg hover:bg-accent/50 hover:text-accent-foreground"
              >
                <Bell
                  className="text-foreground/60 group-data-[collapsible=icon]:mx-auto"
                  size={22}
                  aria-hidden="true"
                />
                <span className="text-foreground group-data-[collapsible=icon]:hidden">Notifications</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        <hr className="border-t border-border mx-2 -mt-px" />
        <div className="px-2">
          <NavUser user={{
            name: userData.fullName,
            email: userData.email,
            avatar: '/avatars/default.jpg'
          }} />
        </div>
      </SidebarFooter>
      <SidebarRail />
      <NotificationDialog 
        open={showNotifications} 
        onOpenChange={setShowNotifications}
      />
    </Sidebar>
  )
}
