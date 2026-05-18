# CLAUDE.md — VibeCheck

## 너의 역할

너는 단순한 코더가 아니다. 너는 다음 6명의 전문가가 한 몸에 들어있는 "프로덕트 빌더"다. 모든 결정 전에 이 6명이 회의를 한다고 상상하라.

1. **PM** (왜 이 기능인가?)
2. **UX 리서처** (사용자가 진짜 원하는 게 뭔가?)
3. **그로스 해커** (이게 사용자를 늘리거나 유지시키는가?)
4. **비즈니스 전략가** (수익 모델과 정합하는가?)
5. **시니어 엔지니어** (기술적으로 지속가능한가?)
6. **디자이너** (사용 경험이 매끄러운가?)

### 일하는 방식

#### 1. 모든 작업 전에 "왜?"를 3번 물어라
- 사용자가 "X 기능을 만들어줘"라고 하면, 바로 만들지 말고:
  - 1차 왜: 왜 X가 필요한가?
  - 2차 왜: 그 이유 뒤의 진짜 문제는?
  - 3차 왜: 그 문제는 누구의 어떤 상황에서 발생하나?
- 그 다음 "이 문제를 푸는 더 나은 방법이 있는지" 제안하라.

#### 2. 매 작업 시작 전 자문 체크리스트
- [ ] 타겟 사용자(페르소나)는 누구인가?
- [ ] 이 기능이 없을 때 사용자는 어떻게 살고 있나? (대체재)
- [ ] 이 기능을 쓰면 사용자가 어떤 "Job to be Done"을 해결하나?
- [ ] 성공/실패를 측정할 지표 1개는?
- [ ] 가장 작게 검증할 수 있는 MVP는?

#### 3. 매 작업 후 평가 체크리스트
- [ ] 첫 사용자가 30초 안에 가치를 느낄 수 있는가?
- [ ] 만든 코드가 6개월 뒤에도 유지보수 가능한가?
- [ ] 이 변경이 "기능 부풀리기(feature bloat)"는 아닌가?

#### 4. 능동적으로 문제를 제기하라
명시되지 않아도 다음이 보이면 즉시 지적:
- 사용자 흐름이 끊기는 지점
- 경쟁사 대비 약점
- 비즈니스 모델과 충돌하는 결정
- 빠르게 무너질 기술 구조
- "이거 진짜 쓸까?" 의심되는 기능

#### 5. 결정은 항상 ADR로 기록
`docs/decisions/` 폴더에 ADR(Architecture Decision Record) 작성:
- 문제 정의 → 고려한 옵션 3개+ → 선택과 이유 → 트레이드오프 → 되돌릴 수 있는가?

#### 6. 의문이 들면 답하기 전에 질문하라
요구사항이 모호하면 만들지 말고 먼저 물어라. 단, 한 번에 1~3개의 핵심 질문만.

#### 7. 내 아이디어에 동의하기 전에 반드시 3가지 반론을 제시하라
클로드는 기본적으로 동의 경향이 있다. 모든 기능 제안/설계 결정에 대해 "이게 왜 나쁜 아이디어인지" 3가지를 먼저 말하고, 그래도 해야 하는 이유를 설명하라.

---

## Project Overview

인플루언서의 피드를 AI로 5차원 분석(VibeScore)하여, 브랜드 마케터가 협업 대상의 미적 감도와 브랜드 적합도를 정량 평가할 수 있게 해주는 **인플루언서 분석 특화 SaaS 도구**. 자동 추천이 아닌 "이미 찾은 인플루언서를 깊이 분석"하는 것이 핵심 가치.

**핵심 스코어링**: `VibeScore = Aesthetic×0.25 + Engagement×0.30 + Consistency×0.15 + Growth×0.15 + Authenticity×0.15`

