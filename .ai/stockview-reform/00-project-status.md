# StockView 개편 기획 프로젝트 현황

> 최종 업데이트: 2026-03-25 14:01 KST

## 팀 구성

| 역할 | 이름 | 담당 |
|------|------|------|
| PM | pm-lead | 전체 분석 총괄, 기획자 조율, 최종 기획안 작성 |
| UX 기획자 | planner-ux | UI/UX 분석, 네비게이션 재설계 기획 |
| 기능 기획자 | planner-feature | API/데이터/기능 분석, 데이터품질+포트폴리오 기획 |

## 태스크 현황

| # | 태스크 | 상태 | 담당 |
|---|--------|------|------|
| 1 | 서비스 전체 분석 | ✅ 완료 | 전원 |
| 2 | 개편 영역 도출 및 개선안 기획 | ✅ 완료 | 전원 |
| 3 | 기능별 상세 기획서 | ✅ 완료 (3/3) | 전원 |
| 4 | Phase 1 네비게이션 재설계 상세 기획서 | ✅ 완료 | team-lead 직접 작성 |

## 산출물 목록

| 파일 | 내용 | 상태 |
|------|------|------|
| `01-current-service-analysis.md` | pm-lead 전체 서비스 분석 | ✅ 완료 |
| `02-ux-analysis.md` | planner-ux 상세 UX 분석 (7개 영역, 20개 개선항목) | ✅ 완료 |
| `03-feature-analysis.md` | planner-feature 상세 기능 분석 (6개 영역) | ✅ 완료 |
| `04-reform-plan.md` | 3-Phase 개편 로드맵 (pm-lead 취합) | ✅ 완료 |
| `ux-analysis.md` | 초기 UX 분석 | ✅ 완료 |
| `feature-analysis.md` | 초기 기능 분석 | ✅ 완료 |
| `spec-data-quality.md` | Phase 1 데이터 품질 개선 (5개 항목, ~70분) | ✅ 완료 |
| `spec-portfolio.md` | Phase 2 포트폴리오 기능 (신규8+수정5, ~6시간) | ✅ 완료 |
| `spec-navigation-redesign.md` | Phase 1 네비게이션 재설계 (5탭+메가메뉴, ~3시간) | ✅ 완료 |

## 핵심 발견 요약

### 버그 (즉시 수정 필요)
- Compare 페이지 API 경로: `/api/stock/` → `/api/stocks/`
- KR quotes 크론 PBR null 덮어쓰기

### 개편 3-Phase 로드맵
- **Phase 1 (1~2주)**: DailyPrice 보존 확장, Fundamentals 배치 증가, 버그 수정, 네비게이션 재설계
- **Phase 2 (1~2개월)**: 장중 시세 5분 폴링, 포트폴리오, 스크리너 필터, 온보딩
- **Phase 3 (3개월+)**: 알림, 수급 데이터, 뉴스 감성 분석, AI 리포트 자동화

### 참고사항
- CLAUDE.md의 DailyPrice 21일 삭제 기재는 outdated (실제 365일)
- AI 리포트 Ollama 로컬 의존 → Vercel 환경에서 자동생성 불가
- Rate Limit in-memory 방식 → Serverless에서 무의미

## 다음 단계
1. ~~`spec-navigation-redesign.md` 완성 대기~~ ✅ 완료
2. 구현 착수 (Phase 1 즉시 개선부터)
   - Compare API 버그 수정 (~5분)
   - PBR null 덮어쓰기 수정 (~10분)
   - BottomTabBar 5탭 변경 (~15분)
   - 메가메뉴 + Sheet 그룹핑 (~90분)
   - DailyPrice 보존 확장, Fundamentals 배치 증가 (~45분)
