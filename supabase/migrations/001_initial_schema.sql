-- VibeCheck Initial Schema
-- Requires: pgvector extension

-- Enable pgvector for aesthetic vector similarity search
create extension if not exists vector with schema extensions;

-- ============================================
-- Brand Profiles
-- ============================================
create table public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  handle text,
  platform text check (platform in ('instagram', 'tiktok')),
  tone_vector vector(512),
  moodboard_urls text[] default '{}',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- ============================================
-- Influencers (seed + accumulated from analyses)
-- ============================================
create table public.influencers (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  platform text not null check (platform in ('instagram', 'tiktok')),
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
  representative_images text[] default '{}',
  last_analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(handle, platform)
);

-- ============================================
-- Analyses (per-user analysis history)
-- ============================================
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  influencer_id uuid references public.influencers(id) on delete set null,
  handle text not null,
  platform text not null check (platform in ('instagram', 'tiktok')),
  aesthetic_score numeric(5,2) not null,
  color_score numeric(5,2),
  composition_score numeric(5,2),
  tone_consistency_score numeric(5,2),
  trend_score numeric(5,2),
  brand_fit_score numeric(5,2),
  representative_images text[] default '{}',
  moodboard_urls text[] default '{}',
  raw_ai_response jsonb,
  created_at timestamptz not null default now()
);

-- ============================================
-- Vibe Searches (image-based search history)
-- ============================================
create table public.vibe_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  tone_vector vector(512),
  matched_influencer_ids uuid[] default '{}',
  created_at timestamptz not null default now()
);

-- ============================================
-- Saved Influencers (bookmarks)
-- ============================================
create table public.saved_influencers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, influencer_id)
);

-- ============================================
-- Indexes
-- ============================================

-- Vector similarity search index (IVFFlat for Vibe Search)
create index on public.influencers
  using ivfflat (aesthetic_vector vector_cosine_ops)
  with (lists = 100);

-- Query performance indexes
create index idx_analyses_user_id on public.analyses(user_id);
create index idx_analyses_created_at on public.analyses(created_at desc);
create index idx_influencers_handle_platform on public.influencers(handle, platform);
create index idx_influencers_aesthetic_score on public.influencers(aesthetic_score desc);
create index idx_saved_influencers_user_id on public.saved_influencers(user_id);
create index idx_vibe_searches_user_id on public.vibe_searches(user_id);
create index idx_brand_profiles_user_id on public.brand_profiles(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.brand_profiles enable row level security;
alter table public.influencers enable row level security;
alter table public.analyses enable row level security;
alter table public.vibe_searches enable row level security;
alter table public.saved_influencers enable row level security;

-- Brand Profiles: users can only manage their own
create policy "Users can view own brand profile"
  on public.brand_profiles for select
  using (auth.uid() = user_id);

create policy "Users can create own brand profile"
  on public.brand_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own brand profile"
  on public.brand_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own brand profile"
  on public.brand_profiles for delete
  using (auth.uid() = user_id);

-- Influencers: everyone can read, only service role can write
create policy "Anyone can read influencers"
  on public.influencers for select
  using (true);

-- Analyses: users can only manage their own
create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can create own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- Vibe Searches: users can only manage their own
create policy "Users can view own vibe searches"
  on public.vibe_searches for select
  using (auth.uid() = user_id);

create policy "Users can create own vibe searches"
  on public.vibe_searches for insert
  with check (auth.uid() = user_id);

-- Saved Influencers: users can only manage their own
create policy "Users can view own saved influencers"
  on public.saved_influencers for select
  using (auth.uid() = user_id);

create policy "Users can save influencers"
  on public.saved_influencers for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave influencers"
  on public.saved_influencers for delete
  using (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_brand_profiles_updated_at
  before update on public.brand_profiles
  for each row execute function public.handle_updated_at();

create trigger set_influencers_updated_at
  before update on public.influencers
  for each row execute function public.handle_updated_at();
