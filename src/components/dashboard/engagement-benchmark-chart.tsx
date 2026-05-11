"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

interface EngagementBenchmarkChartProps {
  analyses: Array<{
    handle: string;
    vibeScore: number | null;
    engagementScore: number | null;
  }>;
  className?: string;
}

export function EngagementBenchmarkChart({
  analyses,
  className,
}: EngagementBenchmarkChartProps) {
  const recent = analyses.slice(0, 8).map((a) => ({
    handle: `@${a.handle.length > 8 ? a.handle.slice(0, 8) + "…" : a.handle}`,
    vibeScore: Number(a.vibeScore ?? 0),
    engagementScore: Number(a.engagementScore ?? 0),
  }));

  if (recent.length === 0) return null;

  return (
    <Card className={`border-border/50 bg-card/50 ${className ?? ""}`}>
      <CardContent className="py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          인플루언서 벤치마크
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recent} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="handle"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                hide
                domain={[0, 100]}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10 }}
              />
              <Bar
                dataKey="vibeScore"
                fill="hsl(var(--primary))"
                radius={[3, 3, 0, 0]}
                name="VibeScore"
              />
              <Bar
                dataKey="engagementScore"
                fill="hsl(var(--accent))"
                radius={[3, 3, 0, 0]}
                name="Engagement"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
