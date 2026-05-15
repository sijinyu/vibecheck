import { cosineSimilarity } from "./cosine-similarity";

export interface MatchResult {
  influencerId: string;
  handle: string;
  platform: string;
  displayName: string | null;
  profileImageUrl: string | null;
  matchScore: number;
  aestheticMatch: number;
  tierCompatibility: number;
  categoryAlignment: number;
  qualityFilter: number;
  vibeScore: number;
  tier: string;
  engagementRate: number;
  followerCount: number;
  matchReason: string;
  oneLiner: string | null;
  contentCategories: string[];
  contentTopics: string[];
  topHashtags: string[];
  representativeImages: string[];
  trendDirection: string | null;
  trendMagnitude: number;
  isLightProfile?: boolean;
  aiSuggestionReason?: string | null;
  confidenceLevel: "high" | "medium" | "low";
  discoveryStatus?: string | null;
}

export interface InfluencerForMatch {
  id: string;
  handle: string;
  platform: string;
  display_name: string | null;
  profile_image_url?: string | null;
  aesthetic_vector: number[] | null;
  vibe_score: number | null;
  engagement_score: number | null;
  authenticity_score: number | null;
  tier: string | null;
  engagement_rate: number | null;
  follower_count?: number | null;
  content_categories: string[];
  content_topics?: string[];
  top_hashtags?: string[];
  representative_images?: string[];
  one_liner?: string | null;
  trend_direction?: string | null;
  trend_magnitude?: number | null;
  similarity?: number;
  discovery_status?: string | null;
  text_match_score?: number | null;
  aesthetic_description?: string | null;
  ai_suggestion_reason?: string | null;
}

interface BrandCriteria {
  toneVector: number[];
  preferredTiers: string[];
  targetCategories: string[];
  idealInfluencerProfile?: Record<string, unknown>;
}

/**
 * Quality gate — filter out ghost/empty accounts before scoring.
 */
function passesQualityGate(inf: InfluencerForMatch): boolean {
  if ((inf.follower_count ?? 0) < 300) return false;
  if ((inf.representative_images?.length ?? 0) < 3) return false;
  if ((inf.engagement_rate ?? 0) <= 0) return false;
  return true;
}

export function calculateMatchScores(
  influencers: InfluencerForMatch[],
  brand: BrandCriteria
): MatchResult[] {
  return influencers
    .filter(passesQualityGate)
    .map((inf) => {
      const status = inf.discovery_status ?? "full";
      const isLight = status === "light";
      const isStub = status === "stub";

      // Lower defaults for unverified profiles
      const defaultAesthetic = status === "full" ? 50 : 30;
      const defaultAuthenticity = status === "full" ? 50 : 25;
      const defaultEngagement = status === "full" ? 50 : 25;

      // Aesthetic Match (45%) — use vector if available, then text_match_score, then default
      const aestheticMatch = inf.aesthetic_vector
        ? normalizeCosineSimilarity(
            cosineSimilarity(brand.toneVector, inf.aesthetic_vector)
          )
        : (inf.text_match_score ?? defaultAesthetic);

      // Tier Compatibility (20%)
      const tierCompatibility =
        brand.preferredTiers.length === 0 ||
        brand.preferredTiers.includes(inf.tier ?? "")
          ? 100
          : 30;

      // Category Alignment (20%)
      const overlap = inf.content_categories.filter((c) =>
        brand.targetCategories.includes(c)
      ).length;
      const categoryAlignment =
        brand.targetCategories.length === 0
          ? 70
          : Math.min(100, (overlap / Math.max(1, brand.targetCategories.length)) * 100);

      // Quality Filter (15%) — smooth ramp instead of hard cliff
      const authenticity = Number(inf.authenticity_score ?? defaultAuthenticity);
      const engagement = Number(inf.engagement_score ?? defaultEngagement);
      const qualityBase = Math.min(authenticity, engagement);
      const bonus = 100 - qualityBase;
      // smoothStep: 0 below 50, 1 above 70, smooth in between
      const authNorm = Math.max(0, Math.min(1, (authenticity - 50) / 20));
      const engNorm = Math.max(0, Math.min(1, (engagement - 30) / 20));
      const smoothFactor = authNorm * engNorm;
      const qualityFilter = qualityBase + bonus * smoothFactor;

      // Raw composite
      const rawScore =
        aestheticMatch * 0.45 +
        tierCompatibility * 0.2 +
        categoryAlignment * 0.2 +
        qualityFilter * 0.15;

      // Profile completeness correction
      const completeness = status === "full" ? 1.0
        : status === "light" ? 0.85
        : 0.65; // stub

      const matchScore = Math.round(rawScore * completeness);

      // Confidence level
      const confidenceLevel: "high" | "medium" | "low" =
        status === "full" ? "high"
        : status === "light" ? "medium"
        : "low";

      // Generate match reason codes (i18n-ready)
      const reasons: string[] = [];
      if (aestheticMatch >= 70) reasons.push(`tone:${Math.round(aestheticMatch)}`);
      if (tierCompatibility === 100 && brand.preferredTiers.length > 0)
        reasons.push("tier");
      if (categoryAlignment >= 60 && brand.targetCategories.length > 0)
        reasons.push("category");
      if (authenticity >= 80) reasons.push("authenticity");
      if (reasons.length === 0) reasons.push("overall");

      return {
        influencerId: inf.id,
        handle: inf.handle,
        platform: inf.platform,
        displayName: inf.display_name,
        profileImageUrl: inf.profile_image_url ?? null,
        matchScore,
        aestheticMatch: Math.round(aestheticMatch),
        tierCompatibility,
        categoryAlignment: Math.round(categoryAlignment),
        qualityFilter: Math.round(qualityFilter),
        vibeScore: Number(inf.vibe_score ?? 0),
        tier: inf.tier ?? "unknown",
        engagementRate: Number(inf.engagement_rate ?? 0),
        followerCount: Number(inf.follower_count ?? 0),
        matchReason: reasons.join(" · "),
        oneLiner: inf.one_liner ?? null,
        contentCategories: inf.content_categories ?? [],
        contentTopics: inf.content_topics ?? [],
        topHashtags: (inf.top_hashtags ?? []).slice(0, 5),
        representativeImages: (inf.representative_images ?? []).slice(0, 3),
        trendDirection: inf.trend_direction ?? null,
        trendMagnitude: Number(inf.trend_magnitude ?? 0),
        isLightProfile: isLight || isStub,
        aiSuggestionReason: inf.ai_suggestion_reason ?? null,
        confidenceLevel,
        discoveryStatus: status,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

function normalizeCosineSimilarity(raw: number): number {
  // Raw cosine similarity is typically 0.3-1.0 for related content
  const normalized = Math.max(0, (raw - 0.2) / 0.8);
  return normalized * 100;
}
