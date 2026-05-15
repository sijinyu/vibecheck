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

// ─── Constants ───────────────────────────────────────────────

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: "influencers", label: "인플루언서", icon: <Users className="h-3.5 w-3.5" /> },
  { key: "brief", label: "브리프", icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "budget", label: "예산", icon: <DollarSign className="h-3.5 w-3.5" /> },
  { key: "performance", label: "성과", icon: <BarChart3 className="h-3.5 w-3.5" /> },
];

const STATUS_OPTIONS: Array<{ value: CampaignStatus; label: string; color: string }> = [
  { value: "draft", label: "초안", color: "text-muted-foreground" },
  { value: "active", label: "진행중", color: "text-emerald-400" },
  { value: "completed", label: "완료", color: "text-primary" },
  { value: "archived", label: "보관됨", color: "text-muted-foreground/60" },
];

const STATUS_DOT: Record<CampaignStatus, string> = {
  draft: "bg-muted-foreground",
  active: "bg-emerald-400",
  completed: "bg-primary",
  archived: "bg-muted-foreground/40",
};

// ─── Status Dropdown ─────────────────────────────────────────

function StatusDropdown({
  currentStatus,
  onStatusChange,
  disabled,
}: {
  currentStatus: CampaignStatus;
  onStatusChange: (status: CampaignStatus) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((s) => s.value === currentStatus);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/50 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-card/80 disabled:opacity-50"
      >
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[currentStatus]}`} />
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
            {STATUS_OPTIONS.map((opt) => (
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
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[opt.value]}`} />
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

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("influencers");

  // Influencer kanban
  const [campaignInfluencers, setCampaignInfluencers] = useState<CampaignInfluencer[]>([]);
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);

  // Brief generation
  const [generatingBrief, setGeneratingBrief] = useState(false);

  // Outreach
  const [outreach, setOutreach] = useState<OutreachResult | null>(null);
  const [loadingOutreach, setLoadingOutreach] = useState(false);

  // Status change
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ─── Fetch campaign ───────────────────────────────────────

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaign(json.data);
      } else {
        toast.error(json.error?.message ?? "캠페인 정보를 불러올 수 없습니다");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

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
      toast.error("인플루언서 목록을 불러올 수 없습니다");
    } finally {
      setLoadingInfluencers(false);
    }
  }, [campaignId]);

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
        toast.success("캠페인 상태가 변경되었습니다");
      } else {
        toast.error(json.error?.message ?? "상태 변경에 실패했습니다");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleInfluencerStatusChange(
    id: string,
    newStatus: CampaignInfluencerStatus
  ) {
    try {
      // Find the campaign_influencer record to get influencer_id
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
        toast.error("상태 변경에 실패했습니다");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
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
        toast.success("AI 브리프가 생성되었습니다");
      } else {
        toast.error(json.error?.message ?? "브리프 생성에 실패했습니다");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
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
        toast.error(json.error?.message ?? "아웃리치 생성에 실패했습니다");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
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
      throw new Error(json.error?.message ?? "예산 최적화에 실패했습니다");
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

  // ─── Loading / Not found ──────────────────────────────────

  if (loading) {
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

  if (!campaign) {
    return (
      <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-5xl lg:px-8">
        <div className="mb-6">
          <Link
            href={`/brands/${brandId}/campaigns`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            캠페인 목록
          </Link>
        </div>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            캠페인을 찾을 수 없습니다
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-5xl lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href={`/brands/${brandId}/campaigns`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          캠페인 목록
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
                    {campaign.start_date
                      ? new Date(campaign.start_date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
                      : "미정"}
                    {campaign.end_date && (
                      <>
                        {" ~ "}
                        {new Date(campaign.end_date).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                      </>
                    )}
                  </p>
                )}
                {campaign.budget_krw !== null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    예산 {Math.round(campaign.budget_krw / 10000).toLocaleString()}만원
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <StatusDropdown
                  currentStatus={campaign.status}
                  onStatusChange={handleStatusChange}
                  disabled={updatingStatus}
                />
                <Link href={`/brands/${brandId}/campaigns/${campaignId}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">편집</span>
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
                <span className="text-sm text-muted-foreground">불러오는 중...</span>
              </CardContent>
            </Card>
          ) : (
            <CampaignKanban
              campaignInfluencers={campaignInfluencers}
              onStatusChange={handleInfluencerStatusChange}
              onCardClick={() => {
                // Future: open detail drawer
              }}
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
          {/* Brief content */}
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-5 pb-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">캠페인 브리프</h3>
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
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      AI 브리프 생성
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
                    아직 브리프가 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    AI 브리프 생성 버튼을 눌러 자동으로 브리프를 작성하거나, 직접 입력하세요
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outreach preview */}
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
                <p className="text-sm font-medium">목표 KPI를 설정해주세요</p>
                <p className="text-xs text-muted-foreground">
                  캠페인 생성 시 목표 도달 수와 인게이지먼트를 설정하면 성과를 비교할 수 있습니다
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
