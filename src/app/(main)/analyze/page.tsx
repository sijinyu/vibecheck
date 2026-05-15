"use client";

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "@/components/analysis/profile-card";
import { VibeScoreBreakdown } from "@/components/analysis/vibe-score-breakdown";
import { InsightsList } from "@/components/analysis/insights-list";
import { Search, Loader2, TrendingUp, Sparkles, Zap, Crown, Hash, Heart, MessageCircle, Building2 } from "lucide-react";
import { ShareButton } from "@/components/analysis/share-button";
import { DownloadReportButton } from "@/components/analysis/download-report-button";
import { InfluencerGridCard } from "@/components/analysis/influencer-grid-card";
import { SkeletonList } from "@/components/ui/skeleton-card";
import Image from "next/image";
import { type ProfileData } from "@/lib/adapters/types";
import { type AestheticScores } from "@/lib/ai/scoring-engine";
import { type VibeScoreResult } from "@/lib/ai/vibe-score-engine";
import { type Influencer } from "@/lib/supabase/types";
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

type SortOption = "vibeScore" | "followers" | "engagement" | "newest";

const TIER_OPTIONS = ["nano", "micro", "mid", "macro", "mega"] as const;
const CATEGORY_OPTIONS = ["Fashion", "Beauty", "Food", "Travel", "Fitness", "Lifestyle", "Tech", "Art"] as const;

const CATEGORY_CARDS = [
  { emoji: "👗", name: "Fashion" },
  { emoji: "💄", name: "Beauty" },
  { emoji: "🍳", name: "Food" },
  { emoji: "💪", name: "Fitness" },
  { emoji: "✈️", name: "Travel" },
  { emoji: "🏠", name: "Lifestyle" },
  { emoji: "📱", name: "Tech" },
  { emoji: "🎨", name: "Art" },
  { emoji: "🎵", name: "Music" },
  { emoji: "👶", name: "Parenting" },
  { emoji: "🐕", name: "Pets" },
  { emoji: "🏡", name: "Home" },
  { emoji: "📚", name: "Education" },
  { emoji: "🎬", name: "Entertainment" },
  { emoji: "🧘", name: "Wellness" },
  { emoji: "🏥", name: "Health" },
  { emoji: "💰", name: "Finance" },
  { emoji: "🎮", name: "Gaming" },
  { emoji: "⚽", name: "Sports" },
  { emoji: "📷", name: "Photography" },
] as const;

