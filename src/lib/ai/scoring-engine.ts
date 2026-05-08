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

export interface AnalysisResult {
  scores: AestheticScores;
  representativeImages: string[];
  aestheticVector: number[];
  summary: string;
}

const ANALYSIS_PROMPT = `You are an expert visual aesthetics analyst for social media content.
Analyze the following Instagram feed images and provide a comprehensive aesthetic assessment.

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
  - Name the dominant color palette (e.g. "차분한 베이지-크림 톤", "채도 높은 네온 컬러")
  - Identify the content style (e.g. "미니멀 플랫레이 중심", "스트릿 스냅 위주", "감성 카페 투어")
  - State what kind of brand collaboration would fit (e.g. "클린뷰티/스킨케어 브랜드와 궁합이 좋을 피드", "스트리트 패션 브랜드 협업에 적합")
  - If there's a weakness, mention it briefly (e.g. "다만 최근 포스팅 톤이 다소 흔들리는 편")
  Do NOT use generic phrases like "일관된 톤과 독특한 미적 감각이 돋보이는 계정입니다" — be concrete.
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
  "vector": [number, number, number, number, number, number, number, number, number, number]
}`;

export async function analyzeAesthetics(
  feedData: FeedData
): Promise<AnalysisResult> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Priority: Gemini (free) > OpenAI (paid) > Mock
  if (googleApiKey) {
    return analyzeWithGemini(feedData, googleApiKey);
  }

  if (openaiApiKey) {
    return analyzeWithOpenAI(feedData, openaiApiKey);
  }

  return generateMockAnalysis(feedData);
}

// ─── Gemini 2.5 Flash (free tier) ──────────────────────────────

async function analyzeWithGemini(
  feedData: FeedData,
  apiKey: string
): Promise<AnalysisResult> {
  const selectedPosts = selectRepresentativePosts(feedData.posts, 6);
  const imageUrls = selectedPosts.map((post) => post.imageUrl);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

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
      console.error("[scoring-engine] No images could be fetched, falling back to mock");
      return generateMockAnalysis(feedData);
    }

    const contextText = `Account: @${feedData.profile.handle}\nBio: ${feedData.profile.bio ?? "N/A"}\nFollowers: ${feedData.profile.followerCount}\nPosts analyzed: ${validImageParts.length}`;

    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      ...validImageParts,
      contextText,
    ]);

    const text = result.response.text();
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const metadataBoost = calculateMetadataBoost(feedData);

    const scores: AestheticScores = {
      overall: clampScore(parsed.overall * 0.85 + metadataBoost * 0.15),
      color: clampScore(parsed.color),
      composition: clampScore(parsed.composition),
      toneConsistency: clampScore(parsed.toneConsistency),
      trend: clampScore(parsed.trend * 0.8 + metadataBoost * 0.2),
      styleOriginality: clampScore(parsed.styleOriginality),
    };

    const shortVector: number[] = parsed.vector ?? [];
    const aestheticVector = padVector(shortVector, 512);

    return {
      scores,
      representativeImages: imageUrls,
      aestheticVector,
      summary: parsed.summary ?? "",
    };
  } catch (error) {
    console.error("[scoring-engine] Gemini analysis failed, falling back to mock:", error);
    return generateMockAnalysis(feedData);
  }
}

// ─── OpenAI GPT-4o (paid fallback) ────────────────────────────

