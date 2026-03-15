# Task Plan: 주식 웹페이지 프로젝트

## Goal
주식 관련 웹 서비스를 기획 → 디자인 → 프론트엔드 → 백엔드 단계별로 체계적으로 구축한다.

## Current Phase
Phase 4 complete → Phase 5 대기

## Roles

### 🎯 기획자 (Product Planner)
- 서비스 목표 및 핵심 기능 정의
- 사용자 시나리오 및 와이어프레임 작성
- 페이지 구조(IA) 설계
- 기능 요구사항 명세서(PRD) 작성

### 🎨 디자이너 (UI/UX Designer)
- 디자인 시스템 (컬러, 타이포그래피, 컴포넌트)
- 페이지별 UI 디자인 가이드
- 반응형 레이아웃 설계
- 인터랙션 & 애니메이션 명세

### 💻 프론트엔드 개발자 (Frontend Developer)
- 프로젝트 셋업 및 기술 스택 선정
- 컴포넌트 개발 및 페이지 구현
- API 연동 및 상태 관리
- 성능 최적화 및 테스트

### 🔧 백엔드 개발자 (Backend Developer)
- API 설계 및 데이터베이스 스키마
- 주식 데이터 수집/가공 파이프라인
- 인증/인가 시스템
- 배포 및 인프라 구성

---

## Phases

### Phase 1: 기획 — 요구사항 & 서비스 정의
- [x] 서비스 목표 및 타겟 사용자 정의 → `.ai/prd.md` §1
- [x] 핵심 기능 목록 도출 (MVP 범위) → `.ai/prd.md` §2, §7
- [x] 페이지 구조(IA) 설계 → `.ai/prd.md` §3
- [x] 사용자 시나리오 작성 → `.ai/prd.md` §4
- [x] 와이어프레임 작성 → `.ai/wireframe.md`
- [x] PRD(기능 요구사항 명세서) 작성 → `.ai/prd.md`
- **Status:** complete

### Phase 2: 디자인 — UI/UX 설계
- [x] 디자인 시스템 정의 (컬러, 폰트, 간격 등) → `.ai/design-system.md` §1-3
- [x] 주요 페이지 UI 가이드 작성 → `.ai/design-system.md` §4-8 + `.ai/wireframe.md`
- [x] 컴포넌트 명세서 → `.ai/component-spec.md`
- [x] 반응형 브레이크포인트 정의 → `.ai/design-system.md` §4
- **Status:** complete

### Phase 3: 백엔드 — API & 데이터 설계
- [x] 기술 스택 선정 → `.ai/backend-spec.md` §1
- [x] 데이터베이스 스키마 설계 → `.ai/backend-spec.md` §2
- [x] API 엔드포인트 설계 (REST) → `.ai/backend-spec.md` §3
- [x] 주식 데이터 소스 선정 및 수집 로직 → `.ai/data-pipeline.md` (전면 재설계)
- [x] 인증 시스템 설계 → `.ai/backend-spec.md` §5
- [ ] 백엔드 구현 → Phase 4와 함께 진행
- **Status:** complete (설계 완료, 구현은 Phase 4에서)

### Phase 4: 프론트엔드 — 구현
- [x] 프로젝트 셋업 (Next.js 15 + TypeScript + Tailwind + shadcn/ui)
- [x] 디자인 시스템 컴포넌트 구현 (20개 컴포넌트)
- [x] API 라우트 구현 (14개 엔드포인트)
- [x] 페이지별 구현 (8개 페이지)
- [x] API 연동 및 상태 관리 (TanStack Query)
- [x] 반응형 & 모바일 대응 (BottomTabBar, 반응형 헤더)
- **Status:** complete

### Phase 5: 통합 테스트 & 배포
- [x] 배포 파이프라인 구성 (GitHub Actions Cron + Vercel)
- [x] DB 시딩 스크립트 (40개 종목, 지수, 환율, 뉴스)
- [x] Cron API 라우트 스텁 (KR/US 시세, 뉴스)
- [x] 배포 가이드 문서 (.ai/DEPLOYMENT.md)
- [ ] Supabase DB 연결 & 마이그레이션 (사용자 직접 진행)
- [ ] Vercel 배포 (사용자 직접 진행)
- **Status:** in_progress (코드 완료, 사용자 설정 대기)

## Key Questions (Answered)
1. **타겟 사용자** → 초보 투자자
2. **대상 시장** → 한국주식 + 미국주식
3. **데이터 요구사항** → 실시간 불필요. 분석용 데이터 (장전/장후 데이터)
4. **핵심 기능** → 시세 조회, 뉴스, 차트
5. **기술 스택** → React + Next.js + TypeScript + shadcn/ui
6. **인증** → 회원가입 필요

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| .ai 폴더에 기획 문서 관리 | 프로젝트 루트 정리 + AI 기획 문서 분리 |
| 초보 투자자 타겟 | 직관적 UI, 용어 설명, 간결한 정보 제공 필요 |
| 한국+미국 주식 | 두 시장 모두 지원, 환율 정보도 필요 |
| 분석용 데이터 (장전/장후) | 실시간 시세 불필요, 일봉/주봉 등 분석 데이터 중심 |
| React + Next.js + TS + shadcn | 모던 스택, SSR 지원, 일관된 UI 컴포넌트 |
| 시세조회 + 뉴스 + 차트 MVP | 핵심 3대 기능 우선 구현 |
| Next.js API Routes (풀스택) | 별도 백엔드 서버 없이 프론트와 동일 프로젝트 |
| PostgreSQL + Prisma | 타입 안전, 관계형 데이터에 적합 |
| 한투 API + Yahoo Finance | 한국/미국 각각 최적의 데이터 소스 |
| JWT 세션 전략 | 서버 세션 저장소 불필요, Vercel 호환 |
| 15분 지연 데이터 + 캐싱 | 실시간 불필요 요구사항에 맞춤 |
| Cron → DB → API 단방향 흐름 | 사용자 요청 시 외부 API 호출 안 함. DB만 서빙 |
| 캐시 TTL = Cron 주기 | DB가 15분마다 갱신되므로 캐시도 15분. 불필요한 refetch 제거 |
| 뉴스 30일 보관, 일봉 5년 보관 | 데이터 정리 정책으로 DB 크기 관리 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- 각 Phase는 해당 Role이 주도하되, 다른 Role과 협업 필요
- Phase 1(기획)이 완료되어야 이후 단계 진행 가능
- MVP 우선 접근: 핵심 기능부터 구현 후 확장
