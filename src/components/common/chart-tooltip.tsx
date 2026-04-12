import { cn } from "@/lib/utils"

type Direction = "up" | "down" | "flat"

interface TooltipEntry {
  label: string
  value: string
  color?: string
  direction?: Direction
}

interface ChartTooltipProps {
  title: string
  entries: TooltipEntry[]
  className?: string
}

const directionColor: Record<Direction, string> = {
  up: "text-stock-up",
  down: "text-stock-down",
  flat: "text-stock-flat",
}

export function ChartTooltip({ title, entries, className }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-floating)] border border-[var(--border-default)] rounded-lg shadow-[var(--shadow-elevated)]",
        "px-3 py-2 text-xs font-mono tabular-nums pointer-events-none",
        "animate-in fade-in zoom-in-95 duration-150",
        className,
      )}
    >
      <div className="mb-1 text-[var(--text-secondary)] font-sans text-xs font-medium">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              {entry.color && (
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
              )}
              {entry.label}
            </span>
            <span
              className={cn(
                "text-[var(--text-primary)]",
                entry.direction && directionColor[entry.direction],
              )}
            >
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
