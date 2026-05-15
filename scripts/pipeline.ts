#!/usr/bin/env npx tsx
/**
 * VibeCheck One-Click Pipeline
 *
 * 전체 파이프라인을 한 번에 실행합니다:
 *   1. 환경 변수 검증
 *   2. 의존성 설치 (pnpm install)
 *   3. DB 마이그레이션 (Supabase SQL)
 *   4. Lint + 타입 체크
 *   5. 유닛 테스트
 *   6. 프로덕션 빌드
 *   7. 시드 크롤링 (선택)
 *   8. Vercel 배포 (선택)
 *
 * Usage:
 *   npx tsx scripts/pipeline.ts              # 풀 파이프라인
 *   npx tsx scripts/pipeline.ts --skip-seed  # 시드 크롤링 건너뛰기
 *   npx tsx scripts/pipeline.ts --skip-deploy # 배포 건너뛰기
 *   npx tsx scripts/pipeline.ts --seed-only  # 시드 크롤링만
 *   npx tsx scripts/pipeline.ts --deploy-only # 배포만
 *   npx tsx scripts/pipeline.ts --check      # 환경만 체크
 *   npx tsx scripts/pipeline.ts --migrate    # 마이그레이션만
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { execSync, type ExecSyncOptions } from "child_process";
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// ─── Constants ───────────────────────────────────────────────

const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");

config({ path: ENV_PATH });

const EXEC_OPTS: ExecSyncOptions = {
  cwd: ROOT,
  stdio: "pipe",
  encoding: "utf-8" as BufferEncoding,
};

const EXEC_OPTS_INHERIT: ExecSyncOptions = {
  cwd: ROOT,
  stdio: "inherit",
};

// ─── CLI Args ────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const SKIP_SEED = args.has("--skip-seed");
const SKIP_DEPLOY = args.has("--skip-deploy");
const SEED_ONLY = args.has("--seed-only");
const DEPLOY_ONLY = args.has("--deploy-only");
const CHECK_ONLY = args.has("--check");
const MIGRATE_ONLY = args.has("--migrate");

// ─── Logging ─────────────────────────────────────────────────

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function header(text: string) {
  console.log(`\n${CYAN}${BOLD}${"=".repeat(60)}${RESET}`);
  console.log(`${CYAN}${BOLD}  ${text}${RESET}`);
  console.log(`${CYAN}${BOLD}${"=".repeat(60)}${RESET}\n`);
}

function step(num: number, total: number, text: string) {
  console.log(`${YELLOW}${BOLD}[${num}/${total}]${RESET} ${text}`);
}

function ok(text: string) {
  console.log(`  ${GREEN}OK${RESET} ${text}`);
}

function fail(text: string) {
  console.log(`  ${RED}FAIL${RESET} ${text}`);
}

function warn(text: string) {
  console.log(`  ${YELLOW}WARN${RESET} ${text}`);
}

function info(text: string) {
  console.log(`  ${DIM}${text}${RESET}`);
}

// ─── Step 1: Environment Validation ──────────────────────────

interface EnvCheck {
  key: string;
  required: boolean;
  label: string;
}

const ENV_CHECKS: EnvCheck[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true, label: "Supabase URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, label: "Supabase Anon Key" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, label: "Supabase Service Role Key" },
  { key: "GOOGLE_API_KEY", required: true, label: "Google API Key (Gemini)" },
  { key: "RAPIDAPI_KEY", required: true, label: "RapidAPI Key (Instagram/TikTok)" },
  { key: "OPENAI_API_KEY", required: false, label: "OpenAI API Key (optional fallback)" },
  { key: "NEXT_PUBLIC_APP_URL", required: false, label: "App URL (OAuth)" },
];

function checkEnv(): boolean {
  step(1, 8, "Checking environment variables...");

  if (!existsSync(ENV_PATH)) {
    fail(`.env.local not found at ${ENV_PATH}`);
    info("Run: cp .env.local.example .env.local && edit");
    return false;
  }

  let allGood = true;

  for (const check of ENV_CHECKS) {
    const value = process.env[check.key];
    if (value && value !== `your-${check.key.toLowerCase().replace(/_/g, "-")}`) {
      ok(`${check.label}`);
    } else if (check.required) {
      fail(`${check.label} (${check.key})`);
      allGood = false;
    } else {
      warn(`${check.label} (${check.key}) — not set`);
    }
  }

  return allGood;
}

// ─── Step 2: Dependencies ────────────────────────────────────

function installDeps(): boolean {
  step(2, 8, "Installing dependencies (pnpm)...");
  try {
    execSync("pnpm install --frozen-lockfile 2>&1", { ...EXEC_OPTS, encoding: "utf-8" });
    ok("Dependencies installed");
    return true;
  } catch {
    // Retry without frozen lockfile
    try {
      execSync("pnpm install 2>&1", { ...EXEC_OPTS, encoding: "utf-8" });
      ok("Dependencies installed (lockfile updated)");
      return true;
    } catch (e: any) {
      fail(`pnpm install failed: ${e.message?.slice(0, 200)}`);
      return false;
    }
  }
}

// ─── Step 3: DB Migration ────────────────────────────────────

async function runMigrations(): Promise<boolean> {
  step(3, 8, "Running database migrations...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    fail("Supabase credentials missing");
    return false;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check connection
  const { error: connError } = await supabase.from("influencers").select("id").limit(1);

  // If table doesn't exist, run migrations
  const needsMigration = connError?.message?.includes("does not exist") ||
    connError?.message?.includes("relation") ||
    connError?.code === "42P01";

  if (!connError) {
    // Tables exist — check if all migrations have been applied by checking for campaigns table
    const { error: campaignError } = await supabase.from("campaigns").select("id").limit(1);
    if (!campaignError) {
      ok("Database already migrated (all tables exist)");
      return true;
    }
    // Some tables missing, need partial migration
    warn("Some tables missing, running migrations...");
  } else if (!needsMigration) {
    // Connection error
    fail(`Database connection error: ${connError.message}`);
    return false;
  }

  // Read and execute migrations
  if (!existsSync(MIGRATIONS_DIR)) {
    fail(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    return false;
  }

  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  info(`Found ${migrationFiles.length} migration files`);

  let successCount = 0;
  let skipCount = 0;

  for (const file of migrationFiles) {
    const sql = readFileSync(resolve(MIGRATIONS_DIR, file), "utf-8");

    try {
      const { error } = await supabase.rpc("exec_sql", { sql_string: sql });

      if (error) {
        // Try direct execution via REST API
        const restResult = await executeSqlViaRest(supabaseUrl, serviceKey, sql);

        if (restResult.success) {
          successCount++;
          ok(`${file}`);
        } else if (
          restResult.error?.includes("already exists") ||
          restResult.error?.includes("duplicate")
        ) {
          skipCount++;
          info(`${file} (already applied)`);
        } else {
          warn(`${file}: ${restResult.error?.slice(0, 100)}`);
          // Continue anyway — migrations are idempotent with IF NOT EXISTS
          skipCount++;
        }
      } else {
        successCount++;
        ok(`${file}`);
      }
    } catch (e: any) {
      warn(`${file}: ${e.message?.slice(0, 100)}`);
      skipCount++;
    }
  }

  info(`Applied: ${successCount}, Skipped: ${skipCount}`);

  // Verify final state
  const { error: verifyError } = await supabase.from("influencers").select("id").limit(1);
  if (verifyError) {
    fail(`Migration verification failed: ${verifyError.message}`);
    return false;
  }

  ok("Database ready");
  return true;
}

async function executeSqlViaRest(
  supabaseUrl: string,
  serviceKey: string,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ sql_string: sql }),
    });

    if (response.ok) return { success: true };

    // If exec_sql doesn't exist, try pg_catalog approach
    // For now, mark as "needs manual application"
    const body = await response.text();
    return { success: false, error: body.slice(0, 200) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Step 4: Lint ────────────────────────────────────────────

function runLint(): boolean {
  step(4, 8, "Running lint...");
  try {
    execSync("pnpm lint 2>&1", { ...EXEC_OPTS, encoding: "utf-8" });
    ok("Lint passed");
    return true;
  } catch (e: any) {
    const output = e.stdout?.toString() || e.stderr?.toString() || "";
    if (output.includes("warning") && !output.includes("error")) {
      warn("Lint passed with warnings");
      return true;
    }
    fail("Lint failed");
    info(output.slice(0, 300));
    return false;
  }
}

// ─── Step 5: Tests ───────────────────────────────────────────

function runTests(): boolean {
  step(5, 8, "Running tests...");
  try {
    const output = execSync("pnpm test 2>&1", { ...EXEC_OPTS, encoding: "utf-8" }) as string;
    const match = output.match(/Tests\s+(\d+)\s+passed/);
    const count = match ? match[1] : "?";
    ok(`${count} tests passed`);
    return true;
  } catch (e: any) {
    fail("Tests failed");
    const output = (e.stdout?.toString() || e.stderr?.toString() || "").slice(-500);
    info(output);
    return false;
  }
}

// ─── Step 6: Build ───────────────────────────────────────────

function runBuild(): boolean {
  step(6, 8, "Building for production...");
  try {
    execSync("pnpm build 2>&1", { ...EXEC_OPTS, encoding: "utf-8" });
    ok("Production build succeeded");
    return true;
  } catch (e: any) {
    fail("Build failed");
    const output = (e.stdout?.toString() || e.stderr?.toString() || "").slice(-500);
    info(output);
    return false;
  }
}

// ─── Step 7: Seed Crawler ────────────────────────────────────

async function runSeedCrawler(): Promise<boolean> {
  step(7, 8, "Running seed crawler...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    fail("Supabase credentials missing");
    return false;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check current DB count
  const { count } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true })
    .not("vibe_score", "is", null);

  const analyzedCount = count ?? 0;
  info(`Current analyzed influencers in DB: ${analyzedCount}`);

  if (analyzedCount >= 20) {
    ok(`Already have ${analyzedCount} analyzed influencers — skipping seed`);
    return true;
  }

  info("Running seed crawler (this takes 10-30 minutes)...");
  info("Category: Fashion (quickest to validate)");

  try {
    execSync(
      "npx tsx scripts/seed-crawler.ts --category Fashion 2>&1",
      { ...EXEC_OPTS_INHERIT, timeout: 30 * 60 * 1000 }
    );
    ok("Seed crawling complete");
    return true;
  } catch (e: any) {
    warn("Seed crawling had errors (partial data may have been saved)");
    return true; // Non-fatal — partial seed is still useful
  }
}

// ─── Step 8: Deploy ──────────────────────────────────────────

function runDeploy(): boolean {
  step(8, 8, "Deploying to Vercel...");

  // Check vercel CLI
  try {
    execSync("which vercel 2>&1", { ...EXEC_OPTS, encoding: "utf-8" });
  } catch {
    fail("Vercel CLI not installed. Run: pnpm add -g vercel");
    return false;
  }

  try {
    const output = execSync("vercel --prod --yes 2>&1", { ...EXEC_OPTS, encoding: "utf-8" }) as string;
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (urlMatch) {
      ok(`Deployed to ${urlMatch[0]}`);
    } else {
      ok("Deployed successfully");
    }
    return true;
  } catch (e: any) {
    fail("Deploy failed");
    const output = (e.stdout?.toString() || e.stderr?.toString() || "").slice(-300);
    info(output);
    return false;
  }
}

// ─── Main Pipeline ───────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  header("VibeCheck One-Click Pipeline");

  // ── Check-only mode ──
  if (CHECK_ONLY) {
    const envOk = checkEnv();
    console.log(`\n${envOk ? GREEN : RED}Environment: ${envOk ? "READY" : "NOT READY"}${RESET}\n`);
    process.exit(envOk ? 0 : 1);
  }

  // ── Migrate-only mode ──
  if (MIGRATE_ONLY) {
    const envOk = checkEnv();
    if (!envOk) process.exit(1);
    const migOk = await runMigrations();
    process.exit(migOk ? 0 : 1);
  }

  // ── Seed-only mode ──
  if (SEED_ONLY) {
    const envOk = checkEnv();
    if (!envOk) process.exit(1);
    const seedOk = await runSeedCrawler();
    process.exit(seedOk ? 0 : 1);
  }

  // ── Deploy-only mode ──
  if (DEPLOY_ONLY) {
    const deployOk = runDeploy();
    process.exit(deployOk ? 0 : 1);
  }

  // ── Full pipeline ──
  const results: Array<{ step: string; ok: boolean }> = [];

  // Step 1: Env check
  const envOk = checkEnv();
  results.push({ step: "Environment", ok: envOk });
  if (!envOk) {
    printSummary(results, startTime);
    process.exit(1);
  }

  // Step 2: Dependencies
  const depsOk = installDeps();
  results.push({ step: "Dependencies", ok: depsOk });
  if (!depsOk) {
    printSummary(results, startTime);
    process.exit(1);
  }

  // Step 3: Migrations
  const migOk = await runMigrations();
  results.push({ step: "Migrations", ok: migOk });
  if (!migOk) {
    warn("Migration issues — continuing (tables may already exist)");
  }

  // Step 4: Lint
  const lintOk = runLint();
  results.push({ step: "Lint", ok: lintOk });

  // Step 5: Tests
  const testOk = runTests();
  results.push({ step: "Tests", ok: testOk });
  if (!testOk) {
    printSummary(results, startTime);
    process.exit(1);
  }

  // Step 6: Build
  const buildOk = runBuild();
  results.push({ step: "Build", ok: buildOk });
  if (!buildOk) {
    printSummary(results, startTime);
    process.exit(1);
  }

  // Step 7: Seed (optional)
  if (SKIP_SEED) {
    info("Seed crawling skipped (--skip-seed)");
    results.push({ step: "Seed", ok: true });
  } else {
    const seedOk = await runSeedCrawler();
    results.push({ step: "Seed", ok: seedOk });
  }

  // Step 8: Deploy (optional)
  if (SKIP_DEPLOY) {
    info("Deploy skipped (--skip-deploy)");
    results.push({ step: "Deploy", ok: true });
  } else {
    const deployOk = runDeploy();
    results.push({ step: "Deploy", ok: deployOk });
  }

  printSummary(results, startTime);

  const allPassed = results.every((r) => r.ok);
  process.exit(allPassed ? 0 : 1);
}

function printSummary(
  results: Array<{ step: string; ok: boolean }>,
  startTime: number
) {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  header("Pipeline Summary");

  for (const r of results) {
    const icon = r.ok ? `${GREEN}OK${RESET}` : `${RED}FAIL${RESET}`;
    console.log(`  ${icon}  ${r.step}`);
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log(`\n  ${DIM}Time: ${timeStr}${RESET}`);
  console.log(
    `  ${allPassed ? GREEN : RED}${BOLD}${passed}/${total} steps passed${RESET}\n`
  );

  if (allPassed) {
    console.log(`  ${GREEN}${BOLD}Pipeline complete!${RESET}\n`);
  }
}

main().catch((error) => {
  console.error(`\n${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});
