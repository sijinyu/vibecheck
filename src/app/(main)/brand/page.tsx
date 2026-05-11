"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AestheticRadarChart } from "@/components/analysis/aesthetic-radar-chart";
import { RecommendationCard } from "@/components/analysis/recommendation-card";
import { Palette, Loader2, Check, ImagePlus, X, Sparkles } from "lucide-react";
import { type AestheticScores } from "@/lib/ai/scoring-engine";
import { useI18n } from "@/lib/i18n/context";

interface BrandProfileData {
  name: string;
  handle: string;
  scores: AestheticScores;
  summary: string;
  representativeImages: string[];
}

interface MatchResult {
  influencerId: string;
  handle: string;
  platform: string;
  displayName: string | null;
  matchScore: number;
  vibeScore: number;
  tier: string;
  engagementRate: number;
  matchReason: string;
}

type BrandState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; profile: BrandProfileData }
  | { status: "error"; message: string };

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

export default function BrandPage() {
  const { t } = useI18n();
  const [brandName, setBrandName] = useState("");
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<BrandState>({ status: "idle" });

  // Preferences
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Recommendations
  const [recommendations, setRecommendations] = useState<MatchResult[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Moodboard state
  const [moodFiles, setMoodFiles] = useState<File[]>([]);
  const [moodPreviews, setMoodPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const moodInputRef = useRef<HTMLInputElement>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoadingRecs(true);
    try {
      const res = await fetch("/api/brand/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredTiers: selectedTiers,
          targetCategories: selectedCategories,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setRecommendations(json.data);
      }
    } catch {
      // Silently fail — recommendations are supplementary
    } finally {
      setLoadingRecs(false);
    }
  }, [selectedTiers, selectedCategories]);

  // Fetch recommendations after brand is registered
  useEffect(() => {
    if (state.status === "success") {
      fetchRecommendations();
    }
  }, [state.status, fetchRecommendations]);

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      moodPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handle-based analysis ─────────────────────────────────

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!handle.trim() || !brandName.trim()) return;

    setState({ status: "loading" });

    try {
      const response = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: handle.trim(),
          name: brandName.trim(),
          preferredTiers: selectedTiers,
          targetCategories: selectedCategories,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: json.error?.message ?? t("analyze.error.default"),
        });
        toast.error(json.error?.message ?? t("analyze.error.default"));
        return;
      }

      setState({ status: "success", profile: json.data });
      toast.success(t("brand.registeredSuccess"));
    } catch {
      setState({
        status: "error",
        message: t("common.error.network"),
      });
      toast.error(t("common.error.network"));
    }
  }

  function handleBrandNameChange(e: ChangeEvent<HTMLInputElement>) {
    setBrandName(e.target.value);
  }

  function handleHandleChange(e: ChangeEvent<HTMLInputElement>) {
    setHandle(e.target.value);
  }

  function toggleTier(tier: string) {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  // ─── Moodboard upload ──────────────────────────────────────

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    addMoodFiles(droppedFiles);
  }

  function handleMoodFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addMoodFiles(Array.from(e.target.files));
    }
  }

  function addMoodFiles(newFiles: File[]) {
    moodPreviews.forEach((url) => URL.revokeObjectURL(url));
    const combined = [...moodFiles, ...newFiles].slice(0, 5);
    setMoodFiles(combined);
    setMoodPreviews(combined.map((f) => URL.createObjectURL(f)));
  }

  function handleRemoveMoodImage(index: number) {
    URL.revokeObjectURL(moodPreviews[index]);
    const newFiles = moodFiles.filter((_, i) => i !== index);
    const newPreviews = moodPreviews.filter((_, i) => i !== index);
    setMoodFiles(newFiles);
    setMoodPreviews(newPreviews);
  }

  function handleMoodUploadClick() {
    moodInputRef.current?.click();
  }

  async function handleMoodboardAnalyze() {
    if (moodFiles.length === 0 || !brandName.trim()) {
      toast.error(t("brand.moodboardError"));
      return;
    }

    setState({ status: "loading" });

    try {
      const formData = new FormData();
      formData.append("name", brandName.trim());
      formData.append("preferredTiers", JSON.stringify(selectedTiers));
      formData.append("targetCategories", JSON.stringify(selectedCategories));
      moodFiles.forEach((f) => formData.append("images", f));

      const response = await fetch("/api/brand", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: json.error?.message ?? t("analyze.error.default"),
        });
        toast.error(json.error?.message ?? t("analyze.error.default"));
        return;
      }

      setState({ status: "success", profile: json.data });
      toast.success(t("brand.moodboardSuccess"));
    } catch {
      setState({
        status: "error",
        message: t("common.error.network"),
      });
      toast.error(t("common.error.network"));
    }
  }

  const isLoading = state.status === "loading";

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-4xl lg:px-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">{t("brand.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("brand.desc")}
        </p>
      </div>

      {/* Handle Input Method */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="brand-name"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                {t("brand.nameLabel")}
              </label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={handleBrandNameChange}
                placeholder={t("brand.namePlaceholder")}
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="brand-handle"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                {t("brand.handleLabel")}
              </label>
              <Input
                id="brand-handle"
                value={handle}
                onChange={handleHandleChange}
                placeholder={t("brand.handlePlaceholder")}
                disabled={isLoading}
              />
            </div>

            {/* Tier Preferences */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("brand.tierLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIER_OPTIONS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => toggleTier(tier.value)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      selectedTiers.includes(tier.value)
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Preferences */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t("brand.categoryLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      selectedCategories.includes(cat)
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("brand.analyzingHandle")}
                </>
              ) : (
                <>
                  <Palette className="mr-2 h-4 w-4" />
                  {t("brand.analyzeHandle")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative my-6 flex items-center">
        <div className="flex-1 border-t border-border/50" />
        <span className="px-4 text-xs text-muted-foreground">{t("brand.or")}</span>
        <div className="flex-1 border-t border-border/50" />
      </div>

      {/* Moodboard Upload */}
      <div className="space-y-3">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleMoodUploadClick}
          role="button"
          tabIndex={0}
          className={`group cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/50 bg-card/30 hover:border-accent/50 hover:bg-card/50"
          }`}
        >
          <input
            ref={moodInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleMoodFileSelect}
            className="hidden"
          />

          {moodPreviews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="rounded-xl bg-accent/10 p-3 transition-colors group-hover:bg-accent/20">
                <ImagePlus className="h-6 w-6 text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{t("brand.moodboardUpload")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("brand.moodboardUploadDesc")}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
                {moodPreviews.map((preview, i) => (
                  <div key={i} className="group/img relative aspect-square">
                    <Image
                      src={preview}
                      alt={`Moodboard ${i + 1}`}
                      fill
                      className="rounded-lg object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMoodImage(i);
                      }}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover/img:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {moodPreviews.length}/5 {t("brand.moodboardImagesCount")}
              </p>
            </div>
          )}
        </div>

        {moodFiles.length > 0 && (
          <Button
            className="w-full"
            onClick={handleMoodboardAnalyze}
            disabled={isLoading || !brandName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("brand.analyzingMoodboard")}
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                {t("brand.analyzeMoodboard")}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {state.status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6"
          >
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-6 text-center">
                <p className="text-sm text-destructive">{state.message}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {state.status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 space-y-4"
          >
            {/* Success indicator */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {state.profile.name} {t("brand.registered")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("brand.registeredDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Brand Radar Chart */}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Brand Tone Profile
                </p>
                <AestheticRadarChart
                  data={{
                    color: state.profile.scores.color,
                    composition: state.profile.scores.composition,
                    toneConsistency: state.profile.scores.toneConsistency,
                    trend: state.profile.scores.trend,
                    brandFit: state.profile.scores.styleOriginality,
                  }}
                  className="h-52"
                />
                {state.profile.summary && (
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    {state.profile.summary}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Representative Images */}
            {state.profile.representativeImages.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {state.profile.representativeImages.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={url}
                      alt={`Brand ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 200px"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            <div className="pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("brand.recommendedInfluencers")}
                </p>
              </div>

              {loadingRecs && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t("brand.matching")}
                    </span>
                  </CardContent>
                </Card>
              )}

              {!loadingRecs && recommendations.length > 0 && (
                <div className="space-y-2">
                  {recommendations.slice(0, 10).map((rec) => (
                    <RecommendationCard
                      key={rec.influencerId}
                      handle={rec.handle}
                      platform={rec.platform}
                      displayName={rec.displayName}
                      matchScore={rec.matchScore}
                      vibeScore={rec.vibeScore}
                      tier={rec.tier}
                      engagementRate={rec.engagementRate}
                      matchReason={rec.matchReason}
                    />
                  ))}
                </div>
              )}

              {!loadingRecs && recommendations.length === 0 && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("brand.noMatches")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {t("brand.noMatchesDesc")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
