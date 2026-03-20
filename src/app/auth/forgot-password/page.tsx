"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
})
type ForgotForm = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = () => {
    setSubmitted(true)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GtmPageView pageData={{ page_name: "forgot_password" }} />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 찾기</CardTitle>
          <CardDescription>가입한 이메일 주소를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                비밀번호 재설정 안내가 이메일로 전송되었습니다. 메일이 도착하지 않는 경우 관리자에게 문의해주세요.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">로그인으로 돌아가기</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full">재설정 메일 보내기</Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/auth/login" className="text-primary underline underline-offset-4">로그인으로 돌아가기</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
