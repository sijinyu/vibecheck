"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Calculator, TrendingUp, Users, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { InfluencerTierBadge } from "@/components/analysis/influencer-tier-badge";

// ─── Types ───────────────────────────────────────────────────

export interface InfluencerForBudget {
  influencerId: string;
  handle: string;
  tier: string;
  followerCount: number;
  engagementRate: number;
  estimatedFee: number;
}

export interface BudgetAllocation {
  influencerId: string;
  handle: string;
  tier: string;
  fee: number;
  expectedReach: number;
  expectedEngagement: number;
  cpe: number;
}

export interface BudgetOptimizationResult {
  allocations: BudgetAllocation[];
  totalBudgetUsed: number;
  totalReach: number;
  totalEngagement: number;
  avgCpe: number;
}

interface BudgetCalculatorProps {
  influencers: InfluencerForBudget[];
  onOptimize: (budget: number) => Promise<BudgetOptimizationResult>;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatWon(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}억원`;
  return `${amount.toLocaleString()}만원`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Summary Card ─────────────────────────────────────────────

function SummaryMetric({
  label,
  value,
  icon: Icon,
  className = "",
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 text-center ${className}`}>
      <Icon className="h-4 w-4 text-primary/70" />
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function BudgetCalculator({ influencers, onOptimize }: BudgetCalculatorProps) {
  const [budgetInput, setBudgetInput] = useState<string>("500");
  const [sliderValue, setSliderValue] = useState(500);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<BudgetOptimizationResult | null>(null);

  const maxBudget = Math.max(5000, influencers.reduce((sum, inf) => sum + inf.estimatedFee, 0));

  const handleSliderChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    setBudgetInput(String(val));
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setBudgetInput(raw);
    const num = Number(raw);
    if (!isNaN(num) && num >= 0) {
      setSliderValue(Math.min(num, maxBudget));
    }
  }, [maxBudget]);

  async function handleOptimize() {
    const budget = Number(budgetInput);
    if (!budget || budget <= 0) {
      toast.error("예산을 입력해주세요");
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await onOptimize(budget);
      setResult(res);
    } catch {
      toast.error("예산 최적화 중 오류가 발생했습니다");
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Budget input */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-5 pb-5">
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">예산 설정</h3>
          </div>

          {/* Slider */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>0만원</span>
              <span className="font-semibold text-foreground text-sm tabular-nums">
                {Number(budgetInput || 0).toLocaleString()}만원
              </span>
              <span>{formatWon(maxBudget)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxBudget}
              step={50}
              value={sliderValue}
              onChange={handleSliderChange}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
          </div>

          {/* Number input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                inputMode="numeric"
                value={budgetInput}
                onChange={handleInputChange}
                placeholder="500"
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                만원
              </span>
            </div>
            <Button onClick={handleOptimize} disabled={isOptimizing} className="gap-2 shrink-0">
              {isOptimizing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  최적화 중
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  최적화
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Summary */}
            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-4 pb-4">
                <p className="mb-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  예산 최적화 요약
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <SummaryMetric
                    label="총 예산 사용"
                    value={`${result.totalBudgetUsed.toLocaleString()}만원`}
                    icon={Calculator}
                  />
                  <SummaryMetric
                    label="예상 도달"
                    value={formatNumber(result.totalReach)}
                    icon={Users}
                  />
                  <SummaryMetric
                    label="예상 인게이지먼트"
                    value={formatNumber(result.totalEngagement)}
                    icon={TrendingUp}
                  />
                  <SummaryMetric
                    label="평균 CPE"
                    value={`${result.avgCpe.toLocaleString()}원`}
                    icon={Target}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Allocation list */}
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-4 pb-2">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  추천 인플루언서 배분 ({result.allocations.length}명)
                </p>
                <div className="divide-y divide-border/40">
                  {result.allocations.map((alloc, i) => (
                    <motion.div
                      key={alloc.influencerId}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-wrap items-center gap-3 py-3"
                    >
                      {/* Identity */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">@{alloc.handle}</span>
                          <InfluencerTierBadge tier={alloc.tier} />
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {alloc.fee.toLocaleString()}만원
                        </span>
                        <span>도달 {formatNumber(alloc.expectedReach)}</span>
                        <span>인게이지 {formatNumber(alloc.expectedEngagement)}</span>
                        <span className="text-primary">CPE {alloc.cpe.toLocaleString()}원</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state when no influencers */}
      {influencers.length === 0 && !result && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              캠페인에 인플루언서를 먼저 추가해주세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
