import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function StockDetailLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-12 w-64 mb-2" />
      <Skeleton className="h-6 w-40 mb-6" />
      <Skeleton className="h-96 w-full" />
    </PageContainer>
  )
}
