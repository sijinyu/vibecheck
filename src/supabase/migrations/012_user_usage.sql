-- 012: User Usage Tracking
-- Tracks monthly usage per user for Free/Pro tier gating.

CREATE TABLE IF NOT EXISTS user_usage (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,  -- '2025-05'
  analysis_count integer DEFAULT 0,
  outreach_count integer DEFAULT 0,
  pdf_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, month)
);

-- RLS: users can only read their own usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON user_usage
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage usage"
  ON user_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);
