import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

const TOP_HASHTAGS_LIMIT = 30;

interface HashtagEntry {
  hashtag: string;
  count: number;
  influencerCount: number;
}

/**
 * GET /api/hashtags/trending
 * Aggregates top_hashtags arrays from all influencers in the DB and returns
 * the 30 most-used hashtags ranked by influencer count (unique influencers
 * using each tag).
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

    // Fetch all influencers that have hashtag data
    const { data: influencers, error } = await supabase
      .from("influencers")
      .select("handle, top_hashtags")
      .not("top_hashtags", "is", null);

    if (error) {
      console.error("[hashtags-trending-api] query error:", error.message);
      return NextResponse.json(
        { error: { message: "트렌딩 해시태그를 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    if (!influencers || influencers.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Aggregate: track total occurrence count and unique influencer count per hashtag
    const hashtagTotals = new Map<string, number>();
    const hashtagInfluencers = new Map<string, Set<string>>();

    for (const influencer of influencers) {
      const tags = influencer.top_hashtags as string[] | null;
      if (!Array.isArray(tags)) continue;

      // Deduplicate tags within the same influencer to avoid inflating influencerCount
      const uniqueTagsForInfluencer = new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean));

      for (const tag of uniqueTagsForInfluencer) {
        hashtagTotals.set(tag, (hashtagTotals.get(tag) ?? 0) + 1);

        const influencerSet = hashtagInfluencers.get(tag) ?? new Set<string>();
        influencerSet.add(influencer.handle);
        hashtagInfluencers.set(tag, influencerSet);
      }
    }

    // Build result sorted by influencer count desc, then total count as tiebreaker
    const trending: HashtagEntry[] = Array.from(hashtagTotals.entries())
      .map(([hashtag, count]) => ({
        hashtag,
        count,
        influencerCount: hashtagInfluencers.get(hashtag)?.size ?? 0,
      }))
      .sort((a, b) => {
        const influencerDiff = b.influencerCount - a.influencerCount;
        if (influencerDiff !== 0) return influencerDiff;
        return b.count - a.count;
      })
      .slice(0, TOP_HASHTAGS_LIMIT);

    return NextResponse.json({ data: trending });
  } catch (err) {
    console.error("[hashtags-trending-api] error:", err);
    return NextResponse.json(
      { error: { message: "트렌딩 해시태그를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
