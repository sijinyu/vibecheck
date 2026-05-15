import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

/**
 * GET /api/influencers/category-counts
 * Returns per-category influencer counts for the category browse UI.
 * Only counts influencers with follower_count >= 300 (quality gate).
 */
export async function GET() {
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

  const { data, error } = await supabase
    .from("influencers")
    .select("content_categories")
    .gte("follower_count", 300)
    .not("discovery_status", "eq", "stub");

  if (error) {
    console.error("[category-counts] query error:", error.message);
    return NextResponse.json(
      { error: { message: "카테고리 데이터를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    for (const cat of row.content_categories ?? []) {
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
  }

  return NextResponse.json({ data: counts });
}
