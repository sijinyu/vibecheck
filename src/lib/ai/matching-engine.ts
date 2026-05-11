import { cosineSimilarity } from "./cosine-similarity";

export interface MatchResult {
  influencerId: string;
  handle: string;
  platform: string;
  displayName: string | null;
  matchScore: number;
  aestheticMatch: number;
  tierCompatibility: number;
  categoryAlignment: number;
  qualityFilter: number;
  vibeScore: number;
  tier: string;
  engagementRate: number;
  matchReason: string;
}

interface InfluencerForMatch {
  id: string;
  handle: string;
  platform: string;
  display_name: string | null;
  aesthetic_vector: number[] | null;
  vibe_score: number | null;
  engagement_score: number | null;
  authenticity_score: number | null;
  tier: string | null;
  engagement_rate: number | null;
  content_categories: string[];
  similarity?: number;
}

interface BrandCriteria {
  toneVector: number[];
  preferredTiers: string[];
  targetCategories: string[];
}

export function calculateMatchScores(
  influencers: InfluencerForMatch[],
  brand: BrandCriteria
): MatchResult[] {
  return influencers
    .map((inf) => {
      // Aesthetic Match (45%)
      const aestheticMatch = inf.aesthetic_vector
        ? normalizeCosineSimilarity(
            cosineSimilarity(brand.toneVector, inf.aesthetic_vector)
          )
        : 50;

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

      // Quality Filter (15%)
      const authenticity = Number(inf.authenticity_score ?? 50);
      const engagement = Number(inf.engagement_score ?? 50);
      const qualityFilter =
        authenticity >= 60 && engagement >= 40 ? 100 : Math.min(authenticity, engagement);

      // Composite
      const matchScore = Math.round(
        aestheticMatch * 0.45 +
          tierCompatibility * 0.2 +
          categoryAlignment * 0.2 +
          qualityFilter * 0.15
      );

      // Generate match reason
      const reasons: string[] = [];
      if (aestheticMatch >= 70) reasons.push("브랜드 미적 톤과 높은 유사도");
      if (tierCompatibility === 100 && brand.preferredTiers.length > 0)
        reasons.push("선호 티어에 부합");
      if (categoryAlignment >= 60 && brand.targetCategories.length > 0)
        reasons.push("타겟 카테고리 매칭");
      if (authenticity >= 80) reasons.push("높은 오디언스 진정성");
      if (reasons.length === 0) reasons.push("종합 점수 기반 추천");

      return {
        influencerId: inf.id,
        handle: inf.handle,
        platform: inf.platform,
        displayName: inf.display_name,
        matchScore,
        aestheticMatch: Math.round(aestheticMatch),
        tierCompatibility,
        categoryAlignment: Math.round(categoryAlignment),
        qualityFilter: Math.round(qualityFilter),
        vibeScore: Number(inf.vibe_score ?? 0),
        tier: inf.tier ?? "unknown",
        engagementRate: Number(inf.engagement_rate ?? 0),
        matchReason: reasons.join(" · "),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

function normalizeCosineSimilarity(raw: number): number {
  // Raw cosine similarity is typically 0.3-1.0 for related content
  const normalized = Math.max(0, (raw - 0.2) / 0.8);
  return normalized * 100;
}
