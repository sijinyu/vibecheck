"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Loader2 } from "lucide-react";

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
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
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
      {status === "copied" ? "링크 복사됨" : "공유"}
    </Button>
  );
}
