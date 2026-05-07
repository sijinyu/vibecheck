"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AestheticRadarChart } from "@/components/analysis/aesthetic-radar-chart";
import { Palette, Loader2, Check, ImagePlus } from "lucide-react";
import { type AestheticScores } from "@/lib/ai/scoring-engine";

interface BrandProfileData {
  name: string;
  handle: string;
  scores: AestheticScores;
  summary: string;
  representativeImages: string[];
}

type BrandState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; profile: BrandProfileData }
  | { status: "error"; message: string };

export default function BrandPage() {
  const [brandName, setBrandName] = useState("");
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<BrandState>({ status: "idle" });

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
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setState({
          status: "error",
          message: json.error?.message ?? "분석에 실패했습니다",
        });
        return;
      }

      setState({ status: "success", profile: json.data });
    } catch {
      setState({
        status: "error",
        message: "네트워크 오류가 발생했습니다",
      });
    }
  }

  function handleBrandNameChange(e: ChangeEvent<HTMLInputElement>) {
    setBrandName(e.target.value);
  }

  function handleHandleChange(e: ChangeEvent<HTMLInputElement>) {
    setHandle(e.target.value);
  }

  const isLoading = state.status === "loading";

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Brand Setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          브랜드 톤을 등록하면 인플루언서와의 매칭 점수를 볼 수 있어요
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
                브랜드 이름
              </label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={handleBrandNameChange}
                placeholder="예: Studio Muse"
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                htmlFor="brand-handle"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                인스타그램 핸들
              </label>
              <Input
                id="brand-handle"
                value={handle}
                onChange={handleHandleChange}
                placeholder="예: @your_brand"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  브랜드 톤 분석 중...
                </>
              ) : (
                <>
                  <Palette className="mr-2 h-4 w-4" />
                  브랜드 톤 분석하기
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Image Upload (placeholder) */}
      <div className="relative my-6 flex items-center">
        <div className="flex-1 border-t border-border/50" />
        <span className="px-4 text-xs text-muted-foreground">또는</span>
        <div className="flex-1 border-t border-border/50" />
      </div>

      <Card className="group cursor-pointer border-dashed border-border/50 bg-card/30 transition-colors hover:border-accent/50 hover:bg-card/50">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <div className="rounded-xl bg-accent/10 p-3 transition-colors group-hover:bg-accent/20">
            <ImagePlus className="h-6 w-6 text-accent" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">무드보드 업로드</p>
            <p className="mt-1 text-xs text-muted-foreground">
              브랜드 무드보드 이미지로도 톤 분석이 가능해요
            </p>
          </div>
        </CardContent>
      </Card>

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
                    {state.profile.name} 브랜드 톤 등록 완료
                  </p>
                  <p className="text-xs text-muted-foreground">
                    이제 인플루언서 분석 시 Brand Fit Score가 표시됩니다
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
                    className="aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Brand ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
