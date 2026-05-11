-- 003: VibeScore multi-dimensional scoring, engagement metrics, brand matching

-- ============================================
-- Influencers: add VibeScore sub-scores + engagement metrics
-- ============================================
alter table public.influencers
  add column if not exists vibe_score numeric(5,2),
  add column if not exists engagement_score numeric(5,2),
  add column if not exists consistency_score numeric(5,2),
  add column if not exists growth_potential_score numeric(5,2),
  add column if not exists authenticity_score numeric(5,2),
  add column if not exists tier text check (tier in ('nano', 'micro', 'mid', 'macro', 'mega')),
  add column if not exists following_count integer,
  add column if not exists avg_likes_per_post numeric(10,2),
  add column if not exists avg_comments_per_post numeric(10,2),
  add column if not exists engagement_rate numeric(8,6),
  add column if not exists posting_frequency_days numeric(5,2),
  add column if not exists top_hashtags text[] default '{}',
  add column if not exists content_categories text[] default '{}',
  add column if not exists insights jsonb;

-- ============================================
-- Analyses: add VibeScore sub-scores
-- ============================================
alter table public.analyses
  add column if not exists vibe_score numeric(5,2),
  add column if not exists engagement_score numeric(5,2),
  add column if not exists consistency_score numeric(5,2),
  add column if not exists growth_potential_score numeric(5,2),
  add column if not exists authenticity_score numeric(5,2),
  add column if not exists engagement_rate numeric(8,6);

-- ============================================
-- Brand Profiles: add matching preferences
-- ============================================
alter table public.brand_profiles
  add column if not exists preferred_tiers text[] default '{}',
  add column if not exists target_categories text[] default '{}',
  add column if not exists min_followers integer,
  add column if not exists max_followers integer,
  add column if not exists scores jsonb;

-- ============================================
-- Indexes for new columns
-- ============================================
create index if not exists idx_influencers_vibe_score
  on public.influencers(vibe_score desc nulls last);

create index if not exists idx_influencers_tier
  on public.influencers(tier);

create index if not exists idx_influencers_engagement_rate
  on public.influencers(engagement_rate desc nulls last);

-- ============================================
-- match_influencers_for_brand RPC
-- ============================================
create or replace function public.match_influencers_for_brand(
  query_vector vector(512),
  preferred_tiers text[] default '{}',
  target_categories text[] default '{}',
  min_vibe_score float default 0,
  match_count int default 20,
  match_threshold float default 0.5
)
returns table (
  id uuid,
  handle text,
  platform text,
  display_name text,
  profile_image_url text,
  bio text,
  follower_count integer,
  following_count integer,
  aesthetic_vector vector(512),
  aesthetic_score numeric(5,2),
  vibe_score numeric(5,2),
  engagement_score numeric(5,2),
  consistency_score numeric(5,2),
  growth_potential_score numeric(5,2),
  authenticity_score numeric(5,2),
  tier text,
  engagement_rate numeric(8,6),
  avg_likes_per_post numeric(10,2),
  avg_comments_per_post numeric(10,2),
  top_hashtags text[],
  content_categories text[],
  representative_images text[],
  insights jsonb,
  last_analyzed_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    i.id,
    i.handle,
    i.platform,
    i.display_name,
    i.profile_image_url,
    i.bio,
    i.follower_count,
    i.following_count,
    i.aesthetic_vector,
    i.aesthetic_score,
    i.vibe_score,
    i.engagement_score,
    i.consistency_score,
    i.growth_potential_score,
    i.authenticity_score,
    i.tier,
    i.engagement_rate,
    i.avg_likes_per_post,
    i.avg_comments_per_post,
    i.top_hashtags,
    i.content_categories,
    i.representative_images,
    i.insights,
    i.last_analyzed_at,
    1 - (i.aesthetic_vector <=> query_vector) as similarity
  from public.influencers i
  where i.aesthetic_vector is not null
    and i.vibe_score is not null
    and i.vibe_score >= min_vibe_score
    and 1 - (i.aesthetic_vector <=> query_vector) > match_threshold
    and (
      array_length(preferred_tiers, 1) is null
      or i.tier = any(preferred_tiers)
    )
    and (
      array_length(target_categories, 1) is null
      or i.content_categories && target_categories
    )
  order by i.aesthetic_vector <=> query_vector
  limit match_count;
end;
$$;
