import { test, expect } from "@playwright/test";

test.describe("Compare Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/compare");
    if (page.url().includes("/login")) {
      test.skip(true, "Auth required — redirected to login");
    }
  });

  test("renders with 2 handle inputs", async ({ page }) => {
    await expect(page.getByText("Compare")).toBeVisible();
    const inputs = page.getByPlaceholder(/인플루언서/);
    await expect(inputs).toHaveCount(2);
  });

  test("can add and remove third slot", async ({ page }) => {
    await page.getByRole("button", { name: "3명 비교" }).click();
    await expect(page.getByPlaceholder(/인플루언서/)).toHaveCount(3);

    const removeButtons = page.locator("button:has(svg.lucide-x)");
    await removeButtons.first().click();
    await expect(page.getByPlaceholder(/인플루언서/)).toHaveCount(2);
  });

  test("submit disabled/enabled based on input", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: "비교하기" });
    await expect(submitBtn).toBeDisabled();

    await page.getByPlaceholder("인플루언서 1 핸들").fill("user1");
    await expect(submitBtn).toBeDisabled();

    await page.getByPlaceholder("인플루언서 2 핸들").fill("user2");
    await expect(submitBtn).toBeEnabled();
  });

  test("has platform toggle", async ({ page }) => {
    await expect(page.getByText("Instagram")).toBeVisible();
    await expect(page.getByText("TikTok")).toBeVisible();
  });
});
