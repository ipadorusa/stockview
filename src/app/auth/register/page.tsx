import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"
import { GtmPageView } from "@/components/analytics/gtm-page-view"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "회원가입",
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12">
      <GtmPageView pageData={{ page_name: "register" }} />
      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
        <TrendingUp className="h-6 w-6 text-primary" />
        StockView
      </Link>
      <RegisterForm />
    </div>
  )
}
