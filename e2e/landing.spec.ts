import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("shows hero with VibeScore messaging", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("결을 본다");
    // Feature cards contain VibeScore and Brand Matching
    await expect(page.getByText("VibeScore").first()).toBeVisible();
    await expect(page.getByText("Brand Matching")).toBeVisible();
    await expect(page.getByText("Vibe Search")).toBeVisible();
  });

  test("shows demo profile card", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("@studio_muse")).toBeVisible();
    await expect(page.getByText("Demo Analysis Result")).toBeVisible();
  });

  test("CTA links to login", async ({ page }) => {
    await page.goto("/");
    const ctaButton = page.getByRole("link", { name: "시작하기", exact: true });
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute("href", "/login");
  });

  test("shows moodboard preview section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Representative Moodboard")).toBeVisible();
  });
});
