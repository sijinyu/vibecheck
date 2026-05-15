"use client";

import { useState, useEffect, useCallback, use, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AestheticRadarChart } from "@/components/analysis/aesthetic-radar-chart";
import { RecommendationCard } from "@/components/analysis/recommendation-card";
import { useI18n } from "@/lib/i18n/context";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Sparkles,
  Settings,
  GraduationCap,
  Target,
  Tag,
  Users,
  MessageSquare,
} from "lucide-react";
import { OutreachModal } from "@/components/analysis/outreach-modal";

// ─── Constants ──────────────────────────────────────────────

const TIER_OPTIONS = [
  { value: "nano", label: "Nano (<10K)" },
  { value: "micro", label: "Micro (10-50K)" },
  { value: "mid", label: "Mid (50-100K)" },
  { value: "macro", label: "Macro (100K-1M)" },
  { value: "mega", label: "Mega (1M+)" },
];

const CATEGORY_OPTIONS = [
  "Fashion",
  "Beauty",
  "Food",
  "Travel",
  "Fitness",
  "Lifestyle",
  "Tech",
  "Art",
];

// ─── Types ───────────────────────────────────────────────────

type Tab = "overview" | "recommendations" | "coaching" | "settings";

interface BrandData {
  id: string;
  name: string;
  handle: string | null;
  platform: string | null;
  description: string | null;
  tone_vector: number[] | null;
  preferred_tiers: string[];
  target_categories: string[];
  scores: Record<string, unknown> | null;
  brand_positioning: string | null;
  content_strategy: Record<string, unknown>;
  ideal_influencer_profile: Record<string, unknown>;
  brand_keywords: string[];
  competitor_brands: string[];
  created_at: string;
}

interface MatchResult {
  influencerId: string;
  handle: string;
  platform: string;
  displayName: string | null;
  profileImageUrl: string | null;
  matchScore: number;
  vibeScore: number;
  tier: string;
  engagementRate: number;
  followerCount: number;
  matchReason: string;
  oneLiner: string | null;
  contentCategories: string[];
  contentTopics: string[];
  topHashtags: string[];
  representativeImages: string[];
  trendDirection: string | null;
  trendMagnitude: number;
}

interface CoachingData {
  overallAssessment: string;
  brandStrengths: Array<{ area: string; detail: string }>;
  improvementAreas: Array<{ area: string; detail: string }>;
  influencerStrategy: {
    idealCollabType: string;
    campaignIdeas: string[];
    budgetAllocation: string;
    timingAdvice: string;
  };
  contentRecommendations: {
    feedOptimization: string;
    contentCalendar: string;
    hashtagStrategy: string;
    storytellingAdvice: string;
  };
  competitivePositioning: string;
  growthRoadmap: {
    shortTerm: string;
    midTerm: string;
    longTerm: string;
  };
}

// ─── Helper ──────────────────────────────────────────────────

function extractRadarData(scores: Record<string, unknown> | null) {
  if (!scores) {
    return { color: 50, composition: 50, toneConsistency: 50, trend: 50, brandFit: 50 };
  }
  return {
    color: typeof scores.color === "number" ? scores.color : 50,
    composition: typeof scores.composition === "number" ? scores.composition : 50,
    toneConsistency: typeof scores.toneConsistency === "number" ? scores.toneConsistency : 50,
    trend: typeof scores.trend === "number" ? scores.trend : 50,
    brandFit: typeof scores.brandFit === "number" ? scores.brandFit : 50,
  };
}

// ─── Component ───────────────────────────────────────────────

