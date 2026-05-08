import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { fetchTikTokFeed } from "@/lib/adapters/tiktok";
import { analyzeAesthetics } from "@/lib/ai/scoring-engine";
import { tryCreateClient } from "@/lib/supabase/server";
import { upsertInfluencer, insertAnalysis } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle, platform = "instagram" } = body;

    if (!handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "핸들을 입력해주세요" } },
        { status: 400 }
      );
    }

    // Step 1: Collect feed data
    const feedResult =
      platform === "tiktok"
        ? await fetchTikTokFeed(handle)
        : await fetchInstagramFeed(handle);

    if ("error" in feedResult) {
      return NextResponse.json(
        { error: feedResult.error },
        { status: 400 }
      );
    }

    // Step 2: AI Analysis
    const analysis = await analyzeAesthetics(feedResult.data);

    // Step 3: Persist to DB (try-or-skip)
    let analysisId: string | null = null;
    const supabase = await tryCreateClient();

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Upsert influencer catalog entry
        const influencer = await upsertInfluencer(supabase, {
          handle: handle.trim(),
          platform,
          display_name: feedResult.data.profile.displayName ?? null,
          profile_image_url: feedResult.data.profile.profileImageUrl ?? null,
          bio: feedResult.data.profile.bio ?? null,
          follower_count: feedResult.data.profile.followerCount ?? null,
          aesthetic_vector: analysis.aestheticVector,
          aesthetic_score: analysis.scores.overall,
          color_score: analysis.scores.color,
          composition_score: analysis.scores.composition,
          tone_consistency_score: analysis.scores.toneConsistency,
          trend_score: analysis.scores.trend,
          category: null,
          representative_images: analysis.representativeImages,
        });

        // Insert analysis history record
        const analysisRow = await insertAnalysis(supabase, {
          user_id: user.id,
          influencer_id: influencer?.id ?? null,
          handle: handle.trim(),
          platform,
          aesthetic_score: analysis.scores.overall,
          color_score: analysis.scores.color,
          composition_score: analysis.scores.composition,
          tone_consistency_score: analysis.scores.toneConsistency,
          trend_score: analysis.scores.trend,
          brand_fit_score: analysis.scores.styleOriginality,
          representative_images: analysis.representativeImages,
          raw_ai_response: analysis.scores as unknown as Record<string, unknown>,
          summary: analysis.summary,
        });

        analysisId = analysisRow?.id ?? null;
      }
    }

    // Step 4: Return result
    return NextResponse.json({
      data: {
        profile: feedResult.data.profile,
        scores: analysis.scores,
        representativeImages: analysis.representativeImages,
        summary: analysis.summary,
        analysisId,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "ANALYSIS_FAILED",
          message: "분석에 실패했습니다. 잠시 후 다시 시도해주세요.",
        },
      },
      { status: 500 }
    );
  }
}
