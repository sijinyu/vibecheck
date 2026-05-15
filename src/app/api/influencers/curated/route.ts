import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

// Platform ER benchmarks (%) per tier — must stay in sync with vibe-score-engine.ts
const ER_BENCHMARKS: Record<string, Record<string, number>> = {
  instagram: {
    nano: 4.5,
    micro: 2.8,
    mid: 1.8,
    macro: 1.3,
    mega: 0.8,
  },
  tiktok: {
    nano: 10,
    micro: 6,
    mid: 4,
    macro: 2.5,
    mega: 1.5,
  },
};

const HIDDEN_GEMS_MIN_VIBE_SCORE = 70;
const HIDDEN_GEMS_ER_MULTIPLIER = 1.5;
const RISING_STARS_MIN_TREND_MAGNITUDE = 20;
const ENGAGEMENT_LEADERS_LIMIT = 20;
const CURATED_SELECT_FIELDS = [
  "id",
  "handle",
  "platform",
  "display_name",
  "profile_image_url",
  "vibe_score",
  "engagement_rate",
  "tier",
  "content_categories",
  "one_liner",
  "representative_images",
  "trend_direction",
  "trend_magnitude",
  "follower_count",
  "content_topics",
  "top_hashtags",
].join(", ");

type CuratedType = "hidden-gems" | "rising-stars" | "engagement-leaders" | "category-top";

const VALID_TYPES = new Set<CuratedType>([
  "hidden-gems",
  "rising-stars",
  "engagement-leaders",
  "category-top",
]);

function isCuratedType(value: string | null): value is CuratedType {
  return value !== null && VALID_TYPES.has(value as CuratedType);
}

/**
 * GET /api/influencers/curated
 * Returns a curated list of influencers by type:
 *   hidden-gems        — nano/micro with vibe_score ≥ 70 and ER > benchmark × 1.5
 *   rising-stars       — trend_direction=rising with trend_magnitude > 20
 *   engagement-leaders — top 20 by engagement_score
 *   category-top       — best vibe_score representative per content category
 *
 * Query param: type (required)
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

    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (!isCuratedType(type)) {
      return NextResponse.json(
        {
          error: {
            message:
              "type 파라미터가 필요합니다. 허용 값: hidden-gems | rising-stars | engagement-leaders | category-top",
          },
        },
        { status: 400 }
      );
    }

    switch (type) {
      case "hidden-gems":
        return handleHiddenGems(supabase);
      case "rising-stars":
        return handleRisingStars(supabase);
      case "engagement-leaders":
        return handleEngagementLeaders(supabase);
      case "category-top":
        return handleCategoryTop(supabase);
    }
  } catch (err) {
    console.error("[influencers-curated-api] error:", err);
    return NextResponse.json(
      { error: { message: "큐레이션 인플루언서를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleHiddenGems(supabase: any) {
  // Fetch nano + micro influencers with vibe_score >= 70 that have an engagement_rate
  const { data: candidates, error } = await supabase
    .from("influencers")
    .select(CURATED_SELECT_FIELDS + ", engagement_score")
    .in("tier", ["nano", "micro"])
    .gte("vibe_score", HIDDEN_GEMS_MIN_VIBE_SCORE)
    .not("engagement_rate", "is", null)
    .not("platform", "is", null)
    .order("vibe_score", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[influencers-curated-api] hidden-gems query error:", error.message);
    return NextResponse.json(
      { error: { message: "히든 젬 인플루언서를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Client-side filter: ER > platform×tier benchmark × 1.5
  const filtered = candidates.filter(
    (inf: { platform: string; tier: string; engagement_rate: number }) => {
      const benchmark =
        ER_BENCHMARKS[inf.platform]?.[inf.tier] ?? ER_BENCHMARKS["instagram"]["micro"];
      return inf.engagement_rate > benchmark * HIDDEN_GEMS_ER_MULTIPLIER;
    }
  );

  return NextResponse.json({ data: filtered });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRisingStars(supabase: any) {
  const { data, error } = await supabase
    .from("influencers")
    .select(CURATED_SELECT_FIELDS)
    .eq("trend_direction", "rising")
    .gt("trend_magnitude", RISING_STARS_MIN_TREND_MAGNITUDE)
    .order("trend_magnitude", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[influencers-curated-api] rising-stars query error:", error.message);
    return NextResponse.json(
      { error: { message: "라이징 스타 인플루언서를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEngagementLeaders(supabase: any) {
  const { data, error } = await supabase
    .from("influencers")
    .select(CURATED_SELECT_FIELDS)
    .not("engagement_score", "is", null)
    .order("engagement_score", { ascending: false, nullsFirst: false })
    .limit(ENGAGEMENT_LEADERS_LIMIT);

  if (error) {
    console.error("[influencers-curated-api] engagement-leaders query error:", error.message);
    return NextResponse.json(
      { error: { message: "참여도 리더 인플루언서를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCategoryTop(supabase: any) {
  // Fetch all influencers that have a primary category and a vibe_score
  const { data: allInfluencers, error } = await supabase
    .from("influencers")
    .select(CURATED_SELECT_FIELDS)
    .not("category", "is", null)
    .not("vibe_score", "is", null)
    .order("vibe_score", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[influencers-curated-api] category-top query error:", error.message);
    return NextResponse.json(
      { error: { message: "카테고리 TOP 인플루언서를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }

  if (!allInfluencers || allInfluencers.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Pick the top vibe_score influencer per category (already sorted desc)
  const seenCategories = new Set<string>();
  const categoryTop = allInfluencers.filter(
    (inf: { category: string | null }) => {
      const cat = inf.category;
      if (!cat || seenCategories.has(cat)) return false;
      seenCategories.add(cat);
      return true;
    }
  );

  return NextResponse.json({ data: categoryTop });
}