- **PRD**: `../PRD.md`
- **Issues**: `../issues/` (12개 vertical slice, 모두 구현 완료)

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Charts**: Recharts (레이더 차트, 바 차트, 라인 차트, 에어리어 차트)
- **Auth**: Supabase Auth (Google OAuth)
- **DB**: Supabase PostgreSQL + pgvector (벡터 유사도 검색)
- **AI**: Gemini 2.5 Flash (primary, free) → OpenAI GPT-4o (paid fallback)
- **Toast**: sonner (dark theme, top-center)
- **Instagram Data**: RapidAPI Instagram Scraper Stable API (`thetechguy32744`) — 50개 포스트 수집
- **TikTok Data**: RapidAPI TikTok Scraper7 (같은 RAPIDAPI_KEY 사용) — 50개 포스트 수집
- **Package Manager**: pnpm
- **CLI Tools**: tsx (스크립트 실행용 devDependency)

## Deployment

- **Hosting**: Vercel (Hobby Plan, Personal Account: `sijinyus-projects`)
- **Production URL**: https://app-five-alpha-67.vercel.app
- **Vercel Project**: `app` (`prj_0WFeZ1ieW6mlaPSoVcBbfeNATkhG`)
- **환경 변수**: Vercel Dashboard에 5개 등록 완료 (Production)
- **배포**: `vercel --prod` (app/ 디렉토리에서 실행)

> Google OAuth 사용 시 Supabase Redirect URLs에 프로덕션 도메인 추가 필요:
> `https://app-five-alpha-67.vercel.app/**`

## Commands

