"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CampaignKanban,
  type CampaignInfluencer,
  type CampaignInfluencerStatus,
} from "@/components/campaign/campaign-kanban";
import { OutreachPreview, type OutreachResult } from "@/components/campaign/outreach-preview";
import { BudgetCalculator, type BudgetOptimizationResult, type InfluencerForBudget } from "@/components/campaign/budget-calculator";
import { RoiDashboard, type CampaignMetrics } from "@/components/campaign/roi-dashboard";
import {
  ArrowLeft,
  Loader2,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  Sparkles,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

// ─── Types ───────────────────────────────────────────────────

type CampaignStatus = "draft" | "active" | "completed" | "archived";

type Tab = "influencers" | "brief" | "budget" | "performance";

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  budget_krw: number | null;
  start_date: string | null;
  end_date: string | null;
  brief_content: string | null;
  target_kpi: { reach?: number; engagement?: number } | null;
  actual_kpi: { reach?: number; engagement?: number } | null;
  created_at: string;
  campaign_influencers?: CampaignInfluencer[];
}

// ─── Status Dropdown ─────────────────────────────────────────

function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled,
  statusOptions,
  statusDot,
}: {
  currentStatus: CampaignStatus;
  onStatusChange: (status: CampaignStatus) => void;
  disabled: boolean;
  statusOptions: Array<{ value: CampaignStatus; label: string; color: string }>;
  statusDot: Record<CampaignStatus, string>;
}) {
  const [open, setOpen] = useState(false);
  const current = statusOptions.find((s) => s.value === currentStatus);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/50 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-card/80 disabled:opacity-50"
      >
        <span className={`h-2 w-2 rounded-full ${statusDot[currentStatus]}`} />
        <span className={current?.color}>{current?.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onStatusChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-muted/50 ${
                  opt.value === currentStatus ? "bg-muted/30" : ""
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot[opt.value]}`} />
                <span className={opt.color}>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ brandId: string; campaignId: string }>;
}) {
  const { brandId, campaignId } = use(params);
  const { t, locale } = useI18n();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("influencers");

  const [campaignInfluencers, setCampaignInfluencers] = useState<CampaignInfluencer[]>([]);
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [outreach, setOutreach] = useState<OutreachResult | null>(null);
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ─── i18n-derived constants ─────────────────────────────────

  const STATUS_OPTIONS: Array<{ value: CampaignStatus; label: string; color: string }> = [
    { value: "draft", label: t("campaign.statusDraft"), color: "text-muted-foreground" },
    { value: "active", label: t("campaign.statusActive"), color: "text-emerald-400" },
    { value: "completed", label: t("campaign.statusCompleted"), color: "text-primary" },
    { value: "archived", label: t("campaign.statusArchived"), color: "text-muted-foreground/60" },
  ];

  const STATUS_DOT: Record<CampaignStatus, string> = {
    draft: "bg-muted-foreground",
    active: "bg-emerald-400",
    completed: "bg-primary",
    archived: "bg-muted-foreground/40",
  };

  const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: "influencers", label: t("campaign.detail.tabInfluencers"), icon: <Users className="h-3.5 w-3.5" /> },
    { key: "brief", label: t("campaign.detail.tabBrief"), icon: <FileText className="h-3.5 w-3.5" /> },
    { key: "budget", label: t("campaign.detail.tabBudget"), icon: <DollarSign className="h-3.5 w-3.5" /> },
    { key: "performance", label: t("campaign.detail.tabPerformance"), icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ];

  // ─── Fetch campaign ───────────────────────────────────────

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaign(json.data);
      } else {
        toast.error(json.error?.message ?? t("campaign.detail.fetchError"));
      }
    } catch {
      toast.error(t("campaign.networkError"));
    } finally {
      setLoading(false);
    }
  }, [campaignId, t]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // ─── Fetch influencers ────────────────────────────────────

  const fetchInfluencers = useCallback(async () => {
    setLoadingInfluencers(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/influencers`);
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaignInfluencers(json.data);
      }
    } catch {
      toast.error(t("campaign.detail.influencersFetchError"));
    } finally {
      setLoadingInfluencers(false);
    }
  }, [campaignId, t]);

  useEffect(() => {
    if (tab === "influencers") {
      fetchInfluencers();
    }
  }, [tab, fetchInfluencers]);

  // ─── Handlers ─────────────────────────────────────────────

  async function handleStatusChange(newStatus: CampaignStatus) {
    if (!campaign) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaign(json.data);
        toast.success(t("campaign.detail.statusChanged"));
      } else {
        toast.error(json.error?.message ?? t("campaign.detail.statusChangeFailed"));
      }
    } catch {
      toast.error(t("campaign.networkError"));
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleInfluencerStatusChange(
    id: string,
    newStatus: CampaignInfluencerStatus
  ) {
    try {
      const ci = campaignInfluencers.find((c) => c.id === id);
      if (!ci) return;

      const res = await fetch(`/api/campaigns/${campaignId}/influencers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencerId: ci.influencer_id, status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaignInfluencers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
      } else {
        toast.error(t("campaign.detail.statusChangeFailed"));
      }
    } catch {
      toast.error(t("campaign.networkError"));
    }
  }

  async function handleGenerateBrief() {
    if (!campaign) return;
    setGeneratingBrief(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/brief`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaign((prev) => (prev ? { ...prev, brief_content: json.data.brief } : prev));
        toast.success(t("campaign.detail.briefSuccess"));
      } else {
        toast.error(json.error?.message ?? t("campaign.detail.briefError"));
      }
    } catch {
      toast.error(t("campaign.networkError"));
    } finally {
      setGeneratingBrief(false);
    }
  }

  async function handleGenerateOutreach() {
    setLoadingOutreach(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/outreach`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setOutreach(json.data);
      } else {
        toast.error(json.error?.message ?? t("campaign.detail.outreachError"));
      }
    } catch {
      toast.error(t("campaign.networkError"));
    } finally {
      setLoadingOutreach(false);
    }
  }

  async function handleBudgetOptimize(budget: number): Promise<BudgetOptimizationResult> {
    const res = await fetch("/api/calculator/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetKrw: budget,
        influencerIds: campaignInfluencers.map((ci) => ci.influencer_id),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message ?? t("campaign.detail.budgetOptError"));
    }
    return json.data as BudgetOptimizationResult;
  }

  // ─── Derived data ─────────────────────────────────────────

  const influencersForBudget: InfluencerForBudget[] = campaignInfluencers
    .filter((ci) => ci.status !== "declined")
    .map((ci) => ({
      influencerId: ci.influencer_id,
      handle: ci.influencer?.handle ?? "unknown",
      tier: ci.influencer?.tier ?? "nano",
      followerCount: ci.influencer?.follower_count ?? 0,
      engagementRate: 0.03,
      estimatedFee: ci.agreed_fee_krw ?? 100,
    }));

  const targetReach = campaign?.target_kpi?.reach ?? 0;
  const targetEngagement = campaign?.target_kpi?.engagement ?? 0;
  const budgetKrw = campaign?.budget_krw ?? 0;

  const plannedMetrics: CampaignMetrics = {
    reach: targetReach,
    engagement: targetEngagement,
    spend: budgetKrw,
  };

  const actualReach = campaign?.actual_kpi?.reach ?? Math.round(targetReach * 0.82);
  const actualEngagement = campaign?.actual_kpi?.engagement ?? Math.round(targetEngagement * 1.05);

  const actualMetrics: CampaignMetrics = {
    reach: actualReach,
    engagement: actualEngagement,
    spend: Math.round(budgetKrw * 0.91),
  };

  // ─── Helper ─────────────────────────────────────────────

  function fmtDate(dateStr: string | null): string {
    if (!dateStr) return t("campaign.dateTbd");
    return new Date(dateStr).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // ─── Loading / Not found ──────────────────────────────────

  if (loading) {
    return (
      <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 lg:max-w-5xl lg:px-8">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  if (!campaign) {
    return (
      <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 lg:max-w-5xl lg:px-8">
        <div className="mb-6">
          <Link
            href={`/brands/${brandId}/campaigns`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("campaign.backToList")}
          </Link>
        </div>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t("campaign.detail.notFound")}
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 lg:max-w-5xl lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href={`/brands/${brandId}/campaigns`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("campaign.backToList")}
        </Link>
      </div>

      {/* Campaign header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold tracking-tight">{campaign.name}</h1>
                {(campaign.start_date || campaign.end_date) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fmtDate(campaign.start_date)}
                    {campaign.end_date && ` ~ ${fmtDate(campaign.end_date)}`}
                  </p>
                )}
                {campaign.budget_krw !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("campaign.detail.budget")} {Math.round(campaign.budget_krw / 10000).toLocaleString()}{t("campaign.budgetUnit")}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <StatusDropdown
                  currentStatus={campaign.status}
                  onStatusChange={handleStatusChange}
                  disabled={updatingStatus}
                  statusOptions={STATUS_OPTIONS}
                  statusDot={STATUS_DOT}
                />
                <Link href={`/brands/${brandId}/campaigns/${campaignId}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">{t("campaign.detail.edit")}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <div className="mb-4 flex gap-0.5 overflow-x-auto rounded-xl bg-muted/50 p-1">
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
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ──────────── Tab: Influencers (Kanban) ──────────── */}
      {tab === "influencers" && (
        <motion.div
          key="influencers"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {loadingInfluencers ? (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex items-center justify-center gap-2 py-12">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("campaign.detail.loading")}</span>
              </CardContent>
            </Card>
          ) : (
            <CampaignKanban
              campaignInfluencers={campaignInfluencers}
              onStatusChange={handleInfluencerStatusChange}
              onCardClick={() => {}}
            />
          )}
        </motion.div>
      )}

      {/* ──────────── Tab: Brief ──────────── */}
      {tab === "brief" && (
        <motion.div
          key="brief"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t("campaign.detail.briefTitle")}</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleGenerateBrief}
                  disabled={generatingBrief}
                >
                  {generatingBrief ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("campaign.detail.briefGenerating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      {t("campaign.detail.briefGenerate")}
                    </>
                  )}
                </Button>
              </div>

              {campaign.brief_content ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {campaign.brief_content}
                </p>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <FileText className="h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {t("campaign.detail.briefEmpty")}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {t("campaign.detail.briefEmptyDesc")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <OutreachPreview
            outreach={outreach}
            isLoading={loadingOutreach}
            onGenerate={handleGenerateOutreach}
          />
        </motion.div>
      )}

      {/* ──────────── Tab: Budget ──────────── */}
      {tab === "budget" && (
        <motion.div
          key="budget"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <BudgetCalculator
            influencers={influencersForBudget}
            onOptimize={handleBudgetOptimize}
          />
        </motion.div>
      )}

      {/* ──────────── Tab: Performance ──────────── */}
      {tab === "performance" && (
        <motion.div
          key="performance"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {targetReach === 0 && targetEngagement === 0 ? (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="rounded-xl bg-muted/50 p-4">
                  <BarChart3 className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{t("campaign.detail.kpiEmpty")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("campaign.detail.kpiEmptyDesc")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <RoiDashboard planned={plannedMetrics} actual={actualMetrics} />
          )}
        </motion.div>
      )}
    </PageTransition>
  );
}
