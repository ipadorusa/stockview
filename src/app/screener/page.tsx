import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { ScreenerClient } from "./screener-client"
import { getScreenerData } from "@/lib/screener"

export default async function ScreenerPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["screener", "KR", "golden_cross"],
    queryFn: () => getScreenerData("KR", "golden_cross"),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScreenerClient />
    </HydrationBoundary>
  )
}
