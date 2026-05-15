import { describe, it, expect } from "vitest";
import { calculateMatchScores, type MatchResult } from "@/lib/ai/matching-engine";

function makeInfluencer(overrides: Partial<{
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
  follower_count: number | null;
  representative_images: string[];
  content_categories: string[];
}>) {
  return {
    id: overrides.id ?? "uuid-1",
    handle: overrides.handle ?? "test_influencer",
    platform: overrides.platform ?? "instagram",
    display_name: overrides.display_name ?? "Test Influencer",
    aesthetic_vector: "aesthetic_vector" in overrides ? overrides.aesthetic_vector! : Array(512).fill(0.5),
    vibe_score: overrides.vibe_score ?? 75,
    engagement_score: overrides.engagement_score ?? 70,
    authenticity_score: overrides.authenticity_score ?? 80,
    tier: overrides.tier ?? "micro",
    engagement_rate: overrides.engagement_rate ?? 0.03,
    follower_count: overrides.follower_count ?? 10000,
    representative_images: overrides.representative_images ?? ["img1.jpg", "img2.jpg", "img3.jpg"],
    content_categories: overrides.content_categories ?? ["Fashion", "Lifestyle"],
  };
}

const baseBrand = {
  toneVector: Array(512).fill(0.5),
  preferredTiers: [] as string[],
  targetCategories: [] as string[],
};

describe("calculateMatchScores", () => {
  it("returns results sorted by matchScore descending", () => {
    const influencers = [
      makeInfluencer({ id: "1", vibe_score: 50, engagement_score: 30 }),
      makeInfluencer({ id: "2", vibe_score: 90, engagement_score: 85 }),
      makeInfluencer({ id: "3", vibe_score: 70, engagement_score: 60 }),
    ];

    const results = calculateMatchScores(influencers, baseBrand);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].matchScore).toBeGreaterThanOrEqual(
        results[i].matchScore
      );
    }
  });

  it("returns all required fields", () => {
    const results = calculateMatchScores(
      [makeInfluencer({})],
      baseBrand
    );

    const r = results[0];
    expect(r).toHaveProperty("influencerId");
    expect(r).toHaveProperty("handle");
    expect(r).toHaveProperty("matchScore");
    expect(r).toHaveProperty("aestheticMatch");
    expect(r).toHaveProperty("tierCompatibility");
    expect(r).toHaveProperty("categoryAlignment");
    expect(r).toHaveProperty("qualityFilter");
    expect(r).toHaveProperty("matchReason");
  });

  it("scores are within 0-100 range", () => {
    const results = calculateMatchScores(
      [makeInfluencer({})],
      baseBrand
    );

    const r = results[0];
    expect(r.matchScore).toBeGreaterThanOrEqual(0);
    expect(r.matchScore).toBeLessThanOrEqual(100);
    expect(r.aestheticMatch).toBeGreaterThanOrEqual(0);
    expect(r.aestheticMatch).toBeLessThanOrEqual(100);
  });

  // ─── Tier Compatibility ────────────────────────────────────

  it("gives 100 tier compatibility when no preferred tiers", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ tier: "macro" })],
      { ...baseBrand, preferredTiers: [] }
    );
    expect(results[0].tierCompatibility).toBe(100);
  });

  it("gives 100 tier compatibility for matching tier", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ tier: "micro" })],
      { ...baseBrand, preferredTiers: ["micro", "nano"] }
    );
    expect(results[0].tierCompatibility).toBe(100);
  });

  it("penalizes non-matching tier", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ tier: "mega" })],
      { ...baseBrand, preferredTiers: ["nano", "micro"] }
    );
    expect(results[0].tierCompatibility).toBe(30);
  });

  // ─── Category Alignment ────────────────────────────────────

  it("gives 70 category alignment when no target categories", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ content_categories: ["Fashion"] })],
      { ...baseBrand, targetCategories: [] }
    );
    expect(results[0].categoryAlignment).toBe(70);
  });

  it("gives 100 for full category overlap", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ content_categories: ["Fashion", "Beauty"] })],
      { ...baseBrand, targetCategories: ["Fashion", "Beauty"] }
    );
    expect(results[0].categoryAlignment).toBe(100);
  });

  it("gives partial score for partial category overlap", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ content_categories: ["Fashion"] })],
      { ...baseBrand, targetCategories: ["Fashion", "Beauty", "Travel"] }
    );
    // 1 out of 3 = 33%
    expect(results[0].categoryAlignment).toBeLessThan(70);
  });

  // ─── Quality Filter ────────────────────────────────────────

  it("gives 100 quality for high authenticity and engagement", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ authenticity_score: 80, engagement_score: 70 })],
      baseBrand
    );
    expect(results[0].qualityFilter).toBe(100);
  });

  it("penalizes low authenticity", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ authenticity_score: 30, engagement_score: 70 })],
      baseBrand
    );
    expect(results[0].qualityFilter).toBeLessThan(100);
  });

  // ─── Aesthetic Match ───────────────────────────────────────

  it("identical vectors produce high aesthetic match", () => {
    const vector = Array(512).fill(0.7);
    const results = calculateMatchScores(
      [makeInfluencer({ aesthetic_vector: vector })],
      { ...baseBrand, toneVector: vector }
    );
    expect(results[0].aestheticMatch).toBeGreaterThanOrEqual(80);
  });

  it("handles null aesthetic_vector gracefully", () => {
    const results = calculateMatchScores(
      [makeInfluencer({ aesthetic_vector: null })],
      baseBrand
    );
    expect(results[0].aestheticMatch).toBe(50);
  });

  // ─── Match Reason ──────────────────────────────────────────

  it("generates non-empty match reason", () => {
    const results = calculateMatchScores(
      [makeInfluencer({})],
      baseBrand
    );
    expect(results[0].matchReason.length).toBeGreaterThan(0);
  });

  // ─── Empty Input ───────────────────────────────────────────

  it("returns empty array for empty influencers", () => {
    const results = calculateMatchScores([], baseBrand);
    expect(results).toEqual([]);
  });
});
