import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { tryCreateClient } from "@/lib/supabase/server";
import { getAnalysisByShareToken } from "@/lib/supabase/queries";
import { type Analysis } from "@/lib/supabase/types";
import { getScoreGrade } from "@/lib/score-utils";
// Server component — cannot use useI18n() hook. Using t() directly with "ko" default
// to match the client-side SSR default locale. English locale is handled via
// the client I18nProvider after hydration if needed.
import { t } from "@/lib/i18n/translations";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

async function fetchSharedAnalysis(shareToken: string): Promise<Analysis | null> {
  const supabase = await tryCreateClient();
  if (!supabase) return null;
  return getAnalysisByShareToken(supabase, shareToken);
}

const getGrade = getScoreGrade;

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const analysis = await fetchSharedAnalysis(id);

  if (analysis) {
    const displayScore = analysis.vibe_score ?? analysis.aesthetic_score;
    const scoreLabel = analysis.vibe_score ? "VibeScore" : "Aesthetic Score";
    return {
      title: `@${analysis.handle} ${scoreLabel} — VibeCheck`,
      description: analysis.summary ?? `${scoreLabel}: ${displayScore}/100`,
      openGraph: {
        title: `@${analysis.handle} — ${scoreLabel} ${displayScore}`,
        description: analysis.summary ?? t("share.ogDesc", "ko"),
        type: "website",
      },
    };
  }

  return {
    title: t("share.metaTitle", "ko"),
    description: t("share.metaDesc", "ko"),
    openGraph: {
      title: `인플루언서 분석 결과 — VibeCheck`,
      description: `VibeScore를 확인해보세요. (ID: ${id})`,
      type: "website",
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const analysis = await fetchSharedAnalysis(id);

  if (!analysis) {
    return (
      <PageTransition className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Vibe<span className="text-primary">Check</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("share.subtitle", "ko")}
          </p>
        </div>

        <Card className="w-full max-w-sm border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-sm text-muted-foreground">
              {t("share.notFound", "ko")}
            </p>
            <Link href="/login">
              <Button size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                {t("share.cta", "ko")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  const displayScore = analysis.vibe_score ?? analysis.aesthetic_score;
  const grade = getGrade(displayScore);
  const hasVibeScore = analysis.vibe_score != null;

  const scores = hasVibeScore
    ? [
        { label: t("score.aesthetic", "ko"), value: analysis.aesthetic_score },
        { label: t("score.engagement", "ko"), value: analysis.engagement_score },
        { label: t("score.consistency", "ko"), value: analysis.consistency_score },
        { label: t("score.growth", "ko"), value: analysis.growth_potential_score },
        { label: t("score.authenticity", "ko"), value: analysis.authenticity_score },
      ]
    : [
        { label: t("score.color", "ko"), value: analysis.color_score },
        { label: t("score.composition", "ko"), value: analysis.composition_score },
        { label: t("score.toneConsistency", "ko"), value: analysis.tone_consistency_score },
        { label: t("score.trend", "ko"), value: analysis.trend_score },
        { label: t("score.brandFit", "ko"), value: analysis.brand_fit_score },
      ];

  return (
    <PageTransition className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center px-4 pt-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Vibe<span className="text-primary">Check</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("share.subtitle", "ko")}
        </p>
      </div>

      {/* Score Card */}
      <Card className="w-full border-border/50 bg-card/50">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {analysis.handle.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">@{analysis.handle}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {analysis.platform}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-3xl font-bold tabular-nums text-primary">
                {displayScore}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {hasVibeScore ? "VibeScore" : "Aesthetic"} · Grade {grade}
              </p>
            </div>
          </div>

          {/* Detail scores */}
          <div className="grid grid-cols-5 gap-2">
            {scores.map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-muted/50 px-2 py-2 text-center"
              >
                <p className="text-lg font-bold tabular-nums">
                  {s.value ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          {analysis.summary && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          )}

          {/* Representative images */}
          {analysis.representative_images.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {analysis.representative_images.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={url}
                    alt={`Feed ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 200px"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link href="/login">
          <Button size="sm" className="gap-2">
            <ExternalLink className="h-3.5 w-3.5" />
            {t("share.analyzeMe", "ko")}
          </Button>
        </Link>
      </div>
    </PageTransition>
  );
}
