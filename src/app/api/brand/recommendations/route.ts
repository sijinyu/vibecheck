import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { calculateMatchScores } from "@/lib/ai/matching-engine";

const MIN_RECOMMENDATIONS = 5;
const FREE_LIMIT = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandId, preferredTiers = [], targetCategories = [], limit = 20 } = body;

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

    // Get brand profile — by brandId if provided, otherwise first brand
    const brandQuery = brandId
      ? supabase.from("brand_profiles").select().eq("id", brandId).single()
      : supabase.from("brand_profiles").select().eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: brand } = await brandQuery;

    if (!brand?.tone_vector) {
      return NextResponse.json(
        { error: { message: "먼저 브랜드 톤을 등록해주세요" } },
        { status: 400 }
      );
    }

    const brandCriteria = {
      toneVector: brand.tone_vector as number[],
      preferredTiers,
      targetCategories,
    };

    // Try pgvector RPC first
    const { data: matched } = await supabase.rpc(
      "match_influencers_for_brand",
      {
        query_vector: JSON.stringify(brand.tone_vector),
        preferred_tiers: preferredTiers.length > 0 ? preferredTiers : "{}",
        target_categories: targetCategories.length > 0 ? targetCategories : "{}",
        min_vibe_score: 30,
        match_count: limit,
        match_threshold: 0.3,
      }
    );

    let results = matched && matched.length > 0
      ? calculateMatchScores(matched, brandCriteria)
      : [];

    // Fallback 1: fully analyzed influencers (vibe_score IS NOT NULL)
    if (results.length < MIN_RECOMMENDATIONS) {
      const { data: fullInfluencers } = await supabase
        .from("influencers")
        .select()
        .not("vibe_score", "is", null)
        .order("vibe_score", { ascending: false })
        .limit(limit);

      if (fullInfluencers && fullInfluencers.length > 0) {
        const existingIds = new Set(results.map((r) => r.influencerId));
        const newInfluencers = fullInfluencers.filter((inf) => !existingIds.has(inf.id));
        if (newInfluencers.length > 0) {
          const moreResults = calculateMatchScores(newInfluencers, brandCriteria);
          results = [...results, ...moreResults];
        }
      }
    }

    // Fallback 2: light-profile influencers with relaxed quality gate
    if (results.length < MIN_RECOMMENDATIONS) {
      const { data: lightInfluencers } = await supabase
        .from("influencers")
        .select()
        .eq("discovery_status", "light")
        .is("vibe_score", null)
        .gte("follower_count", 300)
        .order("follower_count", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (lightInfluencers && lightInfluencers.length > 0) {
        const existingIds = new Set(results.map((r) => r.influencerId));
        const newLight = lightInfluencers.filter((inf) => !existingIds.has(inf.id));
        if (newLight.length > 0) {
          // Use relaxed quality gate: 1 image instead of 3
          const lightResults = calculateMatchScores(newLight, brandCriteria, { relaxed: true });
          results = [...results, ...lightResults];
        }
      }
    }

    // De-duplicate and sort by matchScore
    const seen = new Set<string>();
    const deduped = results.filter((r) => {
      if (seen.has(r.influencerId)) return false;
      seen.add(r.influencerId);
      return true;
    });
    deduped.sort((a, b) => b.matchScore - a.matchScore);

    // Check user tier (Free = top 3 visible, rest blur-flagged)
    const { data: usageRow } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", getCurrentMonth())
      .maybeSingle();

    // For now: if user_usage table doesn't exist yet, treat as free tier
    const isPro = false; // TODO: check subscription status
    const finalResults = deduped.slice(0, limit);

    if (!isPro && finalResults.length > FREE_LIMIT) {
      // Mark items beyond FREE_LIMIT as blurred
      return NextResponse.json({
        data: finalResults.map((r, i) => ({
          ...r,
          blurred: i >= FREE_LIMIT,
        })),
        meta: {
          total: finalResults.length,
          freeLimit: FREE_LIMIT,
          isPro,
        },
      });
    }

    return NextResponse.json({
      data: finalResults,
      meta: { total: finalResults.length, isPro },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "추천 목록을 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
