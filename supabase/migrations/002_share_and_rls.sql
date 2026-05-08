-- 002: Add share_token, summary to analyses; fix influencers RLS; add match_influencers RPC

-- ============================================
-- Analyses: add share_token + summary columns
-- ============================================
alter table public.analyses
  add column if not exists share_token text unique,
  add column if not exists summary text;

create index if not exists idx_analyses_share_token
  on public.analyses(share_token)
  where share_token is not null;

-- ============================================
-- Influencers RLS: allow authenticated insert/update
-- (needed so API routes can upsert influencer data)
-- ============================================
create policy "Authenticated users can insert influencers"
  on public.influencers for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update influencers"
  on public.influencers for update
  to authenticated
  using (true);

-- ============================================
-- Analyses: allow public select by share_token
-- (so shared links work without auth)
-- ============================================
create policy "Anyone can read shared analyses"
  on public.analyses for select
  using (share_token is not null);

-- ============================================
-- match_influencers RPC (pgvector cosine search)
-- ============================================
create or replace function public.match_influencers(
  query_vector vector(512),
  match_count int default 10,
  match_threshold float default 0.7
)
returns table (
  id uuid,
  handle text,
  platform text,
  display_name text,
  profile_image_url text,
  bio text,
  follower_count integer,
  aesthetic_vector vector(512),
  aesthetic_score numeric(5,2),
  color_score numeric(5,2),
  composition_score numeric(5,2),
  tone_consistency_score numeric(5,2),
  trend_score numeric(5,2),
  category text,
  representative_images text[],
  last_analyzed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
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
    i.aesthetic_vector,
    i.aesthetic_score,
    i.color_score,
    i.composition_score,
    i.tone_consistency_score,
    i.trend_score,
    i.category,
    i.representative_images,
    i.last_analyzed_at,
    i.created_at,
    i.updated_at,
    1 - (i.aesthetic_vector <=> query_vector) as similarity
  from public.influencers i
  where i.aesthetic_vector is not null
    and 1 - (i.aesthetic_vector <=> query_vector) > match_threshold
  order by i.aesthetic_vector <=> query_vector
  limit match_count;
end;
$$;
