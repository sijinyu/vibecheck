import { type FeedData, type FeedPost, type AdapterError } from "./types";

// ─── Primary: instagram120 API ───────────────────────────────
const PRIMARY_HOST = "instagram120.p.rapidapi.com";

// ─── Fallback: old stable API (quota may be exhausted) ───────
const FALLBACK_HOST = "instagram-scraper-stable-api.p.rapidapi.com";

// ─── Types for instagram120 API ──────────────────────────────

interface Ig120PostNode {
  taken_at: number;
  code?: string;
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
    is_verified?: boolean;
  };
}

interface Ig120PostsResponse {
  result?: {
    edges?: Array<{ node: Ig120PostNode }>;
    page_info?: { has_next_page: boolean; end_cursor: string };
  };
  error?: string;
}

interface Ig120ProfileResponse {
  result?: {
    username: string;
    full_name: string;
    biography: string;
    profile_pic_url: string;
    profile_pic_url_hd?: string;
    edge_followed_by?: { count: number };
    edge_follow?: { count: number };
    edge_owner_to_timeline_media?: { count: number };
    is_private?: boolean;
  };
  error?: string;
}

// ─── Generic fetch helper with retry ─────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<{ response: Response } | { status: number; body: string }> {
  const BACKOFF_MS = [2000, 5000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 1] ?? 5000));
    }

    const response = await fetch(url, options);

    if (response.ok) {
      return { response };
    }

    const errorBody = await response.text().catch(() => "(unreadable)");
    console.error(`[instagram adapter] HTTP ${response.status} from ${url} | body: ${errorBody.slice(0, 300)}`);

    // Monthly quota exceeded — don't retry
    if (response.status === 429 && errorBody.includes("MONTHLY quota")) {
      return { status: 429, body: errorBody };
    }

    // Retry only on 429 (per-second limit) or 5xx
    if (response.status === 429 || response.status >= 500) {
      continue;
    }

    return { status: response.status, body: errorBody };
  }

  return { status: 429, body: "Retries exhausted" };
}

// ─── Primary adapter: instagram120 ──────────────────────────

async function fetchViaInstagram120(
  apiKey: string,
  cleanHandle: string
): Promise<{ data: FeedData } | { error: AdapterError } | null> {
  const headers = {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": PRIMARY_HOST,
    "Content-Type": "application/json",
  };

  // Fetch posts + profile in parallel
  const [postsResult, profileResult] = await Promise.all([
    fetchWithRetry(
      `https://${PRIMARY_HOST}/api/instagram/posts`,
      { method: "POST", headers, body: JSON.stringify({ username: cleanHandle, amount: 50 }) }
    ),
    fetchWithRetry(
      `https://${PRIMARY_HOST}/api/instagram/profile`,
      { method: "POST", headers, body: JSON.stringify({ username: cleanHandle }) }
    ),
  ]);

  // If posts call failed, return null to try fallback
  if ("status" in postsResult) {
    if (postsResult.status === 429) {
      // Quota issue on this API too — return error, don't fallback
      if (postsResult.body.includes("MONTHLY quota")) {
        return {
          error: {
            code: "RATE_LIMITED",
            message: "Instagram API 월간 사용량이 초과되었습니다. RapidAPI 대시보드에서 플랜을 확인해주세요.",
          },
        };
      }
    }
    console.error(`[instagram adapter] instagram120 posts failed (${postsResult.status}), trying fallback...`);
    return null; // Signal to try fallback
  }

  const postsJson: Ig120PostsResponse = await postsResult.response.json();
  const edges = postsJson.result?.edges ?? [];

  if (postsJson.error || edges.length === 0) {
    return {
      error: { code: "NOT_FOUND", message: `@${cleanHandle} 계정을 찾을 수 없거나 게시물이 없습니다.` },
    };
  }

  // Profile may fail (non-critical) — extract from posts as fallback
  let profileData: Ig120ProfileResponse["result"] | null = null;
  if ("response" in profileResult) {
    const profileJson: Ig120ProfileResponse = await profileResult.response.json();
    profileData = profileJson.result ?? null;
  }

  const firstUser = edges[0]?.node?.user;

  const profile = {
    handle: cleanHandle,
    platform: "instagram" as const,
    displayName: profileData?.full_name ?? firstUser?.full_name ?? cleanHandle,
    profileImageUrl: profileData?.profile_pic_url_hd ?? profileData?.profile_pic_url ?? firstUser?.profile_pic_url ?? null,
    bio: profileData?.biography ?? null,
    followerCount: profileData?.edge_followed_by?.count ?? 0,
    followingCount: profileData?.edge_follow?.count ?? 0,
    postCount: profileData?.edge_owner_to_timeline_media?.count ?? edges.length,
  };

  const posts = edges
    .map((edge) => {
      const node = edge.node;
      const imageUrl =
        node.image_versions2?.candidates?.[0]?.url ??
        node.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ??
        null;

      if (!imageUrl) return null;

      const captionText = node.caption?.text ?? "";
      const hashtags = captionText.match(/#[\w\uAC00-\uD7A3]+/g) ?? [];

      const post: FeedPost = {
        imageUrl,
        caption: captionText,
        hashtags: hashtags.map((h) => h.replace("#", "")),
        likeCount: node.like_count ?? 0,
        commentCount: node.comment_count ?? 0,
        timestamp: new Date(node.taken_at * 1000).toISOString(),
      };
      if (node.code) post.shortcode = node.code;
      return post;
    })
    .filter((p): p is FeedPost => p !== null);

  return { data: { profile, posts, dataSource: "live" as const } };
}

// ─── Fallback adapter: old stable API ───────────────────────

interface OldApiPost {
  node: {
    taken_at: number;
    code?: string;
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
    };
  };
}