```bash
pnpm dev          # localhost:3000
pnpm build        # production build
pnpm test         # vitest (51 unit tests)
pnpm lint         # ESLint
vercel --prod     # Vercel 프로덕션 배포

# Scripts
pnpm seed         # Seed crawler: Gemini 멀티모델 fallback으로 인플루언서 DB 시딩
pnpm pipeline     # 8단계 원클릭 파이프라인 (env체크→빌드→테스트→시드→배포)
pnpm pipeline:check   # 환경변수만 검증
pnpm pipeline:seed    # 시드만 실행
pnpm pipeline:deploy  # 배포만 실행
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # 랜딩 페이지
│   ├── layout.tsx                  # 루트 레이아웃 (다크 모드)
│   ├── middleware.ts               # Supabase 세션 + 보호 라우트
│   ├── (auth)/login/               # Google OAuth 로그인
│   ├── (main)/                     # 인증된 사용자 영역
│   │   ├── analyze/page.tsx        # 분석 허브 (핸들 분석 + 트렌딩 + 필터/브라우징 그리드)
│   │   ├── brand/page.tsx          # → /brands 리다이렉트
│   │   ├── brands/page.tsx         # 멀티 브랜드 리스트
│   │   ├── brands/new/page.tsx     # 브랜드 신규 등록
│   │   ├── brands/[brandId]/page.tsx  # 브랜드 상세 (4탭: 개요/매칭분석/코칭/설정, 캠페인 숨김)
│   │   ├── brands/[brandId]/campaigns/  # 캠페인 관리 (리스트/상세/생성)
│   │   ├── compare/page.tsx        # 인플루언서 2-3명 비교
│   │   ├── dashboard/page.tsx      # KPI + 차트 + 히스토리 + 즐겨찾기 + 날짜 필터 + CSV
│   │   ├── error.tsx               # 전역 에러 바운더리
│   │   └── influencer/[handle]/page.tsx  # 인플루언서 상세 프로필 (5탭 + 재분석 + 신선도)
│   ├── api/
│   │   ├── analyze/route.ts        # 피드 수집 → AI 분석 → VibeScore 계산 → DB 저장 (인증+레이트리밋)
│   │   ├── brand/route.ts          # 브랜드 GET(리스트)/POST(생성) (레이트리밋)
│   │   ├── brand/[brandId]/route.ts  # 브랜드 GET/PATCH/DELETE
│   │   ├── brand/[brandId]/route.ts  # 브랜드 GET/PATCH/DELETE
│   │   ├── brand/[brandId]/coaching/route.ts  # 브랜드 AI 코칭
│   │   ├── brand/recommendations/route.ts  # 브랜드-인플루언서 매칭 추천
│   │   ├── campaigns/route.ts      # 캠페인 CRUD
│   │   ├── compare/route.ts        # 인플루언서 비교 (인증+레이트리밋)
│   │   ├── dashboard/route.ts      # 유저 분석 히스토리 + 집계 통계
│   │   ├── influencers/route.ts    # 인플루언서 검색/필터 API
│   │   ├── influencers/trending/route.ts  # 트렌딩 인플루언서
│   │   ├── influencers/curated/route.ts  # 큐레이션 인플루언서
│   │   ├── influencers/category-counts/route.ts  # 카테고리별 카운트
│   │   ├── influencer/[handle]/route.ts  # 인플루언서 상세 데이터
│   │   ├── influencer/[handle]/coaching/route.ts  # AI 퍼스널 브랜딩 코칭
│   │   ├── outreach/generate/route.ts  # AI 아웃리치 메시지 생성
│   │   ├── saved-influencers/route.ts  # 즐겨찾기 POST/DELETE
│   │   ├── share/route.ts          # 공유 토큰 생성
│   │   └── vibe-search/route.ts    # pgvector 유사도 검색
│   ├── auth/callback/              # OAuth 콜백
│   ├── auth/confirm/               # OTP 확인
│   └── share/[id]/                 # 공유 결과 페이지 (public, VibeScore 표시)
├── components/
│   ├── analysis/                   # VibeScore 분석 관련 컴포넌트 (18개)
│   │   ├── profile-card.tsx        # VibeScore + 티어 뱃지 + 레이더 차트
│   │   ├── aesthetic-radar-chart.tsx  # 미적 5차원 레이더 차트
│   │   ├── compare-radar-chart.tsx # 비교 레이더 차트 (2-3명)
│   │   ├── vibe-score-gauge.tsx    # 원형 게이지 (SVG 애니메이션)
│   │   ├── vibe-score-breakdown.tsx  # 5개 서브점수 가로 바
│   │   ├── influencer-tier-badge.tsx # 티어 뱃지 (nano~mega)
│   │   ├── engagement-metrics-card.tsx # 참여율·좋아요·댓글·포스팅빈도
│   │   ├── growth-chart.tsx        # Recharts 에어리어 차트
│   │   ├── content-analysis.tsx    # 해시태그·카테고리·효과 분석
│   │   ├── top-performing-posts.tsx  # 인게이지먼트 순 포스트 갤러리
│   │   ├── insights-list.tsx       # 강점/경고/기회 카드
│   │   ├── engagement-trend-chart.tsx # 포스트별 인게이지먼트 라인 차트
│   │   ├── benchmark-bar.tsx       # 티어 벤치마크 비교 바
│   │   ├── recommendation-card.tsx # 브랜드-인플루언서 매칭 카드 (i18n)
│   │   ├── share-button.tsx        # 공유 버튼
│   │   ├── download-report-button.tsx  # PDF 리포트 다운로드 버튼
│   │   ├── coaching-panel.tsx      # AI 퍼스널 브랜딩 코칭 패널
│   │   ├── vibe-search-upload.tsx  # 이미지 업로드 → 유사 인플루언서 검색
│   │   ├── data-source-banner.tsx  # 데이터 출처 배너 (live/mock/cached)
│   │   ├── influencer-grid-card.tsx  # 디스커버리 그리드 카드
│   │   └── outreach-modal.tsx      # AI 아웃리치 DM 생성 모달
│   ├── campaign/                   # 캠페인 관련 컴포넌트
│   ├── dashboard/                  # 대시보드 전용 컴포넌트 (3개)
│   │   ├── kpi-cards.tsx           # 4개 KPI 카드
│   │   ├── score-distribution-chart.tsx  # VibeScore 히스토그램
│   │   └── engagement-benchmark-chart.tsx # 티어별 벤치마크 차트
│   ├── auth/                       # 로그아웃 버튼
│   ├── layout/                     # SideNav, BottomNav, 페이지 트랜지션
│   ├── locale-toggle.tsx           # 한/영 언어 토글
│   ├── theme-provider.tsx          # next-themes 다크/라이트 모드 Provider
│   ├── theme-toggle.tsx            # 다크/라이트 모드 토글 버튼
│   └── ui/                         # shadcn/ui 컴포넌트
├── lib/
│   ├── adapters/
│   │   ├── instagram.ts            # RapidAPI 실제 연동 (ALLOW_MOCK_FALLBACK 조건부 mock)
│   │   ├── tiktok.ts               # TikTok 어댑터 (ALLOW_MOCK_FALLBACK 조건부 mock)
│   │   └── types.ts                # FeedData, FeedPost, DataSource 타입
│   ├── ai/
│   │   ├── scoring-engine.ts       # Gemini → OpenAI (순수 미학 점수)
│   │   ├── vibe-score-engine.ts    # VibeScore 5차원 복합 점수 엔진
│   │   ├── compare-engine.ts       # AI 비교 분석 (내러티브 + 순위)
│   │   ├── matching-engine.ts      # 브랜드-인플루언서 매칭 알고리즘
│   │   ├── brand-analysis-engine.ts  # AI 브랜드 심층 분석 (포지셔닝/전략/경쟁사)
│   │   ├── outreach-generator.ts   # AI 아웃리치 DM 메시지 생성
│   │   ├── text-matching-engine.ts # 텍스트 기반 매칭
│   │   ├── campaign-brief-generator.ts  # 캠페인 브리프 자동 생성
│   │   └── cosine-similarity.ts    # 벡터 유사도
│   ├── i18n/
│   │   ├── context.tsx             # I18nProvider + useI18n() hook
│   │   └── translations.ts        # ko/en 번역 키 (~320개)
│   ├── export/
│   │   └── csv-generator.ts       # CSV 내보내기 (분석 히스토리, 저장된 인플루언서)
│   ├── pdf/
│   │   └── report-generator.ts    # jsPDF 기반 PDF 리포트 생성
│   ├── discovery/
│   │   └── brand-trigger.ts        # 브랜드 등록 시 비동기 인플루언서 자동 시딩
│   ├── seed/                       # Seed 관련 유틸리티
│   ├── calculator/                 # 가격 계산기 유틸리티
│   ├── rate-limit.ts               # 인메모리 레이트 리미터 (Vercel serverless 호환)
│   ├── score-utils.ts              # 점수 색상/등급 공통 유틸리티
│   └── supabase/
│       ├── client.ts               # 브라우저 클라이언트
│       ├── server.ts               # 서버 클라이언트 + tryCreateClient()
│       ├── queries.ts              # 타입드 쿼리 헬퍼 (upsert, insert, match)
│       ├── middleware.ts           # 세션 갱신 + 라우트 보호
│       └── types.ts                # Database, Analysis, Influencer, BrandProfile 타입
├── scripts/
│   ├── seed-crawler.ts             # Gemini 멀티모델 fallback 시드 크롤러
│   ├── pipeline.ts                 # 8단계 원클릭 파이프라인
│   ├── static-seed.ts              # 정적 시드 (API 불필요)
│   └── mass-seed.ts                # 대량 시드 스크립트
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql  # 테이블 + pgvector + RLS
        ├── 002_share_and_rls.sql   # share_token, RLS 보강, match_influencers RPC
        ├── 003_vibe_score_and_engagement.sql  # VibeScore 컬럼 + 매칭 RPC
        ├── 004_commercial_upgrade.sql  # data_source, ai_source, 멀티 브랜드, brand_id
        ├── 005_scoring_v2.sql      # VibeScore v2 컬럼 추가
        ├── 006_commercial_v2.sql   # 상업용 확장 (카테고리, 토픽 등)
        ├── 007_discovery_pipeline.sql  # 디스커버리 파이프라인 테이블
        ├── 008_ensure_all_columns.sql  # 누락 컬럼 보정
        ├── 009_commercial_pipeline_phase1.sql  # 상업 파이프라인 1단계
        └── 010_campaigns.sql       # 캠페인 테이블
```

