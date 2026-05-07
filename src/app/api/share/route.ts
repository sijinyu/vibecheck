import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Creates a shareable link for an analysis result.
 * TODO: Save to Supabase and return real shareable URL.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle, platform, scores, summary } = body;

    if (!handle || !scores) {
      return NextResponse.json(
        { error: { message: "공유할 데이터가 없습니다" } },
        { status: 400 }
      );
    }

    // Generate share ID
    // TODO: Store in Supabase shared_analyses table
    const shareId = randomUUID().slice(0, 8);

    const { origin } = new URL(request.url);
    const shareUrl = `${origin}/share/${shareId}`;

    return NextResponse.json({
      data: {
        shareId,
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
