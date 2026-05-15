/**
 * Campaign Brief Generator
 *
 * 브랜드 분석 + 선정된 인플루언서 기반으로 AI 캠페인 브리프 생성.
 * - 캠페인 목표
 * - 인플루언서별 콘텐츠 포맷 추천
 * - 예산 배분 제안
 * - 타임라인
 * - KPI 목표 (예상 도달/참여/CPE)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface BriefBrandInput {
  name: string;
  description: string | null;
  positioning: string | null;
  keywords: string[];
  categories: string[];
}

export interface BriefInfluencerInput {
  handle: string;
  displayName: string | null;
  tier: string | null;
  followerCount: number | null;
  engagementRate: number | null;
  categories: string[];
  estimatedCpe: number | null;
  vibeScore: number | null;
}

export interface CampaignBrief {
  objectives: string[];
  influencerPlan: Array<{
    handle: string;
    contentFormat: string;
    keyMessage: string;
    expectedReach: number;
    expectedEngagement: number;
  }>;
  budgetAllocation: Array<{
    handle: string;
    suggestedFee: number;
    percentage: number;
  }>;
  timeline: Array<{
    phase: string;
    description: string;
    duration: string;
  }>;
  kpiTargets: {
    totalReach: number;
    totalEngagement: number;
    avgCpe: number;
    estimatedRoi: number;
  };
}

export async function generateCampaignBrief(
  brand: BriefBrandInput,
  influencers: BriefInfluencerInput[],
  budgetKrw: number | null
): Promise<CampaignBrief> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey || influencers.length === 0) {
    return buildFallbackBrief(brand, influencers, budgetKrw);
  }

  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const brandInfo = `브랜드: ${brand.name}${brand.description ? ` — ${brand.description}` : ""}
카테고리: ${brand.categories.join(", ")}
${brand.positioning ? `포지셔닝: ${brand.positioning}` : ""}`;

    const influencerList = influencers
      .map(
        (inf) =>
          `@${inf.handle} (${inf.tier ?? "unknown"}, ${inf.followerCount?.toLocaleString() ?? "?"}팔로워, ER: ${inf.engagementRate ? (inf.engagementRate * 100).toFixed(1) + "%" : "?"}, VibeScore: ${inf.vibeScore ?? "?"}, CPE: ${inf.estimatedCpe ? Math.round(inf.estimatedCpe) + "원" : "?"})`
      )
      .join("\n");

    const prompt = `인플루언서 마케팅 캠페인 브리프를 생성하세요.

--- 브랜드 ---
${brandInfo}

--- 인플루언서 목록 ---
${influencerList}

--- 예산 ---
${budgetKrw ? budgetKrw.toLocaleString() + "원" : "미정"}

JSON으로 응답 (마크다운/백틱 없이):
{
  "objectives": ["캠페인 목표 1", "캠페인 목표 2", "캠페인 목표 3"],
  "influencerPlan": [
    {
      "handle": "@handle",
      "contentFormat": "릴스/피드/스토리 등 추천 형식",
      "keyMessage": "핵심 메시지",
      "expectedReach": 예상노출수,
      "expectedEngagement": 예상참여수
    }
  ],
  "budgetAllocation": [
    {
      "handle": "@handle",
      "suggestedFee": 제안금액,
      "percentage": 비율
    }
  ],
  "timeline": [
    {
      "phase": "준비/실행/분석",
      "description": "설명",
      "duration": "1주/2주 등"
    }
  ],
  "kpiTargets": {
    "totalReach": 총예상노출,
    "totalEngagement": 총예상참여,
    "avgCpe": 평균CPE,
    "estimatedRoi": 예상ROI배수
  }
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned) as CampaignBrief;
    return parsed;
  } catch (err) {
    console.error("[campaign-brief-generator] Failed:", err);
    return buildFallbackBrief(brand, influencers, budgetKrw);
  }
}

function buildFallbackBrief(
  brand: BriefBrandInput,
  influencers: BriefInfluencerInput[],
  budgetKrw: number | null
): CampaignBrief {
  const budget = budgetKrw ?? 5_000_000;
  const perInfluencer = Math.floor(budget / Math.max(1, influencers.length));

  return {
    objectives: [
      `${brand.name} 브랜드 인지도 확대`,
      `${brand.categories[0] ?? "타겟"} 카테고리 내 포지셔닝 강화`,
      "신규 고객 유입 및 전환율 개선",
    ],
    influencerPlan: influencers.map((inf) => ({
      handle: inf.handle,
      contentFormat: "피드 포스트 1건 + 스토리 2건",
      keyMessage: `${brand.name}과 함께하는 ${inf.categories[0] ?? "라이프스타일"}`,
      expectedReach: Math.round((inf.followerCount ?? 10000) * 0.3),
      expectedEngagement: Math.round(
        (inf.followerCount ?? 10000) * (inf.engagementRate ?? 0.02)
      ),
    })),
    budgetAllocation: influencers.map((inf) => ({
      handle: inf.handle,
      suggestedFee: perInfluencer,
      percentage: Math.round(100 / Math.max(1, influencers.length)),
    })),
    timeline: [
      { phase: "준비", description: "인플루언서 컨택 및 브리프 전달", duration: "1주" },
      { phase: "콘텐츠 제작", description: "콘텐츠 기획 및 촬영", duration: "1-2주" },
      { phase: "게시", description: "콘텐츠 발행 및 모니터링", duration: "1주" },
      { phase: "분석", description: "성과 측정 및 보고서 작성", duration: "1주" },
    ],
    kpiTargets: {
      totalReach: influencers.reduce(
        (sum, inf) => sum + Math.round((inf.followerCount ?? 10000) * 0.3),
        0
      ),
      totalEngagement: influencers.reduce(
        (sum, inf) =>
          sum + Math.round((inf.followerCount ?? 10000) * (inf.engagementRate ?? 0.02)),
        0
      ),
      avgCpe: influencers.length > 0
        ? Math.round(
            influencers.reduce((sum, inf) => sum + (inf.estimatedCpe ?? 500), 0) /
              influencers.length
          )
        : 500,
      estimatedRoi: 2.5,
    },
  };
}
