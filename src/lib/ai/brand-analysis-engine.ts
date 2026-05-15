import { GoogleGenerativeAI } from "@google/generative-ai";
import { type FeedData } from "@/lib/adapters/types";
import { type AestheticScores } from "./scoring-engine";

export interface BrandDeepAnalysis {
  positioning: string;
  contentStrategy: {
    postingPattern: string;
    primaryMessage: string;
    hashtagStrategy: string;
    storytellingStyle: string;
  };
  idealInfluencerProfile: {
    tone: string;
    followerRange: string;
    contentStyle: string;
    audienceTraits: string;
    platformFit: string;
  };
  keywords: string[];
  competitors: string[];
}

/** Lightweight identity summary from Pass 1 — shared with scoring-engine */
export interface BrandIdentitySummary {
  identity: string;
  industry: string;
  targetAudience: string;
  coreValues: string[];
}

// ─── Pass 1: Text-only identity analysis ─────────────────────

const IDENTITY_PROMPT = `You are a brand analyst. Based ONLY on the text data below (bio, captions, hashtags), determine what this Instagram account/brand actually IS.

Rules:
- The BIO is the MOST IMPORTANT source. It's how the account describes itself.
- Captions reveal the actual content and activities.
- Hashtags reveal the community and niche.
- Do NOT guess based on aesthetics or imagery — this is TEXT-ONLY analysis.
- Analyze Korean text properly.

Respond ONLY with valid JSON:
{
  "identity": "string — 1 sentence in Korean: 이 계정이 정확히 무엇인지 (예: '서울 기반 모닝 러닝+커피 커뮤니티', '비건 스킨케어 브랜드', '부산 카페 리뷰 인플루언서')",
  "industry": "string — 업종/카테고리 (예: '커뮤니티/소셜클럽', '뷰티/스킨케어', '요식업/카페')",
  "targetAudience": "string — Korean: 타깃 오디언스 추론 (예: '20-30대 서울 거주 직장인, 아침형 인간, 커피+러닝 문화에 관심')",
  "coreValues": ["string", "..."] — 3-5개 핵심 가치 (Korean, 예: ["아침 루틴", "커뮤니티", "웰니스", "커피 문화"])
}`;

export async function identifyBrand(
  feedData: FeedData,
  apiKey: string
): Promise<BrandIdentitySummary> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const allCaptions = feedData.posts
    .slice(0, 12)
    .map((p, i) => `[${i + 1}] ${p.caption.slice(0, 400)}`)
    .join("\n\n");

  const allHashtags = feedData.posts.flatMap((p) => p.hashtags);
  const hashtagFreq = allHashtags.reduce<Record<string, number>>((acc, h) => {
    acc[h] = (acc[h] ?? 0) + 1;
    return acc;
  }, {});
  const topHashtags = Object.entries(hashtagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => `#${tag} (${count})`)
    .join(", ");

  const textData = `
[ACCOUNT]
Handle: @${feedData.profile.handle}
Display Name: ${feedData.profile.displayName ?? feedData.profile.handle}
Bio: "${feedData.profile.bio ?? "없음"}"
Followers: ${feedData.profile.followerCount.toLocaleString()}
Following: ${feedData.profile.followingCount.toLocaleString()}
Total Posts: ${feedData.profile.postCount}

[TOP HASHTAGS]
${topHashtags || "없음"}

[RECENT CAPTIONS — full text]
${allCaptions}
`;

  const result = await model.generateContent([IDENTITY_PROMPT, textData]);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in identity response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    identity: parsed.identity ?? "",
    industry: parsed.industry ?? "",
    targetAudience: parsed.targetAudience ?? "",
    coreValues: Array.isArray(parsed.coreValues) ? parsed.coreValues : [],
  };
}

// ─── Pass 2: Deep brand strategy (with identity context) ─────

