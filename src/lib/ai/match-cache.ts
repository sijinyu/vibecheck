/**
 * Match Cache Utility
 *
 * Manages brand_match_cache for fast recommendation retrieval.
 * Cache TTL: 7 days. Stale entries are recomputed on access.
 */

import { type SupabaseClient } from "@supabase/supabase-js";
import { calculateMatchScores, type MatchResult } from "./matching-engine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

const CACHE_TTL_DAYS = 7;

interface CachedMatch {
  brand_id: string;
  influencer_id: string;
  match_score: number;
  aesthetic_match: number | null;
  tier_compatibility: number | null;
  category_alignment: number | null;
  quality_filter: number | null;
  confidence_level: string | null;
  match_reason: string | null;
  cached_at: string;
}

/**
 * Read cached match scores for a brand (within TTL).
 * Returns null if cache miss or all entries are stale.
 */
export async function readMatchCache(
  client: Client,
  brandId: string,
  limit = 20
): Promise<CachedMatch[] | null> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CACHE_TTL_DAYS);

  const { data, error } = await client
    .from("brand_match_cache")
    .select("*")
    .eq("brand_id", brandId)
    .gte("cached_at", cutoff.toISOString())
    .order("match_score", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return null;
  return data;
}

/**
 * Write match results to cache (upsert).
 */
export async function writeMatchCache(
  client: Client,
  brandId: string,
  results: MatchResult[]
): Promise<void> {
  if (results.length === 0) return;

  const rows = results.map((r) => ({
    brand_id: brandId,
    influencer_id: r.influencerId,
    match_score: r.matchScore,
    aesthetic_match: r.aestheticMatch ?? null,
    tier_compatibility: r.tierCompatibility ?? null,
    category_alignment: r.categoryAlignment ?? null,
    quality_filter: r.qualityFilter ?? null,
    confidence_level: r.confidenceLevel ?? null,
    match_reason: r.matchReason ?? null,
    cached_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from("brand_match_cache")
    .upsert(rows, { onConflict: "brand_id,influencer_id" });

  if (error) {
    console.error("[match-cache] Failed to write cache:", error.message);
  }
}

/**
 * Invalidate cache for a specific brand (e.g., after brand update).
 */
export async function invalidateBrandCache(
  client: Client,
  brandId: string
): Promise<void> {
  const { error } = await client
    .from("brand_match_cache")
    .delete()
    .eq("brand_id", brandId);

  if (error) {
    console.error("[match-cache] Failed to invalidate:", error.message);
  }
}

/**
 * Rebuild cache for a brand against all eligible influencers.
 * Used after brand registration or influencer analysis completion.
 */
export async function rebuildBrandCache(
  client: Client,
  brandId: string
): Promise<number> {
  // Fetch brand
  const { data: brand } = await client
    .from("brand_profiles")
    .select("tone_vector, preferred_tiers, target_categories")
    .eq("id", brandId)
    .single();

  if (!brand?.tone_vector) return 0;

  // Fetch all eligible influencers
  const { data: influencers } = await client
    .from("influencers")
    .select("id, handle, platform, display_name, aesthetic_vector, vibe_score, engagement_score, authenticity_score, tier, engagement_rate, follower_count, content_categories, representative_images, discovery_status")
    .or("discovery_status.eq.full,discovery_status.eq.light")
    .gte("follower_count", 300);

  if (!influencers || influencers.length === 0) return 0;

  const results = calculateMatchScores(
    influencers,
    {
      toneVector: brand.tone_vector,
      preferredTiers: brand.preferred_tiers ?? [],
      targetCategories: brand.target_categories ?? [],
    },
    { relaxed: true }
  );

  await writeMatchCache(client, brandId, results);
  return results.length;
}
