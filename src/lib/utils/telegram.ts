const SEVERITY_ICONS = {
  info: "ℹ️",
  warning: "⚠️",
  error: "🚨",
} as const

export async function sendTelegramAlert(
  title: string,
  message: string,
  severity: "info" | "warning" | "error" = "error"
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) {
    console.log(`[telegram] Not configured, skipping alert: ${title}`)
    return
  }

  const icon = SEVERITY_ICONS[severity]
  const text = `${icon} <b>${escapeHtml(title)}</b>\n\n<pre>${escapeHtml(message.slice(0, 3500))}</pre>`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.error(`[telegram] Send failed: HTTP ${res.status}`)
    }
  } catch (e) {
    console.error(`[telegram] Send error: ${e instanceof Error ? e.message : String(e)}`)
  } finally {
    clearTimeout(timeout)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
