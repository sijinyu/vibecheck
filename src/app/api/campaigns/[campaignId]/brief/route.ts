import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { generateCampaignBrief } from "@/lib/ai/campaign-brief-generator";
import type { BriefBrandInput, BriefInfluencerInput } from "@/lib/ai/campaign-brief-generator";

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

    const body = await request.json().catch(() => ({}));
    const { save = false } = body;

    // Fetch campaign with brand and all campaign influencers, verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from("campaigns")
      .select(
        `
        *,
        brand:brand_profiles(*),
        campaign_influencers(
          *,
          influencer:influencers(*)
        )
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

    const brand = campaign.brand;

    const briefBrand: BriefBrandInput = {
      name: brand?.name ?? campaign.brand_id,
      description: brand?.description ?? null,
      positioning: brand?.brand_positioning ?? null,
      keywords: brand?.brand_keywords ?? [],
      categories: brand?.target_categories ?? [],
    };

    const campaignInfluencers: { influencer: Record<string, unknown> }[] =
      campaign.campaign_influencers ?? [];

    const briefInfluencers: BriefInfluencerInput[] = campaignInfluencers
      .map((ci) => {
        const inf = ci.influencer;
        if (!inf) return null;
        return {
          handle: inf.handle as string,
          displayName: (inf.display_name as string | null) ?? null,
          tier: (inf.tier as string | null) ?? null,
          followerCount: (inf.follower_count as number | null) ?? null,
          engagementRate: (inf.engagement_rate as number | null) ?? null,
          categories: (inf.content_categories as string[]) ?? [],
          estimatedCpe: (inf.estimated_cpe as number | null) ?? null,
          vibeScore: (inf.vibe_score as number | null) ?? null,
        } satisfies BriefInfluencerInput;
      })
      .filter((item): item is BriefInfluencerInput => item !== null);

    if (briefInfluencers.length === 0) {
      return NextResponse.json(
        { error: { message: "캠페인에 인플루언서가 없습니다. 먼저 인플루언서를 추가해주세요" } },
        { status: 400 }
      );
    }

    const brief = await generateCampaignBrief(
      briefBrand,
      briefInfluencers,
      campaign.budget_krw ?? null
    );

    // Optionally persist the brief summary to campaign.brief_content
    if (save) {
      const briefSummary = [
        `캠페인 목표: ${brief.objectives.join(" / ")}`,
        `총 예상 도달: ${brief.kpiTargets.totalReach.toLocaleString()}`,
        `총 예상 참여: ${brief.kpiTargets.totalEngagement.toLocaleString()}`,
        `평균 CPE: ${brief.kpiTargets.avgCpe.toLocaleString()}원`,
      ].join("\n");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("campaigns")
        .update({ brief_content: briefSummary })
        .eq("id", campaignId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ data: brief });
  } catch {
    return NextResponse.json(
      { error: { message: "캠페인 브리프 생성에 실패했습니다" } },
      { status: 500 }
    );
  }
}
