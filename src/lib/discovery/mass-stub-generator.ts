/**
 * Mass Stub Generator
 *
 * Gemini AI를 활용해 대량의 인플루언서 스텁 데이터를 생성.
 * 카테고리 × 티어 × 스타일 × 서브니치 조합으로 ~20,000개 스텁 프로필 생성에 사용.
 *
 * - Gemini 2.5 Flash 사용 (free tier)
 * - 티어(5) × 스타일(4) × 서브니치(5) = 100가지 variation per category
 * - 각 variation당 ~15개 핸들 → 카테고리당 최대 ~1,500개 unique 핸들
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface StubSuggestion {
  handle: string;
  estimatedFollowers: string; // "10K-50K" etc
  estimatedTier: string;
  category: string;
  subNiche: string; // "Korean streetwear" etc
  oneLiner: string; // Korean 1-line description
  contentStyle: string; // "minimalist", "vibrant" etc
  reason: string;
}

export interface MassStubResult {
  suggestions: StubSuggestion[];
  category: string;
  variation: string;
}

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------

const TIERS = ["nano", "micro", "mid", "macro", "mega"] as const;
type Tier = (typeof TIERS)[number];

const STYLES = [
  "minimalist",
  "vibrant",
  "storytelling",
  "brand-friendly",
] as const;
type Style = (typeof STYLES)[number];

const SUB_NICHES: Record<string, string[]> = {
  Fashion: [
    "Korean streetwear",
    "Minimal fashion",
    "Luxury fashion",
    "Vintage fashion",
    "Sustainable fashion",
  ],
  Beauty: [
    "Skincare",
    "Makeup tutorials",
    "K-beauty",
    "Natural beauty",
    "Nail art",
  ],
  Food: [
    "Korean cuisine",
    "Cafe & desserts",
    "Home cooking",
    "Vegan & healthy",
    "Street food",
  ],
  Fitness: [
    "Gym & weightlifting",
    "Yoga & pilates",
    "Running",
    "Home workout",
    "Sports nutrition",
  ],
  Travel: [
    "Domestic Korea travel",
    "Southeast Asia",
    "Europe travel",
    "Budget travel",
    "Luxury travel",
  ],
  Lifestyle: [
    "Daily vlog",
    "Minimalist living",
    "Self-care & wellness",
    "Aesthetic room",
    "Morning routine",
  ],
  Tech: [
    "Smartphone reviews",
    "Gadget unboxing",
    "PC & gaming",
    "AI & productivity",
    "Coding & dev",
  ],
  Art: [
    "Digital illustration",
    "Traditional painting",
    "Photography",
    "Calligraphy",
    "Craft & DIY",
  ],
  Music: [
    "K-pop cover dance",
    "Indie music",
    "Guitar & instruments",
    "Singing & vocals",
    "Music production",
  ],
  Parenting: [
    "Baby & toddler",
    "Pregnancy journey",
    "Educational play",
    "Family vlog",
    "Single parenting",
  ],
  Pets: [
    "Dogs",
    "Cats",
    "Exotic pets",
    "Pet training",
    "Pet product review",
  ],
  Home: [
    "Interior design",
    "Small apartment living",
    "Kitchen & cooking space",
    "Plant & garden",
    "Organization & declutter",
  ],
  Education: [
    "English learning",
    "Study with me",
    "Career & self-development",
    "Finance & investing",
    "University student life",
  ],
  Entertainment: [
    "Movie & drama review",
    "Gaming",
    "Comedy & meme",
    "K-pop fan account",
    "Book review",
  ],
  Wellness: [
    "Meditation & mindfulness",
    "Aromatherapy & healing",
    "Mental health",
    "Self-care routine",
    "Holistic wellness",
  ],
  Health: [
    "Diet & nutrition",
    "Health supplements",
    "Medical tips",
    "Healthy recipes",
    "Chronic illness awareness",
  ],
  Finance: [
    "Stock investing",
    "Real estate",
    "Crypto & blockchain",
    "Financial independence",
    "Side hustle & income",
  ],
  Gaming: [
    "PC gaming",
    "Mobile gaming",
    "Game streaming",
    "Esports",
    "Retro gaming",
  ],
  Sports: [
    "Soccer & football",
    "Basketball",
    "Golf",
    "Tennis & badminton",
    "Surfing & water sports",
  ],
  Photography: [
    "Portrait photography",
    "Landscape & travel",
    "Street photography",
    "Film photography",
    "Product photography",
  ],
};

const TIER_FOLLOWER_RANGE: Record<Tier, string> = {
  nano: "1K-10K",
  micro: "10K-50K",
  mid: "50K-200K",
  macro: "200K-1M",
  mega: "1M+",
};

// -----------------------------------------------------------------------
// Gemini prompt
// -----------------------------------------------------------------------

function buildPrompt(
  category: string,
  tier: Tier,
  style: Style,
  subNiche: string
): string {
  const followerRange = TIER_FOLLOWER_RANGE[tier];

  return `You are an expert Instagram influencer scout for the Korean market.
Generate exactly 15 REAL Korean Instagram influencer handles that match ALL of these criteria:

- Category: ${category}
- Sub-niche: ${subNiche}
- Tier: ${tier} (${followerRange} followers)
- Content style: ${style}

CRITICAL RULES:
- Only suggest REAL, EXISTING Instagram accounts. Do NOT make up handles.
- All influencers must be active in the Korean market (Korean creators or popular in Korea).
- Handles must NOT include the @ symbol.
- Each handle must be unique within this response.
- The estimated follower count must match the ${tier} tier range: ${followerRange}.

Respond ONLY with a valid JSON array (no markdown, no backticks, no explanation):
[
  {
    "handle": "instagram_handle",
    "estimatedFollowers": "${followerRange}",
    "estimatedTier": "${tier}",
    "subNiche": "${subNiche}",
    "oneLiner": "한국어로 이 계정을 한 줄로 설명 (예: '감성적인 미니멀 패션 콘텐츠로 2030 여성들의 큰 호응을 얻는 스타일리스트')",
    "contentStyle": "${style}",
    "reason": "한국어로 이 인플루언서가 ${subNiche} 서브니치에서 주목할 만한 이유 (1-2문장)"
  }
]`;
}

// -----------------------------------------------------------------------
// Response parsing helpers
// -----------------------------------------------------------------------

interface RawStubItem {
  handle: string;
  estimatedFollowers: string;
  estimatedTier: string;
  subNiche: string;
  oneLiner: string;
  contentStyle: string;
  reason: string;
}

function isRawStubItem(item: unknown): item is RawStubItem {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.handle === "string" &&
    typeof obj.estimatedFollowers === "string" &&
    typeof obj.estimatedTier === "string" &&
    typeof obj.subNiche === "string" &&
    typeof obj.oneLiner === "string" &&
    typeof obj.contentStyle === "string" &&
    typeof obj.reason === "string"
  );
}

function cleanHandle(raw: string): string {
  return raw.replace(/^@/, "").trim().toLowerCase();
}

function isValidHandle(handle: string): boolean {
  if (handle.length === 0 || handle.length > 30) return false;
  return /^[a-zA-Z0-9._]+$/.test(handle);
}

function parseStubResponse(
  text: string,
  category: string,
  tier: Tier,
  style: Style,
  subNiche: string
): StubSuggestion[] {
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[mass-stub-generator] JSON parse failed");
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error("[mass-stub-generator] Response is not an array");
    return [];
  }

  const suggestions: StubSuggestion[] = parsed
    .filter(isRawStubItem)
    .map((item) => ({
      handle: cleanHandle(item.handle),
      estimatedFollowers: item.estimatedFollowers || TIER_FOLLOWER_RANGE[tier],
      estimatedTier: item.estimatedTier || tier,
      category,
      subNiche: item.subNiche || subNiche,
      oneLiner: item.oneLiner,
      contentStyle: item.contentStyle || style,
      reason: item.reason,
    }))
    .filter((item) => isValidHandle(item.handle));

  // Deduplicate within this batch
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    if (seen.has(s.handle)) return false;
    seen.add(s.handle);
    return true;
  });
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

/**
 * Gemini AI에게 단일 variation에 대한 ~15개의 인플루언서 스텁 제안을 요청.
 */
