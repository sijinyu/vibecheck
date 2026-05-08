import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { saveInfluencer, unsaveInfluencer } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
    const { influencerId } = await request.json();

    if (!influencerId || typeof influencerId !== "string") {
      return NextResponse.json(
        { error: { message: "influencerId가 필요합니다" } },
        { status: 400 }
      );
    }

    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "서비스를 사용할 수 없습니다" } },
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

    const ok = await saveInfluencer(supabase, user.id, influencerId);

    if (!ok) {
      return NextResponse.json(
        { error: { message: "저장에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { saved: true } });
  } catch {
    return NextResponse.json(
      { error: { message: "저장에 실패했습니다" } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { influencerId } = await request.json();

    if (!influencerId || typeof influencerId !== "string") {
      return NextResponse.json(
        { error: { message: "influencerId가 필요합니다" } },
        { status: 400 }
      );
    }

    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "서비스를 사용할 수 없습니다" } },
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

    const ok = await unsaveInfluencer(supabase, user.id, influencerId);

    if (!ok) {
      return NextResponse.json(
        { error: { message: "삭제에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { saved: false } });
  } catch {
    return NextResponse.json(
      { error: { message: "삭제에 실패했습니다" } },
      { status: 500 }
    );
  }
}
