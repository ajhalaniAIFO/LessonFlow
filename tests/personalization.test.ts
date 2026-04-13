import { describe, expect, it } from "vitest";
import {
  getLearnerLevelDefinition,
  getTeachingStyleDefinition,
  listLearnerLevels,
  listTeachingStyles,
} from "@/lib/server/lessons/personalization";

describe("personalization", () => {
  it("lists supported learner levels", () => {
    expect(listLearnerLevels().map((level) => level.id)).toEqual([
      "beginner",
      "intermediate",
      "advanced",
    ]);
  });

  it("lists supported teaching styles", () => {
    expect(listTeachingStyles().map((style) => style.id)).toEqual([
      "concise",
      "practical",
      "step_by_step",
    ]);
  });

  it("returns guidance for advanced learners and step-by-step teaching", () => {
    expect(getLearnerLevelDefinition("advanced").guidance).toContain("fundamentals");
    expect(getTeachingStyleDefinition("step_by_step").guidance).toContain("step-by-step");
  });
});
