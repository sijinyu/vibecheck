"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContentAnalysisProps {
  topHashtags: string[];
  contentCategories: string[];
  posts: Array<{
    timestamp: string;
    hashtags: string[];
    likeCount: number;
    commentCount: number;
  }>;
  className?: string;
}

export function ContentAnalysis({
  topHashtags,
  contentCategories,
  posts,
  className,
}: ContentAnalysisProps) {
  // Hashtag effectiveness: which hashtags correlate with higher engagement
  const hashtagEngagement = new Map<string, { total: number; count: number }>();
  for (const post of posts) {
    const eng = post.likeCount + post.commentCount;
    for (const tag of post.hashtags) {
      const lower = tag.toLowerCase();
      const existing = hashtagEngagement.get(lower) ?? { total: 0, count: 0 };
      hashtagEngagement.set(lower, {
        total: existing.total + eng,
        count: existing.count + 1,
      });
    }
  }

  const hashtagEfficiency = Array.from(hashtagEngagement.entries())
    .map(([tag, { total, count }]) => ({
      tag,
      avgEngagement: Math.round(total / count),
      count,
    }))
    .filter((h) => h.count >= 2)
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 8);

  // Posting time analysis
  const hourCounts = new Array(24).fill(0);
  for (const post of posts) {
    const hour = new Date(post.timestamp).getHours();
    hourCounts[hour]++;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakTimeLabel =
    peakHour < 12 ? `오전 ${peakHour}시` : `오후 ${peakHour - 12 || 12}시`;

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {/* Content Categories */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            콘텐츠 카테고리
          </p>
          <div className="flex flex-wrap gap-2">
            {contentCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Hashtags */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            주요 해시태그
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topHashtags.slice(0, 15).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hashtag Effectiveness */}
      {hashtagEfficiency.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              효과적인 해시태그 (평균 인게이지먼트 높은 순)
            </p>
            <div className="space-y-2">
              {hashtagEfficiency.map((h) => (
                <div
                  key={h.tag}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">#{h.tag}</span>
                  <span className="font-medium tabular-nums">
                    {h.avgEngagement.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peak Posting Time */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            포스팅 시간 분석
          </p>
          <p className="text-sm">
            주요 포스팅 시간대: <span className="font-semibold">{peakTimeLabel}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
