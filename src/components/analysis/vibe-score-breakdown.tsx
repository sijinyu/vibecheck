"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubScore {
  label: string;
  value: number;
  color: string;
  tip: string;
}

interface VibeScoreBreakdownProps {
  aestheticScore: number;
  engagementScore: number;
  consistencyScore: number;
  growthPotentialScore: number;
  authenticityScore: number;
  className?: string;
}

export function VibeScoreBreakdown({
  aestheticScore,
  engagementScore,
  consistencyScore,
  growthPotentialScore,
  authenticityScore,
  className,
}: VibeScoreBreakdownProps) {
  const scores: SubScore[] = [
    {
      label: "미적 퀄리티",
      value: aestheticScore,
      color: "bg-violet-500",
      tip: "피드의 시각적 완성도 — 색감, 구도, 톤 일관성 (40%)",
    },
    {
      label: "인게이지먼트",
      value: engagementScore,
      color: "bg-blue-500",
      tip: "좋아요·댓글 기반 참여율, 티어 벤치마크 대비 (25%)",
    },
    {
      label: "일관성",
      value: consistencyScore,
      color: "bg-emerald-500",
      tip: "포스팅 빈도 규칙성 + 콘텐츠 톤 안정성 (15%)",
    },
    {
      label: "성장 잠재력",
      value: growthPotentialScore,
      color: "bg-amber-500",
      tip: "팔로워/팔로잉 비율, 인게이지먼트 추세 (10%)",
    },
    {
      label: "진정성",
      value: authenticityScore,
      color: "bg-rose-500",
      tip: "가짜 팔로워/봇 인게이지먼트 탐지 (10%)",
    },
  ];

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {scores.map((item, i) => (
        <Tooltip key={item.label}>
          <TooltipTrigger className="cursor-help text-left w-full">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {item.value}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/30">
                <motion.div
                  className={`h-full rounded-full ${item.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{item.tip}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
