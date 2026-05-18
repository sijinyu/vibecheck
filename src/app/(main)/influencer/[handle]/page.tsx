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
  RefreshCw,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Plus,
  Building2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { DataSourceBanner } from "@/components/analysis/data-source-banner";
import { OutreachModal } from "@/components/analysis/outreach-modal";
import { type DataSource } from "@/lib/adapters/types";

type Tab = "overview" | "content" | "engagement" | "brandfit" | "coaching";

interface PostPerformance {
  imageUrl: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  caption: string;
  hashtags: string[];
  timestamp: string;
  postType: string;
  engagementRate: number;
  performanceIndex: number;
  shortcode?: string;
}

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
  avg_shares_per_post: number | null;
  avg_plays_per_post: number | null;
  posting_frequency_days: number | null;
  top_hashtags: string[];
  content_categories: string[];
  insights: Array<{ type: string; title: string; description: string; evidence?: string }> | null;
  post_performances: PostPerformance[] | null;
  trend_direction: string | null;
  trend_magnitude: number | null;
  estimated_cpe: number | null;
  platform_benchmark: number | null;
  representative_images: string[];
  last_analyzed_at: string | null;
  data_source: string | null;
  discovery_status: string | null;
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
  const [reanalyzing, setReanalyzing] = useState(false);
  const [brands, setBrands] = useState<Array<{ id: string; brand_name: string }>>([]);
  const [savingToBrand, setSavingToBrand] = useState<string | null>(null);
  const [savedBrands, setSavedBrands] = useState<Set<string>>(new Set());
  const [outreachOpen, setOutreachOpen] = useState(false);

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

  // Fetch user's brands for Brand Fit tab
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch("/api/brand");
        const json = await res.json();
        if (res.ok && json.data) {
          setBrands(json.data);
        }
      } catch {
        // silently fail — brands are optional
      }
    }
    fetchBrands();
  }, []);

  async function handleSaveToBrand(brandId: string) {
    if (!data) return;
    setSavingToBrand(brandId);
    try {
      const res = await fetch("/api/saved-influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencer_handle: data.handle,
          influencer_platform: data.platform,
          brand_id: brandId,
        }),
      });
      if (res.ok) {
        setSavedBrands((prev) => new Set([...prev, brandId]));
        toast.success(t("influencer.savedToBrand"));
      } else {
        const json = await res.json();
        if (json.error?.message?.includes("duplicate") || json.error?.message?.includes("already")) {
          setSavedBrands((prev) => new Set([...prev, brandId]));
          toast.info(t("influencer.alreadySaved"));
        } else {
          toast.error(json.error?.message ?? t("influencer.saveFailed"));
        }
      }
    } catch {
      toast.error(t("influencer.saveFailed"));
    } finally {
      setSavingToBrand(null);
    }
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, platform: data?.platform ?? "instagram" }),
      });
      if (res.ok) {
        toast.success(t("influencer.reanalyzeDone"));
        await fetchInfluencer();
      } else {
        const json = await res.json();
        toast.error(json.error?.message ?? t("influencer.reanalyzeFailed"));
      }
    } catch {
      toast.error(t("influencer.reanalyzeFailed"));
    } finally {
      setReanalyzing(false);
    }
  }

  // Check data freshness
  const isStale = data?.last_analyzed_at
    ? Date.now() - new Date(data.last_analyzed_at).getTime() > 7 * 24 * 60 * 60 * 1000
    : false;

  // Light profiles don't have full analysis data
  const isFullProfile = data?.discovery_status === "full" || (data?.post_performances && data.post_performances.length > 0);

  const tabs: { key: Tab; labelKey: "profile.tab.overview" | "profile.tab.content" | "profile.tab.engagement" | "profile.tab.brandfit" | "profile.tab.coaching" }[] = [
    { key: "overview", labelKey: "profile.tab.overview" },
    { key: "content", labelKey: "profile.tab.content" },
    { key: "engagement", labelKey: "profile.tab.engagement" },
    { key: "brandfit", labelKey: "profile.tab.brandfit" },
    { key: "coaching", labelKey: "profile.tab.coaching" },
  ];

  // Use real post performance data from DB
  const hasRealPosts = data?.post_performances && data.post_performances.length > 0;
  const posts = hasRealPosts
    ? data.post_performances!.map((p) => ({
        imageUrl: p.imageUrl,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        caption: p.caption,
        hashtags: p.hashtags,
        timestamp: p.timestamp,
        shortcode: p.shortcode,
      }))
    : [];

  // Representative images for gallery display only (no fake engagement numbers)
  const galleryImages = !hasRealPosts && data?.representative_images
    ? data.representative_images
    : [];

  // Trend direction indicator
  const trendIcon = data?.trend_direction === "rising" ? "↑" : data?.trend_direction === "declining" ? "↓" : "→";

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 lg:max-w-4xl lg:px-8">
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
            {data.profile_image_url ? (
              <img
                src={data.profile_image_url}
                alt={data.display_name ?? data.handle}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ${data.profile_image_url ? "hidden" : ""}`}>
              {(data.display_name ?? data.handle).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold">
                {data.display_name ?? `@${data.handle}`}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  @{data.handle} · {data.platform === "instagram" ? t("platform.instagram") : t("platform.tiktok")}
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

          {/* Data Source + Freshness */}
          <div className="flex flex-wrap items-center gap-2">
            {data.data_source && (
              <DataSourceBanner dataSource={data.data_source as DataSource} />
            )}
            {data.last_analyzed_at && (
              <span className="text-[10px] text-muted-foreground">
                {t("influencer.analyzedAt").replace(
                  "{date}",
                  new Date(data.last_analyzed_at).toLocaleDateString(
                    "ko-KR",
                    { year: "numeric", month: "short", day: "numeric" }
                  )
                )}
              </span>
            )}
            {isStale && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {t("influencer.dataStale")}
              </span>
            )}
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

          {/* Actions */}
          <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOutreachOpen(true)}
            className="shrink-0 gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t("outreach.button")}
          </Button>
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
                    avgSharesPerPost: Number(data.avg_shares_per_post ?? 0),
                    avgPlaysPerPost: Number(data.avg_plays_per_post ?? 0),
                    postingFrequencyDays: Number(data.posting_frequency_days ?? 0),
                    topHashtags: data.top_hashtags ?? [],
                    contentCategories: data.content_categories ?? [],
                    insights: (data.insights ?? []).map((ins) => ({
                      type: ins.type as "strength" | "warning" | "opportunity",
                      title: ins.title,
                      description: ins.description,
                      evidence: ins.evidence,
                    })),
                    postPerformances: (data.post_performances ?? []) as PostPerformance[],
                    contentTypeBreakdown: [],
                    trendDirection: (data.trend_direction as "rising" | "stable" | "declining") ?? "stable",
                    trendMagnitude: data.trend_magnitude ?? 0,
                    estimatedCPE: data.estimated_cpe ?? null,
                    contentEffectivenessScore: 0,
                    platformBenchmark: data.platform_benchmark ?? 0,
                  }
                : undefined
            }
            summary=""
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="shrink-0 gap-1.5"
          >
            {reanalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t("influencer.reanalyze")}
          </Button>
          </div>

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
                    {t("profile.scoreBreakdown")}
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
                avgSharesPerPost={Number(data.avg_shares_per_post ?? 0)}
                avgPlaysPerPost={Number(data.avg_plays_per_post ?? 0)}
                estimatedCPE={data.estimated_cpe}
                platform={data.platform}
              />

              {/* AI Insights (full profiles only — light profiles lack feed analysis) */}
              {isFullProfile && data.insights && data.insights.length > 0 && (
                <InsightsList
                  insights={data.insights.map((ins) => ({
                    type: ins.type as "strength" | "warning" | "opportunity",
                    title: ins.title,
                    description: ins.description,
                    evidence: ins.evidence,
                  }))}
                />
              )}

              {/* Light profile notice */}
              {!isFullProfile && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      {t("influencer.lightProfileNotice")}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Top Performing Posts (real data only) */}
              {posts.length > 0 && (
                <TopPerformingPosts posts={posts} handle={data.handle} platform={data.platform} />
              )}

              {/* Gallery fallback: representative images without engagement data */}
              {posts.length === 0 && galleryImages.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("influencer.recentPosts")}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {galleryImages.slice(0, 6).map((url, i) => (
                      <a
                        key={i}
                        href={`https://www.instagram.com/${data.handle}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <img
                          src={url}
                          alt={`${data.handle} post ${i + 1}`}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    ))}
                  </div>
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">
                    {t("influencer.reanalyzeForEngagement")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Content Tab ─────────────────────────────── */}
          {tab === "content" && (
            <ContentAnalysis
              topHashtags={data.top_hashtags ?? []}
              contentCategories={data.content_categories ?? []}
              posts={posts}
            />
          )}

          {/* ─── Engagement Tab ──────────────────────────── */}
          {tab === "engagement" && (
            <div className="space-y-4">
              {/* Trend Direction */}
              {data.trend_direction && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="text-2xl">{trendIcon}</span>
                    <div>
                      <p className="text-sm font-medium">
                        {data.trend_direction === "rising" ? t("influencer.trendRising") : data.trend_direction === "declining" ? t("influencer.trendDeclining") : t("influencer.trendStable")}
                      </p>
                      {data.trend_magnitude != null && data.trend_magnitude > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t("influencer.trendEngagement")} {data.trend_magnitude}% {data.trend_direction === "rising" ? t("influencer.trendUp") : data.trend_direction === "declining" ? t("influencer.trendDown") : t("influencer.trendFlat")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Engagement Trend */}
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("profile.engagementTrend")}
                  </p>
                  <EngagementTrendChart
                    posts={posts}
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
                  <GrowthChart posts={posts} className="h-40" />
                </CardContent>
              </Card>

              {/* Tier Benchmark */}
              <TierBenchmarkCard
                engagementRate={Number(data.engagement_rate ?? 0)}
                tier={data.tier ?? "micro"}
                platform={data.platform}
                categories={data.content_categories}
                avgLikesPerPost={Number(data.avg_likes_per_post ?? 0)}
                avgCommentsPerPost={Number(data.avg_comments_per_post ?? 0)}
                platformBenchmark={data.platform_benchmark ?? undefined}
              />

              {/* Engagement Metrics */}
              <EngagementMetricsCard
                engagementRate={Number(data.engagement_rate ?? 0)}
                avgLikesPerPost={Number(data.avg_likes_per_post ?? 0)}
                avgCommentsPerPost={Number(data.avg_comments_per_post ?? 0)}
                postingFrequencyDays={Number(data.posting_frequency_days ?? 0)}
                followerCount={data.follower_count ?? 0}
                avgSharesPerPost={Number(data.avg_shares_per_post ?? 0)}
                avgPlaysPerPost={Number(data.avg_plays_per_post ?? 0)}
                estimatedCPE={data.estimated_cpe}
                platform={data.platform}
              />
            </div>
          )}

          {/* ─── Brand Fit Tab ───────────────────────────── */}
          {tab === "brandfit" && (
            <div className="space-y-4">
              {/* Save to Brand — show existing brands */}
              {brands.length > 0 && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("influencer.saveToBrand")}
                    </p>
                    <div className="space-y-2">
                      {brands.map((brand) => {
                        const isSaved = savedBrands.has(brand.id);
                        return (
                          <button
                            key={brand.id}
                            onClick={() => !isSaved && handleSaveToBrand(brand.id)}
                            disabled={savingToBrand === brand.id || isSaved}
                            className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm font-medium">{brand.brand_name}</span>
                            {savingToBrand === brand.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : isSaved ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No brands yet — create one */}
              {brands.length === 0 && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-6 text-center">
                    <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">{t("influencer.registerBrandPrompt")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("influencer.registerBrandDesc")}
                    </p>
                    <Link href="/brands/new">
                      <Button className="mt-4 gap-1.5" size="sm">
                        <Plus className="h-3.5 w-3.5" />
                        {t("influencer.registerBrandCta")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Add new brand link */}
              {brands.length > 0 && (
                <Link href="/brands/new" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Plus className="h-3 w-3" />
                  {t("influencer.addNewBrand")}
                </Link>
              )}

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

      {data && (
        <OutreachModal
          open={outreachOpen}
          onOpenChange={setOutreachOpen}
          influencerHandle={data.handle}
          influencerPlatform={data.platform}
        />
      )}
    </PageTransition>
  );
}
