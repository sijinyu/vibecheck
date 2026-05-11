# CLAUDE.md — VibeCheck

## Project Overview

인플루언서의 피드를 AI로 5차원 분석(VibeScore)하여, 브랜드 마케터가 협업 대상을 평가·매칭할 수 있게 해주는 SaaS 도구.

**핵심 스코어링**: `VibeScore = Aesthetic×0.40 + Engagement×0.25 + Consistency×0.15 + Growth×0.10 + Authenticity×0.10`

- **PRD**: `../PRD.md`
- **Issues**: `../issues/` (12개 vertical slice, 모두 구현 완료)

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Charts**: Recharts (레이더 차트, 바 차트, 라인 차트, 에어리어 차트)
- **Auth**: Supabase Auth (Google OAuth)
- **DB**: Supabase PostgreSQL + pgvector (벡터 유사도 검색)
- **AI**: Gemini 2.5 Flash (primary, free) → OpenAI GPT-4o (paid fallback) → Mock
- **Toast**: sonner (dark theme, top-center)
- **Instagram Data**: RapidAPI Instagram Scraper Stable API (`thetechguy32744`)
- **TikTok Data**: RapidAPI TikTok Scraper7 (같은 RAPIDAPI_KEY 사용)
- **Package Manager**: pnpm

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
│   │   ├── analyze/page.tsx        # Discover 허브 (핸들 분석 + 최근 분석 + Vibe Search)
│   │   ├── brand/page.tsx          # 브랜드 톤 등록 + 인플루언서 추천
│   │   ├── compare/page.tsx        # 인플루언서 2-3명 비교
│   │   ├── dashboard/page.tsx      # KPI + 차트 + 히스토리 + 즐겨찾기
│   │   └── influencer/[handle]/page.tsx  # 인플루언서 상세 프로필 (5탭: Overview, Content, Engagement, Brand Fit, Coaching)
│   ├── api/
│   │   ├── analyze/route.ts        # 피드 수집 → AI 분석 → VibeScore 계산 → DB 저장
│   │   ├── brand/route.ts          # 브랜드 톤 분석 → DB 저장 (핸들/무드보드)
│   │   ├── brand/recommendations/route.ts  # 브랜드-인플루언서 매칭 추천
│   │   ├── compare/route.ts        # 인플루언서 비교 (AI 비교 내러티브 + VibeScore)
│   │   ├── dashboard/route.ts      # 유저 분석 히스토리 + 집계 통계 조회
│   │   ├── influencer/[handle]/route.ts  # 인플루언서 상세 데이터 조회
│   │   ├── saved-influencers/route.ts  # 즐겨찾기 POST/DELETE
│   │   ├── share/route.ts          # 공유 토큰 생성
│   │   ├── vibe-search/route.ts    # pgvector 유사도 검색
│   │   └── influencer/[handle]/coaching/route.ts  # AI 퍼스널 브랜딩 코칭
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
│   │   ├── recommendation-card.tsx # 브랜드-인플루언서 매칭 카드
│   │   ├── share-button.tsx        # 공유 버튼
│   │   ├── download-report-button.tsx  # PDF 리포트 다운로드 버튼
│   │   ├── coaching-panel.tsx      # AI 퍼스널 브랜딩 코칭 패널
│   │   └── vibe-search-upload.tsx  # 이미지 업로드 → 유사 인플루언서 검색
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
│   │   ├── instagram.ts            # RapidAPI 실제 연동 (mock fallback)
│   │   ├── tiktok.ts               # TikTok 어댑터 (RapidAPI + mock fallback)
│   │   └── types.ts                # FeedData, FeedPost 타입 (shareCount, playCount 포함)
│   ├── ai/
│   │   ├── scoring-engine.ts       # Gemini → OpenAI → Mock (순수 미학 점수)
│   │   ├── vibe-score-engine.ts    # VibeScore 5차원 복합 점수 엔진
│   │   ├── compare-engine.ts       # AI 비교 분석 (내러티브 + 순위)
│   │   ├── matching-engine.ts      # 브랜드-인플루언서 매칭 알고리즘
│   │   └── cosine-similarity.ts    # 벡터 유사도
│   ├── i18n/
│   │   ├── context.tsx             # I18nProvider + useI18n() hook
│   │   └── translations.ts        # ko/en 번역 키 (~150개)
│   ├── pdf/
│   │   └── report-generator.ts    # jsPDF 기반 PDF 리포트 생성
│   ├── score-utils.ts              # 점수 색상/등급 공통 유틸리티
│   └── supabase/
│       ├── client.ts               # 브라우저 클라이언트
│       ├── server.ts               # 서버 클라이언트 + tryCreateClient()
│       ├── queries.ts              # 타입드 쿼리 헬퍼 (upsert, insert, match)
│       ├── middleware.ts           # 세션 갱신 + 라우트 보호
│       └── types.ts                # Database, Analysis, Influencer, BrandProfile 타입
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql  # 테이블 + pgvector + RLS
        ├── 002_share_and_rls.sql   # share_token, RLS 보강, match_influencers RPC
        └── 003_vibe_score_and_engagement.sql  # VibeScore 컬럼 + 매칭 RPC
