/**
 * Usage Tracker
 *
 * Tracks and enforces Free/Pro tier limits.
 * Free tier: 3 analyses/month, 1 brand, 1 outreach/month, 1 PDF/month.
 * Pro tier: unlimited (currently everyone is Free since no payment integration).
 */

import { type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export const FREE_LIMITS = {
  analysis: 3,
  brand: 1,
  outreach: 1,
  pdf: 1,
  recommendationVisible: 3,
} as const;

type UsageType = "analysis_count" | "outreach_count" | "pdf_count";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface UsageRow {
  analysis_count: number;
  outreach_count: number;
  pdf_count: number;
}

/**
 * Get current month's usage for a user.
 */
export async function getUsage(
  client: Client,
  userId: string
): Promise<UsageRow> {
  const month = getCurrentMonth();

  const { data } = await client
    .from("user_usage")
    .select("analysis_count, outreach_count, pdf_count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  return {
    analysis_count: data?.analysis_count ?? 0,
    outreach_count: data?.outreach_count ?? 0,
    pdf_count: data?.pdf_count ?? 0,
  };
}

/**
 * Increment a usage counter. Returns the new count.
 */
export async function incrementUsage(
  client: Client,
  userId: string,
  type: UsageType
): Promise<number> {
  const month = getCurrentMonth();

  // Upsert: create row if not exists, then increment
  const { data: existing } = await client
    .from("user_usage")
    .select("analysis_count, outreach_count, pdf_count")
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  const row = existing as UsageRow | null;
  const currentCount = row?.[type] ?? 0;
  const newCount = currentCount + 1;

  await client.from("user_usage").upsert(
    {
      user_id: userId,
      month,
      [type]: newCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,month" }
  );

  return newCount;
}

/**
 * Check if a user can perform an action (Free tier limit check).
 * Returns { allowed: true } or { allowed: false, limit, current }.
 */
export async function checkLimit(
  client: Client,
  userId: string,
  action: "analysis" | "outreach" | "pdf"
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const usage = await getUsage(client, userId);
  const typeMap: Record<string, UsageType> = {
    analysis: "analysis_count",
    outreach: "outreach_count",
    pdf: "pdf_count",
  };
  const current = usage[typeMap[action]];
  const limit = FREE_LIMITS[action];

  return {
    allowed: current < limit,
    limit,
    current,
  };
}

/**
 * Check if a user can create another brand (Free: 1 brand max).
 */
export async function checkBrandLimit(
  client: Client,
  userId: string
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const { count } = await client
    .from("brand_profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const current = count ?? 0;
  return {
    allowed: current < FREE_LIMITS.brand,
    limit: FREE_LIMITS.brand,
    current,
  };
}
