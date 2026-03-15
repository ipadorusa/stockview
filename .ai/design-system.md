# Design System: StockView

> shadcn/ui + Tailwind CSS 기반 디자인 시스템
> 초보 투자자를 위한 깔끔하고 직관적인 금융 UI

---

## 1. 컬러 시스템

### 1.1 브랜드 컬러
```css
/* Primary — 신뢰감 있는 블루 계열 */
--primary:         222.2 47.4% 11.2%;    /* #0f172a — 메인 버튼, 강조 */
--primary-foreground: 210 40% 98%;       /* 버튼 텍스트 */

/* Secondary — 보조 액션 */
--secondary:       210 40% 96.1%;        /* #f1f5f9 */
--secondary-foreground: 222.2 47.4% 11.2%;
```

### 1.2 시맨틱 컬러 (주식 특화)
```css
/* 상승 (빨강) — 한국 주식 관례 */
--stock-up:        0 84% 60%;            /* #ef4444 — red-500 */
--stock-up-bg:     0 84% 95%;            /* #fef2f2 — red-50 */
--stock-up-text:   0 72% 51%;            /* #dc2626 — red-600 */

/* 하락 (파랑) — 한국 주식 관례 */
--stock-down:      221 83% 53%;          /* #3b82f6 — blue-500 */
--stock-down-bg:   214 95% 93%;          /* #dbeafe — blue-100 */
--stock-down-text: 221 83% 53%;          /* #2563eb — blue-600 */

/* 보합 */
--stock-flat:      0 0% 45%;             /* #737373 — neutral-500 */

/* 미국 주식 모드 (선택적 토글) */
--stock-up-us:     142 71% 45%;          /* #22c55e — green-500 */
--stock-down-us:   0 84% 60%;            /* #ef4444 — red-500 */
```

### 1.3 차트 컬러
```css
--chart-candle-up:    0 84% 60%;         /* 양봉 — 빨강 */
--chart-candle-down:  221 83% 53%;       /* 음봉 — 파랑 */
--chart-line:         222 47% 11%;       /* 라인 차트 */
--chart-volume:       215 20% 65%;       /* 거래량 바 */
--chart-ma5:          25 95% 53%;        /* MA 5 — 주황 */
--chart-ma20:         142 71% 45%;       /* MA 20 — 초록 */
--chart-ma60:         262 83% 58%;       /* MA 60 — 보라 */
--chart-ma120:        0 84% 60%;         /* MA 120 — 빨강 */
--chart-grid:         0 0% 90%;          /* 그리드 라인 */
```

### 1.4 UI 컬러 (shadcn 기본 확장)
```css
/* Light Mode */
--background:      0 0% 100%;
--foreground:      222.2 84% 4.9%;
--card:            0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--muted:           210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;
--border:          214.3 31.8% 91.4%;
--ring:            222.2 84% 4.9%;

/* Dark Mode */
--background:      222.2 84% 4.9%;
--foreground:      210 40% 98%;
--card:            222.2 84% 4.9%;
--card-foreground: 210 40% 98%;
--muted:           217.2 32.6% 17.5%;
--muted-foreground: 215 20.2% 65.1%;
--border:          217.2 32.6% 17.5%;
```

### 1.5 알림/상태 컬러
```css
--success:    142 71% 45%;     /* #22c55e */
--warning:    38 92% 50%;      /* #f59e0b */
--error:      0 84% 60%;       /* #ef4444 */
--info:       199 89% 48%;     /* #0ea5e9 */
```

---

## 2. 타이포그래피

### 2.1 폰트 패밀리
```css
/* 본문 — 한글 가독성 최적화 */
--font-sans: "Pretendard Variable", "Pretendard",
             -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, sans-serif;

/* 숫자 (시세/차트) — 고정폭으로 가격 정렬 */
--font-mono: "JetBrains Mono", "Fira Code",
             ui-monospace, monospace;
```

### 2.2 폰트 크기 (Tailwind 기반)
| Token | Size | Line Height | 용도 |
|-------|------|-------------|------|
| `text-xs` | 12px | 16px | 보조 정보, 타임스탬프 |
| `text-sm` | 14px | 20px | 본문 보조, 테이블 셀 |
| `text-base` | 16px | 24px | 본문 기본 |
| `text-lg` | 18px | 28px | 소제목, 종목명 |
| `text-xl` | 20px | 28px | 섹션 제목 |
| `text-2xl` | 24px | 32px | 페이지 제목 |
| `text-3xl` | 30px | 36px | 현재가 (종목 상세) |
| `text-4xl` | 36px | 40px | 대시보드 히어로 숫자 |

### 2.3 폰트 웨이트
| Weight | 용도 |
|--------|------|
| `font-normal` (400) | 본문, 설명 |
| `font-medium` (500) | 라벨, 네비게이션 |
| `font-semibold` (600) | 소제목, 종목명 |
| `font-bold` (700) | 현재가, 중요 숫자 |

### 2.4 숫자 표시 규칙
```
가격 (한국): 72,400원  → toLocaleString('ko-KR') + '원'
가격 (미국): $198.11   → '$' + toFixed(2)
등락률:      +2.26%    → 부호 항상 표시, 소수점 2자리
거래량:      12.3M     → 축약 표기 (K/M/B)
환율:        1,342.50  → 소수점 2자리
```

