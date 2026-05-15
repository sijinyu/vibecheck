/**
 * Influencer Pre-Seed System
 *
 * 카테고리별 인기 인플루언서 시드 리스트.
 * 관리자 API로 배치 분석하여 DB에 사전 저장 → 브랜드 등록 즉시 추천 가능.
 */

export interface SeedInfluencer {
  handle: string;
  platform: "instagram" | "tiktok";
  category: string;
}

/**
 * 카테고리별 시드 인플루언서 리스트
 * 각 카테고리 × 플랫폼 최소 20명
 */
export const SEED_INFLUENCERS: SeedInfluencer[] = [
  // ─── Fashion (Instagram) ──────────────────────────
  { handle: "stylenanda_korea", platform: "instagram", category: "Fashion" },
  { handle: "imvely_official", platform: "instagram", category: "Fashion" },
  { handle: "chuu_official", platform: "instagram", category: "Fashion" },
  { handle: "minsco__", platform: "instagram", category: "Fashion" },
  { handle: "hyunah_aa", platform: "instagram", category: "Fashion" },
  { handle: "sooyaaa__", platform: "instagram", category: "Fashion" },
  { handle: "roses_are_rosie", platform: "instagram", category: "Fashion" },
  { handle: "jennierubyjane", platform: "instagram", category: "Fashion" },
  { handle: "dlwlrma", platform: "instagram", category: "Fashion" },
  { handle: "dear.zia", platform: "instagram", category: "Fashion" },
  { handle: "ssun.zzi", platform: "instagram", category: "Fashion" },
  { handle: "mo.onbyul", platform: "instagram", category: "Fashion" },
  { handle: "seojuhyun_s", platform: "instagram", category: "Fashion" },
  { handle: "jy_as_jy", platform: "instagram", category: "Fashion" },
  { handle: "heizle_official", platform: "instagram", category: "Fashion" },
  { handle: "_imyour_joy", platform: "instagram", category: "Fashion" },
  { handle: "lalalalisa_m", platform: "instagram", category: "Fashion" },
  { handle: "midnatt_korea", platform: "instagram", category: "Fashion" },
  { handle: "gentle_monster", platform: "instagram", category: "Fashion" },
  { handle: "musinsastandard", platform: "instagram", category: "Fashion" },

  // ─── Beauty (Instagram) ──────────────────────────
  { handle: "pfrfrfr", platform: "instagram", category: "Beauty" },
  { handle: "sulwhasoo.official", platform: "instagram", category: "Beauty" },
  { handle: "laneige_kr", platform: "instagram", category: "Beauty" },
  { handle: "innisfreeofficial", platform: "instagram", category: "Beauty" },
  { handle: "etudeofficialpage", platform: "instagram", category: "Beauty" },
  { handle: "romaboromand", platform: "instagram", category: "Beauty" },
  { handle: "peripera_official", platform: "instagram", category: "Beauty" },
  { handle: "tirtir_official", platform: "instagram", category: "Beauty" },
  { handle: "cosrx_official", platform: "instagram", category: "Beauty" },
  { handle: "medicube_global", platform: "instagram", category: "Beauty" },
  { handle: "dear.dahlia", platform: "instagram", category: "Beauty" },
  { handle: "hince_official", platform: "instagram", category: "Beauty" },
  { handle: "tamburins_official", platform: "instagram", category: "Beauty" },
  { handle: "vt_cosmetics", platform: "instagram", category: "Beauty" },
  { handle: "apieu_cosmetics", platform: "instagram", category: "Beauty" },
  { handle: "isntree_official", platform: "instagram", category: "Beauty" },
  { handle: "roundaround_kr", platform: "instagram", category: "Beauty" },
  { handle: "amuse.official", platform: "instagram", category: "Beauty" },
  { handle: "moonshot_korea", platform: "instagram", category: "Beauty" },
  { handle: "nuse_official", platform: "instagram", category: "Beauty" },

  // ─── Food (Instagram) ──────────────────────────
  { handle: "seonkyounglongest", platform: "instagram", category: "Food" },
  { handle: "baek_jongwon", platform: "instagram", category: "Food" },
  { handle: "mingkeun_", platform: "instagram", category: "Food" },
  { handle: "yummyboy_k", platform: "instagram", category: "Food" },
  { handle: "seoul_eats", platform: "instagram", category: "Food" },
  { handle: "korea_dessert", platform: "instagram", category: "Food" },
  { handle: "cafetour_seoul", platform: "instagram", category: "Food" },
  { handle: "daily_food_diary", platform: "instagram", category: "Food" },
  { handle: "foodie_couple_kr", platform: "instagram", category: "Food" },
  { handle: "homecafe_recipe", platform: "instagram", category: "Food" },
  { handle: "seoulcafe_official", platform: "instagram", category: "Food" },
  { handle: "vegandaily_kr", platform: "instagram", category: "Food" },
  { handle: "coupang_eats", platform: "instagram", category: "Food" },
  { handle: "baemin_official", platform: "instagram", category: "Food" },
  { handle: "starbuckskorea", platform: "instagram", category: "Food" },
  { handle: "ediyacoffee", platform: "instagram", category: "Food" },
  { handle: "paik_jongwon", platform: "instagram", category: "Food" },
  { handle: "cookingwithdog_kr", platform: "instagram", category: "Food" },
  { handle: "matjib_roadmap", platform: "instagram", category: "Food" },
  { handle: "bread_of_seoul", platform: "instagram", category: "Food" },

  // ─── Fitness (Instagram) ──────────────────────────
  { handle: "fitnesskorea_", platform: "instagram", category: "Fitness" },
  { handle: "bodyprofiler", platform: "instagram", category: "Fitness" },
  { handle: "yogagirl_kr", platform: "instagram", category: "Fitness" },
  { handle: "pilates_daily", platform: "instagram", category: "Fitness" },
  { handle: "crossfit_seoul", platform: "instagram", category: "Fitness" },
  { handle: "running_crew_kr", platform: "instagram", category: "Fitness" },
  { handle: "healthyfood_fit", platform: "instagram", category: "Fitness" },
  { handle: "gym_motivation_kr", platform: "instagram", category: "Fitness" },
  { handle: "hometraining_kr", platform: "instagram", category: "Fitness" },
  { handle: "diet_recipe_kr", platform: "instagram", category: "Fitness" },
  { handle: "swimmer_daily", platform: "instagram", category: "Fitness" },
  { handle: "climbing_korea", platform: "instagram", category: "Fitness" },
  { handle: "boxing_fit_kr", platform: "instagram", category: "Fitness" },
  { handle: "stretching_daily", platform: "instagram", category: "Fitness" },
  { handle: "pt_trainer_kim", platform: "instagram", category: "Fitness" },
  { handle: "muscle_queen_kr", platform: "instagram", category: "Fitness" },
  { handle: "fitcouple_kr", platform: "instagram", category: "Fitness" },
  { handle: "morning_routine_fit", platform: "instagram", category: "Fitness" },
  { handle: "tennis_korea", platform: "instagram", category: "Fitness" },
  { handle: "golf_daily_kr", platform: "instagram", category: "Fitness" },

  // ─── Lifestyle (Instagram) ──────────────────────────
  { handle: "daily_vlog_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "minimalist_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "interior_daily", platform: "instagram", category: "Lifestyle" },
  { handle: "plantmom_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "bookstagram_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "traveldaily_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "petgram_daily", platform: "instagram", category: "Lifestyle" },
  { handle: "seoul_life_daily", platform: "instagram", category: "Lifestyle" },
  { handle: "couplelook_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "studygram_daily", platform: "instagram", category: "Lifestyle" },
  { handle: "artgallery_seoul", platform: "instagram", category: "Lifestyle" },
  { handle: "vintagestyle_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "morningcoffee_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "selfcare_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "cleanlife_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "dreamy_room", platform: "instagram", category: "Lifestyle" },
  { handle: "diy_craft_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "simple_living_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "organiclife_kr", platform: "instagram", category: "Lifestyle" },
  { handle: "weekendvibes_kr", platform: "instagram", category: "Lifestyle" },

  // ─── Fashion (TikTok) ──────────────────────────
  { handle: "ootd_daily_kr", platform: "tiktok", category: "Fashion" },
  { handle: "streetfashion_kr", platform: "tiktok", category: "Fashion" },
  { handle: "grwm_korea", platform: "tiktok", category: "Fashion" },
  { handle: "styling_tips_kr", platform: "tiktok", category: "Fashion" },
  { handle: "kfashion_trend", platform: "tiktok", category: "Fashion" },
  { handle: "thrifting_kr", platform: "tiktok", category: "Fashion" },
  { handle: "fashionhaul_kr", platform: "tiktok", category: "Fashion" },
  { handle: "lookbook_daily", platform: "tiktok", category: "Fashion" },
  { handle: "mensfashion_kr", platform: "tiktok", category: "Fashion" },
  { handle: "kpopstyle_", platform: "tiktok", category: "Fashion" },
  { handle: "vintage_kr", platform: "tiktok", category: "Fashion" },
  { handle: "outfit_inspo_kr", platform: "tiktok", category: "Fashion" },
  { handle: "capsulewardrobe_kr", platform: "tiktok", category: "Fashion" },
  { handle: "shoereview_kr", platform: "tiktok", category: "Fashion" },
  { handle: "accessory_kr", platform: "tiktok", category: "Fashion" },
  { handle: "luxuryfashion_kr", platform: "tiktok", category: "Fashion" },
  { handle: "springlook_kr", platform: "tiktok", category: "Fashion" },
  { handle: "workwear_kr", platform: "tiktok", category: "Fashion" },
  { handle: "casualstyle_kr", platform: "tiktok", category: "Fashion" },
  { handle: "trendalert_kr", platform: "tiktok", category: "Fashion" },

  // ─── Beauty (TikTok) ──────────────────────────
  { handle: "kbeauty_tips", platform: "tiktok", category: "Beauty" },
  { handle: "skincare_routine_kr", platform: "tiktok", category: "Beauty" },
  { handle: "makeup_tutorial_kr", platform: "tiktok", category: "Beauty" },
  { handle: "glassskin_kr", platform: "tiktok", category: "Beauty" },
  { handle: "beauty_dupes_kr", platform: "tiktok", category: "Beauty" },
  { handle: "haircare_kr", platform: "tiktok", category: "Beauty" },
  { handle: "nailart_kr", platform: "tiktok", category: "Beauty" },
  { handle: "perfume_review_kr", platform: "tiktok", category: "Beauty" },
  { handle: "cleanbeauty_kr", platform: "tiktok", category: "Beauty" },
  { handle: "idolmakeup_kr", platform: "tiktok", category: "Beauty" },
  { handle: "lipstick_swatches", platform: "tiktok", category: "Beauty" },
  { handle: "sunscreen_test_kr", platform: "tiktok", category: "Beauty" },
  { handle: "acneskin_kr", platform: "tiktok", category: "Beauty" },
  { handle: "drugstore_beauty_kr", platform: "tiktok", category: "Beauty" },
  { handle: "brow_tutorial_kr", platform: "tiktok", category: "Beauty" },
  { handle: "contour_queen_kr", platform: "tiktok", category: "Beauty" },
  { handle: "nightroutine_kr", platform: "tiktok", category: "Beauty" },
  { handle: "mask_review_kr", platform: "tiktok", category: "Beauty" },
  { handle: "dermatologist_kr", platform: "tiktok", category: "Beauty" },
  { handle: "beautyhaul_kr", platform: "tiktok", category: "Beauty" },

  // ─── Food (TikTok) ──────────────────────────
  { handle: "koreanfood_asmr", platform: "tiktok", category: "Food" },
  { handle: "streetfood_kr", platform: "tiktok", category: "Food" },
  { handle: "mukbang_daily", platform: "tiktok", category: "Food" },
  { handle: "cooking_hack_kr", platform: "tiktok", category: "Food" },
  { handle: "cafevlog_kr", platform: "tiktok", category: "Food" },
  { handle: "dessert_recipe_kr", platform: "tiktok", category: "Food" },
  { handle: "convenience_store_kr", platform: "tiktok", category: "Food" },
  { handle: "ramen_master_kr", platform: "tiktok", category: "Food" },
  { handle: "homecooking_kr", platform: "tiktok", category: "Food" },
  { handle: "foodreview_kr", platform: "tiktok", category: "Food" },
  { handle: "baking_kr", platform: "tiktok", category: "Food" },
  { handle: "bbq_korea", platform: "tiktok", category: "Food" },
  { handle: "soju_cocktail_kr", platform: "tiktok", category: "Food" },
  { handle: "healtheating_kr", platform: "tiktok", category: "Food" },
  { handle: "lunchbox_kr", platform: "tiktok", category: "Food" },
  { handle: "sushimaker_kr", platform: "tiktok", category: "Food" },
  { handle: "soupcooking_kr", platform: "tiktok", category: "Food" },
  { handle: "kimchi_daily", platform: "tiktok", category: "Food" },
  { handle: "brunofoods_kr", platform: "tiktok", category: "Food" },
  { handle: "coffeemaker_kr", platform: "tiktok", category: "Food" },
];

/** Get seed list filtered by category and/or platform */
export function getSeedsByFilter(options?: {
  category?: string;
  platform?: "instagram" | "tiktok";
}): SeedInfluencer[] {
  let filtered = SEED_INFLUENCERS;

  if (options?.category) {
    filtered = filtered.filter((s) => s.category === options.category);
  }
  if (options?.platform) {
    filtered = filtered.filter((s) => s.platform === options.platform);
  }

  return filtered;
}

/** Get all unique categories */
export function getSeedCategories(): string[] {
  return [...new Set(SEED_INFLUENCERS.map((s) => s.category))];
}
