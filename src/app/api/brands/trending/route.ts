import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import type { BrandProfile } from "@/lib/supabase/types";

const TRENDING_WINDOW_DAYS = 30;
const TRENDING_BRANDS_LIMIT = 10;

type TrendingBrandFields = Pick<
  BrandProfile,
  | "id"
  | "name"
  | "handle"
  | "platform"
  | "description"
  | "preferred_tiers"
  | "target_categories"
  | "brand_keywords"
  | "scores"
  | "created_at"
>;

/**
 * GET /api/brands/trending
 * Returns up to 10 newly created brands (last 30 days) ordered by creation date.
 * Brands with AI-generated scores are prioritised via null-safe ordering.
 * Requires authentication.
 */
export async function GET() {
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

    const since = new Date();
    since.setDate(since.getDate() - TRENDING_WINDOW_DAYS);
    const sinceIso = since.toISOString();

    const { data: brands, error } = await supabase
      .from("brand_profiles")
      .select(
        "id, name, handle, platform, description, preferred_tiers, target_categories, brand_keywords, scores, created_at"
      )
      .gte("created_at", sinceIso)
      .not("scores", "is", null)
      .order("created_at", { ascending: false })
      .limit(TRENDING_BRANDS_LIMIT);

    if (error) {
      console.error("[brands-trending-api] query error:", error.message);
      return NextResponse.json(
        { error: { message: "트렌딩 브랜드를 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: (brands ?? []) as TrendingBrandFields[] });
  } catch (err) {
    console.error("[brands-trending-api] error:", err);
    return NextResponse.json(
      { error: { message: "트렌딩 브랜드를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
