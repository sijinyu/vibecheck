/** Platform-agnostic normalized feed data */
export interface FeedPost {
  imageUrl: string;
  caption: string;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  timestamp: string;
}

export interface ProfileData {
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string;
  profileImageUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

export interface FeedData {
  profile: ProfileData;
  posts: FeedPost[];
}

export interface AdapterError {
  code: "NOT_FOUND" | "PRIVATE_ACCOUNT" | "RATE_LIMITED" | "SCRAPE_FAILED";
  message: string;
}
