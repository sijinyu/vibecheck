import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

/**
 * GET /api/influencers
 * Search/filter influencers from DB.
 *
 * Query params:
 *  - tier: comma-separated (nano,micro,mid,macro,mega)
 *  - category: content category string
 *  - minFollowers / maxFollowers: number
 *  - minVibeScore: number
 *  - platform: instagram | tiktok
 *  - sort: vibeScore | followers | engagement | newest (default: vibeScore)
 *  - page: 0-indexed (default: 0)
 *  - limit: max 50 (default: 20)
 *  - includeStubs: boolean (default: false) — include discovery_status=stub profiles
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const tierParam = url.searchParams.get("tier");
    const category = url.searchParams.get("category");
    const minFollowers = url.searchParams.get("minFollowers");
    const maxFollowers = url.searchParams.get("maxFollowers");
    const minVibeScore = url.searchParams.get("minVibeScore");
    const platform = url.searchParams.get("platform");
    const sort = url.searchParams.get("sort") ?? "vibeScore";
    const page = Math.max(0, Number(url.searchParams.get("page") ?? "0"));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
    const includeStubs = url.searchParams.get("includeStubs") === "true";

    // Build query — base quality gate: 300+ followers
    let query = supabase
      .from("influencers")
      .select("*", { count: "exact" })
      .gte("follower_count", 300);

    // Exclude stub profiles by default unless caller opts in
    if (!includeStubs) {
      query = query.not("discovery_status", "eq", "stub");
    }

    // Filter: tier
    if (tierParam) {
      const tiers = tierParam.split(",").map((t) => t.trim()).filter(Boolean);
      if (tiers.length > 0) {
        query = query.in("tier", tiers);
      }
    }

    // Filter: category
    if (category) {
      query = query.contains("content_categories", [category]);
    }

    // Filter: follower range
    if (minFollowers) {
      query = query.gte("follower_count", Number(minFollowers));
    }
    if (maxFollowers) {
      query = query.lte("follower_count", Number(maxFollowers));
    }

    // Filter: minimum vibe score
    if (minVibeScore) {
      query = query.gte("vibe_score", Number(minVibeScore));
    }

    // Filter: platform
    if (platform && (platform === "instagram" || platform === "tiktok")) {
      query = query.eq("platform", platform);
    }

    // Sort
    const sortColumn =
      sort === "followers"
        ? "follower_count"
        : sort === "engagement"
          ? "engagement_rate"
          : sort === "newest"
            ? "last_analyzed_at"
            : "vibe_score";
    query = query.order(sortColumn, { ascending: false, nullsFirst: false });

    // Pagination
    const from = page * limit;
    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[influencers-api] query error:", error.message);
      return NextResponse.json(
        { error: { message: "인플루언서 목록을 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ?? [],
      meta: {
        total: count ?? 0,
        page,
        limit,
      },
    });
  } catch (err) {
    console.error("[influencers-api] error:", err);
    return NextResponse.json(
      { error: { message: "인플루언서 검색에 실패했습니다" } },
      { status: 500 }
    );
  }
}
