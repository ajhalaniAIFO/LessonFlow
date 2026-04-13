import { describe, expect, it } from "vitest";
import {
  buildLessonExport,
  buildLessonSummary,
  buildOutlineReviewPreview,
} from "@/lib/server/lessons/lesson-summary";
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

  it("builds html and json lesson exports", () => {
    const htmlExport = buildLessonExport(lesson, "html");
    const jsonExport = buildLessonExport(lesson, "json");

    expect(htmlExport.mimeType).toBe("text/html;charset=utf-8");
    expect(htmlExport.filename).toBe("thermodynamics-basics-lesson.html");
    expect(htmlExport.content).toContain("<!doctype html>");
    expect(htmlExport.content).toContain("LessonFlow Export");
    expect(htmlExport.content).toContain("Thermodynamics explains energy, heat, and work.");

    expect(jsonExport.mimeType).toBe("application/json;charset=utf-8");
    expect(jsonExport.filename).toBe("thermodynamics-basics-lesson.json");
    expect(jsonExport.content).toContain('"title": "Thermodynamics Basics"');
    expect(jsonExport.content).toContain('"takeaways"');
  });
});
