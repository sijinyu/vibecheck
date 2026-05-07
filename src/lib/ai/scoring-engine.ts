import OpenAI from "openai";
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
- A brief **summary** (1-2 sentences in Korean) describing the account's aesthetic vibe
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
  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, use mock scoring
  if (!apiKey) {
    return generateMockAnalysis(feedData);
  }

  const openai = new OpenAI({ apiKey });

  // Select up to 6 representative images for Vision API (cost optimization)
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
    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = JSON.parse(content);

    // Apply metadata boost (engagement rate influence)
    const metadataBoost = calculateMetadataBoost(feedData);

    const scores: AestheticScores = {
      overall: clampScore(parsed.overall * 0.85 + metadataBoost * 0.15),
      color: clampScore(parsed.color),
      composition: clampScore(parsed.composition),
      toneConsistency: clampScore(parsed.toneConsistency),
      trend: clampScore(parsed.trend * 0.8 + metadataBoost * 0.2),
      styleOriginality: clampScore(parsed.styleOriginality),
    };

    // Pad vector to 512 dimensions for pgvector compatibility
    const shortVector: number[] = parsed.vector ?? [];
    const aestheticVector = padVector(shortVector, 512);

    return {
      scores,
      representativeImages: imageUrls,
      aestheticVector,
      summary: parsed.summary ?? "",
    };
  } catch (error) {
    console.error("AI analysis failed, falling back to mock:", error);
    return generateMockAnalysis(feedData);
  }
}

function selectRepresentativePosts(
  posts: FeedPost[],
  count: number
): FeedPost[] {
  if (posts.length <= count) return posts;

  // Select evenly spaced posts for representative sample
  const step = Math.floor(posts.length / count);
  return Array.from({ length: count }, (_, i) => posts[i * step]);
}

function calculateMetadataBoost(feedData: FeedData): number {
  const { posts, profile } = feedData;
  if (posts.length === 0) return 50;

  // Average engagement rate
  const totalEngagement = posts.reduce(
    (sum, post) => sum + post.likeCount + post.commentCount,
    0
  );
  const avgEngagement = totalEngagement / posts.length;
  const engagementRate =
    profile.followerCount > 0 ? avgEngagement / profile.followerCount : 0;

  // High engagement rate = higher trend/relevance score
  // Typical good engagement: 3-6% for micro-influencers
  const engagementScore = Math.min(engagementRate * 1000, 100);

  // Posting consistency bonus
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
    summary: `@${handle}의 피드는 일관된 톤과 독특한 미적 감각이 돋보이는 계정입니다.`,
  };
}
