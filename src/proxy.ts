import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const pathname = req.nextUrl.pathname

  const isProtectedRoute = pathname.startsWith("/watchlist") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/mypage") ||
    pathname.startsWith("/api/watchlist") ||
    pathname === "/board/new" ||
    /^\/board\/[^/]+\/edit$/.test(pathname)

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin")

  if (isAdminRoute) {
    if (!isAuthenticated || req.auth?.user?.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }
    const loginUrl = new URL("/auth/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/watchlist/:path*", "/settings/:path*", "/mypage/:path*", "/api/watchlist/:path*", "/board/new", "/board/:id/edit", "/admin/:path*", "/api/admin/:path*"],
}
