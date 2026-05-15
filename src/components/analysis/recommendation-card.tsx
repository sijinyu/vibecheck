"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  ArrowRight,
  Sparkles,
  ImageOff,
  Plus,
} from "lucide-react";
import { InfluencerTierBadge } from "./influencer-tier-badge";
import { getScoreColor } from "@/lib/score-utils";
import { useI18n } from "@/lib/i18n/context";

export interface RecommendationCardProps {
  influencerId: string;
  handle: string;
  platform: string;
  displayName: string | null;
  profileImageUrl: string | null;
  matchScore: number;
  vibeScore: number;
  tier: string;
  engagementRate: number;
  followerCount: number;
  matchReason: string;
  oneLiner: string | null;
  contentCategories: string[];
  contentTopics: string[];
  topHashtags: string[];
  representativeImages: string[];
  trendDirection: string | null;
  trendMagnitude: number;
  aiSuggestionReason?: string | null;
  onSave?: (influencerId: string) => void;
  onAddToCampaign?: (influencerId: string) => void;
  isSaved?: boolean;
  className?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getMatchBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-blue-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-muted-foreground";
}

function getMatchTextColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-muted-foreground";
}

function getPlatformLabel(platform: string): string {
  if (platform === "instagram") return "IG";
  if (platform === "tiktok") return "TT";
  return platform.toUpperCase().slice(0, 2);
}

// ─── Match Reason Renderer ──────────────────────────────────────────────────

function renderMatchReasons(reasonCodes: string, t: (key: string) => string): string {
  return reasonCodes.split(" · ").map((code) => {
    if (code.startsWith("tone:")) {
      const pct = code.split(":")[1];
      return t("recCard.reasonTone").replace("{pct}", pct);
    }
    const key = `recCard.reason.${code}` as Parameters<typeof t>[0];
    const translated = t(key);
    return translated !== key ? translated : code;
  }).join(" · ");
}

// ─── Trend Icon ─────────────────────────────────────────────────────────────

function TrendIcon({ direction }: { direction: string | null }) {
  if (direction === "up") {
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (direction === "down") {
    return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
  }
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ─── Mini Image Gallery ──────────────────────────────────────────────────────

function MiniGallery({
  images,
  handle,
}: {
  images: string[];
  handle: string;
}) {
  const slots = images.slice(0, 3);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  }, []);

  return (
    <div className="flex gap-1">
      {slots.map((src, i) => (
        <div
          key={i}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border/40"
        >
          {failedImages.has(i) ? (
            <div className="flex h-full w-full items-center justify-center bg-muted/30">
              <ImageOff className="h-3.5 w-3.5 text-muted-foreground/30" />
            </div>
          ) : (
            <Image
              src={src}
              alt={`${handle} post ${i + 1}`}
              fill
              unoptimized
              className="object-cover"
              onError={() => handleImageError(i)}
            />
          )}
        </div>
      ))}
      {/* Placeholder slots when fewer than 3 images */}
      {Array.from({ length: Math.max(0, 3 - slots.length) }).map((_, i) => (
        <div
          key={`placeholder-${i}`}
          className="h-14 w-14 shrink-0 rounded-md border border-border/40 bg-muted/30"
        />
      ))}
    </div>
  );
}

// ─── Match Score Badge ───────────────────────────────────────────────────────

