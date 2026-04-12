import { describe, expect, it } from "vitest";
import { getSceneProgressLabel, resolveSceneIndex } from "@/lib/server/lessons/scene-navigation";
import type { Scene } from "@/types/scene";

const scenes: Scene[] = [
  {
    id: "scene-1",
    lessonId: "lesson-1",
    outlineItemId: "outline-1",
    type: "lesson",
    title: "First scene",
    order: 1,
    status: "ready",
    content: {
      summary: "Intro summary",
      sections: [
        { heading: "Intro", body: "Start here." },
        { heading: "More", body: "Keep learning." },
      ],
    },
  },
  {
    id: "scene-2",
    lessonId: "lesson-1",
    outlineItemId: "outline-2",
    type: "quiz",
    title: "Quiz scene",
    order: 2,
    status: "ready",
    content: {
      questions: [
        {
          id: "q1",
          prompt: "Question?",
          type: "multiple_choice",
          options: ["A", "B", "C", "D"],
          correctIndex: 0,
          explanation: "Because A is right.",
        },
      ],
    },
  },
];

describe("scene-navigation", () => {
  it("defaults to the first scene", () => {
    expect(resolveSceneIndex(undefined, scenes.length)).toBe(0);
  });

  it("clamps the scene index into range", () => {
    expect(resolveSceneIndex("0", scenes.length)).toBe(0);
    expect(resolveSceneIndex("2", scenes.length)).toBe(1);
    expect(resolveSceneIndex("99", scenes.length)).toBe(1);
  });

  it("falls back to the first scene for invalid query values", () => {
    expect(resolveSceneIndex("abc", scenes.length)).toBe(0);
  });

  it("builds a friendly progress label", () => {
    expect(getSceneProgressLabel(1, scenes)).toBe("Scene 2 of 2: Quiz scene");
  });
});
