import { type FeedData, type FeedPost } from "@/lib/adapters/types";
import { type AestheticScores } from "./scoring-engine";

// ─── Types ──────────────────────────────────────────────────────

export type InfluencerTier = "nano" | "micro" | "mid" | "macro" | "mega";
export type Platform = "instagram" | "tiktok";
export type TrendDirection = "rising" | "stable" | "declining";

export interface VibeInsight {
  type: "strength" | "warning" | "opportunity";
  title: string;
  description: string;
  evidence?: string;
}

export interface PostPerformance {
  imageUrl: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  caption: string;
  hashtags: string[];
  timestamp: string;
  postType: string;
  engagementRate: number;
  performanceIndex: number; // vs average (1.0 = average)
  shortcode?: string;
}

export interface ContentTypeBreakdown {
  type: string;
  count: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgER: number;
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
  avgSharesPerPost: number;
  avgPlaysPerPost: number;
  postingFrequencyDays: number;
  topHashtags: string[];
  contentCategories: string[];
  insights: VibeInsight[];
  postPerformances: PostPerformance[];
  contentTypeBreakdown: ContentTypeBreakdown[];
  trendDirection: TrendDirection;
  trendMagnitude: number;
  estimatedCPE: number | null;
  contentEffectivenessScore: number;
  platformBenchmark: number;
}

// ─── Platform × Tier Benchmarks ─────────────────────────────────

const PLATFORM_TIER_BENCHMARKS: Record<Platform, Record<InfluencerTier, number>> = {
  instagram: { nano: 0.045, micro: 0.028, mid: 0.018, macro: 0.013, mega: 0.008 },
  tiktok:    { nano: 0.10,  micro: 0.06,  mid: 0.04,  macro: 0.025, mega: 0.015 },
};

const CATEGORY_ER_MULTIPLIERS: Record<string, number> = {
  Beauty: 1.15, Fashion: 1.10, Food: 1.05, Fitness: 1.05,
  Lifestyle: 1.0, Travel: 0.95, Music: 0.95, Art: 0.90,
  Photography: 0.85, Tech: 0.80, General: 1.0,
};

/** Get platform×tier benchmark adjusted by category */
export function getBenchmark(
  platform: Platform,
  tier: InfluencerTier,
  categories: string[] = []
): number {
  const base = PLATFORM_TIER_BENCHMARKS[platform]?.[tier]
    ?? PLATFORM_TIER_BENCHMARKS.instagram[tier]
    ?? 0.02;

  if (categories.length === 0) return base;

  const avgMultiplier =
    categories.reduce((sum, cat) => sum + (CATEGORY_ER_MULTIPLIERS[cat] ?? 1.0), 0)
    / categories.length;

  return base * avgMultiplier;
}

/** Platform × Tier average likes benchmarks */
const PLATFORM_TIER_LIKES_BENCHMARKS: Record<Platform, Record<InfluencerTier, number>> = {
  instagram: { nano: 150, micro: 500, mid: 1500, macro: 5000, mega: 25000 },
  tiktok:    { nano: 500, micro: 2000, mid: 8000, macro: 30000, mega: 100000 },
};

/** Get platform×tier average likes benchmark */
export function getLikesBenchmark(
  platform: Platform,
  tier: InfluencerTier,
): number {
  return PLATFORM_TIER_LIKES_BENCHMARKS[platform]?.[tier]
    ?? PLATFORM_TIER_LIKES_BENCHMARKS.instagram[tier]
    ?? 500;
}

function determineTier(followerCount: number): InfluencerTier {
  if (followerCount >= 1_000_000) return "mega";
  if (followerCount >= 100_000) return "macro";
  if (followerCount >= 50_000) return "mid";
  if (followerCount >= 10_000) return "micro";
  return "nano";
}

// ─── Engagement Score (30%) — 3-Dimensional ─────────────────────

/** Dimension 1: ER vs benchmark (40% of engagement) */
function calculateERvsBenchmarkScore(
  engagementRate: number,
  benchmark: number
): number {
  const relativePerformance = benchmark > 0 ? engagementRate / benchmark : 1;
  // 50 = exactly at benchmark, scaled up/down
  return clamp(50 * relativePerformance, 0, 100);
}

