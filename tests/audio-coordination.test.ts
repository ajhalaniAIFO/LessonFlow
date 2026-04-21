import { describe, expect, it } from "vitest";
import {
  isLessonAudioResumeTarget,
  isLessonAudioStopDetail,
  LESSON_AUDIO_STOP_EVENT,
  requestLessonAudioStop,
} from "@/lib/runtime/audio-coordination";

describe("audio-coordination", () => {
  it("dispatches a stop event with the provided detail", () => {
    let captured: Event | null = null;
    const target = new EventTarget();

    target.addEventListener(LESSON_AUDIO_STOP_EVENT, (event) => {
      captured = event;
    });

    requestLessonAudioStop(
      {
        dispatchEvent: target.dispatchEvent.bind(target),
        CustomEvent,
      },
      {
        source: "tutor-input",
        reason: "open-tutor",
      },
    );

    expect(captured).toBeInstanceOf(CustomEvent);
    expect((captured as CustomEvent).detail).toEqual({
      source: "tutor-input",
      reason: "open-tutor",
    });
  });

  it("validates stop and resume payload shapes", () => {
    expect(isLessonAudioStopDetail({ source: "playlist", reason: "start-playback" })).toBe(true);
    expect(
      isLessonAudioResumeTarget({
        lessonId: "lesson-1",
        source: "scene",
        sceneId: "scene-1",
        sceneOrder: 2,
        title: "Momentum",
      }),
    ).toBe(true);

    expect(isLessonAudioStopDetail({ source: "unknown", reason: "start-playback" })).toBe(false);
    expect(isLessonAudioStopDetail(null)).toBe(false);
    expect(isLessonAudioResumeTarget({ source: "scene" })).toBe(false);
  });
});
