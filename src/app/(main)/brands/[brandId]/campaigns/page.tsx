"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Megaphone,
  Calendar,
  Users,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

type CampaignStatus = "draft" | "active" | "completed" | "archived";

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  budget_krw: number | null;
  start_date: string | null;
  end_date: string | null;
  brief_content: string | null;
  campaign_influencers: Array<{ count: number }>;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────

const STATUS_FILTERS: Array<{ value: CampaignStatus | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "draft", label: "초안" },
  { value: "active", label: "진행중" },
  { value: "completed", label: "완료" },
  { value: "archived", label: "보관됨" },
];

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; dot: string }> = {
  draft: { label: "초안", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  active: { label: "진행중", color: "text-emerald-400", dot: "bg-emerald-400" },
  completed: { label: "완료", color: "text-primary", dot: "bg-primary" },
  archived: { label: "보관됨", color: "text-muted-foreground/60", dot: "bg-muted-foreground/40" },
};

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "미정";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Campaign Card ────────────────────────────────────────────

function CampaignCard({ campaign, brandId }: { campaign: Campaign; brandId: string }) {
  const statusConf = STATUS_CONFIG[campaign.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/brands/${brandId}/campaigns/${campaign.id}`}>
        <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:border-border/80 hover:bg-card/80">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{campaign.name}</h3>
              <div className="flex shrink-0 items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                <span className={`text-[11px] font-medium ${statusConf.color}`}>
                  {statusConf.label}
                </span>
              </div>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {campaign.budget_krw !== null && (
                <span>{Math.round(campaign.budget_krw / 10000).toLocaleString()}만원</span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {campaign.campaign_influencers?.[0]?.count ?? 0}명
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(campaign.start_date)}
                {campaign.end_date && ` ~ ${formatDate(campaign.end_date)}`}
              </span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function CampaignsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = use(params);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/campaigns", window.location.origin);
      url.searchParams.set("brandId", brandId);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaigns(json.data);
      } else {
        toast.error(json.error?.message ?? "캠페인 목록을 불러올 수 없습니다");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-4xl lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href={`/brands/${brandId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          브랜드 상세
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">캠페인</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            브랜드 캠페인을 관리하고 성과를 추적하세요
          </p>
        </div>
        <Link href={`/brands/${brandId}/campaigns/new`}>
          <Button size="sm" className="shrink-0 gap-2">
            <Plus className="h-3.5 w-3.5" />
            새 캠페인
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-0.5 overflow-x-auto rounded-xl bg-muted/50 p-1">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value as CampaignStatus | "all")}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="rounded-xl bg-muted/50 p-4">
              <Megaphone className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {statusFilter === "all" ? "아직 캠페인이 없습니다" : `${STATUS_CONFIG[statusFilter as CampaignStatus]?.label ?? statusFilter} 캠페인이 없습니다`}
            </p>
            <p className="text-xs text-muted-foreground">
              새 캠페인을 만들어 인플루언서 마케팅을 시작하세요
            </p>
            {statusFilter === "all" && (
              <Link href={`/brands/${brandId}/campaigns/new`}>
                <Button size="sm" className="mt-1 gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  첫 캠페인 만들기
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCampaigns.map((campaign, i) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <CampaignCard campaign={campaign} brandId={brandId} />
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
