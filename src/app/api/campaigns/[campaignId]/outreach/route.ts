import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { generateOutreach } from "@/lib/ai/outreach-generator";
import type { OutreachInput } from "@/lib/ai/outreach-generator";

type Params = { params: Promise<{ campaignId: string }> };

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

    const body = await request.json();
    const { influencerId, save = false } = body;

    if (!influencerId || typeof influencerId !== "string") {
      return NextResponse.json(
        { error: { message: "influencerId가 필요합니다" } },
        { status: 400 }
      );
    }

    // Fetch campaign with brand, verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from("campaigns")
      .select(
        `
        *,
        brand:brand_profiles(*)
      `
      )
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: { message: "캠페인을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // Fetch influencer data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: influencer, error: influencerError } = await (supabase as any)
      .from("influencers")
      .select("*")
      .eq("id", influencerId)
      .single();

    if (influencerError || !influencer) {
      return NextResponse.json(
        { error: { message: "인플루언서를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const brand = campaign.brand;

    const outreachInput: OutreachInput = {
      brand: {
        name: brand?.name ?? campaign.brand_id,
        description: brand?.description ?? null,
        positioning: brand?.brand_positioning ?? null,
        keywords: brand?.brand_keywords ?? [],
        categories: brand?.target_categories ?? [],
      },
      influencer: {
        handle: influencer.handle,
        displayName: influencer.display_name ?? null,
        bio: influencer.bio ?? null,
        tier: influencer.tier ?? null,
        followerCount: influencer.follower_count ?? null,
        engagementRate: influencer.engagement_rate ?? null,
        categories: influencer.content_categories ?? [],
        topHashtags: influencer.top_hashtags ?? [],
        vibeScore: influencer.vibe_score ?? null,
        oneLiner: influencer.one_liner ?? null,
        aestheticDescription: influencer.aesthetic_description ?? null,
      },
      campaign: {
        name: campaign.name,
        budget: campaign.budget_krw ?? null,
        brief: campaign.brief_content ?? null,
      },
    };

    const outreachResult = await generateOutreach(outreachInput);

    // Optionally persist the outreach message to campaign_influencer record
    if (save) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("campaign_influencers")
        .update({ outreach_message: outreachResult.dmTemplate })
        .eq("campaign_id", campaignId)
        .eq("influencer_id", influencerId);
    }

    return NextResponse.json({ data: outreachResult });
  } catch {
    return NextResponse.json(
      { error: { message: "아웃리치 생성에 실패했습니다" } },
      { status: 500 }
    );
  }
}
