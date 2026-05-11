import { test, expect } from "@playwright/test";

test.describe("Brand Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/brand");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth required — redirected to login");
    }
  });

  test("renders brand setup form", async ({ page }) => {
    await expect(page.getByText("Brand Setup")).toBeVisible();
    await expect(page.getByPlaceholder(/브랜드 이름/)).toBeVisible();
  });

  test("shows tier preference toggles", async ({ page }) => {
    await expect(page.getByText("Nano", { exact: false })).toBeVisible();
    await expect(page.getByText("Micro", { exact: false })).toBeVisible();
  });

  test("shows category preference toggles", async ({ page }) => {
    await expect(page.getByText("Fashion")).toBeVisible();
    await expect(page.getByText("Beauty")).toBeVisible();
  });

  test("has handle-based and moodboard tabs", async ({ page }) => {
    await expect(page.getByText("핸들 분석")).toBeVisible();
    await expect(page.getByText("무드보드")).toBeVisible();
  });
});
