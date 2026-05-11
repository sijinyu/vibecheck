import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth required — redirected to login");
    }
  });

  test("renders dashboard header", async ({ page }) => {
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("shows history and saved tabs", async ({ page }) => {
    await expect(page.getByText("히스토리")).toBeVisible();
    await expect(page.getByText("저장됨")).toBeVisible();
  });

  test("can switch between tabs", async ({ page }) => {
    const savedTab = page.getByRole("button", { name: /저장됨/ });
    await savedTab.click();
    await expect(savedTab).toBeVisible();
  });
});
