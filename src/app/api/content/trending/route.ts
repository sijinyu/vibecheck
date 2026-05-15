import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

const INFLUENCER_POOL_LIMIT = 50;
const TOP_POSTS_LIMIT = 20;

interface RawPostPerformance {
  imageUrl?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  caption?: string;
  hashtags?: string[];
  timestamp?: string;
  engagementRate?: number;
  performanceIndex?: number;
  [key: string]: unknown;
}

interface TrendingPost {
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  caption: string | null;
  hashtags: string[];
  timestamp: string | null;
  engagementRate: number;
  performanceIndex: number;
  influencerHandle: string;
  influencerTier: string | null;
  vibeScore: number | null;
}

/**
 * GET /api/content/trending
 * Aggregates top-performing posts from the 50 highest vibe_score influencers
 * in the DB, then returns the top 20 by engagementRate.
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

    // Fetch top influencers that have post_performances data
    const { data: influencers, error } = await supabase
      .from("influencers")
      .select("handle, tier, vibe_score, post_performances")
      .not("post_performances", "is", null)
      .not("vibe_score", "is", null)
      .order("vibe_score", { ascending: false, nullsFirst: false })
      .limit(INFLUENCER_POOL_LIMIT);

    if (error) {
      console.error("[content-trending-api] query error:", error.message);
      return NextResponse.json(
        { error: { message: "트렌딩 콘텐츠를 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    if (!influencers || influencers.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Extract and flatten all posts across influencers
    const allPosts: TrendingPost[] = [];

    for (const influencer of influencers) {
      const performances = influencer.post_performances as RawPostPerformance[] | null;
      if (!Array.isArray(performances)) continue;

      for (const post of performances) {
        allPosts.push({
          imageUrl: typeof post.imageUrl === "string" ? post.imageUrl : null,
          likeCount: typeof post.likeCount === "number" ? post.likeCount : 0,
          commentCount: typeof post.commentCount === "number" ? post.commentCount : 0,
          shareCount: typeof post.shareCount === "number" ? post.shareCount : 0,
          caption: typeof post.caption === "string" ? post.caption : null,
          hashtags: Array.isArray(post.hashtags) ? (post.hashtags as string[]) : [],
          timestamp: typeof post.timestamp === "string" ? post.timestamp : null,
          engagementRate: typeof post.engagementRate === "number" ? post.engagementRate : 0,
          performanceIndex: typeof post.performanceIndex === "number" ? post.performanceIndex : 0,
          influencerHandle: influencer.handle,
          influencerTier: influencer.tier ?? null,
          vibeScore: influencer.vibe_score ?? null,
        });
      }
    }

    // Sort by engagementRate descending, take top 20
    const trendingPosts = allPosts
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, TOP_POSTS_LIMIT);

    return NextResponse.json({ data: trendingPosts });
  } catch (err) {
    console.error("[content-trending-api] error:", err);
    return NextResponse.json(
      { error: { message: "트렌딩 콘텐츠를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
