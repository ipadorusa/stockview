import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "대기", className: "bg-muted text-muted-foreground" },
  APPROVED: { label: "승인", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  GENERATING: { label: "생성 중", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" },
  COMPLETED: { label: "완료", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
  FAILED: { label: "실패", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
  REJECTED: { label: "거절", className: "bg-muted text-muted-foreground line-through" },
}

export function ReportStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  return (
    <Badge variant="outline" className={cn("text-xs border-0", config.className)}>
      {config.label}
    </Badge>
  )
}
