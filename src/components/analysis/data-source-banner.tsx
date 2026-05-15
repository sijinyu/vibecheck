"use client";

import { type DataSource } from "@/lib/adapters/types";
import { type AiSource } from "@/lib/ai/scoring-engine";
import { CheckCircle2, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataSourceBannerProps {
  dataSource: DataSource;
  aiSource?: AiSource;
  className?: string;
}

export function DataSourceBanner({
  dataSource,
  aiSource,
  className,
}: DataSourceBannerProps) {
  if (dataSource === "live") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2",
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Live Data
          {aiSource && (
            <span className="ml-1 text-emerald-600/70 dark:text-emerald-400/70">
              · AI: {aiSource === "gemini" ? "Gemini" : "OpenAI"}
            </span>
          )}
        </span>
      </div>
    );
  }

  // Cached data
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2",
        className
      )}
    >
      <Database className="h-4 w-4 shrink-0 text-blue-500" />
      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
        Cached Data
      </span>
    </div>
  );
}
