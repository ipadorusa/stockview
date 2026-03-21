import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function ETFTickerLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-6 w-20 mb-2" />
      <Skeleton className="h-10 w-60 mb-1" />
      <Skeleton className="h-8 w-40 mb-6" />
      <Skeleton className="h-[400px] rounded-xl mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </PageContainer>
  )
}
