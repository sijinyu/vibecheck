# VibeCheck — Claude Code Context

## 프로젝트 개요

인플루언서의 미적 감도(Aesthetic Vibe)를 AI로 정량화하고, 브랜드 톤과 자동 매칭하는 분석 도구.

- **PRD**: `../PRD.md`
- **Issues**: `../issues/` (12개 vertical slice, 모두 구현 완료)

## 기술 스택

- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS v4 + shadcn/ui (다크 모드, 핀터레스트 감성)
- **Animation**: Framer Motion
- **Charts**: Recharts (레이더 차트)
- **Auth**: Supabase Auth (Google/Apple 소셜 로그인)
- **DB**: Supabase PostgreSQL + pgvector (벡터 유사도 검색)
- **AI**: OpenAI Vision API (GPT-4o) — 없으면 mock 데이터로 폴백
- **Deploy**: Vercel (미설정)
- **Package Manager**: pnpm

## 주요 명령어

```bash
pnpm dev          # 개발 서버 (localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint
```

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                    # 랜딩 페이지 (비로그인)
│   ├── layout.tsx                  # 루트 레이아웃 (다크 모드)
│   ├── middleware.ts               # Supabase 세션 + 보호 라우트
│   ├── (auth)/login/               # 로그인 (Google/Apple)
│   ├── (main)/                     # 인증된 사용자 영역
│   │   ├── layout.tsx              # BottomNav + SignOut
│   │   ├── analyze/page.tsx        # 핸들 분석 + Vibe Search
│   │   ├── brand/page.tsx          # 브랜드 톤 등록
│   │   ├── compare/page.tsx        # 인플루언서 비교
│   │   └── dashboard/page.tsx      # 히스토리 + 즐겨찾기
│   ├── api/
│   │   ├── analyze/route.ts        # 통합 분석 (수집→AI→결과)
│   │   ├── analyze/instagram/      # Instagram 어댑터 API
│   │   ├── analyze/tiktok/         # TikTok 어댑터 API
│   │   ├── brand/route.ts          # 브랜드 톤 분석
│   │   ├── share/route.ts          # 공유 링크 생성
│   │   └── vibe-search/route.ts    # 이미지 기반 매칭
│   ├── auth/callback/              # OAuth 콜백
│   ├── auth/confirm/               # OTP 확인
│   └── share/[id]/                 # 공유 결과 페이지
├── components/
│   ├── analysis/
│   │   ├── aesthetic-radar-chart.tsx  # 5축 레이더 차트
│   │   ├── profile-card.tsx          # 스코어 카드 + 차트 + 툴팁
│   │   ├── share-button.tsx          # 공유 버튼 (클립보드 복사)
│   │   └── vibe-search-upload.tsx    # 이미지 D&D 업로드 + 결과
│   ├── auth/
│   │   └── sign-out-button.tsx
│   ├── layout/
│   │   ├── bottom-nav.tsx            # 4탭 네비게이션 (애니메이션)
│   │   └── page-transition.tsx       # Framer Motion 트랜지션
│   └── ui/                           # shadcn/ui 컴포넌트
├── lib/
│   ├── adapters/
│   │   ├── types.ts                  # FeedPost, ProfileData, FeedData
│   │   ├── instagram.ts             # Instagram 어댑터 (mock)
│   │   └── tiktok.ts                # TikTok 어댑터 (mock)
│   ├── ai/
│   │   ├── scoring-engine.ts        # OpenAI Vision + 하이브리드 스코어링
│   │   └── cosine-similarity.ts     # 벡터 유사도 (Brand Fit)
│   ├── supabase/
│   │   ├── client.ts                # 브라우저 클라이언트
│   │   ├── server.ts                # 서버 클라이언트
│   │   ├── middleware.ts            # 세션 갱신 + 라우트 보호
│   │   └── types.ts                 # DB 타입 정의
│   └── utils.ts                     # cn() 유틸리티
├── scripts/
│   └── seed-crawler.ts              # 시드 데이터 크롤러 (50명)
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # 전체 스키마 + RLS + pgvector
```

## 환경 변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=      # (선택) 서버 admin 작업
OPENAI_API_KEY=                 # (선택) 없으면 mock 데이터 사용
```

**Supabase 미설정 시**: 미들웨어가 인증 체크를 스킵하여 모든 페이지 접근 가능. mock 데이터로 정상 동작.

## 현재 상태 (MVP 구현 완료)

- 12개 이슈 모두 코드 레벨 완료
- 빌드 성공, 개발 서버 정상 (모든 라우트 200 OK)
- 데이터 어댑터는 **mock 데이터** — 실제 API 연동은 TODO
- Supabase DB 저장 로직은 TODO (API는 결과만 반환, 저장 미구현)
- Vercel 배포 미설정

## 다음 단계 (우선순위)

1. Supabase 프로젝트 생성 + 마이그레이션 실행
2. `.env.local` 설정 (Supabase + OpenAI)
3. DB 저장 로직 연동 (분석 결과 → analyses/influencers 테이블)
4. Vercel 배포
5. 실제 Instagram/TikTok API 연동 (mock 교체)
6. 시드 크롤러 실행

## 코딩 규칙

- TypeScript strict, `any` 금지
- 함수형 컴포넌트, immutable 패턴
- Tailwind utility-first, 인라인 스타일 금지
- 핸들러 네이밍: `handle{Target}{Event}` (예: handleFormSubmit)
- 150줄 초과 시 hooks/컴포넌트 분리
- 한국어 커뮤니케이션
