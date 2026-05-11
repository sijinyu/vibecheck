import { type SupabaseClient } from "@supabase/supabase-js";
import { type Analysis, type Influencer } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

// ─── Influencers ───────────────────────────────────────────────

export async function upsertInfluencer(
  client: Client,
  data: {
    handle: string;
    platform: "instagram" | "tiktok";
    display_name?: string | null;
    profile_image_url?: string | null;
    bio?: string | null;
    follower_count?: number | null;
    following_count?: number | null;
    aesthetic_vector?: number[] | null;
    aesthetic_score?: number | null;
    color_score?: number | null;
    composition_score?: number | null;
    tone_consistency_score?: number | null;
    trend_score?: number | null;
    vibe_score?: number | null;
    engagement_score?: number | null;
    consistency_score?: number | null;
    growth_potential_score?: number | null;
    authenticity_score?: number | null;
    tier?: string | null;
    avg_likes_per_post?: number | null;
    avg_comments_per_post?: number | null;
    engagement_rate?: number | null;
    posting_frequency_days?: number | null;
    top_hashtags?: string[];
    content_categories?: string[];
    insights?: Record<string, unknown>[] | null;
    category?: string | null;
    representative_images?: string[];
  }
): Promise<Influencer | null> {
  const { data: row, error } = await client
    .from("influencers")
    .upsert(
      {
        ...data,
        last_analyzed_at: new Date().toISOString(),
      },
      { onConflict: "handle,platform" }
    )
    .select()
    .single();

  if (error) {
    console.error("[queries] upsertInfluencer error:", error.message);
    return null;
  }
  return row;
}

// ─── Analyses ──────────────────────────────────────────────────

export async function insertAnalysis(
  client: Client,
  data: {
    user_id: string;
    influencer_id?: string | null;
    handle: string;
    platform: "instagram" | "tiktok";
    aesthetic_score: number;
    color_score?: number | null;
    composition_score?: number | null;
    tone_consistency_score?: number | null;
    trend_score?: number | null;
    brand_fit_score?: number | null;
    vibe_score?: number | null;
    engagement_score?: number | null;
    consistency_score?: number | null;
    growth_potential_score?: number | null;
    authenticity_score?: number | null;
    engagement_rate?: number | null;
    representative_images?: string[];
    raw_ai_response?: Record<string, unknown> | null;
    summary?: string | null;
  }
): Promise<Analysis | null> {
  const { data: row, error } = await client
    .from("analyses")
    .insert({
      ...data,
      influencer_id: data.influencer_id ?? null,
      moodboard_urls: [],
      share_token: null,
    })
    .select()
    .single();

  if (error) {
    console.error("[queries] insertAnalysis error:", error.message);
    return null;
  }
  return row;
}

export async function setShareToken(
  client: Client,
  analysisId: string,
  shareToken: string
): Promise<boolean> {
  const { error } = await client
    .from("analyses")
    .update({ share_token: shareToken })
    .eq("id", analysisId);

  if (error) {
    console.error("[queries] setShareToken error:", error.message);
    return false;
  }
  return true;
}

export async function getAnalysisByShareToken(
  client: Client,
  shareToken: string
): Promise<Analysis | null> {
  const { data: row, error } = await client
    .from("analyses")
    .select()
    .eq("share_token", shareToken)
    .single();

  if (error) {
    console.error("[queries] getAnalysisByShareToken error:", error.message);
    return null;
  }
  return row;
}

export async function getUserAnalyses(
  client: Client,
  userId: string,
  limit = 50
): Promise<Analysis[]> {
  const { data, error } = await client
    .from("analyses")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[queries] getUserAnalyses error:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── Brand Profiles ────────────────────────────────────────────

export async function upsertBrandProfile(
  client: Client,
  data: {
    user_id: string;
    name: string;
    handle?: string | null;
    platform?: "instagram" | "tiktok" | null;
    tone_vector?: number[] | null;
    description?: string | null;
    preferred_tiers?: string[];
    target_categories?: string[];
  }
): Promise<boolean> {
  const { error } = await client
    .from("brand_profiles")
    .upsert(
      {
        ...data,
        moodboard_urls: [],
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[queries] upsertBrandProfile error:", error.message);
    return false;
  }
  return true;
}

// ─── Vibe Searches ─────────────────────────────────────────────

export async function insertVibeSearch(
  client: Client,
  data: {
    user_id: string;
    image_url: string;
    tone_vector?: number[] | null;
    matched_influencer_ids?: string[];
  }
): Promise<boolean> {
  const { error } = await client
    .from("vibe_searches")
    .insert({
      ...data,
      matched_influencer_ids: data.matched_influencer_ids ?? [],
    });

  if (error) {
    console.error("[queries] insertVibeSearch error:", error.message);
    return false;
  }
  return true;
}

// ─── Saved Influencers ─────────────────────────────────────────

export async function getUserSavedInfluencers(
  client: Client,
  userId: string
): Promise<Array<{ influencer: Influencer; saved_at: string }>> {
  const { data, error } = await client
    .from("saved_influencers")
    .select("created_at, influencer_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return [];
  }

  const influencerIds = data.map((s) => s.influencer_id);
  const { data: influencers } = await client
    .from("influencers")
    .select()
    .in("id", influencerIds);

  if (!influencers) return [];

  const influencerMap = new Map(influencers.map((i) => [i.id, i]));
  return data
    .map((s) => {
      const influencer = influencerMap.get(s.influencer_id);
      if (!influencer) return null;
      return { influencer, saved_at: s.created_at };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function saveInfluencer(
  client: Client,
  userId: string,
  influencerId: string
): Promise<boolean> {
  const { error } = await client
    .from("saved_influencers")
    .upsert(
      { user_id: userId, influencer_id: influencerId },
      { onConflict: "user_id,influencer_id" }
    );

  if (error) {
    console.error("[queries] saveInfluencer error:", error.message);
    return false;
  }
  return true;
}

export async function unsaveInfluencer(
  client: Client,
  userId: string,
  influencerId: string
): Promise<boolean> {
  const { error } = await client
    .from("saved_influencers")
    .delete()
    .eq("user_id", userId)
    .eq("influencer_id", influencerId);

  if (error) {
    console.error("[queries] unsaveInfluencer error:", error.message);
    return false;
  }
  return true;
}

// ─── Vector Search (pgvector) ──────────────────────────────────

export async function matchInfluencersByVector(
  client: Client,
  queryVector: number[],
  matchCount = 10,
  matchThreshold = 0.7
): Promise<Array<Influencer & { similarity: number }>> {
  const { data, error } = await client.rpc("match_influencers", {
    query_vector: JSON.stringify(queryVector),
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (error) {
    console.error("[queries] matchInfluencersByVector error:", error.message);
    return [];
  }
  return (data as Array<Influencer & { similarity: number }>) ?? [];
}
