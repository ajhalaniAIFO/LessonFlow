import { describe, expect, it } from "vitest";
import { getSpeechRecognitionSupport } from "@/lib/runtime/speech-recognition";

describe("speech-recognition", () => {
  it("detects standard speech recognition support", () => {
    expect(getSpeechRecognitionSupport({ SpeechRecognition: function Mock() {} })).toEqual({
      supported: true,
      implementationName: "SpeechRecognition",
      message: "Voice input is available in this browser.",
    });
  });

  it("detects webkit speech recognition support", () => {
    expect(getSpeechRecognitionSupport({ webkitSpeechRecognition: function Mock() {} })).toEqual({
      supported: true,
      implementationName: "webkitSpeechRecognition",
      message: "Voice input is available in this browser.",
    });
  });

  it("returns a typing fallback when speech recognition is unavailable", () => {
    expect(getSpeechRecognitionSupport({})).toEqual({
      supported: false,
      message: "Voice input is not available in this browser yet. You can still type your question.",
    });
  });
});
