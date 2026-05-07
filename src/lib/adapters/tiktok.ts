import { type FeedData, type AdapterError } from "./types";

/**
 * TikTok data adapter.
 *
 * MVP strategy: Mock data with same interface as Instagram adapter.
 * TODO: Integrate TikTok API (Research API or Display API)
 */
export async function fetchTikTokFeed(
  handle: string
): Promise<{ data: FeedData } | { error: AdapterError }> {
  const cleanHandle = handle.replace("@", "").trim().toLowerCase();

  if (!cleanHandle) {
    return {
      error: {
        code: "NOT_FOUND",
        message: "핸들을 입력해주세요",
      },
    };
  }

  try {
    const mockData = generateMockTikTokData(cleanHandle);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { data: mockData };
  } catch {
    return {
      error: {
        code: "SCRAPE_FAILED",
        message: "TikTok 데이터 수집에 실패했습니다.",
      },
    };
  }
}

function generateMockTikTokData(handle: string): FeedData {
  const hashCode = handle
    .split("")
    .reduce((acc, char) => acc * 37 + char.charCodeAt(0), 0);
  const seed = Math.abs(hashCode);

  const followerCount = 50000 + (seed % 4950000);
  const postCount = 30 + (seed % 1500);

  const categories = [
    "Dance",
    "Comedy",
    "Fashion",
    "Food",
    "Beauty",
    "Lifestyle",
  ];
  const category = categories[seed % categories.length];

  const posts = Array.from({ length: 12 }, (_, i) => ({
    imageUrl: `https://picsum.photos/seed/tt${handle}${i}/640/1136`,
    caption: `${category} content ${["🔥", "💃", "✨", "🎵", "💄", "🌟"][i % 6]} #${category.toLowerCase()} #fyp #viral`,
    hashtags: [category.toLowerCase(), "fyp", "viral", "tiktok"],
    likeCount: 500 + ((seed + i * 211) % 99500),
    commentCount: 10 + ((seed + i * 67) % 990),
    timestamp: new Date(
      Date.now() - i * 2 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));

  return {
    profile: {
      handle,
      platform: "tiktok",
      displayName:
        handle.charAt(0).toUpperCase() + handle.slice(1).replace(/_/g, " "),
      profileImageUrl: `https://picsum.photos/seed/tt${handle}pfp/200/200`,
      bio: `${category} creator on TikTok 🎬`,
      followerCount,
      followingCount: 100 + (seed % 900),
      postCount,
    },
    posts,
  };
}