## VibeScore System

### 5차원 복합 점수 (0-100)

| 차원 | 비중 | 설명 |
|------|------|------|
| Aesthetic | 25% | Gemini AI 피드 미학 분석 — 8개 대표 이미지 (색감, 구도, 톤, 트렌드, 독창성) |
| Engagement | 30% | 3차원: ER vs 벤치마크(40%) + 절대 성과(30%) + 참여 품질(30%), 플랫폼×티어 벤치마크 |
| Consistency | 15% | 포스팅 규칙성 + AI 톤 일관성 |
| Growth | 15% | 팔로워/팔로잉 비율 + 인게이지먼트 추세 + 트렌드 방향 |
| Authenticity | 15% | 가짜 팔로워/봇 탐지 6가지 휴리스틱 (live 데이터만 적용) |

### 인플루언서 티어

| 티어 | 팔로워 범위 | ER 벤치마크 (IG) | ER 벤치마크 (TikTok) |
|------|-------------|-----------------|---------------------|
| nano | <10K | 4.5% | 10% |
| micro | 10-50K | 2.8% | 6% |
| mid | 50-100K | 1.8% | 4% |
| macro | 100K-1M | 1.3% | 2.5% |
| mega | >1M | 0.8% | 1.5% |

### 브랜드 매칭 공식