/** Dimension 2: Absolute performance — log-scale avg interactions per post (30% of engagement) */
function calculateAbsolutePerformanceScore(
  avgEngPerPost: number,
  tier: InfluencerTier
): number {
  // Tier-specific anchors: what "good" looks like in absolute numbers
  const anchors: Record<InfluencerTier, number> = {
    nano: 200, micro: 800, mid: 2000, macro: 8000, mega: 50000,
  };
  const anchor = anchors[tier];
  if (avgEngPerPost <= 0) return 0;

  // Log-scale comparison
  const ratio = Math.log10(avgEngPerPost + 1) / Math.log10(anchor + 1);
  return clamp(ratio * 70, 0, 100);
}

/** Dimension 3: Engagement quality — comment/like ratio + variance + shares (30% of engagement) */
function calculateEngagementQualityScore(
  posts: FeedPost[],
  avgLikes: number,
  avgComments: number
): number {
  if (posts.length === 0 || avgLikes <= 0) return 50;

  // Sub-factor A: Comment/like ratio (higher = more engaged audience)
  const commentLikeRatio = avgComments / avgLikes;
  // 3% is average, 8%+ is excellent
  const ratioScore = clamp(commentLikeRatio / 0.08 * 100, 0, 100);

  // Sub-factor B: Engagement variance (healthy = some variance, but not too much)
  let varianceScore = 50;
  if (posts.length >= 4) {
    const engagements = posts.map((p) => p.likeCount + p.commentCount);
    const avg = engagements.reduce((s, e) => s + e, 0) / engagements.length;
    if (avg > 0) {
      const cv =
        Math.sqrt(
          engagements.reduce((s, e) => s + Math.pow(e - avg, 2), 0) / engagements.length
        ) / avg;
      // CV 0.3-0.6 is healthy (natural variance). <0.1 = suspicious, >1.5 = chaotic
      if (cv >= 0.2 && cv <= 0.8) varianceScore = 80;
      else if (cv < 0.1) varianceScore = 30; // too uniform (bot-like)
      else if (cv > 1.2) varianceScore = 30; // too chaotic
      else varianceScore = 50;
    }
  }

  // Sub-factor C: Share engagement (if available)
  const totalShares = posts.reduce((s, p) => s + (p.shareCount ?? 0), 0);
  const hasShares = totalShares > 0;
  const shareScore = hasShares
    ? clamp((totalShares / posts.length / avgLikes) * 500, 0, 100)
    : 50; // neutral if no share data

  return ratioScore * 0.4 + varianceScore * 0.3 + shareScore * 0.3;
}

function calculateEngagementScore(
  feedData: FeedData,
  categories: string[]
): {
  score: number;
  rate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgPlays: number;
  benchmark: number;
} {
  const { posts, profile } = feedData;
  if (posts.length === 0 || profile.followerCount === 0) {
    return { score: 50, rate: 0, avgLikes: 0, avgComments: 0, avgShares: 0, avgPlays: 0, benchmark: 0 };
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.commentCount, 0);
  const totalShares = posts.reduce((sum, p) => sum + (p.shareCount ?? 0), 0);
  const totalPlays = posts.reduce((sum, p) => sum + (p.playCount ?? 0), 0);

  const avgLikes = totalLikes / posts.length;
  const avgComments = totalComments / posts.length;
  const avgShares = totalShares / posts.length;
  const avgPlays = totalPlays / posts.length;

  // Platform-weighted engagement
  const isTikTok = profile.platform === "tiktok";
  const weightedEngagement = isTikTok
    ? avgLikes * 0.5 + avgComments * 2 + avgShares * 3
    : avgLikes * 1 + avgComments * 2;

  const engagementRate = weightedEngagement / profile.followerCount;

  const tier = determineTier(profile.followerCount);
  const benchmark = getBenchmark(profile.platform as Platform, tier, categories);

  // 3-dimensional engagement scoring
  const erScore = calculateERvsBenchmarkScore(engagementRate, benchmark);
  const absoluteScore = calculateAbsolutePerformanceScore(
    avgLikes + avgComments + avgShares,
    tier
  );
  const qualityScore = calculateEngagementQualityScore(posts, avgLikes, avgComments);

  // Weighted: ER vs benchmark 40% + Absolute 30% + Quality 30%
  let score = erScore * 0.4 + absoluteScore * 0.3 + qualityScore * 0.3;

  // Tier-adjusted floors
  if (tier === "mega" && engagementRate > 0.003) {
    score = Math.max(score, 40);
  } else if (tier === "macro" && engagementRate > 0.01) {
    score = Math.max(score, 45);
  }

  return {
    score: clamp(score, 0, 100),
    rate: engagementRate,
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    avgShares: Math.round(avgShares),
    avgPlays: Math.round(avgPlays),
    benchmark,
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

  const variance =
    intervals.reduce((sum, d) => sum + Math.pow(d - avgInterval, 2), 0) /
    intervals.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgInterval > 0 ? stdDev / avgInterval : 1;

  const regularityScore = clamp(100 - cv * 50, 0, 100);

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

  const score =
    regularityScore * 0.4 + frequencyScore * 0.2 + toneConsistency * 0.4;

  return {
    score: clamp(score, 0, 100),
    postingFrequencyDays: Math.round(avgInterval * 10) / 10,
  };
}

// ─── Growth Potential Score (15%) ───────────────────────────────

function calculateGrowthPotentialScore(
  feedData: FeedData,
  trendScore: number
): { score: number; trendDirection: TrendDirection; trendMagnitude: number } {
  const { posts, profile } = feedData;

  // Follower/following ratio -> authority
  const ffRatio =
    profile.followingCount > 0
      ? profile.followerCount / profile.followingCount
      : profile.followerCount > 0
        ? 10
        : 1;
  const authorityScore = clamp(Math.log10(ffRatio + 1) * 40, 0, 100);

  // Engagement momentum: compare recent half vs older half
  let momentumScore = 50;
  let trendDirection: TrendDirection = "stable";
  let trendMagnitude = 0;

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
      trendMagnitude = Math.round(Math.abs(growth) * 100);

      if (growth > 0.1) trendDirection = "rising";
      else if (growth < -0.1) trendDirection = "declining";
      else trendDirection = "stable";
    }
  }

  const score = clamp(
    authorityScore * 0.3 + momentumScore * 0.4 + trendScore * 0.3,
    0,
    100
  );

  return { score, trendDirection, trendMagnitude };
}

