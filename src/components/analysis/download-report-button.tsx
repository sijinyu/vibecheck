"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check } from "lucide-react";
import { type AestheticScores } from "@/lib/ai/scoring-engine";
import { type VibeScoreResult } from "@/lib/ai/vibe-score-engine";
import { useI18n } from "@/lib/i18n/context";

interface DownloadReportButtonProps {
  handle: string;
  platform: "instagram" | "tiktok";
  displayName?: string | null;
  scores: AestheticScores;
  vibeScore?: VibeScoreResult | null;
  summary: string;
  className?: string;
}

export function DownloadReportButton({
  handle,
  platform,
  displayName,
  scores,
  vibeScore,
  summary,
  className,
}: DownloadReportButtonProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");

  async function handleDownload() {
    setStatus("generating");

    try {
      // Dynamic import — jsPDF (~200KB) only loads when user clicks download
      const { generateInfluencerReport } = await import("@/lib/pdf/report-generator");
      const doc = generateInfluencerReport({
        handle,
        platform,
        displayName,
        scores,
        vibeScore,
        summary,
      });

      doc.save(`vibecheck-${handle}-report.pdf`);
      setStatus("done");
      toast.success(t("common.pdfSuccess"));
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      toast.error(t("common.pdfError"));
      setStatus("idle");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 ${className ?? ""}`}
      onClick={handleDownload}
      disabled={status === "generating"}
    >
      {status === "generating" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status === "done" && <Check className="h-3.5 w-3.5 text-primary" />}
      {status === "idle" && <Download className="h-3.5 w-3.5" />}
      {status === "done" ? t("common.downloadDone") : t("common.pdfReport")}
    </Button>
  );
}
