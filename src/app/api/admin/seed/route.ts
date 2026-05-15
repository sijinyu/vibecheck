import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { fetchTikTokFeed } from "@/lib/adapters/tiktok";
import { analyzeAesthetics } from "@/lib/ai/scoring-engine";
import { calculateVibeScore } from "@/lib/ai/vibe-score-engine";
import { tryCreateClient } from "@/lib/supabase/server";
import { upsertInfluencer } from "@/lib/supabase/queries";
import { SEED_INFLUENCERS, getSeedsByFilter, type SeedInfluencer } from "@/lib/seed/influencer-seed";

const ADMIN_KEY = process.env.ADMIN_SEED_KEY;

export async function POST(request: Request) {
  try {
    // Auth: service key or admin key
    const authHeader = request.headers.get("authorization");
    const providedKey = authHeader?.replace("Bearer ", "");

    if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      category,
      platform,
      limit = 10,
      offset = 0,
      dryRun = false,
    } = body as {
      category?: string;
      platform?: "instagram" | "tiktok";
      limit?: number;
      offset?: number;
      dryRun?: boolean;
    };

    const seeds = getSeedsByFilter({ category, platform }).slice(offset, offset + limit);

    if (seeds.length === 0) {
      return NextResponse.json({
        data: {
          message: "No seeds to process",
          total: SEED_INFLUENCERS.length,
          filtered: 0,
        },
      });
    }

    if (dryRun) {
      return NextResponse.json({
        data: {
          message: "Dry run",
          seeds: seeds.map((s) => `${s.platform}:@${s.handle} (${s.category})`),
          count: seeds.length,
          total: SEED_INFLUENCERS.length,
        },
      });
    }

    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "Database not available" } },
        { status: 503 }
      );
    }

    const results = await processSeedBatch(seeds, supabase);

    return NextResponse.json({
      data: {
        processed: results.length,
        success: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "failed").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        details: results,
      },
    });
  } catch (err) {
    console.error("[admin-seed] error:", err);
    return NextResponse.json(
      { error: { message: "Seed processing failed" } },
      { status: 500 }
    );
  }
}

/** GET: check seed status */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "");

  if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const supabase = await tryCreateClient();
  if (!supabase) {
    return NextResponse.json({ error: { message: "Database not available" } }, { status: 503 });
  }

  // Count already-seeded influencers
  const { count: totalInDb } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true });

  const { count: withVibeScore } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true })
    .not("vibe_score", "is", null);

  const categories = [...new Set(SEED_INFLUENCERS.map((s) => s.category))];
  const categoryBreakdown: Record<string, number> = {};
  for (const cat of categories) {
    categoryBreakdown[cat] = SEED_INFLUENCERS.filter((s) => s.category === cat).length;
  }

  return NextResponse.json({
    data: {
      seedList: {
        total: SEED_INFLUENCERS.length,
        categories: categoryBreakdown,
      },
      database: {
        totalInfluencers: totalInDb ?? 0,
        withVibeScore: withVibeScore ?? 0,
      },
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processSeedBatch(seeds: SeedInfluencer[], supabase: any) {
  const results: Array<{
    handle: string;
    platform: string;
    status: "success" | "failed" | "skipped";
    message: string;
  }> = [];

  for (const seed of seeds) {
    try {
      // Check if already analyzed recently (within 7 days)
      const { data: existing } = await supabase
        .from("influencers")
        .select("id, last_analyzed_at")
        .eq("handle", seed.handle)
        .eq("platform", seed.platform)
        .maybeSingle();

      if (existing?.last_analyzed_at) {
        const lastAnalyzed = new Date(existing.last_analyzed_at);
        const daysSince = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          results.push({
            handle: seed.handle,
            platform: seed.platform,
            status: "skipped",
            message: `Already analyzed ${Math.round(daysSince)} days ago`,
          });
          continue;
        }
      }

      // Fetch feed
      const feedResult =
        seed.platform === "tiktok"
          ? await fetchTikTokFeed(seed.handle)
          : await fetchInstagramFeed(seed.handle);

      if ("error" in feedResult) {
        results.push({
          handle: seed.handle,
          platform: seed.platform,
          status: "failed",
          message: feedResult.error.message,
        });
        continue;
      }

      // AI Analysis
      const analysis = await analyzeAesthetics(feedResult.data);
      const vibeResult = calculateVibeScore(feedResult.data, analysis.scores);

      // Persist
      await upsertInfluencer(supabase, {
        handle: seed.handle,
        platform: seed.platform,
        display_name: feedResult.data.profile.displayName ?? null,
        profile_image_url: feedResult.data.profile.profileImageUrl ?? null,
        bio: feedResult.data.profile.bio ?? null,
        follower_count: feedResult.data.profile.followerCount ?? null,
        following_count: feedResult.data.profile.followingCount ?? null,
        aesthetic_vector: analysis.aestheticVector,
        aesthetic_score: analysis.scores.overall,
        color_score: analysis.scores.color,
        composition_score: analysis.scores.composition,
        tone_consistency_score: analysis.scores.toneConsistency,
        trend_score: analysis.scores.trend,
        vibe_score: vibeResult.vibeScore,
        engagement_score: vibeResult.engagementScore,
        consistency_score: vibeResult.consistencyScore,
        growth_potential_score: vibeResult.growthPotentialScore,
        authenticity_score: vibeResult.authenticityScore,
        tier: vibeResult.tier,
        avg_likes_per_post: vibeResult.avgLikesPerPost,
        avg_comments_per_post: vibeResult.avgCommentsPerPost,
        engagement_rate: vibeResult.engagementRate,
        posting_frequency_days: vibeResult.postingFrequencyDays,
        top_hashtags: vibeResult.topHashtags,
        content_categories: vibeResult.contentCategories,
        insights: vibeResult.insights as unknown as Record<string, unknown>[],
        post_performances: vibeResult.postPerformances as unknown as Record<string, unknown>[],
        content_type_breakdown: vibeResult.contentTypeBreakdown as unknown as Record<string, unknown>[],
        trend_direction: vibeResult.trendDirection,
        trend_magnitude: vibeResult.trendMagnitude,
        avg_shares_per_post: vibeResult.avgSharesPerPost,
        avg_plays_per_post: vibeResult.avgPlaysPerPost,
        estimated_cpe: vibeResult.estimatedCPE,
        content_effectiveness_score: vibeResult.contentEffectivenessScore,
        platform_benchmark: vibeResult.platformBenchmark,
        category: seed.category,
        representative_images: analysis.representativeImages,
        one_liner: analysis.oneLiner || null,
        content_topics: analysis.contentTopics,
        data_source: feedResult.data.dataSource,
        ai_source: analysis.aiSource,
      });

      results.push({
        handle: seed.handle,
        platform: seed.platform,
        status: "success",
        message: `VibeScore: ${vibeResult.vibeScore}`,
      });

      // Rate limit: wait between API calls
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`[admin-seed] Failed to process ${seed.handle}:`, err);
      results.push({
        handle: seed.handle,
        platform: seed.platform,
        status: "failed",
        message: String(err),
      });
    }
  }

  return results;
}