function MatchScoreBadge({ score, matchLabel }: { score: number; matchLabel: string }) {
  const barColor = getMatchBarColor(score);
  const textColor = getMatchTextColor(score);
  const filled = Math.round((score / 100) * 5);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <Sparkles className={`h-3.5 w-3.5 ${textColor}`} />
        <span className={`text-xl font-bold tabular-nums leading-none ${textColor}`}>
          {score}
        </span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-4 rounded-full transition-colors ${
              i < filled ? barColor : "bg-muted/40"
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{matchLabel}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RecommendationCard({
  influencerId,
  handle,
  platform,
  displayName,
  profileImageUrl,
  matchScore,
  vibeScore,
  tier,
  engagementRate,
  followerCount,
  matchReason,
  oneLiner,
  contentCategories,
  topHashtags,
  representativeImages,
  trendDirection,
  aiSuggestionReason,
  onSave,
  onAddToCampaign,
  isSaved = false,
  className,
}: RecommendationCardProps) {
  const { t } = useI18n();
  const [profileImgError, setProfileImgError] = useState(false);
  const platformLabel = getPlatformLabel(platform);
  const primaryCategory = contentCategories[0] ?? null;
  const visibleHashtags = topHashtags.slice(0, 5);

  function handleSaveClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onSave?.(influencerId);
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 hover:border-border/80 ${className ?? ""}`}
    >
      {/* ── Row 1: Mini gallery + Match score ── */}
      <div className="flex items-start justify-between gap-3">
        <MiniGallery images={representativeImages} handle={handle} />
        <MatchScoreBadge score={matchScore} matchLabel={t("recCard.match")} />
      </div>

      {/* ── Row 2: Identity — avatar + handle + tier + platform + category ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative h-6 w-6 shrink-0 rounded-full">
          {profileImageUrl && !profileImgError ? (
            <Image
              src={profileImageUrl}
              alt={displayName ?? handle}
              fill
              unoptimized
              className="rounded-full object-cover"
              onError={() => setProfileImgError(true)}
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {(displayName ?? handle).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-sm font-semibold">@{handle}</span>
        <InfluencerTierBadge tier={tier} />
        <span className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {platformLabel}
        </span>
        {primaryCategory && (
          <span className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {primaryCategory}
          </span>
        )}
      </div>

      {/* ── Row 3: Match reason (always shown) ── */}
      <div className="flex items-start gap-1.5 rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-1.5">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
        <p className="text-[11px] leading-relaxed text-primary/80 line-clamp-2">
          {aiSuggestionReason ?? renderMatchReasons(matchReason, t as (key: string) => string)}
        </p>
      </div>

      {/* ── Row 3b: One-liner AI summary ── */}
      {oneLiner && (
        <p className="text-xs leading-relaxed text-muted-foreground/90 line-clamp-2">
          &ldquo;{oneLiner}&rdquo;
        </p>
      )}

      {/* ── Row 4: Hashtag tags ── */}
      {visibleHashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleHashtags.map((tag) => {
            const normalized = tag.startsWith("#") ? tag : `#${tag}`;
            return (
              <span
                key={tag}
                className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary/80"
              >
                {normalized}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Row 5: Stats + Trend + Actions ── */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Left: Stats */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="font-medium text-foreground/80">
              VibeScore
            </span>{" "}
            <span className={`tabular-nums font-semibold ${getScoreColor(vibeScore)}`}>
              {vibeScore}
            </span>
          </span>
          {engagementRate > 0 && (
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground/80">ER</span>{" "}
              <span className="tabular-nums">
                {(engagementRate * 100).toFixed(1)}%
              </span>
            </span>
          )}
          {followerCount > 0 && (
            <span className="tabular-nums">
              {formatFollowerCount(followerCount)}
            </span>
          )}
          <TrendIcon direction={trendDirection} />
        </div>

        {/* Right: Campaign + Save + Detail */}
        <div className="flex shrink-0 items-center gap-1.5">
          {onAddToCampaign && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCampaign(influencerId);
              }}
              aria-label={t("recCard.addToCampaign")}
              className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              {t("recCard.campaign")}
            </button>
          )}
          {onSave && (
            <button
              onClick={handleSaveClick}
              aria-label={isSaved ? t("recCard.saved") : t("recCard.save")}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                isSaved
                  ? "border-rose-400/40 bg-rose-400/10 text-rose-400"
                  : "border-border/50 bg-muted/30 text-muted-foreground hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-400"
              }`}
            >
              <Heart
                className={`h-3 w-3 ${isSaved ? "fill-rose-400 stroke-rose-400" : ""}`}
              />
              {isSaved ? t("recCard.saved") : t("recCard.save")}
            </button>
          )}
          <Link
            href={`/influencer/${handle}`}
            className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            {t("recCard.detail")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
