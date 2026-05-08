import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { analyzeAesthetics } from "@/lib/ai/scoring-engine";
import { tryCreateClient } from "@/lib/supabase/server";
import { upsertBrandProfile } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle, name } = body;

    if (!handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: { message: "브랜드 핸들을 입력해주세요" } },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: { message: "브랜드 이름을 입력해주세요" } },
        { status: 400 }
      );
    }

    // Step 1: Collect brand's feed data
    const feedResult = await fetchInstagramFeed(handle);

    if ("error" in feedResult) {
      return NextResponse.json(
        { error: feedResult.error },
        { status: 400 }
      );
    }

    // Step 2: Extract tone vector via same AI pipeline
    const analysis = await analyzeAesthetics(feedResult.data);

    // Step 3: Persist to DB (try-or-skip)
    const supabase = await tryCreateClient();

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await upsertBrandProfile(supabase, {
          user_id: user.id,
          name,
          handle,
          platform: "instagram",
          tone_vector: analysis.aestheticVector,
          description: analysis.summary,
        });
      }
    }

    // Step 4: Return brand profile data
    return NextResponse.json({
      data: {
        name,
        handle,
        platform: "instagram",
        toneVector: analysis.aestheticVector,
        scores: analysis.scores,
        summary: analysis.summary,
        representativeImages: analysis.representativeImages,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "브랜드 분석에 실패했습니다" } },
      { status: 500 }
    );
  }
}
