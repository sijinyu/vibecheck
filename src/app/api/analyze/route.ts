import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { fetchTikTokFeed } from "@/lib/adapters/tiktok";
import { analyzeAesthetics } from "@/lib/ai/scoring-engine";

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

    // Step 3: Return combined result
    // TODO: Save to Supabase (analyses + influencers tables)
    return NextResponse.json({
      data: {
        profile: feedResult.data.profile,
        scores: analysis.scores,
        representativeImages: analysis.representativeImages,
        summary: analysis.summary,
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
