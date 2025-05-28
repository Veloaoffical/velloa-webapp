"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SidebarContextValue {
  isOpen: boolean
  isMobile: boolean
  isCollapsed: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined
)

export function SidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const setCollapsed = React.useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }, [])

  const value = React.useMemo(
    () => ({
      isOpen,
      isMobile,
      isCollapsed,
      toggle,
      setCollapsed,
    }),
    [isOpen, isMobile, isCollapsed, toggle, setCollapsed]
  )

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
} 