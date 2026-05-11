"use client";

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface MatchedInfluencer {
  id: string;
  handle: string;
  platform: "instagram" | "tiktok";
  displayName: string;
  aestheticScore: number;
  matchScore: number;
  category: string;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; results: MatchedInfluencer[] }
  | { status: "error"; message: string };

export function VibeSearchUpload() {
  const { t } = useI18n();
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    addFiles(droppedFiles);
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  }

  function addFiles(newFiles: File[]) {
    // Revoke old previews before creating new ones
    previews.forEach((url) => URL.revokeObjectURL(url));
    const combined = [...files, ...newFiles].slice(0, 5);
    setFiles(combined);
    const newPreviews = combined.map((f) => URL.createObjectURL(f));
    setPreviews(newPreviews);
  }

  function handleRemoveImage(index: number) {
    // Revoke the removed preview URL
    URL.revokeObjectURL(previews[index]);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  }

  function handleUploadClick() {
    inputRef.current?.click();
  }

  async function handleSearch() {
    if (files.length === 0) return;

    setState({ status: "loading" });

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

      const response = await fetch("/api/vibe-search", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: json.error?.message ?? t("vibeSearch.error"),
        });
        return;
      }

      setState({ status: "success", results: json.data.results });
    } catch {
      setState({ status: "error", message: t("common.error.network") });
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        role="button"
        tabIndex={0}
        className={`group cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {previews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
              <ImagePlus className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{t("vibeSearch.title")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("vibeSearch.desc")}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {previews.map((preview, i) => (
                <div key={i} className="group/img relative aspect-square">
                  <Image
                    src={preview}
                    alt={`Upload ${i + 1}`}
                    fill
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(i);
                    }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover/img:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {previews.length}/5 {t("vibeSearch.imageCount")}
            </p>
          </div>
        )}
      </div>

      {/* Search Button */}
      {files.length > 0 && state.status !== "success" && (
        <Button
          className="w-full"
          onClick={handleSearch}
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("vibeSearch.searching")}
            </>
          ) : (
            t("vibeSearch.search")
          )}
        </Button>
      )}

      {/* Error */}
      {state.status === "error" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-destructive">{state.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {state.status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("vibeSearch.results")} ({state.results.length})
            </p>
            {state.results.map((influencer, i) => (
              <motion.div
                key={influencer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-card/80">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(influencer.displayName ?? influencer.handle).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {influencer.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{influencer.handle} · {influencer.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums text-primary">
                        {influencer.matchScore}%
                      </p>
                      <p className="text-xs text-muted-foreground">{t("vibeSearch.match")}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
