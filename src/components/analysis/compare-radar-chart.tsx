"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "oklch(0.75 0.15 330)", // pink/primary
  "oklch(0.7 0.15 200)",  // blue
  "oklch(0.7 0.15 140)",  // green
];

interface InfluencerScores {
  handle: string;
  color: number;
  composition: number;
  toneConsistency: number;
  trend: number;
  styleOriginality: number;
}

interface CompareRadarChartProps {
  influencers: InfluencerScores[];
  className?: string;
}

export function CompareRadarChart({
  influencers,
  className,
}: CompareRadarChartProps) {
  const axes = [
    { key: "color", label: "색감" },
    { key: "composition", label: "구도" },
    { key: "toneConsistency", label: "톤 일관성" },
    { key: "trend", label: "트렌드" },
    { key: "styleOriginality", label: "독창성" },
  ] as const;

  const chartData = axes.map(({ key, label }) => {
    const point: Record<string, string | number> = { axis: label };
    influencers.forEach((inf) => {
      point[inf.handle] = inf[key];
    });
    return point;
  });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="oklch(1 0 0 / 8%)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          {influencers.map((inf, i) => (
            <Radar
              key={inf.handle}
              name={`@${inf.handle}`}
              dataKey={inf.handle}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 12, color: "oklch(0.6 0 0)" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
