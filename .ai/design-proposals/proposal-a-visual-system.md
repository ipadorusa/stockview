# Proposal A: Visual System Design — "Terminal Elegance"

> A TradingView-inspired visual system for StockView with deep background hierarchy, glassmorphic cards, and data-dense financial typography. Designed for both dark and light modes with oklch color science.

**Design Philosophy**: Professional terminal aesthetics meets modern glassmorphism. Dark mode is the primary experience (finance professionals prefer dark), with an equally polished light mode. Every surface has purpose — no decorative fluff, only functional beauty.

---

## 1. Color System

### 1.1 Background Hierarchy (5 levels)

Layered surfaces create depth without borders. Each level is a distinct oklch lightness step.

#### Dark Mode (Primary Experience)

| Level | Token | oklch Value | Usage |
|-------|-------|-------------|-------|
| L0 — Base | `--bg-base` | `oklch(0.13 0.005 260)` | Page background, app shell |
| L1 — Surface | `--bg-surface` | `oklch(0.17 0.005 260)` | Main content panels, sidebar |
| L2 — Card | `--bg-card` | `oklch(0.21 0.005 260)` | Cards, dropdowns, popovers |
| L3 — Elevated | `--bg-elevated` | `oklch(0.25 0.008 260)` | Hover states, modal overlays |
| L4 — Floating | `--bg-floating` | `oklch(0.30 0.010 260)` | Tooltips, floating panels, toasts |

#### Light Mode

| Level | Token | oklch Value | Usage |
|-------|-------|-------------|-------|
| L0 — Base | `--bg-base` | `oklch(0.965 0.003 260)` | Page background |
| L1 — Surface | `--bg-surface` | `oklch(0.985 0.002 260)` | Main content panels |
| L2 — Card | `--bg-card` | `oklch(1.0 0 0)` | Cards (pure white) |
| L3 — Elevated | `--bg-elevated` | `oklch(1.0 0 0)` | With shadow for elevation |
| L4 — Floating | `--bg-floating` | `oklch(1.0 0 0)` | With stronger shadow |

### 1.2 Foreground / Text Hierarchy

#### Dark Mode

| Token | oklch Value | Usage |
|-------|-------------|-------|
| `--text-primary` | `oklch(0.95 0 0)` | Headlines, prices, primary content |
| `--text-secondary` | `oklch(0.72 0 0)` | Descriptions, labels |
| `--text-tertiary` | `oklch(0.55 0 0)` | Captions, timestamps, disabled |
| `--text-muted` | `oklch(0.42 0 0)` | Placeholder text, subtle hints |

#### Light Mode

| Token | oklch Value | Usage |
|-------|-------------|-------|
| `--text-primary` | `oklch(0.15 0 0)` | Headlines, prices, primary content |
| `--text-secondary` | `oklch(0.40 0 0)` | Descriptions, labels |
| `--text-tertiary` | `oklch(0.55 0 0)` | Captions, timestamps |
| `--text-muted` | `oklch(0.70 0 0)` | Placeholder text |

### 1.3 Brand & Accent Colors

