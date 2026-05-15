/**
 * Full Upgrade Pipeline
 *
 * Light → Full 업그레이드 오케스트레이터.
 * Cron Day 1에서 호출하여 light 프로필을 full로 승격.
 *
 * 파이프라인:
 * 1. Feed fetch (1 RapidAPI call)
 * 2. analyzeAesthetics() — Gemini 미학 분석 (무료)
 * 3. calculateVibeScore() — 5D 점수 계산 (로컬)
 * 4. generateAestheticDescription() — 텍스트 설명 (무료)
 * 5. discovery_status = 'full' + 모든 점수/벡터 저장
 */

import { type SupabaseClient } from "@supabase/supabase-js";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { fetchTikTokFeed } from "@/lib/adapters/tiktok";
import { analyzeAesthetics } from "@/lib/ai/scoring-engine";
import { calculateVibeScore } from "@/lib/ai/vibe-score-engine";
import { generateAestheticDescription } from "@/lib/ai/text-matching-engine";
import { upsertInfluencer } from "@/lib/supabase/queries";
import { incrementApiUsage } from "./api-budget";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface FullUpgradeResult {
  success: boolean;
  handle: string;
  platform: string;
  message: string;
  vibeScore?: number;
}

/**
 * Upgrade a light profile to full: fetch feed, AI analysis, VibeScore, save.
 * Costs 1 RapidAPI call + 1-2 Gemini calls (free).
 */
export async function fullUpgrade(
  client: Client,
  handle: string,
  platform: "instagram" | "tiktok",
  category?: string | null
): Promise<FullUpgradeResult> {
  try {
    // Step 1: Fetch feed data (1 RapidAPI call)
    const feedResult =
      platform === "tiktok"
        ? await fetchTikTokFeed(handle)
        : await fetchInstagramFeed(handle);

    await incrementApiUsage(client, 1);

    if ("error" in feedResult) {
      return {
        success: false,
        handle,
        platform,
        message: feedResult.error.message,
      };
    }

    const feedData = feedResult.data;

    // Step 2: AI Aesthetic Analysis via Gemini (free)
    let analysisResult = null;
    try {
      analysisResult = await analyzeAesthetics(feedData);
    } catch (err) {
      console.error(`[full-upgrade] Aesthetic analysis failed for ${handle}:`, err);
    }

    // Step 3: Calculate VibeScore (local computation)
    const aestheticScoresForVibe = analysisResult?.scores ?? {
      overall: 50,
      color: 50,
      composition: 50,
      toneConsistency: 50,
      trend: 50,
      styleOriginality: 50,
    };
    const vibeResult = calculateVibeScore(feedData, aestheticScoresForVibe);

    // Representative images
    const imageUrls = feedData.posts
      .filter((p) => p.imageUrl)
      .slice(0, 6)
      .map((p) => p.imageUrl);

    // Step 4: Generate aesthetic description (Gemini, free)
    const aestheticDescription = await generateAestheticDescription({
      handle,
      bio: feedData.profile.bio ?? null,
      hashtags: vibeResult.topHashtags,
      categories: vibeResult.contentCategories,
      followerCount: feedData.profile.followerCount ?? null,
      engagementRate: vibeResult.engagementRate,
    });

    // Step 5: Save everything to DB
    await upsertInfluencer(client, {
      handle,
      platform,
      display_name: feedData.profile.displayName ?? null,
      profile_image_url: feedData.profile.profileImageUrl ?? null,
      bio: feedData.profile.bio ?? null,
      follower_count: feedData.profile.followerCount ?? null,
      following_count: feedData.profile.followingCount ?? null,
      aesthetic_vector: analysisResult?.aestheticVector ?? null,
      aesthetic_score: vibeResult.aestheticScore,
      color_score: analysisResult?.scores.color ?? null,
      composition_score: analysisResult?.scores.composition ?? null,
      tone_consistency_score: analysisResult?.scores.toneConsistency ?? null,
      trend_score: analysisResult?.scores.trend ?? null,
      vibe_score: vibeResult.vibeScore,
      engagement_score: vibeResult.engagementScore,
      consistency_score: vibeResult.consistencyScore,
      growth_potential_score: vibeResult.growthPotentialScore,
      authenticity_score: vibeResult.authenticityScore,
      tier: vibeResult.tier,
      engagement_rate: vibeResult.engagementRate,
      avg_likes_per_post: vibeResult.avgLikesPerPost,
      avg_comments_per_post: vibeResult.avgCommentsPerPost,
      avg_shares_per_post: vibeResult.avgSharesPerPost,
      avg_plays_per_post: vibeResult.avgPlaysPerPost,
      posting_frequency_days: vibeResult.postingFrequencyDays,
      top_hashtags: vibeResult.topHashtags,
      content_categories: vibeResult.contentCategories,
      insights: vibeResult.insights as unknown as Record<string, unknown>[],
      post_performances: vibeResult.postPerformances as unknown as Record<string, unknown>[],
      content_type_breakdown: vibeResult.contentTypeBreakdown as unknown as Record<string, unknown>[],
      trend_direction: vibeResult.trendDirection,
      trend_magnitude: vibeResult.trendMagnitude,
      estimated_cpe: vibeResult.estimatedCPE,
      content_effectiveness_score: vibeResult.contentEffectivenessScore,
      platform_benchmark: vibeResult.platformBenchmark,
      category: category ?? vibeResult.contentCategories[0] ?? null,
      representative_images: imageUrls,
      one_liner: analysisResult?.oneLiner ?? null,
      content_topics: analysisResult?.contentTopics ?? [],
      data_source: feedData.dataSource ?? "live",
      ai_source: analysisResult?.aiSource ?? "gemini",
    });

    // Update discovery_status to 'full' + aesthetic_description
    await client
      .from("influencers")
      .update({
        discovery_status: "full",
        profile_image_cached_at: new Date().toISOString(),
        ...(aestheticDescription ? { aesthetic_description: aestheticDescription } : {}),
      })
      .eq("handle", handle)
      .eq("platform", platform);

    return {
      success: true,
      handle,
      platform,
      message: `Full upgrade complete (VibeScore: ${vibeResult.vibeScore})`,
      vibeScore: vibeResult.vibeScore,
    };
  } catch (err) {
    console.error(`[full-upgrade] Failed for ${handle}:`, err);
    return {
      success: false,
      handle,
      platform,
      message: String(err),
    };
  }
}
