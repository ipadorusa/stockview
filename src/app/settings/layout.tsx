import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "설정",
  description: "프로필, 비밀번호, 테마 등 StockView 계정 설정을 관리합니다.",
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