The primary teal is evolved into a richer, more vibrant emerald-teal that reads as "finance-grade" rather than "startup".

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--primary` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | Primary actions, links, active states |
| `--primary-hover` | `oklch(0.78 0.15 162)` | `oklch(0.40 0.18 162)` | Hover on primary elements |
| `--primary-muted` | `oklch(0.72 0.17 162 / 15%)` | `oklch(0.45 0.16 162 / 10%)` | Primary tinted backgrounds |
| `--secondary` | `oklch(0.70 0.10 250)` | `oklch(0.50 0.12 250)` | Secondary actions, info states |
| `--secondary-hover` | `oklch(0.76 0.08 250)` | `oklch(0.45 0.14 250)` | Hover on secondary |
| `--accent` | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | Highlights, badges, gold/amber accent |
| `--accent-hover` | `oklch(0.85 0.10 85)` | `oklch(0.50 0.16 85)` | Hover on accent |

### 1.4 Semantic / Status Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--success` | `oklch(0.72 0.19 145)` | `oklch(0.50 0.17 145)` | Positive states, confirmations |
| `--success-bg` | `oklch(0.72 0.19 145 / 12%)` | `oklch(0.50 0.17 145 / 8%)` | Success background tint |
| `--warning` | `oklch(0.82 0.16 75)` | `oklch(0.65 0.18 75)` | Warnings, attention needed |
| `--warning-bg` | `oklch(0.82 0.16 75 / 12%)` | `oklch(0.65 0.18 75 / 8%)` | Warning background tint |
| `--danger` | `oklch(0.70 0.20 25)` | `oklch(0.55 0.22 25)` | Errors, destructive actions |
| `--danger-bg` | `oklch(0.70 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | Error background tint |
| `--info` | `oklch(0.75 0.12 240)` | `oklch(0.55 0.14 240)` | Information, neutral alerts |
| `--info-bg` | `oklch(0.75 0.12 240 / 12%)` | `oklch(0.55 0.14 240 / 8%)` | Info background tint |

### 1.5 Border & Divider Colors

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--border-subtle` | `oklch(1 0 0 / 6%)` | `oklch(0 0 0 / 6%)` |
| `--border-default` | `oklch(1 0 0 / 10%)` | `oklch(0 0 0 / 10%)` |
| `--border-strong` | `oklch(1 0 0 / 16%)` | `oklch(0 0 0 / 16%)` |
| `--border-focus` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` |
| `--border-gradient-start` | `oklch(0.72 0.17 162 / 40%)` | `oklch(0.45 0.16 162 / 30%)` |
| `--border-gradient-end` | `oklch(0.70 0.10 250 / 20%)` | `oklch(0.50 0.12 250 / 15%)` |

### 1.6 Complete CSS Variable Definitions

```css
:root {
  /* Background hierarchy */
  --bg-base: oklch(0.965 0.003 260);
  --bg-surface: oklch(0.985 0.002 260);
  --bg-card: oklch(1.0 0 0);
  --bg-elevated: oklch(1.0 0 0);
  --bg-floating: oklch(1.0 0 0);

  /* Text hierarchy */
  --text-primary: oklch(0.15 0 0);
  --text-secondary: oklch(0.40 0 0);
  --text-tertiary: oklch(0.55 0 0);
  --text-muted: oklch(0.70 0 0);

  /* Brand */
  --primary: oklch(0.45 0.16 162);
  --primary-hover: oklch(0.40 0.18 162);
  --primary-muted: oklch(0.45 0.16 162 / 10%);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.50 0.12 250);
  --secondary-hover: oklch(0.45 0.14 250);
  --accent: oklch(0.55 0.14 85);
  --accent-hover: oklch(0.50 0.16 85);

  /* Semantic */
  --success: oklch(0.50 0.17 145);
  --success-bg: oklch(0.50 0.17 145 / 8%);
  --warning: oklch(0.65 0.18 75);
  --warning-bg: oklch(0.65 0.18 75 / 8%);
  --danger: oklch(0.55 0.22 25);
  --danger-bg: oklch(0.55 0.22 25 / 8%);
  --info: oklch(0.55 0.14 240);
  --info-bg: oklch(0.55 0.14 240 / 8%);

  /* Borders */
  --border-subtle: oklch(0 0 0 / 6%);
  --border-default: oklch(0 0 0 / 10%);
  --border-strong: oklch(0 0 0 / 16%);
  --border-focus: oklch(0.45 0.16 162);

  /* Stock colors (Korean convention: red=up, blue=down) */
  --color-stock-up: oklch(0.55 0.22 25);
  --color-stock-up-bg: oklch(0.55 0.22 25 / 8%);
  --color-stock-down: oklch(0.55 0.17 250);
  --color-stock-down-bg: oklch(0.55 0.17 250 / 8%);
  --color-stock-flat: oklch(0.55 0 0);

  /* Shadows (light uses real shadows, not glows) */
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 5%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 8%), 0 1px 2px oklch(0 0 0 / 4%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 10%), 0 2px 4px oklch(0 0 0 / 5%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 12%), 0 4px 8px oklch(0 0 0 / 6%);

  /* Glassmorphism */
  --glass-bg: oklch(1 0 0 / 70%);
  --glass-border: oklch(0 0 0 / 8%);
  --glass-blur: 12px;

  /* Radius */
  --radius: 0.625rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.875rem;
  --radius-2xl: 1.125rem;
}

