import { describe, expect, it } from "vitest";
import {
  describeLessonAudioResume,
  parseLessonAudioResume,
  serializeLessonAudioResume,
} from "@/lib/runtime/audio-resume";

describe("audio-resume", () => {
  it("parses valid resume payloads", () => {
    expect(
      parseLessonAudioResume({
        lessonId: "lesson-1",
        source: "playlist",
        sceneId: "scene-2",
        sceneOrder: 2,
        title: "Forces in motion",
        playlistIndex: 1,
      }),
    ).toEqual({
      lessonId: "lesson-1",
      source: "playlist",
      sceneId: "scene-2",
      sceneOrder: 2,
      title: "Forces in motion",
      playlistIndex: 1,
    });
  });

  it("rejects invalid resume payloads", () => {
    expect(parseLessonAudioResume({ lessonId: "lesson-1", source: "scene" })).toBeNull();
    expect(parseLessonAudioResume(null)).toBeNull();
  });

  it("describes playlist and scene resume actions clearly", () => {
    expect(
      describeLessonAudioResume({
        lessonId: "lesson-1",
        source: "playlist",
        sceneId: "scene-2",
        sceneOrder: 2,
        title: "Forces in motion",
        playlistIndex: 1,
      }),
    ).toEqual({
      title: "Resume lesson listening",
      copy: "Your lesson playlist paused around scene 2: Forces in motion.",
      actionLabel: "Resume playlist",
    });

    expect(
      describeLessonAudioResume({
        lessonId: "lesson-1",
        source: "scene",
        sceneId: "scene-3",
        sceneOrder: 3,
        title: "Momentum",
      }),
    ).toEqual({
      title: "Resume scene narration",
      copy: "Your scene narration paused at scene 3: Momentum.",
      actionLabel: "Resume scene",
    });
  });

  it("serializes resume payloads", () => {
    expect(
      serializeLessonAudioResume({
        lessonId: "lesson-1",
        source: "scene",
        sceneId: "scene-3",
        sceneOrder: 3,
        title: "Momentum",
      }),
    ).toBe(
      '{"lessonId":"lesson-1","source":"scene","sceneId":"scene-3","sceneOrder":3,"title":"Momentum"}',
    );
  });
});
