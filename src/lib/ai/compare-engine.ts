import { GoogleGenerativeAI } from "@google/generative-ai";
import { type AestheticScores } from "./scoring-engine";

export interface CompareInfluencerInput {
  handle: string;
  platform: "instagram" | "tiktok";
  scores: AestheticScores;
  summary: string;
}

export interface CompareRanking {
  handle: string;
  rank: number;
  strength: string;
  recommendation: string;
}

export interface CompareResult {
  narrative: string;
  rankings: CompareRanking[];
}

const COMPARE_PROMPT = `You are an expert brand marketing consultant specializing in influencer analytics.
Compare the following influencers based on their aesthetic analysis scores and summaries.

Provide:
1. A **narrative** comparison in Korean (3-5 sentences). Be specific and actionable:
   - Highlight key differences in visual style between the influencers
   - Recommend which type of brand campaign each influencer fits best
   - Point out any notable strengths or gaps

2. **rankings**: Array of objects for each influencer, ranked by overall brand collaboration potential:
   - **handle**: The influencer's handle
   - **rank**: 1 = best, 2 = second, etc.
   - **strength**: One-line Korean description of their key strength
   - **recommendation**: One-line Korean description of ideal brand collaboration

Respond ONLY with valid JSON:
{
  "narrative": "string",
  "rankings": [
    {
      "handle": "string",
      "rank": number,
      "strength": "string",
      "recommendation": "string"
    }
  ]
}`;

export async function compareInfluencers(
  analyses: CompareInfluencerInput[]
): Promise<CompareResult> {
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (googleApiKey) {
    return compareWithGemini(analyses, googleApiKey);
  }

  return generateMockComparison(analyses);
}

async function compareWithGemini(
  analyses: CompareInfluencerInput[],
  apiKey: string
): Promise<CompareResult> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
    });

    const influencerData = analyses
      .map(
        (a) =>
          `@${a.handle} (${a.platform}):
  - Overall: ${a.scores.overall}, Color: ${a.scores.color}, Composition: ${a.scores.composition}
  - Tone Consistency: ${a.scores.toneConsistency}, Trend: ${a.scores.trend}, Style Originality: ${a.scores.styleOriginality}
  - Summary: ${a.summary}`
      )
      .join("\n\n");

    const result = await model.generateContent([
      COMPARE_PROMPT,
      `\nInfluencers to compare:\n${influencerData}`,
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      narrative: parsed.narrative ?? "",
      rankings: (parsed.rankings ?? []).map(
        (r: { handle?: string; rank?: number; strength?: string; recommendation?: string }) => ({
          handle: r.handle ?? "",
          rank: r.rank ?? 0,
          strength: r.strength ?? "",
          recommendation: r.recommendation ?? "",
        })
      ),
    };
  } catch (error) {
    console.error(
      "[compare-engine] Gemini comparison failed, falling back to mock:",
      error
    );
    return generateMockComparison(analyses);
  }
}

function generateMockComparison(
  analyses: CompareInfluencerInput[]
): CompareResult {
  const sorted = [...analyses].sort(
    (a, b) => b.scores.overall - a.scores.overall
  );

  const strengths = [
    "색감과 톤 일관성이 뛰어남",
    "트렌디한 스타일과 높은 스타일 독창성",
    "안정적인 구도와 전문적인 촬영 퀄리티",
  ];

  const recommendations = [
    "프리미엄 뷰티·라이프스타일 브랜드 협업에 최적",
    "MZ세대 타겟 패션·스트리트웨어 캠페인에 적합",
    "F&B·여행 브랜드의 감성 콘텐츠 제작에 추천",
  ];

  const rankings: CompareRanking[] = sorted.map((a, i) => ({
    handle: a.handle,
    rank: i + 1,
    strength: strengths[i % strengths.length],
    recommendation: recommendations[i % recommendations.length],
  }));

  const topHandle = sorted[0]?.handle ?? "";
  const diff =
    (sorted[0]?.scores.overall ?? 0) - (sorted[1]?.scores.overall ?? 0);
  const diffDesc = diff > 10 ? "큰 격차로" : diff > 5 ? "소폭 차이로" : "근소한 차이로";

  const narrative = `전체적으로 @${topHandle}이(가) ${diffDesc} 가장 높은 미적 완성도를 보여줍니다. ${
    sorted
      .map(
        (a) =>
          `@${a.handle}은(는) ${a.scores.toneConsistency >= 80 ? "톤 일관성" : a.scores.color >= 80 ? "색감" : a.scores.styleOriginality >= 80 ? "스타일 독창성" : "전반적 퀄리티"}에서 강점을 보입니다`
      )
      .join(". ")
  }. 브랜드 목적에 따라 최적의 인플루언서가 달라질 수 있으니, 캠페인 톤에 맞춰 선택하시길 추천합니다.`;

  return { narrative, rankings };
}
