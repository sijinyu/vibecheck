"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Share2, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface ShareButtonProps {
  handle: string;
  platform: "instagram" | "tiktok";
  scores: {
    overall: number;
    color: number;
    composition: number;
    toneConsistency: number;
    trend: number;
    styleOriginality: number;
  };
  summary: string;
  analysisId?: string | null;
}

export function ShareButton({
  handle,
  platform,
  scores,
  summary,
  analysisId,
}: ShareButtonProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "loading" | "copied">("idle");

  async function handleShare() {
    setStatus("loading");

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, platform, scores, summary, analysisId }),
      });

      const json = await response.json();

      if (response.ok && json.data?.shareUrl) {
        await navigator.clipboard.writeText(json.data.shareUrl);
        setStatus("copied");
        toast.success(t("common.shareLinkCopied"));
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        toast.error(t("common.shareLinkError"));
        setStatus("idle");
      }
    } catch {
      toast.error(t("common.shareLinkError"));
      setStatus("idle");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleShare}
      disabled={status === "loading"}
    >
      {status === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status === "copied" && <Check className="h-3.5 w-3.5 text-primary" />}
      {status === "idle" && <Share2 className="h-3.5 w-3.5" />}
      {status === "copied" ? t("common.linkCopied") : t("common.share")}
    </Button>
  );
}
