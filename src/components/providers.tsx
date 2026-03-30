"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import dynamic from "next/dynamic"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CompareProvider } from "@/contexts/compare-context"

const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false })

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <CompareProvider>
              {children}
            </CompareProvider>
          </TooltipProvider>
          <Toaster richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
