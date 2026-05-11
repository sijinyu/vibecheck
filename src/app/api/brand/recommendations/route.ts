import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { calculateMatchScores } from "@/lib/ai/matching-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { preferredTiers = [], targetCategories = [], limit = 20 } = body;

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

    // Get user's brand profile
    const { data: brand } = await supabase
      .from("brand_profiles")
      .select()
      .eq("user_id", user.id)
      .maybeSingle();

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

    // Fallback: get all influencers with vibe_score and calculate matches
    const { data: influencers } = await supabase
      .from("influencers")
      .select()
      .not("vibe_score", "is", null)
      .order("vibe_score", { ascending: false })
      .limit(limit);

    if (!influencers || influencers.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const results = calculateMatchScores(influencers, {
      toneVector: brand.tone_vector as number[],
      preferredTiers,
      targetCategories,
    });

    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json(
      { error: { message: "추천 목록을 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
