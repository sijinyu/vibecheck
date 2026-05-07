"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "@/components/analysis/profile-card";
import { Plus, Loader2, X } from "lucide-react";
import { type ProfileData } from "@/lib/adapters/types";
import { type AestheticScores } from "@/lib/ai/scoring-engine";

interface CompareItem {
  profile: ProfileData;
  scores: AestheticScores;
  summary: string;
}

export default function ComparePage() {
  const [handles, setHandles] = useState(["", ""]);
  const [results, setResults] = useState<(CompareItem | null)[]>([
    null,
    null,
  ]);
  const [loading, setLoading] = useState(false);

  function handleInputChange(index: number) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const newHandles = [...handles];
      newHandles[index] = e.target.value;
      setHandles(newHandles);
    };
  }

  function handleAddSlot() {
    if (handles.length < 3) {
      setHandles([...handles, ""]);
      setResults([...results, null]);
    }
  }

  function handleRemoveSlot(index: number) {
    if (handles.length > 2) {
      setHandles(handles.filter((_, i) => i !== index));
      setResults(results.filter((_, i) => i !== index));
    }
  }

  async function handleCompare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validHandles = handles.filter((h) => h.trim());
    if (validHandles.length < 2) return;

    setLoading(true);

    try {
      const promises = validHandles.map(async (handle) => {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: handle.trim(), platform: "instagram" }),
        });
        const json = await response.json();
        if (!response.ok) return null;
        return json.data as CompareItem;
      });

      const newResults = await Promise.all(promises);
      setResults(newResults);
    } catch {
      // Keep existing results
    } finally {
      setLoading(false);
    }
  }

  const hasResults = results.some((r) => r !== null);

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Compare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          인플루언서 2-3명을 나란히 비교해보세요
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <form onSubmit={handleCompare} className="space-y-3">
            {handles.map((handle, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={handle}
                  onChange={handleInputChange(i)}
                  placeholder={`인플루언서 ${i + 1} 핸들`}
                  disabled={loading}
                  className="flex-1"
                />
                {handles.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSlot(i)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              {handles.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleAddSlot}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />3명 비교
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || handles.filter((h) => h.trim()).length < 2}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  "비교하기"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {hasResults && (
        <div className="mt-8 space-y-4">
          {results.map(
            (result, i) =>
              result && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <ProfileCard
                    handle={result.profile.handle}
                    platform={result.profile.platform}
                    displayName={result.profile.displayName}
                    aestheticScore={result.scores.overall}
                    scores={{
                      color: result.scores.color,
                      composition: result.scores.composition,
                      toneConsistency: result.scores.toneConsistency,
                      trend: result.scores.trend,
                      brandFit: result.scores.styleOriginality,
                    }}
                  />
                </motion.div>
              )
          )}
        </div>
      )}
    </PageTransition>
  );
}
