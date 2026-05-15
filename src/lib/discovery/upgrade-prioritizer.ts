/**
 * Upgrade Prioritizer
 *
 * Light → Full 업그레이드 우선순위 결정기.
 * 캠페인에 추가된 인플루언서를 최우선으로 업그레이드.
 *
 * Priority = (brand_demand × 10) + (engagement_rate × 100) + (follower_log × 5) + (age_days × 2)
 */

import { type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

interface PrioritizedInfluencer {
  id: string;
  handle: string;
  platform: string;
  category: string | null;
  priority: number;
  reason: string;
}

/**
 * Get light profiles ordered by upgrade priority.
 * Campaign-added influencers get highest priority.
 */
export async function getPrioritizedUpgrades(
  client: Client,
  limit: number = 5
): Promise<PrioritizedInfluencer[]> {
  // Get light profiles
  const { data: lightProfiles } = await client
    .from("influencers")
    .select("id, handle, platform, category, follower_count, engagement_rate, created_at")
    .eq("discovery_status", "light")
    .order("follower_count", { ascending: false, nullsFirst: false })
    .limit(50);

  if (!lightProfiles || lightProfiles.length === 0) return [];

  // Check which ones are in campaigns (campaign_influencers table)
  const influencerIds = lightProfiles.map((p) => p.id);
  const { data: campaignInfluencers } = await client
    .from("campaign_influencers")
    .select("influencer_id")
    .in("influencer_id", influencerIds);

  const campaignSet = new Set(
    (campaignInfluencers ?? []).map((ci) => ci.influencer_id)
  );

  // Check brand demand (how many brands have overlapping categories)
  const { data: brands } = await client
    .from("brand_profiles")
    .select("target_categories");

  const categoryDemand = new Map<string, number>();
  for (const brand of brands ?? []) {
    for (const cat of brand.target_categories ?? []) {
      categoryDemand.set(cat, (categoryDemand.get(cat) ?? 0) + 1);
    }
  }

  // Calculate priority score
  const prioritized = lightProfiles.map((profile) => {
    const inCampaign = campaignSet.has(profile.id);
    const brandDemand = profile.category
      ? categoryDemand.get(profile.category) ?? 0
      : 0;
    const er = profile.engagement_rate ?? 0;
    const followerLog = Math.log10(Math.max(1, profile.follower_count ?? 0));
    const ageDays = Math.floor(
      (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Campaign inclusion = top priority
    const campaignBonus = inCampaign ? 100 : 0;

    const priority =
      campaignBonus +
      brandDemand * 10 +
      er * 100 +
      followerLog * 5 +
      Math.min(ageDays, 30) * 2;

    const reasons: string[] = [];
    if (inCampaign) reasons.push("캠페인에 추가됨");
    if (brandDemand > 0) reasons.push(`${brandDemand}개 브랜드와 카테고리 일치`);
    if (er > 0.03) reasons.push("높은 참여율");
    if ((profile.follower_count ?? 0) > 50000) reasons.push("높은 팔로워");

    return {
      id: profile.id,
      handle: profile.handle,
      platform: profile.platform,
      category: profile.category,
      priority: Math.round(priority),
      reason: reasons.join(", ") || "일반 업그레이드 대상",
    };
  });

  // Sort by priority DESC
  prioritized.sort((a, b) => b.priority - a.priority);

  return prioritized.slice(0, limit);
}
