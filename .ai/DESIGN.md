# StockView Design System

> **Version**: 0.2 (Components + Layout + Guardrails complete)
> **Date**: 2026-04-12
> **Status**: v0.2 — All 10 sections complete. Token ingestion into `globals.css` pending M4.
> **Source of truth**: This file is the authoritative design system for StockView. All UI work must read this first. A 3-line pointer `DESIGN.md` at project root redirects here.
> **Format**: [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/format/) 9-section + `§10 Market Data Patterns` (StockView extension).
> **Companion**: [`AGENTS.md`](../AGENTS.md), [`CLAUDE.md`](../CLAUDE.md).

StockView is a dual-market (Korea / United States) stock information platform. This design system is **AI-native**: every color, type, and spacing rule below is phrased so that an AI coding agent can reproduce consistent UI from this document alone.

---

## §0. Quick Navigation (TL;DR)

**Most-used answers in under 10 seconds:**

```
PAGE BG      var(--bg-base)       TEXT         var(--text-primary)
CARD BG      var(--bg-card)       LABEL        var(--text-secondary)
FLOATING     var(--bg-floating)   CAPTION      var(--text-tertiary)

STOCK UP     var(--color-stock-up)    (red, hue 25, KR convention)
STOCK DOWN   var(--color-stock-down)  (blue, hue 250)
STOCK FLAT   var(--color-stock-flat)  + -bg variants for tints

PRIMARY      var(--primary)    (teal)      DANGER (UI)  var(--danger)
ACCENT       var(--accent)     (gold)      FOCUS RING   var(--border-focus)

FONT BODY    var(--font-sans)  (Pretendard)
FONT NUMBER  var(--font-mono)  (JetBrains Mono) + tabular-nums — MANDATORY

SHADOW       --shadow-subtle/medium/elevated/floating
RADIUS       --radius-sm/md/lg/xl (0.375/0.5/0.625/0.875 rem)

DENSITY      <body data-density="casual|standard|pro">
             row-height 52/44/36 · card-padding 20/16/12 · text 15/14/13
```

**Full cheatsheet → §9.1** · **Example prompts → §9.4** · **Do/Don't → §7**

**Section map:**

