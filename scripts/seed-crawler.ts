/**
 * Seed Data Crawler
 *
 * Crawls a predefined list of influencer handles, analyzes them
 * via the AI scoring engine, and stores results in the database.
 *
 * Usage:
 *   npx tsx scripts/seed-crawler.ts
 *
 * Prerequisites:
 *   - Supabase project configured with migrations applied
 *   - OPENAI_API_KEY set (or will use mock data)
 *   - SUPABASE_SERVICE_ROLE_KEY set for DB writes
 */

const SEED_HANDLES: { handle: string; platform: "instagram" | "tiktok"; category: string }[] = [
  // Fashion
  { handle: "stylenanda_official", platform: "instagram", category: "Fashion" },
  { handle: "aimee_song", platform: "instagram", category: "Fashion" },
  { handle: "songofstyle", platform: "instagram", category: "Fashion" },
  { handle: "chiaraferragni", platform: "instagram", category: "Fashion" },
  { handle: "neloongmatch", platform: "instagram", category: "Fashion" },
  { handle: "hwaahwaaa", platform: "instagram", category: "Fashion" },
  { handle: "__soyeon", platform: "instagram", category: "Fashion" },
  { handle: "jiiinlog", platform: "instagram", category: "Fashion" },
  { handle: "hi_batz", platform: "instagram", category: "Fashion" },
  { handle: "mina_skim", platform: "instagram", category: "Fashion" },

  // Beauty
  { handle: "pfrankmd", platform: "instagram", category: "Beauty" },
  { handle: "makeupbyariel", platform: "instagram", category: "Beauty" },
  { handle: "dain.kr", platform: "instagram", category: "Beauty" },
  { handle: "risabae_art", platform: "instagram", category: "Beauty" },
  { handle: "lamuqe", platform: "instagram", category: "Beauty" },
  { handle: "heizle_", platform: "instagram", category: "Beauty" },
  { handle: "beauty_jjang", platform: "instagram", category: "Beauty" },
  { handle: "ssinnim", platform: "instagram", category: "Beauty" },

  // Lifestyle
  { handle: "kinfolk", platform: "instagram", category: "Lifestyle" },
  { handle: "aesop", platform: "instagram", category: "Lifestyle" },
  { handle: "muji_global", platform: "instagram", category: "Lifestyle" },
  { handle: "thefutureis", platform: "instagram", category: "Lifestyle" },
  { handle: "oneday_onedish", platform: "instagram", category: "Lifestyle" },
  { handle: "dailyjoo_", platform: "instagram", category: "Lifestyle" },
  { handle: "morningcalm_kr", platform: "instagram", category: "Lifestyle" },

  // Travel
  { handle: "doyoutravel", platform: "instagram", category: "Travel" },
  { handle: "muradosmann", platform: "instagram", category: "Travel" },
  { handle: "chris_burkard", platform: "instagram", category: "Travel" },
  { handle: "travelin_kr", platform: "instagram", category: "Travel" },
  { handle: "jeju_traveler", platform: "instagram", category: "Travel" },

  // Art & Design
  { handle: "designmilk", platform: "instagram", category: "Art" },
  { handle: "abstractsunday", platform: "instagram", category: "Art" },
  { handle: "pantone", platform: "instagram", category: "Art" },
  { handle: "designboom", platform: "instagram", category: "Art" },
  { handle: "typography_kr", platform: "instagram", category: "Art" },

  // Food
  { handle: "buzzfeedtasty", platform: "instagram", category: "Food" },
  { handle: "minimalistbaker", platform: "instagram", category: "Food" },
  { handle: "seoul_eats", platform: "instagram", category: "Food" },
  { handle: "cafetour_kr", platform: "instagram", category: "Food" },
  { handle: "tteokbokki_love", platform: "instagram", category: "Food" },

  // TikTok creators
  { handle: "charlidamelio", platform: "tiktok", category: "Dance" },
  { handle: "addisonre", platform: "tiktok", category: "Lifestyle" },
  { handle: "bellapoarch", platform: "tiktok", category: "Music" },
  { handle: "korean_unnie", platform: "tiktok", category: "Fashion" },
  { handle: "seoul_vibes", platform: "tiktok", category: "Travel" },
  { handle: "kbeauty_daily", platform: "tiktok", category: "Beauty" },
  { handle: "cafe_hopper_kr", platform: "tiktok", category: "Food" },
  { handle: "design_daily_kr", platform: "tiktok", category: "Art" },
  { handle: "fashion_kr_tok", platform: "tiktok", category: "Fashion" },
  { handle: "lifestyle_mina", platform: "tiktok", category: "Lifestyle" },
];

interface CrawlResult {
  handle: string;
  platform: string;
  status: "success" | "error";
  score?: number;
  error?: string;
}

async function crawlHandle(
  entry: (typeof SEED_HANDLES)[0],
  baseUrl: string
): Promise<CrawlResult> {
  try {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: entry.handle,
        platform: entry.platform,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        handle: entry.handle,
        platform: entry.platform,
        status: "error",
        error: json.error?.message ?? "Unknown error",
      };
    }

    return {
      handle: entry.handle,
      platform: entry.platform,
      status: "success",
      score: json.data?.scores?.overall,
    };
  } catch (error) {
    return {
      handle: entry.handle,
      platform: entry.platform,
      status: "error",
      error: String(error),
    };
  }
}

async function main() {
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const concurrency = 3;
  const results: CrawlResult[] = [];
  let successCount = 0;
  let errorCount = 0;

  console.log(`🌱 VibeCheck Seed Crawler`);
  console.log(`📍 Target: ${baseUrl}`);
  console.log(`📊 Handles: ${SEED_HANDLES.length}`);
  console.log(`⚡ Concurrency: ${concurrency}`);
  console.log(`---`);

  // Process in batches
  for (let i = 0; i < SEED_HANDLES.length; i += concurrency) {
    const batch = SEED_HANDLES.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((entry) => crawlHandle(entry, baseUrl))
    );

    for (const result of batchResults) {
      results.push(result);
      if (result.status === "success") {
        successCount++;
        console.log(
          `✅ [${successCount + errorCount}/${SEED_HANDLES.length}] @${result.handle} — Score: ${result.score}`
        );
      } else {
        errorCount++;
        console.log(
          `❌ [${successCount + errorCount}/${SEED_HANDLES.length}] @${result.handle} — ${result.error}`
        );
      }
    }

    // Rate limiting: wait between batches
    if (i + concurrency < SEED_HANDLES.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(`\n---`);
  console.log(`🏁 Crawl Complete`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total: ${SEED_HANDLES.length}`);

  // Category breakdown
  const categories = new Map<string, number>();
  for (const result of results) {
    if (result.status === "success") {
      const entry = SEED_HANDLES.find(
        (h) => h.handle === result.handle && h.platform === result.platform
      );
      if (entry) {
        categories.set(
          entry.category,
          (categories.get(entry.category) ?? 0) + 1
        );
      }
    }
  }

  console.log(`\n📂 By Category:`);
  for (const [category, count] of categories.entries()) {
    console.log(`   ${category}: ${count}`);
  }
}

main().catch(console.error);
