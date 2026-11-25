import { test, expect } from "@playwright/test";

test.describe("Halisi Gifts E-Commerce Flows", () => {
  test("loads homepage per S1.html design structure", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Timeless Elegance");
    await expect(page.locator("text=Shop By Category")).toBeVisible();
    await expect(page.locator("text=New Arrivals")).toBeVisible();
    await expect(page.locator("text=Hot Deals")).toBeVisible();
    await expect(page.locator("text=Featured Products")).toBeVisible();
    await expect(page.locator("text=Crafting Moments")).toBeVisible();
  });

  test("navigates to Category page and filters products", async ({ page }) => {
    await page.goto("/category/analogue-watches");
    await expect(page.locator("h1")).toContainText("ANALOGUE WATCHES");
    await expect(page.locator("text=Sort By:")).toBeVisible();
  });

  test("search functionality returns relevant items", async ({ page }) => {
    await page.goto("/search?q=Oceanic");
    await expect(page.locator("h1")).toContainText("Search Results");
  });
});
