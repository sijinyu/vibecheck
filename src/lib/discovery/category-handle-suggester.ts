/**
 * Category Handle Suggester
 *
 * Gemini AI에게 카테고리만으로 인플루언서를 추천받음 (브랜드 컨텍스트 불필요).
 * Cron Day 4에서 자동으로 DB를 충전하는 데 사용.
 *
 * - Gemini 2.5 Flash 사용 (free tier)
 * - 기존 SuggestedHandle 인터페이스 재사용
 * - 실패 시 빈 배열 반환 (graceful degradation)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { type SuggestedHandle } from "./ai-handle-suggester";

export const DISCOVERY_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Food",
  "Fitness",
  "Travel",
  "Lifestyle",
  "Tech",
  "Art",
  "Music",
  "Parenting",
  "Pets",
  "Home",
  "Education",
  "Entertainment",
  "Wellness",
  "Health",
  "Finance",
  "Gaming",
  "Sports",
  "Photography",
] as const;

export type DiscoveryCategory = (typeof DISCOVERY_CATEGORIES)[number];

const CATEGORY_PROMPT = `You are an expert Instagram influencer scout for the Korean market.
Given a content category, suggest exactly 15 REAL Instagram influencer handles popular in Korea for that category.

CRITICAL RULES:
- Only suggest REAL, EXISTING Instagram accounts. Do NOT make up handles.
- Focus on Korean influencers and accounts popular in Korea.
- Mix different tiers: include 3-4 nano/micro (1K-50K), 5-6 mid (50K-100K), 3-4 macro (100K-500K), and 2-3 larger accounts.
- Each handle must be unique.
- Handles should NOT include the @ symbol.
- Diversify sub-niches within the category.

Respond ONLY with a valid JSON array (no markdown, no backticks):
[
  {
    "handle": "instagram_handle",
    "reason": "한국어로 이 인플루언서가 이 카테고리에서 주목할 만한 이유 (1-2문장)",
    "estimatedCategory": "Category"
  }
]`;

/**
 * Suggest influencer handles for a given category (no brand context needed).
 * Used by Cron Day 4 for automatic DB population.
 */
export async function suggestHandlesByCategory(
  category: DiscoveryCategory,
  market: string = "한국"
): Promise<SuggestedHandle[]> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    console.error("[category-handle-suggester] GOOGLE_API_KEY not set");
    return [];
  }

  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${CATEGORY_PROMPT}\n\n--- Request ---\nCategory: ${category}\nMarket: ${market}\nPlease suggest 15 real Instagram influencers in the ${category} category popular in ${market}.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON — strip markdown fences if present
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed: unknown = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      console.error("[category-handle-suggester] Response is not an array");
      return [];
    }

    // Validate and clean handles
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
        estimatedCategory: item.estimatedCategory || category,
      }))
      .filter((item) => {
        if (item.handle.length === 0) return false;
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

    console.log(
      `[category-handle-suggester] Gemini suggested ${unique.length} handles for category "${category}"`
    );
    return unique.slice(0, 15);
  } catch (err) {
    console.error("[category-handle-suggester] Failed:", err);
    return [];
  }
}

/**
 * Pick N random categories for discovery rotation.
 */
export function pickRandomCategories(count: number): DiscoveryCategory[] {
  const shuffled = [...DISCOVERY_CATEGORIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
