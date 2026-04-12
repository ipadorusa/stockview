# Stitch DESIGN.md 포맷 (요약 스텁)

> **원본**: https://stitch.withgoogle.com/docs/design-md/format/
> **주의**: 원 페이지가 클라이언트 렌더링(SPA)이라 정적 fetch로 본문 추출 실패. 본 파일은 VoltAgent awesome-design-md README 및 실제 다운로드한 샘플 7종(`./design-md/*.md`)에서 역추출한 섹션 구조 요약.
> **확정된 섹션 스켈레톤** (VoltAgent "extended" 포맷 = Stitch 포맷 + α):

## 9-Section Skeleton

| # | 섹션 | 담는 것 | 핵심 질문 |
|---|------|--------|----------|
| 1 | **Visual Theme & Atmosphere** | 무드, 밀도, 디자인 철학 | "이 사이트의 첫인상은?" / "가장 차별화된 디자인 시그니처는?" |
| 2 | **Color Palette & Roles** | 시맨틱 이름 + hex/oklch + 역할 | "primary, secondary, semantic, neutral이 몇 개씩?" |
| 3 | **Typography Rules** | 폰트 패밀리, 전 계층 테이블 (size/weight/line-height/letter-spacing) | "display vs UI 폰트 구분?" / "숫자 전용 타이포?" |
| 4 | **Component Stylings** | 버튼/카드/인풋/네비 등 + 상태 (hover/active/disabled) | "각 컴포넌트의 radius, padding, shadow, state 변화?" |
| 5 | **Layout Principles** | 스페이싱 스케일, 그리드, 여백 철학 | "4px/8px grid?" / "max-w/컨테이너 폭?" |
| 6 | **Depth & Elevation** | 섀도우 시스템, 서피스 계층 | "shadow 몇 단?" / "surface 레벨 몇 개?" |
| 7 | **Do's and Don'ts** | 가드레일, 안티패턴 | "절대 하지 말 것 5–10개" |
| 8 | **Responsive Behavior** | 브레이크포인트, 터치 타겟, 축소 전략 | "sm/md/lg/xl 임계?" / "모바일에서 어떤 요소가 접히나?" |
| 9 | **Agent Prompt Guide** | 빠른 색 레퍼런스 + 즉시 쓰는 샘플 프롬프트 | "신규 페이지 만들 때 AI에게 무엇을 복붙할까?" |

## 실제 샘플에서 관찰된 규칙

7개 샘플(Kraken/Binance/Coinbase/Stripe/Revolut/Sentry/Supabase)을 비교한 공통 패턴:

1. **도입 한 문단**: "이 브랜드가 무엇이며, 어떤 비주얼 시그니처로 표현하는가"를 2–3 문장으로.
2. **Key Characteristics 5–7 bullet**: hex 값 포함한 특징 목록(§1 말미에 자주 배치).
3. **§2 Color**는 항상 Primary/Neutral/Semantic 3블록으로 나뉨. hex는 필수, oklch/rgb는 선택.
4. **§3 Typography Hierarchy 표**는 Role|Font|Size|Weight|Line Height|Letter Spacing 6열이 표준.
5. **§4 Component**는 컴포넌트별로 Background/Text/Border/Padding/Radius/Shadow 6가지를 "variant 이름: ..." 형식으로 나열. CSS-in-JS 스타일.
6. **§5 Layout**는 Spacing 수치 나열 + Border Radius 수치 나열 두 줄로 최소화하는 경우가 많음.
7. **§6 Elevation**은 2–4개의 shadow 토큰으로 간단히. Kraken은 2개(`Subtle` + `Micro`)만으로 처리.
8. **§7 Do/Don't**는 각각 5–10개. "12px is the max radius" 같은 구체 수치 금지가 효과적.
9. **§8 Responsive**는 브레이크포인트 7개(375/425/640/768/1024/1280/1536) 정도가 표준.
10. **§9 Agent Prompt Guide**는 "Quick Color Reference" + "Example Component Prompts 3–5개" 두 블록.

## StockView가 가져갈 포맷

위 9섹션을 그대로 채택하고, **§10 Market Data Patterns**를 StockView 특화로 추가 (주가색 룰, 차트 팔레트, KR/US 시장 차이, tabular-nums 강제 등).

## Reference
- VoltAgent awesome-design-md: https://github.com/VoltAgent/awesome-design-md
- Stitch (원본, SPA): https://stitch.withgoogle.com/docs/design-md/overview/
- 다운로드 CLI: `npx getdesign@latest add <slug>`
- 로컬 샘플: `.ai/references/design-md/{kraken,binance,coinbase,stripe,revolut,sentry,supabase}.md`
