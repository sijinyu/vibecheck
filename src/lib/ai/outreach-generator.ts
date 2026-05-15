/**
 * AI Outreach Generator
 *
 * Gemini로 개인화된 한국어 아웃리치 메시지 생성.
 * - DM 템플릿: 3-4문장, 자연스러운 톤
 * - 협업 제안서: 브랜드 소개 + 왜 이 인플루언서인지 + 제안 + 보상
 * - 협상 포인트: 3-5개 핵심 설득 포인트
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface OutreachInput {
  brand: {
    name: string;
    description: string | null;
    positioning: string | null;
    keywords: string[];
    categories: string[];
  };
  influencer: {
    handle: string;
    displayName: string | null;
    bio: string | null;
    tier: string | null;
    followerCount: number | null;
    engagementRate: number | null;
    categories: string[];
    topHashtags: string[];
    vibeScore: number | null;
    oneLiner: string | null;
    aestheticDescription: string | null;
  };
  campaign?: {
    name: string;
    budget: number | null;
    brief: string | null;
  };
}

export interface OutreachResult {
  dmTemplate: string;
  collaborationProposal: string;
  negotiationPoints: string[];
}

export async function generateOutreach(input: OutreachInput): Promise<OutreachResult> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return getFallbackOutreach(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const brandInfo = [
      `브랜드명: ${input.brand.name}`,
      input.brand.description ? `설명: ${input.brand.description}` : null,
      input.brand.positioning ? `포지셔닝: ${input.brand.positioning}` : null,
      input.brand.keywords.length > 0 ? `키워드: ${input.brand.keywords.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const influencerInfo = [
      `핸들: @${input.influencer.handle}`,
      input.influencer.displayName ? `이름: ${input.influencer.displayName}` : null,
      input.influencer.bio ? `바이오: ${input.influencer.bio}` : null,
      input.influencer.tier ? `티어: ${input.influencer.tier}` : null,
      input.influencer.followerCount
        ? `팔로워: ${input.influencer.followerCount.toLocaleString()}`
        : null,
      input.influencer.engagementRate
        ? `참여율: ${(input.influencer.engagementRate * 100).toFixed(1)}%`
        : null,
      input.influencer.categories.length > 0
        ? `카테고리: ${input.influencer.categories.join(", ")}`
        : null,
      input.influencer.topHashtags.length > 0
        ? `해시태그: ${input.influencer.topHashtags.slice(0, 5).join(", ")}`
        : null,
      input.influencer.aestheticDescription
        ? `미학 설명: ${input.influencer.aestheticDescription}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const campaignInfo = input.campaign
      ? [
          `캠페인명: ${input.campaign.name}`,
          input.campaign.budget ? `예산: ${input.campaign.budget.toLocaleString()}원` : null,
          input.campaign.brief ? `브리프: ${input.campaign.brief}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    const prompt = `당신은 인플루언서 마케팅 전문가입니다. 다음 브랜드와 인플루언서 정보를 바탕으로 한국어 아웃리치 메시지를 생성하세요.

--- 브랜드 ---
${brandInfo}

--- 인플루언서 ---
${influencerInfo}

${campaignInfo ? `--- 캠페인 ---\n${campaignInfo}\n` : ""}

다음 3가지를 생성하세요. JSON으로 응답하세요 (마크다운/백틱 없이):

{
  "dmTemplate": "인스타그램 DM 메시지 (3-4문장, 자연스럽고 친근한 톤, 구체적으로 인플루언서의 콘텐츠를 언급, 협업 의향 표현)",
  "collaborationProposal": "공식 협업 제안서 (브랜드 소개 1문장 + 왜 이 인플루언서를 선택했는지 2문장 + 구체적 제안 형식 1-2문장 + 보상/혜택 1문장)",
  "negotiationPoints": ["설득 포인트 1", "설득 포인트 2", "설득 포인트 3"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      dmTemplate?: string;
      collaborationProposal?: string;
      negotiationPoints?: string[];
    };

    return {
      dmTemplate: parsed.dmTemplate ?? getFallbackOutreach(input).dmTemplate,
      collaborationProposal:
        parsed.collaborationProposal ?? getFallbackOutreach(input).collaborationProposal,
      negotiationPoints: parsed.negotiationPoints ?? getFallbackOutreach(input).negotiationPoints,
    };
  } catch (err) {
    console.error("[outreach-generator] Failed:", err);
    return getFallbackOutreach(input);
  }
}

function getFallbackOutreach(input: OutreachInput): OutreachResult {
  const name = input.influencer.displayName ?? `@${input.influencer.handle}`;
  return {
    dmTemplate: `안녕하세요 ${name}님! ${input.brand.name}입니다. 평소 멋진 콘텐츠를 잘 보고 있었는데, 저희 브랜드와 함께 특별한 협업을 해보면 어떨까 해서 연락드립니다. 관심 있으시면 편하게 답변 부탁드려요!`,
    collaborationProposal: `${input.brand.name}은(는) ${input.brand.categories.join(", ")} 분야의 브랜드입니다. ${name}님의 콘텐츠가 저희 브랜드 이미지와 잘 맞아 협업을 제안드립니다. 콘텐츠 제작 후 공정한 보상을 드리겠습니다.`,
    negotiationPoints: [
      `${name}님의 ${input.influencer.categories[0] ?? "콘텐츠"} 분야 전문성이 브랜드와 시너지 창출 가능`,
      `참여율이 동일 티어 평균 대비 경쟁력 있는 수준`,
      `장기 파트너십으로 발전 가능한 협업 구조 제안`,
    ],
  };
}
