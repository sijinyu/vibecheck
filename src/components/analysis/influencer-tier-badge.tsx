"use client";

import { Badge } from "@/components/ui/badge";

interface InfluencerTierBadgeProps {
  tier: string;
  className?: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  nano: { label: "Nano", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  micro: { label: "Micro", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  mid: { label: "Mid", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30" },
  macro: { label: "Macro", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  mega: { label: "Mega", color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/30" },
};

export function InfluencerTierBadge({ tier, className }: InfluencerTierBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.nano;

  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.color} border text-[10px] font-semibold uppercase tracking-wider ${className ?? ""}`}
    >
      {config.label}
    </Badge>
  );
}

export function getTierLabel(tier: string): string {
  return TIER_CONFIG[tier]?.label ?? "Unknown";
}
