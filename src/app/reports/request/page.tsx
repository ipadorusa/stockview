import type { Metadata } from "next"
import { ReportRequestContent } from "./request-content"

export const metadata: Metadata = {
  title: "AI 분석 요청",
  description: "원하는 종목의 AI 분석 리포트를 요청하세요. 관리자 승인 후 AI가 종목 분석을 생성합니다.",
  alternates: { canonical: "/reports/request" },
}

export default function ReportRequestPage() {
  return <ReportRequestContent />
}
