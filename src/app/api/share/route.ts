import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { tryCreateClient } from "@/lib/supabase/server";
import { setShareToken } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle, platform, scores, summary, analysisId } = body;

    if (!handle || !scores) {
      return NextResponse.json(
        { error: { message: "공유할 데이터가 없습니다" } },
        { status: 400 }
      );
    }

    const shareToken = randomUUID().slice(0, 8);

    // Persist share_token to the analysis row (try-or-skip)
    if (analysisId) {
      const supabase = await tryCreateClient();
      if (supabase) {
        await setShareToken(supabase, analysisId, shareToken);
      }
    }

    const { origin } = new URL(request.url);
    const shareUrl = `${origin}/share/${shareToken}`;

    return NextResponse.json({
      data: {
        shareId: shareToken,
        shareUrl,
        meta: {
          title: `${handle}의 Aesthetic Score — VibeCheck`,
          description: `@${handle} (${platform}) — Aesthetic Score: ${scores.overall}/100. ${summary ?? ""}`,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "공유 링크 생성에 실패했습니다" } },
      { status: 500 }
    );
  }
}
