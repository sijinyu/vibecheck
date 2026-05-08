export interface BrandProfile {
  id: string;
  user_id: string;
  name: string;
  handle: string | null;
  platform: "instagram" | "tiktok" | null;
  tone_vector: number[] | null;
  moodboard_urls: string[];
  description: string | null;
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
  aesthetic_vector: number[] | null;
  aesthetic_score: number | null;
  color_score: number | null;
  composition_score: number | null;
  tone_consistency_score: number | null;
  trend_score: number | null;
  category: string | null;
  representative_images: string[];
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
    };
  };
}
