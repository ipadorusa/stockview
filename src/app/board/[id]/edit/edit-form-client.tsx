"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PostForm } from "@/components/board/post-form"
import { toast } from "sonner"
import type { z } from "zod"
import type { createPostSchema } from "@/lib/validations/board"

type PostFormValues = z.infer<typeof createPostSchema>

interface EditFormClientProps {
  post: {
    id: string
    title: string
    content: string
    isPrivate: boolean
  }
}

export function EditFormClient({ post }: EditFormClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: PostFormValues) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/board/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "수정에 실패했습니다.")
        return
      }
      toast.success("글이 수정되었습니다.")
      router.push(`/board/${post.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PostForm
      defaultValues={{ title: post.title, content: post.content, isPrivate: post.isPrivate }}
      onSubmit={handleSubmit}
      submitLabel="수정하기"
      loading={loading}
    />
  )
}