---

## 3. 간격 시스템 (Spacing)

Tailwind 기본 4px 단위 사용:

| Token | Value | 용도 |
|-------|-------|------|
| `gap-1` | 4px | 아이콘-텍스트 간격 |
| `gap-2` | 8px | 인라인 요소 간격 |
| `gap-3` | 12px | 카드 내부 요소 간격 |
| `gap-4` | 16px | 카드 패딩, 컴포넌트 간격 |
| `gap-6` | 24px | 섹션 내 그룹 간격 |
| `gap-8` | 32px | 섹션 간 간격 |
| `gap-12` | 48px | 대 섹션 간 간격 |

### 카드 패딩
```
카드 기본: p-4 (16px)
카드 넓은: p-6 (24px)
모바일 카드: p-3 (12px)
```

---

## 4. 반응형 브레이크포인트

| Breakpoint | Width | 레이아웃 | 비고 |
|------------|-------|----------|------|
| `mobile` | 0 ~ 639px | 1 컬럼, 하단 탭바 | 기본 |
| `sm` | 640px~ | 1 컬럼, 넓은 여백 | 큰 모바일 |
| `md` | 768px~ | 2 컬럼 그리드 시작 | 태블릿 |
| `lg` | 1024px~ | 사이드바 레이아웃 가능 | 소형 데스크탑 |
| `xl` | 1280px~ | 전체 레이아웃 | 데스크탑 기준 |
| `2xl` | 1536px~ | max-width 제한 | 대형 모니터 |

### 컨테이너
```css
max-width: 1280px;  /* xl */
padding-inline: 16px (mobile) / 24px (md) / 32px (xl);
```

### 반응형 전략
```
모바일 (< 768px):
  - 하단 탭바 네비게이션
  - 1컬럼 스택 레이아웃
  - 지수 카드: 2열 그리드
  - 차트: 전체 너비
  - 검색: 아이콘만 표시 → 클릭 시 전체화면 검색

태블릿 (768px ~ 1023px):
  - 상단 네비게이션
  - 2컬럼 그리드 (지수 카드, 종목 목록)
  - 차트: 전체 너비

데스크탑 (1024px~):
  - 상단 네비게이션 + 검색바 확장
  - 종목 상세: 좌측 차트 + 우측 시세/뉴스
  - 4열 지수 카드 그리드
```

---

## 5. 그림자 & 테두리

### 그림자
```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);       /* 카드 기본 */
--shadow-md:  0 4px 6px rgba(0,0,0,0.07);        /* 카드 호버 */
--shadow-lg:  0 10px 15px rgba(0,0,0,0.1);       /* 드롭다운, 모달 */
```

### 테두리
```css
border-radius: 8px;   /* rounded-lg — 카드, 버튼 기본 */
border-radius: 12px;  /* rounded-xl — 큰 카드 */
border-radius: 9999px; /* rounded-full — 배지, 태그 */
border-width: 1px;
border-color: var(--border);
```

---

## 6. 애니메이션 & 트랜지션

### 기본 트랜지션
```css
transition-all duration-200 ease-in-out  /* 버튼, 호버 효과 */
transition-all duration-300 ease-in-out  /* 카드 확장, 탭 전환 */
```

### 주식 특화 애니메이션
```
가격 변동 플래시:
  - 상승 시: 배경 빨강 → 투명 (300ms fade)
  - 하락 시: 배경 파랑 → 투명 (300ms fade)

숫자 카운트업:
  - 가격 변경 시 이전 → 현재 숫자 롤링 (200ms)

차트 로딩:
  - 좌→우 라인 드로잉 애니메이션 (500ms)

스켈레톤 로딩:
  - shadcn Skeleton 컴포넌트 사용
  - pulse 애니메이션 (1.5s infinite)
```

---

## 7. 아이콘 시스템

```
라이브러리: Lucide Icons (shadcn 기본)

주요 아이콘:
  Search        — 검색
  TrendingUp    — 상승
  TrendingDown  — 하락
  Star / StarOff — 관심종목 토글
  BarChart3     — 차트
  Newspaper     — 뉴스
  Globe         — 시장
  ArrowUpRight  — 상승 화살표
  ArrowDownRight — 하락 화살표
  Minus         — 보합
  CircleHelp    — 초보자 도움말
  Sun / Moon    — 다크모드 토글
  Menu          — 모바일 햄버거
  User          — 프로필
  LogIn / LogOut — 로그인/로그아웃
  Settings      — 설정
  ChevronRight  — 더보기
  ExternalLink  — 외부 링크 (뉴스 원문)
```

---

## 8. 다크모드

```
기본: 시스템 설정 따름 (prefers-color-scheme)
토글: 헤더에 Sun/Moon 아이콘으로 수동 전환
저장: localStorage에 테마 설정 저장

주의사항:
  - 주식 색상(상승/하락)은 다크모드에서도 동일 유지
  - 차트 배경: 다크모드 시 --background 사용
  - 차트 그리드: 다크모드 시 더 밝은 색상으로 조정
```
