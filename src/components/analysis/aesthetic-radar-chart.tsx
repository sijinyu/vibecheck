"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface AestheticRadarChartProps {
  data: {
    color: number;
    composition: number;
    toneConsistency: number;
    trend: number;
    brandFit: number;
  };
  className?: string;
}

export function AestheticRadarChart({
  data,
  className,
}: AestheticRadarChartProps) {
  const chartData = [
    { axis: "색감", value: data.color },
    { axis: "구도", value: data.composition },
    { axis: "톤 일관성", value: data.toneConsistency },
    { axis: "트렌드", value: data.trend },
    { axis: "브랜드 적합", value: data.brandFit },
  ];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
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
          <Radar
            name="Score"
            dataKey="value"
            stroke="oklch(0.75 0.15 330)"
            fill="oklch(0.75 0.15 330)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
