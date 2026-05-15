-- 009: Commercial Pipeline Phase 1
-- Adds text-based matching fields and cache table for light profile matching

-- New columns on influencers for text-based matching
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS aesthetic_description text,
  ADD COLUMN IF NOT EXISTS text_match_score integer,
  ADD COLUMN IF NOT EXISTS ai_suggestion_reason text;

-- Cache table for brand × influencer text match scores
CREATE TABLE IF NOT EXISTS public.text_match_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES public.influencers(id) ON DELETE CASCADE,
  text_match_score integer NOT NULL,
  match_reasoning text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, influencer_id)
);

-- RLS for text_match_cache
ALTER TABLE public.text_match_cache ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_text_match_cache" ON public.text_match_cache
  FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_text_match_cache_brand ON public.text_match_cache(brand_id);
CREATE INDEX IF NOT EXISTS idx_text_match_cache_influencer ON public.text_match_cache(influencer_id);

-- Index on discovery_status for cron upgrade queries
CREATE INDEX IF NOT EXISTS idx_influencers_discovery_status ON public.influencers(discovery_status);
