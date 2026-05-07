import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle } = body;

    if (!handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "핸들을 입력해주세요" } },
        { status: 400 }
      );
    }

    const result = await fetchInstagramFeed(handle);

    if ("error" in result) {
      const statusMap = {
        NOT_FOUND: 404,
        PRIVATE_ACCOUNT: 403,
        RATE_LIMITED: 429,
        SCRAPE_FAILED: 500,
      } as const;

      return NextResponse.json(
        { error: result.error },
        { status: statusMap[result.error.code] }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "SCRAPE_FAILED",
          message: "요청 처리에 실패했습니다",
        },
      },
      { status: 500 }
    );
  }
}
