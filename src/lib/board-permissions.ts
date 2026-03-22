import type { Session } from "next-auth"

type PostLike = { authorId: string; isPrivate: boolean }
type CommentLike = { authorId: string }

export function isAdmin(session: Session | null) {
  return session?.user?.role === "ADMIN"
}

export function canViewPost(session: Session | null, post: PostLike) {
  if (!post.isPrivate) return true
  if (!session) return false
  return session.user.id === post.authorId || isAdmin(session)
}

export function canEditPost(session: Session | null, post: PostLike) {
  if (!session) return false
  return session.user.id === post.authorId
}

export function canDeletePost(session: Session | null, post: PostLike) {
  if (!session) return false
  return session.user.id === post.authorId || isAdmin(session)
}

export function canDeleteComment(session: Session | null, comment: CommentLike) {
  if (!session) return false
  return session.user.id === comment.authorId || isAdmin(session)
}
