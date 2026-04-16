import { describe, expect, it } from "vitest";
import {
  buildLessonModeHref,
  buildLessonSceneHref,
  resolveAudioFirstMode,
} from "@/lib/server/lessons/audio-first-mode";

describe("audio-first-mode", () => {
  it("detects audio mode from the query value", () => {
    expect(resolveAudioFirstMode("audio")).toBe(true);
    expect(resolveAudioFirstMode(undefined)).toBe(false);
    expect(resolveAudioFirstMode("read")).toBe(false);
  });

  it("preserves audio mode in scene navigation links", () => {
    expect(buildLessonSceneHref("lesson-1", 3, true)).toBe("/lessons/lesson-1?scene=3&mode=audio");
    expect(buildLessonSceneHref("lesson-1", 2, false)).toBe("/lessons/lesson-1?scene=2");
  });

  it("toggles between standard and audio-first links", () => {
    expect(buildLessonModeHref("lesson-1", 2, false)).toBe("/lessons/lesson-1?scene=2&mode=audio");
    expect(buildLessonModeHref("lesson-1", 2, true)).toBe("/lessons/lesson-1?scene=2");
  });
});