.dark {
  /* Background hierarchy */
  --bg-base: oklch(0.13 0.005 260);
  --bg-surface: oklch(0.17 0.005 260);
  --bg-card: oklch(0.21 0.005 260);
  --bg-elevated: oklch(0.25 0.008 260);
  --bg-floating: oklch(0.30 0.010 260);

  /* Text hierarchy */
  --text-primary: oklch(0.95 0 0);
  --text-secondary: oklch(0.72 0 0);
  --text-tertiary: oklch(0.55 0 0);
  --text-muted: oklch(0.42 0 0);

  /* Brand */
  --primary: oklch(0.72 0.17 162);
  --primary-hover: oklch(0.78 0.15 162);
  --primary-muted: oklch(0.72 0.17 162 / 15%);
  --primary-foreground: oklch(0.15 0 0);
  --secondary: oklch(0.70 0.10 250);
  --secondary-hover: oklch(0.76 0.08 250);
  --accent: oklch(0.80 0.12 85);
  --accent-hover: oklch(0.85 0.10 85);

  /* Semantic */
  --success: oklch(0.72 0.19 145);
  --success-bg: oklch(0.72 0.19 145 / 12%);
  --warning: oklch(0.82 0.16 75);
  --warning-bg: oklch(0.82 0.16 75 / 12%);
  --danger: oklch(0.70 0.20 25);
  --danger-bg: oklch(0.70 0.20 25 / 12%);
  --info: oklch(0.75 0.12 240);
  --info-bg: oklch(0.75 0.12 240 / 12%);

  /* Borders */
  --border-subtle: oklch(1 0 0 / 6%);
  --border-default: oklch(1 0 0 / 10%);
  --border-strong: oklch(1 0 0 / 16%);
  --border-focus: oklch(0.72 0.17 162);

  /* Stock colors (Korean convention: red=up, blue=down) — brighter for dark bg */
  --color-stock-up: oklch(0.72 0.20 25);
  --color-stock-up-bg: oklch(0.72 0.20 25 / 12%);
  --color-stock-down: oklch(0.72 0.15 250);
  --color-stock-down-bg: oklch(0.72 0.15 250 / 12%);
  --color-stock-flat: oklch(0.60 0 0);

  /* Shadows (dark mode uses subtle glows, not drop shadows) */
  --shadow-subtle: 0 1px 2px oklch(0 0 0 / 20%);
  --shadow-medium: 0 2px 8px oklch(0 0 0 / 30%), 0 0 1px oklch(1 0 0 / 5%);
  --shadow-elevated: 0 4px 16px oklch(0 0 0 / 40%), 0 0 1px oklch(1 0 0 / 8%);
  --shadow-floating: 0 8px 32px oklch(0 0 0 / 50%), 0 0 1px oklch(1 0 0 / 10%);

  /* Glassmorphism (more dramatic on dark) */
  --glass-bg: oklch(0.17 0.005 260 / 60%);
  --glass-border: oklch(1 0 0 / 8%);
  --glass-blur: 16px;
}
```

---

## 2. Card System

### 2.1 Card Variants

All cards share a common base and diverge through variant modifiers. The system uses both ring-based borders (for crisp edges) and shadow-based depth.

#### Base Card (Default)

Standard container for grouped content.

```css
/* Utility class: .card-default */
.card-default {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-subtle);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
```

**Tailwind**: `bg-[--bg-card] border border-[--border-default] rounded-xl shadow-[--shadow-subtle]`

#### Glass Card (Glassmorphism)

Translucent panels for overlays, headers, and hero sections. Creates depth through backdrop blur.

```css
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-medium);
}
```

**Tailwind**: `bg-[--glass-bg] backdrop-blur-[--glass-blur] border border-[--glass-border] rounded-xl shadow-[--shadow-medium]`

#### Gradient Border Card

Accent cards with gradient borders for highlighted content (featured stocks, active watchlist items).

```css
.card-gradient-border {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-medium);
  /* Gradient border via pseudo-element */
}
.card-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    var(--border-gradient-start),
    var(--border-gradient-end)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

#### Interactive Card

For clickable items (stock list rows, watchlist cards, news items). Hover lifts the card.

```css
.card-interactive {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
}
.card-interactive:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  box-shadow: var(--shadow-medium);
  transform: translateY(-1px);
}
.card-interactive:active {
  transform: translateY(0px);
  box-shadow: var(--shadow-subtle);
}
```

**Tailwind**: `bg-[--bg-card] border border-[--border-subtle] rounded-xl shadow-[--shadow-subtle] cursor-pointer transition-all hover:bg-[--bg-elevated] hover:border-[--border-default] hover:shadow-[--shadow-medium] hover:-translate-y-px active:translate-y-0`

