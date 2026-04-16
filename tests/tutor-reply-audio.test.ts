import { describe, expect, it } from "vitest";
import { canPlayTutorReply, getTutorReplyAudioSupport } from "@/lib/runtime/tutor-reply-audio";

describe("tutor-reply-audio", () => {
  it("detects browser speech synthesis support", () => {
    expect(getTutorReplyAudioSupport({ speechSynthesis: {} })).toEqual({
      supported: true,
      message: "Tutor replies can be played aloud in this browser.",
    });
  });

  it("returns a fallback message when speech synthesis is unavailable", () => {
    expect(getTutorReplyAudioSupport({})).toEqual({
      supported: false,
      message: "Tutor reply audio is not available in this browser yet.",
    });
  });

  it("only allows playback for assistant replies with content", () => {
    expect(canPlayTutorReply("assistant", "Helpful explanation")).toBe(true);
    expect(canPlayTutorReply("assistant", "   ")).toBe(false);
    expect(canPlayTutorReply("user", "Question")).toBe(false);
  });
});
