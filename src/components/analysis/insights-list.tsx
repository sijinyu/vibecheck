"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap, AlertTriangle, Lightbulb } from "lucide-react";

interface Insight {
  type: "strength" | "warning" | "opportunity";
  title: string;
  description: string;
}

interface InsightsListProps {
  insights: Insight[];
  className?: string;
}

const INSIGHT_CONFIG = {
  strength: {
    icon: Zap,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    iconColor: "text-emerald-500",
    label: "강점",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    iconColor: "text-amber-500",
    label: "주의",
  },
  opportunity: {
    icon: Lightbulb,
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    iconColor: "text-blue-500",
    label: "기회",
  },
};

export function InsightsList({ insights, className }: InsightsListProps) {
  if (insights.length === 0) return null;

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        AI Insights
      </p>
      {insights.map((insight, i) => {
        const config = INSIGHT_CONFIG[insight.type];
        const Icon = config.icon;

        return (
          <Card
            key={i}
            className={`${config.border} ${config.bg} border`}
          >
            <CardContent className="flex items-start gap-3 py-3">
              <div className={`mt-0.5 ${config.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