// ─── Authenticity Score (15%) ───────────────────────────────────

function calculateAuthenticityScore(
  feedData: FeedData,
  platform: Platform
): number {
  const { posts, profile } = feedData;
  const isLiveData = feedData.dataSource === "live";
  let score = 100;

  if (posts.length === 0 || profile.followerCount === 0) return 50;

  const avgLikes =
    posts.reduce((s, p) => s + p.likeCount, 0) / posts.length;
  const avgComments =
    posts.reduce((s, p) => s + p.commentCount, 0) / posts.length;

  if (isLiveData) {
    // Red flag 1: Abnormally low like ratio for follower count (fake followers)
    const likeRatio = avgLikes / profile.followerCount;
    if (likeRatio < 0.005 && profile.followerCount > 10000) {
      score -= 25;
    }

    // Red flag 2: Following/follower ratio > 2 (follow-back inflation)
    const ffRatio =
      profile.followerCount > 0
        ? profile.followingCount / profile.followerCount
        : 0;
    if (ffRatio > 2) {
      score -= 20;
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
        }
      }
    }

    // Red flag 4: High followers but almost no comments (ghost followers)
    if (profile.followerCount > 50000 && avgComments < 5) {
      score -= 20;
    }

    // Red flag 5: 100K+ followers but fewer than 20 posts (suspicious growth)
    if (profile.followerCount > 100000 && profile.postCount < 20) {
      score -= 15;
    }

    // Red flag 6: ER > 5x benchmark (purchased engagement suspected)
    const tier = determineTier(profile.followerCount);
    const benchmark = getBenchmark(platform, tier);
    const er =
      profile.followerCount > 0
        ? (avgLikes + avgComments) / profile.followerCount
        : 0;
    if (er > benchmark * 5 && profile.followerCount > 10000) {
      score -= 10;
    }
  }

  return clamp(score, 0, 100);
}

// ─── Post Performance Analysis ──────────────────────────────────

function analyzePostPerformances(
  posts: FeedPost[],
  followerCount: number
): PostPerformance[] {
  if (posts.length === 0 || followerCount === 0) return [];

  const avgEng =
    posts.reduce((s, p) => s + p.likeCount + p.commentCount + (p.shareCount ?? 0), 0)
    / posts.length;

  return posts.map((p) => {
    const totalEng = p.likeCount + p.commentCount + (p.shareCount ?? 0);
    const er = totalEng / followerCount;
    const performanceIndex = avgEng > 0 ? totalEng / avgEng : 1;

    return {
      imageUrl: p.imageUrl,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount ?? 0,
      caption: p.caption,
      hashtags: p.hashtags,
      timestamp: p.timestamp,
      postType: p.postType ?? "image",
      engagementRate: Math.round(er * 10000) / 10000,
      performanceIndex: Math.round(performanceIndex * 100) / 100,
      shortcode: p.shortcode,
    };
  });
}

