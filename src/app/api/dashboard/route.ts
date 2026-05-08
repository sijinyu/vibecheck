import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import {
  getUserAnalyses,
  getUserSavedInfluencers,
} from "@/lib/supabase/queries";

export async function GET() {
  try {
    const supabase = await tryCreateClient();

    if (!supabase) {
      return NextResponse.json({ data: { analyses: [], saved: [] } });
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

    const [analyses, saved] = await Promise.all([
      getUserAnalyses(supabase, user.id),
      getUserSavedInfluencers(supabase, user.id),
    ]);

    return NextResponse.json({
      data: {
        analyses: analyses.map((a) => ({
          id: a.id,
          handle: a.handle,
          platform: a.platform,
          aestheticScore: a.aesthetic_score,
          colorScore: a.color_score,
          compositionScore: a.composition_score,
          toneConsistencyScore: a.tone_consistency_score,
          trendScore: a.trend_score,
          summary: a.summary,
          analyzedAt: a.created_at,
        })),
        saved: saved.map((s) => ({
          influencerId: s.influencer.id,
          handle: s.influencer.handle,
          platform: s.influencer.platform,
          displayName: s.influencer.display_name,
          aestheticScore: Number(s.influencer.aesthetic_score ?? 0),
          category: s.influencer.category,
          savedAt: s.saved_at,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "대시보드 데이터를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
