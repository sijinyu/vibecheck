import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import type { Influencer } from "@/lib/supabase/types";

const TRENDING_WINDOW_DAYS = 30;
const RECENT_ANALYSES_LIMIT = 200;
const TOP_TRENDING_COUNT = 10;

interface TrendingInfluencer extends Influencer {
  analysisCount: number;
  erGrowth?: number;
}

/**
 * GET /api/influencers/trending
 * Returns the top 10 trending influencers.
 *
 * Query params:
 * - category: Filter by content category (e.g., "Fashion", "Beauty")
 * - includeNew: Include newly discovered influencers (default: true)
 *
 * Scoring: analysis count + ER growth rate + newly discovered bonus.
 * Requires authentication.
 */
export async function GET(request: Request) {
  try {
    const supabase = await tryCreateClient();

    if (!supabase) {
      return NextResponse.json(
        { error: { message: "데이터베이스에 연결할 수 없습니다" } },
        { status: 503 }
      );
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const includeNew = searchParams.get("includeNew") !== "false";

    // Step 1: Fetch recent analyses from the last 30 days
    const since = new Date();
    since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);
    const sinceIso = since.toISOString();

    const { data: recentAnalyses, error: analysesError } = await supabase
      .from("analyses")
      .select("handle")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(RECENT_ANALYSES_LIMIT);

    if (analysesError) {
      console.error("[trending-api] analyses query error:", analysesError.message);
      return NextResponse.json(
        { error: { message: "트렌딩 데이터를 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    // Step 2: Count analyses per handle in-memory
    const countByHandle = (recentAnalyses ?? []).reduce<Record<string, number>>(
      (acc, { handle }) => {
        return { ...acc, [handle]: (acc[handle] ?? 0) + 1 };
      },
      {}
    );

    // Step 3: Build influencer query with optional category filter
    let influencerQuery = supabase
      .from("influencers")
      .select("*")
      .not("discovery_status", "eq", "stub")
      .order("vibe_score", { ascending: false, nullsFirst: false })
      .limit(50);

    if (category) {
      influencerQuery = influencerQuery.contains("content_categories", [category]);
    }

    const { data: influencers, error: influencersError } = await influencerQuery;

    if (influencersError) {
      console.error("[trending-api] influencers query error:", influencersError.message);
      return NextResponse.json(
        { error: { message: "인플루언서 정보를 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    if (!influencers || influencers.length === 0) {
      return NextResponse.json({ data: [], categories: [] });
    }

    // Step 4: Score each influencer — weighted by analysis count + ER quality + newness
    const scored: TrendingInfluencer[] = influencers.map((influencer) => {
      const analysisCount = countByHandle[influencer.handle] ?? 0;

      // ER growth: engagement momentum (trend_magnitude as proxy)
      const erGrowth =
        influencer.trend_direction === "rising"
          ? (influencer.trend_magnitude ?? 0)
          : influencer.trend_direction === "declining"
            ? -(influencer.trend_magnitude ?? 0)
            : 0;

      // Newness bonus: discovered in last 7 days
      const isNew =
        includeNew &&
        new Date(influencer.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newBonus = isNew ? 3 : 0;

      // Combined score
      const trendScore = analysisCount * 2 + erGrowth * 5 + newBonus;

      return {
        ...influencer,
        analysisCount,
        erGrowth,
        _trendScore: trendScore,
      };
    });

    // Sort by trend score
    scored.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreA = (a as any)._trendScore ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreB = (b as any)._trendScore ?? 0;
      const scoreDiff = scoreB - scoreA;
      if (scoreDiff !== 0) return scoreDiff;
      return (b.vibe_score ?? 0) - (a.vibe_score ?? 0);
    });

    const trending = scored.slice(0, TOP_TRENDING_COUNT);

    // Get available categories for filter
    const allCategories = new Set<string>();
    for (const inf of influencers) {
      for (const cat of inf.content_categories ?? []) {
        allCategories.add(cat);
      }
    }

    return NextResponse.json({
      data: trending,
      categories: [...allCategories].sort(),
    });
  } catch (err) {
    console.error("[trending-api] error:", err);
    return NextResponse.json(
      { error: { message: "트렌딩 인플루언서를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
