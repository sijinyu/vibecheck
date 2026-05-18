/**
 * Brand Discovery Trigger
 *
 * 브랜드 등록 완료 후 자동으로 관련 인플루언서 디스커버리를 시작.
 * fire-and-forget으로 호출하여 브랜드 등록 응답을 지연시키지 않음.
 *
 * 플로우:
 * 1. discoverByKeywords() — 시드 큐 등록 (기존, DB only)
 * 2. suggestInfluencerHandles() — Gemini AI 핸들 추천 (~3초)
 * 3. 추천 15개 전부 discovery_queue에 등록 (priority: 20)
 * 4. 상위 5개 즉시 lightAnalyze() — API 예산 체크 후 실행 (~15초)
 * 5. 나머지 10개는 Cron이 처리
 */

import { type SupabaseClient } from "@supabase/supabase-js";
import { discoverByKeywords, enqueueForDiscovery } from "./discovery-service";
import {
  suggestInfluencerHandles,
  type BrandContextForSuggestion,
} from "./ai-handle-suggester";
import { lightAnalyze } from "./light-analyzer";
import { canMakeApiCall } from "./api-budget";
import { rebuildBrandCache } from "@/lib/ai/match-cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface BrandForDiscovery {
  id: string;
  name: string;
  handle: string;
  brand_keywords: string[];
  target_categories: string[];
  preferred_tiers: string[];
  // AI context from brand analysis
  identity?: string;
  industry?: string;
  targetAudience?: string;
  coreValues?: string[];
  competitors?: string[];
  idealInfluencerProfile?: {
    tone?: string;
    followerRange?: string;
    contentStyle?: string;
    audienceTraits?: string;
    platformFit?: string;
  };
}

const IMMEDIATE_ANALYZE_COUNT = 5;

/**
 * Trigger discovery pipeline after brand registration.
 * This function is designed to be called fire-and-forget.
 */
export async function triggerBrandDiscovery(
  client: Client,
  brand: BrandForDiscovery
): Promise<void> {
  try {
    const keywords = brand.brand_keywords ?? [];
    const categories = brand.target_categories ?? [];

    // Step 1: Enqueue seed influencers matching brand criteria (DB writes only)
    if (categories.length > 0 || keywords.length > 0) {
      const enqueued = await discoverByKeywords(client, keywords, categories);
      console.log(
        `[brand-trigger] Enqueued ${enqueued} seed influencers for brand ${brand.id}`
      );
    }

    // Step 2: AI-powered handle suggestion via Gemini
    const brandContext: BrandContextForSuggestion = {
      name: brand.name,
      handle: brand.handle,
      identity: brand.identity,
      industry: brand.industry,
      targetAudience: brand.targetAudience,
      coreValues: brand.coreValues,
      keywords: brand.brand_keywords,
      competitors: brand.competitors,
      idealInfluencerProfile: brand.idealInfluencerProfile,
    };

    const suggestions = await suggestInfluencerHandles(brandContext);

    if (suggestions.length === 0) {
      console.log("[brand-trigger] No AI suggestions returned, skipping");
      return;
    }

    console.log(
      `[brand-trigger] AI suggested ${suggestions.length} handles for brand "${brand.name}"`
    );

    // Step 3: Enqueue all suggestions to discovery_queue (priority: 20)
    let enqueuedAi = 0;
    for (const suggestion of suggestions) {
      const success = await enqueueForDiscovery(
        client,
        suggestion.handle,
        "instagram",
        "ai_suggest",
        {
          sourceDetail: suggestion.reason,
          category: suggestion.estimatedCategory,
          priority: 20,
        }
      );
      if (success) enqueuedAi++;
    }

    console.log(
      `[brand-trigger] Enqueued ${enqueuedAi} AI-suggested handles (${suggestions.length - enqueuedAi} already existed)`
    );

    // Step 4: Immediately light-analyze top N (budget permitting)
    const toAnalyzeNow = suggestions.slice(0, IMMEDIATE_ANALYZE_COUNT);
    let analyzed = 0;

    for (const suggestion of toAnalyzeNow) {
      if (!(await canMakeApiCall(client, 1))) {
        console.log("[brand-trigger] API budget exceeded, stopping immediate analysis");
        break;
      }

      const result = await lightAnalyze(
        client,
        suggestion.handle,
        "instagram",
        suggestion.estimatedCategory
      );

      if (result.success) {
        analyzed++;

        // Save AI suggestion reason to the influencer record
        await client
          .from("influencers")
          .update({ ai_suggestion_reason: suggestion.reason })
          .eq("handle", suggestion.handle)
          .eq("platform", "instagram");

        console.log(
          `[brand-trigger] Light-analyzed @${suggestion.handle}: ${result.message}`
        );
      } else {
        console.log(
          `[brand-trigger] Failed to analyze @${suggestion.handle}: ${result.message}`
        );
      }

      // Rate limit: 2s between API calls
      if (toAnalyzeNow.indexOf(suggestion) < toAnalyzeNow.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log(
      `[brand-trigger] Completed: ${analyzed}/${toAnalyzeNow.length} immediate, ${suggestions.length - IMMEDIATE_ANALYZE_COUNT} remaining for Cron`
    );

    // Step 5: Rebuild match cache for this brand
    try {
      const cached = await rebuildBrandCache(client, brand.id);
      console.log(`[brand-trigger] Match cache rebuilt: ${cached} entries for brand ${brand.id}`);
    } catch (cacheErr) {
      console.error("[brand-trigger] Cache rebuild failed:", cacheErr);
    }
  } catch (err) {
    // Never throw — this is fire-and-forget
    console.error("[brand-trigger] Error:", err);
  }
}
