import { type FeedData, type FeedPost, type AdapterError } from "./types";

const RAPIDAPI_HOST = "tiktok-scraper7.p.rapidapi.com";

interface TikTokUserInfo {
  user?: {
    uniqueId?: string;
    nickname?: string;
    avatarLarger?: string;
    avatarMedium?: string;
    signature?: string;
  };
  stats?: {
    followerCount?: number;
    followingCount?: number;
    videoCount?: number;
    heartCount?: number;
  };
}

interface TikTokVideoItem {
  id?: string;
  desc?: string;
  createTime?: number;
  video?: {
    cover?: string;
    originCover?: string;
    dynamicCover?: string;
  };
  stats?: {
    diggCount?: number;
    commentCount?: number;
    shareCount?: number;
    playCount?: number;
  };
}

interface TikTokUserFeedResponse {
  data?: {
    videos?: TikTokVideoItem[];
    cursor?: string;
    hasMore?: boolean;
  };
}

interface TikTokUserInfoResponse {
  data?: TikTokUserInfo;
}

export async function fetchTikTokFeed(
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
      error: { code: "SCRAPE_FAILED", message: "TikTok API가 설정되지 않았습니다. 관리자에게 문의하세요." },
    };
  }

  try {
    // Fetch user info and posts in parallel
    const [userInfoRes, userPostsRes] = await Promise.all([
      fetch(
        `https://${RAPIDAPI_HOST}/user/info?unique_id=${encodeURIComponent(cleanHandle)}`,
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
        }
      ),
      fetch(
        `https://${RAPIDAPI_HOST}/user/posts?unique_id=${encodeURIComponent(cleanHandle)}&count=50`,
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
        }
      ),
    ]);

    if (!userInfoRes.ok || !userPostsRes.ok) {
      if (userInfoRes.status === 429 || userPostsRes.status === 429) {
        return {
          error: {
            code: "RATE_LIMITED",
            message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
          },
        };
      }
      throw new Error(
        `RapidAPI responded with ${userInfoRes.status}/${userPostsRes.status}`
      );
    }

    const userInfoJson: TikTokUserInfoResponse = await userInfoRes.json();
    const userPostsJson: TikTokUserFeedResponse = await userPostsRes.json();

    const userInfo = userInfoJson.data;
    const videos = userPostsJson.data?.videos;

    if (!userInfo?.user || !videos || videos.length === 0) {
      return {
        error: {
          code: "NOT_FOUND",
          message: `@${cleanHandle} 계정을 찾을 수 없거나 게시물이 없습니다.`,
        },
      };
    }

    const feedData = transformTikTokResponse(cleanHandle, userInfo, videos);
    return { data: { ...feedData, dataSource: "live" as const } };
  } catch (error) {
    console.error("[tiktok adapter] RapidAPI error:", error);
    return {
      error: { code: "SCRAPE_FAILED", message: "TikTok 데이터를 가져올 수 없습니다. 잠시 후 다시 시도해주세요." },
    };
  }
}

function transformTikTokResponse(
  handle: string,
  userInfo: TikTokUserInfo,
  videos: TikTokVideoItem[]
): Omit<FeedData, "dataSource"> {
  const user = userInfo.user;
  const stats = userInfo.stats;

  const profile = {
    handle,
    platform: "tiktok" as const,
    displayName: user?.nickname ?? handle,
    profileImageUrl: user?.avatarLarger ?? user?.avatarMedium ?? null,
    bio: user?.signature ?? null,
    followerCount: stats?.followerCount ?? 0,
    followingCount: stats?.followingCount ?? 0,
    postCount: stats?.videoCount ?? videos.length,
  };

  const posts = videos
    .map((v) => {
      const imageUrl =
        v.video?.originCover ?? v.video?.cover ?? v.video?.dynamicCover ?? null;

      if (!imageUrl) return null;

      const caption = v.desc ?? "";
      const hashtags = caption.match(/#[\w\uAC00-\uD7A3]+/g) ?? [];

      return {
        imageUrl,
        caption,
        hashtags: hashtags.map((h) => h.replace("#", "")),
        likeCount: v.stats?.diggCount ?? 0,
        commentCount: v.stats?.commentCount ?? 0,
        shareCount: v.stats?.shareCount ?? 0,
        playCount: v.stats?.playCount ?? 0,
        postType: "video" as const,
        timestamp: v.createTime
          ? new Date(v.createTime * 1000).toISOString()
          : new Date().toISOString(),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return { profile, posts };
}

