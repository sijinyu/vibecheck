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
import { useI18n } from "@/lib/i18n/context";

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

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(dateStr: string | null, locale: string, tbd: string): string {
  if (!dateStr) return tbd;
  return new Date(dateStr).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Campaign Card ────────────────────────────────────────────

function CampaignCard({
  campaign,
  brandId,
  statusLabel,
  statusColor,
  statusDot,
  budgetUnit,
  peopleSuffix,
  locale,
  tbd,
}: {
  campaign: Campaign;
  brandId: string;
  statusLabel: string;
  statusColor: string;
  statusDot: string;
  budgetUnit: string;
  peopleSuffix: string;
  locale: string;
  tbd: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/brands/${brandId}/campaigns/${campaign.id}`}>
        <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:border-border/80 hover:bg-card/80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{campaign.name}</h3>
              <div className="flex shrink-0 items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
                <span className={`text-[11px] font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {campaign.budget_krw !== null && (
                <span>{Math.round(campaign.budget_krw / 10000).toLocaleString()}{budgetUnit}</span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {campaign.campaign_influencers?.[0]?.count ?? 0}{peopleSuffix}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(campaign.start_date, locale, tbd)}
                {campaign.end_date && ` ~ ${formatDate(campaign.end_date, locale, tbd)}`}
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
  const { t, locale } = useI18n();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");

  const STATUS_KEYS: Record<CampaignStatus, { label: string; color: string; dot: string }> = {
    draft: { label: t("campaign.statusDraft"), color: "text-muted-foreground", dot: "bg-muted-foreground" },
    active: { label: t("campaign.statusActive"), color: "text-emerald-400", dot: "bg-emerald-400" },
    completed: { label: t("campaign.statusCompleted"), color: "text-primary", dot: "bg-primary" },
    archived: { label: t("campaign.statusArchived"), color: "text-muted-foreground/60", dot: "bg-muted-foreground/40" },
  };

  const STATUS_FILTERS: Array<{ value: CampaignStatus | "all"; label: string }> = [
    { value: "all", label: t("campaign.filterAll") },
    { value: "draft", label: t("campaign.statusDraft") },
    { value: "active", label: t("campaign.statusActive") },
    { value: "completed", label: t("campaign.statusCompleted") },
    { value: "archived", label: t("campaign.statusArchived") },
  ];

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
        toast.error(json.error?.message ?? t("campaign.fetchError"));
      }
    } catch {
      toast.error(t("campaign.networkError"));
    } finally {
      setLoading(false);
    }
  }, [brandId, t]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 lg:max-w-4xl lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href={`/brands/${brandId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("campaign.backToBrand")}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("campaign.pageTitle")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("campaign.pageDesc")}
          </p>
        </div>
        <Link href={`/brands/${brandId}/campaigns/new`}>
          <Button size="sm" className="shrink-0 gap-2">
            <Plus className="h-3.5 w-3.5" />
            {t("campaign.newCampaign")}
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
              {statusFilter === "all"
                ? t("campaign.emptyAll")
                : `${STATUS_KEYS[statusFilter as CampaignStatus]?.label ?? statusFilter} ${t("campaign.emptyFiltered")}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("campaign.emptyDesc")}
            </p>
            {statusFilter === "all" && (
              <Link href={`/brands/${brandId}/campaigns/new`}>
                <Button size="sm" className="mt-1 gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  {t("campaign.createFirst")}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCampaigns.map((campaign, i) => {
            const sc = STATUS_KEYS[campaign.status];
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <CampaignCard
                  campaign={campaign}
                  brandId={brandId}
                  statusLabel={sc.label}
                  statusColor={sc.color}
                  statusDot={sc.dot}
                  budgetUnit={t("campaign.budgetUnit")}
                  peopleSuffix={t("campaign.peopleSuffix")}
                  locale={locale}
                  tbd={t("campaign.dateTbd")}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
