/**
 * POST /api/admin/mass-seed
 *
 * Gemini AI로 대량 인플루언서 스텁 프로필을 생성하고 DB에 삽입하는 관리자 전용 엔드포인트.
 * Vercel 60초 timeout을 고려해 한 번 호출당 2-3개 카테고리만 처리.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * Request body:
 * {
 *   categories?: string[]          // 생략 시 전체 14개 카테고리
 *   variationsPerCategory?: number // 생략 시 10, 최대 100
 * }
 *
 * Response:
 * {
 *   data: {
 *     inserted, skipped, duplicates, errors,
 *     categoriesProcessed: string[],
 *     categoryBreakdown: Record<string, StubInsertResult>
 *   }
 * }
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DISCOVERY_CATEGORIES } from "@/lib/discovery/category-handle-suggester";
import {
  generateAllVariationsForCategory,
} from "@/lib/discovery/mass-stub-generator";
import { insertStubBatch, type StubInsertResult } from "@/lib/discovery/stub-inserter";

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------

const MAX_CATEGORIES_PER_CALL = 3;
const DEFAULT_VARIATIONS_PER_CATEGORY = 10;
const MAX_VARIATIONS_PER_CATEGORY = 100;

// -----------------------------------------------------------------------
// Request body type
// -----------------------------------------------------------------------

interface MassSeedRequestBody {
  categories?: string[];
  variationsPerCategory?: number;
}

// -----------------------------------------------------------------------
// Auth helper
// -----------------------------------------------------------------------

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[mass-seed] CRON_SECRET env var not configured");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim();

  return providedToken === cronSecret;
}

// -----------------------------------------------------------------------
// Route handler
// -----------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  // Parse body
  let body: MassSeedRequestBody = {};
  try {
    body = (await request.json()) as MassSeedRequestBody;
  } catch {
    // Empty or invalid body — use defaults
  }

  const { categories: requestedCategories, variationsPerCategory } = body;

  // Validate and cap variationsPerCategory
  const variationCount = Math.min(
    Math.max(1, variationsPerCategory ?? DEFAULT_VARIATIONS_PER_CATEGORY),
    MAX_VARIATIONS_PER_CATEGORY
  );

  // Determine which categories to process
  const validCategories = (DISCOVERY_CATEGORIES as readonly string[]).slice();
  const targetCategories: string[] =
    Array.isArray(requestedCategories) && requestedCategories.length > 0
      ? requestedCategories.filter((c) => validCategories.includes(c))
      : validCategories;

  if (targetCategories.length === 0) {
    return NextResponse.json(
      {
        error: {
          message: `No valid categories specified. Valid categories: ${validCategories.join(", ")}`,
        },
      },
      { status: 400 }
    );
  }

  // Limit to MAX_CATEGORIES_PER_CALL to stay within Vercel timeout
  const categoriesToProcess = targetCategories.slice(0, MAX_CATEGORIES_PER_CALL);

  // Initialise Supabase service client (bypasses RLS)
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: { message: "Database not available — check SUPABASE_SERVICE_ROLE_KEY" } },
      { status: 503 }
    );
  }

  // Aggregate results
  const totals: StubInsertResult = {
    inserted: 0,
    skipped: 0,
    duplicates: 0,
    errors: 0,
  };
  const categoryBreakdown: Record<string, StubInsertResult> = {};
  const categoriesProcessed: string[] = [];

  // Process each category sequentially (avoid parallel Gemini hammering)
  for (const category of categoriesToProcess) {
    console.log(
      `[mass-seed] Processing category "${category}" (${variationCount} max variations)…`
    );

    try {
      // 1. Generate stub suggestions via Gemini
      const suggestions = await generateAllVariationsForCategory(
        category,
        variationCount
      );

      if (suggestions.length === 0) {
        console.warn(`[mass-seed] No suggestions returned for "${category}"`);
        categoryBreakdown[category] = {
          inserted: 0,
          skipped: 0,
          duplicates: 0,
          errors: 0,
        };
        categoriesProcessed.push(category);
        continue;
      }

      // 2. Insert into DB
      const insertResult = await insertStubBatch(supabase, suggestions);

      categoryBreakdown[category] = insertResult;
      categoriesProcessed.push(category);

      totals.inserted += insertResult.inserted;
      totals.skipped += insertResult.skipped;
      totals.duplicates += insertResult.duplicates;
      totals.errors += insertResult.errors;

      console.log(
        `[mass-seed] "${category}" done — ` +
          `inserted=${insertResult.inserted} duplicates=${insertResult.duplicates} errors=${insertResult.errors}`
      );
    } catch (err) {
      console.error(`[mass-seed] Fatal error processing category "${category}":`, err);
      categoryBreakdown[category] = {
        inserted: 0,
        skipped: 0,
        duplicates: 0,
        errors: 1,
      };
      totals.errors += 1;
      categoriesProcessed.push(category);
    }
  }

  return NextResponse.json({
    data: {
      ...totals,
      categoriesProcessed,
      categoryBreakdown,
      remainingCategories: targetCategories.slice(MAX_CATEGORIES_PER_CALL),
    },
  });
}
