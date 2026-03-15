import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 py-6", className)}>
      {children}
    </main>
  )
}