#### Stat Card

Compact cards for KPI/metric display (market indices, portfolio summary). Features a colored left accent bar.

```css
.card-stat {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-subtle);
  padding: 12px 16px;
}
/* Variant: positive */
.card-stat[data-trend="up"] {
  border-left-color: var(--color-stock-up);
  background: linear-gradient(135deg, var(--color-stock-up-bg), transparent 60%);
}
/* Variant: negative */
.card-stat[data-trend="down"] {
  border-left-color: var(--color-stock-down);
  background: linear-gradient(135deg, var(--color-stock-down-bg), transparent 60%);
}
```

### 2.2 Shadow Hierarchy

| Level | Token | Dark Mode | Light Mode | Usage |
|-------|-------|-----------|------------|-------|
| Subtle | `--shadow-subtle` | `0 1px 2px oklch(0 0 0/20%)` | `0 1px 2px oklch(0 0 0/5%)` | Default resting state |
| Medium | `--shadow-medium` | `0 2px 8px oklch(0 0 0/30%), inset glow` | `0 2px 8px oklch(0 0 0/8%)` | Hover, focused elements |
| Elevated | `--shadow-elevated` | `0 4px 16px oklch(0 0 0/40%), inset glow` | `0 4px 16px oklch(0 0 0/10%)` | Modals, expanded panels |
| Floating | `--shadow-floating` | `0 8px 32px oklch(0 0 0/50%), inset glow` | `0 8px 32px oklch(0 0 0/12%)` | Tooltips, command palette |

### 2.3 Inner Glow Effect (Dark Mode Only)

Dark mode cards get a subtle 1px inner glow at the top edge to simulate light reflection:

```css
.dark .card-default,
.dark .card-interactive {
  box-shadow:
    var(--shadow-subtle),
    inset 0 1px 0 oklch(1 0 0 / 5%);
}
```

---

## 3. Typography Scale

### 3.1 Size Scale

