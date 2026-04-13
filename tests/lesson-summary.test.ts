import { describe, expect, it } from "vitest";
import { buildLessonSummary, buildOutlineReviewPreview } from "@/lib/server/lessons/lesson-summary";
import type { Lesson } from "@/types/lesson";

const lesson: Lesson = {
  id: "lesson-1",
  title: "Thermodynamics Basics",
  prompt: "Teach me thermodynamics",
  sourceType: "prompt",
  language: "en",
  status: "ready",
  outline: [
    { id: "o1", title: "Core concepts", goal: "Understand energy transfer", sceneType: "lesson", order: 1 },
    { id: "o2", title: "Quick check", goal: "Test understanding", sceneType: "quiz", order: 2 },
  ],
  scenes: [
    {
      id: "s1",
      lessonId: "lesson-1",
      outlineItemId: "o1",
      type: "lesson",
      title: "Core concepts",
      order: 1,
      status: "ready",
      content: {
        summary: "Thermodynamics explains energy, heat, and work.",
        sections: [
          { heading: "Energy", body: "Energy changes form." },
          { heading: "Transfer", body: "Heat and work transfer energy." },
        ],
        keyTakeaways: ["Energy is conserved", "Heat and work transfer energy"],
      },
    },
    {
      id: "s2",
      lessonId: "lesson-1",
      outlineItemId: "o2",
      type: "quiz",
      title: "Quick check",
      order: 2,
      status: "ready",
      content: {
        questions: [
          {
            id: "q1",
            prompt: "What does thermodynamics study?",
            type: "multiple_choice",
            options: ["Energy transfer", "Only gravity", "Only light", "Only atoms"],
            correctIndex: 0,
            explanation: "It studies heat, work, and energy transfer.",
          },
        ],
      },
    },
  ],
  createdAt: 1,
  updatedAt: 1,
};

describe("lesson-summary", () => {
  it("builds a readable lesson summary", () => {
    const summary = buildLessonSummary(lesson);

    expect(summary).toContain("# Thermodynamics Basics");
    expect(summary).toContain("## Outline");
    expect(summary).toContain("Energy is conserved");
    expect(summary).toContain("Quiz 1: What does thermodynamics study?");
  });

  it("builds an outline review preview summary", () => {
    const preview = buildOutlineReviewPreview({
      lessonTitle: "Thermodynamics Basics",
      items: [
        { title: "Core concepts", goal: "Understand energy transfer", sceneType: "lesson" },
        { title: "Applied examples", goal: "Connect the topic to real systems", sceneType: "lesson" },
        { title: "Quick check", goal: "Test understanding", sceneType: "quiz" },
      ],
    });

    expect(preview.summary).toContain("Thermodynamics Basics currently looks like");
    expect(preview.summary).toContain('It opens with a teaching section: "Core concepts".');
    expect(preview.highlights).toEqual([
      "Understand energy transfer",
      "Connect the topic to real systems",
      "Test understanding",
    ]);
    expect(preview.totals).toEqual({
      lessonScenes: 2,
      quizScenes: 1,
      totalItems: 3,
    });
  });
});
