import { expect, test } from "@playwright/test";
import { resetE2EDatabase, seedLessonWithScenes, seedOutlineReviewLesson } from "./helpers/e2e-db";

test.beforeEach(() => {
  resetE2EDatabase();
});

test("outline review can continue into the lesson experience", async ({ page }) => {
  const lessonId = "e2e-lesson-page";
  const confirmJobId = "e2e-lesson-page-job";

  seedOutlineReviewLesson({
    lessonId,
    jobId: "e2e-outline-seed-job",
  });
  seedLessonWithScenes({ lessonId });

  await page.route(`**/api/lessons/${lessonId}/outline/confirm`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          lessonId,
          jobId: confirmJobId,
        },
      }),
    });
  });

  await page.route(`**/api/jobs/${confirmJobId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: confirmJobId,
          lessonId,
          status: "ready",
          stage: "ready",
          progress: 100,
          message: "All lesson scenes are ready",
        },
      }),
    });
  });

  await page.goto(`/lessons/${lessonId}/outline`);
  await expect(page.locator(".eyebrow").getByText(/outline review/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /continue to scene generation/i })).toBeVisible();

  await page.getByRole("button", { name: /continue to scene generation/i }).click();

  await expect(page).toHaveURL(new RegExp(`/lessons/${lessonId}(\\?scene=1)?$`));
  await expect(page.getByRole("heading", { name: /e2e lesson experience/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /current scene/i })).toBeVisible();
  await expect(page.getByText(/recursion solves a problem by reducing it into smaller versions of itself/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /regenerate scene/i })).toBeVisible();
});
