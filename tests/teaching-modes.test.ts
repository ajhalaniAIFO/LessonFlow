import { describe, expect, it } from "vitest";
import { getLessonFormatDefinition, listLessonFormats } from "@/lib/server/lessons/teaching-modes";

describe("teaching-modes", () => {
  it("lists the supported lesson formats", () => {
    expect(listLessonFormats().map((format) => format.id)).toEqual([
      "standard",
      "workshop",
      "guided_project",
    ]);
  });

  it("returns format guidance for guided projects", () => {
    const guidedProject = getLessonFormatDefinition("guided_project");

    expect(guidedProject.label).toBe("Guided project");
    expect(guidedProject.sceneGuidance).toContain("project");
    expect(guidedProject.chatGuidance).toContain("mentor");
  });
});
