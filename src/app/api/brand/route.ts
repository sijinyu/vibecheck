import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { analyzeAesthetics, analyzeMoodboard } from "@/lib/ai/scoring-engine";
import { analyzeBrandDeep, identifyBrand } from "@/lib/ai/brand-analysis-engine";
import { tryCreateClient } from "@/lib/supabase/server";
import { createBrandProfile, getUserBrandProfiles } from "@/lib/supabase/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { triggerBrandDiscovery } from "@/lib/discovery/brand-trigger";

export async function GET() {
  try {
    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json({ data: [] });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    const brands = await getUserBrandProfiles(supabase, user.id);
    return NextResponse.json({ data: brands });
  } catch {
    return NextResponse.json(
      { error: { message: "브랜드 목록을 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit (auth check happens inside handlers)
    const supabaseForRL = await tryCreateClient();
    if (supabaseForRL) {
      const { data: { user } } = await supabaseForRL.auth.getUser();
      if (user) {
        const rl = checkRateLimit(`brand:${user.id}`, RATE_LIMITS.brand);
        if (!rl.allowed) {
          return NextResponse.json(
            { error: { message: `브랜드 등록 요청 한도를 초과했습니다. ${Math.ceil((rl.resetAt - Date.now()) / 1000)}초 후 다시 시도해주세요.` } },
            { status: 429 }
          );
        }
      }
    }

    const contentType = request.headers.get("content-type") ?? "";

    // Moodboard upload flow (FormData)
    if (contentType.includes("multipart/form-data")) {
      return handleMoodboardUpload(request);
    }

    // Handle-based flow (JSON)
    return handleHandleAnalysis(request);
  } catch {
    return NextResponse.json(
      { error: { message: "브랜드 분석에 실패했습니다" } },
      { status: 500 }
    );
  }
}

async function handleHandleAnalysis(request: Request) {
  const body = await request.json();
  const { handle, name, preferredTiers, targetCategories } = body;

  if (!handle || typeof handle !== "string") {
    return NextResponse.json(
      { error: { message: "브랜드 핸들을 입력해주세요" } },
      { status: 400 }
    );
  }

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: { message: "브랜드 이름을 입력해주세요" } },
      { status: 400 }
    );
  }

  // Step 1: Collect brand's feed data
  const feedResult = await fetchInstagramFeed(handle);

  if ("error" in feedResult) {
    const statusMap: Record<string, number> = {
      RATE_LIMITED: 429,
      NOT_FOUND: 404,
      SCRAPE_FAILED: 502,
    };
    const status = statusMap[feedResult.error.code] ?? 400;
    return NextResponse.json({ error: feedResult.error }, { status });
  }

  // Step 2: Text-only identity pass (determines what this account IS)
  let identity = null;
  let identityError: string | null = null;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (googleApiKey) {
    try {
      identity = await identifyBrand(feedResult.data, googleApiKey);
      console.log(`[brand route] Pass 1 identity: ${identity.identity} (${identity.industry})`);
    } catch (error) {
      identityError = error instanceof Error ? error.message : String(error);
      console.error("[brand route] Identity pass failed:", error);
    }
  } else {
    identityError = "GOOGLE_API_KEY not set";
  }

  // Step 3: Aesthetic analysis (with identity context for accurate summary)
  const analysis = await analyzeAesthetics(feedResult.data, identity);

  // Step 4: Deep brand analysis (positioning, strategy, ideal influencer)
  const deepAnalysis = await analyzeBrandDeep(feedResult.data, analysis.scores, identity);

  // Step 5: Persist to DB (try-or-skip)
  const brand = await persistBrandProfile(name, handle, "instagram", analysis, {
    preferredTiers: preferredTiers ?? [],
    targetCategories: targetCategories ?? [],
    brandPositioning: deepAnalysis.positioning,
    contentStrategy: deepAnalysis.contentStrategy,
    idealInfluencerProfile: deepAnalysis.idealInfluencerProfile,
    brandKeywords: deepAnalysis.keywords,
    competitorBrands: deepAnalysis.competitors,
  });

  // Step 6: Trigger async discovery pipeline (fire-and-forget)
  if (brand?.id) {
    const supabaseForDiscovery = await tryCreateClient();
    if (supabaseForDiscovery) {
      // Don't await — runs in background
      triggerBrandDiscovery(supabaseForDiscovery, {
        id: brand.id,
        name,
        handle,
        brand_keywords: deepAnalysis.keywords ?? [],
        target_categories: targetCategories ?? [],
        preferred_tiers: preferredTiers ?? [],
        // AI context for Gemini handle suggestion
        identity: identity?.identity,
        industry: identity?.industry,
        targetAudience: identity?.targetAudience,
        coreValues: identity?.coreValues,
        competitors: deepAnalysis.competitors,
        idealInfluencerProfile: deepAnalysis.idealInfluencerProfile,
      }).catch(() => {/* fire-and-forget */});
    }
  }

  // Step 7: Return brand profile data
  return NextResponse.json({
    data: {
      brandId: brand?.id ?? null,
      name,
      handle,
      platform: "instagram",
      toneVector: analysis.aestheticVector,
      scores: analysis.scores,
      summary: analysis.summary,
      representativeImages: analysis.representativeImages,
      deepAnalysis,
    },
  });
}

