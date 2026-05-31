import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/login", "/features", "/pricing"];

const APP_ROUTES = ["/dashboard", "/events", "/run", "/tasks", "/settings"];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow, "page should not scroll horizontally").toBe(false);
}

test.describe("mobile smoke", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`public ${route} loads without horizontal overflow`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page);
      await expect(page.locator("body")).toBeVisible();
    });
  }

  test("login form fields are touch-sized", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    const email = page.getByPlaceholder(/enter your email/i);
    await expect(email).toBeVisible({ timeout: 20_000 });
    const height = await email.evaluate((el) => {
      const shell = el.closest(".h-11");
      return shell?.getBoundingClientRect().height ?? el.getBoundingClientRect().height;
    });
    expect(height).toBeGreaterThanOrEqual(44);
    await assertNoHorizontalOverflow(page);
  });
});

test.describe("mobile app shell (unauthenticated redirect)", () => {
  for (const route of APP_ROUTES) {
    test(`${route} redirects or loads without overflow`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page);
      // Unauthenticated users land on login
      await expect(page).toHaveURL(/\/(login|dashboard|events|run|tasks|settings)/);
    });
  }
});

test.describe("mobile marketing nav", () => {
  test("hamburger opens on home", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const menu = page.getByRole("button", { name: /open menu/i });
    if (await menu.isVisible()) {
      await menu.click();
      await expect(page.getByRole("link", { name: /log in/i }).first()).toBeVisible();
    }
    await assertNoHorizontalOverflow(page);
  });
});
