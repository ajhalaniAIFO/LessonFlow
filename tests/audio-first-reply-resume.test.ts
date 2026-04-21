import { describe, expect, it } from "vitest";
import { getAudioFirstReplyResume } from "@/lib/runtime/audio-first-reply-resume";

describe("audio-first-reply-resume", () => {
  it("describes a playlist resume bridge after tutor playback", () => {
    expect(
      getAudioFirstReplyResume({
        lessonId: "lesson-1",
        source: "playlist",
        sceneId: "scene-3",
        sceneOrder: 3,
        title: "Momentum",
        playlistIndex: 2,
      }),
    ).toEqual({
      title: "Tutor reply finished. Return to the lesson queue.",
      summary:
        "Your tutor reply is done, and the lesson playlist is still waiting near scene 3: Momentum.",
      actionLabel: "Resume lesson queue",
      helperCopy:
        "This stays manual on purpose, so the lesson only starts speaking again when you explicitly continue.",
    });
  });

  it("describes a scene resume bridge after tutor playback", () => {
    expect(
      getAudioFirstReplyResume({
        lessonId: "lesson-1",
        source: "scene",
        sceneId: "scene-2",
        sceneOrder: 2,
        title: "Forces in motion",
      }),
    ).toEqual({
      title: "Tutor reply finished. Return to this scene.",
      summary:
        "Your tutor reply is done, and scene 2: Forces in motion is ready to continue.",
      actionLabel: "Resume this scene",
      helperCopy:
        "This stays manual on purpose, so the scene narration only restarts when you explicitly continue.",
    });
  });
});