export default function BrandDetailPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = use(params);
  const { t } = useI18n();
  const router = useRouter();

  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  // Recommendations
  const [recommendations, setRecommendations] = useState<MatchResult[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsFetched, setRecsFetched] = useState(false);

  // Coaching
  const [coaching, setCoaching] = useState<CoachingData | null>(null);
  const [loadingCoaching, setLoadingCoaching] = useState(false);
  const [coachingFetched, setCoachingFetched] = useState(false);

  // Outreach
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachHandle, setOutreachHandle] = useState("");

  // Settings form
  const [editName, setEditName] = useState("");
  const [editTiers, setEditTiers] = useState<string[]>([]);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState(false);

  // ─── Fetch brand ──────────────────────────────────────────

  const fetchBrand = useCallback(async () => {
    setLoadingBrand(true);
    try {
      const res = await fetch(`/api/brand/${encodeURIComponent(brandId)}`);
      const json = await res.json();
      if (res.ok && json.data) {
        const data: BrandData = json.data;
        setBrand(data);
        setEditName(data.name);
        setEditTiers(data.preferred_tiers ?? []);
        setEditCategories(data.target_categories ?? []);
      } else {
        toast.error(json.error?.message ?? t("common.error.network"));
      }
    } catch {
      toast.error(t("common.error.network"));
    } finally {
      setLoadingBrand(false);
    }
  }, [brandId, t]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  // ─── Fetch recommendations ────────────────────────────────

  const fetchRecommendations = useCallback(async () => {
    if (recsFetched) return;
    setLoadingRecs(true);
    try {
      const res = await fetch("/api/brand/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setRecommendations(json.data);
      }
    } catch {
      toast.error(t("common.error.network"));
    } finally {
      setLoadingRecs(false);
      setRecsFetched(true);
    }
  }, [brandId, recsFetched, t]);

  useEffect(() => {
    if (tab === "recommendations" && !recsFetched) {
      fetchRecommendations();
    }
  }, [tab, recsFetched, fetchRecommendations]);

  // ─── Fetch coaching ────────────────────────────────────────

  const fetchCoaching = useCallback(async () => {
    if (coachingFetched) return;
    setLoadingCoaching(true);
    try {
      const res = await fetch(`/api/brand/${encodeURIComponent(brandId)}/coaching`);
      const json = await res.json();
      if (res.ok && json.data) {
        setCoaching(json.data);
      }
    } catch {
      toast.error(t("common.error.network"));
    } finally {
      setLoadingCoaching(false);
      setCoachingFetched(true);
    }
  }, [brandId, coachingFetched, t]);

  useEffect(() => {
    if (tab === "coaching" && !coachingFetched) {
      fetchCoaching();
    }
  }, [tab, coachingFetched, fetchCoaching]);

  // ─── Settings handlers ────────────────────────────────────

  function handleEditNameChange(e: ChangeEvent<HTMLInputElement>) {
    setEditName(e.target.value);
  }

  function toggleEditTier(tier: string) {
    setEditTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  function toggleEditCategory(cat: string) {
    setEditCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSettingsSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editName.trim()) return;

    setSavingSettings(true);
    try {
      const res = await fetch(`/api/brand/${encodeURIComponent(brandId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          preferredTiers: editTiers,
          targetCategories: editCategories,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setBrand(json.data);
        toast.success(t("brands.detail.updated"));
      } else {
        toast.error(json.error?.message ?? t("common.error.network"));
      }
    } catch {
      toast.error(t("common.error.network"));
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleDeleteBrand() {
    if (!window.confirm(t("brands.detail.deleteConfirm"))) return;

    setDeletingBrand(true);
    try {
      const res = await fetch(`/api/brand/${encodeURIComponent(brandId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(t("brands.detail.deleted"));
        router.push("/brands");
      } else {
        toast.error(json.error?.message ?? t("common.error.network"));
        setDeletingBrand(false);
      }
    } catch {
      toast.error(t("common.error.network"));
      setDeletingBrand(false);
    }
  }

  // ─── Loading / not-found states ───────────────────────────

  if (loadingBrand) {
    return (
      <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-5xl lg:px-8">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  if (!brand) {
    return (
      <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-5xl lg:px-8">
        <div className="mb-6">
          <Link
            href="/brands"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("brands.title")}
          </Link>
        </div>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t("brands.notFound")}
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const radarData = extractRadarData(brand.scores);

  // ─── Tabs config ──────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: t("brands.tab.overview"), icon: <Target className="h-3.5 w-3.5" /> },
    { key: "recommendations", label: t("brands.tab.recommendations"), icon: <Sparkles className="h-3.5 w-3.5" /> },
    { key: "coaching", label: t("brands.tab.coaching"), icon: <GraduationCap className="h-3.5 w-3.5" /> },
    // campaigns tab hidden until persistence and end-to-end flow are complete
    { key: "settings", label: t("brands.tab.settings"), icon: <Settings className="h-3.5 w-3.5" /> },
  ];

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-5xl lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href="/brands"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("brands.title")}
        </Link>
      </div>

      {/* Brand header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-6 pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
              <div className="flex items-center gap-4 lg:flex-1">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold tracking-tight">{brand.name}</h1>
                  {brand.handle && (
                    <p className="text-sm text-muted-foreground">@{brand.handle}</p>
                  )}
                  {brand.brand_keywords && brand.brand_keywords.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {brand.brand_keywords.slice(0, 5).map((kw) => (
                        <span key={kw} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {brand.scores && (
                <div className="flex flex-col items-center gap-1 lg:w-48">
                  <p className="text-[10px] font-medium text-muted-foreground">Tone Profile</p>
                  <AestheticRadarChart data={radarData} className="h-36 w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="mb-4 flex gap-0.5 overflow-x-auto rounded-xl bg-muted/50 p-1 no-scrollbar">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              tab === key
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ──────────── Tab: Overview ──────────── */}
      {tab === "overview" && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* AI Summary */}
          {brand.description && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 pb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("brands.overview.aiSummary")}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{brand.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Brand Positioning */}
          {brand.brand_positioning && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-5 pb-4">
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("brands.overview.positioning")}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {brand.brand_positioning}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Content Strategy */}
          {brand.content_strategy && Object.keys(brand.content_strategy).length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-5 pb-4">
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("brands.overview.contentStrategy")}</h3>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(brand.content_strategy).map(([key, value]) => {
                    const strategyKey = `brands.strategy.${key}` as Parameters<typeof t>[0];
                    const label = t(strategyKey) !== strategyKey ? t(strategyKey) : key;
                    return (
                      <div key={key}>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {label}
                        </p>
                        <p className="text-sm text-foreground">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ideal Influencer Profile */}
          {brand.ideal_influencer_profile && Object.keys(brand.ideal_influencer_profile).length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-5 pb-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("brands.overview.idealProfile")}</h3>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(brand.ideal_influencer_profile).map(([key, value]) => {
                    const profileKey = `brands.profile.${key}` as Parameters<typeof t>[0];
                    const label = t(profileKey) !== profileKey ? t(profileKey) : key;
                    return (
                      <div key={key}>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {label}
                        </p>
                        <p className="text-sm text-foreground">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitor Brands */}
          {brand.competitor_brands && brand.competitor_brands.length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-5 pb-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("brands.overview.competitors")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {brand.competitor_brands.map((comp) => (
                    <span key={comp} className="rounded-md bg-muted/80 px-2 py-0.5 text-xs text-muted-foreground">
                      {comp}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* ──────────── Tab: Recommendations ──────────── */}
      {tab === "recommendations" && (
        <motion.div
          key="recommendations"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {loadingRecs && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex items-center justify-center gap-2 py-12">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("brand.matching")}</span>
              </CardContent>
            </Card>
          )}

          {!loadingRecs && recommendations.length === 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="rounded-xl bg-muted/50 p-4">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{t("brand.noMatches")}</p>
                <p className="text-xs text-muted-foreground">{t("brand.noMatchesDesc")}</p>
              </CardContent>
            </Card>
          )}

          {!loadingRecs && recommendations.length > 0 && (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-3 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t("brands.rec.avgMatch")}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                      {Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-3 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t("brands.rec.tierDist")}
                    </p>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                      {Object.entries(
                        recommendations.reduce<Record<string, number>>((acc, r) => {
                          const tier = r.tier ?? "unknown";
                          return { ...acc, [tier]: (acc[tier] ?? 0) + 1 };
                        }, {})
                      ).map(([tier, count]) => (
                        <span key={tier} className="rounded bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {tier} {count}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-3 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t("brands.rec.total")}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                      {recommendations.length}{t("brands.rec.count")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("brands.rec.avgVibe")} {Math.round(recommendations.reduce((s, r) => s + r.vibeScore, 0) / recommendations.length)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {recommendations.map((rec, i) => (
                  <motion.div
                    key={rec.influencerId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <RecommendationCard
                      influencerId={rec.influencerId}
                      handle={rec.handle}
                      platform={rec.platform}
                      displayName={rec.displayName}
                      profileImageUrl={rec.profileImageUrl ?? null}
                      matchScore={rec.matchScore}
                      vibeScore={rec.vibeScore}
                      tier={rec.tier}
                      engagementRate={rec.engagementRate}
                      followerCount={rec.followerCount ?? 0}
                      matchReason={rec.matchReason}
                      oneLiner={rec.oneLiner ?? null}
                      contentCategories={rec.contentCategories ?? []}
                      contentTopics={rec.contentTopics ?? []}
                      topHashtags={rec.topHashtags ?? []}
                      representativeImages={rec.representativeImages ?? []}
                      trendDirection={rec.trendDirection ?? null}
                      trendMagnitude={rec.trendMagnitude ?? 0}
                    />
                    <div className="mt-1.5 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-[10px] text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setOutreachHandle(rec.handle);
                          setOutreachOpen(true);
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                        {t("brands.rec.outreach")}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Campaigns tab hidden — persistence and end-to-end flow incomplete */}

      {/* ──────────── Tab: Coaching ──────────── */}
      {tab === "coaching" && (
        <motion.div
          key="coaching"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {loadingCoaching && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex items-center justify-center gap-2 py-12">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("brands.coaching.loading")}</span>
              </CardContent>
            </Card>
          )}

          {!loadingCoaching && !coaching && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <GraduationCap className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium">{t("brands.coaching.error")}</p>
                <Button variant="outline" size="sm" onClick={() => { setCoachingFetched(false); fetchCoaching(); }}>
                  {t("common.retry")}
                </Button>
              </CardContent>
            </Card>
          )}

          {coaching && (
            <>
              {/* Overall Assessment */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-5 pb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{t("brands.coaching.overall")}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{coaching.overallAssessment}</p>
                </CardContent>
              </Card>

              {/* Strengths */}
              {coaching.brandStrengths && coaching.brandStrengths.length > 0 && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-5 pb-4">
                    <h3 className="mb-3 text-sm font-semibold text-emerald-400">{t("brands.coaching.strengths")}</h3>
                    <div className="space-y-2">
                      {coaching.brandStrengths.map((s, i) => (
                        <div key={i} className="rounded-lg bg-emerald-500/5 p-3">
                          <p className="text-xs font-medium text-emerald-400">{s.area}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Improvement Areas */}
              {coaching.improvementAreas && coaching.improvementAreas.length > 0 && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-5 pb-4">
                    <h3 className="mb-3 text-sm font-semibold text-amber-400">{t("brands.coaching.improvements")}</h3>
                    <div className="space-y-2">
                      {coaching.improvementAreas.map((a, i) => (
                        <div key={i} className="rounded-lg bg-amber-500/5 p-3">
                          <p className="text-xs font-medium text-amber-400">{a.area}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Influencer Strategy */}
              {coaching.influencerStrategy && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-5 pb-4">
                    <h3 className="mb-3 text-sm font-semibold">{t("brands.coaching.collabStrategy")}</h3>
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("brands.coaching.collabType")}</p>
                        <p className="text-sm text-foreground">{coaching.influencerStrategy.idealCollabType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("brands.coaching.campaignIdeas")}</p>
                        <ul className="mt-1 space-y-1">
                          {coaching.influencerStrategy.campaignIdeas.map((idea, i) => (
                            <li key={i} className="text-sm text-foreground">• {idea}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("brands.coaching.budget")}</p>
                        <p className="text-sm text-foreground">{coaching.influencerStrategy.budgetAllocation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("brands.coaching.timing")}</p>
                        <p className="text-sm text-foreground">{coaching.influencerStrategy.timingAdvice}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Growth Roadmap */}
              {coaching.growthRoadmap && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-5 pb-4">
                    <h3 className="mb-3 text-sm font-semibold">{t("brands.coaching.roadmap")}</h3>
                    <div className="space-y-3">
                      {[
                        { label: t("brands.coaching.1month"), value: coaching.growthRoadmap.shortTerm, color: "text-blue-400" },
                        { label: t("brands.coaching.3month"), value: coaching.growthRoadmap.midTerm, color: "text-purple-400" },
                        { label: t("brands.coaching.6month"), value: coaching.growthRoadmap.longTerm, color: "text-emerald-400" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-lg bg-muted/30 p-3">
                          <p className={`text-xs font-semibold ${color}`}>{label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Competitive Positioning */}
              {coaching.competitivePositioning && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-5 pb-4">
                    <h3 className="mb-2 text-sm font-semibold">{t("brands.coaching.competitive")}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{coaching.competitivePositioning}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ──────────── Tab: Settings ──────────── */}
      {tab === "settings" && (
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6">
              <form onSubmit={handleSettingsSave} className="space-y-4">
                <div>
                  <label htmlFor="edit-brand-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("brand.nameLabel")}
                  </label>
                  <Input id="edit-brand-name" value={editName} onChange={handleEditNameChange} placeholder={t("brand.namePlaceholder")} disabled={savingSettings} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("brand.tierLabel")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TIER_OPTIONS.map((tier) => (
                      <button key={tier.value} type="button" onClick={() => toggleEditTier(tier.value)} disabled={savingSettings}
                        className={`rounded-md px-2.5 py-1 text-xs transition-colors ${editTiers.includes(tier.value) ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("brand.categoryLabel")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <button key={cat} type="button" onClick={() => toggleEditCategory(cat)} disabled={savingSettings}
                        className={`rounded-md px-2.5 py-1 text-xs transition-colors ${editCategories.includes(cat) ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={savingSettings || !editName.trim()}>
                  {savingSettings ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("brands.settings.saving")}</>) : t("brands.settings.save")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-card/50">
            <CardContent className="pt-5 pb-5">
              <p className="mb-3 text-xs font-medium text-destructive">{t("brands.settings.dangerZone")}</p>
              <Button variant="destructive" size="sm" className="w-full gap-2" onClick={handleDeleteBrand} disabled={deletingBrand}>
                {deletingBrand ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("brands.settings.deleting")}</>) : (<><Trash2 className="h-3.5 w-3.5" />{t("brands.detail.delete")}</>)}
              </Button>
            </CardContent>
          </Card>

        </motion.div>
      )}

      <OutreachModal
        open={outreachOpen}
        onOpenChange={setOutreachOpen}
        influencerHandle={outreachHandle}
        influencerPlatform="instagram"
        preSelectedBrandId={brandId}
      />
    </PageTransition>
  );
}
