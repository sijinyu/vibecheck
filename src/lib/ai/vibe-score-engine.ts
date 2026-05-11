import { type FeedData, type FeedPost } from "@/lib/adapters/types";
import { type AestheticScores } from "./scoring-engine";

// ─── Types ──────────────────────────────────────────────────────

export type InfluencerTier = "nano" | "micro" | "mid" | "macro" | "mega";

export interface VibeInsight {
  type: "strength" | "warning" | "opportunity";
  title: string;
  description: string;
}

export interface VibeScoreResult {
  vibeScore: number;
  aestheticScore: number;
  engagementScore: number;
  consistencyScore: number;
  growthPotentialScore: number;
  authenticityScore: number;
  tier: InfluencerTier;
  engagementRate: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  postingFrequencyDays: number;
  topHashtags: string[];
  contentCategories: string[];
  insights: VibeInsight[];
}

// ─── Tier Benchmarks ────────────────────────────────────────────

const TIER_BENCHMARKS: Record<InfluencerTier, number> = {
  nano: 0.05,
  micro: 0.03,
  mid: 0.02,
  macro: 0.015,
  mega: 0.007,
};

function determineTier(followerCount: number): InfluencerTier {
  if (followerCount >= 1_000_000) return "mega";
  if (followerCount >= 100_000) return "macro";
  if (followerCount >= 50_000) return "mid";
  if (followerCount >= 10_000) return "micro";
  return "nano";
}

// ─── Engagement Score (25%) ─────────────────────────────────────

function calculateEngagementScore(
  feedData: FeedData
): { score: number; rate: number; avgLikes: number; avgComments: number } {
  const { posts, profile } = feedData;
  if (posts.length === 0 || profile.followerCount === 0) {
    return { score: 50, rate: 0, avgLikes: 0, avgComments: 0 };
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.commentCount, 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.shareCount ?? 0), 0);

  const avgLikes = totalLikes / posts.length;
  const avgComments = totalComments / posts.length;

  // Platform-weighted engagement
  const isTikTok = profile.platform === "tiktok";
  const weightedEngagement = isTikTok
    ? avgLikes * 0.5 + avgComments * 2 + (totalShares / posts.length) * 3
    : avgLikes * 1 + avgComments * 2;

  const engagementRate = weightedEngagement / profile.followerCount;

  // Score relative to tier benchmark
  const tier = determineTier(profile.followerCount);
  const benchmark = TIER_BENCHMARKS[tier];
  const relativePerformance = engagementRate / benchmark;

  // Base score: 50 = average for tier, scaled up/down
  let score = 50 * relativePerformance;

  // Comment/like ratio bonus (authentic engagement signal)
  if (avgLikes > 0) {
    const commentLikeRatio = avgComments / avgLikes;
    if (commentLikeRatio > 0.05) score += 10;
    else if (commentLikeRatio > 0.02) score += 5;
  }

  return {
    score: clamp(score, 0, 100),
    rate: engagementRate,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
  };
}

// ─── Consistency Score (15%) ────────────────────────────────────

function calculateConsistencyScore(
  feedData: FeedData,
  toneConsistency: number
): { score: number; postingFrequencyDays: number } {
  const { posts } = feedData;
  if (posts.length < 2) {
    return { score: 50, postingFrequencyDays: 0 };
  }

  // Calculate posting intervals
  const timestamps = posts
    .map((p) => new Date(p.timestamp).getTime())
    .sort((a, b) => b - a);

  const intervals: number[] = [];
  for (let i = 0; i < timestamps.length - 1; i++) {
    const daysBetween =
      (timestamps[i] - timestamps[i + 1]) / (1000 * 60 * 60 * 24);
    intervals.push(daysBetween);
  }

  const avgInterval =
    intervals.reduce((sum, d) => sum + d, 0) / intervals.length;

  // Coefficient of variation (lower = more regular)
  const variance =
    intervals.reduce((sum, d) => sum + Math.pow(d - avgInterval, 2), 0) /
    intervals.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgInterval > 0 ? stdDev / avgInterval : 1;

  // Regularity score: CV < 0.3 = excellent, > 1.5 = chaotic
  const regularityScore = clamp(100 - cv * 50, 0, 100);

  // Frequency score: posting 3-7 times/week is ideal
  const postsPerWeek = avgInterval > 0 ? 7 / avgInterval : 0;
  let frequencyScore: number;
  if (postsPerWeek >= 3 && postsPerWeek <= 7) {
    frequencyScore = 100;
  } else if (postsPerWeek >= 1) {
    frequencyScore = 60 + (postsPerWeek / 3) * 40;
  } else {
    frequencyScore = Math.max(20, postsPerWeek * 60);
  }
  frequencyScore = clamp(frequencyScore, 0, 100);

  // Weighted: regularity 40% + frequency 20% + toneConsistency 40%
  const score =
    regularityScore * 0.4 + frequencyScore * 0.2 + toneConsistency * 0.4;

  return {
    score: clamp(score, 0, 100),
    postingFrequencyDays: Math.round(avgInterval * 10) / 10,
  };
}

