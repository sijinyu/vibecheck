"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AestheticRadarChart } from "./aesthetic-radar-chart";

interface ProfileCardProps {
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string;
  profileImageUrl?: string;
  aestheticScore: number;
  scores: {
    color: number;
    composition: number;
    toneConsistency: number;
    trend: number;
    brandFit: number;
  };
  category?: string;
  className?: string;
}

export function ProfileCard({
  handle,
  platform,
  displayName,
  aestheticScore,
  scores,
  category,
  className,
}: ProfileCardProps) {
  function getScoreGrade(score: number): string {
    if (score >= 90) return "S";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-accent";
    return "text-muted-foreground";
  }

  const platformLabel = platform === "instagram" ? "Instagram" : "TikTok";

  return (
    <Card
      className={`overflow-hidden border-border/50 bg-card/50 backdrop-blur ${className ?? ""}`}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              @{handle} · {platformLabel}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-bold tabular-nums ${getScoreColor(aestheticScore)}`}
            >
              {aestheticScore}
            </p>
            <p className="text-xs text-muted-foreground">
              Grade {getScoreGrade(aestheticScore)}
            </p>
          </div>
        </div>

        {/* Category */}
        {category && (
          <div className="mt-3">
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
          </div>
        )}

        {/* Radar Chart */}
        <AestheticRadarChart data={scores} className="mt-4 h-52" />

        {/* Score Details with Tooltips */}
        <div className="mt-2 grid grid-cols-5 gap-1 text-center">
          {[
            { label: "색감", value: scores.color, tip: "컬러 팔레트의 조화와 일관성" },
            { label: "구도", value: scores.composition, tip: "시각적 균형감과 프레이밍" },
            { label: "톤", value: scores.toneConsistency, tip: "피드 전반의 톤 통일성" },
            { label: "트렌드", value: scores.trend, tip: "현재 비주얼 트렌드 부합도" },
            { label: "브랜드", value: scores.brandFit, tip: "스타일 독창성과 브랜드 적합도" },
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
}
