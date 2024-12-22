"use client"

import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { AppSidebar } from '@/components/navbar/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';

  return (
    <html lang="en">
      <head>
        <title>Velloa - Property Management</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="bg-[#fafafa]">
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

