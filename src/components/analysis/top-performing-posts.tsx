"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MessageCircle, ExternalLink } from "lucide-react";

interface PostData {
  imageUrl: string;
  likeCount: number;
  commentCount: number;
  caption: string;
  shortcode?: string;
}

interface TopPerformingPostsProps {
  posts: PostData[];
  handle?: string;
  platform?: "instagram" | "tiktok";
  className?: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getPostUrl(post: PostData, handle?: string, platform?: string): string | null {
  if (platform === "tiktok" && handle) {
    return `https://www.tiktok.com/@${handle}`;
  }
  if (post.shortcode) {
    return `https://www.instagram.com/p/${post.shortcode}/`;
  }
  if (handle) {
    return `https://www.instagram.com/${handle}/`;
  }
  return null;
}

export function TopPerformingPosts({ posts, handle, platform, className }: TopPerformingPostsProps) {
  const sorted = [...posts]
    .sort((a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount))
    .slice(0, 6);

  if (sorted.length === 0) return null;

  return (
    <div className={className}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Top Performing Posts
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {sorted.map((post, i) => {
          const postUrl = getPostUrl(post, handle, platform);
          const Wrapper = postUrl ? "a" : "div";
          const wrapperProps = postUrl
            ? { href: postUrl, target: "_blank" as const, rel: "noopener noreferrer" }
            : {};

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Wrapper
                {...wrapperProps}
                className="group relative block aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
              >
                <Image
                  src={post.imageUrl}
                  alt={post.caption.slice(0, 50)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex items-center gap-1 text-white">
                    <Heart className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">
                      {formatCount(post.likeCount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">
                      {formatCount(post.commentCount)}
                    </span>
                  </div>
                  {postUrl && (
                    <ExternalLink className="h-3.5 w-3.5 text-white/70" />
                  )}
                </div>
              </Wrapper>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
