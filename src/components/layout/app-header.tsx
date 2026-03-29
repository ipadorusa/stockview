"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { TrendingUp, Sun, Moon, Menu, LogOut, BookMarked, Search, User } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { SearchBar } from "@/components/search/search-bar"
import { SearchCommand } from "@/components/search/search-command"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"

const navGroups = [
  {
    label: "투자 정보",
    links: [
      { href: "/market", label: "시장 개요" },
      { href: "/etf", label: "ETF" },
      { href: "/sectors", label: "섹터별 종목" },
      { href: "/dividends", label: "배당 캘린더" },
      { href: "/earnings", label: "실적 캘린더" },
    ],
  },
  {
    label: "분석 도구",
    links: [
      { href: "/screener", label: "스크리너" },
      { href: "/reports", label: "AI 리포트" },
      { href: "/reports?tab=requests", label: "리포트 요청" },
      { href: "/compare", label: "종목 비교" },
      { href: "/guide", label: "투자 가이드" },
    ],
  },
  {
    label: "뉴스 · 커뮤니티",
    links: [
      { href: "/news", label: "뉴스" },
      { href: "/board", label: "게시판" },
    ],
  },
  {
    label: "MY",
    links: [
      { href: "/watchlist", label: "관심종목" },
      { href: "/watchlist?tab=portfolio", label: "포트폴리오" },
      { href: "/mypage", label: "마이페이지" },
      { href: "/settings", label: "설정" },
    ],
  },
]

const navCategories = [
  {
    label: "투자 정보",
    href: "/market",
    prefixes: ["/market", "/etf", "/sectors", "/dividends", "/earnings"],
    subLinks: [
      { href: "/market", label: "시장" },
      { href: "/etf", label: "ETF" },
      { href: "/sectors", label: "섹터" },
      { href: "/dividends", label: "배당" },
      { href: "/earnings", label: "실적" },
    ],
  },
  {
    label: "분석",
    href: "/screener",
    prefixes: ["/screener", "/reports", "/compare", "/guide"],
    subLinks: [
      { href: "/screener", label: "스크리너" },
      { href: "/reports", label: "AI 리포트" },
      { href: "/reports?tab=requests", label: "분석 요청" },
      { href: "/compare", label: "비교" },
      { href: "/guide", label: "가이드" },
    ],
  },
  {
    label: "뉴스",
    href: "/news",
    prefixes: ["/news", "/board"],
    subLinks: [
      { href: "/news", label: "뉴스" },
      { href: "/board", label: "게시판" },
    ],
  },
  {
    label: "더보기",
    href: "/watchlist",
    prefixes: ["/watchlist", "/portfolio", "/mypage", "/settings", "/about", "/contact"],
    subLinks: [
      { href: "/watchlist", label: "관심종목" },
      { href: "/watchlist?tab=portfolio", label: "포트폴리오" },
      { href: "/mypage", label: "마이페이지" },
      { href: "/about", label: "소개" },
    ],
  },
]

function isCategoryActive(prefixes: string[], pathname: string) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function isLinkActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(href + "/")
}

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => { setSheetOpen(false) }, [pathname])

  const activeCategory = navCategories.find((c) => isCategoryActive(c.prefixes, pathname))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0 active:opacity-80">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>StockView</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            홈
          </Link>
          {navCategories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isCategoryActive(cat.prefixes, pathname)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="hidden lg:block w-64">
          <SearchBar />
        </div>

        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSearchOpen(true)}>
          <Search className="h-4 w-4" />
          <span className="sr-only">검색</span>
        </Button>

        <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 전환</span>
        </Button>

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-9 w-9 hover:bg-accent transition-colors focus:outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">{session.user?.name}</div>
              <div className="px-2 py-1 text-xs text-muted-foreground">{session.user?.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/mypage")}>
                <User className="mr-2 h-4 w-4" />마이페이지
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/watchlist")}>
                <BookMarked className="mr-2 h-4 w-4" />관심종목
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/auth/login" className="inline-flex items-center justify-center rounded-md px-3 h-7 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">로그인</Link>
            <Link href="/auth/register" className="inline-flex items-center justify-center rounded-md px-3 h-7 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">회원가입</Link>
          </div>
        )}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md h-9 w-9 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-1 flex-col gap-4 mt-4 pr-10 overflow-y-auto">
              <SearchBar />
              <nav className="flex flex-col gap-1">
                <Link
                  href="/"
                  className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >홈</Link>
                {navGroups.map((group, gi) => (
                  <div key={group.label}>
                    {gi > 0 && <Separator className="my-2" />}
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </div>
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors block",
                          isLinkActive(link.href, pathname)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >{link.label}</Link>
                    ))}
                  </div>
                ))}
              </nav>
              {!session && (
                <div className="flex flex-col gap-2 mt-2">
                  <Link href="/auth/login" className="inline-flex items-center justify-center rounded-md border px-4 h-9 text-sm font-medium hover:bg-accent transition-colors">로그인</Link>
                  <Link href="/auth/register" className="inline-flex items-center justify-center rounded-md px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">회원가입</Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 2단 서브 네비게이션 */}
      {activeCategory && (
        <div className="hidden lg:block border-t bg-muted/30">
          <div className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 flex items-center h-10 gap-1 overflow-x-auto">
            {activeCategory.subLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1 rounded-md text-sm whitespace-nowrap transition-colors",
                  isLinkActive(link.href, pathname)
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
