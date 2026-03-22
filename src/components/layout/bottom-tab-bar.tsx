"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Globe, Newspaper, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/market", label: "시장", icon: Globe },
  { href: "/news", label: "뉴스", icon: Newspaper },
  { href: "/mypage", label: "MY", icon: User },
]

export function BottomTabBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/mypage"
            ? pathname.startsWith("/mypage") || pathname.startsWith("/watchlist") || pathname.startsWith("/settings")
            : pathname === href
          return (
            <Link key={href} href={href}
              className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors",
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
  )
}
