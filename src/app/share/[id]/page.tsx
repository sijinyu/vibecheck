import { type Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { id } = await params;

  // TODO: Fetch actual analysis data from Supabase by share ID
  return {
    title: `분석 결과 공유 — VibeCheck`,
    description: `VibeCheck에서 공유된 인플루언서 분석 결과입니다.`,
    openGraph: {
      title: `인플루언서 분석 결과 — VibeCheck`,
      description: `Aesthetic Score를 확인해보세요. (ID: ${id})`,
      type: "website",
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  // TODO: Fetch actual shared analysis from Supabase
  // For now, show a placeholder

  return (
    <PageTransition className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Vibe<span className="text-primary">Check</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          공유된 분석 결과
        </p>
      </div>

      <Card className="w-full max-w-sm border-border/50 bg-card/50">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <p className="text-xs text-muted-foreground">Share ID: {id}</p>
          <p className="text-sm text-muted-foreground">
            Supabase 연동 후 실제 분석 결과가 표시됩니다
          </p>
          <Link href="/login">
            <Button size="sm" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              VibeCheck 시작하기
            </Button>
          </Link>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