function analyzeContentTypeBreakdown(
  posts: FeedPost[],
  followerCount: number
): ContentTypeBreakdown[] {
  if (posts.length === 0) return [];

  const typeMap = new Map<string, FeedPost[]>();
  for (const p of posts) {
    const type = p.postType ?? "image";
    const existing = typeMap.get(type) ?? [];
    typeMap.set(type, [...existing, p]);
  }

  return Array.from(typeMap.entries()).map(([type, typePosts]) => {
    const avgLikes = typePosts.reduce((s, p) => s + p.likeCount, 0) / typePosts.length;
    const avgComments = typePosts.reduce((s, p) => s + p.commentCount, 0) / typePosts.length;
    const avgShares = typePosts.reduce((s, p) => s + (p.shareCount ?? 0), 0) / typePosts.length;
    const avgER = followerCount > 0
      ? (avgLikes + avgComments + avgShares) / followerCount
      : 0;

    return {
      type,
      count: typePosts.length,
      avgLikes: Math.round(avgLikes),
      avgComments: Math.round(avgComments),
      avgShares: Math.round(avgShares),
      avgER: Math.round(avgER * 10000) / 10000,
    };
  });
}

// ─── Marketing Metrics ──────────────────────────────────────────

/** Estimated CPE based on tier pricing benchmarks */
function estimateCPE(tier: InfluencerTier, avgEngPerPost: number): number | null {
  if (avgEngPerPost <= 0) return null;

  // Estimated campaign cost (KRW) by tier
  const tierCosts: Record<InfluencerTier, number> = {
    nano: 100_000,
    micro: 500_000,
    mid: 2_000_000,
    macro: 10_000_000,
    mega: 50_000_000,
  };

  const cost = tierCosts[tier];
  return Math.round(cost / avgEngPerPost);
}

/** Content effectiveness: how well posts drive engagement (0-100) */
function calculateContentEffectivenessScore(
  engagementScore: number,
  consistencyScore: number,
  contentTypeBreakdown: ContentTypeBreakdown[]
): number {
  // Base: engagement drives most of content effectiveness
  let score = engagementScore * 0.6 + consistencyScore * 0.2;

  // Bonus for diverse content types with good performance
  if (contentTypeBreakdown.length >= 2) {
    const topER = Math.max(...contentTypeBreakdown.map((c) => c.avgER));
    const avgER =
      contentTypeBreakdown.reduce((s, c) => s + c.avgER, 0) / contentTypeBreakdown.length;
    // Reward if multiple types perform well (top performer not 2x above average)
    if (avgER > 0 && topER / avgER < 2) {
      score += 10;
    }
  }

  return clamp(score, 0, 100);
}

// ─── Insights Generator (Evidence-Based) ────────────────────────

