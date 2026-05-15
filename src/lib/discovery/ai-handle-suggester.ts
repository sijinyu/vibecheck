/**
 * AI Handle Suggester
 *
 * Gemini AI에게 브랜드 컨텍스트를 전달하여
 * 매칭되는 실제 인스타그램 인플루언서 핸들 15개를 추천받음.
 *
 * - Gemini 2.5 Flash 사용 (free tier)
 * - 실패 시 빈 배열 반환 (graceful degradation)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface SuggestedHandle {
  handle: string;
  reason: string; // 왜 이 계정이 매칭되는지 (Korean)
  estimatedCategory: string; // Fashion, Beauty 등
}

export interface BrandContextForSuggestion {
  name: string;
  handle: string;
  identity?: string;
  industry?: string;
  targetAudience?: string;
  coreValues?: string[];
  keywords?: string[];
  competitors?: string[];
  idealInfluencerProfile?: {
    tone?: string;
    followerRange?: string;
    contentStyle?: string;
    audienceTraits?: string;
    platformFit?: string;
  };
}

const SUGGESTION_PROMPT = `You are an expert Instagram influencer scout for the Korean market.
Given a brand profile, suggest exactly 15 REAL Instagram influencer handles that would be great collaboration partners.

CRITICAL RULES:
- Only suggest REAL, EXISTING Instagram accounts. Do NOT make up handles.
- Focus on Korean influencers and accounts popular in Korea.
- Mix different tiers: include 3-4 micro (10K-50K), 5-6 mid (50K-100K), 3-4 macro (100K-500K), and 2-3 larger accounts.
- Each handle must be unique.
- Do NOT include the brand's own handle.
- Handles should NOT include the @ symbol.
- Diversify categories: mix content creators, lifestyle influencers, and niche experts relevant to the brand.

Respond ONLY with a valid JSON array (no markdown, no backticks):
[
  {
    "handle": "instagram_handle",
    "reason": "한국어로 이 인플루언서가 브랜드와 잘 맞는 이유 설명 (1-2문장)",
    "estimatedCategory": "Category (e.g., Fashion, Beauty, Food, Lifestyle, Fitness, Travel, Art, Tech)"
  }
]`;

function buildBrandContext(brand: BrandContextForSuggestion): string {
  const parts: string[] = [];

  parts.push(`브랜드명: ${brand.name}`);
  if (brand.handle) parts.push(`핸들: @${brand.handle}`);
  if (brand.identity) parts.push(`정체성: ${brand.identity}`);
  if (brand.industry) parts.push(`업종: ${brand.industry}`);
  if (brand.targetAudience) parts.push(`타겟 오디언스: ${brand.targetAudience}`);
  if (brand.coreValues?.length) parts.push(`핵심 가치: ${brand.coreValues.join(", ")}`);
  if (brand.keywords?.length) parts.push(`키워드: ${brand.keywords.join(", ")}`);
  if (brand.competitors?.length) parts.push(`경쟁 브랜드: ${brand.competitors.join(", ")}`);

  if (brand.idealInfluencerProfile) {
    const ip = brand.idealInfluencerProfile;
    const profileParts: string[] = [];
    if (ip.tone) profileParts.push(`톤: ${ip.tone}`);
    if (ip.followerRange) profileParts.push(`팔로워 범위: ${ip.followerRange}`);
    if (ip.contentStyle) profileParts.push(`콘텐츠 스타일: ${ip.contentStyle}`);
    if (ip.audienceTraits) profileParts.push(`오디언스 특성: ${ip.audienceTraits}`);
    if (ip.platformFit) profileParts.push(`플랫폼: ${ip.platformFit}`);
    if (profileParts.length > 0) {
      parts.push(`이상적 인플루언서 프로필:\n  ${profileParts.join("\n  ")}`);
    }
  }

  return parts.join("\n");
}

export async function suggestInfluencerHandles(
  brand: BrandContextForSuggestion
): Promise<SuggestedHandle[]> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    console.error("[ai-handle-suggester] GOOGLE_API_KEY not set");
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const brandContext = buildBrandContext(brand);
    const prompt = `${SUGGESTION_PROMPT}\n\n--- Brand Profile ---\n${brandContext}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON — strip markdown fences if present
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed: unknown = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      console.error("[ai-handle-suggester] Response is not an array");
      return [];
    }

    // Validate and clean handles
    const brandHandle = brand.handle?.replace("@", "").toLowerCase();

    const suggestions: SuggestedHandle[] = parsed
      .filter(
        (item): item is { handle: string; reason: string; estimatedCategory: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).handle === "string" &&
          typeof (item as Record<string, unknown>).reason === "string" &&
          typeof (item as Record<string, unknown>).estimatedCategory === "string"
      )
      .map((item) => ({
        handle: item.handle.replace("@", "").trim().toLowerCase(),
        reason: item.reason,
        estimatedCategory: item.estimatedCategory,
      }))
      .filter((item) => {
        // Remove brand's own handle
        if (item.handle === brandHandle) return false;
        // Remove empty handles
        if (item.handle.length === 0) return false;
        // Basic handle validation (alphanumeric, dots, underscores)
        if (!/^[a-zA-Z0-9._]+$/.test(item.handle)) return false;
        return true;
      });

    // Deduplicate by handle
    const seen = new Set<string>();
    const unique = suggestions.filter((s) => {
      if (seen.has(s.handle)) return false;
      seen.add(s.handle);
      return true;
    });

    console.log(`[ai-handle-suggester] Gemini suggested ${unique.length} handles for brand "${brand.name}"`);
    return unique.slice(0, 15);
  } catch (err) {
    console.error("[ai-handle-suggester] Failed:", err);
    return [];
  }
}
