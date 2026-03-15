import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">페이지를 찾을 수 없어요</h2>
        <p className="text-muted-foreground mb-6">요청하신 페이지가 존재하지 않습니다</p>
        <Link href="/" className="text-primary underline underline-offset-4">홈으로 돌아가기</Link>
      </div>
    </PageContainer>
  )
}
