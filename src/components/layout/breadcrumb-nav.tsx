import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-xs text-[var(--fg-tertiary)] mb-3">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? "text-[var(--fg-secondary)] font-medium" : ""}>{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-[var(--fg-primary)] transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
