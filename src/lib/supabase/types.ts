export interface BrandProfile {
  id: string;
  user_id: string;
  name: string;
  handle: string | null;
  platform: "instagram" | "tiktok" | null;
  tone_vector: number[] | null;
  moodboard_urls: string[];
  description: string | null;
  preferred_tiers: string[];
  target_categories: string[];
  min_followers: number | null;
  max_followers: number | null;
  scores: Record<string, unknown> | null;
  slug: string | null;
  brand_positioning: string | null;
  content_strategy: Record<string, unknown>;
  ideal_influencer_profile: Record<string, unknown>;
  brand_keywords: string[];
  competitor_brands: string[];
  created_at: string;
  updated_at: string;
}

export interface Influencer {
  id: string;
  handle: string;
  platform: "instagram" | "tiktok";
  display_name: string | null;
  profile_image_url: string | null;
  bio: string | null;
  follower_count: number | null;
  following_count: number | null;
  aesthetic_vector: number[] | null;
  aesthetic_score: number | null;
  color_score: number | null;
  composition_score: number | null;
  tone_consistency_score: number | null;
  trend_score: number | null;
  vibe_score: number | null;
  engagement_score: number | null;
  consistency_score: number | null;
  growth_potential_score: number | null;
  authenticity_score: number | null;
  tier: string | null;
  avg_likes_per_post: number | null;
  avg_comments_per_post: number | null;
  engagement_rate: number | null;
  posting_frequency_days: number | null;
  top_hashtags: string[];
  content_categories: string[];
  insights: Record<string, unknown>[] | null;
  post_performances: Record<string, unknown>[] | null;
  content_type_breakdown: Record<string, unknown>[] | null;
  trend_direction: string | null;
  trend_magnitude: number | null;
  avg_shares_per_post: number | null;
  avg_plays_per_post: number | null;
  estimated_cpe: number | null;
  content_effectiveness_score: number | null;
  platform_benchmark: number | null;
  category: string | null;
  representative_images: string[];
  one_liner: string | null;
  content_topics: string[];
  data_source: string | null;
  ai_source: string | null;
  discovery_status: "stub" | "light" | "full" | null;
  aesthetic_description: string | null;
  text_match_score: number | null;
  ai_suggestion_reason: string | null;
  profile_image_cached_at: string | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  influencer_id: string | null;
  handle: string;
  platform: "instagram" | "tiktok";
  aesthetic_score: number;
  color_score: number | null;
  composition_score: number | null;
  tone_consistency_score: number | null;
  trend_score: number | null;
  brand_fit_score: number | null;
  vibe_score: number | null;
  engagement_score: number | null;
  consistency_score: number | null;
  growth_potential_score: number | null;
  authenticity_score: number | null;
  engagement_rate: number | null;
  representative_images: string[];
  moodboard_urls: string[];
  raw_ai_response: Record<string, unknown> | null;
  share_token: string | null;
  summary: string | null;
  created_at: string;
}

export interface VibeSearch {
  id: string;
  user_id: string;
  image_url: string;
  tone_vector: number[] | null;
  matched_influencer_ids: string[];
  created_at: string;
}

export interface SavedInfluencer {
  id: string;
  user_id: string;
  influencer_id: string;
  brand_id: string | null;
  created_at: string;
}

export interface DiscoveryQueueItem {
  id: string;
  handle: string;
  platform: string;
  source: "seed" | "hashtag" | "brand_keyword" | "similar" | "ai_suggest" | "ai_category";
  source_detail: string | null;
  category: string | null;
  priority: number;
  status: "pending" | "processing" | "completed" | "failed";
  retry_count: number;
  created_at: string;
  processed_at: string | null;
}

export interface ApiUsageLog {
  id: string;
  month: string;
  call_count: number;
  last_updated_at: string;
}

export interface Campaign {
  id: string;
  brand_id: string;
  user_id: string;
  name: string;
  status: "draft" | "active" | "completed" | "archived";
  budget_krw: number | null;
  brief_content: string | null;
  target_kpi: Record<string, unknown>;
  actual_kpi: Record<string, unknown>;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignInfluencer {
  id: string;
  campaign_id: string;
  influencer_id: string;
  status:
    | "shortlisted"
    | "contacted"
    | "negotiating"
    | "confirmed"
    | "active"
    | "completed"
    | "declined";
  outreach_message: string | null;
  collaboration_proposal: string | null;
  agreed_fee_krw: number | null;
  actual_reach: number | null;
  actual_engagement: number | null;
  notes: string | null;
  status_updated_at: string;
  created_at: string;
}

export interface TextMatchCache {
  id: string;
  brand_id: string;
  influencer_id: string;
  text_match_score: number;
  match_reasoning: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      brand_profiles: {
        Row: BrandProfile;
        Insert: Omit<BrandProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BrandProfile, "id" | "created_at" | "updated_at">>;
      };
      influencers: {
        Row: Influencer;
        Insert: Omit<Influencer, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Influencer, "id" | "created_at" | "updated_at">>;
      };
      analyses: {
        Row: Analysis;
        Insert: Omit<Analysis, "id" | "created_at">;
        Update: Partial<Omit<Analysis, "id" | "created_at">>;
      };
      vibe_searches: {
        Row: VibeSearch;
        Insert: Omit<VibeSearch, "id" | "created_at">;
        Update: Partial<Omit<VibeSearch, "id" | "created_at">>;
      };
      saved_influencers: {
        Row: SavedInfluencer;
        Insert: Omit<SavedInfluencer, "id" | "created_at">;
        Update: Partial<Omit<SavedInfluencer, "id" | "created_at">>;
      };
      discovery_queue: {
        Row: DiscoveryQueueItem;
        Insert: Omit<DiscoveryQueueItem, "id" | "created_at">;
        Update: Partial<Omit<DiscoveryQueueItem, "id" | "created_at">>;
      };
      api_usage_log: {
        Row: ApiUsageLog;
        Insert: Omit<ApiUsageLog, "id">;
        Update: Partial<Omit<ApiUsageLog, "id">>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Campaign, "id" | "created_at" | "updated_at">>;
      };
      campaign_influencers: {
        Row: CampaignInfluencer;
        Insert: Omit<CampaignInfluencer, "id" | "created_at">;
        Update: Partial<Omit<CampaignInfluencer, "id" | "created_at">>;
      };
      text_match_cache: {
        Row: TextMatchCache;
        Insert: Omit<TextMatchCache, "id" | "created_at">;
        Update: Partial<Omit<TextMatchCache, "id" | "created_at">>;
      };
    };
  };
}
