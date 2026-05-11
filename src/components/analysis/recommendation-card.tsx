"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { InfluencerTierBadge } from "./influencer-tier-badge";
import { TrendingUp, Sparkles } from "lucide-react";

interface RecommendationCardProps {
  handle: string;
  platform: string;
  displayName: string | null;
  matchScore: number;
  vibeScore: number | null;
  tier: string | null;
  engagementRate: number | null;
  matchReason: string;
  className?: string;
}

function getMatchColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-muted-foreground";
}

export function RecommendationCard({
  handle,
  platform,
  displayName,
  matchScore,
  vibeScore,
  tier,
  engagementRate,
  matchReason,
  className,
}: RecommendationCardProps) {
  return (
    <Link href={`/influencer/${handle}`} className="block">
      <Card
        className={`border-border/50 bg-card/50 transition-colors hover:bg-card/80 ${className ?? ""}`}
      >
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {(displayName ?? handle).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {displayName ?? `@${handle}`}
                </p>
                {tier && <InfluencerTierBadge tier={tier} />}
              </div>
              <p className="text-xs text-muted-foreground">
                @{handle} · {platform === "instagram" ? "IG" : "TT"}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Sparkles className={`h-3.5 w-3.5 ${getMatchColor(matchScore)}`} />
                <p className={`text-lg font-bold tabular-nums ${getMatchColor(matchScore)}`}>
                  {matchScore}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Match</p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            {vibeScore != null && <span>VibeScore {vibeScore}</span>}
            {engagementRate != null && engagementRate > 0 && (
              <span className="flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                ER {(engagementRate * 100).toFixed(1)}%
              </span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-muted-foreground/80">
            {matchReason}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
