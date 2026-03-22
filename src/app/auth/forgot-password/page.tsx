import type { Metadata } from "next"
import Link from "next/link"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "비밀번호 찾기",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GtmPageView pageData={{ page_name: "forgot_password" }} />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 찾기</CardTitle>
          <CardDescription>비밀번호를 분실하셨나요?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            현재 이메일을 통한 비밀번호 재설정 기능을 준비 중입니다.
            비밀번호를 분실하신 경우, 게시판에 문의를 남겨주시면 도움을 드리겠습니다.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/board">
              <Button className="w-full">게시판에 문의하기</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">로그인으로 돌아가기</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
