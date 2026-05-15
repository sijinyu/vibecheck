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

  throw new Error("비교 분석을 위해 GOOGLE_API_KEY가 필요합니다.");
}

async function compareWithGemini(
  analyses: CompareInfluencerInput[],
  apiKey: string
): Promise<CompareResult> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
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
    console.error("[compare-engine] Gemini comparison failed:", error);
    throw error;
  }
}
