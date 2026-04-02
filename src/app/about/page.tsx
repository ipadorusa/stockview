import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "StockView는 한국/미국 주식 시세, 차트, 뉴스, AI 분석 리포트를 제공하는 투자 정보 플랫폼입니다.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "서비스 소개 - StockView",
    description: "StockView는 한국/미국 주식 시세, 차트, 뉴스, AI 분석 리포트를 제공하는 투자 정보 플랫폼입니다.",
  },
}

export default function AboutPage() {
  return (
    <PageContainer>
      <JsonLd data={buildWebPage("서비스 소개", "StockView 서비스 소개", "/about")} />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>서비스 소개</h1>

        <h2>StockView란?</h2>
        <p>StockView는 초보 투자자를 위한 한국/미국 주식 정보 플랫폼입니다. 4,800개 이상의 종목에 대한 실시간 시세, 기술적 차트, 뉴스, 배당 캘린더, AI 분석 리포트 등을 한 곳에서 제공하여 투자자가 보다 효율적으로 시장 정보를 탐색할 수 있도록 돕습니다.</p>

        <h2>데이터 출처</h2>
        <p>StockView는 신뢰할 수 있는 공식 데이터 소스를 활용합니다.</p>
        <ul>
          <li><strong>한국 주식</strong>: 네이버 금융 — 시세, 차트, 종목 정보</li>
          <li><strong>미국 주식</strong>: Yahoo Finance — 시세, OHLCV 데이터</li>
          <li><strong>뉴스</strong>: Google News RSS, Yahoo Finance RSS — 자동 카테고리 분류</li>
          <li><strong>배당 정보</strong>: 금융감독원 전자공시시스템(DART)</li>
        </ul>
        <p>데이터는 정기적인 크론 작업을 통해 수집되며, 실시간 데이터가 아닌 주기적 갱신 데이터입니다. 시세의 지연은 수분에서 수십 분 발생할 수 있습니다.</p>

        <h2>AI 리포트 편집 방침</h2>
        <p>StockView의 AI 리포트는 다음 과정을 거쳐 생성됩니다.</p>
        <ol>
          <li><strong>데이터 수집</strong>: 종목의 기술적 지표(RSI, MACD, 볼린저밴드 등), 기본적 분석 데이터(PER, PBR, ROE 등), 최근 뉴스를 종합</li>
          <li><strong>AI 분석</strong>: 수집된 데이터를 바탕으로 AI가 종합 분석 리포트를 생성</li>
          <li><strong>시그널 선별</strong>: 기술적 신호(골든크로스, RSI 과매도 등)에 기반한 종목 선별</li>
        </ol>
        <p>AI 리포트에는 「인공지능기본법」 제31조에 따라 AI 생성 콘텐츠임을 명시하고 있습니다. AI가 생성한 정보는 오류를 포함할 수 있으며, 전문적인 투자 조언을 대체하지 않습니다.</p>

        <h2>면책 고지</h2>
        <p className="font-semibold">StockView에서 제공하는 모든 정보는 투자 참고용이며, 특정 종목에 대한 투자 권유가 아닙니다. 투자에 대한 최종 판단과 그에 따른 손익의 책임은 전적으로 투자자 본인에게 있습니다.</p>

        <h2>연락처</h2>
        <p>문의사항은 <a href="/contact">문의하기</a> 페이지를 이용하시거나, <a href="/board">게시판</a>에 글을 남겨주세요.</p>
      </article>
    </PageContainer>
  )
}
