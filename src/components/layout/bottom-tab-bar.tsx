"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Globe, Star, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchCommand } from "@/components/search/search-command"

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "#search", label: "검색", icon: Search, isOverlay: true },
  { href: "/market", label: "시장", icon: Globe },
  { href: "/watchlist", label: "관심", icon: Star },
  { href: "/mypage", label: "MY", icon: User },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
        <div className="flex items-center justify-around h-14">
          {tabs.map(({ href, label, icon: Icon, ...rest }) => {
            const isOverlay = "isOverlay" in rest && rest.isOverlay
            const isActive = isOverlay
              ? false
              : href === "/watchlist"
                ? pathname.startsWith("/watchlist")
                : href === "/mypage"
                  ? pathname.startsWith("/mypage") || pathname.startsWith("/settings")
                  : pathname === href

            if (isOverlay) {
              return (
                <button
                  key={href}
                  onClick={() => setSearchOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs text-muted-foreground"
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              )
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
