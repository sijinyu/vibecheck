import { NextResponse } from "next/server";

interface MatchedInfluencer {
  id: string;
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string;
  aestheticScore: number;
  matchScore: number;
  category: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images");

    if (images.length === 0) {
      return NextResponse.json(
        { error: { message: "이미지를 업로드해주세요" } },
        { status: 400 }
      );
    }

    // TODO: Extract tone vector from uploaded images via Vision AI
    // TODO: Query pgvector for similar influencers

    // Mock results for now
    const mockResults: MatchedInfluencer[] = [
      {
        id: "1",
        handle: "minimal_mood",
        platform: "instagram",
        displayName: "Minimal Mood",
        aestheticScore: 89,
        matchScore: 94,
        category: "Lifestyle",
      },
      {
        id: "2",
        handle: "tone_studio",
        platform: "instagram",
        displayName: "Tone Studio",
        aestheticScore: 85,
        matchScore: 87,
        category: "Fashion",
      },
      {
        id: "3",
        handle: "vibe_daily",
        platform: "instagram",
        displayName: "Vibe Daily",
        aestheticScore: 82,
        matchScore: 83,
        category: "Beauty",
      },
      {
        id: "4",
        handle: "aesthetic_kr",
        platform: "instagram",
        displayName: "Aesthetic KR",
        aestheticScore: 78,
        matchScore: 79,
        category: "Art",
      },
      {
        id: "5",
        handle: "mood_catcher",
        platform: "instagram",
        displayName: "Mood Catcher",
        aestheticScore: 76,
        matchScore: 75,
        category: "Travel",
      },
    ];

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({ data: { results: mockResults } });
  } catch {
    return NextResponse.json(
      { error: { message: "Vibe Search에 실패했습니다" } },
      { status: 500 }
    );
  }
}
