import { test, expect } from "@playwright/test";

// These tests run when the page is accessible (no auth or auth bypassed).
// If redirected to /login, tests are skipped gracefully.

test.describe("Analyze Page (Discover Hub)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analyze");
    // If redirected to login, skip the rest
    if (page.url().includes("/login")) {
      test.skip(true, "Auth required — redirected to login");
    }
  });

  test("renders search form with platform toggle", async ({ page }) => {
    await expect(page.getByPlaceholder(/핸들 입력/)).toBeVisible();
    await expect(page.getByText("Instagram")).toBeVisible();
    await expect(page.getByText("TikTok")).toBeVisible();
    await expect(page.getByRole("button", { name: "분석하기" })).toBeVisible();
  });

  test("platform toggle switches placeholder", async ({ page }) => {
    await page.getByText("TikTok").click();
    await expect(page.getByPlaceholder(/틱톡 핸들/)).toBeVisible();
    await page.getByText("Instagram").click();
    await expect(page.getByPlaceholder(/인스타그램 핸들/)).toBeVisible();
  });

  test("submit disabled when empty, enabled when filled", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: "분석하기" });
    await expect(submitBtn).toBeDisabled();
    await page.getByPlaceholder(/핸들 입력/).fill("test_user");
    await expect(submitBtn).toBeEnabled();
  });

  test("shows loading state on submit", async ({ page }) => {
    await page.getByPlaceholder(/핸들 입력/).fill("test_user");
    await page.getByRole("button", { name: "분석하기" }).click();
    await expect(page.getByText("분석 중")).toBeVisible();
  });
});
