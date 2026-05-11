"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "@/components/analysis/profile-card";
import { VibeScoreBreakdown } from "@/components/analysis/vibe-score-breakdown";
import { InsightsList } from "@/components/analysis/insights-list";
import { Search, Loader2 } from "lucide-react";
import { VibeSearchUpload } from "@/components/analysis/vibe-search-upload";
import { ShareButton } from "@/components/analysis/share-button";
import { DownloadReportButton } from "@/components/analysis/download-report-button";
import Image from "next/image";
import { type ProfileData } from "@/lib/adapters/types";
import { type AestheticScores } from "@/lib/ai/scoring-engine";
import { type VibeScoreResult } from "@/lib/ai/vibe-score-engine";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

interface AnalysisResultData {
  profile: ProfileData;
  scores: AestheticScores;
  vibeScore: VibeScoreResult;
  representativeImages: string[];
  summary: string;
  analysisId: string | null;
}

type AnalyzeState =
  | { status: "idle" }
  | { status: "loading"; handle: string }
  | { status: "success"; result: AnalysisResultData }
  | { status: "error"; message: string };

type Platform = "instagram" | "tiktok";

interface RecentAnalysis {
  id: string;
  handle: string;
  platform: string;
  vibeScore: number | null;
  aestheticScore: number;
}

export default function AnalyzePage() {
  const { t } = useI18n();
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [state, setState] = useState<AnalyzeState>({ status: "idle" });
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);

  // Fetch recent analyses for discovery
  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (res.ok && json.data?.analyses) {
          setRecentAnalyses(json.data.analyses.slice(0, 6));
        }
      } catch {
        // Silently fail
      }
    }
    fetchRecent();
  }, []);

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!handle.trim()) return;

    setState({ status: "loading", handle: handle.trim() });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), platform }),
      });

      const json = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: json.error?.message ?? t("analyze.error.default"),
        });
        return;
      }

      setState({ status: "success", result: json.data });
      toast.success(t("analyze.success"));
    } catch {
      setState({
        status: "error",
        message: t("common.error.network"),
      });
      toast.error(t("common.error.network"));
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setHandle(e.target.value);
  }

  function handleRetry() {
    setState({ status: "idle" });
    setHandle("");
  }

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
  }

  const isLoading = state.status === "loading";

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-4xl lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Vibe<span className="text-primary">Check</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("analyze.title")}
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Platform Toggle */}
            <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
              {(["instagram", "tiktok"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformChange(p)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    platform === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "instagram" ? "Instagram" : "TikTok"}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={handle}
                onChange={handleInputChange}
                placeholder={
                  platform === "instagram"
                    ? t("analyze.placeholder.instagram")
                    : t("analyze.placeholder.tiktok")
                }
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("analyze.loading")}
                </>
              ) : (
                t("analyze.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {state.status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8"
          >
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    @{state.handle} {t("analyze.loadingHandle")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("analyze.loading.desc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 space-y-3"
          >
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-6 text-center">
                <p className="text-sm text-destructive">{state.message}</p>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRetry}
            >
              {t("analyze.retry")}
            </Button>
          </motion.div>
        )}

        {/* Result */}
        {state.status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 space-y-4"
          >
            <ProfileCard
              handle={state.result.profile.handle}
              platform={state.result.profile.platform}
              displayName={state.result.profile.displayName}
              aestheticScore={state.result.scores.overall}
              vibeScore={state.result.vibeScore?.vibeScore}
              tier={state.result.vibeScore?.tier}
              engagementRate={state.result.vibeScore?.engagementRate}
              scores={{
                color: state.result.scores.color,
                composition: state.result.scores.composition,
                toneConsistency: state.result.scores.toneConsistency,
                trend: state.result.scores.trend,
                brandFit: state.result.scores.styleOriginality,
              }}
            />

            {/* VibeScore Breakdown */}
            {state.result.vibeScore && (
              <VibeScoreBreakdown
                aestheticScore={state.result.scores.overall}
                engagementScore={state.result.vibeScore.engagementScore}
                consistencyScore={state.result.vibeScore.consistencyScore}
                growthPotentialScore={state.result.vibeScore.growthPotentialScore}
                authenticityScore={state.result.vibeScore.authenticityScore}
              />
            )}

            {/* AI Insights */}
            {state.result.vibeScore?.insights &&
              state.result.vibeScore.insights.length > 0 && (
                <InsightsList insights={state.result.vibeScore.insights} />
              )}

            {/* Summary */}
            {state.result.summary && (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {state.result.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Representative Images */}
            {state.result.representativeImages.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("analyze.representativeFeed")}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {state.result.representativeImages.map((url, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      <Image
                        src={url}
                        alt={`Feed ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 200px"
                        unoptimized
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <ShareButton
                handle={state.result.profile.handle}
                platform={state.result.profile.platform}
                scores={state.result.scores}
                summary={state.result.summary}
                analysisId={state.result.analysisId}
              />
              <DownloadReportButton
                handle={state.result.profile.handle}
                platform={state.result.profile.platform}
                displayName={state.result.profile.displayName}
                scores={state.result.scores}
                vibeScore={state.result.vibeScore}
                summary={state.result.summary}
              />
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetry}
              >
                {t("analyze.newHandle")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery sections (idle only) */}
      {state.status === "idle" && (
        <>
          {/* Recent Analyses */}
          {recentAnalyses.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("analyze.recentTitle")}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentAnalyses.map((item) => (
                  <Link
                    key={item.id}
                    href={`/influencer/${item.handle}`}
                    className="shrink-0"
                  >
                    <Card className="w-32 border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                      <CardContent className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium">
                          @{item.handle}
                        </p>
                        <p
                          className={`mt-0.5 text-lg font-bold tabular-nums ${
                            (item.vibeScore ?? item.aestheticScore) >= 80
                              ? "text-primary"
                              : (item.vibeScore ?? item.aestheticScore) >= 60
                                ? "text-accent"
                                : "text-muted-foreground"
                          }`}
                        >
                          {item.vibeScore ?? item.aestheticScore}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.vibeScore ? "VibeScore" : "Aesthetic"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="relative my-8 flex items-center">
            <div className="flex-1 border-t border-border/50" />
            <span className="px-4 text-xs text-muted-foreground">{t("analyze.or")}</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          <VibeSearchUpload />
        </>
      )}
    </PageTransition>
  );
}
