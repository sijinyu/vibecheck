import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const cleanHandle = handle.replace("@", "").trim().toLowerCase();

    if (!cleanHandle) {
      return NextResponse.json(
        { error: { message: "핸들을 입력해주세요" } },
        { status: 400 }
      );
    }

    const supabase = await tryCreateClient();

    if (!supabase) {
      return NextResponse.json(
        { error: { message: "데이터베이스에 연결할 수 없습니다" } },
        { status: 503 }
      );
    }

    // Look up influencer in DB
    const { data: influencer, error } = await supabase
      .from("influencers")
      .select()
      .eq("handle", cleanHandle)
      .order("last_analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[influencer-api] query error:", error.message);
      return NextResponse.json(
        { error: { message: "조회에 실패했습니다" } },
        { status: 500 }
      );
    }

    if (!influencer) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `@${cleanHandle}에 대한 분석 데이터가 없습니다. 먼저 분석을 실행해주세요.`,
          },
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ data: influencer });
    // Cache for 5 minutes, stale-while-revalidate for 1 hour
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600"
    );
    return response;
  } catch {
    return NextResponse.json(
      { error: { message: "인플루언서 정보를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
