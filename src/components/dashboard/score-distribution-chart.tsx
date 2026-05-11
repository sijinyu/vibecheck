"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";

interface ScoreDistributionChartProps {
  data: Array<{ range: string; count: number }>;
  className?: string;
}

export function ScoreDistributionChart({
  data,
  className,
}: ScoreDistributionChartProps) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) return null;

  return (
    <Card className={`border-border/50 bg-card/50 ${className ?? ""}`}>
      <CardContent className="py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          VibeScore 분포
        </p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="range"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="분석 수"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
