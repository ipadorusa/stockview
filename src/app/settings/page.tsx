"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTheme } from "next-themes"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { toast } from "sonner"

const profileSchema = z.object({
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다").max(20, "닉네임은 20자 이하여야 합니다"),
})
type ProfileForm = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
  newPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nickname: session?.user?.name ?? "" },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileLoading(true)
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "프로필 변경에 실패했습니다")
        return
      }
      toast.success("닉네임이 변경되었습니다")
    } finally {
      setProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordLoading(true)
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "비밀번호 변경에 실패했습니다")
        return
      }
      toast.success("비밀번호가 변경되었습니다")
      passwordForm.reset()
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <PageContainer>
      <GtmPageView pageData={{ page_name: "settings" }} />
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      <div className="flex flex-col gap-6 max-w-lg">
        {/* 프로필 */}
        <Card>
          <CardHeader>
            <CardTitle>프로필</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>이메일</Label>
                <Input value={session?.user?.email ?? ""} disabled />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nickname">닉네임</Label>
                <Input id="nickname" {...profileForm.register("nickname")} />
                {profileForm.formState.errors.nickname && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.nickname.message}</p>
                )}
              </div>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? "저장 중..." : "저장"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 */}
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 테마 */}
        <Card>
          <CardHeader>
            <CardTitle>테마</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
                라이트
              </Button>
              <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
                다크
              </Button>
              <Button variant={theme === "system" ? "default" : "outline"} size="sm" onClick={() => setTheme("system")}>
                시스템
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
