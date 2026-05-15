/**
 * ROI Calculator
 *
 * 3가지 계산기:
 * 1. 예산 최적화기 — 예산 X원 → 최적 인플루언서 조합 (CPE 기반 greedy)
 * 2. 도달률 계산기 — 인플루언서별 예상 노출/참여
 * 3. ROI 추적기 — 캠페인 계획 vs 실제 성과 비교
 */

export interface InfluencerForBudget {
  id: string;
  handle: string;
  tier: string;
  followerCount: number;
  engagementRate: number;
  estimatedCpe: number | null;
  vibeScore: number | null;
  categories: string[];
}

export interface BudgetAllocation {
  influencer: InfluencerForBudget;
  suggestedFee: number;
  expectedReach: number;
  expectedEngagement: number;
  cpe: number;
}

export interface BudgetOptimizationResult {
  allocations: BudgetAllocation[];
  totalBudget: number;
  totalExpectedReach: number;
  totalExpectedEngagement: number;
  avgCpe: number;
  unusedBudget: number;
}

// Tier-based typical collaboration costs (KRW)
const TIER_COSTS: Record<string, number> = {
  nano: 100_000,
  micro: 500_000,
  mid: 2_000_000,
  macro: 10_000_000,
  mega: 50_000_000,
};

/**
 * 1. Budget Optimizer — Greedy allocation by CPE efficiency
 */
export function optimizeBudget(
  influencers: InfluencerForBudget[],
  budgetKrw: number
): BudgetOptimizationResult {
  // Calculate efficiency score for each influencer
  const scored = influencers.map((inf) => {
    const cost = TIER_COSTS[inf.tier] ?? 500_000;
    const cpe = inf.estimatedCpe ?? (cost / Math.max(1, inf.followerCount * inf.engagementRate));
    const expectedEngagement = Math.round(inf.followerCount * inf.engagementRate);
    const expectedReach = Math.round(inf.followerCount * 0.3); // ~30% reach rate
    const efficiency = expectedEngagement / Math.max(1, cost); // engagement per KRW

    return {
      influencer: inf,
      cost,
      cpe,
      expectedEngagement,
      expectedReach,
      efficiency,
    };
  });

  // Sort by efficiency (best first)
  scored.sort((a, b) => b.efficiency - a.efficiency);

  // Greedy allocation
  const allocations: BudgetAllocation[] = [];
  let remaining = budgetKrw;

  for (const item of scored) {
    if (remaining <= 0) break;
    if (item.cost > remaining) continue;

    allocations.push({
      influencer: item.influencer,
      suggestedFee: item.cost,
      expectedReach: item.expectedReach,
      expectedEngagement: item.expectedEngagement,
      cpe: item.cpe,
    });
    remaining -= item.cost;
  }

  const totalEngagement = allocations.reduce((sum, a) => sum + a.expectedEngagement, 0);
  const totalReach = allocations.reduce((sum, a) => sum + a.expectedReach, 0);
  const totalSpent = allocations.reduce((sum, a) => sum + a.suggestedFee, 0);

  return {
    allocations,
    totalBudget: budgetKrw,
    totalExpectedReach: totalReach,
    totalExpectedEngagement: totalEngagement,
    avgCpe: totalEngagement > 0 ? Math.round(totalSpent / totalEngagement) : 0,
    unusedBudget: remaining,
  };
}

/**
 * 2. Reach Calculator — Per-influencer expected performance
 */
export function calculateReach(
  influencer: InfluencerForBudget
): {
  expectedImpressions: number;
  expectedReach: number;
  expectedEngagement: number;
  expectedLikes: number;
  expectedComments: number;
  estimatedCpe: number;
} {
  const reachRate = influencer.tier === "nano" ? 0.4 : influencer.tier === "micro" ? 0.35 : 0.25;
  const likeRatio = 0.85; // Likes are ~85% of total engagement
  const commentRatio = 0.15; // Comments are ~15%

  const expectedImpressions = Math.round(influencer.followerCount * reachRate * 1.3);
  const expectedReach = Math.round(influencer.followerCount * reachRate);
  const expectedEngagement = Math.round(influencer.followerCount * influencer.engagementRate);
  const expectedLikes = Math.round(expectedEngagement * likeRatio);
  const expectedComments = Math.round(expectedEngagement * commentRatio);

  const cost = TIER_COSTS[influencer.tier] ?? 500_000;
  const estimatedCpe = influencer.estimatedCpe ?? (expectedEngagement > 0 ? cost / expectedEngagement : 0);

  return {
    expectedImpressions,
    expectedReach,
    expectedEngagement,
    expectedLikes,
    expectedComments,
    estimatedCpe,
  };
}

/**
 * 3. ROI Tracker — Plan vs Actual comparison
 */
export interface RoiComparison {
  planned: {
    totalReach: number;
    totalEngagement: number;
    totalSpend: number;
    avgCpe: number;
  };
  actual: {
    totalReach: number;
    totalEngagement: number;
    totalSpend: number;
    avgCpe: number;
  };
  performance: {
    reachEfficiency: number; // actual/planned ratio
    engagementEfficiency: number;
    cpeEfficiency: number; // inverted — lower is better
    overallRoi: number;
  };
}

export function calculateRoi(
  planned: { reach: number; engagement: number; spend: number },
  actual: { reach: number; engagement: number; spend: number }
): RoiComparison {
  const plannedCpe = planned.engagement > 0 ? planned.spend / planned.engagement : 0;
  const actualCpe = actual.engagement > 0 ? actual.spend / actual.engagement : 0;

  return {
    planned: {
      totalReach: planned.reach,
      totalEngagement: planned.engagement,
      totalSpend: planned.spend,
      avgCpe: Math.round(plannedCpe),
    },
    actual: {
      totalReach: actual.reach,
      totalEngagement: actual.engagement,
      totalSpend: actual.spend,
      avgCpe: Math.round(actualCpe),
    },
    performance: {
      reachEfficiency: planned.reach > 0 ? actual.reach / planned.reach : 0,
      engagementEfficiency:
        planned.engagement > 0 ? actual.engagement / planned.engagement : 0,
      cpeEfficiency: plannedCpe > 0 ? plannedCpe / Math.max(1, actualCpe) : 0,
      overallRoi: actual.spend > 0 ? (actual.engagement * actualCpe) / actual.spend : 0,
    },
  };
}