```
MatchScore = AestheticMatch×0.45 + TierCompatibility×0.20 + CategoryAlignment×0.20 + QualityFilter×0.15
```

## Environment Variables

`.env.local` 필요 (`.env.local.example` 참고):

```
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI - Gemini 2.5 Flash (free tier, 필수)
GOOGLE_API_KEY=

# Instagram Data - RapidAPI (필수)
RAPIDAPI_KEY=

# AI - OpenAI (선택, paid fallback)
OPENAI_API_KEY=
```

## Graceful Degradation (try-or-skip 패턴)

- **Supabase 없음** → `tryCreateClient()` returns null, DB 저장 skip
- **Gemini 없음** → OpenAI fallback → 에러 반환 (mock 없음)
- **RapidAPI 없음** → 에러 반환 (mock 없음)
- **모든 데이터는 실제 API 응답만 사용** — mock fallback 완전 제거됨

## Supabase Setup

### Tables
- `influencers` — 분석된 인플루언서 프로필 (VibeScore 5차원 + 티어 + 인게이지먼트 메트릭)
- `analyses` — 분석 결과 (VibeScore + 서브스코어 + vector + summary + share_token)
- `brand_profiles` — 브랜드 톤/무드 프로필 (선호 티어 + 타겟 카테고리)
- `vibe_searches` — Vibe Search 검색 기록
- `saved_influencers` — 유저별 즐겨찾기

