# :active CSS 상태 구현 정리

## 배경

StockView 프로젝트 전체에 `:active` (클릭/터치 시 누름 피드백) CSS가 사실상 없었음.
`button.tsx`에 `active:translate-y-px` 하나만 존재했고, 나머지 34개 이상의 인터랙티브 요소에 클릭 피드백이 부재했음.

## 구현 방식

Tailwind CSS v4의 `active:` 유틸리티 클래스를 사용. 글로벌 CSS 추가 없이 컴포넌트별 인라인 클래스로 적용.

### 요소 유형별 전략

| 유형 | 스타일 | 이유 |
|------|--------|------|
| **버튼** | `active:brightness-95` | 배경색에 관계없이 약간 어두워지는 효과. 모든 variant에 일관 적용 가능 |
| **카드/링크 카드** | `active:scale-[0.98]` ~ `active:scale-[0.99]` | 살짝 줄어드는 느낌으로 눌림 표현. 크기가 큰 요소일수록 scale 변화를 작게 설정 |
| **리스트 행** | `active:bg-accent/70` | 배경색 변화로 선택 피드백. 행 레이아웃에 scale은 어색하므로 bg 변경 사용 |
| **아이콘/텍스트 버튼** | `active:opacity-70` | 최소한의 피드백. 작은 요소에 scale/brightness보다 자연스러움 |
| **토글/탭** | `active:scale-[0.98]` / `active:bg-muted/80` | 상태 전환 요소에 맞는 즉각적 피드백 |
| **뱃지 (링크)** | `[a]:active:brightness-90` | `<span>` 기본 렌더링 시에는 미적용, `<a>`로 렌더링될 때만 활성화 |

### transition 클래스 변경

`active:scale-*` 적용 시 transform 애니메이션이 필요하므로, 기존 `transition-shadow`나 `transition-colors`를 `transition-all`로 변경한 파일:

- `quick-link-card.tsx` (transition-shadow → transition-all)
- `news-card.tsx` (transition-shadow → transition-all)
- `market-filter-chips.tsx` (transition-colors → transition-all)
- `index-card.tsx` (transition-shadow → transition-all)
- `hero-section.tsx` (transition-colors → transition-all)

## 변경 파일 목록

### Core UI (5개)

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ui/button.tsx` | `active:brightness-95` 추가 (기존 `active:translate-y-px` 유지) |
| `src/components/ui/badge.tsx` | `[a]:active:brightness-90` 추가 |
| `src/components/ui/toggle.tsx` | `active:bg-muted/80` 추가 |
| `src/components/ui/tabs.tsx` | TabsTrigger에 `active:scale-[0.98]` 추가 |
| `src/components/ui/dropdown-menu.tsx` | MenuItem, SubTrigger에 `active:bg-accent/80` 추가 |

### 커스텀 컴포넌트 (5개)

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ui/quick-link-card.tsx` | `active:scale-[0.98]` 추가 |
| `src/components/market/stock-row.tsx` | `active:bg-accent/70` 추가 |
| `src/components/news/news-card.tsx` | `active:scale-[0.99]` 추가, 내부 NewsLink에 `active:!opacity-100`으로 이중 피드백 방지 |
| `src/components/market/market-filter-chips.tsx` | 탭/칩 버튼에 `active:scale-[0.98]` 추가 |
| `src/components/market/index-card.tsx` | `active:scale-[0.98]` 추가 |

### 기타 인터랙티브 요소 (5개)

| 파일 | 변경 내용 |
|------|----------|
| `src/components/home/hero-section.tsx` | 피처 카드 링크에 `active:scale-[0.98]` 추가 |
| `src/components/news/news-link.tsx` | `active:opacity-80` 추가, `cn()` 유틸 사용으로 교체 |
| `src/components/board/comment-item.tsx` | 답글/수정/삭제 버튼에 `active:opacity-70` 추가 |
| `src/components/portfolio/portfolio-row.tsx` | 수정/삭제 버튼에 `active:opacity-70` 추가 |
| `src/components/common/tooltip-helper.tsx` | 트리거 버튼에 `active:opacity-70` 추가 |

## 코드 리뷰 후 수정사항

| 이슈 | 수정 내용 |
|------|----------|
| badge.tsx에 비인터랙티브 `<span>`에도 active 적용됨 | `[a]:active:brightness-90`으로 변경하여 링크일 때만 적용 |
| news-link.tsx에서 className 문자열 직접 결합 | `cn()` 유틸리티 사용으로 교체하여 클래스 충돌 방지 |
| NewsCard에서 Card scale + NewsLink opacity 이중 피드백 | NewsLink에 `active:!opacity-100` 전달하여 내부 opacity 무효화 |
| market-filter-chips의 scale 값이 tabs와 불일치 (0.97 vs 0.98) | 0.98로 통일 |

## 테스트 체크리스트

- [ ] 버튼 전체 variant (default, outline, secondary, ghost, destructive, link) 클릭 피드백 확인
- [ ] 카드 클릭 (뉴스, 종목, 지수, 퀵링크) scale 애니메이션 확인
- [ ] 커스텀 버튼 (필터 칩, 댓글 액션, 포트폴리오 수정/삭제) opacity 변화 확인
- [ ] 다크 모드에서 brightness/opacity 대비 확인
- [ ] 모바일 터치 인터랙션 실기기 테스트
- [ ] 키보드 접근성: Tab + Enter 시 active가 아닌 focus만 표시되는지 확인
