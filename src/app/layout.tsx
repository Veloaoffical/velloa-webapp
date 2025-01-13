"use client"

import "./globals.css";
import { Toaster } from "sonner"
import { AppSidebar } from '@/components/navbar/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from "next-themes";

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Velloa - Property Management</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />

        <meta name="theme-color" content="#1DB954" />
      </head>
      <body >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              {!isAuthPage && (
                <div>
                  <AppSidebar className="bg-[#1DB954] text-white" />
                </div>
              )}
              <div className="flex-1 w-0 min-w-0">
                {children}
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootLayoutContent>{children}</RootLayoutContent>;
}

