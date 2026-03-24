# Pretendard Dynamic Subset CDN Integration Guide

## 1. What is "Dynamic Subset"?

Pretendard's dynamic subset splits the full font into **dozens of small chunks** based on `unicode-range`. Each chunk covers a specific range of Unicode code points (e.g., common Hangul syllables, Latin, punctuation, rare Hanja).

**How it works:**
- The CSS file declares many `@font-face` rules, each with a different `unicode-range` and a different `.woff2` file URL.
- The browser scans the page text, determines which Unicode ranges are needed, and **only downloads those chunks**.
- A typical Korean page loads ~150-300KB instead of the full ~5MB variable font.

This is NOT server-side subsetting (which requires knowing content at build time). It's fully client-side: the browser's CSS engine handles everything via the `unicode-range` descriptor.

## 2. CDN URLs (v1.3.9 — latest as of 2024-11)

### Variable Dynamic Subset (RECOMMENDED)
Single variable font file per chunk — supports weight axis 45-920.

```
# jsDelivr (recommended — GitHub-backed, fast in Asia)
https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css

# cdnjs
https://cdnjs.cloudflare.com/ajax/libs/pretendard/1.3.9/variable/pretendardvariable-dynamic-subset.min.css

# UNPKG
https://unpkg.com/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css
```

Font-family name: `"Pretendard Variable"`

### Static Dynamic Subset (individual weights)
Separate files per weight (100–900). Larger total but useful if you only need 1-2 weights.

```
# jsDelivr
https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css

# cdnjs
https://cdnjs.cloudflare.com/ajax/libs/pretendard/1.3.9/static/pretendard-dynamic-subset.min.css
```

Font-family name: `"Pretendard"`

## 3. Integration with Next.js App Router + Tailwind CSS 4

### Option A: CDN via `<link>` in layout.tsx (Simplest)

**Step 1: Add link tag in `src/app/layout.tsx` `<head>`:**

```tsx
<head>
  <link
    rel="stylesheet"
    as="style"
    crossOrigin="anonymous"
    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
  />
  {/* ... existing head content */}
</head>
```

**Step 2: Update `src/app/globals.css` — set `--font-sans`:**

```css
@theme inline {
  --font-sans: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont,
    system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo",
    "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol", sans-serif;
  /* ... rest of theme */
}
```

**Step 3: Remove or keep Geist as mono-only:**

In `layout.tsx`, you can either:
- Keep Geist Sans as a fallback (it still loads for Latin text)
- Remove `geistSans` entirely and rely on Pretendard for all text

```tsx
// Option: Keep Geist Mono only
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

// Body class — remove geistSans.variable if dropping Geist Sans
<body className={`${geistMono.variable} antialiased`}>
```

### Option B: CSS @import in globals.css

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
```

> Note: `@import url(...)` for external CDN in CSS may cause a render-blocking chain. The `<link>` approach (Option A) is preferred because the browser can discover and fetch the CSS earlier.

### Option C: Self-hosted via next/font/local (Maximum control)

```bash
# Download PretendardVariable.woff2 (~5.2MB full, no dynamic subset)
# Place in src/assets/fonts/
```

```tsx
// layout.tsx
import localFont from "next/font/local"

const pretendard = localFont({
  src: "../assets/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
})
```

> This loads the FULL variable font (~5.2MB). No unicode-range splitting. next/font does NOT support dynamic subset from CDN.

## 4. Performance Comparison

| Approach | Initial CSS | Font Download | Total (typical KR page) | CLS Risk |
|---|---|---|---|---|
| **CDN Dynamic Subset (Variable)** | ~15KB CSS | ~150-300KB (only needed chunks) | ~170-320KB | Low (`font-display: swap` in CSS) |
| **CDN Dynamic Subset (Static, 2 weights)** | ~30KB CSS | ~100-200KB per weight | ~230-430KB | Low |
| **Self-hosted Variable (full)** | 0 (inline) | ~5.2MB (entire font) | ~5.2MB | Medium (large download) |
| **Self-hosted Variable + next/font** | 0 | ~5.2MB (preloaded) | ~5.2MB but preloaded | Low (size-adjust fallback) |
| **Fontsource (npm)** | Bundled | ~5.2MB or subset | Varies | Low |

**Verdict:** CDN Dynamic Subset Variable is the best balance of performance and simplicity for a Korean-language site. You get ~90% size reduction vs full variable font, with zero build configuration.

## 5. Caveats

### CSP (Content Security Policy)
Your current CSP in `next.config.ts` has:
```
font-src 'self' data:
style-src 'self' 'unsafe-inline'
```

You MUST update these to allow jsDelivr:

```
font-src 'self' data: https://cdn.jsdelivr.net
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net
```

If using cdnjs: also add `https://cdnjs.cloudflare.com`

### CORS
The `<link>` tag must include `crossOrigin="anonymous"` (or `crossorigin` in HTML). jsDelivr serves proper CORS headers (`Access-Control-Allow-Origin: *`), so this works out of the box.

### font-display
Pretendard's dynamic subset CSS uses `font-display: swap` by default. This means:
- Text renders immediately with fallback font
- Swaps to Pretendard once loaded
- Brief FOUT (Flash of Unstyled Text) is possible but acceptable
- No invisible text (FOIT) period

### Caching
jsDelivr uses immutable caching with versioned URLs. The font chunks are cached indefinitely by the browser after first load. Subsequent page navigations within the same session won't re-download.

### Version Pinning
Always pin to a specific version (`@v1.3.9`). Using `@latest` or no version risks breaking changes and cache busting.

### next/font Limitation
`next/font/google` and `next/font/local` do NOT support CDN dynamic subset. They're designed for self-hosted fonts only. For dynamic subset, you must use `<link>` or `@import`.
