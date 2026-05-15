import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { discoverByHashtag, processDiscoveryQueue } from "@/lib/discovery/discovery-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hashtag: string }> }
) {
  try {
    const { hashtag } = await params;
    const normalizedTag = decodeURIComponent(hashtag).replace("#", "").toLowerCase();

    if (!normalizedTag) {
      return NextResponse.json(
        { error: { message: "해시태그를 입력해주세요" } },
        { status: 400 }
      );
    }

    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "데이터베이스에 연결할 수 없습니다" } },
        { status: 503 }
      );
    }

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    // Find existing influencers with this hashtag
    const { data: influencers } = await supabase
      .from("influencers")
      .select("id, handle, platform, display_name, profile_image_url, vibe_score, tier, engagement_rate, follower_count, content_categories, top_hashtags, one_liner, representative_images, trend_direction, trend_magnitude, discovery_status, last_analyzed_at")
      .contains("top_hashtags", [normalizedTag])
      .order("vibe_score", { ascending: false, nullsFirst: false })
      .limit(20);

    // Trigger async background discovery for related accounts
    discoverByHashtag(supabase, normalizedTag).then(({ enqueued }) => {
      if (enqueued > 0) {
        // Process a few in background
        processDiscoveryQueue(supabase, 3).catch(() => {/* fire-and-forget */});
      }
    }).catch(() => {/* fire-and-forget */});

    return NextResponse.json({
      data: influencers ?? [],
      meta: {
        hashtag: normalizedTag,
        total: influencers?.length ?? 0,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "해시태그 인플루언서를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
