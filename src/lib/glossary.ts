export type Signal = "good" | "neutral" | "caution"

export interface GlossaryEntry {
  term: string
  shortDesc: string
  guideHref?: string
  evaluate?: (value: number, sectorAvg?: number | null) => Signal
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  PER: {
    term: "PER (주가수익비율)",
    shortDesc:
      "주가를 주당순이익으로 나눈 값이에요. 낮을수록 이익 대비 주가가 저렴한 것을 의미해요.",
    guideHref: "/guide/reading-financials#per",
    evaluate: (value, sectorAvg) => {
      if (!sectorAvg) return "neutral"
      if (value < sectorAvg * 0.7) return "good"
      if (value > sectorAvg * 1.3) return "caution"
      return "neutral"
    },
  },
  PBR: {
    term: "PBR (주가순자산비율)",
    shortDesc:
      "주가를 주당순자산으로 나눈 값이에요. 1 미만이면 자산 가치보다 싸게 거래되는 것이에요.",
    guideHref: "/guide/reading-financials#pbr",
    evaluate: (value, sectorAvg) => {
      if (!sectorAvg) {
        if (value < 1) return "good"
        if (value > 3) return "caution"
        return "neutral"
      }
      if (value < sectorAvg * 0.7) return "good"
      if (value > sectorAvg * 1.3) return "caution"
      return "neutral"
    },
  },
  EPS: {
    term: "EPS (주당순이익)",
    shortDesc:
      "기업의 순이익을 발행주식수로 나눈 값이에요. 높을수록 수익성이 좋아요.",
    guideHref: "/guide/reading-financials#eps",
  },
  ROE: {
    term: "ROE (자기자본이익률)",
    shortDesc:
      "자기자본 대비 순이익 비율이에요. 높을수록 주주 자본을 효율적으로 활용하는 기업이에요.",
    guideHref: "/guide/reading-financials#roe",
    evaluate: (value) => {
      if (value >= 15) return "good"
      if (value < 5) return "caution"
      return "neutral"
    },
  },
  배당수익률: {
    term: "배당수익률",
    shortDesc: "주가 대비 연간 배당금의 비율이에요. 높을수록 배당 수익이 커요.",
    guideHref: "/guide/dividend-investing#yield",
    evaluate: (value) => {
      if (value >= 3) return "good"
      if (value < 1) return "caution"
      return "neutral"
    },
  },
  부채비율: {
    term: "부채비율",
    shortDesc:
      "총부채를 자기자본으로 나눈 값이에요. 낮을수록 재무가 안정적이에요.",
    guideHref: "/guide/reading-financials#debt",
    evaluate: (value) => {
      if (value < 100) return "good"
      if (value > 200) return "caution"
      return "neutral"
    },
  },
  베타: {
    term: "베타 (변동성)",
    shortDesc:
      "시장 대비 주가 변동 크기예요. 1보다 크면 시장보다 출렁이고, 작으면 안정적이에요.",
    guideHref: "/guide/technical-indicators#beta",
  },
}

export const SIGNAL_COLORS = {
  good: "text-success",
  neutral: "text-muted-foreground",
  caution: "text-warning",
} as const
