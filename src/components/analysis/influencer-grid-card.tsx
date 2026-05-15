"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown, Minus, Clock, ImageOff, MessageSquare } from "lucide-react";
import { getScoreColor } from "@/lib/score-utils";
import { InfluencerTierBadge } from "./influencer-tier-badge";

interface InfluencerGridCardProps {
  handle: string;
  platform: "instagram" | "tiktok";
  displayName?: string | null;
  profileImageUrl?: string | null;
  tier?: string | null;
  vibeScore?: number | null;
  engagementRate?: number | null;
  followerCount?: number | null;
  contentCategories?: string[];
  // NEW fields
  oneLiner?: string | null;
  trendDirection?: string | null;
  trendMagnitude?: number | null;
  representativeImages?: string[];
  lastAnalyzedAt?: string | null;
  discoveryStatus?: string | null;
  onOutreachClick?: (handle: string, platform: string) => void;
}

function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "오늘";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

type TrendConfig = {
  icon: React.ReactNode;
  label: string;
  color: string;
};

function getTrendConfig(
  direction: string | null | undefined,
  magnitude: number | null | undefined
): TrendConfig {
  const mag =
    magnitude != null && magnitude > 0
      ? ` +${magnitude.toFixed(1)}`
      : "";

  if (direction === "rising") {
    return {
      icon: <TrendingUp className="h-3 w-3" />,
      label: `상승${mag}`,
      color: "text-emerald-400",
    };
  }
  if (direction === "declining") {
    return {
      icon: <TrendingDown className="h-3 w-3" />,
      label: `하락${mag}`,
      color: "text-rose-400",
    };
  }
  return {
    icon: <Minus className="h-3 w-3" />,
    label: "안정",
    color: "text-muted-foreground",
  };
}

export function InfluencerGridCard({
  handle,
  platform,
  displayName,
  profileImageUrl,
  tier,
  vibeScore,
  engagementRate,
  followerCount,
  contentCategories = [],
  oneLiner,
  trendDirection,
  trendMagnitude,
  representativeImages = [],
  lastAnalyzedAt,
  discoveryStatus,
  onOutreachClick,
}: InfluencerGridCardProps) {
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [profileImgError, setProfileImgError] = useState(false);

  const handleImageError = useCallback((index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  }, []);

  const initials = (displayName ?? handle).charAt(0).toUpperCase();
  const platformLabel = platform === "instagram" ? "IG" : "TT";
  const platformColor =
    platform === "instagram"
      ? "bg-pink-500/15 text-pink-400 border-pink-500/30"
      : "bg-sky-500/15 text-sky-400 border-sky-500/30";

  const visibleCategories = contentCategories.slice(0, 2);
  const visibleImages = representativeImages.slice(0, 3);
  const hasImages = visibleImages.length > 0 && visibleImages.some((_, i) => !failedImages.has(i));

  const trend = getTrendConfig(trendDirection, trendMagnitude);

  return (
    <Link href={`/influencer/${handle}`} className="block group">
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/60 transition-all duration-200 hover:border-border hover:bg-card hover:shadow-lg hover:shadow-black/20">

        {/* ── 1. Mini image gallery strip ── */}
        {hasImages ? (
          <div className="relative flex h-24 w-full overflow-hidden bg-muted/30">
            {visibleImages.map((src, i) => (
              <div
                key={i}
                className="relative flex-1 overflow-hidden"
                style={{
                  borderRight:
                    i < visibleImages.length - 1
                      ? "1px solid hsl(var(--border) / 0.4)"
                      : undefined,
                }}
              >
                {failedImages.has(i) ? (
                  <div className="flex h-full w-full items-center justify-center bg-muted/30">
                    <ImageOff className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                ) : (
                  <Image
                    src={src}
                    alt={`${handle} post ${i + 1}`}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw, 120px"
                    onError={() => handleImageError(i)}
                  />
                )}
              </div>
            ))}
            {/* Gradient fade at bottom to blend into card body */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card/80 to-transparent" />
          </div>
        ) : (
          /* Placeholder strip when no images */
          <div className="flex h-24 w-full items-center justify-center bg-muted/20">
            <span className="text-3xl font-bold text-muted-foreground/20 select-none">
              {initials}
            </span>
          </div>
        )}

        {/* ── 2. Card body ── */}
        <div className="flex flex-1 flex-col gap-3 p-4">

          {/* Avatar + handle + platform */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0">
              {profileImageUrl && !profileImgError ? (
                <Image
                  src={profileImageUrl}
                  alt={displayName ?? handle}
                  fill
                  unoptimized
                  className="rounded-full object-cover ring-2 ring-border/40"
                  onError={() => setProfileImgError(true)}
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-border/40">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {displayName ?? `@${handle}`}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                @{handle}
              </p>
            </div>
            {/* Platform label pill */}
            <span
              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${platformColor}`}
            >
              {platformLabel}
            </span>
            {discoveryStatus === "stub" && (
              <span className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                AI 추정
              </span>
            )}
          </div>

          {/* VibeScore + tier badge */}
          <div className="flex items-end justify-between">
            <div>
              {vibeScore != null ? (
                <>
                  <p
                    className={`text-3xl font-bold tabular-nums leading-none ${getScoreColor(vibeScore)}`}
                  >
                    {vibeScore}
                  </p>
                  <p className="mt-0.5 text-[10px] tracking-wide text-muted-foreground">
                    VibeScore
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold tabular-nums leading-none text-muted-foreground/30">
                    {discoveryStatus === "stub" ? "미분석" : "--"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                    VibeScore
                  </p>
                </>
              )}
            </div>
            {tier && <InfluencerTierBadge tier={tier} />}
          </div>

          {/* One-liner */}
          {oneLiner && (
            <p className="truncate text-xs leading-relaxed text-muted-foreground">
              {oneLiner}
            </p>
          )}

          {/* Trend indicator + freshness */}
          <div className="flex items-center justify-between gap-2">
            {/* Trend arrow */}
            {(trendDirection != null) && (
              <span
                className={`flex items-center gap-1 text-[11px] font-medium ${trend.color}`}
              >
                {trend.icon}
                {trend.label}
              </span>
            )}

            {/* Freshness: "X일 전 분석" */}
            {lastAnalyzedAt && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Clock className="h-2.5 w-2.5" />
                {getTimeAgo(lastAnalyzedAt)} 분석
              </span>
            )}
          </div>

          {/* ── 3. Bottom: ER + followers + categories ── */}
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            {engagementRate != null && engagementRate > 0 && (
              <span className="rounded-md bg-muted/50 px-1.5 py-0.5 tabular-nums">
                ER {(engagementRate * 100).toFixed(1)}%
              </span>
            )}
            {followerCount != null && followerCount > 0 && (
              <span className="rounded-md bg-muted/50 px-1.5 py-0.5 tabular-nums">
                {formatFollowerCount(followerCount)}
              </span>
            )}
            {visibleCategories.map((cat) => (
              <span
                key={cat}
                className="rounded-md bg-muted/30 px-1.5 py-0.5 text-muted-foreground/70"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Outreach quick action — appears on card hover */}
        {onOutreachClick && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOutreachClick(handle, platform);
            }}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-primary"
            title="아웃리치"
            aria-label="아웃리치 메시지 생성"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Link>
  );
}
