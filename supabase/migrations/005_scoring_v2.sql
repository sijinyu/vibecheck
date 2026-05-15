-- 005_scoring_v2.sql
-- VibeScore v2: Platform benchmarks, post performances, content breakdown, marketing metrics

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
