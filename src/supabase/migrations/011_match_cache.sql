-- 011: Brand Match Cache
-- Caches brand-influencer match scores for fast retrieval.
-- Scores are recalculated when brand/influencer data changes.

CREATE TABLE IF NOT EXISTS brand_match_cache (
  brand_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE,
  influencer_id uuid REFERENCES influencers(id) ON DELETE CASCADE,
  match_score integer NOT NULL,
  aesthetic_match integer,
  tier_compatibility integer,
  category_alignment integer,
  quality_filter integer,
  confidence_level text,  -- 'high', 'medium', 'low'
  match_reason text,
  cached_at timestamptz DEFAULT now(),
  PRIMARY KEY (brand_id, influencer_id)
);

-- Fast lookup: get top matches for a brand sorted by score
CREATE INDEX IF NOT EXISTS idx_match_cache_brand_score
  ON brand_match_cache(brand_id, match_score DESC);

-- RLS: users can only read their own brand's cache
ALTER TABLE brand_match_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own brand match cache"
  ON brand_match_cache
  FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM brand_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage match cache"
  ON brand_match_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);
