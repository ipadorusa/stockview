"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { createPostSchema } from "@/lib/validations/board"

type PostFormValues = z.infer<typeof createPostSchema>

interface PostFormProps {
  defaultValues?: Partial<PostFormValues>
  onSubmit: (data: PostFormValues) => Promise<void>
  submitLabel: string
  loading: boolean
}

export function PostForm({ defaultValues, onSubmit, submitLabel, loading }: PostFormProps) {
  const form = useForm<PostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
      isPrivate: defaultValues?.isPrivate ?? true,
    },
  })

  const isPrivate = form.watch("isPrivate")

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">제목</Label>
        <Input id="title" placeholder="제목을 입력해주세요" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          placeholder="내용을 입력해주세요"
          rows={10}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="isPrivate"
          checked={isPrivate}
          onCheckedChange={(checked) => form.setValue("isPrivate", checked === true)}
        />
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="isPrivate" className="cursor-pointer">비밀글</Label>
          {isPrivate && (
            <p className="text-xs text-muted-foreground">
              제목은 공개되며, 본문은 작성자와 관리자만 볼 수 있습니다. 제목에 개인정보를 포함하지 마세요.
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="self-end">
        {loading ? "저장 중..." : submitLabel}
      </Button>
    </form>
  )
}
