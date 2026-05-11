import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import {
  getUserAnalyses,
  getUserSavedInfluencers,
} from "@/lib/supabase/queries";

export async function GET() {
  try {
    const supabase = await tryCreateClient();

    if (!supabase) {
      return NextResponse.json({ data: { analyses: [], saved: [], stats: null } });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    const [analyses, saved] = await Promise.all([
      getUserAnalyses(supabase, user.id),
      getUserSavedInfluencers(supabase, user.id),
    ]);

    // Aggregate stats
    const vibeScores = analyses
      .map((a) => Number(a.vibe_score ?? a.aesthetic_score ?? 0))
      .filter((s) => s > 0);

    const avgVibeScore =
      vibeScores.length > 0
        ? Math.round(vibeScores.reduce((s, v) => s + v, 0) / vibeScores.length)
        : 0;

    // Tier distribution from actual influencer data
    const tierCounts: Record<string, number> = {};
    const uniqueHandles = [...new Set(analyses.map((a) => a.handle))];
    if (uniqueHandles.length > 0) {
      const { data: influencers } = await supabase
        .from("influencers")
        .select("handle, tier")
        .in("handle", uniqueHandles);

      for (const inf of influencers ?? []) {
        const tier = inf.tier ?? "unknown";
        tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
      }
    }

    // Score distribution (buckets of 10)
    const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${i * 10 + 9}`,
      count: vibeScores.filter((s) => s >= i * 10 && s < (i + 1) * 10).length,
    }));

    return NextResponse.json({
      data: {
        analyses: analyses.map((a) => ({
          id: a.id,
          handle: a.handle,
          platform: a.platform,
          aestheticScore: a.aesthetic_score,
          vibeScore: a.vibe_score,
          engagementScore: a.engagement_score,
          consistencyScore: a.consistency_score,
          growthPotentialScore: a.growth_potential_score,
          authenticityScore: a.authenticity_score,
          engagementRate: a.engagement_rate,
          summary: a.summary,
          analyzedAt: a.created_at,
        })),
        saved: saved.map((s) => ({
          influencerId: s.influencer.id,
          handle: s.influencer.handle,
          platform: s.influencer.platform,
          displayName: s.influencer.display_name,
          aestheticScore: Number(s.influencer.aesthetic_score ?? 0),
          vibeScore: Number(s.influencer.vibe_score ?? 0),
          tier: s.influencer.tier,
          engagementRate: Number(s.influencer.engagement_rate ?? 0),
          category: s.influencer.category,
          savedAt: s.saved_at,
        })),
        stats: {
          totalAnalyses: analyses.length,
          avgVibeScore,
          tierDistribution: tierCounts,
          scoreDistribution,
          totalSaved: saved.length,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "대시보드 데이터를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
