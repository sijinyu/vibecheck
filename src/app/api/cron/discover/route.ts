import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  enqueueSeedInfluencers,
  enqueueForDiscovery,
  processDiscoveryQueue,
} from "@/lib/discovery/discovery-service";
import { canMakeApiCall, getApiUsage, getMonthlyBudget } from "@/lib/discovery/api-budget";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { incrementApiUsage } from "@/lib/discovery/api-budget";
import { fullUpgrade } from "@/lib/discovery/full-upgrade-pipeline";
import {
  suggestHandlesByCategory,
  pickRandomCategories,
} from "@/lib/discovery/category-handle-suggester";
import { backfillAestheticDescriptions } from "@/lib/ai/text-matching-engine";
import { lightAnalyze } from "@/lib/discovery/light-analyzer";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // Auth: Vercel Cron uses Authorization header
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "Database not available" } },
        { status: 503 }
      );
    }

    // Manual override: ?job=N runs a single job
    // Default (daily cron): runs multiple jobs in sequence
    const { searchParams } = new URL(request.url);
    const manualJob = searchParams.get("job");

    const allResults: Record<string, unknown>[] = [];

    if (manualJob !== null) {
      // Single job mode
      const jobIndex = parseInt(manualJob, 10);
      const result = await runJob(supabase, jobIndex);
      allResults.push(result);
    } else {
      // Daily batch: rotate through 2-3 jobs per day
      const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const jobRotation = dayOfYear % 3;

      // Always: seed + light analyze
      allResults.push(await runJob(supabase, 0));

      // Rotate secondary jobs
      if (jobRotation === 0) {
        allResults.push(await runJob(supabase, 1)); // Full upgrade
        allResults.push(await runJob(supabase, 4)); // AI category discovery
      } else if (jobRotation === 1) {
        allResults.push(await runJob(supabase, 2)); // Image refresh
        allResults.push(await runJob(supabase, 3)); // Hashtag discovery
      } else {
        allResults.push(await runJob(supabase, 1)); // Full upgrade
        allResults.push(await runJob(supabase, 2)); // Image refresh
      }
    }

    const usage = await getApiUsage(supabase);

    return NextResponse.json({
      data: {
        jobs: allResults,
        apiUsage: { current: usage, budget: getMonthlyBudget() },
      },
    });
  } catch (err) {
    console.error("[cron-discover] error:", err);
    return NextResponse.json(
      { error: { message: "Cron job failed" } },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runJob(supabase: any, jobIndex: number): Promise<Record<string, unknown>> {
  switch (jobIndex) {
    case 0: return jobSeedAndLightAnalyze(supabase);
    case 1: return jobUpgradeLightToFull(supabase);
    case 2: return jobRefreshImages(supabase);
    case 3: return jobTrendingHashtagDiscovery(supabase);
    case 4: return jobAiCategoryDiscovery(supabase);
    default: return { job: "none", message: "Unknown job index" };
  }
}

/**
 * Day 0: Seed influencers → queue + batch light-analyze (10건)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function jobSeedAndLightAnalyze(supabase: any) {
  const enqueued = await enqueueSeedInfluencers(supabase);
  const results = await processDiscoveryQueue(supabase, 10);

  return {
    job: "seed_and_light_analyze",
    enqueued,
    processed: results.length,
    success: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  };
}

/**
 * Day 1: Upgrade light → full (3건, 팔로워 많은 순)
 * Full pipeline: feed fetch + Gemini aesthetic + VibeScore + aesthetic description
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function jobUpgradeLightToFull(supabase: any) {
  const UPGRADE_BATCH = 3;

  if (!(await canMakeApiCall(supabase, UPGRADE_BATCH))) {
    return { job: "upgrade_light_to_full", message: "API budget exceeded" };
  }

  // Get light profiles ordered by follower count
  const { data: lightProfiles } = await supabase
    .from("influencers")
    .select("handle, platform, category")
    .eq("discovery_status", "light")
    .order("follower_count", { ascending: false, nullsFirst: false })
    .limit(UPGRADE_BATCH);

  if (!lightProfiles || lightProfiles.length === 0) {
    return { job: "upgrade_light_to_full", message: "No light profiles to upgrade" };
  }

  const results: Array<{ handle: string; status: string; vibeScore?: number }> = [];
  for (const profile of lightProfiles) {
    if (!(await canMakeApiCall(supabase, 1))) break;

    const result = await fullUpgrade(
      supabase,
      profile.handle,
      profile.platform as "instagram" | "tiktok",
      profile.category
    );
    results.push({
      handle: profile.handle,
      status: result.success ? "success" : "failed",
      vibeScore: result.vibeScore,
    });

    // Rate limit between API calls
    if (lightProfiles.indexOf(profile) < lightProfiles.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Also backfill aesthetic descriptions for light profiles that don't have them
  const descriptionsFilled = await backfillAestheticDescriptions(supabase, 5);

  return {
    job: "upgrade_light_to_full",
    processed: results.length,
    results,
    descriptionsFilled,
  };
}

/**
 * Day 2: Refresh expired image URLs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function jobRefreshImages(supabase: any) {
  if (!(await canMakeApiCall(supabase, 5))) {
    return { job: "refresh_images", message: "API budget exceeded" };
  }

  // Find influencers with stale images (cached > 7 days ago or never cached)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: staleProfiles } = await supabase
    .from("influencers")
    .select("handle, platform")
    .or(`profile_image_cached_at.is.null,profile_image_cached_at.lt.${sevenDaysAgo}`)
    .not("representative_images", "eq", "{}")
    .order("follower_count", { ascending: false, nullsFirst: false })
    .limit(5);

  if (!staleProfiles || staleProfiles.length === 0) {
    return { job: "refresh_images", message: "No stale images to refresh" };
  }

  let refreshed = 0;
  for (const profile of staleProfiles) {
    try {
      if (!(await canMakeApiCall(supabase, 1))) break;

      const feedResult = await fetchInstagramFeed(profile.handle);
      await incrementApiUsage(supabase, 1);

      if ("error" in feedResult) continue;

      const newImages = feedResult.data.posts
        .filter((p) => p.imageUrl)
        .slice(0, 6)
        .map((p) => p.imageUrl);

      if (newImages.length > 0) {
        await supabase
          .from("influencers")
          .update({
            representative_images: newImages,
            profile_image_url: feedResult.data.profile.profileImageUrl,
            profile_image_cached_at: new Date().toISOString(),
          })
          .eq("handle", profile.handle)
          .eq("platform", profile.platform);

        refreshed++;
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`[cron-discover] Image refresh failed for ${profile.handle}:`, err);
    }
  }

  return {
    job: "refresh_images",
    checked: staleProfiles.length,
    refreshed,
  };
}

/**
 * Day 3: Trending hashtag-based discovery
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function jobTrendingHashtagDiscovery(supabase: any) {
  // Get most popular hashtags from existing influencers
  const { data: influencers } = await supabase
    .from("influencers")
    .select("top_hashtags")
    .not("top_hashtags", "eq", "{}")
    .limit(100);

  if (!influencers || influencers.length === 0) {
    return { job: "trending_hashtag_discovery", message: "No hashtag data available" };
  }

  // Count hashtag frequency
  const hashtagCounts = new Map<string, number>();
  for (const inf of influencers) {
    for (const tag of inf.top_hashtags ?? []) {
      hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
    }
  }

  // Top 5 hashtags → enqueue related seeds
  const topHashtags = [...hashtagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const enqueued = await enqueueSeedInfluencers(supabase);
  const results = await processDiscoveryQueue(supabase, 5);

  return {
    job: "trending_hashtag_discovery",
    topHashtags,
    enqueued,
    processed: results.length,
    success: results.filter((r) => r.success).length,
  };
}

/**
 * Day 4: AI Category Discovery — Gemini가 카테고리별 인플루언서를 추천
 * 2~3 카테고리 × 15핸들 → enqueue → top 5 light-analyze
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function jobAiCategoryDiscovery(supabase: any) {
  const CATEGORIES_PER_RUN = 2;
  const IMMEDIATE_ANALYZE = 5;

  // Pick random categories
  const categories = pickRandomCategories(CATEGORIES_PER_RUN);

  let totalEnqueued = 0;
  const allSuggestions: Array<{ handle: string; category: string; reason: string }> = [];

  for (const category of categories) {
    const suggestions = await suggestHandlesByCategory(category);

    for (const suggestion of suggestions) {
      const success = await enqueueForDiscovery(
        supabase,
        suggestion.handle,
        "instagram",
        "ai_category",
        {
          sourceDetail: category,
          category: suggestion.estimatedCategory,
          priority: 15,
        }
      );
      if (success) {
        totalEnqueued++;
        allSuggestions.push({
          handle: suggestion.handle,
          category: suggestion.estimatedCategory,
          reason: suggestion.reason,
        });
      }
    }
  }

  // Immediately light-analyze top N (if budget permits)
  let analyzed = 0;
  const toAnalyze = allSuggestions.slice(0, IMMEDIATE_ANALYZE);

  for (const item of toAnalyze) {
    if (!(await canMakeApiCall(supabase, 1))) break;

    const result = await lightAnalyze(
      supabase,
      item.handle,
      "instagram",
      item.category
    );

    if (result.success) {
      // Save AI suggestion reason
      await supabase
        .from("influencers")
        .update({ ai_suggestion_reason: item.reason })
        .eq("handle", item.handle)
        .eq("platform", "instagram");

      analyzed++;
    }

    // Rate limit
    if (toAnalyze.indexOf(item) < toAnalyze.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return {
    job: "ai_category_discovery",
    categories,
    totalSuggested: allSuggestions.length,
    enqueued: totalEnqueued,
    immediateAnalyzed: analyzed,
    remainingForCron: Math.max(0, totalEnqueued - analyzed),
  };
}