// ─── Growth Potential Score (10%) ───────────────────────────────

function calculateGrowthPotentialScore(
  feedData: FeedData,
  trendScore: number
): number {
  const { posts, profile } = feedData;

  // Follower/following ratio → authority
  const ffRatio =
    profile.followingCount > 0
      ? profile.followerCount / profile.followingCount
      : profile.followerCount > 0
        ? 10
        : 1;
  const authorityScore = clamp(Math.log10(ffRatio + 1) * 40, 0, 100);

  // Engagement momentum: compare recent half vs older half
  let momentumScore = 50;
  if (posts.length >= 4) {
    const midPoint = Math.floor(posts.length / 2);
    const sorted = [...posts].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const recentPosts = sorted.slice(0, midPoint);
    const olderPosts = sorted.slice(midPoint);

    const recentEng =
      recentPosts.reduce((s, p) => s + p.likeCount + p.commentCount, 0) /
      recentPosts.length;
    const olderEng =
      olderPosts.reduce((s, p) => s + p.likeCount + p.commentCount, 0) /
      olderPosts.length;

    if (olderEng > 0) {
      const growth = (recentEng - olderEng) / olderEng;
      momentumScore = clamp(50 + growth * 100, 0, 100);
    }
  }

  // Weighted: authority 30% + momentum 40% + trendScore 30%
  return clamp(
    authorityScore * 0.3 + momentumScore * 0.4 + trendScore * 0.3,
    0,
    100
  );
}

// ─── Authenticity Score (10%) ───────────────────────────────────

function calculateAuthenticityScore(feedData: FeedData): number {
  const { posts, profile } = feedData;
  let score = 100;
  const flags: string[] = [];

  if (posts.length === 0 || profile.followerCount === 0) return 50;

  // Red flag 1: Abnormally low like ratio for follower count (fake followers)
  const avgLikes =
    posts.reduce((s, p) => s + p.likeCount, 0) / posts.length;
  const likeRatio = avgLikes / profile.followerCount;
  if (likeRatio < 0.005 && profile.followerCount > 10000) {
    score -= 25;
    flags.push("low-like-ratio");
  }

  // Red flag 2: Following/follower ratio > 2 (follow-back inflation)
  const ffRatio =
    profile.followerCount > 0
      ? profile.followingCount / profile.followerCount
      : 0;
  if (ffRatio > 2) {
    score -= 20;
    flags.push("high-following-ratio");
  } else if (ffRatio > 1.5) {
    score -= 10;
  }

  // Red flag 3: Engagement variance abnormally low (bot engagement is uniform)
  if (posts.length >= 4) {
    const engagements = posts.map((p) => p.likeCount + p.commentCount);
    const avg = engagements.reduce((s, e) => s + e, 0) / engagements.length;
    if (avg > 0) {
      const cv =
        Math.sqrt(
          engagements.reduce((s, e) => s + Math.pow(e - avg, 2), 0) /
            engagements.length
        ) / avg;
      if (cv < 0.1) {
        score -= 15;
        flags.push("uniform-engagement");
      }
    }
  }

  // Red flag 4: High followers but almost no comments (ghost followers)
  const avgComments =
    posts.reduce((s, p) => s + p.commentCount, 0) / posts.length;
  if (profile.followerCount > 50000 && avgComments < 5) {
    score -= 20;
    flags.push("ghost-followers");
  }

  return clamp(score, 0, 100);
}

// ─── Insights Generator ────────────────────────────────────────

