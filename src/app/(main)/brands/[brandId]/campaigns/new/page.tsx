"use client";

import { useState, use, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Megaphone, Target } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface CampaignFormData {
  name: string;
  budget: string;
  startDate: string;
  endDate: string;
  brief: string;
  targetReach: string;
  targetEngagement: string;
}

// ─── Main Component ───────────────────────────────────────────

export default function NewCampaignPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = use(params);
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CampaignFormData>({
    name: "",
    budget: "",
    startDate: "",
    endDate: "",
    brief: "",
    targetReach: "",
    targetEngagement: "",
  });

  function handleFieldChange(field: keyof CampaignFormData) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("캠페인 이름을 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        brandId,
        name: form.name.trim(),
      };

      if (form.budget.trim()) {
        payload.budget = Number(form.budget);
      }
      if (form.startDate) {
        payload.startDate = form.startDate;
      }
      if (form.endDate) {
        payload.endDate = form.endDate;
      }
      if (form.brief.trim()) {
        payload.brief = form.brief.trim();
      }
      if (form.targetReach.trim()) {
        payload.targetReach = Number(form.targetReach);
      }
      if (form.targetEngagement.trim()) {
        payload.targetEngagement = Number(form.targetEngagement);
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message ?? "캠페인 생성에 실패했습니다");
        return;
      }

      toast.success("캠페인이 생성되었습니다");
      const campaignId = json.data?.id;
      if (campaignId) {
        router.push(`/brands/${brandId}/campaigns/${campaignId}`);
      } else {
        router.push(`/brands/${brandId}/campaigns`);
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-3xl lg:px-8">
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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-8"
      >
        <h1 className="text-xl font-bold tracking-tight">새 캠페인 만들기</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          캠페인 정보를 입력하고 인플루언서 마케팅을 시작하세요
        </p>
      </motion.div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Basic info */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-5 pb-5">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">기본 정보</h2>
            </div>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="campaign-name"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  캠페인 이름 <span className="text-destructive">*</span>
                </label>
                <Input
                  id="campaign-name"
                  value={form.name}
                  onChange={handleFieldChange("name")}
                  placeholder="예: 2025 여름 신제품 런칭 캠페인"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Budget */}
              <div>
                <label
                  htmlFor="campaign-budget"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  예산 (만원, 선택)
                </label>
                <div className="relative">
                  <Input
                    id="campaign-budget"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.budget}
                    onChange={handleFieldChange("budget")}
                    placeholder="500"
                    disabled={submitting}
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    만원
                  </span>
                </div>
              </div>

              {/* Date range */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="campaign-start"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    시작일
                  </label>
                  <Input
                    id="campaign-start"
                    type="date"
                    value={form.startDate}
                    onChange={handleFieldChange("startDate")}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label
                    htmlFor="campaign-end"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    종료일
                  </label>
                  <Input
                    id="campaign-end"
                    type="date"
                    value={form.endDate}
                    onChange={handleFieldChange("endDate")}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brief */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-5 pb-5">
            <div>
              <label
                htmlFor="campaign-brief"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                캠페인 브리프 (선택)
              </label>
              <textarea
                id="campaign-brief"
                value={form.brief}
                onChange={handleFieldChange("brief")}
                placeholder="캠페인 목표, 타겟 오디언스, 메시지, 콘텐츠 방향 등을 자유롭게 작성해주세요"
                disabled={submitting}
                rows={5}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Target KPIs */}
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-5 pb-5">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">목표 KPI (선택)</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="target-reach"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  목표 도달 수
                </label>
                <Input
                  id="target-reach"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.targetReach}
                  onChange={handleFieldChange("targetReach")}
                  placeholder="예: 500000"
                  disabled={submitting}
                />
              </div>
              <div>
                <label
                  htmlFor="target-engagement"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  목표 인게이지먼트 수
                </label>
                <Input
                  id="target-engagement"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.targetEngagement}
                  onChange={handleFieldChange("targetEngagement")}
                  placeholder="예: 25000"
                  disabled={submitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full gap-2"
          disabled={submitting || !form.name.trim()}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Megaphone className="h-4 w-4" />
              캠페인 만들기
            </>
          )}
        </Button>
      </form>
    </PageTransition>
  );
}
