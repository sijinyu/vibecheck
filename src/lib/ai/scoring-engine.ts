import { GoogleGenerativeAI } from "@google/generative-ai";
import { type FeedData, type FeedPost } from "@/lib/adapters/types";

export interface AestheticScores {
  overall: number;
  color: number;
  composition: number;
  toneConsistency: number;
  trend: number;
  styleOriginality: number;
}

export type AiSource = "gemini" | "openai";

export interface AnalysisResult {
  scores: AestheticScores;
  representativeImages: string[];
  aestheticVector: number[];
  summary: string;
  aiSource: AiSource;
  oneLiner: string;
  contentTopics: string[];
}

const ANALYSIS_PROMPT = `You are an expert visual aesthetics analyst for social media content.
Analyze the following Instagram account and provide a comprehensive aesthetic assessment.

## CRITICAL: Read the account's BIO and PROFILE info provided below the images.
The bio is the account owner's self-description — use it to understand the account's identity, industry, and purpose.
Your summary and contentTopics MUST be consistent with what the bio says.

Score each dimension from 0-100:
1. **color** — Color harmony, palette consistency, saturation balance
2. **composition** — Visual balance, rule of thirds, leading lines, framing
3. **toneConsistency** — How consistent the visual tone is across all posts
4. **trend** — How well the content aligns with current visual trends
5. **styleOriginality** — Uniqueness of visual style, distinctive aesthetic identity

Also provide:
- An **overall** aesthetic score (0-100), weighted average favoring consistency and originality
- A **summary** in Korean (2-3 sentences). This summary is for brand marketers evaluating influencer partnerships.
  Write it like a talent scout's brief — be specific and opinionated:
  - FIRST, state what this account is about based on the bio (e.g. "스킨케어 전문 인플루언서", "서울 기반 카페 리뷰어", "패션 브랜드 공식 계정")
  - Name the dominant color palette (e.g. "차분한 베이지-크림 톤", "채도 높은 네온 컬러")
  - Identify the content style (e.g. "미니멀 플랫레이 중심", "스트릿 스냅 위주", "감성 카페 투어")
  - State what kind of brand collaboration would fit
  - If there's a weakness, mention it briefly
  Do NOT use generic phrases like "일관된 톤과 독특한 미적 감각이 돋보이는 계정입니다" — be concrete.
- A **oneLiner** in Korean: One punchy sentence (max 40 chars) summarizing this account for a recommendation card.
  Must reflect the bio's description of the account.
  Format: "[핵심 정체성], [타겟 오디언스], [핵심 강점]"
  Examples: "미니멀 뷰티의 정석, 20대 여성 팔로워, 참여율 상위 5%"
  "유머러스한 먹방 크리에이터, 가족 오디언스, 월 성장률 12%"
- A **contentTopics** array of 3-5 specific content sub-topics (in Korean) that describe this account's niche.
  Must be derived from BOTH the bio AND the actual post content.
  NOT broad categories like "Fashion" — use specific sub-topics.
  Examples: ["미니멀 데일리룩", "스트릿 패션", "명품 언박싱"] or ["홈카페 레시피", "비건 디저트", "카페 투어"]
- A **vector** of 10 float values between 0 and 1 representing the aesthetic fingerprint:
  [warmth, saturation, contrast, minimalism, nature, urban, fashion, moody, bright, editorial]

Respond ONLY with valid JSON in this exact format:
{
  "overall": number,
  "color": number,
  "composition": number,
  "toneConsistency": number,
  "trend": number,
  "styleOriginality": number,
  "summary": "string",
  "oneLiner": "string",
  "contentTopics": ["string", "string", "string"],
  "vector": [number, number, number, number, number, number, number, number, number, number]
}`;

export interface IdentityContext {
  identity: string;
  industry: string;
  targetAudience: string;
  coreValues: string[];
}

export async function analyzeAesthetics(
  feedData: FeedData,
  identityContext?: IdentityContext | null
): Promise<AnalysisResult> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Priority: Gemini (free) > OpenAI (paid)
  if (googleApiKey) {
    return analyzeWithGemini(feedData, googleApiKey, identityContext);
  }

  if (openaiApiKey) {
    return analyzeWithOpenAI(feedData, openaiApiKey, identityContext);
  }

  throw new Error("AI API가 설정되지 않았습니다. GOOGLE_API_KEY 또는 OPENAI_API_KEY를 설정해주세요.");
}