async function handleMoodboardUpload(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name") as string | null;
  const imageFiles = formData.getAll("images") as File[];
  const preferredTiersRaw = formData.get("preferredTiers") as string | null;
  const targetCategoriesRaw = formData.get("targetCategories") as string | null;
  const preferredTiers: string[] = preferredTiersRaw ? JSON.parse(preferredTiersRaw) : [];
  const targetCategories: string[] = targetCategoriesRaw ? JSON.parse(targetCategoriesRaw) : [];

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: { message: "브랜드 이름을 입력해주세요" } },
      { status: 400 }
    );
  }

  if (imageFiles.length === 0) {
    return NextResponse.json(
      { error: { message: "무드보드 이미지를 1장 이상 업로드해주세요" } },
      { status: 400 }
    );
  }

  // Convert files to base64
  const imageBuffers = await Promise.all(
    imageFiles.slice(0, 5).map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return {
        data: base64,
        mimeType: file.type || "image/jpeg",
      };
    })
  );

  // Analyze moodboard with Gemini Vision
  const analysis = await analyzeMoodboard(imageBuffers);

  // Persist to DB (try-or-skip)
  const brand = await persistBrandProfile(name.trim(), `moodboard_${Date.now()}`, "instagram", analysis, {
    preferredTiers,
    targetCategories,
  });

  return NextResponse.json({
    data: {
      brandId: brand?.id ?? null,
      name: name.trim(),
      handle: "",
      platform: "moodboard",
      toneVector: analysis.aestheticVector,
      scores: analysis.scores,
      summary: analysis.summary,
      representativeImages: analysis.representativeImages,
    },
  });
}

async function persistBrandProfile(
  name: string,
  handle: string,
  platform: "instagram" | "tiktok",
  analysis: { aestheticVector: number[]; summary: string },
  preferences?: {
    preferredTiers?: string[];
    targetCategories?: string[];
    brandPositioning?: string;
    contentStrategy?: Record<string, unknown>;
    idealInfluencerProfile?: Record<string, unknown>;
    brandKeywords?: string[];
    competitorBrands?: string[];
  }
): Promise<{ id: string } | null> {
  const supabase = await tryCreateClient();

  if (!supabase) {
    console.error("[brand route] persistBrandProfile: no supabase client");
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[brand route] persistBrandProfile: no authenticated user");
    return null;
  }

  const brand = await createBrandProfile(supabase, {
    user_id: user.id,
    name,
    handle,
    platform,
    tone_vector: analysis.aestheticVector,
    description: analysis.summary,
    preferred_tiers: preferences?.preferredTiers,
    target_categories: preferences?.targetCategories,
    brand_positioning: preferences?.brandPositioning ?? null,
    content_strategy: preferences?.contentStrategy ?? {},
    ideal_influencer_profile: preferences?.idealInfluencerProfile ?? {},
    brand_keywords: preferences?.brandKeywords ?? [],
    competitor_brands: preferences?.competitorBrands ?? [],
  });

  if (!brand) {
    console.error("[brand route] persistBrandProfile: createBrandProfile returned null (DB insert failed)");
  }

  return brand ? { id: brand.id } : null;
}
