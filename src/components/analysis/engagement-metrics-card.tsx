"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Calendar, TrendingUp, Share2, Play, DollarSign } from "lucide-react";

interface EngagementMetricsCardProps {
  engagementRate: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  postingFrequencyDays: number;
  followerCount: number;
  avgSharesPerPost?: number;
  avgPlaysPerPost?: number;
  estimatedCPE?: number | null;
  platform?: string;
  className?: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function EngagementMetricsCard({
  engagementRate,
  avgLikesPerPost,
  avgCommentsPerPost,
  postingFrequencyDays,
  followerCount,
  avgSharesPerPost = 0,
  avgPlaysPerPost = 0,
  estimatedCPE,
  platform,
  className,
}: EngagementMetricsCardProps) {
  const metrics = [
    {
      icon: TrendingUp,
      label: "참여율",
      value: `${(engagementRate * 100).toFixed(2)}%`,
    },
    {
      icon: Heart,
      label: "평균 좋아요",
      value: formatNumber(avgLikesPerPost),
    },
    {
      icon: MessageCircle,
      label: "평균 댓글",
      value: formatNumber(avgCommentsPerPost),
    },
    {
      icon: Calendar,
      label: "포스팅 주기",
      value: postingFrequencyDays > 0 ? `${postingFrequencyDays}일` : "-",
    },
  ];

  // TikTok-specific: shares & plays
  if (platform === "tiktok" || avgSharesPerPost > 0) {
    metrics.push({
      icon: Share2,
      label: "평균 공유",
      value: formatNumber(avgSharesPerPost),
    });
  }

  if (platform === "tiktok" || avgPlaysPerPost > 0) {
    metrics.push({
      icon: Play,
      label: "평균 조회수",
      value: avgPlaysPerPost > 0 ? formatNumber(avgPlaysPerPost) : "-",
    });
  }

  // CPE metric
  if (estimatedCPE != null && estimatedCPE > 0) {
    metrics.push({
      icon: DollarSign,
      label: "예상 CPE",
      value: `${formatNumber(estimatedCPE)}원`,
    });
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
      {metrics.map((m) => (
        <Card key={m.label} className="border-border/50 bg-card/50">
          <CardContent className="flex items-center gap-2.5 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-sm font-semibold tabular-nums">{m.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
