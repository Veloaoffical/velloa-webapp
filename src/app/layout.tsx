"use client"

import "./globals.css";
import { Toaster } from "sonner"
import { AppSidebar } from '@/components/navbar/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from "next-themes";
import { GeistSans } from "geist/font/sans";

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password';

  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning={true}>
      
      <head>
        
        <title>Velloa - Property Management</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#1DB954" />
        <meta name="apple-mobile-web-app-title" content="Velloa" />
      </head>
      <body>
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              {!isAuthPage && <AppSidebar />}
              <main className="flex-1 w-0 min-w-0 md:group-data-[collapsible=icon]:pl-6">
                {children}
              </main>
            </div>
          </SidebarProvider>
          <Toaster position="top-right" />
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

