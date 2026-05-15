"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ScoreDistributionChart } from "@/components/dashboard/score-distribution-chart";
import { EngagementBenchmarkChart } from "@/components/dashboard/engagement-benchmark-chart";
import { InfluencerTierBadge } from "@/components/analysis/influencer-tier-badge";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  ArrowUpDown,
  Loader2,
  Download,
  Trash2,
  X,
  Palette,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { getScoreColor } from "@/lib/score-utils";
import { useI18n } from "@/lib/i18n/context";
import { generateAnalysesCsv, downloadCsv } from "@/lib/export/csv-generator";

type Tab = "history" | "saved";
type SortBy = "recent" | "score";
type DateRange = "7d" | "30d" | "90d" | "all";

interface AnalysisItem {
  id: string;
  handle: string;
  platform: "instagram" | "tiktok";
  aestheticScore: number;
  vibeScore: number | null;
  engagementScore: number | null;
  consistencyScore: number | null;
  growthPotentialScore: number | null;
  authenticityScore: number | null;
  engagementRate: number | null;
  summary: string | null;
  analyzedAt: string;
}

interface SavedItem {
  influencerId: string;
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string | null;
  aestheticScore: number;
  vibeScore: number;
  tier: string | null;
  engagementRate: number;
  category: string | null;
  savedAt: string;
}

