"use client"

import {
  CircleHelp,
  ChevronsUpDown,
  LogOut,
  Settings,
  BookText,
  Sun,
  Moon,
  Gift,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { useState } from "react"
import { NotificationDialog } from "@/components/notification-dialog"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile, state } = useSidebar()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)

  const isCollapsed = state === "collapsed"

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Redirect to login page after successful logout
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="hover:bg-accent/50 data-[state=open]:bg-accent"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg font-normal text-foreground bg-muted">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-foreground">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-muted">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-foreground">Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => window.open('https://velloa.tawk.help/', '_blank')}>
                  <CircleHelp className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-foreground">Help</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://velloa.ca/', '_blank')}>
                  <BookText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-foreground">Forms</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://velloa.ca/whats-new', '_blank')}>
                  <Gift className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-foreground">What&apos;s New</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="p-2" onSelect={(e) => e.preventDefault()}>
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground">
                      {theme === "dark" ? 
                        <Moon className="h-4 w-4 text-muted-foreground" /> : 
                        <Sun className="h-4 w-4 text-muted-foreground" />
                      }
                      Theme
                    </div>
                    <Switch
                      id="switch-10"
                      checked={theme === "dark"}
                      onCheckedChange={toggleTheme}
                      aria-label="Toggle between dark and light mode"
                    />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-foreground">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <NotificationDialog 
        open={showNotifications} 
        onOpenChange={setShowNotifications}
      />
    </>
  )
}
