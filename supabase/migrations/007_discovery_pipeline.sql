-- 007_discovery_pipeline.sql
-- Discovery pipeline: 자동 인플루언서 디스커버리를 위한 큐 + 인플루언서 상태 필드

-- ─── 1. discovery_queue 테이블 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.discovery_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  handle text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  source text NOT NULL,              -- 'seed', 'hashtag', 'brand_keyword', 'similar'
  source_detail text,                -- 해시태그명, 브랜드ID 등
  category text,
  priority integer DEFAULT 0,        -- 높을수록 우선 처리
  status text DEFAULT 'pending',     -- pending | processing | completed | failed
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(handle, platform)
);

-- RLS 정책: service role만 접근 (Cron Job, 서버 사이드)
ALTER TABLE public.discovery_queue ENABLE ROW LEVEL SECURITY;

-- 서비스 역할은 모든 작업 가능
CREATE POLICY "Service role full access on discovery_queue"
  ON public.discovery_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── 2. influencers 테이블에 디스커버리 필드 추가 ──────────────────────────
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS discovery_status text DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS profile_image_cached_at timestamptz;

-- 기존 데이터: 이미 분석 완료된 건은 'full'로 설정
UPDATE public.influencers
  SET discovery_status = 'full'
  WHERE vibe_score IS NOT NULL AND discovery_status IS NULL;

-- ─── 3. 인덱스 ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_discovery_queue_status
  ON public.discovery_queue(status, priority DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_queue_source
  ON public.discovery_queue(source, source_detail);

CREATE INDEX IF NOT EXISTS idx_influencers_discovery
  ON public.influencers(discovery_status);

-- content_categories GIN 인덱스 (이미 있을 수 있으므로 IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_influencers_categories_gin
  ON public.influencers USING gin(content_categories);

-- ─── 4. api_usage_log 테이블 (API 예산 관리) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month text NOT NULL,               -- '2024-01' 형식
  call_count integer DEFAULT 0,
  last_updated_at timestamptz DEFAULT now(),
  UNIQUE(month)
);

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on api_usage_log"
  ON public.api_usage_log
  FOR ALL
  USING (true)
  WITH CHECK (true);
