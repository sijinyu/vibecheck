"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────

export interface CampaignMetrics {
  reach: number;
  engagement: number;
  spend: number;
}

interface RoiDashboardProps {
  planned: CampaignMetrics;
  actual: CampaignMetrics;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatWon(n: number): string {
  return `${n.toLocaleString()}만원`;
}

function getEfficiency(actual: number, planned: number): number {
  if (planned === 0) return 0;
  return Math.round((actual / planned) * 100);
}

// ─── Efficiency Badge ────────────────────────────────────────

function EfficiencyBadge({ pct }: { pct: number }) {
  if (pct >= 100) {
    return (
      <span className="flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        {pct}%
      </span>
    );
  }
  if (pct >= 80) {
    return (
      <span className="flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400">
        <Minus className="h-3 w-3" />
        {pct}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-400">
      <TrendingDown className="h-3 w-3" />
      {pct}%
    </span>
  );
}

// ─── Comparison Card ─────────────────────────────────────────

interface ComparisonCardProps {
  label: string;
  plannedValue: number;
  actualValue: number;
  format: (n: number) => string;
  delay?: number;
  invertEfficiency?: boolean;
}

function ComparisonCard({
  label,
  plannedValue,
  actualValue,
  format,
  delay = 0,
  invertEfficiency = false,
}: ComparisonCardProps) {
  const rawPct = getEfficiency(actualValue, plannedValue);
  // For spend: lower actual vs planned = better (invert logic)
  const displayPct = invertEfficiency && rawPct > 0 ? Math.round((plannedValue / actualValue) * 100) : rawPct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-4 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <EfficiencyBadge pct={displayPct} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">계획</span>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {format(plannedValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">실적</span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {format(actualValue)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className={`h-full rounded-full transition-all ${
                  displayPct >= 100
                    ? "bg-emerald-400"
                    : displayPct >= 80
                    ? "bg-amber-400"
                    : "bg-rose-400"
                }`}
                style={{ width: `${Math.min(100, displayPct)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── CPE Calculation ─────────────────────────────────────────

function calcCpe(spend: number, engagement: number): number {
  if (engagement === 0) return 0;
  return Math.round((spend * 10000) / engagement);
}

// ─── Custom Tooltip ───────────────────────────────────────────

interface CustomTooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-[11px] font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function RoiDashboard({ planned, actual }: RoiDashboardProps) {
  const plannedCpe = calcCpe(planned.spend, planned.engagement);
  const actualCpe = calcCpe(actual.spend, actual.engagement);

  const chartData = [
    {
      name: "도달 (K)",
      계획: Math.round(planned.reach / 1000),
      실적: Math.round(actual.reach / 1000),
    },
    {
      name: "인게이지먼트 (K)",
      계획: Math.round(planned.engagement / 1000),
      실적: Math.round(actual.engagement / 1000),
    },
    {
      name: "지출 (만원)",
      계획: planned.spend,
      실적: actual.spend,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Comparison cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ComparisonCard
          label="도달"
          plannedValue={planned.reach}
          actualValue={actual.reach}
          format={formatNumber}
          delay={0}
        />
        <ComparisonCard
          label="인게이지먼트"
          plannedValue={planned.engagement}
          actualValue={actual.engagement}
          format={formatNumber}
          delay={0.06}
        />
        <ComparisonCard
          label="지출"
          plannedValue={planned.spend}
          actualValue={actual.spend}
          format={formatWon}
          delay={0.12}
          invertEfficiency
        />
        <ComparisonCard
          label="CPE (원)"
          plannedValue={plannedCpe}
          actualValue={actualCpe}
          format={(n) => `${n.toLocaleString()}원`}
          delay={0.18}
          invertEfficiency
        />
      </div>

      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.24 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardContent className="pt-5 pb-4">
            <p className="mb-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              계획 vs 실적 비교
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>{value}</span>
                    )}
                  />
                  <Bar dataKey="계획" fill="hsl(var(--muted-foreground) / 0.35)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="실적" fill="hsl(var(--primary) / 0.75)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
