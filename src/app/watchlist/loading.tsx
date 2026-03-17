import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function WatchlistLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </PageContainer>
  )
}
