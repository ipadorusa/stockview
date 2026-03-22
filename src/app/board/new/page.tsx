import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { Breadcrumb } from "@/components/seo/breadcrumb"
import { NewFormClient } from "./new-form-client"

export const metadata: Metadata = {
  title: "글 작성 | 요청 게시판 | StockView",
}

export default function NewPostPage() {
  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "게시판", href: "/board" }, { label: "글 작성", href: "/board/new" }]} />
      <h1 className="text-xl font-bold mb-6">글 작성</h1>
      <div className="max-w-2xl">
        <NewFormClient />
      </div>
    </PageContainer>
  )
}
