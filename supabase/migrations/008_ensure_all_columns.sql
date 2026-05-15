-- 008_ensure_all_columns.sql
-- 누락된 컬럼이 있을 수 있으므로, 005~007 마이그레이션의 모든 컬럼을 안전하게 보장.
-- IF NOT EXISTS / IF EXISTS 사용으로 중복 실행 안전.

-- ─── From 005: VibeScore v2 ─────────────────────────────────────
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS post_performances jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS content_type_breakdown jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS trend_direction text,
  ADD COLUMN IF NOT EXISTS trend_magnitude integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_shares_per_post numeric(10,2),
  ADD COLUMN IF NOT EXISTS avg_plays_per_post numeric(10,2),
  ADD COLUMN IF NOT EXISTS estimated_cpe integer,
  ADD COLUMN IF NOT EXISTS content_effectiveness_score integer,
  ADD COLUMN IF NOT EXISTS platform_benchmark numeric(8,6);

-- ─── From 006: Commercial v2 ───────────────────────────────────
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS brand_positioning text,
  ADD COLUMN IF NOT EXISTS content_strategy jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ideal_influencer_profile jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS competitor_brands text[] DEFAULT '{}';

ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS one_liner text,
  ADD COLUMN IF NOT EXISTS content_topics text[] DEFAULT '{}';

-- Indexes from 006
CREATE INDEX IF NOT EXISTS idx_influencers_handle ON public.influencers(handle);
CREATE INDEX IF NOT EXISTS idx_influencers_vibe_score ON public.influencers(vibe_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_influencers_tier ON public.influencers(tier);
CREATE INDEX IF NOT EXISTS idx_influencers_categories ON public.influencers USING gin(content_categories);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON public.analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_influencers_engagement_rate ON public.influencers(engagement_rate DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_influencers_trend ON public.influencers(trend_direction, trend_magnitude DESC NULLS LAST);

-- ─── From 007: Discovery Pipeline ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.discovery_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  handle text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  source text NOT NULL,
  source_detail text,
  category text,
  priority integer DEFAULT 0,
  status text DEFAULT 'pending',
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(handle, platform)
);

CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month text NOT NULL,
  api_name text NOT NULL DEFAULT 'rapidapi',
  call_count integer DEFAULT 0,
  last_called_at timestamptz DEFAULT now(),
  UNIQUE(month, api_name)
);

ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS discovery_status text DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS profile_image_cached_at timestamptz;

-- Indexes from 007
CREATE INDEX IF NOT EXISTS idx_discovery_queue_status ON public.discovery_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_queue_source ON public.discovery_queue(source, source_detail);
CREATE INDEX IF NOT EXISTS idx_influencers_discovery ON public.influencers(discovery_status);

-- RLS for discovery_queue
ALTER TABLE public.discovery_queue ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discovery_queue' AND policyname = 'discovery_queue_service_all'
  ) THEN
    CREATE POLICY discovery_queue_service_all ON public.discovery_queue FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- RLS for api_usage_log
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'api_usage_log' AND policyname = 'api_usage_log_service_all'
  ) THEN
    CREATE POLICY api_usage_log_service_all ON public.api_usage_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
