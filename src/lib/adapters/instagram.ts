import { type FeedData, type AdapterError } from "./types";

/**
 * Instagram data adapter.
 *
 * MVP strategy: Use Instagram's public web API endpoints.
 * - For production: migrate to Instagram Graph API (requires app review)
 * - Fallback: Puppeteer scraping for images
 *
 * Current implementation uses mock data for development.
 * TODO: Implement actual scraping/API integration
 */
export async function fetchInstagramFeed(
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

  // TODO: Replace with actual Instagram API/scraping
  // For now, generate realistic mock data based on handle
  try {
    const mockData = generateMockFeedData(cleanHandle);
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { data: mockData };
  } catch {
    return {
      error: {
        code: "SCRAPE_FAILED",
        message: "데이터 수집에 실패했습니다. 잠시 후 다시 시도해주세요.",
      },
    };
  }
}

function generateMockFeedData(handle: string): FeedData {
  // Generate deterministic but varied mock data based on handle hash
  const hashCode = handle
    .split("")
    .reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0);
  const seed = Math.abs(hashCode);

  const followerCount = 10000 + (seed % 990000);
  const postCount = 50 + (seed % 2000);

  const categories = [
    "Fashion",
    "Beauty",
    "Lifestyle",
    "Travel",
    "Food",
    "Art",
  ];
  const category = categories[seed % categories.length];

  const placeholderImages = Array.from({ length: 12 }, (_, i) => ({
    imageUrl: `https://picsum.photos/seed/${handle}${i}/640/640`,
    caption: `${category} vibes ${["✨", "🌿", "💫", "🌸", "☁️", "🔥"][i % 6]} #${category.toLowerCase()} #aesthetic`,
    hashtags: [
      category.toLowerCase(),
      "aesthetic",
      "mood",
      `${handle}style`,
    ],
    likeCount: 100 + ((seed + i * 137) % 9900),
    commentCount: 5 + ((seed + i * 43) % 495),
    timestamp: new Date(
      Date.now() - i * 3 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));

  return {
    profile: {
      handle,
      platform: "instagram",
      displayName:
        handle.charAt(0).toUpperCase() + handle.slice(1).replace(/_/g, " "),
      profileImageUrl: `https://picsum.photos/seed/${handle}profile/200/200`,
      bio: `${category} creator | Sharing aesthetics daily`,
      followerCount,
      followingCount: 200 + (seed % 1800),
      postCount,
    },
    posts: placeholderImages,
  };
}
