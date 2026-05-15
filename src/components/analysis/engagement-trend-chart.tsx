"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

interface EngagementTrendChartProps {
  posts: Array<{
    timestamp: string;
    likeCount: number;
    commentCount: number;
  }>;
  followerCount: number;
  className?: string;
}

export function EngagementTrendChart({
  posts,
  followerCount,
  className,
}: EngagementTrendChartProps) {
  if (posts.length === 0 || followerCount === 0) return null;

  const data = [...posts]
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .map((p, i) => {
      const engRate =
        ((p.likeCount + p.commentCount) / followerCount) * 100;
      return {
        name: `#${i + 1}`,
        engagementRate: Math.round(engRate * 100) / 100,
        date: new Date(p.timestamp).toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        }),
      };
    });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 12,
              color: "hsl(var(--foreground))",
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value) => [`${value}%`, "참여율"]}
          />
          <Line
            type="monotone"
            dataKey="engagementRate"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 5 }}
            name="참여율"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
