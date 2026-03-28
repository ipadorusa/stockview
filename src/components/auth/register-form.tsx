"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/gtm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const registerSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다").regex(/^(?=.*[A-Za-z])(?=.*\d)/, "영문과 숫자를 포함해야 합니다"),
  passwordConfirm: z.string(),
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다").max(20),
}).refine((d) => d.password === d.passwordConfirm, { message: "비밀번호가 일치하지 않습니다", path: ["passwordConfirm"] })

type RegisterForm = z.infer<typeof registerSchema>

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
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

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    trackEvent("sign_up", { method: "google", success: true })
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>StockView를 시작하세요</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-full h-11 gap-3 font-medium"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
        >
          <GoogleIcon className="h-5 w-5" />
          {googleLoading ? "연결 중..." : "Google로 시작하기"}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">또는</span>
          <Separator className="flex-1" />
        </div>

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
          <Button type="submit" disabled={loading} className="w-full">{loading ? "가입 중..." : "이메일로 회원가입"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="text-primary underline underline-offset-4">로그인</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