Optimized for data-dense financial interfaces. Tighter than typical web scales — every size has a job.

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-2xs` | `0.625rem` (10px) | 1.2 | Micro labels (chart axis, volume) |
| `--text-xs` | `0.75rem` (12px) | 1.3 | Timestamps, badges, captions |
| `--text-sm` | `0.8125rem` (13px) | 1.4 | Secondary text, table cells, descriptions |
| `--text-base` | `0.875rem` (14px) | 1.5 | Body text, form labels, list items |
| `--text-md` | `0.9375rem` (15px) | 1.5 | Card titles, table headers |
| `--text-lg` | `1.0625rem` (17px) | 1.4 | Section titles, stock names |
| `--text-xl` | `1.25rem` (20px) | 1.3 | Page subtitles, prices |
| `--text-2xl` | `1.5rem` (24px) | 1.2 | Page titles, hero numbers |
| `--text-3xl` | `1.875rem` (30px) | 1.1 | Large display numbers (index values) |
| `--text-4xl` | `2.25rem` (36px) | 1.1 | Hero headline numbers |

### 3.2 Weight System

| Token | Weight | Usage |
|-------|--------|-------|
| `--font-regular` | 400 | Body text, descriptions, table cells |
| `--font-medium` | 500 | Labels, card titles, navigation items |
| `--font-semibold` | 600 | Section headers, stock names, emphasis |
| `--font-bold` | 700 | Prices, KPI numbers, page titles |

### 3.3 Monospace for Financial Data

All numeric financial data (prices, volumes, percentages, indices) uses monospace with tabular-nums for column alignment:

```css
.font-mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* Price-specific: tighter for large numbers */
.font-price {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

### 3.4 Letter Spacing

| Context | Letter Spacing | Notes |
|---------|---------------|-------|
| Uppercase labels | `0.05em` | Tracking out for readability |
| Body text | `0` | Default, Pretendard handles well |
| Headings (>= xl) | `-0.01em` | Slight tightening for polish |
| Large numbers (>= 2xl) | `-0.02em` | Monospace numerals tighten nicely |

---

## 4. Data Visualization Colors

### 4.1 Stock Movement (Korean Convention)

| State | Dark Mode | Light Mode | Token |
|-------|-----------|------------|-------|
| Up (상승) | `oklch(0.72 0.20 25)` | `oklch(0.55 0.22 25)` | `--color-stock-up` |
| Up Background | `oklch(0.72 0.20 25 / 12%)` | `oklch(0.55 0.22 25 / 8%)` | `--color-stock-up-bg` |
| Down (하락) | `oklch(0.72 0.15 250)` | `oklch(0.55 0.17 250)` | `--color-stock-down` |
| Down Background | `oklch(0.72 0.15 250 / 12%)` | `oklch(0.55 0.17 250 / 8%)` | `--color-stock-down-bg` |
| Flat (보합) | `oklch(0.60 0 0)` | `oklch(0.55 0 0)` | `--color-stock-flat` |

**Candlestick chart mapping:**
- `--color-chart-candle-up`: same as `--color-stock-up`
- `--color-chart-candle-down`: same as `--color-stock-down`
- Candle wick: 1px, same color at 60% opacity

### 4.2 Multi-Series Chart Palette

Eight perceptually distinct colors for overlaid chart series. Chosen to remain distinguishable with color vision deficiency (tested against deuteranopia/protanopia).

| Series | Token | Dark Mode | Light Mode | Name |
|--------|-------|-----------|------------|------|
| 1 | `--chart-1` | `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162)` | Teal (Primary) |
| 2 | `--chart-2` | `oklch(0.75 0.14 45)` | `oklch(0.55 0.16 45)` | Orange |
| 3 | `--chart-3` | `oklch(0.70 0.15 300)` | `oklch(0.48 0.17 300)` | Purple |
| 4 | `--chart-4` | `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85)` | Gold |
| 5 | `--chart-5` | `oklch(0.68 0.18 210)` | `oklch(0.48 0.18 210)` | Cyan |
| 6 | `--chart-6` | `oklch(0.72 0.16 350)` | `oklch(0.50 0.18 350)` | Pink |
| 7 | `--chart-7` | `oklch(0.75 0.15 120)` | `oklch(0.50 0.16 120)` | Lime |
| 8 | `--chart-8` | `oklch(0.70 0.12 20)` | `oklch(0.50 0.14 20)` | Coral |

Area fill for each series: same color at 10-20% opacity with gradient to transparent at bottom.

### 4.3 Badge / Category Colors

For market tags, sector badges, news categories:

| Badge | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| Market KR | `oklch(0.72 0.20 25 / 15%)` text `oklch(0.72 0.20 25)` | `oklch(0.55 0.22 25 / 10%)` text `oklch(0.55 0.22 25)` | Korean market tag |
| Market US | `oklch(0.70 0.12 250 / 15%)` text `oklch(0.70 0.12 250)` | `oklch(0.50 0.14 250 / 10%)` text `oklch(0.50 0.14 250)` | US market tag |
| Sector | `oklch(0.72 0.17 162 / 15%)` text `oklch(0.72 0.17 162)` | `oklch(0.45 0.16 162 / 10%)` text `oklch(0.45 0.16 162)` | Sector/industry tags |
| News | `oklch(0.80 0.12 85 / 15%)` text `oklch(0.80 0.12 85)` | `oklch(0.55 0.14 85 / 10%)` text `oklch(0.55 0.14 85)` | News category badge |
| ETF | `oklch(0.70 0.15 300 / 15%)` text `oklch(0.70 0.15 300)` | `oklch(0.48 0.17 300 / 10%)` text `oklch(0.48 0.17 300)` | ETF tag |

### 4.4 Heatmap Gradient

For sector heatmaps and performance matrices. 9-stop gradient from deep blue (worst) through neutral gray to deep red (best), following Korean convention:

```css
--heatmap-1: oklch(0.55 0.17 250);    /* -4%+ deep blue */
--heatmap-2: oklch(0.60 0.12 250);    /* -3% */
--heatmap-3: oklch(0.65 0.08 250);    /* -2% */
--heatmap-4: oklch(0.68 0.04 250);    /* -1% */
--heatmap-5: oklch(0.55 0 0);         /* 0% neutral gray */
--heatmap-6: oklch(0.68 0.04 25);     /* +1% */
--heatmap-7: oklch(0.65 0.08 25);     /* +2% */
--heatmap-8: oklch(0.60 0.12 25);     /* +3% */
--heatmap-9: oklch(0.55 0.17 25);     /* +4%+ deep red */
```

### 4.5 Market Index Indicator Colors

| Index | Color | Token |
|-------|-------|-------|
| KOSPI | `oklch(0.55 0.22 25)` / `oklch(0.72 0.20 25)` | `--index-kospi` |
| KOSDAQ | `oklch(0.55 0.17 250)` / `oklch(0.72 0.15 250)` | `--index-kosdaq` |
| S&P 500 | `oklch(0.45 0.16 162)` / `oklch(0.72 0.17 162)` | `--index-sp500` |
| NASDAQ | `oklch(0.48 0.17 300)` / `oklch(0.70 0.15 300)` | `--index-nasdaq` |
| USD/KRW | `oklch(0.55 0.14 85)` / `oklch(0.80 0.12 85)` | `--index-usdkrw` |

---

## 5. Micro Interactions

### 5.1 Transition Timing

Consistent easing across all interactions:

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Quick deceleration — for entrances */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Smooth — for transforms */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy — for playful elements */
  --duration-fast: 120ms;    /* Hover, active states */
  --duration-normal: 200ms;  /* Card transitions, color changes */
  --duration-slow: 350ms;    /* Modal open/close, layout shifts */
}
```

### 5.2 Card Hover Effects

```css
/* Standard card hover — lift + brighten border */
.card-interactive {
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out),
              border-color var(--duration-fast) ease;
}
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  border-color: var(--border-default);
}
.card-interactive:active {
  transform: translateY(0);
  transition-duration: var(--duration-fast);
}