// ─── Gemini 2.5 Flash (free tier) ──────────────────────────────

async function analyzeWithGemini(
  feedData: FeedData,
  apiKey: string,
  identityContext?: IdentityContext | null
): Promise<AnalysisResult> {
  const selectedPosts = selectRepresentativePosts(feedData.posts, 20);
  const imageUrls = selectedPosts.map((post) => post.imageUrl);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Fetch images and convert to inline data for Gemini
    const imageParts = await Promise.all(
      imageUrls.map(async (url) => {
        try {
          const res = await fetch(url);
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType = res.headers.get("content-type") ?? "image/jpeg";
          return {
            inlineData: { data: base64, mimeType },
          };
        } catch {
          return null;
        }
      })
    );

    const validImageParts = imageParts.filter(
      (p): p is NonNullable<typeof p> => p !== null
    );

    if (validImageParts.length === 0) {
      throw new Error("이미지를 가져올 수 없습니다. 인플루언서의 피드 이미지가 접근 가능한지 확인해주세요.");
    }

    const identityBlock = identityContext
      ? `═══ CONFIRMED IDENTITY (GROUND TRUTH — do NOT contradict) ═══\n정체성: ${identityContext.identity}\n업종: ${identityContext.industry}\n타깃: ${identityContext.targetAudience}\n핵심 가치: ${identityContext.coreValues.join(", ")}\n\n`
      : "";

    const contextText = `${identityBlock}═══ ACCOUNT PROFILE ═══\nHandle: @${feedData.profile.handle}\nDisplay Name: ${feedData.profile.displayName ?? feedData.profile.handle}\nBio: "${feedData.profile.bio ?? "N/A"}"\nFollowers: ${feedData.profile.followerCount.toLocaleString()}\nFollowing: ${feedData.profile.followingCount.toLocaleString()}\nTotal Posts: ${feedData.profile.postCount}\nImages analyzed: ${validImageParts.length}`;

    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      contextText,
      ...validImageParts,
    ]);

    const text = result.response.text();
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const scores: AestheticScores = {
      overall: clampScore(parsed.overall),
      color: clampScore(parsed.color),
      composition: clampScore(parsed.composition),
      toneConsistency: clampScore(parsed.toneConsistency),
      trend: clampScore(parsed.trend),
      styleOriginality: clampScore(parsed.styleOriginality),
    };

    const shortVector: number[] = parsed.vector ?? [];
    const aestheticVector = padVector(shortVector, 512);

    return {
      scores,
      representativeImages: imageUrls,
      aestheticVector,
      summary: parsed.summary ?? "",
      oneLiner: parsed.oneLiner ?? "",
      contentTopics: Array.isArray(parsed.contentTopics) ? parsed.contentTopics : [],
      aiSource: "gemini" as const,
    };
  } catch (error) {
    console.error("[scoring-engine] Gemini analysis failed:", error);
    throw error;
  }
}

// ─── OpenAI GPT-4o (paid fallback) ────────────────────────────

async function analyzeWithOpenAI(
  feedData: FeedData,
  apiKey: string,
  identityContext?: IdentityContext | null
): Promise<AnalysisResult> {
  // Dynamic import to avoid bundling openai when not used
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey });

  const selectedPosts = selectRepresentativePosts(feedData.posts, 20);
  const imageUrls = selectedPosts.map((post) => post.imageUrl);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ANALYSIS_PROMPT },
            ...imageUrls.map(
              (url) =>
                ({
                  type: "image_url" as const,
                  image_url: { url, detail: "low" as const },
                })
            ),
            {
              type: "text",
              text: `${identityContext ? `═══ CONFIRMED IDENTITY (GROUND TRUTH) ═══\n정체성: ${identityContext.identity}\n업종: ${identityContext.industry}\n타깃: ${identityContext.targetAudience}\n핵심 가치: ${identityContext.coreValues.join(", ")}\n\n` : ""}═══ ACCOUNT PROFILE ═══\nHandle: @${feedData.profile.handle}\nDisplay Name: ${feedData.profile.displayName ?? feedData.profile.handle}\nBio: "${feedData.profile.bio ?? "N/A"}"\nFollowers: ${feedData.profile.followerCount.toLocaleString()}\nFollowing: ${feedData.profile.followingCount.toLocaleString()}\nTotal Posts: ${feedData.profile.postCount}\nImages analyzed: ${selectedPosts.length}`,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content);

    const scores: AestheticScores = {
      overall: clampScore(parsed.overall),
      color: clampScore(parsed.color),
      composition: clampScore(parsed.composition),
      toneConsistency: clampScore(parsed.toneConsistency),
      trend: clampScore(parsed.trend),
      styleOriginality: clampScore(parsed.styleOriginality),
    };

    const shortVector: number[] = parsed.vector ?? [];
    const aestheticVector = padVector(shortVector, 512);

    return {
      scores,
      representativeImages: imageUrls,
      aestheticVector,
      summary: parsed.summary ?? "",
      oneLiner: parsed.oneLiner ?? "",
      contentTopics: Array.isArray(parsed.contentTopics) ? parsed.contentTopics : [],
      aiSource: "openai" as const,
    };
  } catch (error) {
    console.error("[scoring-engine] OpenAI analysis failed:", error);
    throw error;
  }
}

