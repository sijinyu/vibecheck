"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  Bookmark,
} from "lucide-react";

interface KpiCardsProps {
  totalAnalyses: number;
  avgVibeScore: number;
  tierDistribution: Record<string, number>;
  totalSaved: number;
  className?: string;
}

export function KpiCards({
  totalAnalyses,
  avgVibeScore,
  tierDistribution,
  totalSaved,
  className,
}: KpiCardsProps) {
  const topTier =
    Object.entries(tierDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  const kpis = [
    {
      icon: BarChart3,
      label: "총 분석",
      value: totalAnalyses.toString(),
      color: "text-blue-400",
    },
    {
      icon: TrendingUp,
      label: "평균 VibeScore",
      value: avgVibeScore > 0 ? avgVibeScore.toString() : "-",
      color: "text-emerald-400",
    },
    {
      icon: Users,
      label: "주요 티어",
      value: topTier.charAt(0).toUpperCase() + topTier.slice(1),
      color: "text-violet-400",
    },
    {
      icon: Bookmark,
      label: "저장됨",
      value: totalSaved.toString(),
      color: "text-amber-400",
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-2 lg:grid-cols-4 ${className ?? ""}`}>
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border/50 bg-card/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </span>
            </div>
            <p className="mt-1 text-xl font-bold tabular-nums">{kpi.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
