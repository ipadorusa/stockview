import Link from "next/link"
import { BarChart3, FileText, GitCompareArrows, BookOpen } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ActionItem {
  href: string
  icon: LucideIcon
  label: string
  description: string
}

const ACTIONS: ActionItem[] = [
  {
    href: "/screener",
    icon: BarChart3,
    label: "스크리너",
    description: "기술적 시그널로 종목 발굴",
  },
  {
    href: "/reports",
    icon: FileText,
    label: "AI 리포트",
    description: "AI 기반 종목 분석",
  },
  {
    href: "/compare",
    icon: GitCompareArrows,
    label: "종목 비교",
    description: "최대 4종목 비교 분석",
  },
  {
    href: "/guide",
    icon: BookOpen,
    label: "투자 가이드",
    description: "초보 투자자를 위한 가이드",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ACTIONS.map(({ href, icon: Icon, label, description }) => (
        <Link
          key={href}
          href={href}
          className="card-interactive flex items-start gap-3 p-3"
        >
          <div className="h-8 w-8 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg-primary)] leading-tight">{label}</p>
            <p className="text-xs text-[var(--fg-tertiary)] mt-0.5 leading-tight">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
