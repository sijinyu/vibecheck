/**
 * Light Analyzer
 *
 * RapidAPI 1-2 호출로 기본 프로필만 가져와서 influencers 테이블에 저장.
 * VibeScore, AI 분석은 스킵 → discovery_status = 'light'.
 */

import { type SupabaseClient } from "@supabase/supabase-js";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { fetchTikTokFeed } from "@/lib/adapters/tiktok";
import { upsertInfluencer } from "@/lib/supabase/queries";
import { incrementApiUsage } from "./api-budget";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface LightAnalysisResult {
  success: boolean;
  handle: string;
  platform: string;
  message: string;
}

/**
 * Light-analyze an influencer: fetch feed, extract basic profile + stats.
 * No AI/Gemini calls, no VibeScore computation.
 */
export async function lightAnalyze(
  client: Client,
  handle: string,
  platform: "instagram" | "tiktok",
  category?: string | null
): Promise<LightAnalysisResult> {
  try {
    // Check if already exists with full or light status
    const { data: existing } = await client
      .from("influencers")
      .select("id, discovery_status, last_analyzed_at")
      .eq("handle", handle)
      .eq("platform", platform)
      .maybeSingle();

    if (existing?.discovery_status === "full") {
      return { success: true, handle, platform, message: "Already fully analyzed" };
    }

    // Fetch feed data
    const feedResult =
      platform === "tiktok"
        ? await fetchTikTokFeed(handle)
        : await fetchInstagramFeed(handle);

    // Track API usage
    await incrementApiUsage(client, 1);

    if ("error" in feedResult) {
      return { success: false, handle, platform, message: feedResult.error.message };
    }

    const { profile, posts } = feedResult.data;

    // Calculate basic engagement stats (no AI needed)
    const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount ?? 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.commentCount ?? 0), 0);
    const avgLikes = posts.length > 0 ? totalLikes / posts.length : 0;
    const avgComments = posts.length > 0 ? totalComments / posts.length : 0;
    const engagementRate =
      profile.followerCount && profile.followerCount > 0 && posts.length > 0
        ? (avgLikes + avgComments) / profile.followerCount
        : 0;

    // Extract top hashtags from posts
    const hashtagCounts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.hashtags ?? []) {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
      }
    }
    const topHashtags = [...hashtagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);

    // Get representative images (first 6 posts with images)
    const representativeImages = posts
      .filter((p) => p.imageUrl)
      .slice(0, 6)
      .map((p) => p.imageUrl);

    // Determine tier from follower count
    const tier = determineTier(profile.followerCount ?? 0);

    // Content categories: use provided category or derive from hashtags
    const contentCategories = category ? [category] : deriveCategories(topHashtags);

    // Upsert as light profile
    await upsertInfluencer(client, {
      handle,
      platform,
      display_name: profile.displayName ?? null,
      profile_image_url: profile.profileImageUrl ?? null,
      bio: profile.bio ?? null,
      follower_count: profile.followerCount ?? null,
      following_count: profile.followingCount ?? null,
      tier,
      engagement_rate: engagementRate,
      avg_likes_per_post: avgLikes,
      avg_comments_per_post: avgComments,
      top_hashtags: topHashtags,
      content_categories: contentCategories,
      representative_images: representativeImages,
      category: category ?? contentCategories[0] ?? null,
      data_source: feedResult.data.dataSource ?? "live",
    });

    // Set discovery_status to 'light' (upsertInfluencer doesn't set this)
    await client
      .from("influencers")
      .update({
        discovery_status: "light",
        profile_image_cached_at: new Date().toISOString(),
      })
      .eq("handle", handle)
      .eq("platform", platform);

    return { success: true, handle, platform, message: `Light analyzed (ER: ${(engagementRate * 100).toFixed(1)}%)` };
  } catch (err) {
    console.error(`[light-analyzer] Failed to analyze ${handle}:`, err);
    return { success: false, handle, platform, message: String(err) };
  }
}

function determineTier(followerCount: number): string {
  if (followerCount >= 1_000_000) return "mega";
  if (followerCount >= 100_000) return "macro";
  if (followerCount >= 50_000) return "mid";
  if (followerCount >= 10_000) return "micro";
  return "nano";
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Fashion: ["fashion", "ootd", "style", "outfit", "wear", "드레스", "패션", "스타일", "코디"],
  Beauty: ["beauty", "makeup", "skincare", "skin", "뷰티", "메이크업", "스킨케어", "화장"],
  Food: ["food", "recipe", "cooking", "맛집", "음식", "레시피", "카페", "먹스타그램"],
  Fitness: ["fitness", "workout", "gym", "health", "운동", "헬스", "다이어트", "필라테스"],
  Travel: ["travel", "trip", "여행", "제주", "vacation", "tourism"],
  Lifestyle: ["lifestyle", "daily", "일상", "라이프", "인테리어", "home"],
  Tech: ["tech", "gadget", "review", "테크", "기술", "리뷰"],
  Art: ["art", "design", "illustration", "아트", "디자인", "그림"],
};

function deriveCategories(hashtags: string[]): string[] {
  const scores = new Map<string, number>();

  for (const tag of hashtags) {
    const lowerTag = tag.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => lowerTag.includes(kw))) {
        scores.set(category, (scores.get(category) ?? 0) + 1);
      }
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}
