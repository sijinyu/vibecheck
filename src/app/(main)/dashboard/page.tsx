"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type Tab = "history" | "saved";
type SortBy = "recent" | "score";

interface AnalysisItem {
  id: string;
  handle: string;
  platform: "instagram" | "tiktok";
  aestheticScore: number;
  summary: string | null;
  analyzedAt: string;
}

interface SavedItem {
  influencerId: string;
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string | null;
  aestheticScore: number;
  category: string | null;
  savedAt: string;
}

// Fallback mock data when API is unavailable
const MOCK_HISTORY: AnalysisItem[] = [
  {
    id: "1",
    handle: "minimal_mood",
    platform: "instagram",
    aestheticScore: 89,
    summary: null,
    analyzedAt: "2025-05-07T10:30:00Z",
  },
  {
    id: "2",
    handle: "tone_studio",
    platform: "instagram",
    aestheticScore: 85,
    summary: null,
    analyzedAt: "2025-05-06T15:20:00Z",
  },
  {
    id: "3",
    handle: "vibe_daily",
    platform: "instagram",
    aestheticScore: 78,
    summary: null,
    analyzedAt: "2025-05-05T09:00:00Z",
  },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("history");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [history, setHistory] = useState<AnalysisItem[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
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
      ? b.aestheticScore - a.aestheticScore
      : new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
  );

  const sortedSaved = [...saved].sort((a, b) =>
    sortBy === "score"
      ? b.aestheticScore - a.aestheticScore
      : new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-accent";
    return "text-muted-foreground";
  }

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            분석 히스토리와 저장한 인플루언서
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSortToggle}
          className="text-muted-foreground"
          aria-label={sortBy === "recent" ? "점수순 정렬" : "최신순 정렬"}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={tab === "history" ? "secondary" : "ghost"}
          size="sm"
          className="gap-1.5"
          onClick={() => handleTabChange("history")}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          히스토리
        </Button>
        <Button
          variant={tab === "saved" ? "secondary" : "ghost"}
          size="sm"
          className="gap-1.5"
          onClick={() => handleTabChange("saved")}
        >
          <Bookmark className="h-3.5 w-3.5" />
          저장됨
        </Button>
      </div>

      {/* Sort indicator */}
      <p className="mb-3 text-xs text-muted-foreground">
        {sortBy === "recent" ? "최신순" : "점수순"}
      </p>

      {/* Loading */}
      {loading && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* History Tab */}
      {!loading && tab === "history" && (
        <div className="space-y-2">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {item.handle.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">@{item.handle}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {item.platform}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold tabular-nums ${getScoreColor(item.aestheticScore)}`}
                      >
                        {item.aestheticScore}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.analyzedAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center gap-4 py-16">
                <div className="rounded-xl bg-muted p-4">
                  <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  아직 분석한 인플루언서가 없습니다
                </p>
                <Link href="/analyze">
                  <Button size="sm" className="gap-2">
                    <Search className="h-3.5 w-3.5" />
                    분석하러 가기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Saved Tab */}
      {!loading && tab === "saved" && (
        <div className="space-y-2">
          {sortedSaved.length > 0 ? (
            sortedSaved.map((item, i) => (
              <motion.div
                key={item.influencerId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(item.displayName ?? item.handle).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.displayName ?? `@${item.handle}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          @{item.handle}
                        </p>
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
                        className={`text-lg font-bold tabular-nums ${getScoreColor(item.aestheticScore)}`}
                      >
                        {item.aestheticScore}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.savedAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center gap-4 py-16">
                <div className="rounded-xl bg-muted p-4">
                  <Bookmark className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  저장한 인플루언서가 없습니다
                </p>
                <p className="text-xs text-muted-foreground/60">
                  분석 결과에서 하트를 눌러 저장해보세요
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageTransition>
  );
}
