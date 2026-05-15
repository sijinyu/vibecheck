import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tryCreateClient } from "@/lib/supabase/server";

const COACHING_PROMPT = `You are a world-class social media branding consultant. Given an influencer's analytics data, provide personalized, actionable coaching advice.

**Influencer Data:**
- Handle: @{handle}
- Platform: {platform}
- Tier: {tier} ({followerCount} followers)
- VibeScore: {vibeScore}/100
- Aesthetic Score: {aestheticScore}/100
- Engagement Score: {engagementScore}/100
- Consistency Score: {consistencyScore}/100
- Growth Potential Score: {growthScore}/100
- Authenticity Score: {authenticityScore}/100
- Engagement Rate: {engagementRate}%
- Avg Likes/Post: {avgLikes}
- Avg Comments/Post: {avgComments}
- Posting Frequency: every {postingDays} days
- Top Hashtags: {hashtags}
- Content Categories: {categories}

**Generate coaching advice in Korean with this exact JSON format:**
{
  "overallAssessment": "2-3 sentence overall assessment of their personal brand",
  "strengthAreas": [
    { "area": "strength area name", "detail": "why this is a strength and how to leverage it" }
  ],
  "improvementPlan": [
    {
      "priority": 1,
      "area": "area to improve",
      "currentScore": 65,
      "targetScore": 80,
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    }
  ],
  "contentStrategy": {
    "postingSchedule": "recommended posting schedule",
    "contentMix": "recommended content type ratio",
    "hashtagStrategy": "hashtag optimization advice",
    "engagementTips": ["tip 1", "tip 2", "tip 3"]
  },
  "growthRoadmap": {
    "shortTerm": "1-month goal and strategy",
    "midTerm": "3-month goal and strategy",
    "longTerm": "6-month vision"
  },
  "brandPositioning": "advice on unique brand positioning and differentiation"
}

Return ONLY the JSON object, no markdown fences or extra text.`;

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

    // Auth + DB check
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

    const { data: influencer } = await supabase
      .from("influencers")
      .select()
      .eq("handle", cleanHandle)
      .order("last_analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!influencer) {
      return NextResponse.json(
        { error: { message: `@${cleanHandle} 분석 데이터가 없습니다` } },
        { status: 404 }
      );
    }

    // Build prompt with influencer data
    const prompt = COACHING_PROMPT
      .replace("{handle}", cleanHandle)
      .replace("{platform}", influencer.platform ?? "instagram")
      .replace("{tier}", influencer.tier ?? "unknown")
      .replace("{followerCount}", String(influencer.follower_count ?? 0))
      .replace("{vibeScore}", String(influencer.vibe_score ?? 0))
      .replace("{aestheticScore}", String(influencer.aesthetic_score ?? 0))
      .replace("{engagementScore}", String(influencer.engagement_score ?? 0))
      .replace("{consistencyScore}", String(influencer.consistency_score ?? 0))
      .replace("{growthScore}", String(influencer.growth_potential_score ?? 0))
      .replace("{authenticityScore}", String(influencer.authenticity_score ?? 0))
      .replace("{engagementRate}", String(((Number(influencer.engagement_rate) || 0) * 100).toFixed(2)))
      .replace("{avgLikes}", String(Math.round(Number(influencer.avg_likes_per_post) || 0)))
      .replace("{avgComments}", String(Math.round(Number(influencer.avg_comments_per_post) || 0)))
      .replace("{postingDays}", String((Number(influencer.posting_frequency_days) || 0).toFixed(1)))
      .replace("{hashtags}", (influencer.top_hashtags ?? []).join(", ") || "N/A")
      .replace("{categories}", (influencer.content_categories ?? []).join(", ") || "N/A");

    // Call Gemini AI
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "AI 서비스가 설정되지 않았습니다" } },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response
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
    console.error("[coaching-api] error:", err);
    return NextResponse.json(
      { error: { message: "코칭 데이터를 생성할 수 없습니다" } },
      { status: 500 }
    );
  }
}
