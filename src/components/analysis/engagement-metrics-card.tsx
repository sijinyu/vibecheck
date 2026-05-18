"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Calendar, TrendingUp, Share2, Play, DollarSign } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

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
  const { t } = useI18n();

  const metrics = [
    {
      icon: TrendingUp,
      label: t("metrics.engagementRate"),
      value: `${(engagementRate * 100).toFixed(2)}%`,
    },
    {
      icon: Heart,
      label: t("metrics.avgLikes"),
      value: formatNumber(avgLikesPerPost),
    },
    {
      icon: MessageCircle,
      label: t("metrics.avgComments"),
      value: formatNumber(avgCommentsPerPost),
    },
    {
      icon: Calendar,
      label: t("metrics.postingFrequency"),
      value: postingFrequencyDays > 0 ? `${postingFrequencyDays}${t("metrics.days")}` : "-",
    },
  ];

  // TikTok-specific: shares & plays
  if (platform === "tiktok" || avgSharesPerPost > 0) {
    metrics.push({
      icon: Share2,
      label: t("metrics.avgShares"),
      value: formatNumber(avgSharesPerPost),
    });
  }

  if (platform === "tiktok" || avgPlaysPerPost > 0) {
    metrics.push({
      icon: Play,
      label: t("metrics.avgPlays"),
      value: avgPlaysPerPost > 0 ? formatNumber(avgPlaysPerPost) : "-",
    });
  }

  // CPE metric
  if (estimatedCPE != null && estimatedCPE > 0) {
    metrics.push({
      icon: DollarSign,
      label: t("metrics.estimatedCPE"),
      value: `${formatNumber(estimatedCPE)}${t("metrics.won")}`,
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
