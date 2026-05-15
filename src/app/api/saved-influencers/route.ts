import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { saveInfluencer, unsaveInfluencer } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { influencerId, influencer_handle, influencer_platform, brand_id } = body;

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

    // Resolve influencerId from handle if needed
    let resolvedId = influencerId;
    if (!resolvedId && influencer_handle) {
      const { data: inf } = await supabase
        .from("influencers")
        .select("id")
        .eq("handle", influencer_handle.replace("@", "").trim().toLowerCase())
        .eq("platform", influencer_platform ?? "instagram")
        .limit(1)
        .maybeSingle();

      if (!inf) {
        return NextResponse.json(
          { error: { message: "해당 인플루언서를 찾을 수 없습니다. 먼저 분석을 실행해주세요." } },
          { status: 404 }
        );
      }
      resolvedId = inf.id;
    }

    if (!resolvedId || typeof resolvedId !== "string") {
      return NextResponse.json(
        { error: { message: "influencerId 또는 influencer_handle이 필요합니다" } },
        { status: 400 }
      );
    }

    const ok = await saveInfluencer(supabase, user.id, resolvedId, brand_id);

    if (!ok) {
      return NextResponse.json(
        { error: { message: "저장에 실패했습니다 (이미 저장되었을 수 있습니다)" } },
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
