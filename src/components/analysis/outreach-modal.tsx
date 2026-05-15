"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Copy,
  Check,
  Loader2,
  Building2,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

interface OutreachModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerHandle: string;
  influencerPlatform?: string;
  preSelectedBrandId?: string;
}

type Step = "select-brand" | "generating" | "result";
type ActiveTab = "dm" | "proposal" | "points";

interface Brand {
  id: string;
  brand_name: string;
}

interface OutreachResult {
  dmTemplate: string;
  collaborationProposal: string;
  negotiationPoints: string[];
}

export function OutreachModal({
  open,
  onOpenChange,
  influencerHandle,
  influencerPlatform = "instagram",
  preSelectedBrandId,
}: OutreachModalProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>(
    preSelectedBrandId ? "generating" : "select-brand"
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState(
    preSelectedBrandId ?? ""
  );
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dm");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    const initialStep: Step = preSelectedBrandId ? "generating" : "select-brand";
    setStep(initialStep);
    setSelectedBrandId(preSelectedBrandId ?? "");
    setResult(null);
    setActiveTab("dm");
    setCopiedField(null);
  }, [open, preSelectedBrandId]);

  // Fetch user's brands on open
  useEffect(() => {
    if (!open) return;
    fetch("/api/brand")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setBrands(json.data);
      })
      .catch(() => {});
  }, [open]);

  // Auto-generate when step becomes "generating" with a valid brand
  useEffect(() => {
    if (step !== "generating" || !selectedBrandId) return;

    // Auto-save influencer to brand (fire-and-forget)
    fetch("/api/saved-influencers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        influencer_handle: influencerHandle,
        influencer_platform: influencerPlatform,
        brand_id: selectedBrandId,
      }),
    }).catch(() => {});

    // Generate outreach
    fetch("/api/outreach/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: selectedBrandId,
        influencerHandle,
        platform: influencerPlatform,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setResult(json.data as OutreachResult);
          setStep("result");
        } else {
          toast.error(json.error?.message ?? t("outreach.generateFailed"));
          setStep("select-brand");
        }
      })
      .catch(() => {
        toast.error(t("outreach.generateFailed"));
        setStep("select-brand");
      });
  }, [step, selectedBrandId, influencerHandle, influencerPlatform]);

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    toast.success(t("outreach.copied"));
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Modal content */}
      <motion.div
        className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">{t("outreach.title")}</h2>
            <span className="text-sm text-muted-foreground">
              @{influencerHandle}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("outreach.close")}
          >
            ✕
          </button>
        </div>

        {/* Step 1: Select Brand */}
        {step === "select-brand" && (
          <div className="space-y-2">
            {brands.length > 0 ? (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("outreach.selectBrand")}
                </p>
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      setSelectedBrandId(brand.id);
                      setStep("generating");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">
                      {brand.brand_name}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </>
            ) : (
              <div className="py-6 text-center">
                <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {t("outreach.noBrand")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("outreach.noBrandDesc")}
                </p>
                <Link href="/brands/new" onClick={() => onOpenChange(false)}>
                  <Button className="mt-4" size="sm">
                    {t("outreach.registerBrand")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Generating */}
        {step === "generating" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {t("outreach.generating").replace("{handle}", influencerHandle)}
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              {t("outreach.generatingDesc")}
            </p>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <div>
            {/* Tab bar */}
            <div className="mb-4 flex gap-1 rounded-lg bg-muted/50 p-1">
              {(
                [
                  { key: "dm" as const, label: t("outreach.tabDm") },
                  { key: "proposal" as const, label: t("outreach.tabProposal") },
                  { key: "points" as const, label: t("outreach.tabPoints") },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[120px] rounded-lg border border-border/50 bg-muted/20 p-4">
              {activeTab === "dm" && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.dmTemplate}
                </p>
              )}
              {activeTab === "proposal" && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.collaborationProposal}
                </p>
              )}
              {activeTab === "points" && (
                <ul className="space-y-2">
                  {result.negotiationPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 text-primary">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Copy button */}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-1.5"
              onClick={() => {
                const text =
                  activeTab === "dm"
                    ? result.dmTemplate
                    : activeTab === "proposal"
                      ? result.collaborationProposal
                      : result.negotiationPoints.join("\n");
                handleCopy(text, activeTab);
              }}
            >
              {copiedField === activeTab ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedField === activeTab ? t("outreach.copiedBtn") : t("outreach.copyBtn")}
            </Button>

            {/* Re-generate with different brand */}
            <button
              onClick={() => {
                setResult(null);
                setStep("select-brand");
              }}
              className="mt-2 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("outreach.regenerate")}
            </button>
          </div>
        )}
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}
