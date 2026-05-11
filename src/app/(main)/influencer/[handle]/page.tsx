"use client";

import { useState, useEffect, useCallback, use } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VibeScoreGauge } from "@/components/analysis/vibe-score-gauge";
import { VibeScoreBreakdown } from "@/components/analysis/vibe-score-breakdown";
import { InfluencerTierBadge } from "@/components/analysis/influencer-tier-badge";
import { EngagementMetricsCard } from "@/components/analysis/engagement-metrics-card";
import { InsightsList } from "@/components/analysis/insights-list";
import { TopPerformingPosts } from "@/components/analysis/top-performing-posts";
import { ContentAnalysis } from "@/components/analysis/content-analysis";
import { EngagementTrendChart } from "@/components/analysis/engagement-trend-chart";
import { TierBenchmarkCard } from "@/components/analysis/benchmark-bar";
import { GrowthChart } from "@/components/analysis/growth-chart";
import { CoachingPanel } from "@/components/analysis/coaching-panel";
import { DownloadReportButton } from "@/components/analysis/download-report-button";
import {
  ArrowLeft,
  Loader2,
  Users,
  UserCheck,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

type Tab = "overview" | "content" | "engagement" | "brandfit" | "coaching";

interface InfluencerData {
  id: string;
  handle: string;
  platform: "instagram" | "tiktok";
  display_name: string | null;
  profile_image_url: string | null;
  bio: string | null;
  follower_count: number | null;
  following_count: number | null;
  aesthetic_score: number | null;
  vibe_score: number | null;
  engagement_score: number | null;
  consistency_score: number | null;
  growth_potential_score: number | null;
  authenticity_score: number | null;
  tier: string | null;
  engagement_rate: number | null;
  avg_likes_per_post: number | null;
  avg_comments_per_post: number | null;
  posting_frequency_days: number | null;
  top_hashtags: string[];
  content_categories: string[];
  insights: Array<{ type: string; title: string; description: string }> | null;
  representative_images: string[];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function InfluencerProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<InfluencerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfluencer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/influencer/${encodeURIComponent(handle)}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setData(json.data);
      } else {
        setError(json.error?.message ?? t("profile.notFound"));
      }
    } catch {
      setError(t("common.error.network"));
    } finally {
      setLoading(false);
    }
  }, [handle, t]);

  useEffect(() => {
    fetchInfluencer();
  }, [fetchInfluencer]);

  const tabs: { key: Tab; labelKey: "profile.tab.overview" | "profile.tab.content" | "profile.tab.engagement" | "profile.tab.brandfit" | "profile.tab.coaching" }[] = [
    { key: "overview", labelKey: "profile.tab.overview" },
    { key: "content", labelKey: "profile.tab.content" },
    { key: "engagement", labelKey: "profile.tab.engagement" },
    { key: "brandfit", labelKey: "profile.tab.brandfit" },
    { key: "coaching", labelKey: "profile.tab.coaching" },
  ];

  // Generate mock post data for charts from representative images
  const mockPosts = data?.representative_images.map((url, i) => ({
    imageUrl: url,
    likeCount: Math.max(1, Number(data.avg_likes_per_post ?? 100) + (i % 3 - 1) * 50),
    commentCount: Math.max(0, Number(data.avg_comments_per_post ?? 10) + (i % 2 - 1) * 5),
    caption: "",
    hashtags: data.top_hashtags.slice(0, 3),
    timestamp: new Date(
      Date.now() - i * 2 * 24 * 60 * 60 * 1000
    ).toISOString(),
  })) ?? [];

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-4xl lg:px-8">
      {/* Back button */}
      <Link
        href="/analyze"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("profile.back")}
      </Link>

      {/* Loading */}
      {loading && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="space-y-4">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
          <Link href="/analyze">
            <Button variant="outline" className="w-full">
              {t("profile.goToAnalyze")}
            </Button>
          </Link>
        </div>
      )}

      {/* Profile Data */}
      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {(data.display_name ?? data.handle).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">
                {data.display_name ?? `@${data.handle}`}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  @{data.handle} · {data.platform === "instagram" ? "Instagram" : "TikTok"}
                </p>
                {data.tier && <InfluencerTierBadge tier={data.tier} />}
              </div>
              {data.bio && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {data.bio}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-card/50 px-3 py-2">
              <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">
                {formatNumber(data.follower_count ?? 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">{t("profile.followers")}</p>
            </div>
            <div className="rounded-lg bg-card/50 px-3 py-2">
              <UserCheck className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">
                {data.engagement_rate
                  ? `${(Number(data.engagement_rate) * 100).toFixed(2)}%`
                  : "-"}
              </p>
              <p className="text-[10px] text-muted-foreground">{t("profile.engagementRate")}</p>
            </div>
            <div className="rounded-lg bg-card/50 px-3 py-2">
              <ImageIcon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">
                {data.posting_frequency_days
                  ? `${Number(data.posting_frequency_days).toFixed(1)}${t("profile.dayUnit")}`
                  : "-"}
              </p>
              <p className="text-[10px] text-muted-foreground">{t("profile.postFrequency")}</p>
            </div>
          </div>

          {/* Download Report */}
          <DownloadReportButton
            handle={data.handle}
            platform={data.platform}
            displayName={data.display_name}
            scores={{
              overall: Number(data.aesthetic_score ?? 0),
              color: 0,
              composition: 0,
              toneConsistency: 0,
              trend: 0,
              styleOriginality: 0,
            }}
            vibeScore={
              data.vibe_score != null
                ? {
                    vibeScore: Number(data.vibe_score),
                    aestheticScore: Number(data.aesthetic_score ?? 0),
                    engagementScore: Number(data.engagement_score ?? 0),
                    consistencyScore: Number(data.consistency_score ?? 0),
                    growthPotentialScore: Number(data.growth_potential_score ?? 0),
                    authenticityScore: Number(data.authenticity_score ?? 0),
                    tier: (data.tier as "nano" | "micro" | "mid" | "macro" | "mega") ?? "micro",
                    engagementRate: Number(data.engagement_rate ?? 0),
                    avgLikesPerPost: Number(data.avg_likes_per_post ?? 0),
                    avgCommentsPerPost: Number(data.avg_comments_per_post ?? 0),
                    postingFrequencyDays: Number(data.posting_frequency_days ?? 0),
                    topHashtags: data.top_hashtags ?? [],
                    contentCategories: data.content_categories ?? [],
                    insights: (data.insights ?? []).map((ins) => ({
                      type: ins.type as "strength" | "warning" | "opportunity",
                      title: ins.title,
                      description: ins.description,
                    })),
                  }
                : undefined
            }
            summary=""
            className="w-full"
          />

          {/* Tab Navigation */}
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === tabItem.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(tabItem.labelKey)}
              </button>
            ))}
          </div>

          {/* ─── Overview Tab ─────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* VibeScore Gauge */}
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-6">
                  <VibeScoreGauge
                    score={Number(data.vibe_score ?? data.aesthetic_score ?? 0)}
                  />
                </CardContent>
              </Card>

              {/* Sub-score Breakdown */}
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Score Breakdown
                  </p>
                  <VibeScoreBreakdown
                    aestheticScore={Number(data.aesthetic_score ?? 0)}
                    engagementScore={Number(data.engagement_score ?? 0)}
                    consistencyScore={Number(data.consistency_score ?? 0)}
                    growthPotentialScore={Number(data.growth_potential_score ?? 0)}
                    authenticityScore={Number(data.authenticity_score ?? 0)}
                  />
                </CardContent>
              </Card>

              {/* Engagement Metrics */}
              <EngagementMetricsCard
                engagementRate={Number(data.engagement_rate ?? 0)}
                avgLikesPerPost={Number(data.avg_likes_per_post ?? 0)}
                avgCommentsPerPost={Number(data.avg_comments_per_post ?? 0)}
                postingFrequencyDays={Number(data.posting_frequency_days ?? 0)}
                followerCount={data.follower_count ?? 0}
              />

              {/* AI Insights */}
              {data.insights && data.insights.length > 0 && (
                <InsightsList
                  insights={data.insights.map((ins) => ({
                    type: ins.type as "strength" | "warning" | "opportunity",
                    title: ins.title,
                    description: ins.description,
                  }))}
                />
              )}

              {/* Representative Feed Grid */}
              {data.representative_images.length > 0 && (
                <TopPerformingPosts posts={mockPosts} />
              )}
            </div>
          )}

          {/* ─── Content Tab ─────────────────────────────── */}
          {tab === "content" && (
            <ContentAnalysis
              topHashtags={data.top_hashtags ?? []}
              contentCategories={data.content_categories ?? []}
              posts={mockPosts}
            />
          )}

          {/* ─── Engagement Tab ──────────────────────────── */}
          {tab === "engagement" && (
            <div className="space-y-4">
              {/* Engagement Trend */}
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("profile.engagementTrend")}
                  </p>
                  <EngagementTrendChart
                    posts={mockPosts}
                    followerCount={data.follower_count ?? 1}
                    className="h-48"
                  />
                </CardContent>
              </Card>

              {/* Growth Sparkline */}
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("profile.engagementMomentum")}
                  </p>
                  <GrowthChart posts={mockPosts} className="h-40" />
                </CardContent>
              </Card>

              {/* Tier Benchmark */}
              <TierBenchmarkCard
                engagementRate={Number(data.engagement_rate ?? 0)}
                tier={data.tier ?? "micro"}
                avgLikesPerPost={Number(data.avg_likes_per_post ?? 0)}
                avgCommentsPerPost={Number(data.avg_comments_per_post ?? 0)}
              />

              {/* Engagement Metrics */}
              <EngagementMetricsCard
                engagementRate={Number(data.engagement_rate ?? 0)}
                avgLikesPerPost={Number(data.avg_likes_per_post ?? 0)}
                avgCommentsPerPost={Number(data.avg_comments_per_post ?? 0)}
                postingFrequencyDays={Number(data.posting_frequency_days ?? 0)}
                followerCount={data.follower_count ?? 0}
              />
            </div>
          )}

          {/* ─── Brand Fit Tab ───────────────────────────── */}
          {tab === "brandfit" && (
            <div className="space-y-4">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("profile.brandFitDesc")}
                  </p>
                  <Link href="/brand">
                    <Button className="mt-4" size="sm">
                      {t("profile.registerBrand")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Content Categories as brand fit hints */}
              {data.content_categories.length > 0 && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("profile.recommendedCategories")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.content_categories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ─── Coaching Tab ────────────────────────────── */}
          {tab === "coaching" && <CoachingPanel handle={data.handle} />}
        </motion.div>
      )}
    </PageTransition>
  );
}
