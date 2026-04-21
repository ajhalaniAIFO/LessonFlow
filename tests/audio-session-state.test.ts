import { describe, expect, it } from "vitest";
import { getAudioSessionState } from "@/lib/runtime/audio-session-state";

describe("audio-session-state", () => {
  it("describes an idle session with no resume target", () => {
    expect(getAudioSessionState(null, null)).toEqual({
      badgeLabel: "Idle",
      title: "Audio session is quiet",
      summary: "Nothing currently owns the lesson voice loop.",
      ownerLabel: "No active audio owner",
      resumeLabel: "No lesson resume target is waiting right now.",
    });
  });

  it("describes playlist ownership with a waiting resume target", () => {
    expect(
      getAudioSessionState(
        {
          lessonId: "lesson-1",
          owner: "playlist",
          state: "playing",
          title: "Momentum",
          sceneOrder: 3,
        },
        {
          lessonId: "lesson-1",
          source: "playlist",
          sceneId: "scene-3",
          sceneOrder: 3,
          title: "Momentum",
          playlistIndex: 2,
        },
      ),
    ).toEqual({
      badgeLabel: "Queue playing",
      title: "Lesson queue is moving",
      summary: "The lesson playlist is currently narrating scene 3: Momentum.",
      ownerLabel: "Playlist: Momentum",
      resumeLabel: "Resume is ready for the lesson queue near scene 3.",
    });
  });

  it("describes tutor voice input ownership", () => {
    expect(
      getAudioSessionState(
        {
          lessonId: "lesson-1",
          owner: "tutor-input",
          state: "listening",
          title: "Forces in motion",
        },
        null,
      ),
    ).toEqual({
      badgeLabel: "Tutor listening",
      title: "Tutor voice input has the floor",
      summary: "Lesson playback is paused while voice input is open so you can ask a question without overlapping audio.",
      ownerLabel: "Tutor voice input",
      resumeLabel: "No lesson resume target is waiting right now.",
    });
  });
});
