/**
 * API Budget Manager
 *
 * RapidAPI 월간 호출 예산을 관리하여 비용 통제.
 * Supabase api_usage_log 테이블에 월별 카운트를 저장.
 *
 * 스마트 월간 배분:
 * - 월초 (1-10일): 공격적 — 신규 40%, 업그레이드 30%, 갱신 10%, 온디맨드 20%
 * - 월중 (11-20일): 균형 — 신규 25%, 업그레이드 25%, 갱신 15%, 온디맨드 35%
 * - 월말 (21-31일): 보수적 — 신규 10%, 업그레이드 20%, 갱신 10%, 온디맨드 60%
 */

import { type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

const MONTHLY_BUDGET = parseInt(process.env.RAPIDAPI_MONTHLY_BUDGET ?? "500", 10);

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getApiUsage(client: Client): Promise<number> {
  const month = getCurrentMonth();

  const { data } = await client
    .from("api_usage_log")
    .select("call_count")
    .eq("month", month)
    .maybeSingle();

  return data?.call_count ?? 0;
}

export async function incrementApiUsage(client: Client, count = 1): Promise<number> {
  const month = getCurrentMonth();

  // Upsert: insert or increment
  const { data: existing } = await client
    .from("api_usage_log")
    .select("call_count")
    .eq("month", month)
    .maybeSingle();

  const newCount = (existing?.call_count ?? 0) + count;

  await client
    .from("api_usage_log")
    .upsert(
      {
        month,
        call_count: newCount,
        last_updated_at: new Date().toISOString(),
      },
      { onConflict: "month" }
    );

  return newCount;
}

export async function canMakeApiCall(client: Client, callsNeeded = 1): Promise<boolean> {
  const currentUsage = await getApiUsage(client);
  return currentUsage + callsNeeded <= MONTHLY_BUDGET;
}

export function getMonthlyBudget(): number {
  return MONTHLY_BUDGET;
}

// ─── Smart Monthly Allocation ────────────────────────────────────

export type BudgetCategory = "new_discovery" | "upgrade" | "refresh" | "on_demand";

interface BudgetAllocation {
  new_discovery: number;
  upgrade: number;
  refresh: number;
  on_demand: number;
}

/**
 * Get smart budget allocation based on day of month.
 * Returns remaining calls available per category.
 */
export async function getSmartAllocation(client: Client): Promise<BudgetAllocation> {
  const currentUsage = await getApiUsage(client);
  const remaining = Math.max(0, MONTHLY_BUDGET - currentUsage);
  const dayOfMonth = new Date().getDate();

  let ratios: BudgetAllocation;

  if (dayOfMonth <= 10) {
    // 월초: 공격적
    ratios = { new_discovery: 0.4, upgrade: 0.3, refresh: 0.1, on_demand: 0.2 };
  } else if (dayOfMonth <= 20) {
    // 월중: 균형
    ratios = { new_discovery: 0.25, upgrade: 0.25, refresh: 0.15, on_demand: 0.35 };
  } else {
    // 월말: 보수적
    ratios = { new_discovery: 0.1, upgrade: 0.2, refresh: 0.1, on_demand: 0.6 };
  }

  return {
    new_discovery: Math.floor(remaining * ratios.new_discovery),
    upgrade: Math.floor(remaining * ratios.upgrade),
    refresh: Math.floor(remaining * ratios.refresh),
    on_demand: Math.floor(remaining * ratios.on_demand),
  };
}

/**
 * Check if a specific budget category has calls remaining.
 */
export async function canMakeCallInCategory(
  client: Client,
  category: BudgetCategory,
  callsNeeded = 1
): Promise<boolean> {
  const allocation = await getSmartAllocation(client);
  return allocation[category] >= callsNeeded;
}
