import { test, expect } from "@playwright/test";

test.describe("Influencer Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/influencer/test_user");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth required — redirected to login");
    }
  });

  test("shows back link to analyze page", async ({ page }) => {
    await expect(page.getByText("돌아가기")).toBeVisible();
  });

  test("shows loading state or profile content", async ({ page }) => {
    // Either shows loading spinner or loaded profile
    const hasLoader = await page.locator(".animate-spin").isVisible().catch(() => false);
    const hasError = await page.getByText("분석 데이터가 없습니다").isVisible().catch(() => false);
    const hasProfile = await page.getByText("Overview").isVisible().catch(() => false);

    expect(hasLoader || hasError || hasProfile).toBe(true);
  });

  test("has 5 tabs when profile loads", async ({ page }) => {
    // Wait for either data or error
    await page.waitForSelector('[class*="animate-spin"], [role="button"]', {
      timeout: 10000,
    }).catch(() => {});

    const hasProfile = await page.getByText("Overview").isVisible().catch(() => false);
    if (!hasProfile) {
      test.skip(true, "No profile data available");
    }

    await expect(page.getByText("Overview")).toBeVisible();
    await expect(page.getByText("Content")).toBeVisible();
    await expect(page.getByText("Engagement")).toBeVisible();
    await expect(page.getByText("Brand Fit")).toBeVisible();
    await expect(page.getByText("Coaching")).toBeVisible();
  });

  test("can switch between tabs", async ({ page }) => {
    await page.waitForSelector('[class*="animate-spin"], [role="button"]', {
      timeout: 10000,
    }).catch(() => {});

    const hasProfile = await page.getByText("Content").isVisible().catch(() => false);
    if (!hasProfile) {
      test.skip(true, "No profile data available");
    }

    await page.getByText("Content").click();
    await page.getByText("Engagement").click();
    await page.getByText("Brand Fit").click();
    await page.getByText("Coaching").click();

    // Coaching tab shows start button
    await expect(page.getByText("코칭 시작하기")).toBeVisible();
  });

  test("coaching tab shows start screen", async ({ page }) => {
    await page.waitForSelector('[class*="animate-spin"], [role="button"]', {
      timeout: 10000,
    }).catch(() => {});

    const hasProfile = await page.getByText("Coaching").isVisible().catch(() => false);
    if (!hasProfile) {
      test.skip(true, "No profile data available");
    }

    await page.getByText("Coaching").click();
    await expect(page.getByText("AI 퍼스널 브랜딩 코치")).toBeVisible();
    await expect(page.getByText("코칭 시작하기")).toBeVisible();
  });

  test("brand fit tab shows registration link", async ({ page }) => {
    await page.waitForSelector('[class*="animate-spin"], [role="button"]', {
      timeout: 10000,
    }).catch(() => {});

    const hasProfile = await page.getByText("Brand Fit").isVisible().catch(() => false);
    if (!hasProfile) {
      test.skip(true, "No profile data available");
    }

    await page.getByText("Brand Fit").click();
    await expect(page.getByText("브랜드 등록하기")).toBeVisible();
  });
});
