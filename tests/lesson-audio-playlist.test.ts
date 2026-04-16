import { describe, expect, it } from "vitest";
import { buildLessonAudioPlaylist } from "@/lib/server/lessons/lesson-audio-playlist";
import type { Scene } from "@/types/scene";

describe("lesson-audio-playlist", () => {
  it("builds playlist entries for lesson and quiz scenes", () => {
    const scenes: Scene[] = [
      {
        id: "scene-1",
        lessonId: "lesson-1",
        outlineItemId: "outline-1",
        type: "lesson",
        title: "Intro",
        order: 1,
        status: "ready",
        content: {
          summary: "Welcome to the topic.",
          sections: [{ heading: "Start here", body: "This section opens the lesson." }],
        },
      },
      {
        id: "scene-2",
        lessonId: "lesson-1",
        outlineItemId: "outline-2",
        type: "quiz",
        title: "Check your understanding",
        order: 2,
        status: "ready",
        content: {
          questions: [
            {
              id: "q1",
              prompt: "What is the main idea?",
              type: "multiple_choice",
              options: ["Option A", "Option B"],
              correctIndex: 0,
              explanation: "Option A is correct.",
            },
          ],
        },
      },
    ];

    const playlist = buildLessonAudioPlaylist(scenes);

    expect(playlist).toHaveLength(2);
    expect(playlist[0]).toMatchObject({
      sceneId: "scene-1",
      sceneOrder: 1,
      type: "lesson",
    });
    expect(playlist[1]?.text).toContain("Question 1. What is the main idea?");
  });

  it("skips scenes without narratable content", () => {
    const scenes: Scene[] = [
      {
        id: "scene-1",
        lessonId: "lesson-1",
        outlineItemId: "outline-1",
        type: "lesson",
        title: "Pending scene",
        order: 1,
        status: "pending",
      },
    ];

    expect(buildLessonAudioPlaylist(scenes)).toEqual([]);
  });
});