function generateInsights(
  feedData: FeedData,
  engagement: { score: number; rate: number; avgLikes: number; avgComments: number; avgShares: number; benchmark: number },
  consistencyScore: number,
  postingFrequencyDays: number,
  growthScore: number,
  trendDirection: TrendDirection,
  trendMagnitude: number,
  authenticityScore: number,
  tier: InfluencerTier,
  platform: Platform,
  contentTypeBreakdown: ContentTypeBreakdown[],
  postPerformances: PostPerformance[],
  estimatedCPE: number | null,
  topHashtags: string[]
): VibeInsight[] {
  const insights: VibeInsight[] = [];
  const benchmark = engagement.benchmark;

  // 1. Engagement rate insight (high or low)
  if (engagement.rate > benchmark * 1.5) {
    insights.push({
      type: "strength",
      title: "높은 참여율",
      description: `${tier} 티어 ${platform === "tiktok" ? "TikTok" : "Instagram"} 평균 대비 ${Math.round((engagement.rate / benchmark) * 100)}% 수준의 인게이지먼트율입니다.`,
      evidence: `참여율 ${(engagement.rate * 100).toFixed(2)}% | 평균 ${formatNum(engagement.avgLikes)}좋아요 | 평균 ${formatNum(engagement.avgComments)}댓글`,
    });
  } else if (engagement.rate < benchmark * 0.5) {
    insights.push({
      type: "warning",
      title: "낮은 참여율",
      description: `${tier} 티어 ${platform === "tiktok" ? "TikTok" : "Instagram"} 벤치마크(${(benchmark * 100).toFixed(2)}%) 대비 참여율이 낮습니다.`,
      evidence: `참여율 ${(engagement.rate * 100).toFixed(2)}% | 벤치마크 ${(benchmark * 100).toFixed(2)}% | 평균 ${formatNum(engagement.avgLikes)}좋아요`,
    });
  }

  // 2. Content type recommendation (if ER difference > 30%)
  if (contentTypeBreakdown.length >= 2) {
    const sorted = [...contentTypeBreakdown].sort((a, b) => b.avgER - a.avgER);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (worst.avgER > 0 && best.avgER / worst.avgER > 1.3) {
      const typeLabel = (t: string) =>
        t === "reel" ? "릴" : t === "video" ? "비디오" : t === "carousel" ? "캐러셀" : "이미지";
      insights.push({
        type: "opportunity",
        title: "콘텐츠 유형 최적화",
        description: `${typeLabel(best.type)} 콘텐츠가 ${typeLabel(worst.type)} 대비 ${Math.round((best.avgER / worst.avgER - 1) * 100)}% 더 높은 참여율을 보입니다.`,
        evidence: `${typeLabel(best.type)}: 평균 ${formatNum(best.avgLikes)}좋아요 (${best.count}개) | ${typeLabel(worst.type)}: 평균 ${formatNum(worst.avgLikes)}좋아요 (${worst.count}개)`,
      });
    }
  }

  // 3. Trend direction
  if (trendDirection === "rising" && trendMagnitude > 10) {
    insights.push({
      type: "strength",
      title: "상승 트렌드",
      description: `최근 인게이지먼트가 ${trendMagnitude}% 상승세입니다. 지금이 협업 적기일 수 있습니다.`,
      evidence: `최근 ${Math.floor(postPerformances.length / 2)}개 게시물 평균 vs 이전 ${postPerformances.length - Math.floor(postPerformances.length / 2)}개 비교`,
    });
  } else if (trendDirection === "declining" && trendMagnitude > 15) {
    insights.push({
      type: "warning",
      title: "하락 트렌드",
      description: `최근 인게이지먼트가 ${trendMagnitude}% 하락세입니다. 콘텐츠 전략 점검이 필요합니다.`,
      evidence: `최근 ${Math.floor(postPerformances.length / 2)}개 게시물 평균 vs 이전 ${postPerformances.length - Math.floor(postPerformances.length / 2)}개 비교`,
    });
  }

  // 4. Hashtag effectiveness
  if (topHashtags.length >= 2 && postPerformances.length >= 4) {
    const hashtagPerformance = new Map<string, number[]>();
    for (const post of postPerformances) {
      const eng = post.likeCount + post.commentCount + post.shareCount;
      for (const tag of post.hashtags) {
        const existing = hashtagPerformance.get(tag.toLowerCase()) ?? [];
        hashtagPerformance.set(tag.toLowerCase(), [...existing, eng]);
      }
    }

    const hashtagAvgs = Array.from(hashtagPerformance.entries())
      .filter(([, vals]) => vals.length >= 2)
      .map(([tag, vals]) => ({
        tag,
        avgEng: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
      }))
      .sort((a, b) => b.avgEng - a.avgEng)
      .slice(0, 3);

    if (hashtagAvgs.length >= 2) {
      insights.push({
        type: "opportunity",
        title: "해시태그 효과 분석",
        description: "특정 해시태그 사용 시 더 높은 참여를 이끌어냅니다.",
        evidence: hashtagAvgs.map((h) => `#${h.tag}(평균 ${formatNum(h.avgEng)})`).join(", "),
      });
    }
  }

  // 5. Authenticity warning
  if (authenticityScore < 50) {
    const { profile } = feedData;
    const avgLikes = engagement.avgLikes;
    const likeRatio = profile.followerCount > 0
      ? (avgLikes / profile.followerCount * 100).toFixed(1)
      : "0";
    const ffRatio = profile.followerCount > 0
      ? (profile.followingCount / profile.followerCount).toFixed(1)
      : "0";
    insights.push({
      type: "warning",
      title: "진정성 주의",
      description: "가짜 팔로워 또는 봇 인게이지먼트 의심 징후가 감지되었습니다.",
      evidence: `감지: 좋아요율 ${likeRatio}%, 팔로잉/팔로워 ${ffRatio}`,
    });
  } else if (authenticityScore >= 90) {
    insights.push({
      type: "strength",
      title: "높은 진정성",
      description: "오디언스 참여 패턴이 자연스럽고 건강합니다.",
    });
  }

  // 6. Value collaboration (nano/micro + high ER)
  if ((tier === "nano" || tier === "micro") && engagement.score >= 70 && estimatedCPE !== null) {
    insights.push({
      type: "opportunity",
      title: "가성비 높은 협업",
      description: `${tier} 티어이지만 참여율이 높아, 비용 대비 효과적인 마이크로 인플루언서 마케팅에 적합합니다.`,
      evidence: `예상 CPE: ${formatNum(estimatedCPE)}원`,
    });
  }

  // 7. Posting consistency
  if (consistencyScore >= 80) {
    insights.push({
      type: "strength",
      title: "일관된 포스팅",
      description: "포스팅 빈도와 톤이 매우 안정적입니다. 브랜드 협업 시 신뢰할 수 있는 파트너입니다.",
      evidence: `평균 포스팅 주기: ${postingFrequencyDays.toFixed(1)}일`,
    });
  } else if (consistencyScore < 40) {
    insights.push({
      type: "warning",
      title: "불규칙한 포스팅",
      description: "포스팅 간격이 불규칙합니다. 꾸준한 콘텐츠 공급이 필요합니다.",
      evidence: `평균 포스팅 주기: ${postingFrequencyDays.toFixed(1)}일`,
    });
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

// ─── Main VibeScore Calculator ──────────────────────────────────

export function calculateVibeScore(
  feedData: FeedData,
  aestheticScores: AestheticScores
): VibeScoreResult {
  const tier = determineTier(feedData.profile.followerCount);
  const platform = (feedData.profile.platform ?? "instagram") as Platform;

  // Extract categories first (needed for benchmark)
  const topHashtags = extractTopHashtags(feedData.posts);
  const contentCategories = extractContentCategories(
    feedData.posts,
    feedData.profile.bio
  );

  // Sub-scores
  const engagement = calculateEngagementScore(feedData, contentCategories);
  const { score: consistencyScore, postingFrequencyDays } =
    calculateConsistencyScore(feedData, aestheticScores.toneConsistency);
  const { score: growthScore, trendDirection, trendMagnitude } =
    calculateGrowthPotentialScore(feedData, aestheticScores.trend);
  const authenticityScore = calculateAuthenticityScore(feedData, platform);

  // Post analysis
  const postPerformances = analyzePostPerformances(
    feedData.posts,
    feedData.profile.followerCount
  );
  const contentTypeBreakdown = analyzeContentTypeBreakdown(
    feedData.posts,
    feedData.profile.followerCount
  );

  // Marketing metrics
  const avgEngPerPost = engagement.avgLikes + engagement.avgComments + engagement.avgShares;
  const cpe = estimateCPE(tier, avgEngPerPost);
  const contentEffectiveness = calculateContentEffectivenessScore(
    engagement.score,
    consistencyScore,
    contentTypeBreakdown
  );

  // ── Composite VibeScore (rebalanced weights) ──
  // Aesthetic 25% / Engagement 30% / Consistency 15% / Growth 15% / Authenticity 15%
  const vibeScore = Math.round(
    aestheticScores.overall * 0.25 +
      engagement.score * 0.30 +
      consistencyScore * 0.15 +
      growthScore * 0.15 +
      authenticityScore * 0.15
  );

  // Insights (evidence-based)
  const insights = generateInsights(
    feedData,
    engagement,
    consistencyScore,
    postingFrequencyDays,
    growthScore,
    trendDirection,
    trendMagnitude,
    authenticityScore,
    tier,
    platform,
    contentTypeBreakdown,
    postPerformances,
    cpe,
    topHashtags
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
    avgSharesPerPost: engagement.avgShares,
    avgPlaysPerPost: engagement.avgPlays,
    postingFrequencyDays,
    topHashtags,
    contentCategories,
    insights,
    postPerformances,
    contentTypeBreakdown,
    trendDirection,
    trendMagnitude,
    estimatedCPE: cpe,
    contentEffectivenessScore: Math.round(contentEffectiveness),
    platformBenchmark: engagement.benchmark,
  };
}

// ─── Utility ────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