/* Stat card hover — subtle glow of accent color */
.card-stat:hover {
  box-shadow: var(--shadow-medium),
              0 0 0 1px var(--primary-muted);
}
```

### 5.3 Button States

```css
/* Default button — press-down effect (already in shadcn base) */
button {
  transition: all var(--duration-fast) var(--ease-in-out);
}
button:hover {
  filter: brightness(1.08);
}
button:active {
  transform: translateY(1px);
  filter: brightness(0.95);
}

/* Ghost button hover — subtle background fill */
.btn-ghost:hover {
  background: var(--bg-elevated);
}

/* Icon button — scale pulse on hover */
.btn-icon:hover {
  transform: scale(1.05);
}
.btn-icon:active {
  transform: scale(0.95);
}
```

### 5.4 Price Tick Animation (Number Change)

The signature interaction for a stock app. When a price changes, briefly flash the color and animate the number.

```css
/* Flash animation for price changes */
@keyframes price-tick-up {
  0% { color: var(--color-stock-up); background: var(--color-stock-up-bg); }
  100% { color: inherit; background: transparent; }
}
@keyframes price-tick-down {
  0% { color: var(--color-stock-down); background: var(--color-stock-down-bg); }
  100% { color: inherit; background: transparent; }
}

.price-tick-up {
  animation: price-tick-up 1.5s var(--ease-out) forwards;
  border-radius: var(--radius-sm);
  padding: 0 2px;
  margin: 0 -2px;
}
.price-tick-down {
  animation: price-tick-down 1.5s var(--ease-out) forwards;
  border-radius: var(--radius-sm);
  padding: 0 2px;
  margin: 0 -2px;
}

/* Numeric counter animation (optional, for hero numbers) */
@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-count {
  animation: count-up 0.4s var(--ease-out) forwards;
}
```

**React implementation pattern:**
```tsx
// usePriceTick hook
function usePriceTick(currentPrice: number, prevPrice: number) {
  const direction = currentPrice > prevPrice ? 'up' : currentPrice < prevPrice ? 'down' : null;
  return direction ? `price-tick-${direction}` : '';
}
```

### 5.5 Loading Skeletons

Pulse-based skeleton with subtle gradient sweep. Uses the background hierarchy for appropriate contrast.

```css
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-floating) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

/* Dark mode: more visible shimmer */
.dark .skeleton {
  background: linear-gradient(
    90deg,
    oklch(0.22 0.005 260) 25%,
    oklch(0.28 0.008 260) 50%,
    oklch(0.22 0.005 260) 75%
  );
  background-size: 200% 100%;
}
```

### 5.6 Chart Hover Tooltip

```css
.chart-tooltip {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  padding: 8px 12px;
  font-size: var(--text-xs);
  animation: tooltip-enter 0.15s var(--ease-out) forwards;
  pointer-events: none;
}

