# CLAUDE.md — VibeCheck

## Project Overview

인스타그램 인플루언서의 피드 미학을 AI로 분석하여, 브랜드 마케터가 협업 대상을 평가할 수 있게 해주는 SaaS 도구.

- **PRD**: `../PRD.md`
- **Issues**: `../issues/` (12개 vertical slice, 모두 구현 완료)

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Charts**: Recharts (레이더 차트)
- **Auth**: Supabase Auth (Google OAuth)
- **DB**: Supabase PostgreSQL + pgvector (벡터 유사도 검색)
- **AI**: Gemini 2.5 Flash (primary, free) → OpenAI GPT-4o (paid fallback) → Mock
- **Instagram Data**: RapidAPI Instagram Scraper Stable API (`thetechguy32744`)
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
│   │   ├── analyze/page.tsx        # 핸들 분석 + Vibe Search
│   │   ├── brand/page.tsx          # 브랜드 톤 등록
│   │   ├── compare/page.tsx        # 인플루언서 비교
│   │   └── dashboard/page.tsx      # 히스토리 + 즐겨찾기
│   ├── api/
│   │   ├── analyze/route.ts        # 피드 수집 → AI 분석 → DB 저장
│   │   ├── brand/route.ts          # 브랜드 톤 분석 → DB 저장
│   │   ├── dashboard/route.ts      # 유저 분석 히스토리 조회
│   │   ├── saved-influencers/route.ts  # 즐겨찾기 POST/DELETE
│   │   ├── share/route.ts          # 공유 토큰 생성
│   │   └── vibe-search/route.ts    # pgvector 유사도 검색
│   ├── auth/callback/              # OAuth 콜백
│   ├── auth/confirm/               # OTP 확인
│   └── share/[id]/                 # 공유 결과 페이지 (public)
├── components/
│   ├── analysis/                   # 프로필카드, 레이더차트, 공유, Vibe Search
│   ├── auth/                       # 로그아웃 버튼
│   ├── layout/                     # BottomNav, 페이지 트랜지션
│   └── ui/                         # shadcn/ui 컴포넌트
├── lib/
│   ├── adapters/
│   │   ├── instagram.ts            # RapidAPI 실제 연동 (mock fallback)
│   │   ├── tiktok.ts               # TikTok 어댑터 (mock only)
│   │   └── types.ts                # FeedData, FeedPost 타입
│   ├── ai/
│   │   ├── scoring-engine.ts       # Gemini → OpenAI → Mock 우선순위
│   │   └── cosine-similarity.ts    # 벡터 유사도 (Brand Fit)
│   └── supabase/
│       ├── client.ts               # 브라우저 클라이언트
│       ├── server.ts               # 서버 클라이언트 + tryCreateClient()
│       ├── queries.ts              # 타입드 쿼리 헬퍼 (upsert, insert, match)
│       ├── middleware.ts           # 세션 갱신 + 라우트 보호
│       └── types.ts                # Database, Analysis, Influencer 타입
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql  # 테이블 + pgvector + RLS
        └── 002_share_and_rls.sql   # share_token, RLS 보강, match_influencers RPC
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
- `influencers` — 분석된 인플루언서 프로필
- `analyses` — 분석 결과 (scores, vector, summary, share_token)
- `brand_profiles` — 브랜드 톤/무드 프로필
- `vibe_searches` — Vibe Search 검색 기록
- `saved_influencers` — 유저별 즐겨찾기

### Migrations
Supabase SQL Editor에서 순서대로 실행:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_share_and_rls.sql`

### Google OAuth Setup
1. Google Cloud Console → OAuth 2.0 Client ID 생성
2. Authorized redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → Authentication → Providers → Google → Client ID/Secret 입력

## Current Status

### 완료
- Google OAuth 로그인
- 인스타 피드 수집 (RapidAPI 실제 연동)
- AI 미학 분석 (Gemini 2.5 Flash 실제 연동)
- 분석 결과 DB 저장 (Supabase)
- 공유 링크 (share_token)
- Vibe Search (pgvector 유사도, mock fallback)
- Dashboard (히스토리 + 즐겨찾기)
- Vercel 프로덕션 배포 완료

### Known Limitations
1. **TikTok** — mock only
2. **Compare** — UI만, AI 비교 분석 미구현
3. **Brand moodboard** — 업로드 UI만, 이미지 처리 없음
4. **Desktop** — 모바일 퍼스트, max-w-lg 고정
5. **Toast** — 알림 시스템 없음

### Planned Features
- 퍼스널 브랜딩 컨설팅 탭 (AI 코칭)
- 비교 분석 실제 AI 연동
- PDF 리포트 다운로드
- 트렌드 대시보드
- 브랜드 ↔ 인플루언서 매칭
- 즐겨찾기 계정 모니터링/알림
- 전체 UI 퀄리티 상향 (상업용 수준)

## Coding Conventions

- TypeScript strict, `any` 최소화
- 함수형 컴포넌트, immutable 패턴
- Tailwind utility-first, 인라인 스타일 금지
- 핸들러 네이밍: `handle{Target}{Event}` (예: handleFormSubmit)
- 150줄 초과 시 hooks/컴포넌트 분리
- API 에러 시 항상 mock fallback 제공
- `console.error`는 `[module-name]` prefix 사용
- 한국어 커뮤니케이션