export default function AnalyzePage() {
  const { t } = useI18n();
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [state, setState] = useState<AnalyzeState>({ status: "idle" });
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);

  // Discovery state
  const [filterTier, setFilterTier] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterPlatform, setFilterPlatform] = useState<string>("");
  const [filterMinVibe, setFilterMinVibe] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("vibeScore");
  const [browseResults, setBrowseResults] = useState<Influencer[]>([]);
  const [browsePage, setBrowsePage] = useState(0);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [trending, setTrending] = useState<(Influencer & { analysisCount: number })[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // New discovery state
  interface TrendingBrand {
    id: string;
    name: string;
    handle: string | null;
    platform: string | null;
    description: string | null;
    preferred_tiers: string[] | null;
    target_categories: string[] | null;
    brand_keywords: string[] | null;
    scores: { overall?: number } | null;
    created_at: string;
  }
  interface TrendingPost {
    imageUrl: string | null;
    likeCount: number;
    commentCount: number;
    engagementRate: number;
    influencerHandle: string;
    influencerTier: string | null;
    caption: string | null;
    hashtags: string[];
  }
  interface TrendingHashtag {
    hashtag: string;
    count: number;
    influencerCount: number;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type CuratedInfluencer = Record<string, any>;

  const [trendingBrands, setTrendingBrands] = useState<TrendingBrand[]>([]);
  const [trendingContent, setTrendingContent] = useState<TrendingPost[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [hiddenGems, setHiddenGems] = useState<CuratedInfluencer[]>([]);
  const [risingStars, setRisingStars] = useState<CuratedInfluencer[]>([]);
  const [engagementLeaders, setEngagementLeaders] = useState<CuratedInfluencer[]>([]);
  const [categoryTop, setCategoryTop] = useState<CuratedInfluencer[]>([]);

  // Hashtag discovery
  const [hashtagInfluencers, setHashtagInfluencers] = useState<Influencer[]>([]);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [hashtagLoading, setHashtagLoading] = useState(false);

  // Fetch all discovery data on mount
  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (res.ok && json.data?.analyses) {
          setRecentAnalyses(json.data.analyses.slice(0, 6));
        }
      } catch {
        console.error("[analyze] fetchRecent failed");
      }
    }

    async function fetchTrending() {
      try {
        const res = await fetch("/api/influencers/trending");
        const json = await res.json();
        if (res.ok && json.data) setTrending(json.data);
      } catch {
        console.error("[analyze] fetchTrending failed");
      }
    }

    async function fetchTrendingBrands() {
      try {
        const res = await fetch("/api/brands/trending");
        const json = await res.json();
        if (res.ok && json.data) setTrendingBrands(json.data);
      } catch {
        console.error("[analyze] fetchTrendingBrands failed");
      }
    }

    async function fetchTrendingContent() {
      try {
        const res = await fetch("/api/content/trending");
        const json = await res.json();
        if (res.ok && json.data) setTrendingContent(json.data);
      } catch {
        console.error("[analyze] fetchTrendingContent failed");
      }
    }

    async function fetchTrendingHashtags() {
      try {
        const res = await fetch("/api/hashtags/trending");
        const json = await res.json();
        if (res.ok && json.data) setTrendingHashtags(json.data);
      } catch {
        console.error("[analyze] fetchTrendingHashtags failed");
      }
    }

    async function fetchCurated(type: string, setter: (data: CuratedInfluencer[]) => void) {
      try {
        const res = await fetch(`/api/influencers/curated?type=${type}`);
        const json = await res.json();
        if (res.ok && json.data) setter(json.data);
      } catch {
        console.error(`[analyze] fetchCurated(${type}) failed`);
      }
    }

    async function fetchCategoryCounts() {
      try {
        const res = await fetch("/api/influencers/category-counts");
        const json = await res.json();
        if (res.ok && json.data) setCategoryCounts(json.data);
      } catch {
        console.error("[analyze] fetchCategoryCounts failed");
      }
    }

    fetchRecent();
    fetchTrending();
    fetchTrendingBrands();
    fetchTrendingContent();
    fetchTrendingHashtags();
    fetchCurated("hidden-gems", setHiddenGems);
    fetchCurated("rising-stars", setRisingStars);
    fetchCurated("engagement-leaders", setEngagementLeaders);
    fetchCurated("category-top", setCategoryTop);
    fetchCategoryCounts();
  }, []);

  // Fetch browse results
  const fetchBrowse = useCallback(async (page = 0, append = false) => {
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTier) params.set("tier", filterTier);
      if (filterCategory) params.set("category", filterCategory);
      if (filterPlatform) params.set("platform", filterPlatform);
      if (filterMinVibe) params.set("minVibeScore", filterMinVibe);
      params.set("sort", sortBy);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(`/api/influencers?${params}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setBrowseResults(prev => append ? [...prev, ...json.data] : json.data);
        setBrowseTotal(json.meta?.total ?? 0);
        setBrowsePage(page);
      }
    } catch {
      console.error("[analyze] fetchBrowse failed");
    } finally {
      setBrowseLoading(false);
    }
  }, [filterTier, filterCategory, filterPlatform, filterMinVibe, sortBy]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchBrowse(0);
  }, [fetchBrowse]);

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

  async function handleHashtagClick(hashtag: string) {
    const normalized = hashtag.replace("#", "");
    setActiveHashtag(normalized);
    setHashtagLoading(true);
    setHashtagInfluencers([]);
    try {
      const res = await fetch(`/api/hashtags/${encodeURIComponent(normalized)}/influencers`);
      const json = await res.json();
      if (res.ok && json.data) {
        setHashtagInfluencers(json.data);
      }
    } catch {
      toast.error(t("discover.hashtagFetchFail"));
    } finally {
      setHashtagLoading(false);
    }
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
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 lg:max-w-4xl lg:px-8">
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
              profileImageUrl={state.result.profile.profileImageUrl}
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
          {/* ── Category Browse ── */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="text-sm font-semibold">{t("discover.categoryBrowse")}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {CATEGORY_CARDS.map(({ emoji, name }) => {
                const count = categoryCounts[name] ?? 0;
                const isActive = filterCategory === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setFilterCategory(isActive ? "" : name);
                      const browseEl = document.getElementById("browse-section");
                      if (browseEl) browseEl.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border/50 bg-card/50 text-muted-foreground hover:border-border hover:bg-card/80"
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-[11px] font-medium leading-tight">{name}</span>
                    {count > 0 && (
                      <span className="text-[9px] tabular-nums opacity-60">{count.toLocaleString()}{t("discover.countSuffix")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Analyses */}
          {recentAnalyses.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("analyze.recentTitle")}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentAnalyses.map((item) => (
                  <Link key={item.id} href={`/influencer/${item.handle}`} className="shrink-0">
                    <Card className="w-32 border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                      <CardContent className="px-3 py-2.5">
                        <p className="truncate text-xs font-medium">@{item.handle}</p>
                        <p className={`mt-0.5 text-lg font-bold tabular-nums ${
                          (item.vibeScore ?? item.aestheticScore) >= 80 ? "text-primary"
                            : (item.vibeScore ?? item.aestheticScore) >= 60 ? "text-accent"
                            : "text-muted-foreground"
                        }`}>
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

          {/* ── Trending Influencers ── */}
          {trending.length > 0 && (
            <DiscoverSection
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              title={t("discover.trending")}
              desc={t("discover.trendingDesc")}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {trending.slice(0, 8).map((item) => (
                  <InfluencerGridCard
                    key={item.id}
                    handle={item.handle}
                    platform={item.platform}
                    displayName={item.display_name}
                    profileImageUrl={item.profile_image_url}
                    tier={item.tier}
                    vibeScore={item.vibe_score}
                    engagementRate={item.engagement_rate}
                    followerCount={item.follower_count}
                    contentCategories={item.content_categories}
                    oneLiner={item.one_liner}
                    trendDirection={item.trend_direction}
                    trendMagnitude={item.trend_magnitude}
                    representativeImages={item.representative_images}
                    lastAnalyzedAt={item.last_analyzed_at}
                  />
                ))}
              </div>
            </DiscoverSection>
          )}

          {/* ── Trending Brands ── */}
          {trendingBrands.length > 0 && (
            <DiscoverSection
              icon={<Building2 className="h-4 w-4 text-violet-400" />}
              title={t("discover.trendingBrands")}
              desc={t("discover.trendingBrandsDesc")}
            >
              <div className="flex gap-3 overflow-x-auto pb-2">
                {trendingBrands.map((brand) => (
                  <Link key={brand.id} href={`/brands/${brand.id}`} className="shrink-0">
                    <Card className="w-56 border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                      <CardContent className="space-y-2 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-semibold">{brand.name}</p>
                          {brand.scores?.overall != null && (
                            <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                              {brand.scores.overall}
                            </span>
                          )}
                        </div>
                        {brand.handle && (
                          <p className="truncate text-xs text-muted-foreground">@{brand.handle}</p>
                        )}
                        {brand.target_categories && brand.target_categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {brand.target_categories.slice(0, 3).map((cat) => (
                              <span key={cat} className="rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                        {brand.brand_keywords && brand.brand_keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {brand.brand_keywords.slice(0, 3).map((kw) => (
                              <span key={kw} className="rounded-full border border-violet-500/20 bg-violet-500/5 px-1.5 py-0.5 text-[10px] text-violet-400">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </DiscoverSection>
          )}

          {/* ── Trending Content / Posts ── */}
          {trendingContent.length > 0 && (
            <DiscoverSection
              icon={<Heart className="h-4 w-4 text-rose-400" />}
              title={t("discover.trendingContent")}
              desc={t("discover.trendingContentDesc")}
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {trendingContent.slice(0, 10).map((post, i) => (
                  <Link key={i} href={`/influencer/${post.influencerHandle}`} className="group">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted/30">
                      {post.imageUrl ? (
                        <Image
                          src={post.imageUrl}
                          alt={`Trending post by @${post.influencerHandle}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 33vw, 150px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          @{post.influencerHandle}
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="truncate text-[10px] font-medium text-white">@{post.influencerHandle}</p>
                        <div className="flex items-center gap-2 text-[9px] text-white/80">
                          <span className="flex items-center gap-0.5">
                            <Heart className="h-2.5 w-2.5" /> {formatCompact(post.likeCount)}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MessageCircle className="h-2.5 w-2.5" /> {formatCompact(post.commentCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </DiscoverSection>
          )}

          {/* ── Trending Hashtags ── */}
          {trendingHashtags.length > 0 && (
            <DiscoverSection
              icon={<Hash className="h-4 w-4 text-sky-400" />}
              title={t("discover.trendingHashtags")}
              desc={t("discover.trendingHashtagsDesc")}
            >
              <div className="flex flex-wrap gap-2">
                {trendingHashtags.slice(0, 20).map((tag, i) => {
                  // Size based on rank (first = biggest)
                  const sizeClass = i < 3 ? "text-sm px-3 py-1.5"
                    : i < 8 ? "text-xs px-2.5 py-1"
                    : "text-[11px] px-2 py-0.5";
                  const isActive = activeHashtag === tag.hashtag;
                  const opacity = isActive ? "border-primary bg-primary/20 text-primary ring-1 ring-primary/30"
                    : i < 3 ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                    : i < 8 ? "border-sky-400/20 bg-sky-400/5 text-sky-400 hover:bg-sky-400/10"
                    : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50";

                  return (
                    <button
                      key={tag.hashtag}
                      onClick={() => handleHashtagClick(tag.hashtag)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border font-medium transition-colors ${sizeClass} ${opacity}`}
                    >
                      #{tag.hashtag}
                      <span className="text-[9px] font-normal opacity-60">
                        {tag.influencerCount}{t("discover.nInfluencers")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Hashtag influencer results */}
              {activeHashtag && (
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("discover.hashtagInfluencers").replace("{hashtag}", `#${activeHashtag}`)}
                    </p>
                    <button
                      onClick={() => { setActiveHashtag(null); setHashtagInfluencers([]); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {t("discover.hashtagClose")}
                    </button>
                  </div>
                  {hashtagLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : hashtagInfluencers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {hashtagInfluencers.map((inf) => (
                        <InfluencerGridCard
                          key={inf.id}
                          handle={inf.handle}
                          platform={inf.platform}
                          displayName={inf.display_name}
                          profileImageUrl={inf.profile_image_url}
                          tier={inf.tier}
                          vibeScore={inf.vibe_score}
                          engagementRate={inf.engagement_rate}
                          followerCount={inf.follower_count}
                          contentCategories={inf.content_categories ?? []}
                          oneLiner={inf.one_liner}
                          trendDirection={inf.trend_direction}
                          trendMagnitude={inf.trend_magnitude}
                          representativeImages={inf.representative_images}
                          lastAnalyzedAt={inf.last_analyzed_at}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      {t("discover.hashtagEmpty")}
                    </p>
                  )}
                </div>
              )}
            </DiscoverSection>
          )}

          {/* ── Curated: Hidden Gems ── */}
          {hiddenGems.length > 0 && (
            <DiscoverSection
              icon={<Sparkles className="h-4 w-4 text-amber-400" />}
              title={t("discover.hiddenGems")}
              desc={t("discover.hiddenGemsDesc")}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {hiddenGems.slice(0, 8).map((inf) => (
                  <InfluencerGridCard
                    key={inf.id}
                    handle={inf.handle}
                    platform={inf.platform}
                    displayName={inf.display_name}
                    profileImageUrl={inf.profile_image_url}
                    tier={inf.tier}
                    vibeScore={inf.vibe_score}
                    engagementRate={inf.engagement_rate}
                    followerCount={inf.follower_count}
                    contentCategories={inf.content_categories ?? []}
                    oneLiner={inf.one_liner}
                    trendDirection={inf.trend_direction}
                    trendMagnitude={inf.trend_magnitude}
                    representativeImages={inf.representative_images}
                  />
                ))}
              </div>
            </DiscoverSection>
          )}

          {/* ── Curated: Rising Stars ── */}
          {risingStars.length > 0 && (
            <DiscoverSection
              icon={<Zap className="h-4 w-4 text-emerald-400" />}
              title={t("discover.risingStars")}
              desc={t("discover.risingStarsDesc")}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {risingStars.slice(0, 8).map((inf) => (
                  <InfluencerGridCard
                    key={inf.id}
                    handle={inf.handle}
                    platform={inf.platform}
                    displayName={inf.display_name}
                    profileImageUrl={inf.profile_image_url}
                    tier={inf.tier}
                    vibeScore={inf.vibe_score}
                    engagementRate={inf.engagement_rate}
                    followerCount={inf.follower_count}
                    contentCategories={inf.content_categories ?? []}
                    oneLiner={inf.one_liner}
                    trendDirection={inf.trend_direction}
                    trendMagnitude={inf.trend_magnitude}
                    representativeImages={inf.representative_images}
                  />
                ))}
              </div>
            </DiscoverSection>
          )}

          {/* ── Curated: Engagement Leaders ── */}
          {engagementLeaders.length > 0 && (
            <DiscoverSection
              icon={<TrendingUp className="h-4 w-4 text-blue-400" />}
              title={t("discover.engagementLeaders")}
              desc={t("discover.engagementLeadersDesc")}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {engagementLeaders.slice(0, 8).map((inf) => (
                  <InfluencerGridCard
                    key={inf.id}
                    handle={inf.handle}
                    platform={inf.platform}
                    displayName={inf.display_name}
                    profileImageUrl={inf.profile_image_url}
                    tier={inf.tier}
                    vibeScore={inf.vibe_score}
                    engagementRate={inf.engagement_rate}
                    followerCount={inf.follower_count}
                    contentCategories={inf.content_categories ?? []}
                    oneLiner={inf.one_liner}
                    trendDirection={inf.trend_direction}
                    trendMagnitude={inf.trend_magnitude}
                    representativeImages={inf.representative_images}
                  />
                ))}
              </div>
            </DiscoverSection>
          )}

          {/* ── Curated: Category Top ── */}
          {categoryTop.length > 0 && (
            <DiscoverSection
              icon={<Crown className="h-4 w-4 text-yellow-400" />}
              title={t("discover.categoryTop")}
              desc={t("discover.categoryTopDesc")}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {categoryTop.slice(0, 8).map((inf) => (
                  <InfluencerGridCard
                    key={inf.id}
                    handle={inf.handle}
                    platform={inf.platform}
                    displayName={inf.display_name}
                    profileImageUrl={inf.profile_image_url}
                    tier={inf.tier}
                    vibeScore={inf.vibe_score}
                    engagementRate={inf.engagement_rate}
                    followerCount={inf.follower_count}
                    contentCategories={inf.content_categories ?? []}
                    oneLiner={inf.one_liner}
                    trendDirection={inf.trend_direction}
                    trendMagnitude={inf.trend_magnitude}
                    representativeImages={inf.representative_images}
                  />
                ))}
              </div>
            </DiscoverSection>
          )}

          {/* Vibe Search — hidden until backend vector analysis is implemented */}

          {/* Browse / Filter Section */}
          <div className="mt-10" id="browse-section">
            <h2 className="mb-4 text-lg font-semibold">
              {t("discover.browseTitle")}
            </h2>

            {/* Filter Bar */}
            <div className="mb-4 flex flex-wrap gap-2">
              <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                <option value="">{t("discover.allTiers")}</option>
                {TIER_OPTIONS.map((tier) => (<option key={tier} value={tier}>{tier}</option>))}
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                <option value="">{t("discover.allCategories")}</option>
                {CATEGORY_OPTIONS.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
              <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                <option value="">{t("discover.allPlatforms")}</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
              <Input type="number" min={0} max={100} placeholder={t("discover.filterMinVibe")} value={filterMinVibe} onChange={(e) => setFilterMinVibe(e.target.value)} className="w-28 text-xs" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
                <option value="vibeScore">{t("discover.sortVibeScore")}</option>
                <option value="followers">{t("discover.sortFollowers")}</option>
                <option value="engagement">{t("discover.sortEngagement")}</option>
                <option value="newest">{t("discover.sortNewest")}</option>
              </select>
            </div>

            {/* Browse Grid */}
            {browseLoading && browseResults.length === 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <SkeletonList count={8} variant="grid" />
              </div>
            ) : browseResults.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {browseResults.map((item) => (
                    <InfluencerGridCard
                      key={item.id}
                      handle={item.handle}
                      platform={item.platform}
                      displayName={item.display_name}
                      profileImageUrl={item.profile_image_url}
                      tier={item.tier}
                      vibeScore={item.vibe_score}
                      engagementRate={item.engagement_rate}
                      followerCount={item.follower_count}
                      contentCategories={item.content_categories}
                      oneLiner={item.one_liner}
                      trendDirection={item.trend_direction}
                      trendMagnitude={item.trend_magnitude}
                      representativeImages={item.representative_images}
                      lastAnalyzedAt={item.last_analyzed_at}
                    />
                  ))}
                </div>
                {browseResults.length < browseTotal && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm" disabled={browseLoading} onClick={() => fetchBrowse(browsePage + 1, true)}>
                      {browseLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                      {t("discover.loadMore")}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("discover.noResults")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("discover.noResultsDesc")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </PageTransition>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function DiscoverSection({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mb-4 text-[11px] text-muted-foreground">{desc}</p>
      {children}
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
