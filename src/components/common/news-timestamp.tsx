import { format, formatDistanceToNow, isYesterday } from "date-fns"
import { ko } from "date-fns/locale"

interface NewsTimestampProps {
  date: string | Date
  className?: string
}

export function NewsTimestamp({ date, className }: NewsTimestampProps) {
  const d = typeof date === "string" ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  let text: string
  if (diffMins < 1) text = "방금 전"
  else if (diffMins < 60) text = `${diffMins}분 전`
  else if (diffMins < 1440) text = `${Math.floor(diffMins / 60)}시간 전`
  else if (isYesterday(d)) text = "어제"
  else if (diffMs < 7 * 24 * 60 * 60 * 1000) text = formatDistanceToNow(d, { locale: ko, addSuffix: false }) + " 전"
  else text = format(d, "yyyy.MM.dd")

  return (
    <time dateTime={d.toISOString()} className={className} title={format(d, "yyyy년 MM월 dd일 HH:mm")} suppressHydrationWarning>
      {text}
    </time>
  )
}
