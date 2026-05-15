"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getBenchmark, type InfluencerTier, type Platform } from "@/lib/ai/vibe-score-engine";

interface BenchmarkBarProps {
  label: string;
  value: number;
  benchmark: number;
  suffix?: string;
  className?: string;
}

export function BenchmarkBar({
  label,
  value,
  benchmark,
  suffix = "",
  className,
}: BenchmarkBarProps) {
  const maxVal = Math.max(value, benchmark) * 1.2 || 1;
  const valueWidth = (value / maxVal) * 100;
  const benchmarkPos = (benchmark / maxVal) * 100;

  const isAbove = value >= benchmark;

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium tabular-nums ${isAbove ? "text-emerald-400" : "text-amber-400"}`}>
          {typeof value === "number" && value < 1
            ? `${(value * 100).toFixed(2)}%`
            : `${value}${suffix}`}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted/30">
        <div
          className={`h-full rounded-full transition-all ${isAbove ? "bg-emerald-500/60" : "bg-amber-500/60"}`}
          style={{ width: `${Math.min(valueWidth, 100)}%` }}
        />
        {/* Benchmark indicator */}
        <div
          className="absolute top-0 h-full w-0.5 bg-muted-foreground/50"
          style={{ left: `${Math.min(benchmarkPos, 100)}%` }}
        />
      </div>
      <p className="mt-0.5 text-[10px] text-muted-foreground/60">
        티어 평균: {typeof benchmark === "number" && benchmark < 1
          ? `${(benchmark * 100).toFixed(2)}%`
          : `${benchmark}${suffix}`}
      </p>
    </div>
  );
}

interface TierBenchmarkCardProps {
  engagementRate: number;
  tier: string;
  platform?: string;
  categories?: string[];
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  platformBenchmark?: number;
  className?: string;
}

export function TierBenchmarkCard({
  engagementRate,
  tier,
  platform = "instagram",
  categories = [],
  avgLikesPerPost,
  avgCommentsPerPost,
  platformBenchmark,
  className,
}: TierBenchmarkCardProps) {
  const erBenchmark = platformBenchmark ?? getBenchmark(
    platform as Platform,
    tier as InfluencerTier,
    categories
  );

  return (
    <Card className={`border-border/50 bg-card/50 ${className ?? ""}`}>
      <CardContent className="space-y-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          티어 벤치마크 비교
        </p>
        <BenchmarkBar
          label="인게이지먼트율"
          value={engagementRate}
          benchmark={erBenchmark}
        />
        <BenchmarkBar
          label="평균 좋아요"
          value={avgLikesPerPost}
          benchmark={Math.round(avgLikesPerPost * 0.8)}
          suffix=""
        />
        <BenchmarkBar
          label="댓글/좋아요 비율"
          value={
            avgLikesPerPost > 0
              ? Math.round((avgCommentsPerPost / avgLikesPerPost) * 1000) / 1000
              : 0
          }
          benchmark={0.03}
        />
      </CardContent>
    </Card>
  );
}
