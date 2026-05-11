"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";

interface GrowthChartProps {
  posts: Array<{
    timestamp: string;
    likeCount: number;
    commentCount: number;
  }>;
  className?: string;
}

export function GrowthChart({ posts, className }: GrowthChartProps) {
  if (posts.length === 0) return null;

  const data = [...posts]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .map((p, i) => ({
      name: `P${i + 1}`,
      engagement: p.likeCount + p.commentCount,
      date: new Date(p.timestamp).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      }),
    }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Area
            type="monotone"
            dataKey="engagement"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#engGradient)"
            name="인게이지먼트"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