function generateInsights(
  feedData: FeedData,
  engagement: { score: number; rate: number },
  consistencyScore: number,
  growthScore: number,
  authenticityScore: number,
  tier: InfluencerTier
): VibeInsight[] {
  const insights: VibeInsight[] = [];
  const benchmark = TIER_BENCHMARKS[tier];

  // Engagement insights
  if (engagement.rate > benchmark * 1.5) {
    insights.push({
      type: "strength",
      title: "높은 참여율",
      description: `${tier} 티어 평균 대비 ${Math.round((engagement.rate / benchmark) * 100)}% 수준의 인게이지먼트율입니다.`,
    });
  } else if (engagement.rate < benchmark * 0.5) {
    insights.push({
      type: "warning",
      title: "낮은 참여율",
      description: `${tier} 티어 평균 대비 참여율이 낮습니다. 콘텐츠 전략 점검이 필요합니다.`,
    });
  }

  // Consistency insights
  if (consistencyScore >= 80) {
    insights.push({
      type: "strength",
      title: "일관된 콘텐츠",
      description: "포스팅 빈도와 톤이 매우 안정적입니다. 브랜드 협업 시 신뢰할 수 있는 파트너입니다.",
    });
  } else if (consistencyScore < 40) {
    insights.push({
      type: "warning",
      title: "불규칙한 포스팅",
      description: "포스팅 간격이 불규칙합니다. 꾸준한 콘텐츠 공급이 필요합니다.",
    });
  }

  // Growth insights
  if (growthScore >= 70) {
    insights.push({
      type: "opportunity",
      title: "성장 모멘텀",
      description: "최근 인게이지먼트가 상승 추세입니다. 지금이 협업 적기일 수 있습니다.",
    });
  }

  // Authenticity insights
  if (authenticityScore < 50) {
    insights.push({
      type: "warning",
      title: "진정성 주의",
      description: "가짜 팔로워 또는 봇 인게이지먼트 의심 징후가 감지되었습니다.",
    });
  } else if (authenticityScore >= 90) {
    insights.push({
      type: "strength",
      title: "높은 진정성",
      description: "오디언스 참여 패턴이 자연스럽고 건강합니다.",
    });
  }

  // Tier-based opportunity
  if (tier === "nano" || tier === "micro") {
    if (engagement.score >= 70) {
      insights.push({
        type: "opportunity",
        title: "가성비 높은 협업",
        description: `${tier} 티어이지만 참여율이 높아, 비용 대비 효과적인 마이크로 인플루언서 마케팅에 적합합니다.`,
      });
    }
  }

  return insights;
}

// ─── Hashtag & Category Extraction ─────────────────────────────

function extractTopHashtags(posts: FeedPost[], limit = 10): string[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.hashtags) {
      const lower = tag.toLowerCase();
      counts.set(lower, (counts.get(lower) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

function extractContentCategories(
  posts: FeedPost[],
  bio: string | null
): string[] {
  const categoryKeywords: Record<string, string[]> = {
    Fashion: ["fashion", "ootd", "style", "outfit", "패션", "코디", "스타일"],
    Beauty: ["beauty", "makeup", "skincare", "뷰티", "메이크업", "스킨케어"],
    Food: ["food", "cooking", "recipe", "맛집", "카페", "음식", "요리"],
    Travel: ["travel", "trip", "여행", "트래블"],
    Fitness: ["fitness", "gym", "workout", "운동", "헬스", "피트니스"],
    Lifestyle: ["lifestyle", "daily", "vlog", "일상", "라이프스타일"],
    Tech: ["tech", "gadget", "review", "테크", "리뷰"],
    Art: ["art", "design", "illustration", "아트", "디자인"],
    Music: ["music", "song", "cover", "음악"],
    Photography: ["photography", "photo", "사진"],
  };

  const allText = [
    ...(bio ? [bio.toLowerCase()] : []),
    ...posts.flatMap((p) => [
      ...p.hashtags.map((h) => h.toLowerCase()),
      p.caption.toLowerCase(),
    ]),
  ].join(" ");

  const matched: string[] = [];
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => allText.includes(kw))) {
      matched.push(category);
    }
  }

  return matched.length > 0 ? matched.slice(0, 3) : ["General"];
}

// ─── Main VibeScore Calculator ─────────────────────────────────

export function calculateVibeScore(
  feedData: FeedData,
  aestheticScores: AestheticScores
): VibeScoreResult {
  const tier = determineTier(feedData.profile.followerCount);

  // Sub-scores
  const engagement = calculateEngagementScore(feedData);
  const { score: consistencyScore, postingFrequencyDays } =
    calculateConsistencyScore(feedData, aestheticScores.toneConsistency);
  const growthScore = calculateGrowthPotentialScore(
    feedData,
    aestheticScores.trend
  );
  const authenticityScore = calculateAuthenticityScore(feedData);

  // Composite VibeScore
  const vibeScore = Math.round(
    aestheticScores.overall * 0.4 +
      engagement.score * 0.25 +
      consistencyScore * 0.15 +
      growthScore * 0.1 +
      authenticityScore * 0.1
  );

  // Metadata
  const topHashtags = extractTopHashtags(feedData.posts);
  const contentCategories = extractContentCategories(
    feedData.posts,
    feedData.profile.bio
  );

  // Insights
  const insights = generateInsights(
    feedData,
    engagement,
    consistencyScore,
    growthScore,
    authenticityScore,
    tier
  );

  return {
    vibeScore: clamp(vibeScore, 0, 100),
    aestheticScore: aestheticScores.overall,
    engagementScore: Math.round(engagement.score),
    consistencyScore: Math.round(consistencyScore),
    growthPotentialScore: Math.round(growthScore),
    authenticityScore: Math.round(authenticityScore),
    tier,
    engagementRate: Math.round(engagement.rate * 10000) / 10000,
    avgLikesPerPost: engagement.avgLikes,
    avgCommentsPerPost: engagement.avgComments,
    postingFrequencyDays,
    topHashtags,
    contentCategories,
    insights,
  };
}

// ─── Utility ────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}
