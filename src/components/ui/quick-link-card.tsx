import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface QuickLinkCardProps {
  href: string
  icon: LucideIcon
  label: string
  description?: string
}

export function QuickLinkCard({ href, icon: Icon, label, description }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 border rounded-lg p-4 hover:shadow-md transition-all active:scale-[0.98] bg-card"
    >
      <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
    </Link>
  )
}

export function QuickLinkGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {children}
    </div>
  )
}
