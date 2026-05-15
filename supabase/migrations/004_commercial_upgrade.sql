-- ============================================================
-- Migration 004: Commercial Upgrade
-- Phase A: 데이터 출처 추적
-- Phase B: 멀티 브랜드 지원
-- ============================================================

-- Phase A: 데이터 출처 추적
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS ai_source text DEFAULT 'gemini';

-- Phase B: 멀티 브랜드 지원
-- unique(user_id) 제약 제거 → 유저당 여러 브랜드 허용
ALTER TABLE public.brand_profiles DROP CONSTRAINT IF EXISTS brand_profiles_user_id_key;

-- 브랜드 slug 추가 (유저+slug로 유니크)
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS slug text;

-- 유저+slug 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_profiles_user_slug
  ON public.brand_profiles(user_id, slug);

-- 브랜드별 인플루언서 숏리스트
ALTER TABLE public.saved_influencers
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brand_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saved_influencers_brand
  ON public.saved_influencers(brand_id);
