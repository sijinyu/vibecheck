import { describe, it, expect } from "vitest";
import { calculateVibeScore, type VibeScoreResult } from "@/lib/ai/vibe-score-engine";
import { type FeedData, type AestheticScores } from "./helpers";

// ─── Test Helpers ─────────────────────────────────────────────

function makeFeedData(overrides: Partial<{
  followerCount: number;
  followingCount: number;
  platform: "instagram" | "tiktok";
  postCount: number;
  posts: Array<{
    likeCount: number;
    commentCount: number;
    daysAgo: number;
    hashtags?: string[];
    caption?: string;
  }>;
}>): FeedData {
  const postCount = overrides.postCount ?? overrides.posts?.length ?? 12;
  const posts = (overrides.posts ?? Array.from({ length: postCount }, (_, i) => ({
    likeCount: 100 + i * 10,
    commentCount: 10 + i,
    daysAgo: i * 2,
  }))).map((p, i) => ({
    imageUrl: `https://example.com/img${i}.jpg`,
    caption: p.caption ?? `post ${i}`,
    hashtags: p.hashtags ?? ["fashion", "ootd"],
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    timestamp: new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  }));

  return {
    profile: {
      handle: "test_user",
      platform: overrides.platform ?? "instagram",
      displayName: "Test User",
      profileImageUrl: null,
      bio: "fashion blogger",
      followerCount: overrides.followerCount ?? 5000,
      followingCount: overrides.followingCount ?? 500,
      postCount: posts.length,
    },
    posts,
    dataSource: "live" as const,
  };
}

const baseAestheticScores: AestheticScores = {
  overall: 75,
  color: 80,
  composition: 70,
  toneConsistency: 75,
  trend: 65,
  styleOriginality: 70,
};

// ─── Tests ────────────────────────────────────────────────────

