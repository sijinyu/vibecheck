import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { campaignId } = await params;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("campaigns")
      .select(
        `
        *,
        campaign_influencers(
          *,
          influencer:influencers(*)
        )
      `
      )
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { message: "캠페인을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { message: "캠페인 정보를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { campaignId } = await params;

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

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: { message: "캠페인을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      status,
      budget_krw,
      brief_content,
      target_kpi,
      actual_kpi,
      start_date,
      end_date,
    } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (status !== undefined) updates.status = status;
    if (budget_krw !== undefined) updates.budget_krw = budget_krw;
    if (brief_content !== undefined) updates.brief_content = brief_content;
    if (target_kpi !== undefined) updates.target_kpi = target_kpi;
    if (actual_kpi !== undefined) updates.actual_kpi = actual_kpi;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { message: "변경할 내용이 없습니다" } },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("campaigns")
      .update(updates)
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("[campaigns PATCH] DB error:", error.message);
      return NextResponse.json(
        { error: { message: "캠페인 업데이트에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { message: "캠페인 업데이트에 실패했습니다" } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { campaignId } = await params;

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

    // Verify ownership before deletion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (supabase as any)
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: { message: "캠페인을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("user_id", user.id);

    if (error) {
      console.error("[campaigns DELETE] DB error:", error.message);
      return NextResponse.json(
        { error: { message: "캠페인 삭제에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json(
      { error: { message: "캠페인 삭제에 실패했습니다" } },
      { status: 500 }
    );
  }
}