export { selectRepresentativePosts };

// ─── Moodboard Analysis (Brand) ──────────────────────────────

const MOODBOARD_PROMPT = `You are an expert brand identity analyst.
Analyze the following moodboard images and extract the brand's visual identity.

Score each dimension from 0-100:
1. **color** — Color harmony, palette consistency, saturation balance
2. **composition** — Visual balance, rule of thirds, leading lines, framing
3. **toneConsistency** — How consistent the visual tone is across all images
4. **trend** — How well the visual style aligns with current design trends
5. **styleOriginality** — Uniqueness of the brand's visual identity

Also provide:
- An **overall** brand aesthetic score (0-100)
- A **summary** in Korean (2-3 sentences) describing the brand's visual identity:
  - Name the dominant color palette
  - Identify the visual style direction
  - Suggest what type of influencer would match this brand
- A **vector** of 10 float values between 0 and 1:
  [warmth, saturation, contrast, minimalism, nature, urban, fashion, moody, bright, editorial]

Respond ONLY with valid JSON:
{
  "overall": number,
  "color": number,
  "composition": number,
  "toneConsistency": number,
  "trend": number,
  "styleOriginality": number,
  "summary": "string",
  "vector": [number, ...]
}`;

export async function analyzeMoodboard(
  imageBuffers: { data: string; mimeType: string }[]
): Promise<AnalysisResult> {
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (googleApiKey && imageBuffers.length > 0) {
    return analyzeMoodboardWithGemini(imageBuffers, googleApiKey);
  }

  throw new Error("무드보드 분석을 위해 GOOGLE_API_KEY가 필요합니다.");
}

async function analyzeMoodboardWithGemini(
  imageBuffers: { data: string; mimeType: string }[],
  apiKey: string
): Promise<AnalysisResult> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const imageParts = imageBuffers.map((img) => ({
      inlineData: { data: img.data, mimeType: img.mimeType },
    }));

    const result = await model.generateContent([
      MOODBOARD_PROMPT,
      ...imageParts,
      `Moodboard images: ${imageParts.length} images provided for brand identity analysis.`,
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const scores: AestheticScores = {
      overall: clampScore(parsed.overall),
      color: clampScore(parsed.color),
      composition: clampScore(parsed.composition),
      toneConsistency: clampScore(parsed.toneConsistency),
      trend: clampScore(parsed.trend),
      styleOriginality: clampScore(parsed.styleOriginality),
    };

    const shortVector: number[] = parsed.vector ?? [];
    const aestheticVector = padVector(shortVector, 512);

    return {
      scores,
      representativeImages: [],
      aestheticVector,
      summary: parsed.summary ?? "",
      oneLiner: "",
      contentTopics: [],
      aiSource: "gemini" as const,
    };
  } catch (error) {
    console.error("[scoring-engine] Moodboard Gemini analysis failed:", error);
    throw error;
  }
}

// ─── Shared utilities ──────────────────────────────────────────

function selectRepresentativePosts(
  posts: FeedPost[],
  count: number
): FeedPost[] {
  if (posts.length <= count) return posts;
  const step = Math.floor(posts.length / count);
  return Array.from({ length: count }, (_, i) => posts[i * step]);
}

function clampScore(value: unknown): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return 50;
  return Math.round(Math.max(0, Math.min(100, num)));
}

function padVector(shortVector: number[], targetLength: number): number[] {
  const result = new Array(targetLength).fill(0);
  for (let i = 0; i < Math.min(shortVector.length, targetLength); i++) {
    result[i] = shortVector[i];
  }
  return result;
}