describe("calculateVibeScore", () => {
  it("returns all required fields", () => {
    const feedData = makeFeedData({});
    const result = calculateVibeScore(feedData, baseAestheticScores);

    expect(result).toHaveProperty("vibeScore");
    expect(result).toHaveProperty("aestheticScore");
    expect(result).toHaveProperty("engagementScore");
    expect(result).toHaveProperty("consistencyScore");
    expect(result).toHaveProperty("growthPotentialScore");
    expect(result).toHaveProperty("authenticityScore");
    expect(result).toHaveProperty("tier");
    expect(result).toHaveProperty("engagementRate");
    expect(result).toHaveProperty("avgLikesPerPost");
    expect(result).toHaveProperty("avgCommentsPerPost");
    expect(result).toHaveProperty("avgSharesPerPost");
    expect(result).toHaveProperty("avgPlaysPerPost");
    expect(result).toHaveProperty("postingFrequencyDays");
    expect(result).toHaveProperty("topHashtags");
    expect(result).toHaveProperty("contentCategories");
    expect(result).toHaveProperty("insights");
    expect(result).toHaveProperty("postPerformances");
    expect(result).toHaveProperty("contentTypeBreakdown");
    expect(result).toHaveProperty("trendDirection");
    expect(result).toHaveProperty("trendMagnitude");
    expect(result).toHaveProperty("estimatedCPE");
    expect(result).toHaveProperty("contentEffectivenessScore");
    expect(result).toHaveProperty("platformBenchmark");
  });

  it("scores are within 0-100 range", () => {
    const feedData = makeFeedData({});
    const result = calculateVibeScore(feedData, baseAestheticScores);

    expect(result.vibeScore).toBeGreaterThanOrEqual(0);
    expect(result.vibeScore).toBeLessThanOrEqual(100);
    expect(result.engagementScore).toBeGreaterThanOrEqual(0);
    expect(result.engagementScore).toBeLessThanOrEqual(100);
    expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(result.consistencyScore).toBeLessThanOrEqual(100);
    expect(result.growthPotentialScore).toBeGreaterThanOrEqual(0);
    expect(result.growthPotentialScore).toBeLessThanOrEqual(100);
    expect(result.authenticityScore).toBeGreaterThanOrEqual(0);
    expect(result.authenticityScore).toBeLessThanOrEqual(100);
  });

  it("aestheticScore matches input", () => {
    const feedData = makeFeedData({});
    const result = calculateVibeScore(feedData, baseAestheticScores);
    expect(result.aestheticScore).toBe(75);
  });

  // ─── Tier Detection ────────────────────────────────────────

  it("assigns nano tier for < 10K followers", () => {
    const result = calculateVibeScore(
      makeFeedData({ followerCount: 5000 }),
      baseAestheticScores
    );
    expect(result.tier).toBe("nano");
  });

  it("assigns micro tier for 10-50K followers", () => {
    const result = calculateVibeScore(
      makeFeedData({ followerCount: 25000 }),
      baseAestheticScores
    );
    expect(result.tier).toBe("micro");
  });

  it("assigns mid tier for 50-100K followers", () => {
    const result = calculateVibeScore(
      makeFeedData({ followerCount: 75000 }),
      baseAestheticScores
    );
    expect(result.tier).toBe("mid");
  });

  it("assigns macro tier for 100K-1M followers", () => {
    const result = calculateVibeScore(
      makeFeedData({ followerCount: 500000 }),
      baseAestheticScores
    );
    expect(result.tier).toBe("macro");
  });

  it("assigns mega tier for > 1M followers", () => {
    const result = calculateVibeScore(
      makeFeedData({ followerCount: 2000000 }),
      baseAestheticScores
    );
    expect(result.tier).toBe("mega");
  });

  // ─── Engagement ────────────────────────────────────────────

  it("higher engagement produces higher engagement score", () => {
    const lowEngagement = calculateVibeScore(
      makeFeedData({
        followerCount: 10000,
        posts: Array.from({ length: 12 }, (_, i) => ({
          likeCount: 10,
          commentCount: 1,
          daysAgo: i * 3,
        })),
      }),
      baseAestheticScores
    );

    const highEngagement = calculateVibeScore(
      makeFeedData({
        followerCount: 10000,
        posts: Array.from({ length: 12 }, (_, i) => ({
          likeCount: 500,
          commentCount: 50,
          daysAgo: i * 3,
        })),
      }),
      baseAestheticScores
    );

    expect(highEngagement.engagementScore).toBeGreaterThan(
      lowEngagement.engagementScore
    );
  });

  // ─── Authenticity ──────────────────────────────────────────

  it("penalizes suspicious follower/engagement patterns", () => {
    // High followers, almost no likes → fake followers
    const suspicious = calculateVibeScore(
      makeFeedData({
        followerCount: 100000,
        followingCount: 200000, // following > followers
        posts: Array.from({ length: 12 }, (_, i) => ({
          likeCount: 5, // abnormally low
          commentCount: 0,
          daysAgo: i * 3,
        })),
      }),
      baseAestheticScores
    );

    const genuine = calculateVibeScore(
      makeFeedData({
        followerCount: 100000,
        followingCount: 5000,
        posts: Array.from({ length: 12 }, (_, i) => ({
          likeCount: 2000 + i * 100,
          commentCount: 100 + i * 10,
          daysAgo: i * 3,
        })),
      }),
      baseAestheticScores
    );

    expect(genuine.authenticityScore).toBeGreaterThan(
      suspicious.authenticityScore
    );
  });

  // ─── Consistency ───────────────────────────────────────────

  it("regular posting produces higher consistency", () => {
    // Consistent: every 2 days
    const consistent = calculateVibeScore(
      makeFeedData({
        posts: Array.from({ length: 12 }, (_, i) => ({
          likeCount: 100,
          commentCount: 10,
          daysAgo: i * 2, // every 2 days
        })),
      }),
      baseAestheticScores
    );

    // Inconsistent: random gaps
    const inconsistent = calculateVibeScore(
      makeFeedData({
        posts: [
          { likeCount: 100, commentCount: 10, daysAgo: 0 },
          { likeCount: 100, commentCount: 10, daysAgo: 1 },
          { likeCount: 100, commentCount: 10, daysAgo: 2 },
          { likeCount: 100, commentCount: 10, daysAgo: 30 },
          { likeCount: 100, commentCount: 10, daysAgo: 31 },
          { likeCount: 100, commentCount: 10, daysAgo: 90 },
        ],
      }),
      baseAestheticScores
    );

    expect(consistent.consistencyScore).toBeGreaterThan(
      inconsistent.consistencyScore
    );
  });

  // ─── Composite Formula ─────────────────────────────────────

  it("vibeScore is weighted average of sub-scores", () => {
    const feedData = makeFeedData({});
    const result = calculateVibeScore(feedData, baseAestheticScores);

    // VibeScore = Aesthetic×0.25 + Engagement×0.30 + Consistency×0.15 + Growth×0.15 + Authenticity×0.15
    const expected = Math.round(
      baseAestheticScores.overall * 0.25 +
        result.engagementScore * 0.30 +
        result.consistencyScore * 0.15 +
        result.growthPotentialScore * 0.15 +
        result.authenticityScore * 0.15
    );

    // Allow ±1 rounding difference
    expect(Math.abs(result.vibeScore - expected)).toBeLessThanOrEqual(1);
  });

  // ─── Hashtags & Categories ─────────────────────────────────

  it("extracts top hashtags from posts", () => {
    const feedData = makeFeedData({
      posts: Array.from({ length: 6 }, (_, i) => ({
        likeCount: 100,
        commentCount: 10,
        daysAgo: i * 2,
        hashtags: ["fashion", "ootd", i % 2 === 0 ? "style" : "beauty"],
      })),
    });

    const result = calculateVibeScore(feedData, baseAestheticScores);
    expect(result.topHashtags).toContain("fashion");
    expect(result.topHashtags).toContain("ootd");
    expect(result.topHashtags.length).toBeGreaterThan(0);
  });

  it("extracts content categories from hashtags and bio", () => {
    const feedData = makeFeedData({
      posts: Array.from({ length: 6 }, (_, i) => ({
        likeCount: 100,
        commentCount: 10,
        daysAgo: i * 2,
        hashtags: ["fashion", "ootd"],
        caption: "today outfit",
      })),
    });

    const result = calculateVibeScore(feedData, baseAestheticScores);
    expect(result.contentCategories).toContain("Fashion");
  });

  // ─── Insights ──────────────────────────────────────────────

  it("generates insights array", () => {
    const feedData = makeFeedData({});
    const result = calculateVibeScore(feedData, baseAestheticScores);
    expect(Array.isArray(result.insights)).toBe(true);

    for (const insight of result.insights) {
      expect(["strength", "warning", "opportunity"]).toContain(insight.type);
      expect(insight.title).toBeTruthy();
      expect(insight.description).toBeTruthy();
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────

  it("handles empty posts gracefully", () => {
    const feedData: FeedData = {
      profile: {
        handle: "empty_user",
        platform: "instagram",
        displayName: "Empty",
        profileImageUrl: null,
        bio: null,
        followerCount: 1000,
        followingCount: 100,
        postCount: 0,
      },
      posts: [],
      dataSource: "live",
    };

    const result = calculateVibeScore(feedData, baseAestheticScores);
    expect(result.vibeScore).toBeGreaterThanOrEqual(0);
    expect(result.vibeScore).toBeLessThanOrEqual(100);
    expect(result.tier).toBe("nano");
  });

  it("handles zero followers gracefully", () => {
    const feedData = makeFeedData({ followerCount: 0 });
    const result = calculateVibeScore(feedData, baseAestheticScores);
    expect(result.vibeScore).toBeGreaterThanOrEqual(0);
  });

  it("handles single post gracefully", () => {
    const feedData = makeFeedData({
      posts: [{ likeCount: 100, commentCount: 10, daysAgo: 0 }],
    });
    const result = calculateVibeScore(feedData, baseAestheticScores);
    expect(result.vibeScore).toBeGreaterThanOrEqual(0);
  });
});