const BRAND_STRATEGY_PROMPT = `You are a senior brand strategist analyzing a brand's Instagram presence for influencer marketing.

## ESTABLISHED IDENTITY (from prior analysis — treat as GROUND TRUTH)
The account identity has already been determined. DO NOT contradict this.

## YOUR TASK
Based on the established identity AND the detailed data below, provide strategic analysis for influencer marketing partnerships.

Respond ONLY with valid JSON:
{
  "positioning": "string — 2-3 sentences in Korean: 시장 포지션, 타깃 고객층, 규모/성숙도. 위에서 확인된 정체성을 기반으로 구체적으로.",
  "contentStrategy": {
    "postingPattern": "string — Korean: 포스팅 빈도/패턴",
    "primaryMessage": "string — Korean: 주요 메시지/톤. 확인된 정체성과 일치해야 함.",
    "hashtagStrategy": "string — Korean: 해시태그 전략",
    "storytellingStyle": "string — Korean: 스토리텔링 방식"
  },
  "idealInfluencerProfile": {
    "tone": "string — Korean: 이 브랜드와 어울리는 인플루언서 톤",
    "followerRange": "string — Korean: 이상적 팔로워 규모",
    "contentStyle": "string — Korean: 이상적 콘텐츠 스타일",
    "audienceTraits": "string — Korean: 이상적 오디언스 특성. 확인된 타깃과 일치해야 함.",
    "platformFit": "string — Korean: 적합 플랫폼"
  },
  "keywords": ["string", "..."] — 5-8개 브랜드 키워드 (Korean). 확인된 정체성/가치에서 추출.,
  "competitors": ["string", "..."] — 3-5개 실제 존재하는 경쟁/유사 브랜드명. 확인된 업종 기반.
}`;

export async function analyzeBrandDeep(
  feedData: FeedData,
  aestheticScores: AestheticScores,
  preComputedIdentity?: BrandIdentitySummary | null
): Promise<BrandDeepAnalysis> {
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (googleApiKey) {
    // Use pre-computed identity if available, otherwise run Pass 1
    const identity = preComputedIdentity ?? await identifyBrand(feedData, googleApiKey);
    if (!preComputedIdentity) {
      console.log(`[brand-analysis-engine] Pass 1 identity: ${identity.identity} (${identity.industry})`);
    }

    // Pass 2: Deep strategy analysis with confirmed identity
    return await analyzeBrandStrategy(feedData, aestheticScores, identity, googleApiKey);
  }

  throw new Error("브랜드 분석을 위해 GOOGLE_API_KEY가 필요합니다.");
}

async function analyzeBrandStrategy(
  feedData: FeedData,
  aestheticScores: AestheticScores,
  identity: BrandIdentitySummary,
  apiKey: string
): Promise<BrandDeepAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const captionSample = feedData.posts
    .slice(0, 12)
    .map((p, i) => `Post ${i + 1}: "${p.caption.slice(0, 300)}" [${p.hashtags.join(", ")}] (${p.likeCount} likes, ${p.commentCount} comments)`)
    .join("\n");

  const allHashtags = feedData.posts.flatMap((p) => p.hashtags);
  const hashtagFreq = allHashtags.reduce<Record<string, number>>((acc, h) => {
    acc[h] = (acc[h] ?? 0) + 1;
    return acc;
  }, {});
  const topHashtags = Object.entries(hashtagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => `#${tag} (${count}회)`)
    .join(", ");

  const contextText = `
═══ ESTABLISHED IDENTITY (GROUND TRUTH) ═══
정체성: ${identity.identity}
업종: ${identity.industry}
타깃: ${identity.targetAudience}
핵심 가치: ${identity.coreValues.join(", ")}

═══ PROFILE ═══
Handle: @${feedData.profile.handle}
Display Name: ${feedData.profile.displayName ?? feedData.profile.handle}
Bio: "${feedData.profile.bio ?? "N/A"}"
Followers: ${feedData.profile.followerCount.toLocaleString()}
Following: ${feedData.profile.followingCount.toLocaleString()}
Total Posts: ${feedData.profile.postCount}

═══ AESTHETIC SCORES ═══
Overall: ${aestheticScores.overall}/100 | Color: ${aestheticScores.color}/100 | Composition: ${aestheticScores.composition}/100 | Tone: ${aestheticScores.toneConsistency}/100 | Trend: ${aestheticScores.trend}/100

═══ TOP HASHTAGS ═══
${topHashtags || "N/A"}

═══ RECENT POSTS ═══
${captionSample}
`;

  const result = await model.generateContent([BRAND_STRATEGY_PROMPT, contextText]);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in brand strategy response");

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    positioning: parsed.positioning ?? "",
    contentStrategy: {
      postingPattern: parsed.contentStrategy?.postingPattern ?? "",
      primaryMessage: parsed.contentStrategy?.primaryMessage ?? "",
      hashtagStrategy: parsed.contentStrategy?.hashtagStrategy ?? "",
      storytellingStyle: parsed.contentStrategy?.storytellingStyle ?? "",
    },
    idealInfluencerProfile: {
      tone: parsed.idealInfluencerProfile?.tone ?? "",
      followerRange: parsed.idealInfluencerProfile?.followerRange ?? "",
      contentStyle: parsed.idealInfluencerProfile?.contentStyle ?? "",
      audienceTraits: parsed.idealInfluencerProfile?.audienceTraits ?? "",
      platformFit: parsed.idealInfluencerProfile?.platformFit ?? "",
    },
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
  };
}

