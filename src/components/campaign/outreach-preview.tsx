"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────

export interface OutreachResult {
  dmTemplate: string;
  collaborationProposal: string;
  negotiationPoints: string[];
}

interface OutreachPreviewProps {
  outreach: OutreachResult | null;
  isLoading: boolean;
  onGenerate: () => void;
}

// ─── Copy Button ─────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} 복사됨`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("클립보드 복사에 실패했습니다");
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1 rounded-lg border border-border/50 bg-muted/30 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      aria-label={`${label} 복사`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">복사됨</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          복사
        </>
      )}
    </button>
  );
}

// ─── Section Block ────────────────────────────────────────────

function OutreachSection({
  title,
  content,
  isList = false,
  delay = 0,
}: {
  title: string;
  content: string | string[];
  isList?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
    >
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-4 pb-4">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {title}
              </h3>
            </div>
            <CopyButton
              text={isList && Array.isArray(content) ? content.join("\n• ") : String(content)}
              label={title}
            />
          </div>

          {isList && Array.isArray(content) ? (
            <ul className="space-y-1.5">
              {content.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {point}
                </li>
              ))}
            </ul>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {String(content)}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function OutreachPreview({ outreach, isLoading, onGenerate }: OutreachPreviewProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">AI가 아웃리치 메시지를 생성하고 있습니다...</p>
        </CardContent>
      </Card>
    );
  }

  if (!outreach) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="rounded-xl bg-muted/50 p-4">
            <MessageSquare className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">AI 아웃리치 메시지</p>
            <p className="mt-1 text-xs text-muted-foreground">
              인플루언서에게 보낼 DM 템플릿, 협업 제안서, 협상 포인트를 AI가 자동 생성합니다
            </p>
          </div>
          <Button onClick={onGenerate} size="sm" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            AI 메시지 생성
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">아웃리치 메시지</h2>
        <Button variant="ghost" size="sm" onClick={onGenerate} className="gap-1.5 text-xs">
          <Sparkles className="h-3 w-3" />
          재생성
        </Button>
      </div>

      <OutreachSection
        title="DM 템플릿"
        content={outreach.dmTemplate}
        delay={0}
      />

      <OutreachSection
        title="협업 제안서"
        content={outreach.collaborationProposal}
        delay={0.06}
      />

      {outreach.negotiationPoints.length > 0 && (
        <OutreachSection
          title="협상 포인트"
          content={outreach.negotiationPoints}
          isList
          delay={0.12}
        />
      )}
    </div>
  );
}
