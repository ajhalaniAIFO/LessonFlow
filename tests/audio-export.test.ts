import { describe, expect, it } from "vitest";
import { buildLessonAudioExportPlan, generateLessonAudioExport } from "@/lib/server/lessons/audio-export";
import type { Lesson } from "@/types/lesson";

const lesson: Lesson = {
  id: "lesson-1",
  title: "Thermodynamics Basics",
  prompt: "Teach me thermodynamics",
  sourceType: "prompt",
  language: "en",
  generationMode: "balanced",
  learnerLevel: "beginner",
  teachingStyle: "step_by_step",
  lessonFormat: "standard",
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
        sections: [{ heading: "Energy", body: "Energy changes form." }],
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
            options: ["Energy transfer", "Only gravity"],
            correctIndex: 0,
            explanation: "It studies heat, work, and energy transfer.",
          },
        ],
      },
    },
  ],
  interactiveBlockProgress: [],
  createdAt: 1,
  updatedAt: 1,
};

describe("audio-export", () => {
  it("builds a current-scene audio export plan", () => {
    const plan = buildLessonAudioExportPlan(lesson, {
      scope: "scene",
      sceneId: "s1",
    });

    expect(plan.filename).toBe("thermodynamics-basics-scene-1-core-concepts.wav");
    expect(plan.text).toContain("Core concepts");
    expect(plan.text).toContain("Thermodynamics explains energy, heat, and work");
  });

  it("builds a full-lesson audio export plan", () => {
    const plan = buildLessonAudioExportPlan(lesson, {
      scope: "lesson",
    });

    expect(plan.filename).toBe("thermodynamics-basics-lesson-audio.wav");
    expect(plan.text).toContain("Scene 1. Core concepts");
    expect(plan.text).toContain("Scene 2. Quick check");
  });

  it("rejects non-windows audio export generation", async () => {
    await expect(
      generateLessonAudioExport(
        lesson,
        {
          scope: "lesson",
        },
        {
          platform: "linux",
        },
      ),
    ).rejects.toThrow("Downloadable generated audio is currently available on Windows local installs only.");
  });
});
