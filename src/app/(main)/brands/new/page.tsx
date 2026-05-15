"use client";

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Palette, ImagePlus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

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

type PageState = "idle" | "loading" | "error";

export default function NewBrandPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [brandName, setBrandName] = useState("");
  const [handle, setHandle] = useState("");
  const [pageState, setPageState] = useState<PageState>("idle");

  // Preferences
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Moodboard state
  const [moodFiles, setMoodFiles] = useState<File[]>([]);
  const [moodPreviews, setMoodPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const moodInputRef = useRef<HTMLInputElement>(null);

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

    setPageState("loading");

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
        setPageState("error");
        toast.error(json.error?.message ?? t("analyze.error.default"));
        return;
      }

      toast.success(t("brand.registeredSuccess"));
      if (json.data.brandId) {
        router.push(`/brands/${json.data.brandId}`);
      } else {
        router.push("/brands");
      }
    } catch {
      setPageState("error");
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

    setPageState("loading");

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
        setPageState("error");
        toast.error(json.error?.message ?? t("analyze.error.default"));
        return;
      }

      toast.success(t("brand.moodboardSuccess"));
      if (json.data.brandId) {
        router.push(`/brands/${json.data.brandId}`);
      } else {
        router.push("/brands");
      }
    } catch {
      setPageState("error");
      toast.error(t("common.error.network"));
    }
  }

  const isLoading = pageState === "loading";

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-4xl lg:px-8">
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

      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">
          {t("brands.new.title")}
        </h1>
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
        <span className="px-4 text-xs text-muted-foreground">
          {t("brand.or")}
        </span>
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
                <p className="text-sm font-medium">
                  {t("brand.moodboardUpload")}
                </p>
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
    </PageTransition>
  );
}
