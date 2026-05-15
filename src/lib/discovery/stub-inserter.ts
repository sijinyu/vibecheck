/**
 * Stub Inserter
 *
 * mass-stub-generator에서 생성된 StubSuggestion 배열을
 * Supabase `influencers` 테이블에 배치 upsert.
 *
 * - discovery_status = "stub" 으로 삽입 (아직 실제 분석 전)
 * - handle + platform 조합이 이미 존재하면 skip (중복 안전)
 * - 50개 단위로 배치 처리 (Vercel timeout 방지)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StubSuggestion } from "./mass-stub-generator";
import type { Database } from "@/lib/supabase/types";

export interface StubInsertResult {
  inserted: number;
  skipped: number;
  duplicates: number;
  errors: number;
}

// -----------------------------------------------------------------------
// Tier engagement rate benchmarks (Instagram)
// -----------------------------------------------------------------------

const TIER_ENGAGEMENT_RATE: Record<string, number> = {
  nano: 0.045,
  micro: 0.028,
  mid: 0.018,
  macro: 0.013,
  mega: 0.008,
};

const DEFAULT_ENGAGEMENT_RATE = 0.025;

// -----------------------------------------------------------------------
// Follower range → numeric midpoint
// -----------------------------------------------------------------------

/**
 * "10K-50K" → 30000, "1K-10K" → 5000, "1M+" → 1500000
 */
export function parseFollowerRange(range: string): number {
  const clean = range.trim().toUpperCase();

  // Handle "X+" pattern (e.g. "1M+")
  const plusMatch = /^([\d.]+)(K|M)?\+$/.exec(clean);
  if (plusMatch) {
    const value = parseFloat(plusMatch[1]);
    const multiplier = plusMatch[2] === "M" ? 1_000_000 : plusMatch[2] === "K" ? 1_000 : 1;
    return Math.round(value * multiplier * 1.5); // 1.5x as midpoint estimate
  }

  // Handle "X-Y" pattern (e.g. "10K-50K", "200K-1M")
  const rangeMatch = /^([\d.]+)(K|M)?-([\d.]+)(K|M)?$/.exec(clean);
  if (rangeMatch) {
    const parseUnit = (num: string, unit: string | undefined): number => {
      const n = parseFloat(num);
      if (unit === "M") return n * 1_000_000;
      if (unit === "K") return n * 1_000;
      return n;
    };
    const low = parseUnit(rangeMatch[1], rangeMatch[2]);
    const high = parseUnit(rangeMatch[3], rangeMatch[4]);
    return Math.round((low + high) / 2);
  }

  // Handle plain number (e.g. "50000")
  const plainMatch = /^([\d.]+)(K|M)?$/.exec(clean);
  if (plainMatch) {
    const n = parseFloat(plainMatch[1]);
    const multiplier = plainMatch[2] === "M" ? 1_000_000 : plainMatch[2] === "K" ? 1_000 : 1;
    return Math.round(n * multiplier);
  }

  // Fallback: return 0 (will be stored as null)
  return 0;
}

/**
 * Normalize tier string to one of the known tiers.
 */
function normalizeTier(raw: string): string {
  const t = raw.toLowerCase().trim();
  const known = ["nano", "micro", "mid", "macro", "mega"];
  if (known.includes(t)) return t;

  // Attempt fuzzy match
  if (t.includes("nano")) return "nano";
  if (t.includes("micro")) return "micro";
  if (t.includes("mid") || t.includes("medium")) return "mid";
  if (t.includes("macro")) return "macro";
  if (t.includes("mega")) return "mega";

  return "micro"; // safe default
}

// -----------------------------------------------------------------------
// Row builder
// -----------------------------------------------------------------------

type InfluencerInsert = Database["public"]["Tables"]["influencers"]["Insert"];

function buildInfluencerRow(suggestion: StubSuggestion): InfluencerInsert {
  const tier = normalizeTier(suggestion.estimatedTier);
  const followerCount = parseFollowerRange(suggestion.estimatedFollowers);
  const engagementRate = TIER_ENGAGEMENT_RATE[tier] ?? DEFAULT_ENGAGEMENT_RATE;

  return {
    handle: suggestion.handle,
    platform: "instagram",
    display_name: null,
    profile_image_url: null,
    bio: null,
    follower_count: followerCount > 0 ? followerCount : null,
    following_count: null,
    aesthetic_vector: null,
    aesthetic_score: null,
    color_score: null,
    composition_score: null,
    tone_consistency_score: null,
    trend_score: null,
    vibe_score: null,
    engagement_score: null,
    consistency_score: null,
    growth_potential_score: null,
    authenticity_score: null,
    tier,
    avg_likes_per_post: null,
    avg_comments_per_post: null,
    engagement_rate: engagementRate,
    posting_frequency_days: null,
    top_hashtags: [],
    content_categories: [suggestion.category],
    insights: null,
    post_performances: null,
    content_type_breakdown: null,
    trend_direction: null,
    trend_magnitude: null,
    avg_shares_per_post: null,
    avg_plays_per_post: null,
    estimated_cpe: null,
    content_effectiveness_score: null,
    platform_benchmark: null,
    category: suggestion.category,
    representative_images: [],
    one_liner: suggestion.oneLiner || null,
    content_topics: suggestion.subNiche ? [suggestion.subNiche] : [],
    data_source: "ai_stub",
    ai_source: "gemini",
    discovery_status: "stub",
    aesthetic_description: null,
    text_match_score: null,
    ai_suggestion_reason: suggestion.reason || null,
    profile_image_cached_at: null,
    last_analyzed_at: null,
  };
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

const BATCH_SIZE = 50;

/**
 * StubSuggestion 배열을 Supabase influencers 테이블에 배치 upsert.
 * handle + platform 충돌 시 기존 레코드를 유지(skip).
 */
export async function insertStubBatch(
  supabase: SupabaseClient,
  suggestions: StubSuggestion[]
): Promise<StubInsertResult> {
  const result: StubInsertResult = {
    inserted: 0,
    skipped: 0,
    duplicates: 0,
    errors: 0,
  };

  if (suggestions.length === 0) return result;

  // Split into batches of BATCH_SIZE
  for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
    const batch = suggestions.slice(i, i + BATCH_SIZE);
    const rows = batch.map(buildInfluencerRow);

    try {
      const { data, error } = await supabase
        .from("influencers")
        .upsert(rows, {
          onConflict: "handle,platform",
          ignoreDuplicates: true, // skip existing rows, do not overwrite
        })
        .select("id");

      if (error) {
        console.error(
          `[stub-inserter] Upsert error on batch ${i / BATCH_SIZE + 1}:`,
          error.message
        );
        result.errors += batch.length;
        continue;
      }

      const insertedCount = data?.length ?? 0;
      const skippedCount = batch.length - insertedCount;

      result.inserted += insertedCount;
      result.duplicates += skippedCount;
    } catch (err) {
      console.error(
        `[stub-inserter] Unexpected error on batch ${i / BATCH_SIZE + 1}:`,
        err
      );
      result.errors += batch.length;
    }
  }

  return result;
}
