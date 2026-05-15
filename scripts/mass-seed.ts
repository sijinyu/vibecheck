/**
 * Mass Seeding Script
 *
 * 로컬에서 직접 실행: npx tsx scripts/mass-seed.ts
 *
 * 20개 카테고리 × 10 variations = 약 3,000 핸들 (1회 실행)
 * 여러번 실행해서 중복 제거 후 누적으로 15,000~20,000 달성
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!GOOGLE_API_KEY) {
  console.error("Missing GOOGLE_API_KEY");
  process.exit(1);
}

// Make env available for the library modules
process.env.GOOGLE_API_KEY = GOOGLE_API_KEY;

import { generateAllVariationsForCategory } from "../src/lib/discovery/mass-stub-generator";
import { insertStubBatch } from "../src/lib/discovery/stub-inserter";

const ALL_CATEGORIES = [
  "Fashion", "Beauty", "Food", "Fitness", "Travel",
  "Lifestyle", "Tech", "Art", "Music", "Parenting",
  "Pets", "Home", "Education", "Entertainment",
  "Wellness", "Health", "Finance", "Gaming", "Sports", "Photography",
];

const VARIATIONS_PER_CATEGORY = parseInt(process.argv[2] || "10", 10);

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check current count
  const { count: beforeCount } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true });

  console.log(`\n📊 현재 DB 인플루언서 수: ${beforeCount ?? 0}`);
  console.log(`📋 처리할 카테고리: ${ALL_CATEGORIES.length}개`);
  console.log(`🔄 카테고리당 variations: ${VARIATIONS_PER_CATEGORY}`);
  console.log(`⏱️  시작합니다...\n`);

  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (let i = 0; i < ALL_CATEGORIES.length; i++) {
    const category = ALL_CATEGORIES[i];
    const progress = `[${i + 1}/${ALL_CATEGORIES.length}]`;

    console.log(`${progress} 🏷️  ${category} 시작...`);

    try {
      const suggestions = await generateAllVariationsForCategory(
        category,
        VARIATIONS_PER_CATEGORY
      );

      if (suggestions.length === 0) {
        console.log(`${progress} ⚠️  ${category}: 제안 없음, 스킵`);
        continue;
      }

      console.log(`${progress} 📝 ${category}: ${suggestions.length}개 핸들 생성, DB 삽입 중...`);

      const result = await insertStubBatch(supabase, suggestions);

      totalInserted += result.inserted;
      totalDuplicates += result.duplicates;
      totalErrors += result.errors;

      console.log(
        `${progress} ✅ ${category}: inserted=${result.inserted} duplicates=${result.duplicates} errors=${result.errors}`
      );
    } catch (err) {
      console.error(`${progress} ❌ ${category} 실패:`, err);
      totalErrors++;
    }
  }

  // Final count
  const { count: afterCount } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true });

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 시딩 완료!`);
  console.log(`   삽입: ${totalInserted}`);
  console.log(`   중복 스킵: ${totalDuplicates}`);
  console.log(`   에러: ${totalErrors}`);
  console.log(`   DB 전체: ${beforeCount ?? 0} → ${afterCount ?? 0} (${(afterCount ?? 0) - (beforeCount ?? 0)} 증가)`);
  console.log(`${"=".repeat(50)}\n`);
}

main().catch(console.error);
