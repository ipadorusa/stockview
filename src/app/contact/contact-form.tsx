"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const contactSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(50),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  category: z.enum(["data-error", "service", "ai-report", "business", "privacy", "other"]),
  message: z.string().min(10, "메시지는 10자 이상 입력해주세요").max(2000),
  website: z.string().optional(),
})
type ContactForm = z.infer<typeof contactSchema>

const categories = [
  { value: "data-error", label: "데이터 오류 신고" },
  { value: "service", label: "서비스 이용 문의" },
  { value: "ai-report", label: "AI 리포트 관련" },
  { value: "business", label: "광고·제휴 문의" },
  { value: "privacy", label: "개인정보 관련" },
  { value: "other", label: "기타" },
] as const

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", category: "service", message: "", website: "" },
  })

  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "문의 전송에 실패했습니다")
        return
      }
      setSubmitted(true)
      toast.success("문의가 접수되었습니다")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium mb-2">문의가 접수되었습니다</p>
          <p className="text-sm text-muted-foreground">영업일 기준 2~3일 이내에 회신드리겠습니다.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); form.reset() }}>
            새 문의 작성
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>문의 양식</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">이름</Label>
            <Input id="name" placeholder="홍길동" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="example@email.com" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">문의 유형</Label>
            <select
              id="category"
              {...form.register("category")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">메시지</Label>
            <Textarea
              id="message"
              placeholder="문의 내용을 입력해주세요 (최소 10자)"
              rows={6}
              {...form.register("message")}
            />
            {form.formState.errors.message && (
              <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
            )}
          </div>

          {/* Honeypot field — hidden from real users, bots auto-fill it */}
          <div className="absolute opacity-0 -z-10" aria-hidden="true" tabIndex={-1}>
            <input type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "전송 중..." : "문의 보내기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
