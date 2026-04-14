import { describe, expect, it } from "vitest";
import { getFormatAwareCopy } from "@/lib/server/lessons/format-aware-ui";
import type { Scene } from "@/types/scene";

function makeScene(type: Scene["type"]): Scene {
  return {
    id: "scene-1",
    lessonId: "lesson-1",
    outlineItemId: "outline-1",
    type,
    title: type === "lesson" ? "Core practice" : "Checkpoint",
    order: 1,
    status: "ready",
  };
}

describe("format-aware-ui", () => {
  it("returns workshop-specific labels", () => {
    const workshop = getFormatAwareCopy("workshop");

    expect(workshop.heroEyebrow).toBe("Workshop Ready");
    expect(workshop.pathTitle).toBe("Workshop path");
    expect(workshop.sceneLabel(makeScene("lesson"))).toBe("Practice segment");
  });

  it("returns guided-project specific focus guidance", () => {
    const guidedProject = getFormatAwareCopy("guided_project");
    const focusCard = guidedProject.focusCard(makeScene("lesson"));

    expect(guidedProject.stageTitle).toBe("Current build step");
    expect(focusCard.title).toBe("Project step");
    expect(focusCard.copy).toContain("build step");
  });
});