async function analyzeWithOpenAI(
  feedData: FeedData,
  apiKey: string
): Promise<AnalysisResult> {
  // Dynamic import to avoid bundling openai when not used
  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey });

  const selectedPosts = selectRepresentativePosts(feedData.posts, 6);
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
              text: `Account: @${feedData.profile.handle}\nBio: ${feedData.profile.bio ?? "N/A"}\nFollowers: ${feedData.profile.followerCount}\nPosts analyzed: ${selectedPosts.length}`,
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
    const metadataBoost = calculateMetadataBoost(feedData);

    const scores: AestheticScores = {
      overall: clampScore(parsed.overall * 0.85 + metadataBoost * 0.15),
      color: clampScore(parsed.color),
      composition: clampScore(parsed.composition),
      toneConsistency: clampScore(parsed.toneConsistency),
      trend: clampScore(parsed.trend * 0.8 + metadataBoost * 0.2),
      styleOriginality: clampScore(parsed.styleOriginality),
    };

    const shortVector: number[] = parsed.vector ?? [];
    const aestheticVector = padVector(shortVector, 512);

    return {
      scores,
      representativeImages: imageUrls,
      aestheticVector,
      summary: parsed.summary ?? "",
    };
  } catch (error) {
    console.error("[scoring-engine] OpenAI analysis failed, falling back to mock:", error);
    return generateMockAnalysis(feedData);
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

function calculateMetadataBoost(feedData: FeedData): number {
  const { posts, profile } = feedData;
  if (posts.length === 0) return 50;

  const totalEngagement = posts.reduce(
    (sum, post) => sum + post.likeCount + post.commentCount,
    0
  );
  const avgEngagement = totalEngagement / posts.length;
  const engagementRate =
    profile.followerCount > 0 ? avgEngagement / profile.followerCount : 0;
  const engagementScore = Math.min(engagementRate * 1000, 100);
  const postCount = posts.length;
  const consistencyBonus = postCount >= 12 ? 10 : (postCount / 12) * 10;

  return Math.min(engagementScore + consistencyBonus, 100);
}

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function padVector(shortVector: number[], targetLength: number): number[] {
  const result = new Array(targetLength).fill(0);
  for (let i = 0; i < Math.min(shortVector.length, targetLength); i++) {
    result[i] = shortVector[i];
  }
  return result;
}

function generateMockAnalysis(feedData: FeedData): AnalysisResult {
  const handle = feedData.profile.handle;
  const seed = handle
    .split("")
    .reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0);
  const s = Math.abs(seed);

  const color = 65 + (s % 30);
  const composition = 60 + ((s * 7) % 35);
  const toneConsistency = 55 + ((s * 13) % 40);
  const trend = 60 + ((s * 17) % 30);
  const styleOriginality = 58 + ((s * 23) % 35);
  const overall = Math.round(
    color * 0.2 +
      composition * 0.2 +
      toneConsistency * 0.25 +
      trend * 0.15 +
      styleOriginality * 0.2
  );

  const vector = Array.from({ length: 10 }, (_, i) =>
    Number(((s * (i + 1) * 0.1) % 1).toFixed(3))
  );

  return {
    scores: { overall, color, composition, toneConsistency, trend, styleOriginality },
    representativeImages: feedData.posts.slice(0, 6).map((p) => p.imageUrl),
    aestheticVector: padVector(vector, 512),
    summary: generateMockSummary(feedData),
  };
}

function generateMockSummary(feedData: FeedData): string {
  const { handle, followerCount } = feedData.profile;
  const hashtags = feedData.posts.flatMap((p) => p.hashtags);
  const hashtagSet = new Set(hashtags.map((h) => h.toLowerCase()));

  const palettes = ["웜톤 베이지-브라운", "쿨톤 블루-그레이", "고채도 비비드 컬러", "무채색 모노톤", "파스텔 핑크-라벤더"];
  const styles = ["미니멀 플랫레이 중심", "라이프스타일 스냅 위주", "감성 카페·공간 투어형", "OOTD 스트릿 스냅 중심", "제품 클로즈업 위주"];
  const fits = [
    "클린뷰티·스킨케어 브랜드와 궁합이 좋을 피드",
    "F&B·카페 브랜드 협업에 적합한 분위기",
    "스트리트 패션·스니커즈 브랜드에 어울리는 무드",
    "리빙·인테리어 브랜드 콜라보에 적합",
    "프리미엄 뷰티·향수 브랜드와 톤이 맞는 계정",
  ];

  const seed = handle.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
  const s = Math.abs(seed);

  const palette = palettes[s % palettes.length];
  const style = styles[(s * 7) % styles.length];
  const fit = fits[(s * 13) % fits.length];

  const sizeLabel = followerCount >= 100000 ? "매크로" : followerCount >= 10000 ? "마이크로" : "나노";

  const hasFashion = hashtagSet.has("fashion") || hashtagSet.has("ootd") || hashtagSet.has("패션");
  const hasFood = hashtagSet.has("food") || hashtagSet.has("cafe") || hashtagSet.has("맛집");

  let detail = "";
  if (hasFashion) detail = " 패션 콘텐츠 비중이 높아 의류·액세서리 캠페인에 즉시 활용 가능.";
  else if (hasFood) detail = " 음식·공간 콘텐츠가 강점이라 F&B 브랜드 시딩에 효과적.";

  return `${palette} 팔레트의 ${style}으로 구성된 ${sizeLabel} 인플루언서. ${fit}.${detail}`;
}
