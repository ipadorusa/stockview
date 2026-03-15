# Findings & Decisions

## Requirements
- 초보 투자자 대상 주식 웹 서비스
- 한국 + 미국 주식 시장 지원
- 실시간 불필요, 분석용 데이터 (장전/장후)
- 핵심 기능: 시세 조회, 뉴스, 차트
- 회원가입 필요
- 기술 스택: React + Next.js + TypeScript + shadcn/ui

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Next.js 15 + React 19 | SSR/SSG로 SEO 최적화, App Router 활용 |
| shadcn/ui + Tailwind CSS | 커스터마이징 용이, 일관된 디자인 시스템 |
| TradingView Lightweight Charts | 주식 차트 특화 라이브러리, 경량 |
| Zustand + TanStack Query | 클라이언트 상태 + 서버 상태 분리 |
| PostgreSQL + Prisma | 타입 안전한 ORM, 관계형 데이터에 적합 |
| NextAuth.js | Next.js 네이티브 인증 솔루션 |
| 한투 API + Yahoo Finance | 한국/미국 주식 데이터 소스 |
| Vercel + Supabase | 프론트 배포 + DB 호스팅 |
| Cron 스케줄링 | GitHub Actions → API Route HTTP 호출 | Vercel Cron 빈도 제한 회피 |
| 뉴스 수집 (한국) | Naver Finance 섹터 뉴스 스크래핑 (Primary) + Google RSS (fallback) | ipadorusa-codex n8n 워크플로우 방식 참고 |
| 뉴스 수집 (미국) | Google News RSS + Yahoo Finance RSS (Primary) + Investing.com RSS (fallback) | 다중 RSS 조합으로 커버리지 확보 |
| 데이터 보관 기간 | 일봉·뉴스 모두 3주(21일) | Supabase 무료 500MB 제약, DB ~15MB로 여유 |
| 차트 기간 | 1W / 2W / 3W만 제공 | 3주치 일봉만 보관, 장기 차트는 Post-MVP |
| 보조 지표 | MA 5/10 + RSI만 제공 | 15일 데이터로 MACD(26일), BB(20일), MA60/120 계산 불가 → Post-MVP |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Vercel Cron 빈도 제한 (Hobby 1일1회, Pro 1시간1회) | GitHub Actions (무료 2,000분/월)로 전환 |
| NewsAPI 무료 localhost 전용, 유료 $449/월 | Google News RSS + Naver RSS를 Primary로 전환 |
| Supabase 무료 500MB, 장기 일봉 용량 초과 | 일봉·뉴스 모두 3주로 축소 (~15MB), Supabase 무료 여유 |
| Yahoo Finance 비공식 API 차단 리스크 | 장기 FMP/Twelve Data 전환 검토, 현재는 유지 |
| Alpha Vantage 무료 1일 25건 (문서에 분당 5건 오기) | 한도 정보 수정, 소수 종목 fallback 용도로만 사용 |
| 차트 기간 3주 제한 | 1W/2W/3W만 제공, 1M 이상은 Post-MVP |
| MarketHeatmap 백엔드 API 없음 | Post-MVP로 이관 |
| backend-spec §4.6 뉴스 파이프라인 중복 | data-pipeline.md 참조로 교체 |

## Resources
- 한국투자증권 Open API: 한국 주식 데이터
- Yahoo Finance API: 미국 주식 데이터
- Alpha Vantage: 백업 데이터 소스
- TradingView Lightweight Charts: 차트 라이브러리

---
*Update this file after every 2 view/browser/search operations*
