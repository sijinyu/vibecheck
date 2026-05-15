-- 006_commercial_v2.sql
-- 브랜드 심층 분석 + 인플루언서 한줄소개/토픽 + 인덱싱

-- ─── Brand Profiles: 심층 분석 필드 ───────────────────────────────
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS brand_positioning text,
  ADD COLUMN IF NOT EXISTS content_strategy jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ideal_influencer_profile jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS competitor_brands text[] DEFAULT '{}';

-- ─── Influencers: 한줄소개 + 콘텐츠 토픽 ──────────────────────────
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS one_liner text,
  ADD COLUMN IF NOT EXISTS content_topics text[] DEFAULT '{}';

-- ─── 인덱스 ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_influencers_handle ON public.influencers(handle);
CREATE INDEX IF NOT EXISTS idx_influencers_vibe_score ON public.influencers(vibe_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_influencers_tier ON public.influencers(tier);
CREATE INDEX IF NOT EXISTS idx_influencers_categories ON public.influencers USING gin(content_categories);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_influencers_engagement_rate ON public.influencers(engagement_rate DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_influencers_trend ON public.influencers(trend_direction, trend_magnitude DESC NULLS LAST);
