import { expect, test } from "@playwright/test";
import { resetE2EDatabase, seedOutlineReviewLesson } from "./helpers/e2e-db";

test.beforeEach(() => {
  resetE2EDatabase();
});

test("lesson request flow reaches outline review", async ({ page }) => {
  const lessonId = "e2e-outline-lesson";
  const jobId = "e2e-outline-job";

  seedOutlineReviewLesson({ lessonId, jobId });

  await page.route("**/api/lessons", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          lessonId,
          jobId,
        },
      }),
    });
  });

  await page.route(`**/api/jobs/${jobId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: jobId,
          lessonId,
          status: "awaiting_review",
          stage: "generating_outline",
          progress: 100,
          message: "Outline ready for review",
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel(/learning request/i).fill("Teach me recursion with one quick quiz.");
  await page.getByRole("button", { name: /generate lesson outline/i }).click();

  await expect(page).toHaveURL(new RegExp(`/lessons/${lessonId}/outline$`));
  await expect(page.locator(".eyebrow").getByText(/outline review/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /e2e outline review lesson/i })).toBeVisible();
  await expect(page.getByText(/plan snapshot/i)).toBeVisible();
  await expect(page.locator('input[value="What recursion means"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /continue to scene generation/i })).toBeVisible();
});