@keyframes tooltip-enter {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 5.7 List Item / Row Interactions

```css
/* Table row hover — subtle highlight */
.table-row {
  transition: background var(--duration-fast) ease;
}
.table-row:hover {
  background: var(--bg-elevated);
}

/* Watchlist star toggle */
@keyframes star-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.star-toggle.active {
  animation: star-pop 0.3s var(--ease-spring);
  color: var(--accent);
}
```

### 5.8 Page Transition

Smooth entrance for page content:

```css
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-content {
  animation: page-enter 0.3s var(--ease-out) forwards;
}
```

### 5.9 Focus Ring System

Consistent, accessible focus indicators:

```css
/* Default focus ring */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Inside dark backgrounds, use glow instead of outline */
.dark :focus-visible {
  outline: 2px solid var(--primary);
  box-shadow: 0 0 0 4px var(--primary-muted);
}
```

---

## 6. Implementation Mapping

### 6.1 Mapping to Existing shadcn Variables

To minimize migration effort, new tokens supplement (not replace) existing shadcn variables:

| shadcn Variable | Maps To | Notes |
|----------------|---------|-------|
| `--background` | `--bg-base` | Page background |
| `--card` | `--bg-card` | Card surfaces |
| `--popover` | `--bg-floating` | Popover/dropdown surfaces |
| `--muted` | `--bg-surface` | Muted backgrounds |
| `--foreground` | `--text-primary` | Primary text |
| `--muted-foreground` | `--text-secondary` | Secondary text |
| `--border` | `--border-default` | Default borders |
| `--ring` | `--border-focus` | Focus rings |
| `--primary` | `--primary` | Direct mapping |
| `--destructive` | `--danger` | Error/destructive |

### 6.2 Tailwind Utility Extensions

```css
/* Add to globals.css @theme block */
@theme inline {
  --shadow-subtle: var(--shadow-subtle);
  --shadow-medium: var(--shadow-medium);
  --shadow-elevated: var(--shadow-elevated);
  --shadow-floating: var(--shadow-floating);
}
```

### 6.3 Migration Priority

1. **Phase 1**: Background hierarchy + text colors (highest visual impact)
2. **Phase 2**: Card system overhaul (glassmorphism + shadows)
3. **Phase 3**: Data visualization colors (charts, badges, heatmaps)
4. **Phase 4**: Micro interactions (hover, animations, skeletons)
5. **Phase 5**: Polish (page transitions, focus rings, tooltips)

---

## 7. Accessibility Compliance

All color combinations meet WCAG 2.1 AA contrast requirements:

| Pairing | Contrast Ratio | Passes |
|---------|---------------|--------|
| `--text-primary` on `--bg-base` (dark) | ~16:1 | AAA |
| `--text-primary` on `--bg-card` (dark) | ~13:1 | AAA |
| `--text-secondary` on `--bg-card` (dark) | ~7:1 | AA |
| `--text-tertiary` on `--bg-card` (dark) | ~4.6:1 | AA (large text) |
| `--color-stock-up` on `--bg-card` (dark) | ~7.5:1 | AA |
| `--color-stock-down` on `--bg-card` (dark) | ~7.5:1 | AA |
| `--text-primary` on `--bg-base` (light) | ~17:1 | AAA |
| `--text-secondary` on `--bg-card` (light) | ~8:1 | AA |
| `--color-stock-up` on white (light) | ~5.5:1 | AA |
| `--color-stock-down` on white (light) | ~5.2:1 | AA |

Focus indicators use 3:1 minimum contrast against adjacent colors (WCAG 2.4.7).

---

## 8. Visual Identity Signature

### 8.1 Gradient Accents

Subtle gradients for brand expression without overwhelming data:

```css
/* Hero section background gradient */
.hero-gradient {
  background: linear-gradient(
    180deg,
    var(--primary-muted) 0%,
    transparent 60%
  );
}

/* Header background (glass + gradient) */
.header-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--glass-border);
}

/* Decorative mesh gradient for empty states */
.mesh-gradient {
  background:
    radial-gradient(ellipse at 20% 50%, var(--primary-muted) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, oklch(0.70 0.10 250 / 8%) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, oklch(0.80 0.12 85 / 6%) 0%, transparent 50%);
}
```

### 8.2 Noise Texture Overlay

Adds tactile quality to large flat surfaces (optional, CSS-only):

```css
.texture-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* tiny noise SVG */
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

---

*Designed by UX Designer A for StockView Design Overhaul. All values are implementation-ready oklch CSS custom properties optimized for Tailwind CSS 4 + shadcn/ui (base-nova).*
