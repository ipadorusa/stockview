"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { TrendingUp, Sun, Moon, Menu, LogOut, BookMarked, Search, User } from "lucide-react"
import { useState } from "react"
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
import { SearchBar } from "@/components/search/search-bar"
import { SearchCommand } from "@/components/search/search-command"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"

const navLinks = [
  { href: "/", label: "홈" },
  { href: "/market", label: "시장" },
  { href: "/etf", label: "ETF" },
  { href: "/screener", label: "스크리너" },
  { href: "/reports", label: "AI 리포트" },
  { href: "/news", label: "뉴스" },
  { href: "/watchlist", label: "관심종목" },
]

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>StockView</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="hidden md:block w-64">
          <SearchBar />
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
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
          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth/login" className="inline-flex items-center justify-center rounded-md px-3 h-7 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">로그인</Link>
            <Link href="/auth/register" className="inline-flex items-center justify-center rounded-md px-3 h-7 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">회원가입</Link>
          </div>
        )}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md h-9 w-9 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-4">
              <SearchBar />
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn("px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >{link.label}</Link>
                ))}
              </nav>
              {!session && (
                <div className="flex flex-col gap-2 mt-2">
                  <Link href="/auth/login" onClick={() => setSheetOpen(false)} className="inline-flex items-center justify-center rounded-md border px-4 h-9 text-sm font-medium hover:bg-accent transition-colors">로그인</Link>
                  <Link href="/auth/register" onClick={() => setSheetOpen(false)} className="inline-flex items-center justify-center rounded-md px-4 h-9 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">회원가입</Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
