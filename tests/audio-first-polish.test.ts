import { describe, expect, it } from "vitest";
import { getAudioFirstStatus } from "@/lib/runtime/audio-first-polish";

describe("audio-first-polish", () => {
  it("describes the default listening state when no resume target exists", () => {
    expect(
      getAudioFirstStatus({
        activeSceneOrder: 2,
        totalScenes: 5,
        queueLength: 3,
        resumeTarget: null,
      }),
    ).toEqual({
      badgeLabel: "Listening mode",
      title: "Audio flow is ready",
      summary: "You are on scene 2 of 5, with the listening controls centered on this step.",
      queueLabel: "3 narratable scenes remain in the queue from here.",
      handoffLabel:
        "Opening the tutor pauses lesson playback first, so you can ask or listen back without stacked audio.",
      resumeLabel:
        "If you pause for the tutor, a manual resume action will stay here so listening never restarts unexpectedly.",
    });
  });

  it("surfaces playlist resume guidance when the lesson queue was interrupted", () => {
    expect(
      getAudioFirstStatus({
        activeSceneOrder: 3,
        totalScenes: 5,
        queueLength: 2,
        resumeTarget: {
          lessonId: "lesson-1",
          source: "playlist",
          sceneId: "scene-3",
          sceneOrder: 3,
          title: "Momentum",
          playlistIndex: 2,
        },
      }),
    ).toEqual({
      badgeLabel: "Resume ready",
      title: "Pick up your lesson playlist",
      summary: "Your listening flow paused near scene 3: Momentum.",
      queueLabel: "2 narratable scenes remain in the queue from here.",
      handoffLabel:
        "Tutor questions and reply playback pause the lesson cleanly, so voices never overlap while you think.",
      resumeLabel: "Use the resume card below to continue the playlist from scene 3 when you're ready.",
    });
  });

  it("surfaces scene-level resume guidance when a single scene narration was interrupted", () => {
    expect(
      getAudioFirstStatus({
        activeSceneOrder: 4,
        totalScenes: 4,
        queueLength: 1,
        resumeTarget: {
          lessonId: "lesson-1",
          source: "scene",
          sceneId: "scene-4",
          sceneOrder: 4,
          title: "Reflection",
        },
      }),
    ).toEqual({
      badgeLabel: "Resume ready",
      title: "Return to this scene quickly",
      summary: "Your scene narration paused at scene 4: Reflection.",
      queueLabel: "This is the last narratable stop in the queue.",
      handoffLabel:
        "Tutor interactions keep lesson audio paused until you explicitly resume, which makes the handoff predictable.",
      resumeLabel: "Use the resume card below to replay scene 4 without losing your place in audio mode.",
    });
  });
});
