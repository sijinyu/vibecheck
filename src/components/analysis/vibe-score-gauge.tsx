"use client";

import { motion } from "framer-motion";
import { getScoreGrade } from "@/lib/score-utils";

interface VibeScoreGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

export function VibeScoreGauge({
  score,
  size = 180,
  className,
}: VibeScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  function getScoreColor(s: number): string {
    if (s >= 80) return "#22c55e";
    if (s >= 60) return "#eab308";
    if (s >= 40) return "#f97316";
    return "#ef4444";
  }

  const color = getScoreColor(score);

  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-4xl font-bold"
          style={{ fontSize: size * 0.22 }}
        >
          {score}
        </text>
        <text
          x={center}
          y={center + size * 0.12}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.08 }}
        >
          VibeScore
        </text>
      </svg>
      <div
        className="mt-1 rounded-full px-3 py-0.5 text-xs font-bold"
        style={{ backgroundColor: `${color}20`, color }}
      >
        Grade {getScoreGrade(score)}
      </div>
    </div>
  );
}
