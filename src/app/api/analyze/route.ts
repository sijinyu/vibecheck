import { NextResponse } from "next/server";
import { fetchInstagramFeed } from "@/lib/adapters/instagram";
import { fetchTikTokFeed } from "@/lib/adapters/tiktok";
import { analyzeAesthetics } from "@/lib/ai/scoring-engine";
import { calculateVibeScore } from "@/lib/ai/vibe-score-engine";
import { tryCreateClient } from "@/lib/supabase/server";
import { upsertInfluencer, insertAnalysis } from "@/lib/supabase/queries";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { checkLimit, incrementUsage } from "@/lib/usage-tracker";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle, platform = "instagram" } = body;

    if (!handle || typeof handle !== "string") {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "핸들을 입력해주세요" } },
        { status: 400 }
      );
    }

    // Auth check
    const supabaseAuth = await tryCreateClient();
    let userId: string | null = null;
    if (supabaseAuth) {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
          { status: 401 }
        );
      }
      userId = user.id;

      // Rate limit
      const rl = checkRateLimit(`analyze:${user.id}`, RATE_LIMITS.analyze);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: { code: "RATE_LIMITED", message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." } },
          { status: 429 }
        );
      }

      // Free tier usage limit
      const usageCheck = await checkLimit(supabaseAuth, user.id, "analysis");
      if (!usageCheck.allowed) {
        return NextResponse.json(
          {
            error: {
              code: "LIMIT_REACHED",
              message: `이번 달 무료 분석 ${usageCheck.limit}회를 모두 사용했습니다.`,
              upgrade: true,
              current: usageCheck.current,
              limit: usageCheck.limit,
            },
          },
          { status: 403 }
        );
      }
    }

    // Step 1: Collect feed data
    const feedResult =
      platform === "tiktok"
        ? await fetchTikTokFeed(handle)
        : await fetchInstagramFeed(handle);

    if ("error" in feedResult) {
      return NextResponse.json(
        { error: feedResult.error },
        { status: 400 }
      );
    }

    // Step 2: AI Aesthetic Analysis
    const analysis = await analyzeAesthetics(feedResult.data);

    // Step 3: Calculate VibeScore (multi-dimensional)
    const vibeResult = calculateVibeScore(feedResult.data, analysis.scores);

    // Step 4: Persist to DB (try-or-skip)
    let analysisId: string | null = null;
    const supabase = await tryCreateClient();

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const influencer = await upsertInfluencer(supabase, {
          handle: handle.trim(),
          platform,
          display_name: feedResult.data.profile.displayName ?? null,
          profile_image_url: feedResult.data.profile.profileImageUrl ?? null,
          bio: feedResult.data.profile.bio ?? null,
          follower_count: feedResult.data.profile.followerCount ?? null,
          following_count: feedResult.data.profile.followingCount ?? null,
          aesthetic_vector: analysis.aestheticVector,
          aesthetic_score: analysis.scores.overall,
          color_score: analysis.scores.color,
          composition_score: analysis.scores.composition,
          tone_consistency_score: analysis.scores.toneConsistency,
          trend_score: analysis.scores.trend,
          vibe_score: vibeResult.vibeScore,
          engagement_score: vibeResult.engagementScore,
          consistency_score: vibeResult.consistencyScore,
          growth_potential_score: vibeResult.growthPotentialScore,
          authenticity_score: vibeResult.authenticityScore,
          tier: vibeResult.tier,
          avg_likes_per_post: vibeResult.avgLikesPerPost,
          avg_comments_per_post: vibeResult.avgCommentsPerPost,
          engagement_rate: vibeResult.engagementRate,
          posting_frequency_days: vibeResult.postingFrequencyDays,
          top_hashtags: vibeResult.topHashtags,
          content_categories: vibeResult.contentCategories,
          insights: vibeResult.insights as unknown as Record<string, unknown>[],
          post_performances: vibeResult.postPerformances as unknown as Record<string, unknown>[],
          content_type_breakdown: vibeResult.contentTypeBreakdown as unknown as Record<string, unknown>[],
          trend_direction: vibeResult.trendDirection,
          trend_magnitude: vibeResult.trendMagnitude,
          avg_shares_per_post: vibeResult.avgSharesPerPost,
          avg_plays_per_post: vibeResult.avgPlaysPerPost,
          estimated_cpe: vibeResult.estimatedCPE,
          content_effectiveness_score: vibeResult.contentEffectivenessScore,
          platform_benchmark: vibeResult.platformBenchmark,
          category: vibeResult.contentCategories[0] ?? null,
          representative_images: analysis.representativeImages,
          one_liner: analysis.oneLiner || null,
          content_topics: analysis.contentTopics,
          data_source: feedResult.data.dataSource,
          ai_source: analysis.aiSource,
        });

        const analysisRow = await insertAnalysis(supabase, {
          user_id: user.id,
          influencer_id: influencer?.id ?? null,
          handle: handle.trim(),
          platform,
          aesthetic_score: analysis.scores.overall,
          color_score: analysis.scores.color,
          composition_score: analysis.scores.composition,
          tone_consistency_score: analysis.scores.toneConsistency,
          trend_score: analysis.scores.trend,
          brand_fit_score: analysis.scores.styleOriginality,
          vibe_score: vibeResult.vibeScore,
          engagement_score: vibeResult.engagementScore,
          consistency_score: vibeResult.consistencyScore,
          growth_potential_score: vibeResult.growthPotentialScore,
          authenticity_score: vibeResult.authenticityScore,
          engagement_rate: vibeResult.engagementRate,
          representative_images: analysis.representativeImages,
          raw_ai_response: analysis.scores as unknown as Record<string, unknown>,
          summary: analysis.summary,
        });

        analysisId = analysisRow?.id ?? null;
      }
    }

    // Step 5: Increment usage counter
    if (userId && supabaseAuth) {
      await incrementUsage(supabaseAuth, userId, "analysis_count").catch(() => {});
    }

    // Step 6: Return result
    return NextResponse.json({
      data: {
        profile: feedResult.data.profile,
        scores: analysis.scores,
        vibeScore: vibeResult,
        representativeImages: analysis.representativeImages,
        summary: analysis.summary,
        analysisId,
        dataSource: feedResult.data.dataSource,
        aiSource: analysis.aiSource,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "ANALYSIS_FAILED",
          message: "분석에 실패했습니다. 잠시 후 다시 시도해주세요.",
        },
      },
      { status: 500 }
    );
  }
}
