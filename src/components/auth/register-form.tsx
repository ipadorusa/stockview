"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/gtm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const registerSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다").regex(/^(?=.*[A-Za-z])(?=.*\d)/, "영문과 숫자를 포함해야 합니다"),
  passwordConfirm: z.string(),
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다").max(20),
}).refine((d) => d.password === d.passwordConfirm, { message: "비밀번호가 일치하지 않습니다", path: ["passwordConfirm"] })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, nickname: data.nickname }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? "회원가입 중 오류가 발생했습니다.")
        trackEvent("sign_up", { method: "credentials", success: false })
        return
      }
      trackEvent("sign_up", { method: "credentials", success: true })
      router.push("/auth/login?registered=true")
    } finally { setLoading(false) }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>StockView 계정을 만들어 보세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-email">이메일</Label>
            <Input id="reg-email" type="email" {...register("email")} placeholder="you@example.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname">닉네임</Label>
            <Input id="nickname" {...register("nickname")} placeholder="2~20자" />
            {errors.nickname && <p className="text-sm text-destructive">{errors.nickname.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-password">비밀번호</Label>
            <Input id="reg-password" type="password" {...register("password")} placeholder="영문+숫자 8자 이상" />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input id="passwordConfirm" type="password" {...register("passwordConfirm")} placeholder="••••••••" />
            {errors.passwordConfirm && <p className="text-sm text-destructive">{errors.passwordConfirm.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">{loading ? "가입 중..." : "회원가입"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="text-primary underline underline-offset-4">로그인</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
