import localFont from "next/font/local"

export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-pretendard",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Roboto",
    "Helvetica Neue",
    "Segoe UI",
    "Apple SD Gothic Neo",
    "Noto Sans KR",
    "Malgun Gothic",
    "sans-serif",
  ],
})

export const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMonoVariable.woff2",
  weight: "100 800",
  display: "swap",
  variable: "--font-jetbrains-mono",
})
