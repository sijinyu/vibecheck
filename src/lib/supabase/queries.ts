import { type SupabaseClient } from "@supabase/supabase-js";
import {
  type Analysis,
  type BrandProfile,
  type Campaign,
  type CampaignInfluencer,
  type Influencer,
} from "./types";

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
    post_performances?: Record<string, unknown>[] | null;
    content_type_breakdown?: Record<string, unknown>[] | null;
    trend_direction?: string | null;
    trend_magnitude?: number | null;
    avg_shares_per_post?: number | null;
    avg_plays_per_post?: number | null;
    estimated_cpe?: number | null;
    content_effectiveness_score?: number | null;
    platform_benchmark?: number | null;
    category?: string | null;
    representative_images?: string[];
    one_liner?: string | null;
    content_topics?: string[];
    data_source?: string;
    ai_source?: string;
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || `brand-${Date.now()}`;
}

export async function createBrandProfile(
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
    brand_positioning?: string | null;
    content_strategy?: Record<string, unknown>;
    ideal_influencer_profile?: Record<string, unknown>;
    brand_keywords?: string[];
    competitor_brands?: string[];
  }
): Promise<BrandProfile | null> {
  const slug = generateSlug(data.name);
  const { data: row, error } = await client
    .from("brand_profiles")
    .insert({
      ...data,
      slug,
      moodboard_urls: [],
    })
    .select()
    .single();

  if (error) {
    console.error("[queries] createBrandProfile error:", error.message, "| code:", error.code, "| details:", error.details, "| hint:", error.hint);
    return null;
  }
  return row;
}

export async function updateBrandProfile(
  client: Client,
  brandId: string,
  data: {
    name?: string;
    handle?: string | null;
    preferred_tiers?: string[];
    target_categories?: string[];
    description?: string | null;
    tone_vector?: number[] | null;
  }
): Promise<BrandProfile | null> {
  const updateData: Record<string, unknown> = { ...data };
  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }

  const { data: row, error } = await client
    .from("brand_profiles")
    .update(updateData)
    .eq("id", brandId)
    .select()
    .single();

  if (error) {
    console.error("[queries] updateBrandProfile error:", error.message);
    return null;
  }
  return row;
}

export async function deleteBrandProfile(
  client: Client,
  brandId: string
): Promise<boolean> {
  const { error } = await client
    .from("brand_profiles")
    .delete()
    .eq("id", brandId);

  if (error) {
    console.error("[queries] deleteBrandProfile error:", error.message);
    return false;
  }
  return true;
}

