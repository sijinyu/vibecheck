import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tryCreateClient } from "@/lib/supabase/server";

const BRAND_COACHING_PROMPT = `You are a world-class brand marketing strategist specializing in influencer marketing.
Given a brand's analytics data, provide comprehensive brand coaching advice.

**Brand Data:**
- Name: {brandName}
- Handle: @{handle}
- Positioning: {positioning}
- Keywords: {keywords}
- Competitors: {competitors}
- Aesthetic Score: {aestheticScore}/100
- Preferred Tiers: {preferredTiers}
- Target Categories: {targetCategories}
- Content Strategy: {contentStrategy}
- Ideal Influencer Profile: {idealProfile}

**Generate coaching in Korean with this exact JSON format:**
{
  "overallAssessment": "2-3 sentence brand assessment — be specific and opinionated",
  "brandStrengths": [
    { "area": "strength name", "detail": "why and how to leverage" }
  ],
  "improvementAreas": [
    { "area": "area to improve", "detail": "specific actionable advice" }
  ],
  "influencerStrategy": {
    "idealCollabType": "어떤 유형의 협업이 가장 효과적인지 (예: 시딩, 앰배서더, 캠페인)",
    "campaignIdeas": ["campaign idea 1", "campaign idea 2", "campaign idea 3"],
    "budgetAllocation": "마이크로 vs 매크로 인플루언서 예산 배분 전략",
    "timingAdvice": "시즈널/이벤트 기반 협업 타이밍 제안"
  },
  "contentRecommendations": {
    "feedOptimization": "피드 최적화 제안",
    "contentCalendar": "월간 콘텐츠 캘린더 제안",
    "hashtagStrategy": "해시태그 전략 개선안",
    "storytellingAdvice": "스토리텔링 방식 개선안"
  },
  "competitivePositioning": "경쟁 브랜드 대비 차별화 전략 (2-3 sentences)",
  "growthRoadmap": {
    "shortTerm": "1개월 목표와 전략",
    "midTerm": "3개월 목표와 전략",
    "longTerm": "6개월 비전"
  }
}

Return ONLY the JSON object, no markdown fences or extra text.`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;

    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "데이터베이스에 연결할 수 없습니다" } },
        { status: 503 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

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

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "AI 서비스가 설정되지 않았습니다" } },
        { status: 503 }
      );
    }

    const contentStrategy = brand.content_strategy && typeof brand.content_strategy === "object"
      ? JSON.stringify(brand.content_strategy)
      : "N/A";
    const idealProfile = brand.ideal_influencer_profile && typeof brand.ideal_influencer_profile === "object"
      ? JSON.stringify(brand.ideal_influencer_profile)
      : "N/A";

    const prompt = BRAND_COACHING_PROMPT
      .replace("{brandName}", brand.name)
      .replace("{handle}", brand.handle ?? "N/A")
      .replace("{positioning}", brand.brand_positioning ?? "분석 전")
      .replace("{keywords}", (brand.brand_keywords ?? []).join(", ") || "N/A")
      .replace("{competitors}", (brand.competitor_brands ?? []).join(", ") || "N/A")
      .replace("{aestheticScore}", String(brand.scores?.overall ?? "N/A"))
      .replace("{preferredTiers}", (brand.preferred_tiers ?? []).join(", ") || "전체")
      .replace("{targetCategories}", (brand.target_categories ?? []).join(", ") || "전체")
      .replace("{contentStrategy}", contentStrategy)
      .replace("{idealProfile}", idealProfile);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: { message: "AI 응답을 파싱할 수 없습니다" } },
        { status: 500 }
      );
    }

    const coaching = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: coaching });
  } catch (err) {
    console.error("[brand-coaching-api] error:", err);
    return NextResponse.json(
      { error: { message: "브랜드 코칭 데이터를 생성할 수 없습니다" } },
      { status: 500 }
    );
  }
}