export async function generateMassStubs(
  category: string,
  tier: string,
  style: string,
  subNiche: string
): Promise<StubSuggestion[]> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    console.error("[mass-stub-generator] GOOGLE_API_KEY not set");
    return [];
  }

  // Validate tier and style — fall back to safe defaults if invalid
  const safeTier: Tier = (TIERS as readonly string[]).includes(tier)
    ? (tier as Tier)
    : "micro";
  const safeStyle: Style = (STYLES as readonly string[]).includes(style)
    ? (style as Style)
    : "minimalist";

  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = buildPrompt(category, safeTier, safeStyle, subNiche);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const suggestions = parseStubResponse(
      text,
      category,
      safeTier,
      safeStyle,
      subNiche
    );

    console.log(
      `[mass-stub-generator] ${suggestions.length} stubs generated — ` +
        `category="${category}" tier="${safeTier}" style="${safeStyle}" subNiche="${subNiche}"`
    );

    return suggestions;
  } catch (err) {
    console.error(
      `[mass-stub-generator] Gemini call failed for ${category}/${safeTier}/${safeStyle}/${subNiche}:`,
      err
    );
    return [];
  }
}

/**
 * 한 카테고리의 모든 tier × style × subNiche 조합(최대 100 variations)을 순회하며
 * 스텁 제안을 생성하고 핸들 기준으로 중복 제거 후 반환.
 *
 * @param category - DISCOVERY_CATEGORIES 중 하나
 * @param maxVariations - 처리할 최대 variation 수 (기본 100, timeout 방지용)
 */
export async function generateAllVariationsForCategory(
  category: string,
  maxVariations = 100
): Promise<StubSuggestion[]> {
  const subNiches = SUB_NICHES[category] ?? SUB_NICHES["Lifestyle"];
  const allSuggestions: StubSuggestion[] = [];
  const seenHandles = new Set<string>();

  let variationCount = 0;

  outer: for (const tier of TIERS) {
    for (const style of STYLES) {
      for (const subNiche of subNiches) {
        if (variationCount >= maxVariations) break outer;
        variationCount++;

        const suggestions = await generateMassStubs(
          category,
          tier,
          style,
          subNiche
        );

        for (const suggestion of suggestions) {
          if (!seenHandles.has(suggestion.handle)) {
            seenHandles.add(suggestion.handle);
            allSuggestions.push(suggestion);
          }
        }

        // gemini-2.0-flash free tier: 15 RPM → 4s between calls + buffer
        await new Promise((resolve) => setTimeout(resolve, 4500));
      }
    }
  }

  console.log(
    `[mass-stub-generator] generateAllVariationsForCategory "${category}": ` +
      `${variationCount} variations processed, ${allSuggestions.length} unique handles`
  );

  return allSuggestions;
}

export { TIERS, STYLES, SUB_NICHES, TIER_FOLLOWER_RANGE };
