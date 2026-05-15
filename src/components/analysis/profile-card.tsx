"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AestheticRadarChart } from "./aesthetic-radar-chart";
import { InfluencerTierBadge } from "./influencer-tier-badge";
import { getScoreColor, getScoreGrade } from "@/lib/score-utils";
import { useI18n } from "@/lib/i18n/context";

interface ProfileCardProps {
  handle: string;
  platform: "instagram" | "tiktok";
  displayName?: string | null;
  profileImageUrl?: string | null;
  aestheticScore: number;
  vibeScore?: number;
  tier?: string;
  engagementRate?: number;
  scores: {
    color: number;
    composition: number;
    toneConsistency: number;
    trend: number;
    brandFit: number;
  };
  category?: string;
  className?: string;
  linkable?: boolean;
}

export function ProfileCard({
  handle,
  platform,
  displayName,
  profileImageUrl,
  aestheticScore,
  vibeScore,
  tier,
  engagementRate,
  scores,
  category,
  className,
  linkable = true,
}: ProfileCardProps) {
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);
  const displayScore = vibeScore ?? aestheticScore;
  const platformLabel = platform === "instagram" ? "Instagram" : "TikTok";
  const initials = (displayName ?? handle).charAt(0).toUpperCase();

  const cardContent = (
    <Card
      className={`overflow-hidden border-border/50 bg-card/50 backdrop-blur ${linkable ? "transition-colors hover:bg-card/80" : ""} ${className ?? ""}`}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 rounded-full">
            {profileImageUrl && !imgError ? (
              <Image
                src={profileImageUrl}
                alt={displayName ?? handle}
                fill
                unoptimized
                className="rounded-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{displayName ?? handle}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                @{handle} · {platformLabel}
              </p>
              {tier && <InfluencerTierBadge tier={tier} />}
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-bold tabular-nums ${getScoreColor(displayScore)}`}
            >
              {displayScore}
            </p>
            <p className="text-xs text-muted-foreground">
              {vibeScore ? "VibeScore" : "Aesthetic"} {getScoreGrade(displayScore)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {engagementRate !== undefined && engagementRate > 0 && (
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <Tooltip>
              <TooltipTrigger className="cursor-help">
                <span>{t("profileCard.engagementRate")} {(engagementRate * 100).toFixed(2)}%</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">{t("profileCard.engagementRateTip")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Category */}
        {category && (
          <div className="mt-2">
            <span className="rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
              {category}
            </span>
          </div>
        )}

        {/* Radar Chart */}
        <AestheticRadarChart data={scores} className="mt-4 h-52" />

        {/* Score Details with Tooltips */}
        <div className="mt-2 grid grid-cols-5 gap-1 text-center">
          {[
            { label: t("profileCard.color"), value: scores.color, tip: t("profileCard.colorTip") },
            { label: t("profileCard.composition"), value: scores.composition, tip: t("profileCard.compositionTip") },
            { label: t("profileCard.tone"), value: scores.toneConsistency, tip: t("profileCard.toneTip") },
            { label: t("profileCard.trend"), value: scores.trend, tip: t("profileCard.trendTip") },
            { label: t("profileCard.brand"), value: scores.brandFit, tip: t("profileCard.brandTip") },
          ].map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger className="cursor-help">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p
                  className={`text-sm font-semibold tabular-nums ${getScoreColor(item.value)}`}
                >
                  {item.value}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{item.tip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (linkable) {
    return (
      <Link href={`/influencer/${handle}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