| § | Topic | When to read |
|---|-------|--------------|
| [§1](#1-visual-theme--atmosphere) | Visual Theme & Atmosphere | Onboarding; philosophical questions |
| [§2](#2-color-palette--roles) | Color Palette & Roles | Any color decision — 9 subsections |
| [§3](#3-typography-rules) | Typography Rules | Font, size, weight, numeric display |
| [§4](#4-component-stylings) | Component Stylings | Building or extending a component |
| [§5](#5-layout-principles) | Layout Principles | Page structure, density, grids |
| [§6](#6-depth--elevation) | Depth & Elevation | Surface, shadow, glass rules |
| [§7](#7-dos-and-donts) | Do's and Don'ts | Code review, PR self-check |
| [§8](#8-responsive-behavior) | Responsive Behavior | Mobile adaptation |
| [§9](#9-agent-prompt-guide) | Agent Prompt Guide | Writing AI prompts; grep cheatsheet |
| [§10](#10-market-data-patterns-stockview-extension) | Market Data Patterns | Stock-specific rules (KR/US, charts) |

---

## 1. Visual Theme & Atmosphere

**Identity**: *Terminal Elegance* — the information density of a professional trading terminal (Bloomberg, TradingView, Kraken) crossed with the refinement of modern design systems (Linear, Vercel Geist, Radix/shadcn).

StockView is built for two audiences at once: Korean retail investors who expect **red = up / blue = down**, and power users who want dense, always-live dashboards without re-parsing the screen every time a price ticks. The design must serve both without switching modes.

**Key Characteristics**:

- **Dark-first**, light as companion. Dark is the default experience for long-duration monitoring; light mode exists and is first-class, but every decision is made dark-first, then inverted.
- **oklch for everything**. Perceptually uniform color space lets us reason about lightness and chroma independently. Hex and raw rgb are **banned** outside legacy third-party widgets.
- **Korean stock convention**: red (hue 25) = rising, blue (hue 250) = falling. This is inverted from Western finance and is non-negotiable.
- **Glassmorphism is rationed**. Only the desktop header and the mobile bottom tab bar use `backdrop-filter: blur`. Chart tooltips, ticker tape, cards, modals — all solid. This protects legibility and GPU budget.
- **No noise textures, no gradients on chrome**. Flat surfaces; depth comes from the 5-level background stack (§6.1), not from decoration.
- **Numbers before letters**. Price, volume, percent change, index values — every numeric element uses a monospace font with `tabular-nums` so columns align. This is the single biggest legibility win for a stock app (§3.4).
- **Density is explicit, not accidental**. Every route is classified casual / standard / pro (§5, pending M3), and 5 spacing tokens flip automatically via `<body data-density>`. A power user's `/stock/[ticker]` screen and a new user's `/mypage` intentionally look different.
- **Live-system mental model**. Components are designed assuming the value they display will change under the user's cursor. Animations are short (120–350ms), always on-purpose, and respect `prefers-reduced-motion`.

### 1.1 Non-negotiable decisions

| # | Rule | Why |
|---|------|-----|
| 1 | Dark mode is the default experience | Financial pros monitor for hours; light mode causes eye fatigue |
| 2 | Korean stock color convention (red ↑ / blue ↓) | Primary audience is Korean retail; inverting this breaks user expectation |
| 3 | All color in oklch | Reasoning about lightness/chroma is required for dark+light pairing and accessibility |
| 4 | Glassmorphism only on header + mobile bottom tab | Legibility; GPU; avoids "fashionable but unreadable" |
| 5 | No noise textures | Clean surfaces; the data IS the texture |
| 6 | `tabular-nums` mandatory on all numerics | Column alignment in tables is the defining legibility feature of a stock app |
| 7 | `DESIGN.md` is the single source of truth | AI agents read this before touching any UI file |

---

## 2. Color Palette & Roles

> **All values are oklch.** Dark mode is listed first. Values in parentheses are light-mode counterparts.

### 2.1 Background Stack — 5 levels

Surfaces create hierarchy through lightness differences. The goal is to separate regions **without needing borders**.

| Level | Variable | Dark | Light | Use |
|-------|----------|------|-------|-----|
| L0 Base | `--bg-base` | `oklch(0.13 0.005 260)` | `oklch(0.965 0.003 260)` | Page background, app shell |
| L1 Surface | `--bg-surface` | `oklch(0.17 0.005 260)` | `oklch(0.985 0.002 260)` | Main content panels, sidebar, ticker tape |
| L2 Card | `--bg-card` | `oklch(0.21 0.005 260)` | `oklch(1.0 0 0)` | Cards, dropdowns, popovers |
| L3 Elevated | `--bg-elevated` | `oklch(0.25 0.008 260)` | `oklch(1.0 0 0)` + shadow | Hover states, modal underlays |
| L4 Floating | `--bg-floating` | `oklch(0.30 0.010 260)` | `oklch(1.0 0 0)` + strong shadow | Tooltips, floating panels, toasts |

In light mode, L2–L4 all resolve to pure white and rely on shadow (§6.2) for separation.

### 2.2 Text Hierarchy — 4 levels

| Variable | Dark | Light | Use |
|----------|------|-------|-----|
| `--text-primary` | `oklch(0.95 0 0)` | `oklch(0.15 0 0)` | Headlines, prices, core content |
| `--text-secondary` | `oklch(0.72 0 0)` | `oklch(0.40 0 0)` | Descriptions, labels |
| `--text-tertiary` | `oklch(0.55 0 0)` | `oklch(0.55 0 0)` | Captions, timestamps, inactive |
| `--text-muted` | `oklch(0.42 0 0)` | `oklch(0.70 0 0)` | Placeholders, faint hints |

All contrast ratios verified against `--bg-base` and `--bg-card`. See §10.5 for the full WCAG table.

### 2.3 Brand & Accent

| Variable | Dark | Light | Use |
|----------|------|-------|-----|
| `--primary` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | Primary action, links, active state (Teal) |
| `--primary-hover` | `oklch(0.78 0.15 162)` | `oklch(0.40 0.18 162)` | Hover |
| `--primary-muted` | `oklch(0.72 0.17 162 / 15%)` | `oklch(0.45 0.16 162 / 10%)` | Tint background |
| `--primary-foreground` | `oklch(0.15 0 0)` | `oklch(0.985 0 0)` | Text on primary fill |
| `--secondary` | `oklch(0.70 0.10 250)` | `oklch(0.50 0.12 250)` | Secondary action (Blue) |
| `--secondary-hover` | `oklch(0.76 0.08 250)` | `oklch(0.45 0.14 250)` | — |
| `--secondary-foreground` | `oklch(0.985 0 0)` | `oklch(0.15 0 0)` | — |
| `--accent` | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | Emphasis (Gold / Amber) |
| `--accent-hover` | `oklch(0.85 0.10 85)` | `oklch(0.50 0.16 85)` | — |
| `--accent-foreground` | `oklch(0.15 0 0)` | `oklch(0.15 0 0)` | — |

**Note on "primary = Teal, not Red"**: red is reserved for stock-up (§2.6). A separate brand color prevents the entire interface from looking like one big up-arrow.

### 2.4 Semantic / State

| Variable | Dark | Light | Use |
|----------|------|-------|-----|
| `--success` | `oklch(0.72 0.19 145)` | `oklch(0.50 0.17 145)` | Success state (Green) |
| `--success-bg` | `oklch(0.72 0.19 145 / 12%)` | `oklch(0.50 0.17 145 / 8%)` | Success tint |
| `--warning` | `oklch(0.82 0.16 75)` | `oklch(0.65 0.18 75)` | Warning (Amber) |
| `--warning-bg` | `oklch(0.82 0.16 75 / 12%)` | `oklch(0.65 0.18 75 / 8%)` | Warning tint |
| `--danger` | `oklch(0.70 0.20 25)` | `oklch(0.55 0.22 25)` | Error / destructive (Red) |
| `--danger-bg` | `oklch(0.70 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | Error tint |
| `--info` | `oklch(0.75 0.12 240)` | `oklch(0.55 0.14 240)` | Info (Blue) |
| `--info-bg` | `oklch(0.75 0.12 240 / 12%)` | `oklch(0.55 0.14 240 / 8%)` | Info tint |

> **⚠ Hue collision**: `--danger` and `--color-stock-up` (§2.6) share hue 25 (red). They are visually distinct by context — never use `--danger` inside a price cell or `--color-stock-up` on a destructive button. The §2.6 tokens are for market direction only; §2.4 is for UI state.
>
> **Intentional lightness delta (dark mode only)**: `--danger` uses `L=0.70` while `--color-stock-up` uses `L=0.72`. This is deliberate — destructive buttons sit slightly darker than price cells so they don't compete for attention when both appear in the same viewport (e.g. a stock detail page with a "Delete watchlist" button). Light mode aligns both at `L=0.55` because light mode has less contrast budget to spend on this kind of separation.

### 2.5 Borders & Dividers

| Variable | Dark | Light |
|----------|------|-------|
| `--border-subtle` | `oklch(1 0 0 / 6%)` | `oklch(0 0 0 / 6%)` |
| `--border-default` | `oklch(1 0 0 / 10%)` | `oklch(0 0 0 / 10%)` |
| `--border-strong` | `oklch(1 0 0 / 16%)` | `oklch(0 0 0 / 16%)` |
| `--border-focus` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` |
| `--border-gradient-start` | `oklch(0.72 0.17 162 / 40%)` | `oklch(0.45 0.16 162 / 30%)` |
| `--border-gradient-end` | `oklch(0.70 0.10 250 / 20%)` | `oklch(0.50 0.12 250 / 15%)` |

`--border-gradient-*` is used only on the "emphasized" card variant (M3 §4) for Hot Stocks Top 3 and similar highlights.

### 2.6 Stock Direction Colors (Korean convention)

**This is the most important section of the document.** Every price, every candle, every gauge, every diff must use these tokens. Never inline `#ff0000` or `text-red-500` for price direction.

| Variable | Dark | Light | Use |
|----------|------|-------|-----|
| `--color-stock-up` | `oklch(0.72 0.20 25)` | `oklch(0.55 0.22 25)` | Rising price (red, hue 25) |
| `--color-stock-up-bg` | `oklch(0.72 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | Rising background tint |
| `--color-stock-down` | `oklch(0.72 0.15 250)` | `oklch(0.55 0.17 250)` | Falling price (blue, hue 250) |
| `--color-stock-down-bg` | `oklch(0.72 0.15 250 / 12%)` | `oklch(0.55 0.17 250 / 8%)` | Falling background tint |
| `--color-stock-flat` | `oklch(0.60 0 0)` | `oklch(0.55 0 0)` | Unchanged (neutral gray) |
| `--color-stock-flat-bg` | `oklch(0.60 0 0 / 10%)` | `oklch(0.55 0 0 / 8%)` | Unchanged background tint (symmetry with up-bg / down-bg) |
| `--color-chart-candle-up` | alias of `--color-stock-up` | — | Candlestick up body |
| `--color-chart-candle-down` | alias of `--color-stock-down` | — | Candlestick down body |

**Why hue 25 and 250?** They are maximally separated on the chroma wheel while staying in the perceptually warm/cool split Korean users expect. Do **not** substitute Western finance convention (green up / red down).

### 2.7 Chart Palette — 3-tier hybrid

Three palettes coexist because they solve different problems. **Picking the wrong tier is the #1 source of chart-color inconsistency.**

#### Tier 1: Semantic (5 slots) — directional, state-based

Use for **single-series** charts, gauges, indicators, candles, and any visualization where "up/down/neutral" has meaning.

| Variable | Value | Alias of | Use |
|----------|-------|----------|-----|
| `--chart-up` | — | `var(--color-stock-up)` | Rising value, bullish signal |
| `--chart-down` | — | `var(--color-stock-down)` | Falling value, bearish signal |
| `--chart-neutral` | — | `var(--color-stock-flat)` | Unchanged, zero-line |
| `--chart-accent` | — | `var(--primary)` | Highlight / selected series |
| `--chart-info` | — | `var(--info)` | Reference lines, annotations |

These are **live CSS `var()` aliases**, not copied values. `--chart-up` is declared as `--chart-up: var(--color-stock-up);` in `globals.css` (M4). Chart code says `stroke: var(--chart-up)` without knowing or caring that it's the same red as the stock-up color — and if we later decouple chart semantics from stock direction, we change only the alias declaration, not the 50+ component files that consume it.

#### Tier 2: Categorical (8 slots) — multi-series distinction

Use for **multi-series** charts where the series have no inherent order or direction: comparison charts (`/compare`), sector donut charts, portfolio allocation pies, multi-stock overlays.

Ordered by perceptual distance (adjacent slots are maximally distinct for color-vision-deficient viewers):

| Variable | Dark | Light | Name |
|----------|------|-------|------|
| `--chart-series-1` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | Teal (= primary) |
| `--chart-series-2` | `oklch(0.75 0.14 45)` | `oklch(0.55 0.16 45)` | Orange |
| `--chart-series-3` | `oklch(0.70 0.15 300)` | `oklch(0.48 0.17 300)` | Purple |
| `--chart-series-4` | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | Gold |
| `--chart-series-5` | `oklch(0.68 0.18 210)` | `oklch(0.48 0.18 210)` | Cyan |
| `--chart-series-6` | `oklch(0.72 0.16 350)` | `oklch(0.50 0.18 350)` | Pink |
| `--chart-series-7` | `oklch(0.75 0.15 120)` | `oklch(0.50 0.16 120)` | Lime |
| `--chart-series-8` | `oklch(0.70 0.12 20)` | `oklch(0.50 0.14 20)` | Coral |

Area fills should use the same color at 10–20% opacity with a vertical gradient to transparent at the bottom.

> **Migration note**: The current `globals.css` has `--chart-1..5` as a blue-purple gradient that is neither semantic nor categorical. M4 renames these to `--chart-series-1..5` and extends them to `-8` to match this table, plus adds the semantic aliases.

#### Tier 3: Heatmap (9 slots) — gradient, magnitude-based

Use for **divergent** visualizations: sector treemaps, performance matrices, correlation grids. Follows Korean convention (red = positive, blue = negative) and passes through a neutral gray at zero.

| Variable | Dark (light shares same values — self-contrast) | Band |
|----------|--------------------------------------------------|------|
| `--heatmap-1` | `oklch(0.55 0.17 250)` | ≤ −4% (deep blue) |
| `--heatmap-2` | `oklch(0.60 0.12 250)` | −3% |
| `--heatmap-3` | `oklch(0.65 0.08 250)` | −2% |
| `--heatmap-4` | `oklch(0.68 0.04 250)` | −1% |
| `--heatmap-5` | `oklch(0.55 0 0)` | 0% (neutral gray) |
| `--heatmap-6` | `oklch(0.68 0.04 25)` | +1% |
| `--heatmap-7` | `oklch(0.65 0.08 25)` | +2% |
| `--heatmap-8` | `oklch(0.60 0.12 25)` | +3% |
| `--heatmap-9` | `oklch(0.55 0.17 25)` | ≥ +4% (deep red) |

### 2.8 Auxiliary Tokens

Used by specific widgets. Defined here so they have a home.

| Group | Variable | Value | Use |
|-------|----------|-------|-----|
| Breadth opacity | `--bar-opacity-full` | `1.0` | Strongest bar fill (Top 1 stock in breadth widget) |
| Breadth opacity | `--bar-opacity-high` | `0.8` | — |
| Breadth opacity | `--bar-opacity-medium` | `0.5` | — |
| Breadth opacity | `--bar-opacity-low` | `0.3` | — |
| Breadth opacity | `--bar-opacity-bg` | `0.1` | Bar track background |
| Sentiment gauge | `--sentiment-fear` | dark `oklch(0.70 0.15 300)` / light `oklch(0.48 0.17 300)` | Fear end of Fear/Greed index — **purple, intentionally not red/blue** |
| Sentiment gauge | `--sentiment-neutral` | dark `oklch(0.55 0 0)` / light `oklch(0.55 0 0)` | Neutral midpoint (gray) |
| Sentiment gauge | `--sentiment-greed` | dark `oklch(0.80 0.12 85)` / light `oklch(0.55 0.14 85)` | Greed end (gold) |
| Market index | `--index-kospi` | `var(--color-stock-up)` | KOSPI ticker/widget accent |
| Market index | `--index-kosdaq` | `var(--color-stock-down)` | KOSDAQ ticker/widget accent |
| Market index | `--index-sp500` | `var(--primary)` | S&P 500 ticker/widget accent (teal) |
| Market index | `--index-nasdaq` | dark `oklch(0.70 0.15 300)` / light `oklch(0.48 0.17 300)` | NASDAQ ticker/widget accent (purple) |
| Market index | `--index-usdkrw` | `var(--accent)` | USD/KRW exchange rate accent (gold) |
| Carousel dots | `--dot-inactive` | dark `oklch(1 0 0 / 20%)` / light `oklch(0 0 0 / 15%)` | Inactive pagination dot |
| Carousel dots | `--dot-active` | `var(--primary)` | Active pagination dot |
| Carousel dots | `--dot-size` | `6px` | Inactive dot diameter |
| Carousel dots | `--dot-size-active` | `18px` | Active dot width (elongated pill) |
| Carousel dots | `--dot-gap` | `6px` | Gap between dots |

All "`var(...)`" entries above are **live aliases**, not copied values — changing the source token (e.g. `--color-stock-up`) automatically propagates.

### 2.9 shadcn Compatibility Aliases

shadcn/ui components reference their own token names. Map these as aliases so upstream updates keep working.

> **⚠ M4 activation**: These aliases are the *target* state. They will be declared in `globals.css` during M4 (token ingestion). Until then, the current `globals.css` still has the original shadcn values directly defined — see `.ai/design-tokens-snapshot.md` for the present state.

| shadcn variable | maps to |
|-----------------|---------|
| `--background` | `var(--bg-base)` |
| `--foreground` | `var(--text-primary)` |
| `--card` | `var(--bg-card)` |
| `--card-foreground` | `var(--text-primary)` |
| `--popover` | `var(--bg-floating)` |
| `--popover-foreground` | `var(--text-primary)` |
| `--muted` | `var(--bg-surface)` |
| `--muted-foreground` | `var(--text-secondary)` |
| `--border` | `var(--border-default)` |
| `--ring` | `var(--border-focus)` |
| `--destructive` | `var(--danger)` |

---

## 3. Typography Rules

### 3.1 Font Families

Two local variable fonts, loaded via `next/font/local`. No Google Fonts network dependency — builds are fully offline-safe.

| Role | Family | Variable | Source |
|------|--------|----------|--------|
| Sans (UI, body, Korean) | **Pretendard Variable** | `--font-pretendard` | `src/app/fonts/PretendardVariable.woff2` |
| Mono (prices, tickers, code) | **JetBrains Mono Variable** | `--font-jetbrains-mono` | `src/app/fonts/JetBrainsMonoVariable.woff2` *(to be added in M4)* |

Fallback chains:

```css
--font-sans: var(--font-pretendard), "Pretendard Variable", "Pretendard", -apple-system,
             BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR",
             "Malgun Gothic", sans-serif;
--font-mono: var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, Consolas,
             "Liberation Mono", monospace;
```

**Why no Inter**: JetBrains Mono is monospace, so numeric columns align by construction — we don't need Inter's `tnum` feature. Adding a third sans family would cost ~30KB for zero UX gain. Pretendard handles CJK and Latin body equally well.

### 3.2 Size Scale — 10 tiers

Optimized for high data density.

| Token | px | rem | Line height | Use |
|-------|----|----|-------------|-----|
| `--text-2xs` | 10 | 0.625 | 1.2 | Chart axes, volume labels |
| `--text-xs` | 12 | 0.75 | 1.3 | Timestamps, badges, captions, market status |
| `--text-sm` | 13 | 0.8125 | 1.4 | Secondary text, table cells, descriptions |
| `--text-base` | 14 | 0.875 | 1.5 | Body, form labels, list items |
| `--text-md` | 15 | 0.9375 | 1.5 | Card titles, table headers |
| `--text-lg` | 17 | 1.0625 | 1.4 | Section titles, stock names |
| `--text-xl` | 20 | 1.25 | 1.3 | Page subtitles, prices |
| `--text-2xl` | 24 | 1.5 | 1.2 | Page titles, hero numbers |
| `--text-3xl` | 30 | 1.875 | 1.1 | Large display numbers (index values) |
| `--text-4xl` | 36 | 2.25 | 1.1 | Hero headline numbers |

**Base body size is 14px, not 16px.** This is intentional — trading terminals use denser scales. For casual routes (`/`, `/mypage`), density mode (§5 pending M3) bumps the base to 15px; for pro routes (`/stock/[ticker]`), it drops to 13px.

### 3.3 Weight System — 4 tiers

| Token | Weight | Use |
|-------|--------|-----|
| `--font-regular` | 400 | Body, descriptions, table cells |
| `--font-medium` | 500 | Labels, card titles, navigation |
| `--font-semibold` | 600 | Section headers, stock names, emphasis |
| `--font-bold` | 700 | Prices, KPI numbers, page titles |

Both Pretendard Variable and JetBrains Mono Variable support the full 100–800 range, so the four tokens above are just "recommended stops" — variable weights are available where needed.

### 3.4 Numeric Typography — the defining rule

**All numeric values (prices, volumes, percentages, index values, timestamps) MUST use a monospace font with `tabular-nums`.** No exceptions.

```css
.font-mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* Large price display — tighter tracking */
.font-price {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

JetBrains Mono is monospace by construction, so `tabular-nums` is mostly a formality — but specifying it explicitly guards against future font changes and unifies with Pretendard-sans cells that display mixed letter+number content.

### 3.5 Letter Spacing Rules

| Context | Tracking | Note |
|---------|----------|------|
| Uppercase labels (`.card-section-title`) | `0.05em` | Widen for legibility |
| Body copy | `0` | Pretendard default |
| Large titles (≥ `--text-xl`) | `-0.01em` | Slight tightening for sophistication |
| Large numbers (≥ `--text-2xl`) | `-0.02em` | Monospace alignment benefits from tightening |

### 3.6 Typography Utility Classes

```css
/* Price sizes (M3 component specs will use these) */
.price-large   { font-size: var(--text-4xl); font-weight: 700; letter-spacing: -0.02em; }
.price-medium  { font-size: var(--text-xl);  font-weight: 700; letter-spacing: -0.02em; }
.price-small   { font-size: var(--text-sm);  font-weight: 500; letter-spacing: -0.01em; }

/* Directional change pill */
.change-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: var(--radius-2xl);
  font-size: var(--text-xs); font-weight: 500;
  font-family: var(--font-mono); font-variant-numeric: tabular-nums;
}
.change-pill[data-trend="up"]   { color: var(--color-stock-up);   background: var(--color-stock-up-bg); }
.change-pill[data-trend="down"] { color: var(--color-stock-down); background: var(--color-stock-down-bg); }
.change-pill[data-trend="flat"] { color: var(--color-stock-flat); background: var(--color-stock-flat-bg); }

/* Uppercase section labels above cards */
.card-section-title {
  font-size: var(--text-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--text-secondary);
}
```

All five utility classes above are part of the public token API; components in M3 will reference them by class name.

---

## 4. Component Stylings

This section has three layers:

- **§4.1 shadcn primitives** — current implementation snapshot. These are the canonical low-level building blocks; the values below reflect what actually ships in `src/components/ui/*.tsx` today.
- **§4.2 StockView common components** — existing domain components in `src/components/common/*` + `src/components/stock/*`.
- **§4.3 New components (M4 creation target)** — compound components the plan commits to creating during M4 to eliminate duplicated inline styling.

**Golden rules for every component on this page:**
1. Use CSS variables from §2 — never hardcoded hex, rgb, or raw Tailwind color utilities like `text-red-500`.
2. Variants must be CVA-declared, not inline-conditional JSX.
3. Respect the density system (§5.3) for spacing; components themselves stay single-spec.
4. Numbers use `var(--font-mono)` with `tabular-nums` (§3.4) — no exceptions.

### 4.1 shadcn Primitives (current snapshot)

All primitives below use `@base-ui/react` for interaction primitives and `class-variance-authority` (CVA) for style variants. They are vendored, not npm-imported, so we can edit them directly.

#### 4.1.1 Button

- **Path**: `src/components/ui/button.tsx`
- **Variants** (6): `default` (filled primary), `outline`, `secondary`, `ghost`, `destructive`, `link`
- **Sizes** (8): `xs` / `sm` / `default` / `lg` / `icon` / `icon-xs` / `icon-sm` / `icon-lg`
- **Core classes**: `rounded-lg`, `font-medium`, `bg-primary text-primary-foreground`, `hover:bg-primary/80`, `focus-visible:ring-ring/50`, `active:translate-y-px`, `disabled:opacity-50 disabled:pointer-events-none`
- **Props**: `asChild`, `variant`, `size`, `className`
- **Visual**: Rounded medium with medium-weight label; filled primary by default. Active state has a 1px translate-y for tactile feedback.
- **Density interaction**: default size maps to `--density-row-height` (§5.3) for table row action buttons.

#### 4.1.2 Badge

- **Path**: `src/components/ui/badge.tsx`
- **Variants** (6): `default` / `secondary` / `destructive` / `outline` / `ghost` / `link`
- **Core classes**: `h-5 w-fit rounded-4xl px-2 py-0.5 inline-flex text-xs font-medium`
- **Props**: `variant`, `className`, `render` (polymorphic)
- **Visual**: Small pill-shaped tag (20px tall). Pill radius via `rounded-4xl` (= 2.6 × `--radius`). Supports leading icons via slot.

#### 4.1.3 Card

- **Path**: `src/components/ui/card.tsx`
- **Sub-components**: `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardAction` / `CardContent` / `CardFooter`
- **Sizes** (2): `default` / `sm` (via `data-size` attribute)
- **Core classes**: `rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 py-4 gap-4`
- **Visual**: Rounded-xl container on `--bg-card`. Uses **ring-1** (inside the box) instead of `border` to avoid nudging layout. `ring-foreground/10` = `--border-default`.
- **Size contract**:
  | Size | Padding | Gap |
  |------|---------|-----|
  | default | `py-4` | `gap-4` |
  | sm | `py-3` | `gap-3` |
- **Density interaction**: **card padding is the single point where density changes** — under M4 the `py-4`/`py-3` will be replaced by `var(--density-card-padding)`. See §5.3.

#### 4.1.4 Input

- **Path**: `src/components/ui/input.tsx`
- **Core classes**: `h-8 rounded-lg border-input bg-transparent px-2.5 py-1 text-sm focus-visible:ring-ring/50 placeholder:text-muted-foreground aria-invalid:border-destructive/50`
- **Dark mode tweak**: `dark:bg-input/30` (subtle fill for distinguishability)
- **Props**: `className`, `type`, standard `<input>` props
- **Visual**: 32px tall, transparent fill with a faint border, tight 10px horizontal padding. Focus ring uses the primary teal.
- **Dense contexts** (filter bars, inline edits): use `h-8` baseline. For form pages with `data-density="casual"` the density system bumps the font via `--density-text-base`; the input height stays 32 but the typography feels more generous.

#### 4.1.5 Table

- **Path**: `src/components/ui/table.tsx`
- **Sub-components**: `Table` / `TableHeader` / `TableBody` / `TableFooter` / `TableRow` / `TableHead` / `TableCell` / `TableCaption`
- **Core classes**: `text-sm w-full`, row: `border-b hover:bg-muted/50`, cell: `p-2`
- **Visual**: Lightweight table with row-level hover, thin border-b dividers, 8px cell padding. Horizontal scroll on mobile with a gradient fade mask on the right edge.
- **Mobile horizontal scroll pattern** (copy-paste ready):
  ```tsx
  <div className="relative">
    <div className="overflow-x-auto">
      <Table>...</Table>
    </div>
    {/* right-edge gradient mask hint */}
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent lg:hidden"
      aria-hidden
    />
  </div>
  ```
- **Price cell contract**: cells containing numbers MUST add `font-mono tabular-nums text-right` — enforce via `PriceCell` compound (§4.3.1), not inline.
- **Density interaction**: row height = `var(--density-row-height)` (§5.3). Default standard = 44px.

#### 4.1.6 Tooltip

- **Path**: `src/components/ui/tooltip.tsx`
- **Core classes**: `rounded-md bg-foreground text-background text-xs px-3 py-1.5 animate-in zoom-in-95`
- **Props**: `side` (`top`/`right`/`bottom`/`left`), `sideOffset` (default 4), `align`
- **Visual**: Inverted color (dark text on light in light mode, vice versa). 12px font, 6px vertical padding.
- **⚠ Chart tooltip exception**: this primitive is for UI hints (icon tooltips, truncation expansion). **Never use it for chart hover data** — chart data tooltips need monospace numbers, multi-line layout, and survivable padding. Use `ChartTooltip` (§4.3.4) instead.

#### 4.1.7 Sheet

- **Path**: `src/components/ui/sheet.tsx`
- **Sides**: `top` / `right` / `bottom` / `left` (via `data-side`)
- **Core classes**: `bg-background rounded-xl shadow-lg p-4 gap-4 w-3/4` (left/right)
- **Props**: `side`, `showCloseButton`, `children`
- **Visual**: Slide-in from edge with backdrop blur, rounded corners on the exposed edges, `--shadow-elevated` level shadow.
- **Mobile hamburger**: `<Sheet side="right" className="w-72">` is the canonical mobile nav wrapper (AppHeader uses this pattern).

#### 4.1.8 Dialog

- **Path**: `src/components/ui/dialog.tsx`
- **Core classes**: `max-w-[calc(100%-2rem)] sm:max-w-sm rounded-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ring-1 ring-foreground/10`
- **Props**: `showCloseButton`, `children`
- **Visual**: Centered modal, constrained to `sm:max-w-sm` (384px) by default, ring-1 inner outline, zoom-in + fade-in entrance.
- **Backdrop**: handled by `@base-ui/react` overlay, solid `bg-foreground/40` scrim (no blur).

#### 4.1.9 DropdownMenu

- **Path**: `src/components/ui/dropdown-menu.tsx`
- **Item variants**: `default` / `destructive` (via `data-variant`)
- **Core classes**: content: `rounded-lg bg-popover p-1 shadow-md`, item: `px-1.5 py-1 text-sm focus:bg-accent data-variant=destructive:text-destructive`
- **Sub-components**: `DropdownMenu` / `Trigger` / `Content` / `Group` / `Label` / `Item` / `CheckboxItem` / `RadioItem` / `Separator` / `Shortcut`
- **Visual**: Compact menu on `--bg-floating`, 4px radius items, 2px vertical / 6px horizontal item padding.

#### 4.1.10 Tabs

- **Path**: `src/components/ui/tabs.tsx`
- **List variants** (2): `default` (pill on `--bg-surface`) / `line` (underline indicator, transparent bg)
- **Orientation**: `horizontal` (default) / `vertical`
- **Core classes**: `inline-flex rounded-lg p-[3px] text-muted-foreground`, `data-variant=line:bg-transparent`
- **Use guidance**: `default` for content filtering (e.g. `/market` time range), `line` for primary page sections (e.g. `/stock/[ticker]` Overview / Chart / Financials / News tabs).

### 4.2 StockView Common Components (current)

#### 4.2.1 PriceChangeText

- **Path**: `src/components/common/price-change-text.tsx`
- **Props**: `value`, `changePercent`, `format` (`price` / `percent` / `both`), `currency` (`KRW` / `USD`), `showSign`, `className`
- **Color binding**: Uses `text-stock-up` / `text-stock-down` / `text-stock-flat` utility classes (these are Tailwind aliases of the §2.6 tokens).
- **Visual**: Formatted number + directional arrow (`▲` / `▼`) + color. Currency formatting auto-switches decimal precision per §10.3 (KRW = 0 decimals, USD = 2 decimals).
- **Status**: ✅ Canonical — use this everywhere, do not reinvent.

#### 4.2.2 ExchangeRateBadge

- **Path**: `src/components/common/exchange-rate-badge.tsx`
- **Props**: `rate`, `change`, `changePercent`, `className`
- **Color binding**: Uses `text-stock-up` / `text-stock-down` for the change delta.
- **Visual**: `USD/KRW 1,234.56 ▲0.12 (0.01%)` — rate in `font-mono`, delta color-coded.
- **Status**: ✅ Canonical for exchange rate display.

#### 4.2.3 TooltipHelper

- **Path**: `src/components/common/tooltip-helper.tsx`
- **Props**: `term`, `description`, `value`, `sectorAvg`
- **Color binding**: Signal-based via `SIGNAL_COLORS` from `src/lib/glossary.ts`.
- **Visual**: Small `CircleHelp` icon (14×14) that opens a `Tooltip` (§4.1.6) with up-to-80ch content + link into `/guide`.
- **⚠ M4 cleanup**: `glossary.ts` currently uses Tailwind built-in utility classes (`text-emerald-600 dark:text-emerald-400`, `text-amber-600 dark:text-amber-400`, `text-muted-foreground`) for signal colors. Per §7.1, these are not StockView tokens — should be migrated to `var(--success)` / `var(--warning)` / `var(--text-muted)`.

#### 4.2.4 EmptyState

- **Path**: `src/components/common/empty-state.tsx`
- **Props**: `icon` (LucideIcon), `title`, `description`, `action: { label, onClick }`
- **Core classes**: `py-16`, icon wrapped in `rounded-full bg-muted p-4`, title `text-lg font-semibold`
- **Visual**: Centered icon in a muted circle, title, description, optional button. Use for "no watchlist items", "no search results", "no earnings for this period".

#### 4.2.5 NewsTimestamp

- **Path**: `src/components/common/news-timestamp.tsx`
- **Props**: `date` (`string` | `Date`), `className`
- **Visual**: `<time>` element with Korean relative formatting — `방금 전` / `5분 전` / `3시간 전` / `어제` / `2025.04.10`. `dateTime` and `title` attrs for accessibility + full timestamp on hover.
- **⚠ Use for news contexts only**. For price tick timestamps (ticker tape, live chart crosshair), use a different pattern — those need HH:MM:SS precision, not relative phrasing.

### 4.3 New Components (M4 creation target)

These compound components **do not exist yet**. M4 creates them in `src/components/common/` (or `src/components/stock/` when stock-specific). Their purpose is to eliminate duplicated inline styling in stock features (see §Migration notes).

#### 4.3.1 PriceCell

A table-cell-sized price displayer. Wraps `PriceChangeText` with table-specific formatting.

- **Path** (planned): `src/components/common/price-cell.tsx`
- **Props**: `value`, `changePercent?`, `currency` (`KRW` / `USD`), `align?` (`right` — default), `density?` (inherited from `data-density`)
- **Classes**: `font-mono tabular-nums text-right text-sm`; number color via `text-stock-up/down/flat`; optional 1px flash animation on value change via `.price-tick-up` / `.price-tick-down` keyframes (M4).
- **Replaces**: inline `<td>` content in watchlist, compare, screener, peer-stocks, market, dividends tables.

#### 4.3.2 TickerBadge

A compact badge for market/exchange tags: `KOSPI`, `KOSDAQ`, `NYSE`, `NASDAQ`, `NXT`, `ETF`.

- **Path** (planned): `src/components/common/ticker-badge.tsx`
- **Props**: `market` (`KR` / `US` / `NXT` / `ETF`), `size?` (`xs` / `sm`), `children?` (override label)
- **Color binding** per market:
  | Market | Color variable |
  |--------|----------------|
  | KR (KOSPI/KOSDAQ) | `--color-stock-up` (red — Korean primary market accent) |
  | US (NYSE/NASDAQ) | `--color-stock-down` (blue — US market accent, distinct from KR) |
  | NXT (night trading) | `--warning` (amber — "caution, non-standard hours") |
  | ETF | `--accent` (gold) |
- **Classes**: `h-5 px-2 rounded-4xl text-xs font-medium`, background uses the matching `-bg` token variant at 15% opacity.
- **Visual**: Pill badge like §4.1.2 but with hue bound to market semantics.

#### 4.3.3 StockTableRow

A single row of a stock list table. Composes `TickerBadge` + stock name + `PriceCell`(s).

- **Path** (planned): `src/components/common/stock-table-row.tsx`
- **Props**: `stock` (stock record with ticker, name, market, price, change, changePercent), `columns` (array of which columns to render), `onClick?`
- **Classes**: `hover:bg-muted/50 cursor-pointer transition-colors`; row height = `var(--density-row-height)`
- **Replaces**: ad-hoc `<TableRow>` implementations in `watchlist-content.tsx`, `peer-stocks.tsx`, `screener-results.tsx`, `market-content.tsx`.

#### 4.3.4 ChartTooltip

The tooltip that appears when hovering on `lightweight-charts` crosshair — NOT the §4.1.6 UI tooltip.

- **Path** (planned): `src/components/common/chart-tooltip.tsx`
- **Props**: `title` (usually date or timestamp), `entries` (array of `{ label, value, color, direction? }`)
- **Core classes**: `bg-floating border border-default rounded-lg shadow-elevated px-3 py-2 text-xs font-mono tabular-nums animate-in fade-in zoom-in-95 duration-150 pointer-events-none`
- **⚠ Solid only** — uses `--bg-floating`, NOT glass (§6.3 rule).
- **Replaces**: inline tooltip DOM in `stock-chart.tsx`, `compare-chart.tsx`, `institutional-flow.tsx`.

#### 4.3.5 IndexWidgetCard

A KPI card for the KR/US market index widgets on `/market` and the homepage.

- **Path** (planned): `src/components/common/index-widget-card.tsx`
- **Props**: `index` (`KOSPI` / `KOSDAQ` / `SP500` / `NASDAQ` / `USDKRW`), `value`, `change`, `changePercent`, `sparkline?` (optional mini chart data)
- **Structure**: L2 `bg-card` container with `--shadow-subtle`, 3px left border using `var(--index-kospi)` (or matching per-index token from §2.8), `.card-section-title` label, `.price-large` value, `.change-pill[data-trend]` delta, optional mini sparkline in lightweight-charts with `--chart-up/down`.
- **Classes**: `rounded-xl border-l-[3px] p-4 bg-card shadow-subtle`
- **Replaces**: inline card markup in `src/components/market/index-widget.tsx` and homepage market strip.

### 4.4 Migration Notes (per-file)

These are **active M4 targets**, listed so the M4 PR doesn't need to re-inventory.

| File | Current state | M4 action |
|------|---------------|-----------|
| `src/components/stock/compare-chart.tsx` | Hardcoded series colors `["#3b82f6", "#ef4444", "#10b981", "#f59e0b"]` | Replace with `[--chart-series-1, --chart-series-2, --chart-series-3, --chart-series-4]` (§2.7.2) |
| `src/components/stock/stock-chart.tsx` | Chart theme object with hardcoded hex | Bind candle colors to `--color-chart-candle-up/down`, indicator colors to `--chart-series-*` |
| `src/components/stock/institutional-flow.tsx` | Already uses `var(--color-stock-up/down)` ✅ | Keep; no change needed |
| `src/lib/glossary.ts` | `SIGNAL_COLORS` uses Tailwind utilities (`text-emerald-600`, `text-amber-600`, `text-muted-foreground`) — §7.1 violation but not hex | Replace with `var(--success)` / `var(--warning)` / `var(--text-muted)` |
| `src/components/auth/{login,register}-form.tsx` | Auth-specific hex literals | Audit; most likely replaceable with tokens |
| `src/app/stock/[ticker]/opengraph-image.tsx` + `src/app/etf/[ticker]/opengraph-image.tsx` | Runtime OG image generation uses literal hex | **Exempt** — OG images are generated server-side via `@vercel/og` which cannot resolve CSS vars. Keep literal hex but source the values from a shared constant file that imports from the oklch token system at build time. |

### 4.5 Card Variant Library

In addition to the shadcn `Card` (§4.1.3), three **semantic card wrappers** provide pre-composed recipes. They are not separate primitives — they are documented class compositions on top of `Card`.

| Name | Recipe | Use |
|------|--------|-----|
| **Default card** | `<Card>` | 95% of cases: news cards, key stats panels, section wrappers |
| **Interactive card** | `<Card className="hover:bg-elevated hover:shadow-medium hover:-translate-y-px transition cursor-pointer">` | Clickable items: Hot Stocks row, search results, related stocks |
| **Stat card** | `<Card className="border-l-[3px] border-[var(--index-kospi)] py-3 px-4">` | KPI widgets with colored left bar indicating direction/category |
| **Chart card** | `<Card className="p-0 overflow-hidden">` | Chart containers — padding 0 so chart fills edge-to-edge, `overflow-hidden` so chart respects border-radius |
| **Gradient-border card** | Uses `--border-gradient-start/end` with mask technique | Reserved for highlight contexts: Hot Stocks Top 3, watchlist items with alerts. Sparingly. |
| **Glass card** | `bg-glass-bg backdrop-blur` | **Header + mobile bottom tab only** (§6.3). Not available elsewhere. |

Codeable example of Stat card:

```tsx
<Card className="border-l-[3px] p-4" style={{ borderLeftColor: "var(--index-kospi)" }}>
  <div className="card-section-title">KOSPI</div>
  <div className="price-large mt-1">2,681.32</div>
  <PriceChangeText changePercent={0.42} format="both" className="change-pill mt-1" data-trend="up" />
</Card>
```

---

---

## 5. Layout Principles

### 5.1 Base Grid — 4px

All spacing values are multiples of 4px. This aligns natively with Tailwind 4's default spacing (`1` = 0.25rem = 4px, `2` = 8px, `3` = 12px, …), so most existing utilities already comply.

- **Why 4px and not 8px**: Stock apps are dense. 8px grids are too coarse for table row padding and inline badge spacing. Robinhood, Bloomberg Terminal, and TradingView all use a 4px base.
- **Allowed spacing values**: 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96 (px). Never invent values between these — use the nearest.
- **2px exception**: allowed for 1px-wide insets and price-tick animation padding, where 4px would visually kick the content.

### 5.2 Containers & Page Widths

| Breakpoint (§8) | Container max-width | Horizontal padding |
|-----------------|---------------------|--------------------|
| `<sm` (< 640px) | 100% | 16px |
| `sm` (≥ 640px) | 100% | 20px |
| `md` (≥ 768px) | 100% | 24px |
| `lg` (≥ 1024px) | `max-w-7xl` (1280px) | 32px |
| `xl` (≥ 1280px) | `max-w-7xl` | 32px |
| `2xl` (≥ 1536px) | `max-w-7xl` | 32px (no further expansion) |

**Rationale**: Stock content doesn't benefit from >1280px widths — charts become too wide to read X-axis labels, and tables force horizontal eye movement. Marketing-heavy pages (hero, landing) may use wider containers as an explicit exception.

### 5.3 Density System — the single biggest UX lever

A single `data-density` attribute on `<body>` flips 5 CSS variables that control **spacing only** (never colors, never typography weights, never component structure). This lets `/stock/[ticker]` (pro) feel tight like a terminal while `/mypage` (casual) feels generous — from the same components.

#### 5.3.1 The 5 variables

| Variable | casual | standard (default) | pro |
|----------|--------|-------------------|-----|
| `--density-text-base` | 15px | 14px | 13px |
| `--density-row-height` | 52px | 44px | 36px |
| `--density-card-padding` | 20px | 16px | 12px |
| `--density-gap` | 16px | 12px | 8px |
| `--density-icon` | 20px | 18px | 16px |

All five are declared at `:root[data-density="..."]` blocks in `globals.css` (M4).

#### 5.3.2 How to apply density in components

Components reference `var(--density-*)` in their class (via Tailwind arbitrary values) or inline style. The component itself knows nothing about "pro mode":

```tsx
// table row
<tr style={{ height: "var(--density-row-height)" }}>

// card content
<div className="p-[var(--density-card-padding)]">

// icon
<IconComponent width="var(--density-icon)" height="var(--density-icon)" />
```

**⚠ Do not fork components per density.** There is no `<Button density="pro" />`. Density is a side-channel that *cards and tables read from CSS*, not a prop.

#### 5.3.3 Route → density mapping

> **⏳ M4**: the mapper itself does not exist yet. It will be added to `src/app/layout.tsx` during M4. Until then, the whole site renders with whatever `globals.css` `:root` defaults define (effectively `standard`).

The mapper lives in `src/app/layout.tsx`. It matches `pathname` against the three lists below and sets `<body data-density="..." />`. Missing routes **fall back to `standard`**.

| Density | Routes | Why |
|---------|--------|-----|
| **casual** | `/`, `/mypage`, `/settings`, `/guide`, `/about`, `/contact`, `/privacy`, `/terms`, `/auth/*` | Landing, personal, marketing, and auth flows. Generous spacing, larger default body text. Beginner-friendly. |
| **standard** (fallback) | `/market`, `/watchlist`, `/news`, `/sectors`, `/dividends`, `/reports`, any unmapped route | The default reading experience. Balanced density for medium-length dashboards. |
| **pro** | `/stock/[ticker]`, `/compare`, `/screener`, `/etf/[ticker]`, `/board`, `/admin` | Active-use trading screens. Tight rows, smaller base text, more content per viewport. |

#### 5.3.4 Transition handling

When a user navigates casual → pro, spacing changes abruptly (~100ms flicker). To avoid layout jank:

- Set `:root { transition: none; }` — density changes are NOT animated.
- Add a brief `content-visibility: auto` hint on the main content area so the browser can skip repainting off-screen content during the density swap.
- Never depend on density values inside animation keyframes (§6 transitions use fixed `--duration-*` tokens, not density vars).

### 5.4 Page Layout Skeleton

Every route renders into this skeleton (defined in `src/app/layout.tsx`):

```
┌──────────────────────────────────────────────┐
│  AppHeader (sticky, glass §6.3)              │  56px desktop / 48px mobile
├──────────────────────────────────────────────┤
│                                              │
│  <main className="container">                │
│    {children}                                │
│  </main>                                     │
│                                              │
├──────────────────────────────────────────────┤
│  Footer (desktop only)                       │  auto height
└──────────────────────────────────────────────┘
   [BottomTabBar (mobile only, glass §6.3)]      56px
```

- **AppHeader**: sticky, z-50, `var(--glass-bg)`. Contains logo, primary nav (4 categories), search, theme toggle, user avatar. Mobile: hamburger `<Sheet side="right">`.
- **BottomTabBar**: fixed bottom, z-50, glass. 5 tabs (Home / Search / Market / Watchlist / MyPage). Hidden on `lg:` and up.
- **Main content padding-bottom**: `pb-14 lg:pb-0` — reserves space for the mobile tab bar.
- **Sidebar (desktop ≥ lg, pages that opt in)**: 240–280px fixed width, sticky position, on `--bg-surface`. Not part of root layout — added per-route via `<div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">`.

### 5.5 KPI Strip

Multi-card horizontal strip used for dashboards. Typical widths: 4 or 6 cards.

- **Grid**: `grid grid-cols-2 md:grid-cols-4 gap-3` (4 cards) or `gap-2` (6 cards).
- **Card**: stat card recipe (§4.5) with L2 `bg-card` + colored left border.
- **On mobile (< md)**: 2 columns; if 6+ cards, convert to horizontal scroll-snap: `flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 -mx-4`.
- **Applied on**: `/` (homepage Index widgets), `/market` (breadth + volume + top movers), `/stock/[ticker]` sticky price header (after scroll).

### 5.6 Content Grid (cards + sidebar)

For content-heavy pages (`/sectors`, `/news`, `/reports`):

```
grid-cols-1                           (<md: single column)
md:grid-cols-2                        (md: 2 cards per row)
lg:grid-cols-[1fr_260px]              (lg: main + sidebar)
xl:grid-cols-[240px_1fr_280px]        (xl: left nav + main + sidebar)
gap-6
```

Cards inside the main area can themselves grid (`grid-cols-1 lg:grid-cols-2 gap-4`) — nest freely.

### 5.7 Stock Detail Layout (pro density)

`/stock/[ticker]` gets a dedicated layout pattern because it's the most content-dense page on the site:

```
┌─────────────────────────────────────────────────┐
│  Sticky header: ticker + price + change + tabs  │  (replaces page scroll header)
├────────────────────────────────┬────────────────┤
│                                │                │
│  Main chart (L2 card, p-0)     │  Key Stats     │
│  ~60% × 480–640px              │  (L2 card)     │
│                                │                │
├────────────────────────────────┤                │
│  Tabs content (Overview /      │  Peer Stocks   │
│  Chart / Financials / News)    │  (L2 card)     │
│                                │                │
└────────────────────────────────┴────────────────┘
```

- **Grid**: `grid-cols-1 xl:grid-cols-[1fr_320px] gap-4`
- **Density**: `data-density="pro"` — tables and cards tighten.
- **Sticky behavior**: the ticker/price header sticks to viewport top once the main chart scrolls out. `sticky top-0 z-30 bg-background/95 backdrop-blur`.

---

---

## 6. Depth & Elevation

Depth is built from two layered systems: **surface lightness** (§2.1) handles the coarse separation between regions, and **shadows** (§6.2) handle the fine-grained separation between a card and its hover state, or between a tooltip and its anchor.

### 6.1 Surface Levels

See §2.1 for exact values. Recap of what each level is for:

| Level | Use |
|-------|-----|
| **L0 Base** | Page background, app shell |
| **L1 Surface** | Sidebars, ticker tape, section backgrounds |
| **L2 Card** | Default card container (95% of cards) |
| **L3 Elevated** | Hover state for interactive cards, modal underlays |
| **L4 Floating** | Tooltips, toasts, dropdown menus, floating panels |

In **dark mode**, each level is a discrete lightness increment and is the primary separation cue. Borders on L0→L1 are optional.

In **light mode**, L2/L3/L4 all resolve to pure white and rely on the shadow scale for separation.

### 6.2 Shadow Scale — 4 tiers + inner glow

| Variable | Dark | Light | Use |
|----------|------|-------|-----|
| `--shadow-subtle` | `0 1px 2px oklch(0 0 0 / 20%)` | `0 1px 2px oklch(0 0 0 / 5%)` | Default card |
| `--shadow-medium` | `0 2px 8px oklch(0 0 0 / 30%), 0 0 1px oklch(1 0 0 / 5%)` | `0 2px 8px oklch(0 0 0 / 8%), 0 1px 2px oklch(0 0 0 / 4%)` | Hover state, elevated card |
| `--shadow-elevated` | `0 4px 16px oklch(0 0 0 / 40%), 0 0 1px oklch(1 0 0 / 8%)` | `0 4px 16px oklch(0 0 0 / 10%), 0 2px 4px oklch(0 0 0 / 5%)` | Modals, dialogs, large popovers |
| `--shadow-floating` | `0 8px 32px oklch(0 0 0 / 50%), 0 0 1px oklch(1 0 0 / 10%)` | `0 8px 32px oklch(0 0 0 / 12%), 0 4px 8px oklch(0 0 0 / 6%)` | Tooltips, toasts, drag-in-flight |
| `--shadow-inner-glow` | `inset 0 1px 0 oklch(1 0 0 / 5%)` | `none` | Adds a 1px highlight on top edge of dark cards — disabled in light |

Dark shadows include a 1px inner outline (`0 0 1px oklch(1 0 0 / 5-10%)`) which reads as a faint "edge light" and makes elevated surfaces legible against the near-black base. Light shadows are pure drop shadows.

### 6.3 Glassmorphism — reserved

**Only two elements use `backdrop-filter`**: the desktop header and the mobile bottom tab bar. Every other surface is solid.

| Variable | Dark | Light |
|----------|------|-------|
| `--glass-bg` | `oklch(0.17 0.005 260 / 60%)` | `oklch(1 0 0 / 70%)` |
| `--glass-border` | `oklch(1 0 0 / 8%)` | `oklch(0 0 0 / 8%)` |
| `--glass-blur` | `16px` | `12px` |

```css
/* Applied to <header> and <nav.bottom-tab> only */
.header-glass, .bottom-tab-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}
```

Expansion is possible later but must be approved — every additional glass surface costs GPU and readability.

---

## 7. Do's and Don'ts

These are **guardrails**, not style preferences. An AI agent or engineer violating any of these is producing incorrect work, not a stylistic variation. Code review should reject PRs that break them.

### 7.1 Color & Tokens

✅ **DO** use the §2 token system for every color decision. If a color isn't in §2, add it to §2 first, then use it.
✅ **DO** pair `--color-stock-up/down` with their matching `-bg` tokens when tinting a cell background. Never use one without the other.
✅ **DO** use live `var(--...)` aliases (§2.7.1, §2.8) — changing the source token should propagate everywhere for free.

❌ **DON'T** hardcode hex, rgb, hsl, or raw color names in component code. `#e53e3e`, `rgb(239,68,68)`, `red` are all violations.
❌ **DON'T** use Tailwind's built-in color utilities (`text-red-500`, `bg-blue-600`) for StockView-semantic colors. Use `text-stock-up` / `bg-stock-down-bg` style tokens.
❌ **DON'T** invert stock colors for US markets ("green up"). Korean convention is **sitewide** — §2.6, §10.3.

### 7.2 Charts

✅ **DO** walk the §10.2 chart palette decision tree before picking colors. Single series → Tier 1 semantic; multi-series → Tier 2 categorical; divergent/magnitude → Tier 3 heatmap.
✅ **DO** bind `lightweight-charts` theme colors to `--color-chart-candle-up/down` and `--chart-series-*`, not to literal hex.

❌ **DON'T** use `--chart-series-*` for directional charts. A single stock's price line must be `--chart-up/down/neutral` based on its net change, not a fixed category color.
❌ **DON'T** use Tier 2 categorical tokens for up/down semantics. Categorical is for "which of 8 series am I" — not "is this rising".
❌ **DON'T** exceed 8 series in a multi-series chart. If you need 9+ series, group into "Other" or use multiple charts.

### 7.3 Glass & Depth

✅ **DO** use `--bg-floating` + `--shadow-floating` for tooltips, menus, and toasts.
✅ **DO** use the 5-level background stack for regional separation. Borders are optional on dark mode.

❌ **DON'T** apply `backdrop-filter: blur(...)` to any element other than the desktop header and mobile bottom tab bar (§6.3). Chart tooltips are solid. Cards are solid. Modal backdrops are solid scrims.
❌ **DON'T** stack glass on glass. The mobile bottom tab is already glass — content beneath it should scroll, not add a second blur.

### 7.4 Typography

✅ **DO** use `var(--font-mono)` + `font-variant-numeric: tabular-nums` for every numeric display. Price, volume, percent, timestamp, ticker symbol.
✅ **DO** use the `.price-large` / `.price-medium` / `.price-small` utilities (§3.6) for price sizing. Picking one is a semantic decision.
✅ **DO** use `.change-pill[data-trend=...]` for delta displays. Never roll your own.

❌ **DON'T** render a number in Pretendard (sans). Specifically: do NOT use `font-sans` or the default body font on anything that represents a quantity.
❌ **DON'T** use Korean-only sans fallbacks for English numeric labels. The full font chain in `--font-mono` covers both.

### 7.5 Density

✅ **DO** read density via `var(--density-*)` in component styles. Components are single-spec; density is the orthogonal axis.
✅ **DO** rely on the `src/app/layout.tsx` route mapper to set `data-density`. Individual components should not override it.

❌ **DON'T** create `<Button density="pro" />` or any density-as-prop pattern. Density is a body-level attribute, period.
❌ **DON'T** animate density transitions. Density changes are instantaneous on route change.

### 7.6 Accessibility

✅ **DO** use `:focus-visible` for keyboard focus rings. Mouse users should never see a ring.
✅ **DO** respect `prefers-reduced-motion: reduce` — ticker tape stops scrolling, animations drop to `0.01ms`.
✅ **DO** ensure every color combination meets WCAG AA (4.5:1 for body text, 3:1 for large text). §10.5 has the verified pairs; new pairs must be checked.

❌ **DON'T** use color alone to convey state. Stock direction also uses `▲`/`▼` arrows (§4.2.1). Success/warning badges also use icons.
❌ **DON'T** skip focus rings on custom interactive components. If you build a clickable card, it needs a visible focus ring.

### 7.7 Component Discipline

✅ **DO** use CVA for every variant that has more than 2 possible values. Inline ternary classes are a smell.
✅ **DO** prefer composition over proliferation. `PriceCell` + `TickerBadge` compose into `StockTableRow` — don't create `StockTableRowWithAlert` as a fork.

❌ **DON'T** duplicate the shadcn primitives. If `Card` is missing a feature, extend via className or a wrapper, don't fork `Card` into `StockCard`.
❌ **DON'T** use arbitrary Tailwind values (`w-[327px]`) for repeated patterns. Add a token.

### 7.8 Documentation discipline

✅ **DO** update this document whenever you add a token, a component variant, or a migration action. The code and the doc live together.
✅ **DO** link back to §-numbers in commit messages when touching UI (`DESIGN §2.6` is a valid, searchable reference).

❌ **DON'T** resolve a disagreement with "it looks better this way" without writing the decision here. If a rule above is wrong for your case, change the rule (and document why), don't silently break it.

---

## 8. Responsive Behavior

### 8.1 Breakpoints

Tailwind 4 defaults + 2 observational checkpoints. StockView uses **6 named breakpoints** for layout logic; the 375/425 checkpoints exist for visual spot-checking (iPhone SE / iPhone 14 Pro Max) but are not hooked into utility classes.

| Name | Min width | Tailwind prefix | Primary use |
|------|-----------|-----------------|-------------|
| (none) | 0 | — | Mobile portrait baseline |
| (check) | 375px | — | iPhone SE spot-check |
| (check) | 425px | — | iPhone 14 Pro Max spot-check |
| `sm` | 640px | `sm:` | Small tablet, large phone landscape |
| `md` | 768px | `md:` | iPad portrait, hide hamburger at this point for some layouts |
| `lg` | 1024px | `lg:` | **Desktop cutoff**: BottomTabBar hidden, sidebar visible, Footer rendered |
| `xl` | 1280px | `xl:` | Max container width (`max-w-7xl`) |
| `2xl` | 1536px | `2xl:` | No further layout changes; optional 3-column patterns |

**Mental model**: `< lg` is mobile-first rendering (BottomTabBar, stacked grids); `≥ lg` is desktop (Sidebar, multi-column grids, Footer). The `sm` and `md` prefixes fine-tune the mobile-first branch.

### 8.2 Touch Targets

All interactive elements on `< lg` must meet **44×44 px minimum** (WCAG 2.5.5).

- **Buttons**: `size="default"` in the current implementation is `h-8 px-2.5` (32 px tall) — **below** the 44-px minimum. For touch-first controls on `< lg`, use `size="lg"` (h-9 + padding brings effective target to ~44) or wrap in a `min-h-[44px]` container. Do NOT use `size="xs"` or `size="sm"` on mobile.
- **Icon buttons**: Use `size="icon"` or larger on `< lg`. `size="icon-xs"` (20px) is desktop-only.
- **Table rows**: at `data-density="pro"`, row height is 36px — below the 44px minimum. Pro routes are acceptable **only on desktop** where the primary input is mouse. On `< lg`, density falls back to `standard` automatically.

**Automatic density fallback on mobile**: the `layout.tsx` mapper, in addition to route matching, bumps `pro` routes to `standard` when `window.matchMedia('(max-width: 1023px)').matches`. This is a safety net — prefer to design pro-density screens for desktop primarily and treat mobile as a secondary concern for those routes (`/stock/[ticker]` is the exception; its mobile variant uses custom patterns, see §5.7).

### 8.3 Layout Adaptations

| Region | `< lg` behavior | `≥ lg` behavior |
|--------|-----------------|-----------------|
| AppHeader | Hamburger + logo + theme toggle. Nav items hidden. | Full horizontal nav, sub-nav row, search bar, avatar. |
| BottomTabBar | Visible (fixed bottom, 56px, glass) | `hidden` |
| Sidebar (pages that opt in) | Not rendered; content uses full width | Fixed 240–280px, sticky |
| KPI strip | `grid-cols-2` (4 cards) or horizontal scroll-snap (6+) | `grid-cols-4` or `grid-cols-6` |
| Stock detail layout | Single column; chart full-width; sidebar content stacks after | `grid-cols-[1fr_320px]` |
| Table horizontal scroll | On with gradient fade mask on right edge | Rarely needed |
| Modal max-width | `max-w-[calc(100%-2rem)]` | `max-w-sm` or `max-w-lg` depending on content |

### 8.4 Mobile-Specific Patterns

#### BottomTabBar (§5.4 skeleton)

- 5 tabs: **Home** / **Search** / **Market** / **Watchlist** / **MyPage**
- Fixed bottom-0, z-50, 56px height
- Background: `var(--glass-bg)`, `backdrop-filter: blur(16px)`
- Active tab: icon + label in `--primary`
- Inactive: `--text-muted`
- Search tab opens a full-screen `SearchCommand` overlay (no navigation)

#### Mobile AppHeader

- Left: hamburger icon → opens `<Sheet side="right" className="w-72">` with full nav + search
- Center: logo
- Right: theme toggle (Sun/Moon)
- Height: 48px
- Background: glass

#### Swipe gestures

Currently not used. If added later (e.g. swipe between `/market` tabs on mobile), use `prefers-reduced-motion` guards.

### 8.5 Typography Scaling Across Breakpoints

Font sizes do NOT scale by breakpoint — they scale by **density** (§5.3). A phone on the homepage (casual) uses `--density-text-base: 15px`; a phone on `/stock/[ticker]` uses `standard` (14px, because pro → standard on mobile per §8.2).

This is the opposite of the traditional "mobile smaller / desktop bigger" approach. It's intentional: on a stock screen, a **thumb-typing phone user needs larger text** than a keyboard-driven desktop trader because the phone has less screen and less precision. Density captures this better than breakpoints.

### 8.6 Chart Responsiveness

- **`lightweight-charts` resize**: handled via `ResizeObserver` on the container — charts must rerender on window resize without explicit breakpoint code.
- **Mobile X-axis**: compress tick labels (`timeScale.tickMarkFormatter` returns short date). On very small screens, hide every other label.
- **Mobile indicator panels**: panels stack vertically below the main chart at any width. On `< md`, reduce indicator panel height from 120px → 80px.

### 8.7 Print Styles

No custom print stylesheet. If users print a page, the dark mode still renders. This is deliberate — stock data is meant to be live, not printed.

---

## 9. Agent Prompt Guide

This section exists so that an AI coding agent (Claude, Cursor, etc.) can produce correct UI from a short English or Korean prompt, using nothing but this document.

### 9.1 Quick Color Reference (grep-friendly cheatsheet)

```
Page bg               →  var(--bg-base)
Section container     →  var(--bg-surface)
Card                  →  var(--bg-card)
Hover / elevated      →  var(--bg-elevated)
Tooltip / floating    →  var(--bg-floating)

Text primary          →  var(--text-primary)        (headlines, prices)
Text secondary        →  var(--text-secondary)      (descriptions, labels)
Text tertiary         →  var(--text-tertiary)       (captions, timestamps)
Text muted            →  var(--text-muted)          (placeholders)

Primary (teal)        →  var(--primary)
Accent (gold)         →  var(--accent)

Stock up (red)        →  var(--color-stock-up)      + var(--color-stock-up-bg)
Stock down (blue)     →  var(--color-stock-down)    + var(--color-stock-down-bg)
Stock flat (gray)     →  var(--color-stock-flat)    + var(--color-stock-flat-bg)

Chart single-series   →  var(--chart-up) / --chart-down / --chart-neutral / --chart-accent / --chart-info
Chart multi-series    →  var(--chart-series-1..8)
Chart heatmap         →  var(--heatmap-1..9)

Border subtle         →  var(--border-subtle)
Border default        →  var(--border-default)
Border strong         →  var(--border-strong)
Focus ring            →  var(--border-focus)

Shadow subtle         →  var(--shadow-subtle)       (default card)
Shadow medium         →  var(--shadow-medium)       (hover, elevated card)
Shadow elevated       →  var(--shadow-elevated)     (modal, large popover)
Shadow floating       →  var(--shadow-floating)     (tooltip, toast)

Font body             →  var(--font-sans)           (Pretendard)
Font numbers          →  var(--font-mono)           (JetBrains Mono) + tabular-nums

Density text base     →  var(--density-text-base)   (15/14/13 per casual/standard/pro)
Density row height    →  var(--density-row-height)  (52/44/36)
Density card padding  →  var(--density-card-padding) (20/16/12)
Density gap           →  var(--density-gap)         (16/12/8)
Density icon          →  var(--density-icon)        (20/18/16)
```

### 9.2 Component Cheatsheet

```
Price text            →  <PriceChangeText value={...} changePercent={...} format="both" currency="KRW" />
Price in a table cell →  <PriceCell value={...} changePercent={...} currency="USD" />     (M4)
Ticker pill           →  <TickerBadge market="KR" />                                      (M4)
Market index card     →  <IndexWidgetCard index="KOSPI" value={...} change={...} />       (M4)
Empty state           →  <EmptyState icon={Bookmark} title="관심종목 없음" description="..." />
News timestamp        →  <NewsTimestamp date={publishedAt} />
Icon tooltip          →  <TooltipHelper term="PER" description="..." value={per} />
Chart tooltip         →  <ChartTooltip title="2026-04-12" entries={[...]} />              (M4)
```

### 9.3 Layout Cheatsheet

```
Page wrapper          →  <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
KPI strip (4 cards)   →  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
Content + sidebar     →  <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-6">
Stock detail 2-col    →  <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
Sticky header         →  <div className="sticky top-0 z-30 bg-background/95 backdrop-blur">
```

### 9.4 Example Prompts (copy-paste ready)

Use these as templates. The prompts assume the agent is reading this `DESIGN.md`.

#### 9.4.1 "Create a KOSPI index widget"

> Create a card showing the KOSPI index for `/market` homepage strip.
> - Card recipe: stat card from §4.5 (L2 `bg-card`, 3px left border, `--shadow-subtle`, `--density-card-padding`)
> - Left border color: `var(--index-kospi)`
> - Label: `.card-section-title` reading "KOSPI"
> - Price value: `.price-large`, use `PriceChangeText` value only (no delta)
> - Delta: `<PriceChangeText changePercent={...} format="percent" />` with `.change-pill[data-trend]`
> - Optional: mini sparkline below using `lightweight-charts` with `--chart-up/down` based on net direction
> - All numbers in `var(--font-mono)` with `tabular-nums`

#### 9.4.2 "Build a 4-stock compare chart"

> Create a compare chart for `/compare` showing 4 stocks over 6 months.
> - Chart palette: Tier 2 Categorical (§2.7.2). Series 1–4 = `--chart-series-1..4` (Teal, Orange, Purple, Gold)
> - Area fill: each series at 15% opacity, gradient to transparent at bottom
> - Zero line / reference line: `--chart-neutral`
> - Tooltip on crosshair: `<ChartTooltip title={date} entries={[{label, value, color}]} />` — solid background `--bg-floating`, NO glass (§6.3)
> - Legend: 4 `.change-pill`-style badges showing series name + net change
> - Respect `prefers-reduced-motion` for zoom/pan

#### 9.4.3 "Watchlist table row"

> Add a row to the watchlist table for a single stock.
> - Use `<StockTableRow stock={...} columns={["ticker", "name", "market", "price", "change", "changePercent"]} />` (M4)
> - Row height: `var(--density-row-height)` — `/watchlist` is mapped to `standard` density (§5.3.3), so this resolves to 44 px. Still token-driven so the value will flip automatically if the route is reclassified.
> - Cells with numbers use `<PriceCell />` (M4)
> - Market column uses `<TickerBadge market={stock.market} />` (M4)
> - Row hover: `hover:bg-muted/50` (from `Table` primitive)
> - Click: navigate to `/stock/${ticker}` — use `<Link>` wrapping row content, keep focus ring visible via `focus-visible:ring-2 ring-ring/50`

#### 9.4.4 "Empty state for 'no search results'"

> When `/screener` returns 0 results, show an empty state.
> - Use `<EmptyState icon={Search} title="검색 결과 없음" description="필터를 조정해보세요." action={{ label: "필터 초기화", onClick: resetFilters }} />`
> - Centered in the content area, `py-16`
> - Icon in `rounded-full bg-muted p-4`

#### 9.4.5 "Add a destructive action button"

> Add a "Delete watchlist" button inside `/mypage` watchlist settings.
> - `<Button variant="destructive" size="default">관심종목 삭제</Button>`
> - Opens a `<Dialog>` confirmation (§4.1.8) with `showCloseButton`
> - Inside dialog: title, description in `text-secondary`, two buttons (destructive primary + ghost cancel)
> - Do NOT use `--color-stock-up` red — that's market direction. Use `--danger` which is §2.4 semantic red for destructive UI state.

### 9.5 Common Mistakes To Avoid

Told to an agent, these prompts should NOT happen:

- ❌ "Use `text-red-500` for the up arrow" → use `text-stock-up` (§7.1)
- ❌ "Add glass blur to the card" → glass is header + bottom tab only (§6.3, §7.3)
- ❌ "Wrap the price in `font-semibold text-lg`" → use `.price-large/medium/small` utility (§3.6)
- ❌ "Invert colors for US market" → Korean convention is sitewide (§10.3, §7.1)
- ❌ "Add a `pro` variant to Button" → density is body-level attribute (§5.3.2, §7.5)
- ❌ "Create a separate `StockCard` component" → use `Card` + recipe composition (§4.5, §7.7)

---

## 10. Market Data Patterns (StockView extension)

This section is unique to StockView and codifies the intersection of domain rules (stock markets, Korean convention, multi-market display) with the design system above.

### 10.1 Stock Direction Rule

| State | Color variable | Background tint | When |
|-------|----------------|-----------------|------|
| **Rising** | `--color-stock-up` (red, hue 25) | `--color-stock-up-bg` | Price change > 0, positive percent change, positive EPS delta |
| **Falling** | `--color-stock-down` (blue, hue 250) | `--color-stock-down-bg` | Price change < 0, negative percent change, negative EPS delta |
| **Unchanged** | `--color-stock-flat` (gray) | `--color-stock-flat-bg` | Exactly 0.00 change — rare, render explicitly as "—" or "0.00" |

**Applies to**: all price displays, all percent changes, candlestick bodies and wicks, volume bars (optional intensity link), ticker tape dots, index widgets, watchlist rows, compare chart series that represent a single stock, sector treemap cells (via §2.7 Tier 3 heatmap).

**Does not apply to**: UI state (use §2.4 semantic), brand/highlight (use §2.3 primary/accent), error messages (use `--danger`).

### 10.2 Chart Palette Decision Tree

When choosing colors for a new chart, walk this tree:

```
Is the chart showing a single stock/index over time?
├── YES → Use Tier 1 Semantic (§2.7.1)
│         - Line color = `--chart-accent` OR `--chart-up/down` based on net direction
│         - Fill = same at 10% opacity
│         - Zero line = `--chart-neutral`
│         - Annotations = `--chart-info`
└── NO — multi-series?
    ├── YES, ordered or ranked? → Use Tier 3 Heatmap (§2.7.3)
    │         - Example: sector treemap by performance
    └── YES, categorical (no intrinsic order)? → Use Tier 2 Categorical (§2.7.2)
              - Example: /compare with 4 stocks, portfolio allocation pie
              - Start from `--chart-series-1` and walk forward
              - Max 8 series; if more, group + use "Other"
```

### 10.3 KR / US Market Differences

| Aspect | KR | US |
|--------|----|----|
| **Price color convention** | Red up / Blue down (§2.6) | **Same** — we do NOT invert for US stocks. Korean users are primary audience. |
| **Decimal precision** | Whole KRW for prices ≥ 1,000; 1 decimal for < 1,000 | 2 decimals standard for USD prices |
| **Thousands separator** | Comma | Comma |
| **Currency symbol** | `₩` prefix or `KRW` suffix (choose per context) | `$` prefix |
| **Market hours badge** | KST (Asia/Seoul) | Display both EST/EDT and KST equivalent |
| **NXT night trading** | Filter by default; show with `<TickerBadge variant="nxt">` | N/A |
| **Exchange rate** | Live USD/KRW fetched from Yahoo (see `src/lib/data-sources/yahoo.ts`); never hardcode | — |
| **Index widget** | KOSPI (`--index-kospi`), KOSDAQ (`--index-kosdaq`), USD/KRW (`--index-usdkrw`) | S&P 500 (`--index-sp500`), NASDAQ (`--index-nasdaq`) |

### 10.4 Tabular Numbers Enforcement

Every numeric display on the site must satisfy ALL of:

1. `font-family: var(--font-mono)` (JetBrains Mono)
2. `font-variant-numeric: tabular-nums` (redundant for monospace, but belt-and-suspenders)
3. Fixed decimal width (e.g., always 2 decimals for USD, always 0 or 1 for KRW per §10.3)
4. Right-aligned in table cells so ones, tens, hundreds columns line up

Violations of this rule are the most common readability bug in stock apps. A 3-digit price next to a 4-digit price that jitters horizontally is a UX failure.

### 10.5 Accessibility Contrast Verification

All token combinations below meet WCAG 2.1 AA or better. Spot-check when adding new color pairs.

| Combination | Ratio | Grade |
|-------------|-------|-------|
| `--text-primary` on `--bg-base` (dark) | ~16:1 | AAA |
| `--text-primary` on `--bg-card` (dark) | ~13:1 | AAA |
| `--text-secondary` on `--bg-card` (dark) | ~7:1 | AA |
| `--text-tertiary` on `--bg-card` (dark) | ~4.6:1 | AA (large text) |
| `--color-stock-up` on `--bg-card` (dark) | ~7.5:1 | AA |
| `--color-stock-down` on `--bg-card` (dark) | ~7.5:1 | AA |
| `--text-primary` on `--bg-base` (light) | ~17:1 | AAA |
| `--text-secondary` on `--bg-card` (light) | ~8:1 | AA |
| `--color-stock-up` on `--bg-card` (light) | ~5.5:1 | AA |
| `--color-stock-down` on `--bg-card` (light) | ~5.2:1 | AA |

Focus indicator contrast (`--border-focus` against adjacent surface) must exceed 3:1 per WCAG 2.4.7 — current teal primary passes.

---

## Appendix A. Migration Status

- **v0.1** (M2): tokens + typography + elevation + market data.
- **v0.2 (this file, M3)**: components, layout, density system, do/don'ts, responsive, agent prompt guide — all complete. Document is feature-complete.
- **M4 pending**: token ingestion into `src/app/globals.css`, JetBrains Mono Variable install, hex-to-token refactor (§4.4 migration notes), creation of new compound components (`PriceCell`, `TickerBadge`, `StockTableRow`, `ChartTooltip`, `IndexWidgetCard`), density route mapper in `src/app/layout.tsx`.
- **M5 pending**: Operational wiring — `AGENTS.md` update to reference this file, PR template integration, archive of `.ai/design-proposals/unified-design-system.md` + `review-2-design-completeness.md` to `docs/archive/2026-04/design-proposals/`.
- **Legacy proposals**: superseded by this file; archival happens at M5 (see plan §M5).
- **M1 snapshots** (`.ai/design-tokens-snapshot.md`, `.ai/design-decisions-snapshot.md`): still live as M4 work orders; will be moved to `.ai/archive/m1-snapshots/` during M5.

## Appendix B. References

- Plan: [`.ai/design-system-plan.md`](./design-system-plan.md)
- M1 snapshots: [`.ai/design-tokens-snapshot.md`](./design-tokens-snapshot.md), [`.ai/design-decisions-snapshot.md`](./design-decisions-snapshot.md)
- Sample DESIGN.md files: [`.ai/references/design-md/`](./references/design-md/) (kraken, binance, coinbase, stripe, revolut, sentry, supabase)
- Stitch format stub: [`.ai/references/stitch-format.md`](./references/stitch-format.md)
- VoltAgent collection: https://github.com/VoltAgent/awesome-design-md
- Stitch DESIGN.md format (upstream): https://stitch.withgoogle.com/docs/design-md/format/
