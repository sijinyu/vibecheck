"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "@/components/analysis/profile-card";
import { Search, Loader2 } from "lucide-react";
import { VibeSearchUpload } from "@/components/analysis/vibe-search-upload";
import { ShareButton } from "@/components/analysis/share-button";
import { type ProfileData } from "@/lib/adapters/types";
import { type AestheticScores } from "@/lib/ai/scoring-engine";

interface AnalysisResultData {
  profile: ProfileData;
  scores: AestheticScores;
  representativeImages: string[];
  summary: string;
}

type AnalyzeState =
  | { status: "idle" }
  | { status: "loading"; handle: string }
  | { status: "success"; result: AnalysisResultData }
  | { status: "error"; message: string };

type Platform = "instagram" | "tiktok";

export default function AnalyzePage() {
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [state, setState] = useState<AnalyzeState>({ status: "idle" });

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
          message: json.error?.message ?? "분석에 실패했습니다",
        });
        return;
      }

      setState({ status: "success", result: json.data });
    } catch {
      setState({
        status: "error",
        message: "네트워크 오류가 발생했습니다",
      });
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setHandle(e.target.value);
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
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Vibe<span className="text-primary">Check</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          숫자가 아닌 결을 본다
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
                    ? "인스타그램 핸들 입력 (예: studio_muse)"
                    : "틱톡 핸들 입력 (예: vibe_creator)"
                }
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                "분석하기"
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
                    @{state.handle} 분석 중
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    피드 데이터를 수집하고 AI가 분석하고 있어요
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
              다시 시도
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
              aestheticScore={state.result.scores.overall}
              scores={{
                color: state.result.scores.color,
                composition: state.result.scores.composition,
                toneConsistency: state.result.scores.toneConsistency,
                trend: state.result.scores.trend,
                brandFit: state.result.scores.styleOriginality,
              }}
            />

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
                  Representative Feed
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {state.result.representativeImages.map((url, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Feed ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
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
              />
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetry}
              >
                새로운 핸들 분석
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vibe Search section (idle only) */}
      {state.status === "idle" && (
        <>
          <div className="relative my-8 flex items-center">
            <div className="flex-1 border-t border-border/50" />
            <span className="px-4 text-xs text-muted-foreground">또는</span>
            <div className="flex-1 border-t border-border/50" />
          </div>

          <VibeSearchUpload />
        </>
      )}
    </PageTransition>
  );
}
