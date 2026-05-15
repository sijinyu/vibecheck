import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { generateOutreach } from "@/lib/ai/outreach-generator";

export async function POST(request: Request) {
  try {
    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "데이터베이스에 연결할 수 없습니다" } },
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
    const { brandId, influencerHandle, platform = "instagram" } = body;

    if (!brandId || !influencerHandle) {
      return NextResponse.json(
        { error: { message: "brandId와 influencerHandle이 필요합니다" } },
        { status: 400 }
      );
    }

    // Fetch brand (verify ownership)
    const { data: brand } = await supabase
      .from("brand_profiles")
      .select()
      .eq("id", brandId)
      .eq("user_id", user.id)
      .single();

    if (!brand) {
      return NextResponse.json(
        { error: { message: "브랜드를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // Fetch influencer
    const { data: influencer } = await supabase
      .from("influencers")
      .select()
      .eq("handle", influencerHandle)
      .eq("platform", platform)
      .single();

    if (!influencer) {
      return NextResponse.json(
        { error: { message: "인플루언서를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    // Generate outreach message
    const result = await generateOutreach({
      brand: {
        name: brand.name,
        description: brand.description,
        positioning: brand.brand_positioning,
        keywords: brand.brand_keywords ?? [],
        categories: brand.target_categories ?? [],
      },
      influencer: {
        handle: influencer.handle,
        displayName: influencer.display_name,
        bio: influencer.bio,
        tier: influencer.tier,
        followerCount: influencer.follower_count,
        engagementRate: influencer.engagement_rate,
        categories: influencer.content_categories ?? [],
        topHashtags: influencer.top_hashtags ?? [],
        vibeScore: influencer.vibe_score,
        oneLiner: influencer.one_liner,
        aestheticDescription: influencer.aesthetic_description,
      },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[outreach-generate] error:", err);
    return NextResponse.json(
      { error: { message: "아웃리치 생성에 실패했습니다" } },
      { status: 500 }
    );
  }
}