export async function getUserBrandProfiles(
  client: Client,
  userId: string
): Promise<BrandProfile[]> {
  const { data, error } = await client
    .from("brand_profiles")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[queries] getUserBrandProfiles error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getBrandProfileById(
  client: Client,
  brandId: string
): Promise<BrandProfile | null> {
  const { data: row, error } = await client
    .from("brand_profiles")
    .select()
    .eq("id", brandId)
    .single();

  if (error) {
    console.error("[queries] getBrandProfileById error:", error.message);
    return null;
  }
  return row;
}

/** @deprecated Use createBrandProfile instead */
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
  const result = await createBrandProfile(client, data);
  return result !== null;
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
  influencerId: string,
  brandId?: string | null
): Promise<boolean> {
  const { error } = await client
    .from("saved_influencers")
    .upsert(
      { user_id: userId, influencer_id: influencerId, ...(brandId ? { brand_id: brandId } : {}) },
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

// ─── Campaigns ────────────────────────────────────────────────

export async function createCampaign(
  client: Client,
  data: {
    brand_id: string;
    user_id: string;
    name: string;
    budget_krw?: number | null;
    brief_content?: string | null;
    target_kpi?: Record<string, unknown>;
    start_date?: string | null;
    end_date?: string | null;
  }
): Promise<Campaign | null> {
  const { data: row, error } = await client
    .from("campaigns")
    .insert({
      ...data,
      status: "draft",
      target_kpi: data.target_kpi ?? {},
      actual_kpi: {},
    })
    .select()
    .single();

  if (error) {
    console.error("[queries] createCampaign error:", error.message);
    return null;
  }
  return row;
}

export async function getCampaignsByBrand(
  client: Client,
  brandId: string,
  userId: string
): Promise<Campaign[]> {
  const { data, error } = await client
    .from("campaigns")
    .select()
    .eq("brand_id", brandId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[queries] getCampaignsByBrand error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getCampaignById(
  client: Client,
  campaignId: string
): Promise<Campaign | null> {
  const { data: row, error } = await client
    .from("campaigns")
    .select()
    .eq("id", campaignId)
    .single();

  if (error) {
    console.error("[queries] getCampaignById error:", error.message);
    return null;
  }
  return row;
}

export async function updateCampaign(
  client: Client,
  campaignId: string,
  data: Partial<{
    name: string;
    status: string;
    budget_krw: number | null;
    brief_content: string | null;
    target_kpi: Record<string, unknown>;
    actual_kpi: Record<string, unknown>;
    start_date: string | null;
    end_date: string | null;
  }>
): Promise<Campaign | null> {
  const { data: row, error } = await client
    .from("campaigns")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .select()
    .single();

  if (error) {
    console.error("[queries] updateCampaign error:", error.message);
    return null;
  }
  return row;
}

export async function deleteCampaign(
  client: Client,
  campaignId: string
): Promise<boolean> {
  const { error } = await client
    .from("campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) {
    console.error("[queries] deleteCampaign error:", error.message);
    return false;
  }
  return true;
}

// ─── Campaign Influencers ─────────────────────────────────────

export async function addInfluencerToCampaign(
  client: Client,
  data: {
    campaign_id: string;
    influencer_id: string;
    notes?: string | null;
  }
): Promise<CampaignInfluencer | null> {
  const { data: row, error } = await client
    .from("campaign_influencers")
    .upsert(
      {
        ...data,
        status: "shortlisted",
        status_updated_at: new Date().toISOString(),
      },
      { onConflict: "campaign_id,influencer_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[queries] addInfluencerToCampaign error:", error.message);
    return null;
  }
  return row;
}

export async function updateCampaignInfluencer(
  client: Client,
  campaignId: string,
  influencerId: string,
  data: Partial<{
    status: string;
    outreach_message: string | null;
    collaboration_proposal: string | null;
    agreed_fee_krw: number | null;
    actual_reach: number | null;
    actual_engagement: number | null;
    notes: string | null;
  }>
): Promise<CampaignInfluencer | null> {
  const updateData: Record<string, unknown> = { ...data };
  if (data.status) {
    updateData.status_updated_at = new Date().toISOString();
  }

  const { data: row, error } = await client
    .from("campaign_influencers")
    .update(updateData)
    .eq("campaign_id", campaignId)
    .eq("influencer_id", influencerId)
    .select()
    .single();

  if (error) {
    console.error("[queries] updateCampaignInfluencer error:", error.message);
    return null;
  }
  return row;
}

export async function getCampaignInfluencers(
  client: Client,
  campaignId: string
): Promise<Array<CampaignInfluencer & { influencer: Influencer }>> {
  const { data, error } = await client
    .from("campaign_influencers")
    .select("*, influencer:influencers(*)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[queries] getCampaignInfluencers error:", error.message);
    return [];
  }

  // Transform: Supabase returns influencer as object
  return (data ?? []).map((row) => ({
    ...row,
    influencer: row.influencer as unknown as Influencer,
  }));
}

export async function removeInfluencerFromCampaign(
  client: Client,
  campaignId: string,
  influencerId: string
): Promise<boolean> {
  const { error } = await client
    .from("campaign_influencers")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("influencer_id", influencerId);

  if (error) {
    console.error("[queries] removeInfluencerFromCampaign error:", error.message);
    return false;
  }
  return true;
}
