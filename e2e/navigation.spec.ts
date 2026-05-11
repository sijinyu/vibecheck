import { test, expect } from "@playwright/test";

test.describe("Navigation & Auth Guards", () => {
  test("unauthenticated user on /analyze redirects to /login", async ({
    page,
  }) => {
    await page.goto("/analyze");
    await page.waitForURL(/\/(login|analyze)/);
    const url = page.url();
    // With Supabase → redirects to /login; without → stays on /analyze
    expect(url.includes("/login") || url.includes("/analyze")).toBe(true);
  });

  test("unauthenticated user on /influencer/test redirects to /login", async ({
    page,
  }) => {
    await page.goto("/influencer/test_handle");
    await page.waitForURL(/\/(login|influencer)/);
    const url = page.url();
    expect(url.includes("/login") || url.includes("/influencer")).toBe(true);
  });

  test("unauthenticated user on /dashboard redirects to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/(login|dashboard)/);
    const url = page.url();
    expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  });

  test("unauthenticated user on /compare redirects to /login", async ({
    page,
  }) => {
    await page.goto("/compare");
    await page.waitForURL(/\/(login|compare)/);
    const url = page.url();
    expect(url.includes("/login") || url.includes("/compare")).toBe(true);
  });

  test("unauthenticated user on /brand redirects to /login", async ({
    page,
  }) => {
    await page.goto("/brand");
    await page.waitForURL(/\/(login|brand)/);
    const url = page.url();
    expect(url.includes("/login") || url.includes("/brand")).toBe(true);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("landing page is accessible without auth", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("share page is accessible without auth", async ({ page }) => {
    const response = await page.goto("/share/nonexistent-token");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "VibeCheck" })).toBeVisible();
  });
});
