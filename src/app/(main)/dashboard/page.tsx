"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { getScoreColor } from "@/lib/score-utils";
import { useI18n } from "@/lib/i18n/context";

type Tab = "history" | "saved";
type SortBy = "recent" | "score";

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

const MOCK_HISTORY: AnalysisItem[] = [
  {
    id: "1",
    handle: "minimal_mood",
    platform: "instagram",
    aestheticScore: 89,
    vibeScore: 82,
    engagementScore: 75,
    consistencyScore: 85,
    growthPotentialScore: 60,
    authenticityScore: 90,
    engagementRate: 0.035,
    summary: null,
    analyzedAt: "2025-05-07T10:30:00Z",
  },
  {
    id: "2",
    handle: "tone_studio",
    platform: "instagram",
    aestheticScore: 85,
    vibeScore: 78,
    engagementScore: 70,
    consistencyScore: 80,
    growthPotentialScore: 55,
    authenticityScore: 88,
    engagementRate: 0.028,
    summary: null,
    analyzedAt: "2025-05-06T15:20:00Z",
  },
  {
    id: "3",
    handle: "vibe_daily",
    platform: "instagram",
    aestheticScore: 78,
    vibeScore: 71,
    engagementScore: 65,
    consistencyScore: 68,
    growthPotentialScore: 72,
    authenticityScore: 80,
    engagementRate: 0.042,
    summary: null,
    analyzedAt: "2025-05-05T09:00:00Z",
  },
];

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Tab>("history");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [history, setHistory] = useState<AnalysisItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();

      if (res.ok && json.data) {
        setHistory(
          json.data.analyses.length > 0 ? json.data.analyses : MOCK_HISTORY
        );
        setSaved(json.data.saved ?? []);
        setStats(json.data.stats ?? null);
      } else {
        setHistory(MOCK_HISTORY);
      }
    } catch {
      setHistory(MOCK_HISTORY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
  }

  function handleSortToggle() {
    setSortBy(sortBy === "recent" ? "score" : "recent");
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
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

      {/* Loading */}
      {loading && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {!loading && (
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
          <div className="flex gap-2">
            <Button
              variant={tab === "history" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => handleTabChange("history")}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {t("dashboard.history")}
            </Button>
            <Button
              variant={tab === "saved" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => handleTabChange("saved")}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {t("dashboard.saved")}
            </Button>
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
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/influencer/${item.handle}`}>
                      <Card className="cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                        <CardContent className="flex items-center gap-3 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {item.handle.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">@{item.handle}</p>
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
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold tabular-nums ${getScoreColor(item.vibeScore ?? item.aestheticScore)}`}
                            >
                              {item.vibeScore ?? item.aestheticScore}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(item.analyzedAt).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="flex flex-col items-center gap-4 py-16">
                    <div className="rounded-xl bg-muted p-4">
                      <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.emptyHistory")}
                    </p>
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
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/influencer/${item.handle}`}>
                      <Card className="cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                        <CardContent className="flex items-center gap-3 py-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {(item.displayName ?? item.handle)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
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
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold tabular-nums ${getScoreColor(item.vibeScore ?? item.aestheticScore)}`}
                            >
                              {item.vibeScore ?? item.aestheticScore}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(item.savedAt).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US")}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <Card className="border-border/50 bg-card/50">
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
