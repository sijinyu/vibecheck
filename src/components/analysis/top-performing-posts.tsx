"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";

interface PostData {
  imageUrl: string;
  likeCount: number;
  commentCount: number;
  caption: string;
}

interface TopPerformingPostsProps {
  posts: PostData[];
  className?: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function TopPerformingPosts({ posts, className }: TopPerformingPostsProps) {
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
        {sorted.map((post, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
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
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
