import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { analyzeAesthetics, analyzeMoodboard } from "@/lib/ai/scoring-engine";
import { tryCreateClient } from "@/lib/supabase/server";
import { upsertBrandProfile } from "@/lib/supabase/queries";

export async function POST(request: Request) {
  try {
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
    return NextResponse.json({ error: feedResult.error }, { status: 400 });
  }

  // Step 2: Extract tone vector via same AI pipeline
  const analysis = await analyzeAesthetics(feedResult.data);

  // Step 3: Persist to DB (try-or-skip)
  await persistBrandProfile(name, handle, "instagram", analysis, {
    preferredTiers: preferredTiers ?? [],
    targetCategories: targetCategories ?? [],
  });

  // Step 4: Return brand profile data
  return NextResponse.json({
    data: {
      name,
      handle,
      platform: "instagram",
      toneVector: analysis.aestheticVector,
      scores: analysis.scores,
      summary: analysis.summary,
      representativeImages: analysis.representativeImages,
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
  await persistBrandProfile(name.trim(), `moodboard_${Date.now()}`, "instagram", analysis, {
    preferredTiers,
    targetCategories,
  });

  return NextResponse.json({
    data: {
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
  preferences?: { preferredTiers?: string[]; targetCategories?: string[] }
) {
  const supabase = await tryCreateClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await upsertBrandProfile(supabase, {
        user_id: user.id,
        name,
        handle,
        platform,
        tone_vector: analysis.aestheticVector,
        description: analysis.summary,
        preferred_tiers: preferences?.preferredTiers,
        target_categories: preferences?.targetCategories,
      });
    }
  }
}
