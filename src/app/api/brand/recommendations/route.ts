import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { calculateMatchScores } from "@/lib/ai/matching-engine";

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

    if (matched && matched.length > 0) {
      const results = calculateMatchScores(matched, {
        toneVector: brand.tone_vector as number[],
        preferredTiers,
        targetCategories,
      });

      return NextResponse.json({ data: results });
    }

    // Fallback: get fully analyzed influencers
    const { data: fullInfluencers } = await supabase
      .from("influencers")
      .select()
      .not("vibe_score", "is", null)
      .order("vibe_score", { ascending: false })
      .limit(limit);

    // Also get light-profile influencers to fill gaps (min 300 followers)
    const { data: lightInfluencers } = await supabase
      .from("influencers")
      .select()
      .eq("discovery_status", "light")
      .is("vibe_score", null)
      .gte("follower_count", 300)
      .order("follower_count", { ascending: false, nullsFirst: false })
      .limit(limit);

    const combined = [
      ...(fullInfluencers ?? []),
      ...(lightInfluencers ?? []),
    ];

    if (combined.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const results = calculateMatchScores(combined, {
      toneVector: brand.tone_vector as number[],
      preferredTiers,
      targetCategories,
    });

    return NextResponse.json({ data: results.slice(0, limit) });
  } catch {
    return NextResponse.json(
      { error: { message: "추천 목록을 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
