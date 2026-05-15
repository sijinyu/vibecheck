import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ campaignId: string }> };

async function verifyCampaignOwnership(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  campaignId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  return !error && !!data;
}

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

    const owned = await verifyCampaignOwnership(supabase, campaignId, user.id);
    if (!owned) {
      return NextResponse.json(
        { error: { message: "캠페인을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("campaign_influencers")
      .select(
        `
        *,
        influencer:influencers(*)
      `
      )
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[campaign influencers GET] DB error:", error.message);
      return NextResponse.json(
        { error: { message: "인플루언서 목록을 불러올 수 없습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: { message: "인플루언서 목록을 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
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

    const owned = await verifyCampaignOwnership(supabase, campaignId, user.id);
    if (!owned) {
      return NextResponse.json(
        { error: { message: "캠페인을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { influencerId, notes } = body;

    if (!influencerId || typeof influencerId !== "string") {
      return NextResponse.json(
        { error: { message: "influencerId가 필요합니다" } },
        { status: 400 }
      );
    }

    // Verify influencer exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: influencer, error: influencerError } = await (supabase as any)
      .from("influencers")
      .select("id")
      .eq("id", influencerId)
      .single();

    if (influencerError || !influencer) {
      return NextResponse.json(
        { error: { message: "인플루언서를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("campaign_influencers")
      .insert({
        campaign_id: campaignId,
        influencer_id: influencerId,
        status: "shortlisted",
        notes: notes ?? null,
        status_updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        influencer:influencers(*)
      `
      )
      .single();

    if (error) {
      // Duplicate entry — influencer already in campaign
      if (error.code === "23505") {
        return NextResponse.json(
          { error: { message: "이미 캠페인에 추가된 인플루언서입니다" } },
          { status: 409 }
        );
      }
      console.error("[campaign influencers POST] DB error:", error.message);
      return NextResponse.json(
        { error: { message: "인플루언서 추가에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { message: "인플루언서 추가에 실패했습니다" } },
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

    const owned = await verifyCampaignOwnership(supabase, campaignId, user.id);
    if (!owned) {
      return NextResponse.json(
        { error: { message: "캠페인을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      influencerId,
      status,
      outreach_message,
      collaboration_proposal,
      agreed_fee_krw,
      actual_reach,
      actual_engagement,
      notes,
    } = body;

    if (!influencerId || typeof influencerId !== "string") {
      return NextResponse.json(
        { error: { message: "influencerId가 필요합니다" } },
        { status: 400 }
      );
    }

    // Fetch current record to detect status change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current, error: fetchError } = await (supabase as any)
      .from("campaign_influencers")
      .select("status")
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { error: { message: "캠페인 인플루언서를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      updates.status = status;
      if (status !== current.status) {
        updates.status_updated_at = new Date().toISOString();
      }
    }
    if (outreach_message !== undefined) updates.outreach_message = outreach_message;
    if (collaboration_proposal !== undefined) updates.collaboration_proposal = collaboration_proposal;
    if (agreed_fee_krw !== undefined) updates.agreed_fee_krw = agreed_fee_krw;
    if (actual_reach !== undefined) updates.actual_reach = actual_reach;
    if (actual_engagement !== undefined) updates.actual_engagement = actual_engagement;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { message: "변경할 내용이 없습니다" } },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("campaign_influencers")
      .update(updates)
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId)
      .select(
        `
        *,
        influencer:influencers(*)
      `
      )
      .single();

    if (error) {
      console.error("[campaign influencers PATCH] DB error:", error.message);
      return NextResponse.json(
        { error: { message: "인플루언서 업데이트에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { message: "인플루언서 업데이트에 실패했습니다" } },
      { status: 500 }
    );
  }
}
