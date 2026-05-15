/**
 * Text Matching Engine
 *
 * Light 프로필(aesthetic_vector 없음)에 대해 Gemini 텍스트 기반 매칭 점수 제공.
 * 기존 matching-engine.ts의 50점 고정 대체.
 *
 * 두 가지 기능:
 * 1. generateAestheticDescription() — 인플루언서 light-analyze 직후 호출
 * 2. calculateTextMatchScore() — 브랜드-인플루언서 매칭 시 호출
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

/**
 * Generate a 2-sentence aesthetic description for an influencer.
 * Called right after light-analyze to populate influencers.aesthetic_description.
 */
export async function generateAestheticDescription(input: {
  handle: string;
  bio: string | null;
  hashtags: string[];
  categories: string[];
  followerCount: number | null;
  engagementRate: number | null;
}): Promise<string | null> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const context = [
      `핸들: @${input.handle}`,
      input.bio ? `바이오: ${input.bio}` : null,
      input.categories.length > 0 ? `카테고리: ${input.categories.join(", ")}` : null,
      input.hashtags.length > 0 ? `주요 해시태그: ${input.hashtags.slice(0, 10).join(", ")}` : null,
      input.followerCount ? `팔로워: ${input.followerCount.toLocaleString()}` : null,
      input.engagementRate ? `참여율: ${(input.engagementRate * 100).toFixed(1)}%` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Based on this Instagram influencer's profile, write a 2-sentence aesthetic description in Korean.
Describe their content style, visual tone, and audience appeal. Be specific and concise.

${context}

Respond with ONLY the 2-sentence description in Korean (no quotes, no labels, no markdown):`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (text.length < 10 || text.length > 500) return null;
    return text;
  } catch (err) {
    console.error("[text-matching-engine] generateAestheticDescription failed:", err);
    return null;
  }
}

/**
 * Calculate a text-based match score between a brand and light-profile influencer.
 * Returns 0-100 score. Caches results in text_match_cache table.
 */
export async function calculateTextMatchScore(
  client: Client,
  brandId: string,
  influencerId: string,
  brandContext: {
    name: string;
    description: string | null;
    keywords: string[];
    categories: string[];
    positioning: string | null;
  },
  influencerContext: {
    handle: string;
    bio: string | null;
    aestheticDescription: string | null;
    categories: string[];
    hashtags: string[];
  }
): Promise<number> {
  // Check cache first
  const { data: cached } = await client
    .from("text_match_cache")
    .select("text_match_score")
    .eq("brand_id", brandId)
    .eq("influencer_id", influencerId)
    .maybeSingle();

  if (cached) return cached.text_match_score;

  // Calculate via Gemini
  const score = await computeTextMatch(brandContext, influencerContext);

  // Cache the result
  await client
    .from("text_match_cache")
    .upsert(
      {
        brand_id: brandId,
        influencer_id: influencerId,
        text_match_score: score,
      },
      { onConflict: "brand_id,influencer_id" }
    );

  return score;
}

async function computeTextMatch(
  brand: {
    name: string;
    description: string | null;
    keywords: string[];
    categories: string[];
    positioning: string | null;
  },
  influencer: {
    handle: string;
    bio: string | null;
    aestheticDescription: string | null;
    categories: string[];
    hashtags: string[];
  }
): Promise<number> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) return 50; // Fallback

  try {
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const brandInfo = [
      `브랜드명: ${brand.name}`,
      brand.description ? `설명: ${brand.description}` : null,
      brand.positioning ? `포지셔닝: ${brand.positioning}` : null,
      brand.keywords.length > 0 ? `키워드: ${brand.keywords.join(", ")}` : null,
      brand.categories.length > 0 ? `타겟 카테고리: ${brand.categories.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const influencerInfo = [
      `핸들: @${influencer.handle}`,
      influencer.bio ? `바이오: ${influencer.bio}` : null,
      influencer.aestheticDescription ? `미학 설명: ${influencer.aestheticDescription}` : null,
      influencer.categories.length > 0
        ? `콘텐츠 카테고리: ${influencer.categories.join(", ")}`
        : null,
      influencer.hashtags.length > 0
        ? `주요 해시태그: ${influencer.hashtags.slice(0, 10).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Rate the brand-influencer aesthetic match from 0 to 100.
Consider: visual tone alignment, target audience overlap, content style compatibility, and brand-influencer synergy.

--- Brand ---
${brandInfo}

--- Influencer ---
${influencerInfo}

Respond with ONLY a single integer (0-100):`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const score = parseInt(text, 10);
    if (isNaN(score) || score < 0 || score > 100) return 50;
    return score;
  } catch (err) {
    console.error("[text-matching-engine] computeTextMatch failed:", err);
    return 50; // Fallback on error
  }
}

/**
 * Batch-generate aesthetic descriptions for influencers missing them.
 * Used after light-analyze to fill aesthetic_description column.
 */
export async function backfillAestheticDescriptions(
  client: Client,
  limit: number = 10
): Promise<number> {
  const { data: influencers } = await client
    .from("influencers")
    .select("id, handle, bio, top_hashtags, content_categories, follower_count, engagement_rate")
    .is("aesthetic_description", null)
    .not("discovery_status", "eq", "stub")
    .order("follower_count", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!influencers || influencers.length === 0) return 0;

  let filled = 0;
  for (const inf of influencers) {
    const description = await generateAestheticDescription({
      handle: inf.handle,
      bio: inf.bio,
      hashtags: inf.top_hashtags ?? [],
      categories: inf.content_categories ?? [],
      followerCount: inf.follower_count,
      engagementRate: inf.engagement_rate,
    });

    if (description) {
      await client
        .from("influencers")
        .update({ aesthetic_description: description })
        .eq("id", inf.id);
      filled++;
    }

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return filled;
}
