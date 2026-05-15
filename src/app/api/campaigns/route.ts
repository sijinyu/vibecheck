import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("campaigns")
      .select(
        `
        *,
        campaign_influencers(count)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[campaigns GET] DB error:", error.message);
      return NextResponse.json(
        { error: { message: "캠페인 목록을 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: { message: "캠페인 목록을 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const {
      brandId,
      name,
      // Accept both camelCase (frontend) and snake_case
      budget, budget_krw,
      brief, brief_content,
      targetReach, targetEngagement, target_kpi,
      startDate, start_date,
      endDate, end_date,
    } = body;

    const finalBudget = budget_krw ?? (budget ? Number(budget) * 10000 : null);
    const finalBrief = brief_content ?? brief ?? null;
    const finalStartDate = start_date ?? startDate ?? null;
    const finalEndDate = end_date ?? endDate ?? null;
    const finalTargetKpi = target_kpi ?? {
      ...(targetReach ? { reach: Number(targetReach) } : {}),
      ...(targetEngagement ? { engagement: Number(targetEngagement) } : {}),
    };

    if (!brandId || typeof brandId !== "string") {
      return NextResponse.json(
        { error: { message: "brandId가 필요합니다" } },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: { message: "캠페인 이름을 입력해주세요" } },
        { status: 400 }
      );
    }

    // Verify the authenticated user owns this brand
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: brand, error: brandError } = await (supabase as any)
      .from("brand_profiles")
      .select("id")
      .eq("id", brandId)
      .eq("user_id", user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: { message: "브랜드를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("campaigns")
      .insert({
        brand_id: brandId,
        user_id: user.id,
        name: name.trim(),
        status: "draft",
        budget_krw: finalBudget,
        brief_content: finalBrief,
        target_kpi: finalTargetKpi,
        actual_kpi: {},
        start_date: finalStartDate,
        end_date: finalEndDate,
      })
      .select()
      .single();

    if (error) {
      console.error("[campaigns POST] DB error:", error.message);
      return NextResponse.json(
        { error: { message: "캠페인 생성에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { message: "캠페인 생성에 실패했습니다" } },
      { status: 500 }
    );
  }
}