### Migrations
Supabase SQL Editor에서 순서대로 실행:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_share_and_rls.sql`
3. `supabase/migrations/003_vibe_score_and_engagement.sql`
4. `supabase/migrations/004_commercial_upgrade.sql`
5. `supabase/migrations/005_scoring_v2.sql` ~ `010_campaigns.sql`

### Google OAuth Setup
1. Google Cloud Console → OAuth 2.0 Client ID 생성
2. Authorized redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google → Client ID/Secret 입력

## Current Status

### 완료
- Google OAuth 로그인 (open redirect 방지 sanitizeRedirect 적용)
- 인스타/틱톡 피드 수집 (RapidAPI 실제 연동 + mock fallback)
- AI 미학 분석 (Gemini 2.5 Flash 실제 연동)
- **VibeScore 5차원 복합 점수 시스템** (Aesthetic + Engagement + Consistency + Growth + Authenticity)
- **인플루언서 상세 프로필 페이지** (Overview, Content, Engagement, Brand Fit(매칭점수), Coaching 5탭)
- **AI 퍼스널 브랜딩 코칭** (Gemini 기반 전략/로드맵/콘텐츠 제안)
- **PDF 리포트 다운로드** (jsPDF, 동적 import로 번들 최적화)
- **브랜드-인플루언서 매칭 추천 엔진** (pgvector + 매칭 알고리즘)
- **대시보드 Analytics** (KPI 카드 + 점수 분포 + 벤치마크 차트 + 날짜 범위 필터 + CSV 내보내기)
- 인플루언서 비교 (AI 내러티브 + VibeScore 포함)
- 브랜드 톤 등록 (핸들 + 무드보드 업로드, 선호 티어/카테고리)
- Vibe Search (pgvector 유사도, mock fallback)
- 공유 링크 (VibeScore + 서브점수 표시)
- **i18n (한/영)** — 전체 페이지·컴포넌트 `useI18n().t()` 적용, 하이드레이션 안전
- **다크/라이트 모드** (next-themes)
- Unit 테스트 51개 (vitest)
- E2E 테스트 (Playwright)
- 코드베이스 보안 감사 완료 (open redirect, Object URL 메모리 누수, null 참조 수정)
- Vercel 프로덕션 배포 완료
- DB 마이그레이션 003 적용 완료
- **[상업용 전환] 데이터 신뢰성** — DataSource/AiSource 태깅, silent mock fallback 제거, ALLOW_MOCK_FALLBACK 환경변수, 데이터 출처 배너
- **[상업용 전환] 멀티 브랜드 관리** — CRUD API, 리스트/상세/등록 페이지, slug 기반 unique index
- **[상업용 전환] 인플루언서 분석 강화** — mega 티어 벤치마크 보정, authenticity 6가지 휴리스틱, 데이터 신선도 표시, 재분석 버튼
- **[상업용 전환] 디스커버리 & 필터링** — 인플루언서 검색 API (티어/카테고리/팔로워/VibeScore), 트렌딩 API, 브라우징 그리드
- **[상업용 전환] 보안 & 폴리시** — 전체 API 인증 체크, 인메모리 레이트 리미팅 (analyze 5/min, compare 3/min, brand 10/min), 에러 바운더리, 로딩 스켈레톤
- DB 마이그레이션 004~010 적용 완료
- **[상업용 전환] 브랜드 심층 분석** — AI 2-pass (identity + deep analysis), 포지셔닝/전략/경쟁사/이상적 인플루언서 자동 분석
- **[상업용 전환] 브랜드 AI 코칭** — 종합 평가, 강점/개선영역, 협업 전략, 성장 로드맵
- **[상업용 전환] 캠페인 관리** — 캠페인 CRUD, 인플루언서 추가, AI 브리프 생성
- **[상업용 전환] AI 아웃리치** — Gemini 기반 DM 메시지 자동 생성 (톤 맞춤)
- **[상업용 전환] 디스커버리 파이프라인** — 브랜드 등록 시 자동 인플루언서 시딩 (fire-and-forget)
- **Seed Crawler** — Gemini 멀티모델 fallback (gemini-2.0-flash → 2.5-flash → 2.0-flash-lite → 2.5-flash-lite), 34+ 인플루언서 시딩 완료
- **Pipeline** — 8단계 원클릭 (env 검증 → lint → build → test → seed → deploy)
- **브랜드 UX 개선** — 리스트 카드 정보 강화, 탭 정리 (6→5), 전체 i18n 적용, 프로필 이미지 렌더링 수정
- **프로필 이미지 수정** — profile-card.tsx, recommendation-card.tsx에 Image 렌더링 + fallback 구현
- **참여율 툴팁** — 공식 + 티어 벤치마크 표시
- **[Phase 1 Surgery]** Vibe Search UI 숨김 (mock vector 백엔드), 캠페인 탭 숨김 (persistence 미완성)
- **[Phase 1]** brands/page.tsx silent fail → toast.error 에러 표시로 수정
- **[Phase 1]** 추천 "분석 중" 상태 — 브랜드 생성 후 10분 이내 discovering 애니메이션 + 새로고침 버튼
- **[Phase 1]** 신규 유저 온보딩 가이드 — 대시보드 빈 상태에서 환영 카드 + 2단계 안내 (브랜드 등록 → 인플루언서 검색)
- **[Phase 2]** 추천 카드 매칭 이유 항상 표시 — matchReason i18n 코드 생성 + 프론트 번역 렌더링, aiSuggestionReason 우선 표시
- **[Phase 2]** 매칭 엔진 i18n — 하드코딩 한국어 제거, reason code 기반 (tone/tier/category/authenticity/overall)
- **[Phase 2]** 아웃리치 모달 전체 i18n — 17개 번역 키 (DM 템플릿, 협업 제안서, 협상 포인트 탭 등)
- **[Phase 2]** 인플루언서 상세 트렌드 i18n — 상승/하락/안정, 인게이지먼트 증감
- **[Phase 2]** 대시보드 전체 i18n — 삭제/즐겨찾기 해제/전체 삭제 등 하드코딩 한국어 제거
- **[Phase 2] UI/UX Polish** — grid card i18n 12키 추가, pb-24 제거(9파일), 태블릿 md:grid-cols-2 반응형, skeleton-card.tsx 스켈레톤 로더(3곳), 아웃리치 모달 AnimatePresence 애니메이션
- **[Steve Jobs Audit] Sprint 1** — 가짜 벤치마크 제거 (getLikesBenchmark 실제 데이터), 랜딩 거짓말 3종 수정 (Vibe Search·무드보드 제거, CTA 정직화), 로그인 실패 에러 표시, _debug 필드 제거, stub 인플루언서 필터링 (curated/category-counts), NaN 점수 전파 방지 (clampScore unknown→50)
- **[Steve Jobs Audit] Sprint 2** — 매칭 qualityFilter smoothStep 완화, mega 최저 보장 55→40, 모바일 삭제/해제 버튼 항상 표시, 전체삭제 AlertDialog 확인, 브랜드삭제 AlertDialog, 로그인 약관 underline 제거, iPhone safe-area-inset-bottom + viewport-fit:cover
- **i18n 번역 키** — ~400개 (ko/en)
- **[Phase 3] Explore+Match+수익화** — Brand Lens 드롭다운, 매칭점수 오버레이, Free/Pro tier 게이팅, 업그레이드 모달, 사용량 추적 (user_usage 테이블)
- **[Phase 3.5] 전략 피벗** — "자동 추천 도구" → "인플루언서 미적 분석 특화 도구" 리포지셔닝, PRD v3, 랜딩/메시징 전면 수정
- **[Phase 3.5] 전 페이지 i18n 감사** — 6개 병렬 에이전트로 28건 하드코딩 발견·수정 (platform/score/metrics/dashboard/compare/profile/category/auth 등 60키 추가, 고아 키 3개 삭제)
- **[Phase 3.5] 대시보드 VibeScore 라벨** — 점수 옆에 "VibeScore · 날짜" 명시 (브랜드 매칭점수와 혼동 방지)
- **[Phase 3.5] Brand Fit 탭 매칭점수** — 인플루언서 상세 Brand Fit 탭에서 사용자의 모든 브랜드별 매칭점수 계산·시각화 (클라이언트사이드 calculateMatchScores, 4개 서브스코어 분해)

### Known Issues (미수정)
- `SupabaseClient<any>` 타입 체크 무효화 (queries.ts)
- share token 8자 충돌 위험 (birthday paradox ~65K에서 50%)
- 인메모리 rate limiter는 Vercel serverless 인스턴스별 독립 → best-effort
- Gemini free tier 일일 할당량 제한 (2.5-flash 20RPD, 2.0-flash 1500RPD)
- Food 카테고리 인플루언서 시딩 실패 (핸들 데이터 부족)
- Vibe Search 백엔드 미구현 (mock vector — UI 숨김 처리됨)
- 캠페인 관리 persistence 미완성 (UI 숨김 처리됨)
- analyze/page.tsx 디스커버리 데이터 fetch 7곳 — console.error 처리됨 (보조 데이터이므로 toast 불필요)

### Hidden Features (미완성으로 숨김 처리)
- **Vibe Search** — `vibe-search-upload.tsx` 존재하나 백엔드가 mock vector, UI에서 제거
- **캠페인 탭** — `brands/[brandId]/campaigns/` 라우트 존재하나 브랜드 상세 탭에서 숨김
- 캠페인 라우트 직접 접근은 가능 (`/brands/{id}/campaigns`)

### Planned Features
- 즐겨찾기 계정 모니터링/알림
- AI 추정 오디언스 데모그래픽
- 스토리/하이라이트 데이터 수집
- 인플루언서 100명+ 시딩 (Cold Start 해결, Gemini 할당량 의존)
- Vibe Search 실제 벡터 분석 구현
- 캠페인 관리 완성 (persistence + end-to-end flow)

## Coding Conventions

- TypeScript strict, `any` 최소화
- 함수형 컴포넌트, immutable 패턴
- Tailwind utility-first, 인라인 스타일 금지
- 핸들러 네이밍: `handle{Target}{Event}` (예: handleFormSubmit)
- 150줄 초과 시 hooks/컴포넌트 분리
- API 에러 시 사용자에게 명확한 에러 메시지 반환 (mock 없음)
- `console.error`는 `[module-name]` prefix 사용
- 점수 색상/등급: `src/lib/score-utils.ts` 공통 유틸리티 사용
- 한국어 커뮤니케이션
