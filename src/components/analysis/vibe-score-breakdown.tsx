"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n/context";

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
  const { t } = useI18n();

  const scores: SubScore[] = [
    {
      label: t("score.aesthetic"),
      value: aestheticScore,
      color: "bg-violet-500",
      tip: t("score.aesthetic.tip"),
    },
    {
      label: t("score.engagement"),
      value: engagementScore,
      color: "bg-blue-500",
      tip: t("score.engagement.tip"),
    },
    {
      label: t("score.consistency"),
      value: consistencyScore,
      color: "bg-emerald-500",
      tip: t("score.consistency.tip"),
    },
    {
      label: t("score.growth"),
      value: growthPotentialScore,
      color: "bg-amber-500",
      tip: t("score.growth.tip"),
    },
    {
      label: t("score.authenticity"),
      value: authenticityScore,
      color: "bg-rose-500",
      tip: t("score.authenticity.tip"),
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
