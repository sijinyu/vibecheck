/**
 * Discovery Service — 핵심 오케스트레이터
 *
 * 다양한 소스에서 인플루언서를 발견하고 큐에 넣거나 바로 light-analyze.
 */

import { type SupabaseClient } from "@supabase/supabase-js";
import { SEED_INFLUENCERS, getSeedsByFilter } from "@/lib/seed/influencer-seed";
import { lightAnalyze, type LightAnalysisResult } from "./light-analyzer";
import { canMakeApiCall } from "./api-budget";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

/**
 * Enqueue an influencer for discovery processing.
 * Skips if already in queue or already analyzed.
 */
export async function enqueueForDiscovery(
  client: Client,
  handle: string,
  platform: string,
  source: "seed" | "hashtag" | "brand_keyword" | "similar" | "ai_suggest" | "ai_category",
  options?: {
    sourceDetail?: string;
    category?: string;
    priority?: number;
  }
): Promise<boolean> {
  // Check if already in influencers table
  const { data: existing } = await client
    .from("influencers")
    .select("id, discovery_status")
    .eq("handle", handle)
    .eq("platform", platform)
    .maybeSingle();

  if (existing) return false; // Already exists

  // Upsert into discovery_queue (ignore conflicts)
  const { error } = await client
    .from("discovery_queue")
    .upsert(
      {
        handle,
        platform,
        source,
        source_detail: options?.sourceDetail ?? null,
        category: options?.category ?? null,
        priority: options?.priority ?? 0,
        status: "pending",
        retry_count: 0,
        processed_at: null,
      },
      { onConflict: "handle,platform" }
    );

  if (error) {
    console.error("[discovery-service] enqueue error:", error.message);
    return false;
  }
  return true;
}

/**
 * Discover influencers by keywords (brand keywords + target categories).
 * Finds matching seeds and enqueues them.
 */
export async function discoverByKeywords(
  client: Client,
  keywords: string[],
  targetCategories: string[],
  platform?: "instagram" | "tiktok"
): Promise<number> {
  let enqueued = 0;

  // Match seed influencers by category
  for (const category of targetCategories) {
    const seeds = getSeedsByFilter({ category, platform });
    for (const seed of seeds) {
      const success = await enqueueForDiscovery(
        client,
        seed.handle,
        seed.platform,
        "brand_keyword",
        {
          sourceDetail: keywords.join(","),
          category: seed.category,
          priority: 10,
        }
      );
      if (success) enqueued++;
    }
  }

  // Also find existing DB influencers with matching hashtags
  if (keywords.length > 0) {
    const { data: matchedByHashtag } = await client
      .from("influencers")
      .select("handle, platform")
      .overlaps("top_hashtags", keywords)
      .limit(20);

    if (matchedByHashtag) {
      for (const inf of matchedByHashtag) {
        await enqueueForDiscovery(client, inf.handle, inf.platform, "brand_keyword", {
          sourceDetail: keywords.join(","),
          priority: 5,
        });
      }
    }
  }

  return enqueued;
}

/**
 * Discover influencers by hashtag.
 * Finds DB influencers using that hashtag + matching seeds.
 */
export async function discoverByHashtag(
  client: Client,
  hashtag: string,
  platform?: "instagram" | "tiktok"
): Promise<{ existing: string[]; enqueued: number }> {
  const normalizedTag = hashtag.replace("#", "").toLowerCase();

  // Find existing influencers with this hashtag
  let query = client
    .from("influencers")
    .select("id, handle, platform, vibe_score, follower_count, tier, engagement_rate, content_categories, top_hashtags, one_liner, representative_images, display_name, profile_image_url, trend_direction, trend_magnitude, discovery_status")
    .contains("top_hashtags", [normalizedTag])
    .order("vibe_score", { ascending: false, nullsFirst: false })
    .limit(20);

  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data: existingInfluencers } = await query;
  const existingHandles = (existingInfluencers ?? []).map((i) => i.handle);

  // Enqueue related seeds from same categories
  let enqueued = 0;
  const matchedCategories = new Set<string>();
  for (const inf of existingInfluencers ?? []) {
    for (const cat of inf.content_categories ?? []) {
      matchedCategories.add(cat);
    }
  }

  for (const category of matchedCategories) {
    const seeds = getSeedsByFilter({ category, platform });
    for (const seed of seeds.slice(0, 5)) {
      const success = await enqueueForDiscovery(client, seed.handle, seed.platform, "hashtag", {
        sourceDetail: normalizedTag,
        category: seed.category,
        priority: 8,
      });
      if (success) enqueued++;
    }
  }

  return { existing: existingHandles, enqueued };
}

/**
 * Discover similar accounts based on same category in DB.
 */
export async function discoverSimilar(
  client: Client,
  handle: string,
  platform: "instagram" | "tiktok"
): Promise<number> {
  // Get the target influencer's categories
  const { data: target } = await client
    .from("influencers")
    .select("content_categories, category")
    .eq("handle", handle)
    .eq("platform", platform)
    .maybeSingle();

  if (!target) return 0;

  const categories: string[] = target.content_categories ?? [];
  if (target.category) categories.push(target.category as string);

  let enqueued = 0;
  for (const category of [...new Set(categories)]) {
    const seeds = getSeedsByFilter({ category, platform } as { category: string; platform?: "instagram" | "tiktok" });
    for (const seed of seeds) {
      if (seed.handle === handle) continue;
      const success = await enqueueForDiscovery(client, seed.handle, seed.platform, "similar", {
        sourceDetail: handle,
        category: seed.category,
        priority: 3,
      });
      if (success) enqueued++;
    }
  }

  return enqueued;
}

/**
 * Enqueue all seed influencers that are not yet in DB.
 */
export async function enqueueSeedInfluencers(client: Client): Promise<number> {
  let enqueued = 0;

  for (const seed of SEED_INFLUENCERS) {
    const success = await enqueueForDiscovery(client, seed.handle, seed.platform, "seed", {
      category: seed.category,
      priority: 1,
    });
    if (success) enqueued++;
  }

  return enqueued;
}

/**
 * Process pending items from discovery_queue via light-analyze.
 * Returns results for processed items.
 */
export async function processDiscoveryQueue(
  client: Client,
  batchSize = 5
): Promise<LightAnalysisResult[]> {
  // Check API budget
  if (!(await canMakeApiCall(client, batchSize))) {
    console.log("[discovery-service] API budget exceeded, skipping queue processing");
    return [];
  }

  // Get pending items ordered by priority DESC
  const { data: pendingItems } = await client
    .from("discovery_queue")
    .select()
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (!pendingItems || pendingItems.length === 0) return [];

  const results: LightAnalysisResult[] = [];

  for (const item of pendingItems) {
    // Mark as processing
    await client
      .from("discovery_queue")
      .update({ status: "processing" })
      .eq("id", item.id);

    // Check budget before each call
    if (!(await canMakeApiCall(client, 1))) {
      await client
        .from("discovery_queue")
        .update({ status: "pending" })
        .eq("id", item.id);
      break;
    }

    const result = await lightAnalyze(
      client,
      item.handle,
      item.platform as "instagram" | "tiktok",
      item.category
    );

    // Update queue status
    await client
      .from("discovery_queue")
      .update({
        status: result.success ? "completed" : "failed",
        processed_at: new Date().toISOString(),
        retry_count: item.retry_count + (result.success ? 0 : 1),
      })
      .eq("id", item.id);

    results.push(result);

    // Rate limit: 2s between API calls
    if (pendingItems.indexOf(item) < pendingItems.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}