interface OldApiResponse {
  posts?: OldApiPost[];
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

async function fetchViaOldStableApi(
  apiKey: string,
  cleanHandle: string
): Promise<{ data: FeedData } | { error: AdapterError } | null> {
  const result = await fetchWithRetry(
    `https://${FALLBACK_HOST}/get_ig_user_posts.php`,
    {
      method: "POST",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": FALLBACK_HOST,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username_or_url: `https://www.instagram.com/${cleanHandle}/`,
        pagination_token: "",
        amount: "50",
      }),
    }
  );

  if ("status" in result) {
    if (result.status === 429) {
      return {
        error: {
          code: "RATE_LIMITED",
          message: "Instagram API 요청이 일시적으로 제한되었습니다. 잠시 후 다시 시도해주세요.",
        },
      };
    }
    return null;
  }

  const json: OldApiResponse = await result.response.json();

  if (json.error || !json.posts || json.posts.length === 0) {
    return {
      error: { code: "NOT_FOUND", message: `@${cleanHandle} 계정을 찾을 수 없거나 게시물이 없습니다.` },
    };
  }

  const firstUser = json.posts[0]?.node?.user;

  const profile = {
    handle: cleanHandle,
    platform: "instagram" as const,
    displayName: firstUser?.full_name ?? cleanHandle,
    profileImageUrl: firstUser?.profile_pic_url ?? null,
    bio: json.user?.biography ?? null,
    followerCount: json.user?.follower_count ?? 0,
    followingCount: json.user?.following_count ?? 0,
    postCount: json.user?.media_count ?? json.posts.length,
  };

  const posts = json.posts
    .map((p) => {
      const node = p.node;
      const imageUrl =
        node.image_versions2?.candidates?.[0]?.url ??
        node.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ??
        null;
      if (!imageUrl) return null;

      const captionText = node.caption?.text ?? "";
      const hashtags = captionText.match(/#[\w\uAC00-\uD7A3]+/g) ?? [];

      const post: FeedPost = {
        imageUrl,
        caption: captionText,
        hashtags: hashtags.map((h) => h.replace("#", "")),
        likeCount: node.like_count ?? 0,
        commentCount: node.comment_count ?? 0,
        timestamp: new Date(node.taken_at * 1000).toISOString(),
      };
      if (node.code) post.shortcode = node.code;
      return post;
    })
    .filter((p): p is FeedPost => p !== null);

  return { data: { profile, posts, dataSource: "live" as const } };
}

// ─── Main entry point (multi-provider with fallback) ────────

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

  if (!apiKey) {
    return {
      error: { code: "SCRAPE_FAILED", message: "Instagram API가 설정되지 않았습니다. 관리자에게 문의하세요." },
    };
  }

  try {
    // 1) Try primary: instagram120
    const primaryResult = await fetchViaInstagram120(apiKey, cleanHandle);
    if (primaryResult) return primaryResult;

    // 2) Fallback: old stable API
    console.log("[instagram adapter] Primary failed, trying fallback (stable API)...");
    const fallbackResult = await fetchViaOldStableApi(apiKey, cleanHandle);
    if (fallbackResult) return fallbackResult;

    // Both failed
    throw new Error("All Instagram API providers failed");
  } catch (error) {
    console.error("[instagram adapter] All providers failed:", error);
    return {
      error: { code: "SCRAPE_FAILED", message: "Instagram 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요." },
    };
  }
}
