import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import {
  matchInfluencersByVector,
  insertVibeSearch,
} from "@/lib/supabase/queries";

interface MatchedInfluencer {
  id: string;
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string;
  aestheticScore: number;
  matchScore: number;
  category: string;
}

// Mock results returned when Supabase/pgvector is unavailable
const MOCK_RESULTS: MatchedInfluencer[] = [
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

    const supabase = await tryCreateClient();

    // Attempt pgvector similarity search if Supabase is available
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // TODO: Extract tone vector from uploaded images via Vision AI
      // For now, generate a deterministic mock vector from image count
      const mockVector = new Array(512).fill(0).map((_, i) =>
        Number(((i * 0.01 + images.length * 0.1) % 1).toFixed(3))
      );

      const matched = await matchInfluencersByVector(supabase, mockVector, 10, 0.3);

      if (matched.length > 0) {
        // Save vibe search record
        if (user) {
          await insertVibeSearch(supabase, {
            user_id: user.id,
            image_url: `upload://${images.length}-images`,
            tone_vector: mockVector,
            matched_influencer_ids: matched.map((m) => m.id),
          });
        }

        const results: MatchedInfluencer[] = matched.map((m) => ({
          id: m.id,
          handle: m.handle,
          platform: m.platform as "instagram" | "tiktok",
          displayName: m.display_name ?? m.handle,
          aestheticScore: Number(m.aesthetic_score ?? 0),
          matchScore: Math.round(m.similarity * 100),
          category: m.category ?? "Unknown",
        }));

        return NextResponse.json({ data: { results } });
      }

      // If no matches found (e.g., empty DB), fall through to mock
    }

    // Fallback: return mock results
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return NextResponse.json({ data: { results: MOCK_RESULTS } });
  } catch {
    return NextResponse.json(
      { error: { message: "Vibe Search에 실패했습니다" } },
      { status: 500 }
    );
  }
}