```

## VibeScore System

### 5차원 복합 점수 (0-100)

| 차원 | 비중 | 설명 |
|------|------|------|
| Aesthetic | 40% | Gemini AI 피드 미학 분석 (색감, 구도, 톤, 트렌드, 독창성) |
| Engagement | 25% | 인게이지먼트율 × 티어 벤치마크 대비 정규화 |
| Consistency | 15% | 포스팅 규칙성 + AI 톤 일관성 |
| Growth | 10% | 팔로워/팔로잉 비율 + 인게이지먼트 추세 |
| Authenticity | 10% | 가짜 팔로워/봇 탐지 4가지 휴리스틱 |

### 인플루언서 티어

| 티어 | 팔로워 범위 | ER 벤치마크 |
|------|-------------|-------------|
| nano | <10K | 5% |
| micro | 10-50K | 3% |
| mid | 50-100K | 2% |
| macro | 100K-1M | 1.5% |
| mega | >1M | 0.7% |

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

모든 외부 서비스 미설정 시에도 앱이 동작:
- **Supabase 없음** → `tryCreateClient()` returns null, DB 저장 skip
- **Gemini 없음** → OpenAI fallback → Mock fallback
- **RapidAPI 없음** → Mock feed data

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
- **인플루언서 상세 프로필 페이지** (Overview, Content, Engagement, Brand Fit, Coaching 5탭)
- **AI 퍼스널 브랜딩 코칭** (Gemini 기반 전략/로드맵/콘텐츠 제안)
- **PDF 리포트 다운로드** (jsPDF, 동적 import로 번들 최적화)
- **브랜드-인플루언서 매칭 추천 엔진** (pgvector + 매칭 알고리즘)
- **대시보드 Analytics** (KPI 카드 + 점수 분포 + 벤치마크 차트)
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

### Known Issues (미수정)
- API 라우트에 rate limiting 미적용
- 일부 API 라우트에 인증 체크 미적용 (analyze, compare, coaching 등)
- `SupabaseClient<any>` 타입 체크 무효화 (queries.ts)
- share token 8자 충돌 위험 (birthday paradox ~65K에서 50%)
- security headers 미설정 (CSP, HSTS 등)

### Planned Features
- 즐겨찾기 계정 모니터링/알림

## Coding Conventions

- TypeScript strict, `any` 최소화
- 함수형 컴포넌트, immutable 패턴
- Tailwind utility-first, 인라인 스타일 금지
- 핸들러 네이밍: `handle{Target}{Event}` (예: handleFormSubmit)
- 150줄 초과 시 hooks/컴포넌트 분리
- API 에러 시 항상 mock fallback 제공
- `console.error`는 `[module-name]` prefix 사용
- 점수 색상/등급: `src/lib/score-utils.ts` 공통 유틸리티 사용
- 한국어 커뮤니케이션
