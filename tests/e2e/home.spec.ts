import { expect, test } from "@playwright/test";

test("home page shows the core lesson creation controls", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /private lesson generation starts with a stable local model setup/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /start the next milestone/i })).toBeVisible();
  await expect(page.getByLabel(/learning request/i)).toBeVisible();
  await expect(page.getByLabel(/optional document/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /generate lesson outline/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /what is working now/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /lesson library/i })).toBeVisible();
});
