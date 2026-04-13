import { expect, test } from "@playwright/test";

test("settings page saves, tests, and loads models", async ({ page }) => {
  await page.route("**/api/settings/model", async (route) => {
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: body,
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route("**/api/settings/model/test", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          provider: "ollama",
          serverReachable: true,
          modelAvailable: true,
          message: "Connection successful",
        },
      }),
    });
  });

  await page.route("**/api/settings/model/models?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          models: [
            {
              id: "llama3:latest",
              label: "llama3:latest",
            },
          ],
        },
      }),
    });
  });

  await page.goto("/settings");

  await expect(
    page.getByRole("heading", { name: /connect lessonflow to your local ollama runtime/i }),
  ).toBeVisible();

  await page.getByLabel(/model/i).fill("llama3:latest");
  await page.getByRole("button", { name: /save settings/i }).click();
  await expect(page.getByText(/settings saved/i)).toBeVisible();

  await page.getByRole("button", { name: /test connection/i }).click();
  await expect(page.locator(".status-title").getByText(/connection successful/i)).toBeVisible();

  await page.getByRole("button", { name: /load models/i }).click();
  await expect(page.locator(".status-title").getByText(/model list refreshed/i)).toBeVisible();
  await expect(page.locator(".status-copy").getByText(/found 1 local model/i)).toBeVisible();
});
