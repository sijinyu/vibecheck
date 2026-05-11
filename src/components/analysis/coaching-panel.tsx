"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

interface CoachingData {
  overallAssessment: string;
  strengthAreas: Array<{ area: string; detail: string }>;
  improvementPlan: Array<{
    priority: number;
    area: string;
    currentScore: number;
    targetScore: number;
    actions: string[];
  }>;
  contentStrategy: {
    postingSchedule: string;
    contentMix: string;
    hashtagStrategy: string;
    engagementTips: string[];
  };
  growthRoadmap: {
    shortTerm: string;
    midTerm: string;
    longTerm: string;
  };
  brandPositioning: string;
}

interface CoachingPanelProps {
  handle: string;
}

export function CoachingPanel({ handle }: CoachingPanelProps) {
  const { t } = useI18n();
  const [data, setData] = useState<CoachingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    if (fetchCount === 0) return;

    async function fetchCoaching() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/influencer/${encodeURIComponent(handle)}/coaching`
        );
        const json = await res.json();
        if (res.ok && json.data) {
          setData(json.data);
        } else {
          setError(json.error?.message ?? t("coaching.error"));
        }
      } catch {
        setError(t("common.error.network"));
      } finally {
        setLoading(false);
      }
    }

    fetchCoaching();
  }, [handle, fetchCount, t]);

  // Start screen
  if (fetchCount === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-10 text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h3 className="text-sm font-semibold">{t("coaching.title")}</h3>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {t("coaching.desc")}
          </p>
          <Button
            className="mt-5 gap-2"
            size="sm"
            onClick={() => setFetchCount((c) => c + 1)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("coaching.start")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">{t("coaching.loading")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("coaching.loadingDesc")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setFetchCount((c) => c + 1)}
          >
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Overall Assessment */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium text-primary">{t("coaching.overallAssessment")}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {data.overallAssessment}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {data.strengthAreas.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              {t("coaching.strengths")}
            </p>
            <div className="space-y-3">
              {data.strengthAreas.map((s, i) => (
                <div key={i} className="rounded-lg bg-green-500/5 px-3 py-2.5">
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {s.area}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {s.detail}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Plan */}
      {data.improvementPlan.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-amber-500" />
              {t("coaching.improvementPlan")}
            </p>
            <div className="space-y-4">
              {data.improvementPlan
                .sort((a, b) => a.priority - b.priority)
                .map((plan, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">
                        <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {plan.priority}
                        </span>
                        {plan.area}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {plan.currentScore} → {plan.targetScore}
                      </p>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${plan.currentScore}%`,
                        }}
                      />
                    </div>
                    <ul className="space-y-1 pl-6">
                      {plan.actions.map((action, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Strategy */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
            {t("coaching.contentStrategy")}
          </p>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("coaching.postingSchedule")}
              </p>
              <p className="mt-0.5 text-xs">{data.contentStrategy.postingSchedule}</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("coaching.contentMix")}
              </p>
              <p className="mt-0.5 text-xs">{data.contentStrategy.contentMix}</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("coaching.hashtagStrategy")}
              </p>
              <p className="mt-0.5 text-xs">{data.contentStrategy.hashtagStrategy}</p>
            </div>
            {data.contentStrategy.engagementTips.length > 0 && (
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("coaching.engagementTips")}
                </p>
                <ul className="mt-1 space-y-1">
                  {data.contentStrategy.engagementTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Growth Roadmap */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            {t("coaching.growthRoadmap")}
          </p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="mt-1 h-full w-px bg-border" />
              </div>
              <div className="pb-3">
                <p className="text-[10px] font-bold text-primary">{t("coaching.shortTerm")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {data.growthRoadmap.shortTerm}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <Calendar className="h-4 w-4 text-accent" />
                <div className="mt-1 h-full w-px bg-border" />
              </div>
              <div className="pb-3">
                <p className="text-[10px] font-bold text-accent">{t("coaching.midTerm")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {data.growthRoadmap.midTerm}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-500">{t("coaching.longTerm")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {data.growthRoadmap.longTerm}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Positioning */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            {t("coaching.brandPositioning")}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {data.brandPositioning}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
