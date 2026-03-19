import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/watchlist") ||
    req.nextUrl.pathname.startsWith("/settings") ||
    req.nextUrl.pathname.startsWith("/mypage") ||
    req.nextUrl.pathname.startsWith("/api/watchlist")

  if (isProtectedRoute && !isAuthenticated) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }
    const loginUrl = new URL("/auth/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/watchlist/:path*", "/settings/:path*", "/mypage/:path*", "/api/watchlist/:path*"],
}
