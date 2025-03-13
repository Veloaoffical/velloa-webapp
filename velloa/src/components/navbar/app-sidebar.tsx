"use client"

import * as React from "react"
import Image from "next/image"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Search,
  Command,
} from "lucide-react"

import { NavUser } from "@/components/navbar/nav-user"
import { NotificationDialog } from "@/components/notification-dialog"
import { useCommandPalette } from "@/components/command-palette"
import { Input } from "@/components/ui/input"

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
      url: "/reports",
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
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const [userData, setUserData] = React.useState<UserData>({
    fullName: '',
    email: ''
  });
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-collapsible') {
          const sidebarElement = mutation.target as HTMLElement;
          setIsCollapsed(sidebarElement.getAttribute('data-collapsible') === 'icon');
        }
      });
    });

    const sidebarElement = document.querySelector('[data-collapsible]');
    if (sidebarElement) {
      observer.observe(sidebarElement, {
        attributes: true,
        attributeFilter: ['data-collapsible']
      });
      // Set initial state
      setIsCollapsed(sidebarElement.getAttribute('data-collapsible') === 'icon');
    }

    return () => observer.disconnect();
  }, []);

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
                src={isCollapsed ? "/velloa-icon.png" : "/velloa-logo.png"}
                alt="Velloa Logo"
                width={isCollapsed ? 48 : 140}
                height={isCollapsed ? 48 : 42}
                className={`${isCollapsed ? 'w-12 h-12' : 'w-[140px] h-[42px]'}`}
                style={{
                  objectFit: 'contain',
                }}
                unoptimized
                priority
              />
            </div>
          </div>
        </div>
        <hr className="border-t border-border mx-2 -mt-px" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {/* Search icon only shown when collapsed */}
              <div className="group-data-[collapsible=icon]:block hidden">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setCommandPaletteOpen(true)}
                    className="group/menu-button font-light gap-3 h-9 rounded-lg hover:bg-accent/50 hover:text-accent-foreground"
                    tooltip="Search"
                  >
                    <Search
                      className="text-foreground/60 mx-auto"
                      size={22}
                      aria-hidden="true"
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
              
              {/* Search input shown when expanded */}
              <div className="group-data-[collapsible=icon]:hidden mb-2">
                <SidebarMenuItem>
                  <div 
                    className="relative w-full px-1 py-1"
                    onClick={() => setCommandPaletteOpen(true)}
                  >
                    <div className="relative flex items-center">
                      <Search
                        className="absolute left-2.5 text-muted-foreground"
                        size={16}
                      />
                      <Input
                        readOnly
                        placeholder="Search..."
                        className="pl-8 pr-10 h-8 text-sm bg-background/80 border-border/50 hover:bg-accent/10 cursor-pointer"
                      />
                      <div className="absolute right-2.5 flex items-center justify-center">
                        <Command
                          className="text-muted-foreground"
                          size={12}
                        />
                        <span className="text-muted-foreground text-[14px] ml-0.5">k</span>
                      </div>
                    </div>
                  </div>
                </SidebarMenuItem>
              </div>
              
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group/menu-button font-light gap-3 h-9 rounded-lg hover:bg-accent/50 hover:text-accent-foreground data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/20 data-[active=true]:to-transparent group-data-[collapsible=icon]:data-[active=true]:bg-gradient-to-r group-data-[collapsible=icon]:data-[active=true]:from-primary/20 group-data-[collapsible=icon]:data-[active=true]:via-primary/20 group-data-[collapsible=icon]:data-[active=true]:to-transparent"
                    data-active={pathname.startsWith(item.url) && item.url !== '/home' ? true : false}
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
