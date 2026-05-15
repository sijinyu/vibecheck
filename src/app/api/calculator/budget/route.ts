import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { optimizeBudget } from "@/lib/calculator/roi-calculator";
import type { InfluencerForBudget } from "@/lib/calculator/roi-calculator";

export async function POST(request: Request) {
  try {
    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "서비스를 사용할 수 없습니다" } },
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

    const body = await request.json();
    const { budget, brandId, influencerIds } = body;

    if (budget === undefined || typeof budget !== "number" || budget <= 0) {
      return NextResponse.json(
        { error: { message: "유효한 예산(KRW)을 입력해주세요" } },
        { status: 400 }
      );
    }

    let influencers: InfluencerForBudget[] = [];

    if (influencerIds && Array.isArray(influencerIds) && influencerIds.length > 0) {
      // Fetch specific influencers by ID list
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("influencers")
        .select(
          "id, handle, tier, follower_count, engagement_rate, estimated_cpe, vibe_score, content_categories"
        )
        .in("id", influencerIds)
        .not("tier", "is", null)
        .not("follower_count", "is", null)
        .not("engagement_rate", "is", null);

      if (error) {
        console.error("[calculator/budget POST] influencerIds fetch error:", error.message);
        return NextResponse.json(
          { error: { message: "인플루언서 정보를 불러올 수 없습니다" } },
          { status: 500 }
        );
      }

      influencers = mapToInfluencerForBudget(data ?? []);
    } else if (brandId && typeof brandId === "string") {
      // Fetch brand to get preferred tiers and categories for matching
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: brand, error: brandError } = await (supabase as any)
        .from("brand_profiles")
        .select("preferred_tiers, target_categories")
        .eq("id", brandId)
        .eq("user_id", user.id)
        .single();

      if (brandError || !brand) {
        return NextResponse.json(
          { error: { message: "브랜드를 찾을 수 없습니다" } },
          { status: 404 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("influencers")
        .select(
          "id, handle, tier, follower_count, engagement_rate, estimated_cpe, vibe_score, content_categories"
        )
        .not("tier", "is", null)
        .not("follower_count", "is", null)
        .not("engagement_rate", "is", null)
        .order("vibe_score", { ascending: false })
        .limit(100);

      // Filter by preferred tiers if the brand has them configured
      if (brand.preferred_tiers && brand.preferred_tiers.length > 0) {
        query = query.in("tier", brand.preferred_tiers);
      }

      const { data, error: influencerError } = await query;

      if (influencerError) {
        console.error("[calculator/budget POST] brandId influencer fetch error:", influencerError.message);
        return NextResponse.json(
          { error: { message: "인플루언서 정보를 불러올 수 없습니다" } },
          { status: 500 }
        );
      }

      influencers = mapToInfluencerForBudget(data ?? []);
    } else {
      // Fallback: fetch top influencers by vibe score
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("influencers")
        .select(
          "id, handle, tier, follower_count, engagement_rate, estimated_cpe, vibe_score, content_categories"
        )
        .not("tier", "is", null)
        .not("follower_count", "is", null)
        .not("engagement_rate", "is", null)
        .order("vibe_score", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[calculator/budget POST] default fetch error:", error.message);
        return NextResponse.json(
          { error: { message: "인플루언서 정보를 불러올 수 없습니다" } },
          { status: 500 }
        );
      }

      influencers = mapToInfluencerForBudget(data ?? []);
    }

    if (influencers.length === 0) {
      return NextResponse.json(
        { error: { message: "최적화할 인플루언서 데이터가 없습니다" } },
        { status: 404 }
      );
    }

    const result = optimizeBudget(influencers, budget);

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: { message: "예산 최적화에 실패했습니다" } },
      { status: 500 }
    );
  }
}

function mapToInfluencerForBudget(rows: Record<string, unknown>[]): InfluencerForBudget[] {
  return rows
    .filter(
      (row) =>
        row.tier !== null &&
        row.follower_count !== null &&
        row.engagement_rate !== null
    )
    .map((row) => ({
      id: row.id as string,
      handle: row.handle as string,
      tier: row.tier as string,
      followerCount: row.follower_count as number,
      engagementRate: row.engagement_rate as number,
      estimatedCpe: (row.estimated_cpe as number | null) ?? null,
      vibeScore: (row.vibe_score as number | null) ?? null,
      categories: (row.content_categories as string[]) ?? [],
    }));
}
