#!/usr/bin/env npx tsx
/**
 * Cold Start Seed Crawler
 *
 * 실제 Instagram API + Gemini AI 분석으로 인플루언서 데이터를 DB에 시드합니다.
 * 앱 서버 없이 독립 실행 가능합니다.
 *
 * Usage:
 *   npx tsx scripts/seed-crawler.ts
 *   npx tsx scripts/seed-crawler.ts --dry-run         # DB 저장 없이 테스트
 *   npx tsx scripts/seed-crawler.ts --category Fashion # 특정 카테고리만
 *
 * Prerequisites:
 *   - .env.local에 RAPIDAPI_KEY, GOOGLE_API_KEY, SUPABASE 키 설정
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

// ─── Config ──────────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DRY_RUN = process.argv.includes("--dry-run");
const CATEGORY_FILTER = (() => {
  const idx = process.argv.indexOf("--category");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// Rate limiting delays (ms) — Gemini free tier: 15 RPM, 1M input tokens/min
const DELAY_BETWEEN_HANDLES = 5000;
const DELAY_BETWEEN_AI = 5000;
const BATCH_PAUSE = 15000; // every 5 handles
const AI_IMAGE_COUNT = 8; // fewer images = less token usage per request

// ─── Seed Handle List ────────────────────────────────────────

interface SeedEntry {
  handle: string;
  platform: "instagram" | "tiktok";
  category: string;
}

const SEED_HANDLES: SeedEntry[] = [
  // ── Fashion (10) ──
  { handle: "stylenanda_official", platform: "instagram", category: "Fashion" },
  { handle: "imvely_official", platform: "instagram", category: "Fashion" },
  { handle: "chuu_official", platform: "instagram", category: "Fashion" },
  { handle: "minsco", platform: "instagram", category: "Fashion" },
  { handle: "dear.zia", platform: "instagram", category: "Fashion" },
  { handle: "w_n_y_c", platform: "instagram", category: "Fashion" },
  { handle: "ireneeisgood", platform: "instagram", category: "Fashion" },
  { handle: "leesle_official", platform: "instagram", category: "Fashion" },
  { handle: "kimhekim_official", platform: "instagram", category: "Fashion" },
  { handle: "blindness_official", platform: "instagram", category: "Fashion" },

  // ── Beauty (10) ──
  { handle: "pfrankmd", platform: "instagram", category: "Beauty" },
  { handle: "risabae_art", platform: "instagram", category: "Beauty" },
  { handle: "lamuqe", platform: "instagram", category: "Beauty" },
  { handle: "heizle_", platform: "instagram", category: "Beauty" },
  { handle: "ssinnim", platform: "instagram", category: "Beauty" },
  { handle: "innisfreeofficial", platform: "instagram", category: "Beauty" },
  { handle: "romaboromance", platform: "instagram", category: "Beauty" },
  { handle: "tamburins_official", platform: "instagram", category: "Beauty" },
  { handle: "hera_seoulista", platform: "instagram", category: "Beauty" },
  { handle: "laboratoryhofficial", platform: "instagram", category: "Beauty" },

  // ── Food (10) ──
  { handle: "buzzfeedtasty", platform: "instagram", category: "Food" },
  { handle: "minimalistbaker", platform: "instagram", category: "Food" },
  { handle: "baek_jongwon", platform: "instagram", category: "Food" },
  { handle: "sulbing_official", platform: "instagram", category: "Food" },
  { handle: "bbq.official", platform: "instagram", category: "Food" },
  { handle: "tous_les_jours", platform: "instagram", category: "Food" },
  { handle: "cj_cheiljedang", platform: "instagram", category: "Food" },
  { handle: "theborn_korea", platform: "instagram", category: "Food" },
  { handle: "bonif_official", platform: "instagram", category: "Food" },
  { handle: "eggdrop_official", platform: "instagram", category: "Food" },

  // ── Travel (8) ──
  { handle: "doyoutravel", platform: "instagram", category: "Travel" },
  { handle: "chris_burkard", platform: "instagram", category: "Travel" },
  { handle: "visitkorea", platform: "instagram", category: "Travel" },
  { handle: "visitjeju_kr", platform: "instagram", category: "Travel" },
  { handle: "muradosmann", platform: "instagram", category: "Travel" },
  { handle: "gypsea_lust", platform: "instagram", category: "Travel" },
  { handle: "earthpix", platform: "instagram", category: "Travel" },
  { handle: "beautifuldestinations", platform: "instagram", category: "Travel" },

  // ── Lifestyle (8) ──
  { handle: "kinfolk", platform: "instagram", category: "Lifestyle" },
  { handle: "aesaboromance", platform: "instagram", category: "Lifestyle" },
  { handle: "muji_global", platform: "instagram", category: "Lifestyle" },
  { handle: "gentlemonster", platform: "instagram", category: "Lifestyle" },
  { handle: "granhand_official", platform: "instagram", category: "Lifestyle" },
  { handle: "nonfiction_official", platform: "instagram", category: "Lifestyle" },
  { handle: "byredo", platform: "instagram", category: "Lifestyle" },
  { handle: "diptyque", platform: "instagram", category: "Lifestyle" },

  // ── Fitness (6) ──
  { handle: "kaaborfit", platform: "instagram", category: "Fitness" },
  { handle: "blogilates", platform: "instagram", category: "Fitness" },
  { handle: "yoga_girl", platform: "instagram", category: "Fitness" },
  { handle: "lululemon", platform: "instagram", category: "Fitness" },
  { handle: "nike", platform: "instagram", category: "Fitness" },
  { handle: "adidas", platform: "instagram", category: "Fitness" },

  // ── Art & Design (6) ──
  { handle: "designmilk", platform: "instagram", category: "Art" },
  { handle: "pantone", platform: "instagram", category: "Art" },
  { handle: "designboom", platform: "instagram", category: "Art" },
  { handle: "amorepacific_official", platform: "instagram", category: "Art" },
  { handle: "hyundaicard", platform: "instagram", category: "Art" },
  { handle: "dailyoverview", platform: "instagram", category: "Art" },

  // ── TikTok (6) ──
  { handle: "charlidamelio", platform: "tiktok", category: "Dance" },
  { handle: "addisonre", platform: "tiktok", category: "Lifestyle" },
  { handle: "bellapoarch", platform: "tiktok", category: "Music" },
  { handle: "zachking", platform: "tiktok", category: "Entertainment" },
  { handle: "khloekardashian", platform: "tiktok", category: "Lifestyle" },
  { handle: "bfrankieee", platform: "tiktok", category: "Dance" },
];

// ─── Types ───────────────────────────────────────────────────

interface ProfileData {
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string;
  profileImageUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

interface FeedPost {
  imageUrl: string;
  caption: string;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  timestamp: string;
  shareCount?: number;
  playCount?: number;
  postType?: string;
  shortcode?: string;
}

interface FeedData {
  profile: ProfileData;
  posts: FeedPost[];
}

interface AestheticScores {
  overall: number;
  color: number;
  composition: number;
  toneConsistency: number;
  trend: number;
  styleOriginality: number;
}

interface AiAnalysis {
  scores: AestheticScores;
  summary: string;
  oneLiner: string;
  contentTopics: string[];
  vector: number[];
  representativeImages: string[];
}

// ─── Instagram Fetcher ───────────────────────────────────────

const PRIMARY_HOST = "instagram120.p.rapidapi.com";
const FALLBACK_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

function parseIg120Post(node: any): FeedPost | null {
  const imageUrl =
    node.image_versions2?.candidates?.[0]?.url ??
    node.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ??
    null;
  if (!imageUrl) return null;

  const captionText = node.caption?.text ?? "";
  const hashtags = (captionText.match(/#[\w\uAC00-\uD7A3]+/g) ?? []) as string[];

  return {
    imageUrl,
    caption: captionText,
    hashtags: hashtags.map((h) => h.replace("#", "")),
    likeCount: node.like_count ?? 0,
    commentCount: node.comment_count ?? 0,
    timestamp: new Date((node.taken_at ?? 0) * 1000).toISOString(),
    shortcode: node.code ?? undefined,
  };
}

async function fetchInstagram(handle: string): Promise<FeedData | null> {
  const headers = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": PRIMARY_HOST,
    "Content-Type": "application/json",
  };

  try {
    const [postsRes, profileRes] = await Promise.all([
      fetch(`https://${PRIMARY_HOST}/api/instagram/posts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: handle, amount: 50 }),
      }),
      fetch(`https://${PRIMARY_HOST}/api/instagram/profile`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: handle }),
      }),
    ]);

    if (!postsRes.ok) return fetchInstagramFallback(handle);

    const postsJson: any = await postsRes.json();
    const edges: any[] = postsJson.result?.edges ?? [];
    if (edges.length === 0) return fetchInstagramFallback(handle);

    let profileData: any = null;
    if (profileRes.ok) {
      const pJson: any = await profileRes.json();
      profileData = pJson.result ?? null;
    }

    const firstUser = edges[0]?.node?.user;
    const profile: ProfileData = {
      handle,
      platform: "instagram",
      displayName: profileData?.full_name ?? firstUser?.full_name ?? handle,
      profileImageUrl: profileData?.profile_pic_url_hd ?? profileData?.profile_pic_url ?? firstUser?.profile_pic_url ?? null,
      bio: profileData?.biography ?? null,
      followerCount: profileData?.edge_followed_by?.count ?? 0,
      followingCount: profileData?.edge_follow?.count ?? 0,
      postCount: profileData?.edge_owner_to_timeline_media?.count ?? edges.length,
    };

    const posts = edges
      .map((edge: any) => parseIg120Post(edge.node))
      .filter((p): p is FeedPost => p !== null);

    return { profile, posts };
  } catch (error) {
    console.error(`  [fetch] Primary API error for @${handle}:`, error);
    return fetchInstagramFallback(handle);
  }
}

async function fetchInstagramFallback(handle: string): Promise<FeedData | null> {
  try {
    const res = await fetch(`https://${FALLBACK_HOST}/get_ig_user_posts.php`, {
      method: "POST",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": FALLBACK_HOST,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username_or_url: `https://www.instagram.com/${handle}/`,
        pagination_token: "",
        amount: "50",
      }),
    });

    if (!res.ok) return null;
    const json: any = await res.json();
    if (!json.posts || json.posts.length === 0) return null;

    const firstUser = json.posts[0]?.node?.user;
    const profile: ProfileData = {
      handle,
      platform: "instagram",
      displayName: firstUser?.full_name ?? handle,
      profileImageUrl: firstUser?.profile_pic_url ?? null,
      bio: json.user?.biography ?? null,
      followerCount: json.user?.follower_count ?? 0,
      followingCount: json.user?.following_count ?? 0,
      postCount: json.user?.media_count ?? json.posts.length,
    };

    const posts = json.posts
      .map((p: any) => parseIg120Post(p.node))
      .filter((p: any): p is FeedPost => p !== null);

    return { profile, posts };
  } catch (error) {
    console.error(`  [fetch] Fallback error for @${handle}:`, error);
    return null;
  }
}

// ─── TikTok Fetcher ──────────────────────────────────────────

async function fetchTikTok(handle: string): Promise<FeedData | null> {
  try {
    const res = await fetch(
      `https://tiktok-scraper7.p.rapidapi.com/user/posts?user_id=${handle}&count=50`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
        },
      }
    );

    if (!res.ok) return null;
    const json: any = await res.json();
    const videos: any[] = json.data?.videos ?? [];
    if (videos.length === 0) return null;

    const author = videos[0]?.author ?? {};
    const profile: ProfileData = {
      handle,
      platform: "tiktok",
      displayName: author.nickname ?? handle,
      profileImageUrl: author.avatar ?? null,
      bio: author.signature ?? null,
      followerCount: author.followers ?? 0,
      followingCount: author.following ?? 0,
      postCount: videos.length,
    };

    const posts: FeedPost[] = videos
      .map((v: any): FeedPost | null => {
        const cover = v.cover ?? v.origin_cover;
        if (!cover) return null;
        const desc = v.title ?? "";
        const hashtags = (desc.match(/#[\w\uAC00-\uD7A3]+/g) ?? []) as string[];
        return {
          imageUrl: cover,
          caption: desc,
          hashtags: hashtags.map((h: string) => h.replace("#", "")),
          likeCount: v.digg_count ?? 0,
          commentCount: v.comment_count ?? 0,
          shareCount: v.share_count ?? 0,
          playCount: v.play_count ?? 0,
          timestamp: new Date((v.create_time ?? 0) * 1000).toISOString(),
          postType: "video",
        };
      })
      .filter((p): p is FeedPost => p !== null);

    return { profile, posts };
  } catch (error) {
    console.error(`  [fetch] TikTok error for @${handle}:`, error);
    return null;
  }
}

// ─── Gemini AI Analysis ──────────────────────────────────────

const ANALYSIS_PROMPT = `You are an expert visual aesthetics analyst for social media content.
Analyze the following Instagram account and provide a comprehensive aesthetic assessment.

## CRITICAL: Read the account's BIO and PROFILE info provided below the images.

Score each dimension from 0-100:
1. **color** — Color harmony, palette consistency, saturation balance
2. **composition** — Visual balance, rule of thirds, leading lines, framing
3. **toneConsistency** — How consistent the visual tone is across all posts
4. **trend** — How well the content aligns with current visual trends
5. **styleOriginality** — Uniqueness of visual style, distinctive aesthetic identity

Also provide:
- An **overall** aesthetic score (0-100)
- A **summary** in Korean (2-3 sentences) — brief for brand marketers
- A **oneLiner** in Korean: One punchy sentence (max 40 chars)
- A **contentTopics** array of 3-5 specific content sub-topics (in Korean)
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
  "oneLiner": "string",
  "contentTopics": ["string", "string", "string"],
  "vector": [number, number, number, number, number, number, number, number, number, number]
}`;

// Gemini models — try multiple models to work around per-model daily quotas
// Each model has its own separate daily quota on the free tier
const GEMINI_MODELS = [
  "gemini-2.0-flash",        // 1500 RPD free, 15 RPM
  "gemini-2.5-flash",        // 20 RPD free, 10 RPM (best quality)
  "gemini-2.0-flash-lite",   // separate quota, fast
  "gemini-2.5-flash-lite",   // separate quota
];
const MAX_RETRIES = 3;

function extractRetryDelay(error: any): number | null {
  const details = error?.errorDetails;
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d?.retryDelay) {
        const match = String(d.retryDelay).match(/(\d+)/);
        if (match) return (parseInt(match[1], 10) + 2) * 1000;
      }
    }
  }
  const msg = String(error?.message ?? error ?? "");
  const retryMatch = msg.match(/retry in (\d+)/i);
  if (retryMatch) return (parseInt(retryMatch[1], 10) + 2) * 1000;
  return null;
}

async function analyzeWithGemini(feedData: FeedData): Promise<AiAnalysis | null> {
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

  const selectedPosts = selectRepresentativePosts(feedData.posts, AI_IMAGE_COUNT);
  const imageUrls = selectedPosts.map((p) => p.imageUrl);

  // Fetch images as base64
  const imageParts = await Promise.all(
    imageUrls.map(async (url) => {
      try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = res.headers.get("content-type") ?? "image/jpeg";
        return { inlineData: { data: base64, mimeType } };
      } catch {
        return null;
      }
    })
  );

  const validParts = imageParts.filter((p): p is NonNullable<typeof p> => p !== null);
  if (validParts.length === 0) {
    console.error("  [ai] No images fetched");
    return null;
  }

  const contextText = [
    `═══ ACCOUNT PROFILE ═══`,
    `Handle: @${feedData.profile.handle}`,
    `Display Name: ${feedData.profile.displayName}`,
    `Bio: "${feedData.profile.bio ?? "N/A"}"`,
    `Followers: ${feedData.profile.followerCount.toLocaleString()}`,
    `Following: ${feedData.profile.followingCount.toLocaleString()}`,
    `Total Posts: ${feedData.profile.postCount}`,
    `Images analyzed: ${validParts.length}`,
  ].join("\n");

  // Try each model, falling back on quota exhaustion
  for (const modelName of GEMINI_MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent([ANALYSIS_PROMPT, contextText, ...validParts]);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("  [ai] No JSON in response");
          return null;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
          scores: {
            overall: clamp(parsed.overall ?? 50),
            color: clamp(parsed.color ?? 50),
            composition: clamp(parsed.composition ?? 50),
            toneConsistency: clamp(parsed.toneConsistency ?? 50),
            trend: clamp(parsed.trend ?? 50),
            styleOriginality: clamp(parsed.styleOriginality ?? 50),
          },
          summary: parsed.summary ?? "",
          oneLiner: parsed.oneLiner ?? "",
          contentTopics: Array.isArray(parsed.contentTopics) ? parsed.contentTopics : [],
          vector: Array.isArray(parsed.vector) ? parsed.vector : [],
          representativeImages: imageUrls.slice(0, 10),
        };
      } catch (error: any) {
        const status = error?.status ?? error?.statusCode;
        const isDailyQuota = String(error?.message ?? "").includes("PerDay");

        // Daily quota exhausted → skip to next model immediately
        if (status === 429 && isDailyQuota) {
          console.log(`  [ai] ${modelName} daily quota exhausted, trying next model...`);
          break; // break retry loop, try next model
        }

        // Per-minute rate limit → wait and retry same model
        if (status === 429 && attempt < MAX_RETRIES) {
          const retryMs = extractRetryDelay(error) ?? 15_000 + attempt * 10_000;
          console.log(`  [ai] ${modelName} rate limited. Waiting ${Math.round(retryMs / 1000)}s (retry ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(retryMs);
          continue;
        }

        // 503 Service Unavailable → wait briefly and retry
        if (status === 503 && attempt < MAX_RETRIES) {
          console.log(`  [ai] ${modelName} overloaded (503). Waiting 10s (retry ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(10_000);
          continue;
        }

        console.error(`  [ai] ${modelName} error (attempt ${attempt}/${MAX_RETRIES}):`, error?.message?.slice(0, 150) ?? error);
        if (attempt === MAX_RETRIES) break; // try next model
      }
    }
  }

  console.error("  [ai] All Gemini models exhausted");
  return null;
}

// ─── VibeScore Calculator ────────────────────────────────────

type InfluencerTier = "nano" | "micro" | "mid" | "macro" | "mega";

const BENCHMARKS: Record<string, Record<InfluencerTier, number>> = {
  instagram: { nano: 0.045, micro: 0.028, mid: 0.018, macro: 0.013, mega: 0.008 },
  tiktok: { nano: 0.10, micro: 0.06, mid: 0.04, macro: 0.025, mega: 0.015 },
};

function determineTier(followers: number): InfluencerTier {
  if (followers >= 1_000_000) return "mega";
  if (followers >= 100_000) return "macro";
  if (followers >= 50_000) return "mid";
  if (followers >= 10_000) return "micro";
  return "nano";
}

function computeVibeScore(feedData: FeedData, scores: AestheticScores) {
  const { posts, profile } = feedData;
  const tier = determineTier(profile.followerCount);
  const platform = profile.platform;

  // Engagement
  const avgLikes = posts.length > 0 ? posts.reduce((s, p) => s + p.likeCount, 0) / posts.length : 0;
  const avgComments = posts.length > 0 ? posts.reduce((s, p) => s + p.commentCount, 0) / posts.length : 0;
  const avgShares = posts.length > 0 ? posts.reduce((s, p) => s + (p.shareCount ?? 0), 0) / posts.length : 0;
  const avgPlays = posts.length > 0 ? posts.reduce((s, p) => s + (p.playCount ?? 0), 0) / posts.length : 0;

  const engagementRate = profile.followerCount > 0
    ? (avgLikes + avgComments * 2) / profile.followerCount
    : 0;

  const benchmark = BENCHMARKS[platform]?.[tier] ?? 0.02;
  const erRatio = benchmark > 0 ? engagementRate / benchmark : 1;
  const engagementScore = clamp(50 * erRatio);

  // Consistency
  let consistencyScore = 50;
  let postingFrequencyDays = 0;
  if (posts.length >= 2) {
    const ts = posts.map((p) => new Date(p.timestamp).getTime()).sort((a, b) => b - a);
    const intervals: number[] = [];
    for (let i = 0; i < ts.length - 1; i++) {
      intervals.push((ts[i] - ts[i + 1]) / (1000 * 60 * 60 * 24));
    }
    const avgInterval = intervals.reduce((s, d) => s + d, 0) / intervals.length;
    postingFrequencyDays = Math.round(avgInterval * 10) / 10;
    const variance = intervals.reduce((s, d) => s + Math.pow(d - avgInterval, 2), 0) / intervals.length;
    const cv = avgInterval > 0 ? Math.sqrt(variance) / avgInterval : 1;
    consistencyScore = clamp(100 - cv * 50) * 0.5 + scores.toneConsistency * 0.5;
  }

  // Growth
  let growthScore = 50;
  let trendDirection: "rising" | "stable" | "declining" = "stable";
  let trendMagnitude = 0;
  const ffRatio = profile.followingCount > 0 ? profile.followerCount / profile.followingCount : (profile.followerCount > 0 ? 10 : 1);
  const authority = clamp(Math.log10(ffRatio + 1) * 40);

  if (posts.length >= 4) {
    const sorted = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const mid = Math.floor(sorted.length / 2);
    const recentEng = sorted.slice(0, mid).reduce((s, p) => s + p.likeCount + p.commentCount, 0) / mid;
    const olderEng = sorted.slice(mid).reduce((s, p) => s + p.likeCount + p.commentCount, 0) / (sorted.length - mid);
    if (olderEng > 0) {
      const growth = (recentEng - olderEng) / olderEng;
      trendMagnitude = Math.round(Math.abs(growth) * 100);
      trendDirection = growth > 0.1 ? "rising" : growth < -0.1 ? "declining" : "stable";
      growthScore = clamp(authority * 0.3 + clamp(50 + growth * 100) * 0.4 + scores.trend * 0.3);
    }
  }

  // Authenticity
  let authenticityScore = 100;
  if (profile.followerCount > 0) {
    const likeRatio = avgLikes / profile.followerCount;
    if (likeRatio < 0.005 && profile.followerCount > 10000) authenticityScore -= 25;
    const ffr = profile.followingCount / profile.followerCount;
    if (ffr > 2) authenticityScore -= 20;
    else if (ffr > 1.5) authenticityScore -= 10;
    if (profile.followerCount > 50000 && avgComments < 5) authenticityScore -= 20;
  }
  authenticityScore = clamp(authenticityScore);

  // Hashtags
  const hashCounts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.hashtags) {
      const lower = tag.toLowerCase();
      hashCounts.set(lower, (hashCounts.get(lower) ?? 0) + 1);
    }
  }
  const topHashtags = Array.from(hashCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  // Composite
  const vibeScore = Math.round(
    scores.overall * 0.25 +
    engagementScore * 0.30 +
    consistencyScore * 0.15 +
    growthScore * 0.15 +
    authenticityScore * 0.15
  );

  return {
    vibeScore: clamp(vibeScore),
    engagementScore: Math.round(engagementScore),
    consistencyScore: Math.round(consistencyScore),
    growthPotentialScore: Math.round(growthScore),
    authenticityScore: Math.round(authenticityScore),
    tier,
    engagementRate: Math.round(engagementRate * 10000) / 10000,
    avgLikesPerPost: Math.round(avgLikes),
    avgCommentsPerPost: Math.round(avgComments),
    avgSharesPerPost: Math.round(avgShares),
    avgPlaysPerPost: Math.round(avgPlays),
    postingFrequencyDays,
    topHashtags,
    trendDirection,
    trendMagnitude,
    platformBenchmark: benchmark,
  };
}

// ─── Utilities ───────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function selectRepresentativePosts(posts: FeedPost[], count: number): FeedPost[] {
  if (posts.length <= count) return posts;
  const step = Math.floor(posts.length / count);
  return Array.from({ length: count }, (_, i) => posts[i * step]);
}

function padVector(shortVector: number[], targetLength: number): number[] {
  const result = new Array(targetLength).fill(0);
  for (let i = 0; i < Math.min(shortVector.length, targetLength); i++) {
    result[i] = shortVector[i];
  }
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── DB Upsert ───────────────────────────────────────────────

async function upsertToDb(
  supabase: any,
  feedData: FeedData,
  analysis: AiAnalysis,
  vibeResult: ReturnType<typeof computeVibeScore>,
  category: string
): Promise<{ id: string } | null> {
  const aestheticVector = padVector(analysis.vector, 512);

  const postPerformances = feedData.posts.slice(0, 30).map((p) => {
    const totalEng = p.likeCount + p.commentCount + (p.shareCount ?? 0);
    const er = feedData.profile.followerCount > 0 ? totalEng / feedData.profile.followerCount : 0;
    return {
      imageUrl: p.imageUrl,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount ?? 0,
      caption: p.caption.slice(0, 200),
      hashtags: p.hashtags,
      timestamp: p.timestamp,
      postType: p.postType ?? "image",
      engagementRate: Math.round(er * 10000) / 10000,
      shortcode: p.shortcode,
    };
  });

  const { data: row, error } = await supabase
    .from("influencers")
    .upsert(
      {
        handle: feedData.profile.handle,
        platform: feedData.profile.platform,
        display_name: feedData.profile.displayName,
        profile_image_url: feedData.profile.profileImageUrl,
        bio: feedData.profile.bio,
        follower_count: feedData.profile.followerCount,
        following_count: feedData.profile.followingCount,
        aesthetic_vector: aestheticVector,
        aesthetic_score: analysis.scores.overall,
        color_score: analysis.scores.color,
        composition_score: analysis.scores.composition,
        tone_consistency_score: analysis.scores.toneConsistency,
        trend_score: analysis.scores.trend,
        vibe_score: vibeResult.vibeScore,
        engagement_score: vibeResult.engagementScore,
        consistency_score: vibeResult.consistencyScore,
        growth_potential_score: vibeResult.growthPotentialScore,
        authenticity_score: vibeResult.authenticityScore,
        tier: vibeResult.tier,
        avg_likes_per_post: vibeResult.avgLikesPerPost,
        avg_comments_per_post: vibeResult.avgCommentsPerPost,
        engagement_rate: vibeResult.engagementRate,
        posting_frequency_days: vibeResult.postingFrequencyDays,
        top_hashtags: vibeResult.topHashtags,
        content_categories: [category],
        post_performances: postPerformances,
        trend_direction: vibeResult.trendDirection,
        trend_magnitude: vibeResult.trendMagnitude,
        avg_shares_per_post: vibeResult.avgSharesPerPost,
        avg_plays_per_post: vibeResult.avgPlaysPerPost,
        platform_benchmark: vibeResult.platformBenchmark,
        category,
        representative_images: analysis.representativeImages,
        one_liner: analysis.oneLiner || null,
        content_topics: analysis.contentTopics,
        data_source: "live",
        ai_source: "gemini",
        last_analyzed_at: new Date().toISOString(),
      },
      { onConflict: "handle,platform" }
    )
    .select("id")
    .single();

  if (error) {
    console.error(`  [db] Upsert error:`, error.message);
    return null;
  }
  return row;
}

// ─── Main ────────────────────────────────────────────────────

interface CrawlResult {
  handle: string;
  platform: string;
  category: string;
  status: "success" | "skip_fetch" | "skip_ai" | "error";
  vibeScore?: number;
  followers?: number;
  error?: string;
}

async function main() {
  // Validate env
  const missing: string[] = [];
  if (!RAPIDAPI_KEY) missing.push("RAPIDAPI_KEY");
  if (!GOOGLE_API_KEY) missing.push("GOOGLE_API_KEY");
  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
    missing.push("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  const supabase = DRY_RUN
    ? null
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

  // Filter handles
  let handles = SEED_HANDLES;
  if (CATEGORY_FILTER) {
    handles = handles.filter(
      (h) => h.category.toLowerCase() === CATEGORY_FILTER.toLowerCase()
    );
    if (handles.length === 0) {
      const cats = Array.from(new Set(SEED_HANDLES.map((h) => h.category)));
      console.error(`No handles for category: ${CATEGORY_FILTER}`);
      console.error(`Available: ${cats.join(", ")}`);
      process.exit(1);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  VibeCheck Cold Start Seed Crawler`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Handles:  ${handles.length}`);
  console.log(`  Mode:     ${DRY_RUN ? "DRY RUN (no DB writes)" : "LIVE (writing to DB)"}`);
  if (CATEGORY_FILTER) console.log(`  Filter:   ${CATEGORY_FILTER}`);
  console.log(`  API:      RapidAPI + Gemini (${GEMINI_MODELS.join(" → ")})`);
  console.log(`${"=".repeat(60)}\n`);

  const results: CrawlResult[] = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < handles.length; i++) {
    const entry = handles[i];
    const tag = `[${i + 1}/${handles.length}]`;

    try {
      // Step 1: Fetch feed
      console.log(`${tag} Fetching @${entry.handle} (${entry.platform})...`);

      const feedData = entry.platform === "tiktok"
        ? await fetchTikTok(entry.handle)
        : await fetchInstagram(entry.handle);

      if (!feedData || feedData.posts.length === 0) {
        console.log(`${tag}   SKIP: No feed data`);
        results.push({ handle: entry.handle, platform: entry.platform, category: entry.category, status: "skip_fetch" });
        skipCount++;
        await sleep(DELAY_BETWEEN_HANDLES);
        continue;
      }

      console.log(`${tag}   Feed: ${feedData.posts.length} posts, ${feedData.profile.followerCount.toLocaleString()} followers`);

      // Step 2: AI Analysis
      await sleep(DELAY_BETWEEN_AI);
      console.log(`${tag}   Analyzing with Gemini...`);

      const analysis = await analyzeWithGemini(feedData);
      if (!analysis) {
        console.log(`${tag}   SKIP: AI analysis failed`);
        results.push({ handle: entry.handle, platform: entry.platform, category: entry.category, status: "skip_ai" });
        skipCount++;
        await sleep(DELAY_BETWEEN_HANDLES);
        continue;
      }

      // Step 3: VibeScore
      const vibeResult = computeVibeScore(feedData, analysis.scores);
      console.log(`${tag}   VibeScore: ${vibeResult.vibeScore} | Aesthetic: ${analysis.scores.overall} | ER: ${vibeResult.engagementScore} | Tier: ${vibeResult.tier}`);

      // Step 4: DB
      if (!DRY_RUN && supabase) {
        const row = await upsertToDb(supabase, feedData, analysis, vibeResult, entry.category);
        if (row) {
          console.log(`${tag}   DB: Upserted (id: ${row.id})`);
        } else {
          console.log(`${tag}   DB: Upsert failed (continued)`);
        }
      } else {
        console.log(`${tag}   DRY RUN: Would upsert`);
      }

      results.push({
        handle: entry.handle,
        platform: entry.platform,
        category: entry.category,
        status: "success",
        vibeScore: vibeResult.vibeScore,
        followers: feedData.profile.followerCount,
      });
      successCount++;
    } catch (error) {
      console.error(`${tag}   ERROR: ${error}`);
      results.push({
        handle: entry.handle,
        platform: entry.platform,
        category: entry.category,
        status: "error",
        error: String(error),
      });
      errorCount++;
    }

    // Rate limiting
    await sleep(DELAY_BETWEEN_HANDLES);

    // Extra pause every 5 handles
    if ((i + 1) % 5 === 0 && i + 1 < handles.length) {
      console.log(`\n  --- Batch pause (${BATCH_PAUSE / 1000}s) ---\n`);
      await sleep(BATCH_PAUSE);
    }
  }

  // ── Summary ──
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Crawl Complete`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log(`  Total:   ${handles.length}`);

  // Category breakdown
  const catBreakdown = new Map<string, { success: number; total: number }>();
  for (const r of results) {
    const existing = catBreakdown.get(r.category) ?? { success: 0, total: 0 };
    existing.total++;
    if (r.status === "success") existing.success++;
    catBreakdown.set(r.category, existing);
  }

  console.log(`\n  By Category:`);
  catBreakdown.forEach(({ success, total }, cat) => {
    console.log(`    ${cat}: ${success}/${total}`);
  });

  // Top scores
  const successes = results.filter((r) => r.status === "success" && r.vibeScore);
  if (successes.length > 0) {
    const sorted = successes.sort((a, b) => (b.vibeScore ?? 0) - (a.vibeScore ?? 0));
    console.log(`\n  Top 5 VibeScores:`);
    for (const r of sorted.slice(0, 5)) {
      console.log(`    @${r.handle} — VibeScore: ${r.vibeScore} (${r.followers?.toLocaleString()} followers)`);
    }
  }

  console.log(`\n${"=".repeat(60)}\n`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
