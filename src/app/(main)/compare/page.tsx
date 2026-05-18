"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileCard } from "@/components/analysis/profile-card";
import { CompareRadarChart } from "@/components/analysis/compare-radar-chart";
import { Plus, Loader2, X, Trophy, Sparkles } from "lucide-react";
import { type ProfileData } from "@/lib/adapters/types";
import { type AestheticScores } from "@/lib/ai/scoring-engine";
import { type VibeScoreResult } from "@/lib/ai/vibe-score-engine";
import { type CompareResult } from "@/lib/ai/compare-engine";
import { useI18n } from "@/lib/i18n/context";

interface CompareItem {
  profile: ProfileData;
  scores: AestheticScores;
  vibeScore?: VibeScoreResult;
  summary: string;
  representativeImages: string[];
}

type Platform = "instagram" | "tiktok";

type CompareState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      analyses: CompareItem[];
      comparison: CompareResult;
    }
  | { status: "error"; message: string };

export default function ComparePage() {
  const { t, locale } = useI18n();
  const [handles, setHandles] = useState(["", ""]);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [state, setState] = useState<CompareState>({ status: "idle" });

  function handleInputChange(index: number) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const newHandles = [...handles];
      newHandles[index] = e.target.value;
      setHandles(newHandles);
    };
  }

  function handleAddSlot() {
    if (handles.length < 3) {
      setHandles([...handles, ""]);
    }
  }

  function handleRemoveSlot(index: number) {
    if (handles.length > 2) {
      setHandles(handles.filter((_, i) => i !== index));
    }
  }

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
  }

  async function handleCompare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validHandles = handles.filter((h) => h.trim());
    if (validHandles.length < 2) return;

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: validHandles, platform }),
      });

      const json = await response.json();

      if (!response.ok) {
        const message = json.error?.message ?? t("compare.error.default");
        setState({ status: "error", message });
        toast.error(message);
        return;
      }

      setState({
        status: "success",
        analyses: json.data.analyses,
        comparison: json.data.comparison,
      });
      toast.success(t("compare.success"));
    } catch {
      setState({
        status: "error",
        message: t("common.error.network"),
      });
      toast.error(t("compare.error.default"));
    }
  }

  function handleReset() {
    setState({ status: "idle" });
    setHandles(["", ""]);
  }

  const isLoading = state.status === "loading";

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 lg:max-w-4xl lg:px-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">{t("compare.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("compare.desc")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          {t("compare.descSub")}
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <form onSubmit={handleCompare} className="space-y-3">
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
                  {p === "instagram" ? t("platform.instagram") : t("platform.tiktok")}
                </button>
              ))}
            </div>

            {handles.map((handle, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={handle}
                  onChange={handleInputChange(i)}
                  placeholder={
                    t("compare.handlePlaceholder").replace("{n}", String(i + 1))
                  }
                  disabled={isLoading}
                  className="flex-1"
                />
                {handles.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlot(i)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              {handles.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleAddSlot}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />{t("compare.3way")}
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  isLoading || handles.filter((h) => h.trim()).length < 2
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("analyze.loading")}
                  </>
                ) : (
                  t("compare.submit")
                )}
              </Button>
            </div>
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
                  <p className="text-sm font-medium">{t("compare.loading")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("compare.loading.desc")}
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
              onClick={handleReset}
            >
              {t("common.retry")}
            </Button>
          </motion.div>
        )}

        {/* Results */}
        {state.status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 space-y-6"
          >
            {/* Compare Radar Chart */}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("compare.aestheticComparison")}
                </p>
                <CompareRadarChart
                  influencers={state.analyses.map((a) => ({
                    handle: a.profile.handle,
                    color: a.scores.color,
                    composition: a.scores.composition,
                    toneConsistency: a.scores.toneConsistency,
                    trend: a.scores.trend,
                    styleOriginality: a.scores.styleOriginality,
                  }))}
                  className="h-64"
                />
              </CardContent>
            </Card>

            {/* AI Narrative */}
            {state.comparison.narrative && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      {t("compare.aiAnalysis")}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {state.comparison.narrative}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Rankings */}
            {state.comparison.rankings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("compare.rankings")}
                </p>
                {state.comparison.rankings.map((ranking, i) => (
                  <motion.div
                    key={ranking.handle}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="border-border/50 bg-card/50">
                      <CardContent className="flex items-center gap-3 py-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            ranking.rank === 1
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ranking.rank === 1 ? (
                            <Trophy className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-bold">
                              {ranking.rank}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            @{ranking.handle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ranking.strength}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          {ranking.recommendation}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Individual Profile Cards */}
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {state.analyses.map((result, i) => (
                <motion.div
                  key={result.profile.handle}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <ProfileCard
                    handle={result.profile.handle}
                    platform={result.profile.platform}
                    displayName={result.profile.displayName}
                    profileImageUrl={result.profile.profileImageUrl}
                    aestheticScore={result.scores.overall}
                    vibeScore={result.vibeScore?.vibeScore}
                    tier={result.vibeScore?.tier}
                    engagementRate={result.vibeScore?.engagementRate}
                    scores={{
                      color: result.scores.color,
                      composition: result.scores.composition,
                      toneConsistency: result.scores.toneConsistency,
                      trend: result.scores.trend,
                      brandFit: result.scores.styleOriginality,
                    }}
                    linkable={false}
                  />
                </motion.div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleReset}
            >
              {t("compare.newCompare")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
