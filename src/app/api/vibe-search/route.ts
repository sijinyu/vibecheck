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

      // If no matches found, return empty
    }

    // No matches found
    return NextResponse.json({ data: { results: [] } });
  } catch {
    return NextResponse.json(
      { error: { message: "Vibe Search에 실패했습니다" } },
      { status: 500 }
    );
  }
}