interface DashboardStats {
  totalAnalyses: number;
  avgVibeScore: number;
  tierDistribution: Record<string, number>;
  scoreDistribution: Array<{ range: string; count: number }>;
  totalSaved: number;
}

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("history");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [history, setHistory] = useState<AnalysisItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [unsavingIds, setUnsavingIds] = useState<Set<string>>(new Set());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange !== "all") {
        const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
        const from = new Date();
        from.setDate(from.getDate() - days);
        params.set("dateFrom", from.toISOString());
      }

      const res = await fetch(`/api/dashboard?${params}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setHistory(json.data.analyses ?? []);
        setSaved(json.data.saved ?? []);
        setStats(json.data.stats ?? null);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  function handleCsvDownload() {
    if (history.length === 0) return;
    const csv = generateAnalysesCsv(history);
    downloadCsv(csv, `vibecheck-analyses-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(t("dashboard.csvSuccess"));
  }

  function handleSortToggle() {
    setSortBy(sortBy === "recent" ? "score" : "recent");
  }

  async function handleDeleteAnalysis(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingIds((prev) => new Set([...prev, id]));
    try {
      const res = await fetch("/api/dashboard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisIds: [id] }),
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        toast.success(t("dashboard.deleted"));
      } else {
        toast.error(t("dashboard.deleteFailed"));
      }
    } catch {
      toast.error(t("dashboard.deleteFailed"));
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleClearAllHistory() {
    if (history.length === 0) return;
    const ids = history.map((h) => h.id);
    setDeletingIds(new Set(ids));
    try {
      const res = await fetch("/api/dashboard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisIds: ids }),
      });
      if (res.ok) {
        setHistory([]);
        toast.success(t("dashboard.allDeleted"));
      } else {
        toast.error(t("dashboard.deleteFailed"));
      }
    } catch {
      toast.error(t("dashboard.deleteFailed"));
    } finally {
      setDeletingIds(new Set());
    }
  }

  async function handleUnsave(influencerId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setUnsavingIds((prev) => new Set([...prev, influencerId]));
    try {
      const res = await fetch("/api/saved-influencers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencerId }),
      });
      if (res.ok) {
        setSaved((prev) => prev.filter((item) => item.influencerId !== influencerId));
        toast.success(t("dashboard.unsaved"));
      } else {
        toast.error(t("dashboard.unsaveFailed"));
      }
    } catch {
      toast.error(t("dashboard.unsaveFailed"));
    } finally {
      setUnsavingIds((prev) => {
        const next = new Set(prev);
        next.delete(influencerId);
        return next;
      });
    }
  }

  const sortedHistory = [...history].sort((a, b) =>
    sortBy === "score"
      ? (b.vibeScore ?? b.aestheticScore) - (a.vibeScore ?? a.aestheticScore)
      : new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
  );

  const sortedSaved = [...saved].sort((a, b) =>
    sortBy === "score"
      ? (b.vibeScore ?? b.aestheticScore) - (a.vibeScore ?? a.aestheticScore)
      : new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-4xl lg:px-8">
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("dashboard.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCsvDownload}
              className="text-muted-foreground"
              disabled={history.length === 0}
              aria-label={t("dashboard.csvDownload")}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSortToggle}
              className="text-muted-foreground"
              aria-label={sortBy === "recent" ? t("common.sortByRecent") : t("common.sortByScore")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                dateRange === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`dashboard.dateRange.${range}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {!loading && history.length === 0 && saved.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {/* Onboarding Hero */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card/50 to-card/50">
            <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
              <div className="rounded-2xl bg-primary/10 p-5">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{t("onboarding.welcome")}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {t("onboarding.welcomeDesc")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/brands/new">
              <Card className="group cursor-pointer border-border/50 bg-card/50 transition-all hover:bg-card/80 hover:border-primary/30 hover:shadow-sm">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{t("onboarding.step1Title")}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t("onboarding.step1Desc")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/analyze">
              <Card className="group cursor-pointer border-border/50 bg-card/50 transition-all hover:bg-card/80 hover:border-primary/30 hover:shadow-sm">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-lg font-bold text-muted-foreground">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{t("onboarding.step2Title")}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t("onboarding.step2Desc")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      )}

      {!loading && (history.length > 0 || saved.length > 0) && (
        <div className="space-y-6">
          {/* KPI Cards */}
          {stats && (
            <KpiCards
              totalAnalyses={stats.totalAnalyses}
              avgVibeScore={stats.avgVibeScore}
              tierDistribution={stats.tierDistribution}
              totalSaved={stats.totalSaved}
            />
          )}

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {stats?.scoreDistribution && (
              <ScoreDistributionChart data={stats.scoreDistribution} />
            )}
            <EngagementBenchmarkChart analyses={history} />
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={tab === "history" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTab("history")}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {t("dashboard.history")}
                {history.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                    {history.length}
                  </span>
                )}
              </Button>
              <Button
                variant={tab === "saved" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTab("saved")}
              >
                <Bookmark className="h-3.5 w-3.5" />
                {t("dashboard.saved")}
                {saved.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                    {saved.length}
                  </span>
                )}
              </Button>
            </div>

            {/* Clear all (history tab only) */}
            {tab === "history" && history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleClearAllHistory}
              >
                <Trash2 className="h-3 w-3" />
                {t("dashboard.clearAll")}
              </Button>
            )}
          </div>

          {/* Sort indicator */}
          <p className="text-xs text-muted-foreground">
            {sortBy === "recent" ? t("dashboard.sortRecent") : t("dashboard.sortScore")}
          </p>

          {/* History Tab */}
          {tab === "history" && (
            <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {sortedHistory.length > 0 ? (
                sortedHistory.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/influencer/${item.handle}`}>
                      <Card className="group cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                        <CardContent className="flex items-center gap-3 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {item.handle.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">@{item.handle}</p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs capitalize text-muted-foreground">
                                {item.platform}
                              </p>
                              {item.engagementRate && item.engagementRate > 0 && (
                                <span className="text-[10px] text-muted-foreground/60">
                                  ER {(Number(item.engagementRate) * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`text-lg font-bold tabular-nums ${getScoreColor(item.vibeScore ?? item.aestheticScore)}`}
                            >
                              {item.vibeScore ?? item.aestheticScore}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(item.analyzedAt).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US")}
                            </p>
                          </div>
                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDeleteAnalysis(item.id, e)}
                            disabled={deletingIds.has(item.id)}
                            className="shrink-0 rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            aria-label={t("common.delete")}
                          >
                            {deletingIds.has(item.id) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="border-border/50 bg-card/50 lg:col-span-2">
                  <CardContent className="flex flex-col items-center gap-4 py-16">
                    <div className="rounded-xl bg-primary/10 p-4">
                      <Search className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {t("dashboard.emptyHistory")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("dashboard.emptyHistoryDesc")}
                      </p>
                    </div>
                    <Link href="/analyze">
                      <Button size="sm" className="gap-2">
                        <Search className="h-3.5 w-3.5" />
                        {t("dashboard.goAnalyze")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Saved Tab */}
          {tab === "saved" && (
            <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {sortedSaved.length > 0 ? (
                sortedSaved.map((item, i) => (
                  <motion.div
                    key={item.influencerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/influencer/${item.handle}`}>
                      <Card className="group cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                        <CardContent className="flex items-center gap-3 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {(item.displayName ?? item.handle)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.displayName ?? `@${item.handle}`}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                @{item.handle}
                              </p>
                              {item.tier && (
                                <InfluencerTierBadge tier={item.tier} />
                              )}
                              {item.category && (
                                <Badge
                                  variant="secondary"
                                  className="px-1.5 py-0 text-[10px]"
                                >
                                  {item.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`text-lg font-bold tabular-nums ${getScoreColor(item.vibeScore ?? item.aestheticScore)}`}
                            >
                              {item.vibeScore ?? item.aestheticScore}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(item.savedAt).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US")}
                            </p>
                          </div>
                          {/* Unsave button */}
                          <button
                            onClick={(e) => handleUnsave(item.influencerId, e)}
                            disabled={unsavingIds.has(item.influencerId)}
                            className="shrink-0 rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            aria-label={t("dashboard.unsaveLabel")}
                          >
                            {unsavingIds.has(item.influencerId) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="border-border/50 bg-card/50 lg:col-span-2">
                  <CardContent className="flex flex-col items-center gap-4 py-16">
                    <div className="rounded-xl bg-muted p-4">
                      <Bookmark className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.emptySaved")}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {t("dashboard.emptySavedDesc")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}
