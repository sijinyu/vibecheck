import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { fetchTikTokFeed } from "@/lib/adapters/tiktok";
import { analyzeAesthetics } from "@/lib/ai/scoring-engine";
import { calculateVibeScore } from "@/lib/ai/vibe-score-engine";
import {
  compareInfluencers,
  type CompareInfluencerInput,
} from "@/lib/ai/compare-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handles, platform = "instagram" } = body;

    if (
      !Array.isArray(handles) ||
      handles.length < 2 ||
      handles.length > 3
    ) {
      return NextResponse.json(
        { error: { message: "2~3개의 핸들을 입력해주세요" } },
        { status: 400 }
      );
    }

    // Step 1: Fetch and analyze all handles in parallel
    const results = await Promise.all(
      handles.map(async (handle: string) => {
        const cleanHandle = handle.trim();
        if (!cleanHandle) return null;

        const feedResult =
          platform === "tiktok"
            ? await fetchTikTokFeed(cleanHandle)
            : await fetchInstagramFeed(cleanHandle);

        if ("error" in feedResult) return null;

        const analysis = await analyzeAesthetics(feedResult.data);
        const vibeResult = calculateVibeScore(feedResult.data, analysis.scores);

        return {
          profile: feedResult.data.profile,
          scores: analysis.scores,
          vibeScore: vibeResult,
          summary: analysis.summary,
          representativeImages: analysis.representativeImages,
        };
      })
    );

    // Filter out failed analyses
    const validResults = results.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );

    if (validResults.length < 2) {
      return NextResponse.json(
        { error: { message: "최소 2명 이상의 분석 결과가 필요합니다" } },
        { status: 400 }
      );
    }

    // Step 2: Run comparison AI
    const compareInputs: CompareInfluencerInput[] = validResults.map((r) => ({
      handle: r.profile.handle,
      platform: r.profile.platform,
      scores: r.scores,
      summary: r.summary,
    }));

    const comparison = await compareInfluencers(compareInputs);

    // Step 3: Return combined results
    return NextResponse.json({
      data: {
        analyses: validResults,
        comparison,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "비교 분석에 실패했습니다. 잠시 후 다시 시도해주세요." } },
      { status: 500 }
    );
  }
}
