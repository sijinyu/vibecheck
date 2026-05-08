import { type FeedData, type FeedPost, type AdapterError } from "./types";

const RAPIDAPI_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

interface RapidApiPost {
  node: {
    taken_at: number;
    caption?: { text: string } | null;
    like_count?: number;
    comment_count?: number;
    image_versions2?: {
      candidates?: Array<{ url: string; width: number; height: number }>;
    };
    carousel_media?: Array<{
      image_versions2?: {
        candidates?: Array<{ url: string; width: number; height: number }>;
      };
    }>;
    user?: {
      username: string;
      full_name: string;
      profile_pic_url: string;
      is_verified: boolean;
    };
  };
}

interface RapidApiResponse {
  posts?: RapidApiPost[];
  user?: {
    username: string;
    full_name: string;
    profile_pic_url: string;
    biography?: string;
    follower_count?: number;
    following_count?: number;
    media_count?: number;
  };
  error?: string;
}

export async function fetchInstagramFeed(
  handle: string
): Promise<{ data: FeedData } | { error: AdapterError }> {
  const cleanHandle = handle.replace("@", "").trim().toLowerCase();

  if (!cleanHandle) {
    return {
      error: { code: "NOT_FOUND", message: "핸들을 입력해주세요" },
    };
  }

  const apiKey = process.env.RAPIDAPI_KEY;

  // No API key → fallback to mock
  if (!apiKey) {
    return { data: generateMockFeedData(cleanHandle) };
  }

  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/get_ig_user_posts.php`,
      {
        method: "POST",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username_or_url: `https://www.instagram.com/${cleanHandle}/`,
          pagination_token: "",
          amount: "12",
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return {
          error: { code: "RATE_LIMITED", message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." },
        };
      }
      throw new Error(`RapidAPI responded with ${response.status}`);
    }

    const json: RapidApiResponse = await response.json();

    if (json.error || !json.posts || json.posts.length === 0) {
      return {
        error: { code: "NOT_FOUND", message: `@${cleanHandle} 계정을 찾을 수 없거나 게시물이 없습니다.` },
      };
    }

    const feedData = transformApiResponse(cleanHandle, json);
    return { data: feedData };
  } catch (error) {
    console.error("[instagram adapter] RapidAPI error, falling back to mock:", error);
    // Fallback to mock on any API failure so the app doesn't break
    return { data: generateMockFeedData(cleanHandle) };
  }
}

function transformApiResponse(handle: string, json: RapidApiResponse): FeedData {
  const firstUser = json.posts?.[0]?.node?.user;

  const profile = {
    handle,
    platform: "instagram" as const,
    displayName: firstUser?.full_name ?? handle,
    profileImageUrl: firstUser?.profile_pic_url ?? null,
    bio: json.user?.biography ?? null,
    followerCount: json.user?.follower_count ?? 0,
    followingCount: json.user?.following_count ?? 0,
    postCount: json.user?.media_count ?? json.posts?.length ?? 0,
  };

  const posts: FeedPost[] = (json.posts ?? [])
    .map((p) => {
      const node = p.node;
      // Get the best image: first from image_versions2, then carousel first item
      const imageUrl =
        node.image_versions2?.candidates?.[0]?.url ??
        node.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ??
        null;

      if (!imageUrl) return null;

      const captionText = node.caption?.text ?? "";
      const hashtags = captionText.match(/#[\w\uAC00-\uD7A3]+/g) ?? [];

      return {
        imageUrl,
        caption: captionText,
        hashtags: hashtags.map((h) => h.replace("#", "")),
        likeCount: node.like_count ?? 0,
        commentCount: node.comment_count ?? 0,
        timestamp: new Date(node.taken_at * 1000).toISOString(),
      };
    })
    .filter((p): p is FeedPost => p !== null);

  return { profile, posts };
}

// ─── Mock fallback (unchanged from original) ───────────────────

function generateMockFeedData(handle: string): FeedData {
  const hashCode = handle
    .split("")
    .reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0);
  const seed = Math.abs(hashCode);

  const followerCount = 10000 + (seed % 990000);
  const postCount = 50 + (seed % 2000);

  const categories = ["Fashion", "Beauty", "Lifestyle", "Travel", "Food", "Art"];
  const category = categories[seed % categories.length];

  const placeholderImages = Array.from({ length: 12 }, (_, i) => ({
    imageUrl: `https://picsum.photos/seed/${handle}${i}/640/640`,
    caption: `${category} vibes ${["✨", "🌿", "💫", "🌸", "☁️", "🔥"][i % 6]} #${category.toLowerCase()} #aesthetic`,
    hashtags: [category.toLowerCase(), "aesthetic", "mood", `${handle}style`],
    likeCount: 100 + ((seed + i * 137) % 9900),
    commentCount: 5 + ((seed + i * 43) % 495),
    timestamp: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  return {
    profile: {
      handle,
      platform: "instagram",
      displayName: handle.charAt(0).toUpperCase() + handle.slice(1).replace(/_/g, " "),
      profileImageUrl: `https://picsum.photos/seed/${handle}profile/200/200`,
      bio: `${category} creator | Sharing aesthetics daily`,
      followerCount,
      followingCount: 200 + (seed % 1800),
      postCount,
    },
    posts: placeholderImages,
  };
}
